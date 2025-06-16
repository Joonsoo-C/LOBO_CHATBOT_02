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
  User,
  Bell
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
  isManagementMode?: boolean;
}

export default function ChatInterface({ agent, isManagementMode = false }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Get or create conversation based on mode
  const { data: conversationData } = useQuery<Conversation>({
    queryKey: [`/api/conversations${isManagementMode ? '/management' : ''}`, agent.id],
    queryFn: async () => {
      const endpoint = isManagementMode ? "/api/conversations/management" : "/api/conversations";
      const response = await apiRequest("POST", endpoint, { agentId: agent.id });
      return response.json();
    },
  });

  // Set conversation when data is available
  useEffect(() => {
    if (conversationData) {
      setConversation(conversationData);
    }
  }, [conversationData]);

  // Get messages for the conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversation?.id}/messages`],
    enabled: !!conversation?.id,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) {
        throw new Error("No conversation found");
      }
      
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content,
        isFromUser: true,
      });
      return response.json();
    },
    onSuccess: (data: ChatResponse) => {
      // Invalidate messages to refresh the chat
      queryClient.invalidateQueries({
        queryKey: [`/api/conversations/${conversation?.id}/messages`]
      });
      setMessage("");
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
      } else {
        toast({
          title: "메시지 전송 실패",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
              <Link href={isManagementMode ? "/management" : "/"}>
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
              {isManagementMode && (
                <>
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
                      className="px-3 py-2 korean-text"
                      onClick={() => setShowMenu(!showMenu)}
                    >
                      기능선택
                    </Button>
                  
                    {/* Dropdown Menu */}
                    {showMenu && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-card rounded-xl shadow-lg border border-border z-50">
                        <div className="py-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={() => {
                              setShowFileModal(true);
                              setShowMenu(false);
                            }}
                          >
                            <User className="w-4 h-4 mr-2" />
                            페르소나 변경
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
                            <Bell className="w-4 h-4 mr-2" />
                            공지 보내기
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
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Chat Messages */}
      <div className="flex-1 px-4 py-4 space-y-4 overflow-y-auto chat-scroll">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="text-white w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2 korean-text">
              {agent.name}과 대화하세요
            </h3>
            <p className="text-muted-foreground text-sm korean-text">
              궁금한 것이 있으면 언제든지 물어보세요.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl korean-text ${
                  msg.isFromUser
                    ? "bg-primary text-primary-foreground ml-auto"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 border-t border-border bg-card">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="메시지를 입력하세요..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pr-12 korean-text"
              disabled={sendMessageMutation.isPending}
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2"
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <FileUploadModal
          agent={agent}
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
        />
      )}
    </div>
  );
}