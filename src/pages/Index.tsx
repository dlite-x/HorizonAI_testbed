import { useState } from "react";
import { FileExplorer, FileData } from "@/components/FileExplorer";
import { ChatInterface } from "@/components/ChatInterface";
import { Separator } from "@/components/ui/separator";

// Mock data for demonstration
const mockFiles: FileData[] = [
  {
    id: "1",
    name: "AI Research Papers.pdf",
    size: 2457600,
    type: "application/pdf",
    lastModified: new Date("2024-01-15"),
    content: "Research findings on artificial intelligence..."
  },
  {
    id: "2", 
    name: "Machine Learning Guide.docx",
    size: 1843200,
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    lastModified: new Date("2024-01-10"),
    content: "Comprehensive guide to machine learning algorithms..."
  },
  {
    id: "3",
    name: "Data Science Handbook.txt",
    size: 512000,
    type: "text/plain", 
    lastModified: new Date("2024-01-08"),
    content: "Essential concepts in data science and analytics..."
  },
  {
    id: "4",
    name: "Neural Networks Overview.md",
    size: 328960,
    type: "text/markdown",
    lastModified: new Date("2024-01-05"),
    content: "Deep dive into neural network architectures..."
  },
  {
    id: "5",
    name: "Python Programming Best Practices.pdf", 
    size: 1920000,
    type: "application/pdf",
    lastModified: new Date("2024-01-03"),
    content: "Best practices for writing clean Python code..."
  }
];

const Index = () => {
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);

  return (
    <div className="h-screen flex bg-background">
      {/* File Explorer Panel */}
      <div className="w-[560px] border-r-2 border-border bg-explorer-bg flex-shrink-0 shadow-medium relative z-10">
        <FileExplorer
          files={mockFiles}
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
          files={mockFiles}
        />
      </div>
    </div>
  );
};

export default Index;
