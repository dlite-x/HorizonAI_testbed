import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function forceFullReload() {
  try {
    toast.info("Starting complete document reload with PDF text extraction...");

    // Step 1: Delete ALL existing documents and chunks
    console.log("Clearing all existing data...");
    
    await supabase.from('document_chunks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('documents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    toast.success("Cleared existing data");

    // Step 2: List of documents to process
    const documentList = [
      'Food compositions comprising methylococcus capsulatus protein isolate.pdf',
      'Global potential of sustainable single-cell protein based on variable renewable electricity.pdf',
      'Photovoltaic-driven microbial protein production can use land and sunlight more efficiently than conventional crops.pdf',
      'Single Cell Protein—State-of-the-Art, Industrial Landscape and Patents.pdf'
    ];

    // Step 3: Extract text and create documents
    for (const filename of documentList) {
      console.log(`Processing ${filename}...`);
      toast.info(`Extracting text from ${filename}...`);

      try {
        // Extract text using the edge function
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-pdf-text', {
          body: { documentName: filename }
        });

        if (extractError || !extractData?.extractedText) {
          console.error(`Failed to extract text from ${filename}:`, extractError);
          toast.error(`Failed to extract text from ${filename}`);
          continue;
        }

        const content = extractData.extractedText;
        console.log(`Extracted ${content.length} characters from ${filename}`);

        // Create document with extracted content
        const { data: doc, error: docError } = await supabase
          .from('documents')
          .insert({
            name: filename,
            size: content.length,
            type: 'application/pdf',
            content: content,
            status: 'uploaded',
            embedding_status: 'pending'
          })
          .select()
          .single();

        if (docError) {
          console.error(`Failed to create document ${filename}:`, docError);
          toast.error(`Failed to create document ${filename}`);
          continue;
        }

        toast.success(`Document created: ${filename} (${content.length} chars)`);

        // Start embedding immediately
        const { error: embedError } = await supabase.functions.invoke('embed-document', {
          body: {
            documentId: doc.id,
            content: content,
            chunkSize: 512,
            overlap: 50
          }
        });

        if (embedError) {
          console.error(`Failed to start embedding for ${filename}:`, embedError);
          toast.error(`Failed to start embedding: ${filename}`);
        } else {
          toast.success(`Started embedding: ${filename}`);
        }

        // Delay between documents
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
        toast.error(`Error processing ${filename}`);
      }
    }

    toast.success("Complete reload finished! Check chunk count in a few minutes.");
    return true;

  } catch (error) {
    console.error('Error in forceFullReload:', error);
    toast.error('Failed to complete full reload');
    return false;
  }
}