import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { documentName } = await req.json();
    
    if (!documentName) {
      return new Response(
        JSON.stringify({ error: 'Document name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`PDF extraction requested for: ${documentName}`);
    
    const pdfUrl = `https://e3b6df49-d303-4767-b20d-62fadc5cdf39.sandbox.lovable.dev/documents/${documentName}`;
    const pdfResponse = await fetch(pdfUrl);
    
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status}`);
    }
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF fetched, size: ${pdfArrayBuffer.byteLength} bytes`);
    
    // Use pdf-parse equivalent for Deno
    const extractedText = await extractPDFText(pdfArrayBuffer);
    
    if (extractedText.length < 100) {
      throw new Error(`Insufficient text extracted: ${extractedText.length} characters`);
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters`);
    
    return new Response(
      JSON.stringify({ 
        extractedText,
        fileSize: pdfArrayBuffer.byteLength,
        textLength: extractedText.length
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('PDF extraction error:', error);
    return new Response(
      JSON.stringify({ error: `PDF extraction failed: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractPDFText(pdfBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import pdf-parse for Deno
    const { default: pdf } = await import('https://esm.sh/pdf-parse@1.1.1');
    
    // Extract text using pdf-parse (equivalent to PyMuPDF)
    const data = await pdf(pdfBuffer);
    
    console.log(`PDF parsed: ${data.numpages} pages, ${data.text.length} characters`);
    
    return data.text;
    
  } catch (error) {
    console.error('PDF parsing failed:', error);
    throw new Error(`PDF parsing error: ${error.message}`);
  }
}