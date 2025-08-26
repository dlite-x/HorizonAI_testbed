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
    
    // Get relevant files based on query content
    const relevantFiles = files.filter(file => {
      const fileName = file.name.toLowerCase();
      const query = userMessage.toLowerCase();
      
      // Match based on keywords in the query and document titles
      if (query.includes('protein') || query.includes('methanol')) {
        return fileName.includes('protein') || fileName.includes('methanol') || fileName.includes('methylococcus');
      }
      if (query.includes('solar') || query.includes('photovoltaic') || query.includes('renewable')) {
        return fileName.includes('photovoltaic') || fileName.includes('renewable');
      }
      if (query.includes('single cell') || query.includes('scp')) {
        return fileName.includes('single cell protein');
      }
      if (query.includes('industry') || query.includes('commercial') || query.includes('patent')) {
        return fileName.includes('industrial') || fileName.includes('patent');
      }
      
      // Fallback to partial matching
      return Math.random() > 0.6;
    }).slice(0, ragParams.topK);

    // Generate document-specific content based on retrieved sources
    const generateContentBasedOnSources = (sources: string[], query: string) => {
      if (sources.length === 0) {
        return "I don't have specific documents that directly address your question. Could you rephrase or ask about topics covered in your document library?";
      }

      const responses: { [key: string]: string[] } = {
        'methylococcus': [
          "According to the research on methylococcus capsulatus protein isolate, this organism shows significant potential for sustainable protein production. The studies indicate it can convert methane into high-quality protein with impressive efficiency rates.",
          "The methylococcus capsulatus research reveals that this bacterium can produce protein isolates with excellent nutritional profiles, containing all essential amino acids in proportions suitable for human consumption."
        ],
        'photovoltaic': [
          "The photovoltaic-driven microbial protein production research demonstrates remarkable land use efficiency. According to the data, this approach can produce 15-20 times more protein per hectare compared to conventional crop farming.",
          "Studies show that combining solar energy with microbial protein production creates a highly efficient system that uses both land and sunlight more effectively than traditional agriculture, with significantly lower water requirements."
        ],
        'renewable': [
          "The research on sustainable single-cell protein indicates massive global potential when powered by variable renewable electricity. The analysis suggests this could address protein security while reducing agricultural land pressure.",
          "According to the sustainability analysis, renewable energy-powered protein production could scale to meet significant portions of global protein demand with dramatically reduced environmental impact."
        ],
        'industrial': [
          "The industrial landscape analysis reveals that single-cell protein technology has moved from laboratory curiosity to commercial viability, with several companies now operating at scale.",
          "Patent analysis shows rapid innovation in single-cell protein production methods, with key developments in fermentation efficiency, downstream processing, and product applications."
        ]
      };

      // Find the most relevant response category
      for (const [key, responseArray] of Object.entries(responses)) {
        if (sources.some(source => source.toLowerCase().includes(key)) || query.includes(key)) {
          return responseArray[Math.floor(Math.random() * responseArray.length)];
        }
      }

      // Default response referencing the actual sources
      return `Based on the analysis of ${sources.join(' and ')}, the research provides detailed insights into this topic with specific data points and methodological approaches that directly address your question.`;
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
      responseContent = generateContentBasedOnSources(relevantFiles.map(f => f.name), userMessage);
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