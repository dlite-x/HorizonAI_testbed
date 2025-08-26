import { supabase } from "@/integrations/supabase/client";
import { FileData } from "@/components/FileExplorer";

export async function loadDocumentsFromPublic(): Promise<FileData[]> {
  const documentList = [
    'Food compositions comprising methylococcus capsulatus protein isolate.pdf',
    'Global potential of sustainable single-cell protein based on variable renewable electricity.pdf',
    'Photovoltaic-driven microbial protein production can use land and sunlight more efficiently than conventional crops.pdf',
    'Single Cell Protein—State-of-the-Art, Industrial Landscape and Patents.pdf'
  ];

  const loadedFiles: FileData[] = [];

  for (const filename of documentList) {
    try {
      // Check if document already exists in database
      const { data: existingDoc } = await supabase
        .from('documents')
        .select('id, name, size, type, created_at, updated_at, content')
        .eq('name', filename)
        .single();

      if (existingDoc) {
        // Document already exists, use it
        const fileData: FileData = {
          id: existingDoc.id,
          name: existingDoc.name,
          size: existingDoc.size,
          type: existingDoc.type,
          lastModified: new Date(existingDoc.updated_at),
          content: existingDoc.content || `Content from ${existingDoc.name}`
        };
        loadedFiles.push(fileData);
        continue;
      }

      // Extract text from the actual PDF using our edge function
      let content = '';
      
      try {
        console.log(`Extracting text from PDF: ${filename}`);
        const { data: extractData, error: extractError } = await supabase.functions.invoke('extract-pdf-text', {
          body: { documentName: filename }
        });

        if (extractError) {
          console.error(`PDF extraction error for ${filename}:`, extractError);
          throw new Error(`PDF extraction failed: ${extractError.message}`);
        } else if (extractData && extractData.extractedText) {
          content = extractData.extractedText;
          console.log(`Successfully extracted ${content.length} characters from ${filename}`);
        } else {
          throw new Error(`No text extracted from ${filename}`);
        }
      } catch (extractError) {
        console.error(`Failed to extract text from ${filename}:`, extractError);
        throw extractError;
      }

      // Insert document into database
      const { data: insertedDoc, error: insertError } = await supabase
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

      if (insertError) {
        console.error(`Error inserting ${filename}:`, insertError);
        continue;
      }

      const fileData: FileData = {
        id: insertedDoc.id,
        name: insertedDoc.name,
        size: insertedDoc.size,
        type: insertedDoc.type,
        lastModified: new Date(insertedDoc.created_at),
        content: content
      };

      loadedFiles.push(fileData);

      // Start embedding process for new documents
      try {
        await supabase.functions.invoke('embed-document', {
          body: {
            documentId: insertedDoc.id,
            content: content
          }
        });
        console.log(`Started embedding for ${filename}`);
      } catch (embedError) {
        console.error(`Error starting embedding for ${filename}:`, embedError);
      }

    } catch (error) {
      console.error(`Error processing ${filename}:`, error);
    }
  }

  return loadedFiles;
}