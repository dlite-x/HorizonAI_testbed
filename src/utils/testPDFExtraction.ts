import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export async function testPDFExtraction() {
  try {
    console.log("Testing PDF extraction...");
    toast.info("Testing PDF extraction function...");

    const { data, error } = await supabase.functions.invoke('extract-pdf-text', {
      body: { 
        documentName: 'test-document.pdf' 
      }
    });

    console.log("PDF extraction result:", { data, error });

    if (error) {
      toast.error(`PDF extraction test failed: ${error.message}`);
      return false;
    }

    if (data && data.error) {
      toast.warning(`PDF extraction test: ${data.message || data.error}`);
      return false;
    }

    toast.success("PDF extraction test completed");
    return true;

  } catch (error) {
    console.error("PDF extraction test failed:", error);
    toast.error("PDF extraction test failed");
    return false;
  }
}