import React, { useState, useEffect } from "react";
import { FileData } from "@/components/FileExplorer";
import { ChatInterface } from "@/components/ChatInterface";
import { RAGParameters, RAGParams } from "@/components/RAGParameters";
import { EmbeddingParameters, EmbeddingParams } from "@/components/EmbeddingParameters";
import { FileManager } from "@/components/FileManager";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);
  const [isRagCollapsed, setIsRagCollapsed] = useState(false);
  const [ragParams, setRagParams] = useState<RAGParams>({
    temperature: 0.7,
    topK: 3,
    maxTokens: 1000,
    similarityThreshold: 0.8,
    enableReranking: true,
    contextWindow: 4
  });

  const [embeddingParams, setEmbeddingParams] = useState<EmbeddingParams>({
    chunkSize: 512,
    overlap: 50,
    dimensions: 1536,
    model: "text-embedding-ada-002"
  });

  useEffect(() => {
    // Load documents from the public/documents folder
    const loadDocuments = async () => {
      try {
        // Get list of files from the documents folder
        const documentList = [
          'Food compositions comprising methylococcus capsulatus protein isolate.pdf',
          'Global potential of sustainable single-cell protein based on variable renewable electricity.pdf',
          'Photovoltaic-driven microbial protein production can use land and sunlight more efficiently than conventional crops.pdf',
          'Single Cell Protein—State-of-the-Art, Industrial Landscape and Patents.pdf'
        ];

        const fileData: FileData[] = documentList.map((filename, index) => ({
          id: (index + 1).toString(),
          name: filename,
          size: Math.floor(Math.random() * 5000000) + 500000, // Random size for demo
          type: filename.endsWith('.pdf') ? 'application/pdf' : 'text/plain',
          lastModified: new Date(),
          content: `Content from ${filename}` // Placeholder content
        }));

        setFiles(fileData);
      } catch (error) {
        console.error('Error loading documents:', error);
        // Fallback to empty array if loading fails
        setFiles([]);
      }
    };

    loadDocuments();
  }, []);

  const handleFilesAdded = (newFiles: FileData[]) => {
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleReEmbed = () => {
    console.log('Re-embedding with new parameters:', embeddingParams);
    // In a real app, this would trigger re-embedding of all documents
  };

  return (
    <div className="h-screen flex bg-background">
      {/* Left Column - Chat Interface (expandable) */}
      <div className={`${isRagCollapsed ? 'flex-[0.7]' : 'flex-[0.4]'} flex flex-col min-w-0 bg-chat-bg transition-all duration-300`}>
        <ChatInterface
          selectedFile={selectedFile}
          files={files}
          ragParams={ragParams}
        />
      </div>

      {/* Separator */}
      <div className="w-1 bg-gradient-to-b from-primary/20 via-border to-primary/20 shadow-sm"></div>

      {/* Middle Column - RAG Parameters (collapsible) */}
      <div className={`${isRagCollapsed ? 'w-12' : 'flex-[0.3]'} border-x border-border bg-card flex-shrink-0 shadow-medium relative z-10 flex flex-col transition-all duration-300 overflow-hidden`}>
        <RAGParameters
          params={ragParams}
          onParamsChange={setRagParams}
          isCollapsed={isRagCollapsed}
          onToggleCollapse={() => setIsRagCollapsed(!isRagCollapsed)}
        />
      </div>

      {/* Separator */}
      <div className="w-1 bg-gradient-to-b from-primary/20 via-border to-primary/20 shadow-sm"></div>

      {/* Right Column - File Manager + Embedding Parameters (30%) */}
      <div className="flex-[0.3] border-l border-border bg-card flex-shrink-0 shadow-medium relative z-10 flex flex-col">
        <div className="flex-1">
          <FileManager
            files={files}
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onFilesAdded={handleFilesAdded}
          />
        </div>
        
        {/* Embedding Parameters */}
        <div className="border-t border-border p-4">
          <EmbeddingParameters
            params={embeddingParams}
            onParamsChange={setEmbeddingParams}
            onReEmbed={handleReEmbed}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
