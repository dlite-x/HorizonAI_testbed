import { useState, useEffect } from "react";
import { FileExplorer, FileData } from "@/components/FileExplorer";
import { ChatInterface } from "@/components/ChatInterface";
import { Separator } from "@/components/ui/separator";

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  const [files, setFiles] = useState<FileData[]>([]);

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

  return (
    <div className="h-screen flex bg-background">
      {/* File Explorer Panel */}
      <div className="w-[560px] border-r-2 border-border bg-explorer-bg flex-shrink-0 shadow-medium relative z-10">
        <FileExplorer
          files={files}
          selectedFile={selectedFile}
          onFileSelect={setSelectedFile}
        />
      </div>

      {/* Vertical Separator with Enhanced Visual */}
      <div className="w-1 bg-gradient-to-b from-primary/20 via-border to-primary/20 shadow-sm"></div>

      {/* Chat Interface */}
      <div className="flex-1 flex flex-col min-w-0 bg-chat-bg">
        <ChatInterface
          selectedFile={selectedFile}
          files={files}
        />
      </div>
    </div>
  );
};

export default Index;
