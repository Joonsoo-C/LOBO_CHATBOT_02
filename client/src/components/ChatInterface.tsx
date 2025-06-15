import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ChevronLeft, 
  Paperclip, 
  Menu, 
  Send, 
  Edit, 
  Upload, 
  Settings, 
  Ban, 
  FileText, 
  BarChart3,
  X,
  User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import FileUploadModal from "./FileUploadModal";
import type { Agent, Message, ChatResponse, Conversation } from "@/types/agent";

interface ChatInterfaceProps {
  agent: Agent;
}

export default function ChatInterface({ agent }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get or create conversation
  const { data: conversationData } = useQuery<Conversation>({
    queryKey: [`/api/conversations`, agent.id],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/conversations", { agentId: agent.id });
      return response.json();
    },
    onSuccess: (data) => {
      setConversation(data);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Get messages for conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversation?.id}/messages`],
    enabled: !!conversation?.id,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string): Promise<ChatResponse> => {
      if (!conversation?.id) throw new Error("No conversation found");
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, { content });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries([`/api/conversations/${conversation?.id}/messages`]);
      queryClient.invalidateQueries(["/api/conversations"]);
      setMessage("");
      
      if (data.usedDocuments && data.usedDocuments.length > 0) {
        toast({
          title: "문서 참조됨",
          description: `${data.usedDocuments.join(", ")} 문서를 참조하여 답변했습니다.`,
        });
      }
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "메시지 전송 실패",
          description: "메시지를 전송할 수 없습니다. 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    sendMessageMutation.mutate(message.trim());
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ko-KR", { 
        month: "numeric", 
        day: "numeric" 
      });
    } catch {
      return "";
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messagesLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center korean-text">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">대화를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container flex flex-col">
      {/* Chat Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gray-600 rounded-2xl flex items-center justify-center">
                <User className="text-white w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground korean-text">{agent.name}</h3>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => setShowFileModal(true)}
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <Menu className="w-5 h-5" />
                </Button>
                
                {/* Dropdown Menu */}
                {showMenu && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border z-50">
                    <div className="py-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => setShowMenu(false)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        대화 변경
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => {
                          setShowFileModal(true);
                          setShowMenu(false);
                        }}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        발표 변경
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => setShowMenu(false)}
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        모델 변경
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => setShowMenu(false)}
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        고치 차단기
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => {
                          setShowFileModal(true);
                          setShowMenu(false);
                        }}
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        문서 업로드
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full justify-start px-4 py-2 korean-text"
                        onClick={() => setShowMenu(false)}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        에이전트 성과
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto chat-scroll">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground korean-text">
              {agent.name}와(과) 대화를 시작해보세요!
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isFromUser ? "justify-end" : "items-start space-x-3"}`}
            >
              {!msg.isFromUser && (
                <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="text-white w-4 h-4" />
                </div>
              )}
              <div className={msg.isFromUser ? "max-w-xs" : "flex-1"}>
                <div className={`message-bubble ${msg.isFromUser ? "user" : "assistant"}`}>
                  <p className="text-sm korean-text whitespace-pre-wrap">{msg.content}</p>
                </div>
                <div className={`text-xs text-muted-foreground mt-1 korean-text ${
                  msg.isFromUser ? "text-right mr-1" : "ml-1"
                }`}>
                  {formatTime(msg.createdAt)}
                </div>
              </div>
            </div>
          ))
        )}
        
        {sendMessageMutation.isPending && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="text-white w-4 h-4" />
            </div>
            <div className="message-bubble assistant">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 bg-card border-t border-border sticky bottom-0">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="p-2 flex-shrink-0"
            onClick={() => setShowFileModal(true)}
          >
            <Paperclip className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <Input
              type="text"
              placeholder="관련 명령어를 입력하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-muted border-border korean-text"
              disabled={sendMessageMutation.isPending}
            />
          </div>
          <Button 
            type="submit"
            className="p-3 flex-shrink-0"
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* File Upload Modal */}
      <FileUploadModal
        agent={agent}
        isOpen={showFileModal}
        onClose={() => setShowFileModal(false)}
      />
    </div>
  );
}
