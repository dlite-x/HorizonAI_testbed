-- Add DELETE policies to allow clearing all data
CREATE POLICY "Anyone can delete chunks" ON document_chunks FOR DELETE USING (true);
CREATE POLICY "Anyone can delete documents" ON documents FOR DELETE USING (true);