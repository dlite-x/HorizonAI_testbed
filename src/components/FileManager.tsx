import { useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  FolderOpen, 
  Upload, 
  FileText, 
  File,
  Plus,
  HardDrive,
  CheckCircle,
  Loader2,
  Database
} from "lucide-react";
import { FileData } from "@/components/FileExplorer";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FileManagerProps {
  files: FileData[];
  selectedFile: FileData | null;
  onFileSelect: (file: FileData) => void;
  onFilesAdded: (files: FileData[]) => void;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getFileIcon = (type: string) => {
  if (type.includes('text') || type.includes('document') || type.includes('pdf')) {
    return <FileText className="w-4 h-4" />;
  }
  return <File className="w-4 h-4" />;
};

export const FileManager = ({ files, selectedFile, onFileSelect, onFilesAdded }: FileManagerProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [embeddedFiles, setEmbeddedFiles] = useState<string[]>([]);
  const [embeddingFiles, setEmbeddingFiles] = useState<string[]>([]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    
    for (const file of droppedFiles) {
      try {
        // Read file content
        const text = await file.text();
        
        // Store document in database
        const { data: document, error: dbError } = await supabase
          .from('documents')
          .insert({
            name: file.name,
            size: file.size,
            type: file.type || 'application/octet-stream',
            content: text,
            status: 'uploaded',
            embedding_status: 'pending'
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database error:', dbError);
          toast.error(`Failed to upload ${file.name}`);
          continue;
        }

        // Create file data for UI
        const newFileData: FileData = {
          id: document.id,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          lastModified: new Date(file.lastModified),
          content: text
        };

        onFilesAdded([newFileData]);
        setUploadedFiles(prev => [...prev, document.id]);

        // Start embedding process
        setEmbeddingFiles(prev => [...prev, document.id]);
        
        const { error: embedError } = await supabase.functions.invoke('embed-document', {
          body: {
            documentId: document.id,
            content: text
          }
        });

        if (embedError) {
          console.error('Embedding error:', embedError);
          toast.error(`Failed to embed ${file.name}`);
          setEmbeddingFiles(prev => prev.filter(id => id !== document.id));
        } else {
          toast.success(`${file.name} uploaded and embedding started`);
          
          // Simulate embedding completion (in reality, you'd listen to status updates)
          setTimeout(() => {
            setEmbeddingFiles(prev => prev.filter(id => id !== document.id));
            setEmbeddedFiles(prev => [...prev, document.id]);
            setUploadedFiles(prev => prev.filter(id => id !== document.id));
            toast.success(`${file.name} embedded successfully`);
          }, 3000);
        }

      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  }, [onFilesAdded]);

  const handleEmbedFile = async (fileId: string) => {
    // Start embedding process
    setEmbeddingFiles(prev => [...prev, fileId]);
    
    // Simulate embedding process with delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Complete embedding
    setEmbeddingFiles(prev => prev.filter(id => id !== fileId));
    setEmbeddedFiles(prev => [...prev, fileId]);
    setUploadedFiles(prev => prev.filter(id => id !== fileId)); // Remove from "new" list
    
    console.log(`Successfully embedded file ${fileId}`);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with Drag & Drop */}
      <div className="p-3 border-b border-border bg-card">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">File Manager</h2>
          </div>
          
          {/* Compact Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg px-2.5 py-1.5 text-center transition-colors flex items-center gap-2 ${
              isDragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`w-3.5 h-3.5 ${isDragOver ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-xs font-medium text-foreground">
              {isDragOver ? 'Drop here' : 'Drop files'}
            </span>
            <Button size="sm" variant="outline" className="text-xs h-5 ml-1">
              Browse
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {files.length} document{files.length !== 1 ? 's' : ''} available
        </p>
      </div>

      {/* File List */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-3 space-y-1.5">
            {files.map((file) => (
              <Card
                key={file.id}
                className={`p-2.5 cursor-pointer transition-all duration-200 border-border hover:bg-muted/50 hover:border-primary/50 ${
                  selectedFile?.id === file.id 
                    ? 'bg-primary/10 border-primary ring-1 ring-primary/50' 
                    : 'bg-card'
                }`}
                onClick={() => onFileSelect(file)}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-primary">
                    {getFileIcon(file.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-medium text-xs text-foreground break-words leading-tight">
                        {file.name}
                      </h3>
                      {uploadedFiles.includes(file.id) && (
                        <Badge variant="outline" className="text-xs">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          New
                        </Badge>
                      )}
                      {embeddedFiles.includes(file.id) && (
                        <Badge variant="default" className="text-xs bg-green-500 hover:bg-green-600">
                          <Database className="w-3 h-3 mr-1" />
                          Embedded
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </span>
                      {uploadedFiles.includes(file.id) && !embeddedFiles.includes(file.id) && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-xs h-5"
                          disabled={embeddingFiles.includes(file.id)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEmbedFile(file.id);
                          }}
                        >
                          {embeddingFiles.includes(file.id) ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                              Embedding...
                            </>
                          ) : (
                            'Embed'
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};