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
    
    const pdfBytes = new Uint8Array(await pdfResponse.arrayBuffer());
    console.log(`PDF fetched, size: ${pdfBytes.length} bytes`);
    
    // Simple text extraction using basic string parsing
    const extractedText = extractTextFromPDFBytes(pdfBytes);
    
    if (extractedText.length < 100) {
      throw new Error(`No text extracted from PDF`);
    }
    
    console.log(`Extracted ${extractedText.length} characters`);
    
    return new Response(
      JSON.stringify({ 
        extractedText,
        fileSize: pdfBytes.length,
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

function extractTextFromPDFBytes(pdfBytes: Uint8Array): string {
  // Convert to string using latin1 to preserve byte values
  const pdfString = Array.from(pdfBytes, byte => String.fromCharCode(byte)).join('');
  
  const texts: string[] = [];
  
  // Extract text between parentheses in Tj operations
  const tjMatches = pdfString.match(/\([^)]*\)\s*Tj/g);
  if (tjMatches) {
    tjMatches.forEach(match => {
      const text = match.match(/\(([^)]*)\)/)?.[1];
      if (text && text.length > 0) {
        texts.push(text);
      }
    });
  }
  
  // Extract text from TJ array operations
  const tjArrayMatches = pdfString.match(/\[[^\]]*\]\s*TJ/g);
  if (tjArrayMatches) {
    tjArrayMatches.forEach(match => {
      const strings = match.match(/\(([^)]*)\)/g);
      if (strings) {
        strings.forEach(str => {
          const text = str.slice(1, -1); // Remove parentheses
          if (text && text.length > 0) {
            texts.push(text);
          }
        });
      }
    });
  }
  
  // Join all text and clean it up
  return texts
    .join(' ')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\\\/g, '\\')
    .replace(/\s+/g, ' ')
    .trim();
}