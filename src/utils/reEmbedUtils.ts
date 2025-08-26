import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function clearAndReEmbedAllDocuments(chunkSize: number = 512, overlap: number = 50) {
  try {
    toast.info("Starting full re-embedding process...");

    // Step 1: Get all documents
    const { data: documents, error: docError } = await supabase
      .from('documents')
      .select('id, name, content');

    if (docError) {
      console.error('Error fetching documents:', docError);
      toast.error('Failed to fetch documents');
      return false;
    }

    if (!documents || documents.length === 0) {
      toast.info('No documents found to re-embed');
      return true;
    }

    // Step 2: Clear all existing chunks
    const { error: deleteError } = await supabase
      .from('document_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all rows

    if (deleteError) {
      console.error('Error clearing chunks:', deleteError);
      toast.error('Failed to clear existing chunks');
      return false;
    }

    // Step 3: Reset all documents to pending status
    const { error: updateError } = await supabase
      .from('documents')
      .update({ 
        embedding_status: 'pending',
        chunk_count: 0 
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all rows

    if (updateError) {
      console.error('Error resetting document status:', updateError);
      toast.error('Failed to reset document status');
      return false;
    }

    toast.success(`Cleared existing chunks. Starting re-embedding of ${documents.length} documents...`);

    // Step 4: Trigger embedding for each document with new parameters
    for (const doc of documents) {
      if (!doc.content) {
        console.warn(`No content for document ${doc.name}`);
        continue;
      }

      console.log(`Re-embedding document: ${doc.name} with chunk size ${chunkSize}`);
      
      const { error: embedError } = await supabase.functions.invoke('embed-document', {
        body: {
          documentId: doc.id,
          content: doc.content,
          chunkSize,
          overlap
        }
      });

      if (embedError) {
        console.error(`Failed to start embedding for ${doc.name}:`, embedError);
        toast.error(`Failed to start embedding: ${doc.name}`);
      } else {
        toast.success(`Started re-embedding: ${doc.name}`);
      }

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success('Re-embedding process started for all documents!');
    return true;

  } catch (error) {
    console.error('Error in clearAndReEmbedAllDocuments:', error);
    toast.error('Failed to start re-embedding process');
    return false;
  }
}