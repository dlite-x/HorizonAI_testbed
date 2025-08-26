import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles,
  MessageSquare,
  Eye
} from "lucide-react";
import { FileData } from "./FileExplorer";
import { RAGParams } from "./RAGParameters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  sources?: string[];
  flagged?: boolean;
}

interface ChatInterfaceProps {
  selectedFile: FileData | null;
  files: FileData[];
  ragParams: RAGParams;
}

export const ChatInterface = ({ selectedFile, files, ragParams }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'Hello! I\'m your AI assistant. I can help you analyze and answer questions about your documents. Upload some files and ask me anything!',
      timestamp: new Date(),
      sources: [],
      flagged: false
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const simulateAIResponse = useCallback(async (userMessage: string): Promise<ChatMessage> => {
    try {
      // Check if there are any files
      if (files.length === 0) {
        return {
          id: Date.now().toString(),
          content: "Please upload some documents first. I need documents to analyze before I can answer questions about them.",
          type: 'ai',
          timestamp: new Date(),
          sources: [],
          flagged: false
        };
      }

      // Get selected document IDs for context  
      const documentIds = selectedFile ? [selectedFile.id] : files.map(f => f.id);
      
      // Validate that all IDs are proper UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const validDocumentIds = documentIds.filter(id => uuidRegex.test(id));
      
      if (validDocumentIds.length === 0) {
        return {
          id: Date.now().toString(),
          content: "No valid documents found. Please upload documents with the file manager to enable RAG queries.",
          type: 'ai',
          timestamp: new Date(),
          sources: [],
          flagged: false
        };
      }
      
      // Call the real RAG function
      const { data, error } = await supabase.functions.invoke('rag-query', {
        body: {
          query: userMessage,
          topK: ragParams.topK,
          documentIds: validDocumentIds
        }
      });

      if (error) {
        console.error('RAG query error:', error);
        toast.error('Error processing your question. Please try again.');
        return {
          id: Date.now().toString(),
          content: "I'm sorry, I encountered an error while processing your question. Please make sure the documents have been properly embedded, or try uploading new documents.",
          type: 'ai',
          timestamp: new Date(),
          sources: [],
          flagged: false
        };
      }

      const { answer, sources } = data;
      
      return {
        id: Date.now().toString(),
        content: answer || "I couldn't find relevant information to answer your question. Please try rephrasing or ask about different topics.",
        type: 'ai',
        timestamp: new Date(),
        sources: sources?.map((s: any) => s.document) || [],
        flagged: false
      };

    } catch (error) {
      console.error('Error in AI response:', error);
      toast.error('Failed to get AI response');
      
      return {
        id: Date.now().toString(),
        content: "I'm experiencing technical difficulties. Please try again later.",
        type: 'ai',
        timestamp: new Date(),
        sources: [],
        flagged: false
      };
    }
  }, [selectedFile, files, ragParams.topK]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const aiResponse = await simulateAIResponse(inputMessage);
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFlagResponse = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, flagged: !msg.flagged }
        : msg
    ));
  };

  return (
    <div className="h-full flex flex-col bg-chat-bg">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Horizon HubAssist</h2>
            <p className="text-sm text-muted-foreground">
              interact with the beta Research, EcoAssist, and Enterprise AI tool
            </p>
          </div>
          <div className="ml-auto">
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full custom-scrollbar">
          <div className="p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 message-enter ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.type === 'ai' && (
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}
                
                <div className={`max-w-[80%] ${message.type === 'user' ? 'order-1' : ''}`}>
                  <Card className={`p-3 ${
                    message.type === 'user' 
                      ? 'bg-chat-bubble-user text-primary-foreground' 
                      : 'bg-chat-bubble-ai'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </p>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/20">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs font-medium text-muted-foreground">
                            Sources:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs bg-background/50"
                            >
                              {source}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                  
                  <div className="mt-1 flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                    {message.type === 'ai' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleFlagResponse(message.id)}
                        className={`h-6 px-2 text-xs ${
                          message.flagged 
                            ? 'text-destructive hover:text-destructive' 
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <Eye className={`w-3 h-3 mr-1 ${message.flagged ? 'fill-current' : ''}`} />
                        {message.flagged ? 'Human check requested' : 'Request human check'}
                      </Button>
                    )}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mt-1 flex-shrink-0">
                    <User className="w-4 h-4 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 message-enter">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mt-1">
                  <Bot className="w-4 h-4 text-primary animate-pulse" />
                </div>
                <Card className="bg-chat-bubble-ai p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-sm text-muted-foreground">AI is analyzing documents...</span>
                  </div>
                </Card>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border bg-card">
        {selectedFile && (
          <div className="mb-3">
            <Badge variant="outline" className="text-xs">
              <MessageSquare className="w-3 h-3 mr-1" />
              Context: {selectedFile.name}
            </Badge>
          </div>
        )}
        
        <div className="flex gap-2">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question about your documents..."
            className="flex-1 bg-chat-input border-border focus:ring-primary/50"
            disabled={isLoading}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          Powered by retrieval-augmented generation (RAG) with OpenAI embeddings
        </p>
      </div>
    </div>
  );
};