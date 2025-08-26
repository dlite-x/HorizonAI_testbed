import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function testPDFExtraction() {
  try {
    console.log("Testing PDF extraction...");
    toast.info("Testing PDF extraction function...");

    const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
      body: { 
        documentName: 'Food compositions comprising methylococcus capsulatus protein isolate.pdf' 
      }
    });

    console.log("PDF extraction result:", { data, error });

    if (error) {
      toast.error(`PDF extraction failed: ${error.message}`);
      return false;
    }

    if (data && data.extractedText) {
      toast.success(`PDF extraction successful! Got ${data.textLength} characters`);
      console.log("First 500 characters:", data.extractedText.substring(0, 500));
      return true;
    } else {
      toast.error("PDF extraction returned no content");
      return false;
    }

  } catch (error) {
    console.error("PDF extraction test failed:", error);
    toast.error("PDF extraction test failed");
    return false;
  }
}