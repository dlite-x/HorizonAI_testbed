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
    
    const pdfArrayBuffer = await pdfResponse.arrayBuffer();
    console.log(`PDF fetched, size: ${pdfArrayBuffer.byteLength} bytes`);
    
    // Use PDF.js to extract text
    const extractedText = await extractTextWithPDFJS(pdfArrayBuffer);
    
    if (!extractedText || extractedText.length < 100) {
      throw new Error(`Extracted text too short: ${extractedText?.length || 0} characters`);
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from PDF`);
    
    return new Response(
      JSON.stringify({ 
        extractedText: extractedText,
        fileSize: pdfArrayBuffer.byteLength,
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

async function extractTextWithPDFJS(pdfArrayBuffer: ArrayBuffer): Promise<string> {
  try {
    // Import PDF.js
    const pdfjsLib = await import('https://cdn.skypack.dev/pdfjs-dist@3.11.174/build/pdf.min.js');
    
    // Load the PDF document
    const pdf = await pdfjsLib.getDocument({ data: pdfArrayBuffer }).promise;
    console.log(`PDF loaded with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Combine all text items from the page
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n';
      console.log(`Extracted ${pageText.length} characters from page ${pageNum}`);
    }
    
    // Clean up the text
    const cleanedText = fullText
      .replace(/\s+/g, ' ')  // Normalize whitespace
      .trim();
    
    console.log(`Total extracted text: ${cleanedText.length} characters`);
    return cleanedText;
    
  } catch (error) {
    console.error('PDF.js extraction failed:', error);
    throw new Error(`PDF.js extraction failed: ${error.message}`);
  }
}