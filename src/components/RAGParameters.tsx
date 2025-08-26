import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Zap,
  Target,
  Database,
  Brain,
  MessageSquare,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export interface RAGParams {
  temperature: number;
  topK: number;
  maxTokens: number;
  similarityThreshold: number;
  enableReranking: boolean;
  contextWindow: number;
}

interface RAGParametersProps {
  params: RAGParams;
  onParamsChange: (params: RAGParams) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const RAGParameters = ({ params, onParamsChange, isCollapsed = false, onToggleCollapse }: RAGParametersProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const updateParam = (key: keyof RAGParams, value: number | boolean) => {
    onParamsChange({
      ...params,
      [key]: value
    });
  };

  const resetToDefaults = () => {
    onParamsChange({
      temperature: 0.7,
      topK: 3,
      maxTokens: 1000,
      similarityThreshold: 0.8,
      enableReranking: true,
      contextWindow: 4
    });
  };

  // If collapsed, show only the toggle button
  if (isCollapsed) {
    return (
      <div className="h-full flex items-center justify-center border-r border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-2 h-auto"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with collapse button */}
      <div className="p-4 border-b border-border bg-card flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">RAG Parameters</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleCollapse}
          className="p-2 h-auto"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Zap className="w-3 h-3 text-orange-500" />
                Temperature
              </Label>
              <Badge variant="secondary" className="text-xs">
                {params.temperature}
              </Badge>
            </div>
            <Slider
              value={[params.temperature]}
              onValueChange={([value]) => updateParam('temperature', value)}
              max={2}
              min={0}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls response creativity (0 = focused, 2 = creative)
            </p>
          </div>

          {/* Top-K Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Database className="w-3 h-3 text-blue-500" />
                Top-K Documents
              </Label>
              <Badge variant="secondary" className="text-xs">
                {params.topK}
              </Badge>
            </div>
            <Slider
              value={[params.topK]}
              onValueChange={([value]) => updateParam('topK', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of documents to retrieve for context
            </p>
          </div>

          {/* Similarity Threshold */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Target className="w-3 h-3 text-green-500" />
                Similarity Threshold
              </Label>
              <Badge variant="secondary" className="text-xs">
                {params.similarityThreshold}
              </Badge>
            </div>
            <Slider
              value={[params.similarityThreshold]}
              onValueChange={([value]) => updateParam('similarityThreshold', value)}
              max={1}
              min={0.1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Minimum similarity score for document retrieval
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <Brain className="w-3 h-3 text-purple-500" />
                Max Response Tokens
              </Label>
              <Badge variant="secondary" className="text-xs">
                {params.maxTokens}
              </Badge>
            </div>
            <Slider
              value={[params.maxTokens]}
              onValueChange={([value]) => updateParam('maxTokens', value)}
              max={4000}
              min={100}
              step={100}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of AI responses
            </p>
          </div>

          {/* Context Window */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-sm font-medium">
                <MessageSquare className="w-3 h-3 text-cyan-500" />
                Context Window
              </Label>
              <Badge variant="secondary" className="text-xs">
                {params.contextWindow} messages
              </Badge>
            </div>
            <Slider
              value={[params.contextWindow]}
              onValueChange={([value]) => updateParam('contextWindow', value)}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Number of previous messages to consider
            </p>
          </div>

          {/* Enable Reranking */}
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Enable Reranking</Label>
              <p className="text-xs text-muted-foreground">
                Reorder retrieved documents by relevance
              </p>
            </div>
            <Switch
              checked={params.enableReranking}
              onCheckedChange={(checked) => updateParam('enableReranking', checked)}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-border/50">
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="w-full text-xs"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};