import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  Database, 
  Zap, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  BarChart3
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PipelineStats {
  totalDocuments: number;
  totalCharacters: number;
  totalChunks: number;
  embeddedChunks: number;
  pendingDocuments: number;
  completedDocuments: number;
  avgChunkSize: number;
}

export const PipelineDiagnostics = () => {
  const [stats, setStats] = useState<PipelineStats>({
    totalDocuments: 0,
    totalCharacters: 0,
    totalChunks: 0,
    embeddedChunks: 0,
    pendingDocuments: 0,
    completedDocuments: 0,
    avgChunkSize: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchPipelineStats = async () => {
    setIsLoading(true);
    try {
      // Get document stats with actual content length
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, size, content, embedding_status');

      // Get chunk stats with content length for accurate calculations
      const { data: chunks, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id, content');

      if (docError || chunkError) {
        console.error('Error fetching pipeline stats:', docError || chunkError);
        return;
      }

      const totalDocuments = documents?.length || 0;
      // Use actual content length instead of file size
      const totalCharacters = documents?.reduce((sum, doc) => sum + (doc.content?.length || 0), 0) || 0;
      const totalChunks = chunks?.length || 0;
      const embeddedChunks = totalChunks; // All chunks in the table are embedded
      const pendingDocuments = documents?.filter(d => d.embedding_status === 'pending').length || 0;
      const completedDocuments = documents?.filter(d => d.embedding_status === 'completed').length || 0;
      
      // Calculate actual average chunk size from the chunks themselves
      const totalChunkCharacters = chunks?.reduce((sum, chunk) => sum + (chunk.content?.length || 0), 0) || 0;

      setStats({
        totalDocuments,
        totalCharacters,
        totalChunks,
        embeddedChunks,
        pendingDocuments,
        completedDocuments,
        avgChunkSize: totalChunks > 0 ? Math.round(totalChunkCharacters / totalChunks) : 0
      });

    } catch (error) {
      console.error('Error fetching pipeline stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineStats();
    
    // Refresh every 5 seconds
    const interval = setInterval(fetchPipelineStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const embeddingProgress = stats.totalDocuments > 0 
    ? (stats.completedDocuments / stats.totalDocuments) * 100 
    : 0;

  const chunkProgress = stats.totalChunks > 0 
    ? (stats.embeddedChunks / stats.totalChunks) * 100 
    : 0;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            RAG Pipeline Diagnostics
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchPipelineStats}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Document Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Documents
              </span>
              <Badge variant="outline" className="text-xs">
                {stats.totalDocuments}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Characters
              </span>
              <Badge variant="outline" className="text-xs">
                {stats.totalCharacters.toLocaleString()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Chunking Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1">
              <Database className="w-3 h-3 text-blue-500" />
              Chunks Created
            </span>
            <Badge variant="secondary" className="text-xs">
              {stats.totalChunks}
            </Badge>
          </div>
          {stats.totalChunks > 0 && (
            <div className="text-xs text-muted-foreground">
              Avg chunk size: {stats.avgChunkSize} chars
            </div>
          )}
        </div>

        {/* Embedding Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-500" />
              Embedding Progress
            </span>
            <Badge 
              variant={stats.pendingDocuments === 0 ? "default" : "secondary"} 
              className="text-xs"
            >
              {stats.completedDocuments}/{stats.totalDocuments}
            </Badge>
          </div>
          <Progress value={embeddingProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {embeddingProgress.toFixed(1)}% documents embedded
          </div>
        </div>

        {/* Chunk Embedding Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-500" />
              Chunks Embedded
            </span>
            <Badge 
              variant={stats.embeddedChunks === stats.totalChunks && stats.totalChunks > 0 ? "default" : "secondary"} 
              className="text-xs"
            >
              {stats.embeddedChunks}/{stats.totalChunks}
            </Badge>
          </div>
          <Progress value={chunkProgress} className="h-2" />
          <div className="text-xs text-muted-foreground">
            {chunkProgress.toFixed(1)}% chunks ready for queries
          </div>
        </div>

        {/* Status Indicators */}
        <div className="pt-2 border-t border-border/50 space-y-2">
          {stats.totalDocuments === 0 && (
            <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border flex items-center gap-2">
              <AlertCircle className="w-3 h-3" />
              No documents uploaded yet
            </div>
          )}
          
          {stats.totalDocuments > 0 && stats.totalChunks === 0 && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border flex items-center gap-2">
              <Database className="w-3 h-3" />
              Documents uploaded, chunking in progress...
            </div>
          )}
          
          {stats.pendingDocuments > 0 && (
            <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border flex items-center gap-2">
              <Zap className="w-3 h-3" />
              {stats.pendingDocuments} document(s) being embedded...
            </div>
          )}
          
          {stats.totalChunks > 0 && stats.pendingDocuments === 0 && (
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded border flex items-center gap-2">
              <CheckCircle className="w-3 h-3" />
              Pipeline complete - ready for queries
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};