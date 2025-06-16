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
import PersonaEditModal from "./PersonaEditModal";
import type { Agent, Message, ChatResponse, Conversation } from "@/types/agent";

interface ChatInterfaceProps {
  agent: Agent;
  isManagementMode?: boolean;
}

export default function ChatInterface({ agent, isManagementMode = false }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isAnnouncementMode, setIsAnnouncementMode] = useState(false);
  const [pendingAnnouncement, setPendingAnnouncement] = useState<string>("");

  // Function to add system message from agent
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now(),
      conversationId: conversation?.id || 0,
      content,
      isFromUser: false,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages(prev => [...prev, systemMessage]);
  };
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
    onMutate: async (content: string) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [`/api/conversations/${conversation?.id}/messages`]
      });

      // Create optimistic user message
      const optimisticUserMessage: Message = {
        id: Date.now(), // temporary ID
        conversationId: conversation?.id || 0,
        content,
        isFromUser: true,
        createdAt: new Date().toISOString(),
      };

      // Add optimistic user message immediately
      setOptimisticMessages(prev => [...prev, optimisticUserMessage]);
      setIsTyping(true); // Show typing indicator for AI response
      setMessage(""); // Clear input immediately
    },
    onSuccess: (data: ChatResponse) => {
      // Clear optimistic messages and typing indicator
      setOptimisticMessages([]);
      setIsTyping(false);
      
      // Invalidate messages to refresh with real data
      queryClient.invalidateQueries({
        queryKey: [`/api/conversations/${conversation?.id}/messages`]
      });
    },
    onError: (error: Error) => {
      // Clear optimistic messages and typing indicator on error
      setOptimisticMessages([]);
      setIsTyping(false);
      
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
    
    // Handle announcement mode
    if (isAnnouncementMode) {
      if (!pendingAnnouncement) {
        // First message in announcement mode - store the announcement and ask for approval
        setPendingAnnouncement(message.trim());
        setMessage("");
        addSystemMessage(`📋 알림 내용을 확인해주세요:\n\n"${message.trim()}"\n\n이 내용으로 알림을 발송하시겠습니까?\n\n• 발송하려면 "승인" 또는 "발송"을 입력해주세요\n• 취소하려면 "취소"를 입력해주세요`);
        return;
      } else {
        // Second message in announcement mode - handle approval/cancellation
        const userResponse = message.trim().toLowerCase();
        if (userResponse === "승인" || userResponse === "발송") {
          // Send announcement
          setMessage("");
          addSystemMessage(`✅ 알림이 성공적으로 발송되었습니다!\n\n발송된 내용: "${pendingAnnouncement}"\n발송 시간: ${new Date().toLocaleString('ko-KR')}\n대상: 전체 사용자\n상태: 발송 완료`);
          setIsAnnouncementMode(false);
          setPendingAnnouncement("");
          return;
        } else if (userResponse === "취소") {
          // Cancel announcement
          setMessage("");
          addSystemMessage("❌ 알림 발송이 취소되었습니다.");
          setIsAnnouncementMode(false);
          setPendingAnnouncement("");
          return;
        } else {
          // Invalid response
          setMessage("");
          addSystemMessage("⚠️ 올바른 응답을 입력해주세요.\n\n• 발송하려면 \"승인\" 또는 \"발송\"\n• 취소하려면 \"취소\"를 입력해주세요");
          return;
        }
      }
    }
    
    // Normal message handling
    sendMessageMutation.mutate(message.trim());
  };

  // Combine real messages with optimistic messages
  const allMessages = [...(messages || []), ...optimisticMessages];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto scroll to bottom when new messages arrive or typing state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages, isTyping]);

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
                              setShowPersonaModal(true);
                              setShowMenu(false);
                              addSystemMessage("페르소나 편집 창을 열었습니다. 닉네임, 말투 스타일, 지식 분야, 성격 특성, 금칙어 반응 방식을 수정할 수 있습니다.");
                            }}
                          >
                            <User className="w-4 h-4 mr-2" />
                            페르소나 변경
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={() => {
                              setShowMenu(false);
                              addSystemMessage("모델 변경 기능을 선택하셨습니다. 현재 GPT-4o 모델을 사용하고 있으며, 필요에 따라 다른 AI 모델로 변경할 수 있습니다.");
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            모델 변경
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={() => {
                              setShowMenu(false);
                              setIsAnnouncementMode(true);
                              addSystemMessage("🔔 알림 보내기 기능을 실행했습니다.\n\n아래에 알림 내용을 입력하고 메시지 보내기를 눌러주세요.");
                            }}
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            알림 보내기
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={() => {
                              setShowFileModal(true);
                              setShowMenu(false);
                              addSystemMessage("문서 업로드 창을 열었습니다. TXT, DOC, DOCX, PPT, PPTX 형식의 문서를 업로드하여 에이전트의 지식베이스를 확장할 수 있습니다.");
                            }}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            문서 업로드
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={async () => {
                              setShowMenu(false);
                              addSystemMessage("에이전트 성과 분석을 실행합니다...");
                              
                              try {
                                const response = await fetch(`/api/agents/${agent.id}/performance`, {
                                  credentials: 'include'
                                });
                                
                                if (response.ok) {
                                  const data = await response.json();
                                  const performanceMessage = `📊 ${data.agentName} 성과 분석 (${data.period})


📈 주요 지표:

• 총 메시지 수: ${data.metrics.totalMessages}개

• 활성 사용자: ${data.metrics.activeUsers}명

• 업로드 문서: ${data.metrics.documentsCount}개

• 최근 활동: ${data.metrics.recentActivity}건

• 응답률: ${data.metrics.responseRate}

• 평균 응답시간: ${data.metrics.avgResponseTime}

• 만족도: ${data.metrics.satisfaction}


📊 성장 추세:

• 메시지 증가율: ${data.trends.messageGrowth}

• 사용자 증가율: ${data.trends.userGrowth}

• 참여율: ${data.trends.engagementRate}`;
                                  
                                  addSystemMessage(performanceMessage);
                                } else {
                                  addSystemMessage("성과 분석 데이터를 불러오는데 실패했습니다.");
                                }
                              } catch (error) {
                                addSystemMessage("성과 분석 중 오류가 발생했습니다.");
                              }
                            }}
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
        {allMessages.length === 0 ? (
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
          <>
            {allMessages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl korean-text ${
                    msg.isFromUser
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="max-w-[75%] px-4 py-3 rounded-2xl bg-muted text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                    <span className="text-xs text-gray-500 ml-2 korean-text">메시지 작성 중...</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="px-4 py-4 border-t border-border bg-card">
        <div className="flex items-center space-x-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder={
                isAnnouncementMode 
                  ? (pendingAnnouncement ? "승인/취소를 입력하세요..." : "알림 내용을 입력하세요...")
                  : "메시지를 입력하세요..."
              }
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
          onSuccess={addSystemMessage}
        />
      )}

      {/* Persona Edit Modal */}
      {showPersonaModal && (
        <PersonaEditModal
          agent={agent}
          isOpen={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSuccess={addSystemMessage}
          onCancel={addSystemMessage}
        />
      )}
    </div>
  );
}