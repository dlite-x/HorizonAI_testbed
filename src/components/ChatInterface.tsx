import { useState, useRef, useEffect } from "react";
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

  const simulateAIResponse = (userMessage: string, conversationHistory: ChatMessage[]): ChatMessage => {
    // Get recent AI messages for context based on ragParams
    const recentMessages = conversationHistory.slice(-ragParams.contextWindow);
    const lastAIMessage = recentMessages.filter(m => m.type === 'ai').pop();
    
    // Detect follow-up questions
    const followUpWords = ['tell me more', 'more details', 'elaborate', 'explain further', 'continue', 'what else', 'more about'];
    const isFollowUp = followUpWords.some(phrase => userMessage.toLowerCase().includes(phrase.toLowerCase()));
    
    // Get relevant files based on query content with more flexible matching
    const relevantFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const query = userMessage.toLowerCase();
      
      // Specific keyword matching with broader coverage
      if (query.includes('cost') || query.includes('economic') || query.includes('fermentation')) {
        return fileName.includes('industrial') || fileName.includes('patent') || fileName.includes('state-of-the-art');
      }
      if (query.includes('bioreactor') || query.includes('reactor') || query.includes('equipment')) {
        return fileName.includes('industrial') || fileName.includes('patent');
      }
      
      // Protein-related queries (much broader matching)
      if (query.includes('protein') || query.includes('methylococcus') || query.includes('capsulatus') || 
          query.includes('strain') || query.includes('food') || query.includes('application') || 
          query.includes('human') || query.includes('consumption') || query.includes('approved') ||
          query.includes('species') || query.includes('organism') || query.includes('microbial')) {
        return fileName.includes('protein') || fileName.includes('methylococcus') || fileName.includes('single cell');
      }
      
      // Energy and efficiency queries
      if (query.includes('solar') || query.includes('photovoltaic') || query.includes('renewable') || 
          query.includes('land use') || query.includes('efficient') || query.includes('sunlight')) {
        return fileName.includes('photovoltaic') || fileName.includes('renewable');
      }
      
      // Global and sustainability queries
      if (query.includes('global') || query.includes('potential') || query.includes('sustainable') ||
          query.includes('scale') || query.includes('future') || query.includes('production')) {
        return fileName.includes('global') || fileName.includes('sustainable') || fileName.includes('protein');
      }
      
      // Industrial and commercial queries
      if (query.includes('industry') || query.includes('commercial') || query.includes('patent') ||
          query.includes('company') || query.includes('market') || query.includes('business')) {
        return fileName.includes('industrial') || fileName.includes('patent') || fileName.includes('landscape');
      }
      
      // If no specific match, include Single Cell Protein papers as they're comprehensive
      if (fileName.includes('single cell protein') || fileName.includes('state-of-the-art')) {
        return true;
      }
      
      return false;
    }).slice(0, ragParams.topK);

    // Generate specific responses based on query type and sources
    const generateContextualResponse = (query: string, sources: string[]) => {
      const lowerQuery = query.toLowerCase();
      
      // Cost and economic questions
      if (lowerQuery.includes('cost') || lowerQuery.includes('economic') || lowerQuery.includes('driver')) {
        if (sources.some(s => s.toLowerCase().includes('industrial') || s.toLowerCase().includes('patent'))) {
          return "According to the industrial analysis, the main cost drivers in fermentation processes include substrate costs (typically 40-60% of total costs), energy consumption for maintaining optimal conditions, downstream processing for product purification, and capital costs for bioreactor systems. Substrate efficiency and energy optimization are critical factors for commercial viability.";
        }
      }
      
      // Bioreactor questions
      if (lowerQuery.includes('bioreactor') || lowerQuery.includes('reactor') || lowerQuery.includes('types')) {
        if (sources.some(s => s.toLowerCase().includes('industrial') || s.toLowerCase().includes('patent'))) {
          return "Based on the industrial landscape review, two common types of bioreactors used in single-cell protein production are: 1) Stirred tank reactors (STRs) - which provide excellent mixing and oxygen transfer for aerobic fermentation processes, and 2) Airlift reactors - which offer energy-efficient mixing through pneumatic agitation and are particularly suitable for shear-sensitive organisms like methylotrophs.";
        }
      }
      
      // Strain and food application questions
      if (lowerQuery.includes('strain') || lowerQuery.includes('approved') || lowerQuery.includes('food') || 
          lowerQuery.includes('human') || lowerQuery.includes('consumption') || lowerQuery.includes('species')) {
        if (sources.some(s => s.toLowerCase().includes('protein') || s.toLowerCase().includes('single cell'))) {
          return "Based on the single-cell protein research, three key strains approved for human food applications include: 1) Methylococcus capsulatus (Bath) - approved in EU and used for protein isolates, 2) Candida utilis (torula yeast) - approved globally for protein supplements, and 3) Spirulina platensis - approved worldwide as a nutritional supplement. These organisms have undergone extensive safety testing and regulatory approval processes.";
        }
      }
      
      // Protein composition questions
      if (lowerQuery.includes('protein') && !lowerQuery.includes('bioreactor') && !lowerQuery.includes('cost') && !lowerQuery.includes('strain')) {
        if (sources.some(s => s.toLowerCase().includes('methylococcus') || s.toLowerCase().includes('protein'))) {
          return "The methylococcus capsulatus research reveals that this bacterium can produce protein isolates with excellent nutritional profiles, containing all essential amino acids in proportions suitable for human consumption. The protein content typically ranges from 60-80% dry weight with high digestibility scores.";
        }
      }
      
      // Land use and efficiency questions
      if (lowerQuery.includes('land') || lowerQuery.includes('efficient') || lowerQuery.includes('solar')) {
        if (sources.some(s => s.toLowerCase().includes('photovoltaic'))) {
          return "Research on photovoltaic-driven microbial protein production demonstrates that this approach can use land and sunlight 15-20 times more efficiently than conventional crops. The system combines solar energy capture with controlled microbial fermentation, achieving protein yields of 15-30 tons per hectare annually compared to 1-2 tons for traditional agriculture.";
        }
      }
      
      // Global potential questions
      if (lowerQuery.includes('global') || lowerQuery.includes('potential') || lowerQuery.includes('scale')) {
        if (sources.some(s => s.toLowerCase().includes('global') || s.toLowerCase().includes('sustainable'))) {
          return "The global potential analysis indicates that sustainable single-cell protein production powered by renewable electricity could meet 10-20% of global protein demand by 2050. This would require approximately 0.5-1% of global renewable electricity capacity and could significantly reduce agricultural land pressure while providing food security benefits.";
        }
      }
      
      // Generic fallback for other questions
      if (sources.length > 0) {
        return `Based on the analysis of ${sources.join(' and ')}, I can provide insights on this topic. However, your specific question might be better addressed by asking about cost drivers, bioreactor types, protein composition, land use efficiency, or global scaling potential - areas that are well-covered in the available research documents.`;
      }
      
      return "I don't have specific documents that directly address your question. The available research covers topics like fermentation cost drivers, bioreactor technologies, protein composition, land use efficiency, and global scaling potential. Could you ask about one of these specific areas?";
    };

    let responseContent: string;
    
    if (isFollowUp && lastAIMessage && lastAIMessage.sources) {
      // Generate detailed follow-up using previous sources
      const previousSources = lastAIMessage.sources;
      const followUpResponses = [
        `Diving deeper into the findings from ${previousSources.join(' and ')}: The research methodology involved controlled studies with specific parameters. The results show statistical significance across multiple metrics, including efficiency rates, cost-effectiveness, and environmental impact assessments.`,
        `Additional details from the ${previousSources.length > 1 ? 'studies' : 'study'}: The data reveals several key performance indicators that weren't mentioned in my initial summary. These include scalability factors, energy conversion efficiency, and comparative analysis with traditional methods.`,
        `Further analysis of ${previousSources.join(' and ')}: The research presents compelling evidence with detailed case studies, economic modeling, and projections for commercial implementation. The technical specifications and operational parameters are thoroughly documented.`
      ];
      responseContent = followUpResponses[Math.floor(Math.random() * followUpResponses.length)];
    } else {
      // Generate new response based on retrieved documents
      responseContent = generateContextualResponse(userMessage, relevantFiles.map(f => f.name));
    }

    return {
      id: Date.now().toString(),
      type: 'ai',
      content: responseContent,
      timestamp: new Date(),
      sources: relevantFiles.map(f => f.name),
      flagged: false
    };
  };

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

    // Simulate AI processing time
    setTimeout(() => {
      const aiResponse = simulateAIResponse(inputMessage, messages);
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
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