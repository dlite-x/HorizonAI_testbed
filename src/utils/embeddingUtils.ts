import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function triggerEmbedding(documentId: string, content: string, chunkSize: number = 512, overlap: number = 50) {
  try {
    const { data, error } = await supabase.functions.invoke('embed-document', {
      body: {
        documentId,
        content,
        chunkSize,
        overlap
      }
    });

    if (error) {
      console.error('Embedding error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to trigger embedding:', error);
    return { success: false, error };
  }
}

export async function embedAllPendingDocuments(chunkSize: number = 512, overlap: number = 50) {
  try {
    // Get all pending documents
    const { data: pendingDocs, error } = await supabase
      .from('documents')
      .select('id, name, content')
      .eq('embedding_status', 'pending');

    if (error) {
      console.error('Error fetching pending documents:', error);
      return;
    }

    if (!pendingDocs || pendingDocs.length === 0) {
      console.log('No pending documents to embed');
      return;
    }

    toast.info(`Starting embedding for ${pendingDocs.length} documents...`);

    // Embed each document
    for (const doc of pendingDocs) {
      if (!doc.content) {
        console.warn(`No content for document ${doc.name}`);
        continue;
      }

      console.log(`Embedding document: ${doc.name}`);
      const result = await triggerEmbedding(doc.id, doc.content, chunkSize, overlap);
      
      if (result.success) {
        toast.success(`Started embedding: ${doc.name}`);
      } else {
        toast.error(`Failed to embed: ${doc.name}`);
      }

      // Add delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    toast.success('Embedding process started for all pending documents');
  } catch (error) {
    console.error('Error in embedAllPendingDocuments:', error);
    toast.error('Failed to start embedding process');
  }
}