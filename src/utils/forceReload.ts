import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function forceFullReload() {
  try {
    console.log("Starting force reload - clearing all data...");
    toast.info("Clearing all documents and chunks...");

    // Clear all existing documents and chunks
    const { error: chunksError } = await supabase
      .from('document_chunks')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (chunksError) {
      console.error("Error clearing chunks:", chunksError);
      toast.error("Failed to clear document chunks");
      return false;
    }

    const { error: docsError } = await supabase
      .from('documents')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    if (docsError) {
      console.error("Error clearing documents:", docsError);
      toast.error("Failed to clear documents");
      return false;
    }

    console.log("All documents and chunks cleared successfully");
    toast.success("All sample content removed. You can now upload real documents.");
    
    return true;

  } catch (error) {
    console.error("Force reload failed:", error);
    toast.error("Force reload failed");
    return false;
  }
}