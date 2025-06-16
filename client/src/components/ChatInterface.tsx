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
import { ThemeSelector } from "./ThemeSelector";
import FileUploadModal from "./FileUploadModal";
import PersonaEditModal from "./PersonaEditModal";
import ChatbotSettingsModal from "./ChatbotSettingsModal";
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
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [notificationState, setNotificationState] = useState<"idle" | "waiting_input" | "waiting_approval">("idle");
  const [pendingNotification, setPendingNotification] = useState("");
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);

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

  // Broadcast notification mutation
  const broadcastMutation = useMutation({
    mutationFn: async ({ agentId, message }: { agentId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/broadcast`, { message });
      return response.json();
    },
    onSuccess: (data) => {
      addSystemMessage(`알림이 전송되었습니다.\n\n내용: "${pendingNotification}"\n대상: ${agent.name} 사용자 ${data.totalRecipients}명\n시간: ${new Date().toLocaleString('ko-KR')}`);
      
      // Immediately invalidate conversations cache to show new notifications
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
    onError: () => {
      addSystemMessage("알림 전송에 실패했습니다.");
    }
  });

  // Get or create conversation based on mode
  const { data: conversationData } = useQuery<Conversation>({
    queryKey: [`/api/conversations${isManagementMode ? '/management' : ''}`, agent.id],
    queryFn: async () => {
      const endpoint = isManagementMode ? "/api/conversations/management" : "/api/conversations";
      const response = await apiRequest("POST", endpoint, { agentId: agent.id });
      return response.json();
    },
  });

  // Mark conversation as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest("POST", `/api/conversations/${conversationId}/read`);
      return response.json();
    },
    onSuccess: () => {
      // Update conversation list cache directly without invalidation to prevent loops
      queryClient.setQueryData(["/api/conversations"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversation?.id 
            ? { ...conv, unreadCount: 0 }
            : conv
        );
      });
    }
  });

  // Get messages for the conversation
  const { data: messagesData = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/conversations/${conversation?.id}/messages`],
    enabled: !!conversation?.id,
  });

  const messages = messagesData;

  // Set conversation when data is available and mark as read (only once)
  useEffect(() => {
    if (conversationData && (!conversation || conversation.id !== conversationData.id)) {
      setConversation(conversationData);
      setHasMarkedAsRead(false);
      
      // Mark conversation as read when opened (only for new conversations with unread messages)
      if (!isManagementMode && conversationData.unreadCount > 0 && !hasMarkedAsRead) {
        setHasMarkedAsRead(true);
        markAsReadMutation.mutate(conversationData.id);
      }
    }
  }, [conversationData?.id, isManagementMode, hasMarkedAsRead]);

  // Show welcome message for management mode when conversation is empty
  useEffect(() => {
    if (isManagementMode && messages && messages.length === 0 && conversation?.id) {
      // Add welcome message for management mode
      setTimeout(() => {
        addSystemMessage(`🔧 ${agent.name} 관리자 모드에 오신 것을 환영합니다!

대화를 통해 다음 기능들을 실행할 수 있습니다:

• "페르소나" - 에이전트 성격 및 말투 설정
• "챗봇 설정" - LLM 모델 및 동작 방식 변경  
• "문서 업로드" - 지식베이스 확장용 문서 추가
• "알림보내기" - 사용자들에게 공지사항 전송
• "성과 분석" - 에이전트 사용 통계 및 분석
• "도움말" - 명령어 목록 다시 보기

원하는 기능을 메시지로 입력하거나, 일반 대화도 가능합니다.`);
      }, 500);
    }
  }, [isManagementMode, messages?.length, conversation?.id, agent.name]);

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
      
      // Update conversation list cache with new message data
      queryClient.setQueryData(["/api/conversations"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversation?.id 
            ? { 
                ...conv, 
                lastMessage: data.aiMessage,
                lastMessageAt: data.aiMessage.createdAt,
                unreadCount: isManagementMode ? conv.unreadCount : 0 // Don't increment unread for current user
              }
            : conv
        );
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
    
    const messageContent = message.trim();
    
    // Handle management commands in management mode
    if (isManagementMode && notificationState === "idle") {
      const lowerMessage = messageContent.toLowerCase();
      
      // Check for feature selection commands with more variations
      if (lowerMessage.includes("페르소나") || lowerMessage.includes("persona") || lowerMessage.includes("성격") || 
          lowerMessage.includes("말투") || lowerMessage.includes("캐릭터") || lowerMessage.includes("개성") ||
          lowerMessage.includes("닉네임") || lowerMessage.includes("특성")) {
        setShowPersonaModal(true);
        setMessage("");
        addSystemMessage("페르소나 편집 창을 열었습니다. 닉네임, 말투 스타일, 지식 분야, 성격 특성, 금칙어 반응 방식을 수정할 수 있습니다.");
        return;
      }
      
      if (lowerMessage.includes("챗봇") || lowerMessage.includes("설정") || lowerMessage.includes("모델") ||
          lowerMessage.includes("llm") || lowerMessage.includes("gpt") || lowerMessage.includes("ai설정") ||
          lowerMessage.includes("봇설정") || lowerMessage.includes("동작") || lowerMessage.includes("유형")) {
        setShowSettingsModal(true);
        setMessage("");
        addSystemMessage("챗봇 설정 창을 열었습니다. LLM 모델과 챗봇 유형을 변경할 수 있습니다.");
        return;
      }
      
      if (lowerMessage.includes("알림") || lowerMessage.includes("notification") || lowerMessage.includes("브로드캐스트") ||
          lowerMessage.includes("공지") || lowerMessage.includes("메시지") || lowerMessage.includes("전송") ||
          lowerMessage.includes("안내") || lowerMessage.includes("소식")) {
        setNotificationState("waiting_input");
        setMessage("");
        addSystemMessage("알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.");
        return;
      }
      
      if (lowerMessage.includes("문서") || lowerMessage.includes("업로드") || lowerMessage.includes("파일") ||
          lowerMessage.includes("자료") || lowerMessage.includes("첨부") || lowerMessage.includes("지식") ||
          lowerMessage.includes("학습") || lowerMessage.includes("데이터") || lowerMessage.includes("정보")) {
        setShowFileModal(true);
        setMessage("");
        addSystemMessage("문서 업로드 창을 열었습니다. TXT, DOC, DOCX, PPT, PPTX 형식의 문서를 업로드하여 에이전트의 지식베이스를 확장할 수 있습니다.");
        return;
      }
      
      if (lowerMessage.includes("성과") || lowerMessage.includes("분석") || lowerMessage.includes("통계") || 
          lowerMessage.includes("performance") || lowerMessage.includes("리포트") || lowerMessage.includes("report") ||
          lowerMessage.includes("현황") || lowerMessage.includes("상태") || lowerMessage.includes("지표") ||
          lowerMessage.includes("활동") || lowerMessage.includes("사용량")) {
        setMessage("");
        addSystemMessage("에이전트 성과 분석을 실행합니다...");
        
        // Execute performance analysis
        setTimeout(async () => {
          try {
            const response = await fetch(`/api/agents/${agent.id}/performance`, {
              credentials: 'include'
            });
            
            if (response.ok) {
              const data = await response.json();
              const performanceMessage = `📊 ${data.agentName} 성과 분석 (${data.period})

📈 주요 지표:

• 총 대화 수: ${data.metrics.totalMessages}개
• 활성 사용자: ${data.metrics.activeUsers}명  
• 업로드된 문서: ${data.metrics.documentsCount}개
• 최근 활동: ${data.metrics.recentActivity}건
• 사용률: ${data.metrics.usagePercentage}%
• 랭킹: ${data.metrics.ranking}위
• 평균 응답시간: ${data.metrics.avgResponseTime}초

${data.insights && data.insights.length > 0 ? '\n🔍 인사이트:\n' + data.insights.map((insight: string) => `• ${insight}`).join('\n') : ''}

📊 성장 트렌드:
• 메시지 증가율: ${data.trends.messageGrowth}
• 사용자 증가율: ${data.trends.userGrowth}  
• 참여율: ${data.trends.engagementRate}`;
              
              addSystemMessage(performanceMessage);
            } else {
              addSystemMessage("성과 분석 데이터를 가져오는데 실패했습니다. 다시 시도해주세요.");
            }
          } catch (error) {
            addSystemMessage("성과 분석 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
          }
        }, 1000);
        return;
      }
      
      if (lowerMessage.includes("도움말") || lowerMessage.includes("명령어") || lowerMessage.includes("기능") || 
          lowerMessage.includes("help") || lowerMessage.includes("사용법") || lowerMessage.includes("메뉴") ||
          lowerMessage.includes("옵션") || lowerMessage.includes("가이드")) {
        setMessage("");
        addSystemMessage(`🔧 에이전트 관리 명령어:

📝 주요 기능:
• "페르소나" / "성격" / "말투" - 에이전트 성격 및 말투 설정
• "챗봇 설정" / "모델" / "AI설정" - LLM 모델 및 동작 방식 변경  
• "문서 업로드" / "파일" / "자료" - 지식베이스 확장용 문서 추가
• "알림보내기" / "공지" / "메시지" - 사용자들에게 공지사항 전송
• "성과 분석" / "통계" / "현황" - 에이전트 사용 통계 및 분석

💡 사용법: 위 키워드가 포함된 메시지를 보내면 해당 기능이 실행됩니다.
일반 대화도 언제든 가능합니다!`);
        return;
      }
    }

    // Handle notification workflow
    if (notificationState === "waiting_input") {
      setPendingNotification(messageContent);
      setNotificationState("waiting_approval");
      setMessage("");
      
      // Show approval message
      addSystemMessage(`알림 내용: "${messageContent}"\n\n전송하시겠습니까? (승인/취소)`);
      return;
    }
    
    if (notificationState === "waiting_approval") {
      const lowerMessage = messageContent.toLowerCase();
      if (lowerMessage === "승인" || lowerMessage === "네" || lowerMessage === "yes") {
        // Execute notification - broadcast to all users
        setNotificationState("idle");
        setMessage("");
        
        // Execute broadcast using mutation
        broadcastMutation.mutate({
          agentId: agent.id,
          message: pendingNotification
        });
        
        setPendingNotification("");
        return;
      } else if (lowerMessage === "취소" || lowerMessage === "아니오" || lowerMessage === "no") {
        // Cancel notification
        setNotificationState("idle");
        setMessage("");
        addSystemMessage("알림 전송이 취소되었습니다.");
        setPendingNotification("");
        return;
      } else {
        setMessage("");
        addSystemMessage("'승인' 또는 '취소'를 입력해주세요.");
        return;
      }
    }
    
    // Normal message sending
    sendMessageMutation.mutate(messageContent);
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
                              setShowSettingsModal(true);
                              setShowMenu(false);
                              addSystemMessage("챗봇 설정 창을 열었습니다. LLM 모델과 챗봇 유형을 변경할 수 있습니다.");
                            }}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            챗봇 설정
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start px-4 py-2 korean-text"
                            onClick={() => {
                              setShowMenu(false);
                              setNotificationState("waiting_input");
                              addSystemMessage("알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.");
                            }}
                          >
                            <Bell className="w-4 h-4 mr-2" />
                            알림보내기
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
                  <p className="text-sm leading-relaxed">{msg.content}</p>
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

      {/* Chatbot Settings Modal */}
      {showSettingsModal && (
        <ChatbotSettingsModal
          agent={agent}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSuccess={addSystemMessage}
          onCancel={addSystemMessage}
        />
      )}
    </div>
  );
}