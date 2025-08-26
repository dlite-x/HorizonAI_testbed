import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Settings } from "lucide-react";

export interface EmbeddingParams {
  chunkSize: number;
  overlap: number;
  dimensions: number;
  model: string;
}

interface EmbeddingParametersProps {
  params: EmbeddingParams;
  onParamsChange: (params: EmbeddingParams) => void;
  onReEmbed: () => void;
}

export const EmbeddingParameters = ({ params, onParamsChange, onReEmbed }: EmbeddingParametersProps) => {
  const updateParam = (key: keyof EmbeddingParams, value: number | string) => {
    onParamsChange({ ...params, [key]: value });
  };

  const resetToDefaults = () => {
    onParamsChange({
      chunkSize: 512,
      overlap: 50,
      dimensions: 1536,
      model: "text-embedding-ada-002"
    });
  };

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground">Embedding Parameters</h3>
        <Badge variant="outline" className="text-xs">Global</Badge>
      </div>

      <div className="space-y-4">
        {/* Chunk Size */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Chunk Size</label>
            <span className="text-xs text-muted-foreground">{params.chunkSize}</span>
          </div>
          <Slider
            value={[params.chunkSize]}
            onValueChange={([value]) => updateParam('chunkSize', value)}
            min={128}
            max={2048}
            step={128}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Size of text chunks for embedding
          </p>
        </div>

        {/* Overlap */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Overlap</label>
            <span className="text-xs text-muted-foreground">{params.overlap}</span>
          </div>
          <Slider
            value={[params.overlap]}
            onValueChange={([value]) => updateParam('overlap', value)}
            min={0}
            max={200}
            step={10}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Character overlap between chunks
          </p>
        </div>

        {/* Dimensions - Read only */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Dimensions</label>
            <Badge variant="secondary" className="text-xs">{params.dimensions}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Vector embedding dimensions (model-specific)
          </p>
        </div>

        {/* Model - Read only */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-foreground">Model</label>
            <Badge variant="secondary" className="text-xs font-mono">{params.model}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Embedding model for vector generation
          </p>
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            onClick={onReEmbed}
            size="sm" 
            className="flex-1"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Re-embed using new settings
          </Button>
          <Button 
            onClick={resetToDefaults}
            size="sm" 
            variant="outline"
          >
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
};