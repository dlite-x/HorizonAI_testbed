import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, topK = 5, documentIds } = await req.json();
    
    if (!query) {
      throw new Error('Query is required');
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Processing RAG query: "${query}"`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create embedding for the query
    const queryEmbeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    });

    if (!queryEmbeddingResponse.ok) {
      throw new Error(`OpenAI API error: ${queryEmbeddingResponse.statusText}`);
    }

    const queryEmbeddingData = await queryEmbeddingResponse.json();
    const queryEmbedding = queryEmbeddingData.data[0].embedding;

    // Get all document chunks with their embeddings
    let chunksQuery = supabase
      .from('document_chunks')
      .select(`
        *,
        documents (
          id,
          name,
          type
        )
      `);

    // Filter by document IDs if specified
    if (documentIds && documentIds.length > 0) {
      chunksQuery = chunksQuery.in('document_id', documentIds);
    }

    const { data: chunks, error } = await chunksQuery;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ 
        results: [],
        context: '',
        message: 'No document chunks found'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Found ${chunks.length} chunks to search`);

    // Calculate similarities and get top results
    const similarities = chunks.map(chunk => ({
      ...chunk,
      similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
    }));

    // Sort by similarity and take top K
    const topResults = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    console.log(`Top ${topResults.length} results found with similarities:`, 
      topResults.map(r => r.similarity));

    // Create context from top results
    const context = topResults
      .map(result => `[${result.documents.name}] ${result.content}`)
      .join('\n\n');

    // Generate response using OpenAI
    const chatResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions based on the provided context from documents. 
            Always cite your sources by mentioning the document names when possible.
            If the context doesn't contain relevant information, say so clearly.`
          },
          {
            role: 'user',
            content: `Context from documents:\n${context}\n\nQuestion: ${query}`
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!chatResponse.ok) {
      throw new Error(`OpenAI API error: ${chatResponse.statusText}`);
    }

    const chatData = await chatResponse.json();
    const answer = chatData.choices[0].message.content;

    // Format sources
    const sources = topResults.map(result => ({
      document: result.documents.name,
      type: result.documents.type,
      similarity: result.similarity,
      excerpt: result.content.substring(0, 200) + '...'
    }));

    return new Response(JSON.stringify({
      answer,
      sources,
      context: context.substring(0, 500) + '...',
      query
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in rag-query function:', error);
    
    return new Response(JSON.stringify({ 
      error: error.message,
      answer: 'Sorry, I encountered an error while processing your question.'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});