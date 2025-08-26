import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  File, 
  Download, 
  Eye, 
  Calendar,
  HardDrive,
  MessageSquare
} from "lucide-react";

export interface FileData {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  content?: string;
}

interface FileExplorerProps {
  files: FileData[];
  selectedFile: FileData | null;
  onFileSelect: (file: FileData) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.includes('text') || type.includes('document')) {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
};

export const FileExplorer = ({ files, selectedFile, onFileSelect }: FileExplorerProps) => {
  const [previewContent, setPreviewContent] = useState<string>("");

  const handleFileClick = (file: FileData) => {
    onFileSelect(file);
    
    // Simulate content preview (first few lines)
    const mockContent = `This is a preview of ${file.name}.\n\nContent from this document includes:\n- Important information about the topic\n- Key concepts and definitions\n- Detailed explanations and examples\n- References and citations\n\nThis document was last modified on ${file.lastModified.toLocaleDateString()}.`;
    
    setPreviewContent(mockContent);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-explorer-border bg-explorer-bg">
        <div className="flex items-center gap-2 mb-2">
          <HardDrive className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Document Library</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          {files.length} document{files.length !== 1 ? 's' : ''} available for chat
        </p>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full custom-scrollbar">
          <div className="p-4 space-y-2">
            {files.map((file) => (
              <Card
                key={file.id}
                className={`p-3 cursor-pointer transition-all duration-200 border-explorer-border hover:bg-explorer-hover hover:border-primary/50 ${
                  selectedFile?.id === file.id 
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/50' 
                    : 'bg-card'
                }`}
                onClick={() => handleFileClick(file)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-primary">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-sm text-foreground break-words leading-tight">
                        {file.name}
                      </h3>
                      <Badge variant="secondary" className="text-xs">
                        {file.type.split('/')[1]?.toUpperCase() || 'DOC'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {file.lastModified.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* File Preview */}
      {selectedFile && (
        <div className="border-t border-explorer-border bg-card">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-foreground">File Preview</h3>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" className="text-xs">
                  <Eye className="w-3 h-3 mr-1" />
                  View
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  <Download className="w-3 h-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>
            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-sm text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap">
                {previewContent || "Select a file to preview its content..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};