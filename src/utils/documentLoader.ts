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

      // Try to fetch the actual PDF file
      const response = await fetch(`/documents/${encodeURIComponent(filename)}`);
      
      if (!response.ok) {
        console.warn(`Could not fetch ${filename}:`, response.status);
        continue;
      }

      // For PDFs, we can't easily extract text content in the browser
      // So we'll use a placeholder content that describes the document
      const getDocumentContent = (filename: string): string => {
        const name = filename.toLowerCase();
        
        if (name.includes('food compositions') && name.includes('methylococcus')) {
          return `This document discusses food compositions and protein isolates derived from Methylococcus capsulatus. It covers regulatory aspects, nutritional profiles, protein content analysis, amino acid compositions, safety assessments for human consumption, and commercial applications of single-cell protein derived from methanotrophic bacteria. The research focuses on the Bath strain of M. capsulatus and its use in sustainable protein production.`;
        }
        
        if (name.includes('global potential') && name.includes('sustainable')) {
          return `This research analyzes the global potential of sustainable single-cell protein production based on variable renewable electricity. It examines scalability factors, environmental impact assessments, energy conversion efficiency, land use optimization, economic viability at scale, and projections for meeting global protein demand through renewable energy-powered microbial fermentation processes.`;
        }
        
        if (name.includes('photovoltaic') && name.includes('microbial protein')) {
          return `This study demonstrates how photovoltaic-driven microbial protein production can use land and sunlight more efficiently than conventional crops. It compares resource utilization efficiency, energy conversion rates, protein yield per hectare, environmental footprint analysis, and economic models for solar-powered bioprotein production systems versus traditional agriculture.`;
        }
        
        if (name.includes('single cell protein') && name.includes('state-of-the-art')) {
          return `This comprehensive review covers the state-of-the-art in single-cell protein production, including industrial landscape analysis, patent reviews, commercial applications, production methodologies, strain development, fermentation technologies, downstream processing, market analysis, regulatory frameworks, and future prospects for microbial protein in the food industry.`;
        }
        
        return `Research document covering various aspects of single-cell protein production, including methodology, applications, and industrial implementation.`;
      };

      const blob = await response.blob();
      const content = getDocumentContent(filename);

      // Insert document into database
      const { data: insertedDoc, error: insertError } = await supabase
        .from('documents')
        .insert({
          name: filename,
          size: blob.size,
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