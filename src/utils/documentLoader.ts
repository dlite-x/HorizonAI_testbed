import { supabase } from "@/integrations/supabase/client";
import { FileData } from "@/components/FileExplorer";

export async function loadDocumentsFromPublic(): Promise<FileData[]> {
  // Return empty array - documents will be uploaded via file manager
  console.log("Document auto-loading disabled. Use file manager to upload documents.");
  return [];

}