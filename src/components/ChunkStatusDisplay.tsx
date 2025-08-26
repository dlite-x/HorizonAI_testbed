import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, FileText, Zap, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ChunkStats {
  totalDocuments: number;
  totalChunks: number;
  embeddedDocuments: number;
  pendingDocuments: number;
}

export const ChunkStatusDisplay = () => {
  const [stats, setStats] = useState<ChunkStats>({
    totalDocuments: 0,
    totalChunks: 0,
    embeddedDocuments: 0,
    pendingDocuments: 0
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // Get document counts
      const { data: documents, error: docError } = await supabase
        .from('documents')
        .select('id, embedding_status');

      // Get chunk count
      const { data: chunks, error: chunkError } = await supabase
        .from('document_chunks')
        .select('id');

      if (docError || chunkError) {
        console.error('Error fetching stats:', docError || chunkError);
        return;
      }

      const totalDocuments = documents?.length || 0;
      const totalChunks = chunks?.length || 0;
      const embeddedDocuments = documents?.filter(d => d.embedding_status === 'completed').length || 0;
      const pendingDocuments = documents?.filter(d => d.embedding_status === 'pending').length || 0;

      setStats({
        totalDocuments,
        totalChunks,
        embeddedDocuments,
        pendingDocuments
      });
    } catch (error) {
      console.error('Error fetching chunk stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            Chunk Status
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchStats}
            disabled={isLoading}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Documents:
            </span>
            <Badge variant="outline" className="text-xs">
              {stats.totalDocuments}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3" />
              Chunks:
            </span>
            <Badge variant="outline" className="text-xs">
              {stats.totalChunks}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Embedded:
            </span>
            <Badge 
              variant={stats.embeddedDocuments > 0 ? "default" : "secondary"} 
              className="text-xs"
            >
              {stats.embeddedDocuments}
            </Badge>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1">
              <RefreshCw className="w-3 h-3" />
              Pending:
            </span>
            <Badge 
              variant={stats.pendingDocuments > 0 ? "destructive" : "secondary"} 
              className="text-xs"
            >
              {stats.pendingDocuments}
            </Badge>
          </div>
        </div>

        {stats.totalChunks === 0 && stats.totalDocuments > 0 && (
          <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
            ⚠️ Documents found but no chunks. Embedding may be in progress.
          </div>
        )}

        {stats.pendingDocuments > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
            🔄 {stats.pendingDocuments} document(s) still being embedded...
          </div>
        )}

      </CardContent>
    </Card>
  );
};