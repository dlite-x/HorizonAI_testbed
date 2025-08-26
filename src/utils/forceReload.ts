import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function forceFullReload() {
  try {
    console.log("Starting force reload - clearing all data...");
    toast.info("Clearing all documents and chunks...");

    // Clear all existing document chunks first (due to foreign key constraints)
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records by using a condition that matches everything
    
    if (chunksError) {
      console.error("Error clearing chunks:", chunksError);
      toast.error(`Failed to clear document chunks: ${chunksError.message}`);
      return false;
    }

    // Clear all existing documents
    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .gte('created_at', '1970-01-01'); // Delete all records by using a condition that matches everything
    
    if (docsError) {
      console.error("Error clearing documents:", docsError);
      toast.error(`Failed to clear documents: ${docsError.message}`);
      return false;
    }

    console.log("All documents and chunks cleared successfully");
    toast.success("All data cleared successfully. Ready for new document uploads.");
    
    // Trigger a page reload to reset all UI state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    
    return true;

  } catch (error) {
    console.error("Force reload failed:", error);
    toast.error("Force reload failed");
    return false;
  }
}