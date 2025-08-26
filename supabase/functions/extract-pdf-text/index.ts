import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const { documentName } = await req.json();
    
    if (!documentName) {
      return new Response(
        JSON.stringify({ error: 'Document name is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`PDF extraction requested for: ${documentName}`);
    
    // Real PDF extraction would go here
    // For now, return an error indicating PDF extraction is not implemented
    return new Response(
      JSON.stringify({ 
        error: 'PDF extraction not implemented. Please upload documents through the file manager.',
        message: 'Use the file upload feature to add real documents to the system.'
      }),
      { 
        status: 501, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('PDF extraction error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});