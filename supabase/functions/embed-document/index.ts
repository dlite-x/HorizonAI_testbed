import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentId, content } = await req.json();
    
    if (!documentId || !content) {
      throw new Error('Document ID and content are required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Starting embedding process for document: ${documentId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Update document status to processing
    await supabase
      .from('documents')
      .update({ embedding_status: 'processing' })
      .eq('id', documentId);

    // Split content into chunks (simple approach for now)
    const chunkSize = 1000;
    const chunks = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    console.log(`Split document into ${chunks.length} chunks`);

    // Create embeddings for each chunk
    const embeddings = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: chunk,
        }),
      });

      if (!embeddingResponse.ok) {
        throw new Error(`OpenAI API error: ${embeddingResponse.statusText}`);
      }

      const embeddingData = await embeddingResponse.json();
      const embedding = embeddingData.data[0].embedding;
      
      embeddings.push({
        chunk_index: i,
        content: chunk,
        embedding: embedding,
        document_id: documentId
      });

      // Add small delay to respect rate limits
      if (i < chunks.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`Created ${embeddings.length} embeddings`);

    // Store embeddings in database (we'll create this table next)
    for (const embedding of embeddings) {
      await supabase
        .from('document_chunks')
        .insert({
          document_id: embedding.document_id,
          chunk_index: embedding.chunk_index,
          content: embedding.content,
          embedding: embedding.embedding
        });
    }

    // Update document status to completed
    await supabase
      .from('documents')
      .update({ 
        embedding_status: 'completed',
        chunk_count: chunks.length
      })
      .eq('id', documentId);

    console.log(`Successfully embedded document: ${documentId}`);

    return new Response(JSON.stringify({ 
      success: true, 
      chunks: chunks.length,
      message: 'Document embedded successfully' 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in embed-document function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});