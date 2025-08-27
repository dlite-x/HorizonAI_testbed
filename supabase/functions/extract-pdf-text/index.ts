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
    
    // Fetch the PDF file from the public documents folder
    const pdfUrl = `https://e3b6df49-d303-4767-b20d-62fadc5cdf39.sandbox.lovable.dev/documents/${documentName}`;
    console.log(`Fetching PDF from: ${pdfUrl}`);
    
    const pdfResponse = await fetch(pdfUrl);
    if (!pdfResponse.ok) {
      throw new Error(`Failed to fetch PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
    }
    
    const pdfBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF fetched, size: ${pdfBuffer.byteLength} bytes`);
    
    // Extract text from the PDF
    const extractedText = await extractTextFromPDF(new Uint8Array(pdfBuffer));
    
    if (!extractedText || extractedText.length < 50) {
      throw new Error('Failed to extract meaningful text from PDF');
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
    
    return new Response(
      JSON.stringify({ 
        extractedText: extractedText,
        fileSize: pdfBuffer.byteLength,
        textLength: extractedText.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('PDF extraction error:', error);
    return new Response(
      JSON.stringify({ error: `PDF extraction failed: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function extractTextFromPDF(pdfBytes: Uint8Array): Promise<string> {
  const pdfString = new TextDecoder('latin1').decode(pdfBytes);
  
  // Extract text from PDF streams and text objects
  const texts: string[] = [];
  
  // Method 1: Extract from Tj and TJ operations
  const tjRegex = /\((.*?)\)\s*Tj/g;
  let match;
  while ((match = tjRegex.exec(pdfString)) !== null) {
    texts.push(match[1]);
  }
  
  // Method 2: Extract from TJ arrays
  const tjArrayRegex = /\[(.*?)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(pdfString)) !== null) {
    const content = match[1];
    // Extract strings from the array
    const stringMatches = content.match(/\((.*?)\)/g);
    if (stringMatches) {
      stringMatches.forEach(str => {
        const cleaned = str.replace(/[()]/g, '');
        if (cleaned.trim()) texts.push(cleaned);
      });
    }
  }
  
  // Method 3: Extract from BT...ET blocks
  const btEtRegex = /BT\s+(.*?)\s+ET/gs;
  while ((match = btEtRegex.exec(pdfString)) !== null) {
    const block = match[1];
    const textMatches = block.match(/\((.*?)\)\s*Tj/g);
    if (textMatches) {
      textMatches.forEach(tm => {
        const content = tm.match(/\((.*?)\)/);
        if (content) texts.push(content[1]);
      });
    }
  }
  
  // Method 4: Look for uncompressed text streams
  const streamRegex = /stream\s*([\s\S]*?)\s*endstream/g;
  while ((match = streamRegex.exec(pdfString)) !== null) {
    const stream = match[1];
    // Look for readable text patterns
    const readableMatches = stream.match(/[A-Za-z][A-Za-z0-9\s.,;:!?\-()]{10,}/g);
    if (readableMatches) {
      texts.push(...readableMatches);
    }
  }
  
  // Clean and join all extracted text
  const extractedText = texts
    .map(text => text
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\\/g, '\\')
      .replace(/\\([()])/g, '$1')
    )
    .filter(text => text.trim().length > 0)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  
  console.log(`Extracted ${extractedText.length} characters from PDF`);
  return extractedText;
}