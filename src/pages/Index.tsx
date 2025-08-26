import React, { useState, useEffect } from "react";
import { FileData } from "@/components/FileExplorer";
import { ChatInterface } from "@/components/ChatInterface";
import { RAGParameters, RAGParams } from "@/components/RAGParameters";
import { EmbeddingParameters, EmbeddingParams } from "@/components/EmbeddingParameters";
import { FileManager } from "@/components/FileManager";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
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
    // Load documents from the database
    const loadDocuments = async () => {
      try {
        const { data: documents, error } = await supabase
          .from('documents')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error loading documents:', error);
          setFiles([]);
          return;
        }

        if (documents && documents.length > 0) {
          const fileData: FileData[] = documents.map((doc) => ({
            id: doc.id,
            name: doc.name,
            size: doc.size,
            type: doc.type,
            lastModified: new Date(doc.updated_at),
            content: doc.content || `Content from ${doc.name}`
          }));

          setFiles(fileData);
        } else {
          // No documents found - just set empty array
          setFiles([]);
        }
      } catch (error) {
        console.error('Error loading documents:', error);
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
