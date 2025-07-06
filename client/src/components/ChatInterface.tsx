import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ChevronLeft, 
  Send, 
  Files,
  MoreVertical,
  LogOut,
  GraduationCap,
  Code,
  Bot,
  User,
  FlaskRound,
  Map,
  Languages,
  Dumbbell,
  Database,
  Lightbulb,
  Calendar,
  Pen,
  FileText,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import FileUploadModal from "./FileUploadModal";
import PersonaEditModal from "./PersonaEditModal";
import ChatbotSettingsModal from "./ChatbotSettingsModal";
import IconChangeModal from "./IconChangeModal";
import { useIsTablet } from "@/hooks/use-tablet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Agent, Message, ChatResponse, Conversation } from "@/types/agent";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

// Icon mapping for agent icons
const iconMap: Record<string, any> = {
  "fas fa-graduation-cap": GraduationCap,
  "fas fa-code": Code,
  "fas fa-robot": Bot,
  "fas fa-user": User,
  "fas fa-flask": FlaskRound,
  "fas fa-map": Map,
  "fas fa-language": Languages,
  "fas fa-dumbbell": Dumbbell,
  "fas fa-database": Database,
  "fas fa-lightbulb": Lightbulb,
  "fas fa-heart": Heart,
  "fas fa-calendar": Calendar,
  "fas fa-pen": Pen,
  "fas fa-file-alt": FileText,
};

interface ChatInterfaceProps {
  agent: Agent;
  isManagementMode?: boolean;
}

const ChatInterface = forwardRef<any, ChatInterfaceProps>(({ agent, isManagementMode = false }, ref) => {
  const isTablet = useIsTablet();
  const { t, language } = useLanguage();
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showFileListModal, setShowFileListModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, string>>({});
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isTouch, setIsTouch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // 시스템 메시지 감지 함수
  const isSystemMessage = (content: string): boolean => {
    if (!content) return false;
    
    const patterns = [
      /입니다\.|됩니다\.|합니다\./,
      /결과|기능|추가|변경|설정|업로드|완료|실행|분석|생성|저장|확인/,
      /페르소나|아이콘|챗봇|문서|알림|성과|도움말/,
      /창을 열었습니다|기능을 실행|설정이 변경|문서가 업로드/,
      /^🔧|^⚙️|시스템|알림|관리자|설정/,
      /실행합니다|확인하세요|변경되었습니다|업로드되었습니다/
    ];
    
    return patterns.some(pattern => pattern.test(content));
  };

  // 반응 옵션들
  const reactionOptions = [
    { icon: '👍', type: 'like' },
    { icon: '👎', type: 'dislike' }
  ];

  // 시스템 메시지 추가 함수
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now(),
      content,
      isFromUser: false,
      createdAt: new Date(),
      conversationId: conversation?.id || 0
    };
    
    setOptimisticMessages(prev => [...prev, systemMessage]);
  };

  // Conversation 쿼리
  const { data: conversationData } = useQuery({
    queryKey: ['/api/conversations', 'agent', agent.id],
    enabled: !!agent.id
  });

  // Messages 쿼리
  const { data: messages = [], isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', conversation?.id, 'messages'],
    enabled: !!conversation?.id
  });

  // Documents 쿼리
  const { data: documents = [] } = useQuery({
    queryKey: ['/api/documents', 'agent', agent.id],
    enabled: !!agent.id
  });

  // 모든 메시지 (실제 + 낙관적)
  const allMessages = useMemo(() => {
    return [...messages, ...optimisticMessages];
  }, [messages, optimisticMessages]);

  // 메시지 전송 뮤테이션
  const sendMessageMutation = useMutation({
    mutationFn: async (messageContent: string) => {
      if (!conversation?.id) throw new Error("No conversation");
      
      const response = await apiRequest(`/api/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: { 
          content: messageContent,
          userLanguage: language
        }
      });
      return response;
    },
    onSuccess: (data: ChatResponse) => {
      setOptimisticMessages([]);
      setIsTyping(false);
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', conversation?.id, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
    onError: (error: Error) => {
      setOptimisticMessages([]);
      setIsTyping(false);
      console.error("Message send failed:", error);
      
      if (isUnauthorizedError(error)) {
        window.location.href = '/auth';
        return;
      }
      
      toast({
        title: "메시지 전송 실패",
        description: "메시지를 다시 보내주세요.",
        variant: "destructive"
      });
    }
  });

  // 대화 삭제 뮤테이션
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      await apiRequest(`/api/conversations/${conversationId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setShowDeleteConfirmModal(false);
      toast({
        title: "대화방 나가기 완료",
        description: "대화 기록이 삭제되었습니다."
      });
      window.location.href = '/';
    },
    onError: (error) => {
      console.error("Failed to delete conversation:", error);
      toast({
        title: "삭제 실패",
        description: "대화 삭제 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // Conversation 설정 effect
  useEffect(() => {
    if (conversationData) {
      setConversation(conversationData);
    }
  }, [conversationData]);

  // 메시지 전송 함수
  const handleSendMessage = async () => {
    if (!message.trim() || sendMessageMutation.isPending) return;
    
    const messageContent = message.trim();
    setMessage("");
    
    const optimisticUserMessage: Message = {
      id: Date.now(),
      content: messageContent,
      isFromUser: true,
      createdAt: new Date(),
      conversationId: conversation?.id || 0
    };
    
    setOptimisticMessages(prev => [...prev, optimisticUserMessage]);
    setIsTyping(true);
    
    sendMessageMutation.mutate(messageContent);
  };

  // 키보드 이벤트 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 자동 스크롤
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, isTyping]);

  // 아이콘 렌더링 함수
  const renderIcon = (iconName: string, size: number = 20) => {
    const IconComponent = iconMap[iconName];
    if (IconComponent) {
      return <IconComponent size={size} />;
    }
    return <Bot size={size} />;
  };

  // forwardRef 인터페이스
  useImperativeHandle(ref, () => ({
    openPersonaModal: () => setShowPersonaModal(true),
    openIconModal: () => setShowIconModal(true),
    openSettingsModal: () => setShowSettingsModal(true),
    openFileModal: () => setShowFileModal(true),
    openFileListModal: () => setShowFileListModal(true),
    addSystemMessage
  }));

  return (
    <div className={`chat-interface ${isTablet ? 'tablet-mode' : 'mobile-mode'} flex flex-col h-full relative`}>
      {/* Header - 모바일에서만 표시 */}
      {!isTablet && (
        <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="sm" className="p-2">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
              </Link>
              
              <div className="flex items-center gap-3">
                <div 
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${agent.backgroundColor || 'bg-blue-500'}`}
                >
                  {agent.isCustomIcon ? (
                    <img 
                      src={`/api/agents/${agent.id}/icon`} 
                      alt={agent.name}
                      className="w-8 h-8 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    renderIcon(agent.icon, 20)
                  )}
                </div>
                
                <div>
                  <h2 className="font-semibold text-sm text-foreground korean-text">{agent.name}</h2>
                  <p className="text-xs text-muted-foreground korean-text">{agent.description}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Files 버튼 - 일반 모드에서만 */}
              {!isManagementMode && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => setShowFileListModal(true)}
                >
                  <Files className="w-5 h-5" />
                </Button>
              )}
              
              {/* 설정 메뉴 */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <MoreVertical className="w-5 h-5" />
                </Button>
                
                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-50">
                      <div className="py-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowDeleteConfirmModal(true);
                            setShowMenu(false);
                          }}
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          대화방 나가기
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* 메시지 영역 */}
      <div 
        className={`chat-interface-messages ${!isTablet ? "mobile-messages-container" : "flex-1"} px-4 overflow-y-auto overflow-x-visible chat-scroll chat-messages ${isTablet ? "md:px-12" : "md:px-6"}`}
        style={{ 
          paddingTop: isTablet ? '1rem' : '120px', 
          paddingBottom: isTablet ? '1rem' : '50px',
        }}
      >
        <div className="messages-container space-y-4 overflow-visible">
          {messagesLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="mb-2">
              <div className="flex justify-start">
                <div className="minimal-message assistant text-sm md:text-base leading-relaxed korean-text">
                  안녕하세요! 저는 {agent.name}입니다. 궁금한 것이 있으면 언제든지 물어보세요.
                </div>
              </div>
            </div>
          ) : (
            <>
              {allMessages.map((msg, index) => {
                const isSystem = !msg.isFromUser && isSystemMessage(msg.content);
                const uniqueKey = msg.id ? `msg-${msg.id}-${index}` : `optimistic-${index}-${Date.now()}-${Math.random()}`;
                
                return (
                  <div key={uniqueKey} className="message-row overflow-visible">
                    <div 
                      className={`relative w-full flex flex-col ${msg.isFromUser ? 'items-end' : 'items-start'} overflow-visible`}
                    >
                      <div
                        className={`${
                          msg.isFromUser
                            ? "minimal-message user"
                            : isSystem
                              ? "minimal-message system-message"
                              : "minimal-message assistant"
                        } text-sm md:text-base leading-relaxed korean-text`}
                        style={{
                          minWidth: msg.isFromUser && msg.content.length <= 8 ? '120px' : '100px',
                          whiteSpace: msg.content.length <= 15 ? 'nowrap' : 'normal',
                          wordBreak: 'break-all',
                          textAlign: 'left',
                          direction: 'ltr'
                        }}
                      >
                        <span style={{ 
                          display: 'block', 
                          width: '100%', 
                          textAlign: 'left',
                          direction: 'ltr'
                        }}>
                          {msg.content}
                        </span>
                      </div>
                      
                      {/* 타임스탬프 */}
                      {!msg.isFromUser && (
                        <div className="flex items-center gap-2 mt-1 ml-1">
                          <span className="text-xs text-muted-foreground">
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ko-KR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : ''}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          {/* 타이핑 인디케이터 */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="minimal-message assistant flex items-center gap-1">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                </div>
                <span className="text-xs ml-2">{t.chat?.typing || "메시지 작성 중..."}</span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 메시지 입력 영역 */}
      <div className={`${isTablet ? 'static' : 'fixed'} bottom-0 left-0 right-0 z-40 bg-background border-t p-4 flex-shrink-0`}>
        <div className="flex items-end gap-2 w-full max-w-full">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={t.chat?.inputPlaceholder || "메시지를 입력하세요..."}
              className="w-full resize-none border rounded-2xl px-4 py-3 pr-12 bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px] max-h-32 overflow-y-auto korean-text"
              rows={1}
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="min-w-[44px] h-[44px] rounded-full bg-primary hover:bg-primary/90 text-primary-foreground flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* File Upload Modal */}
      {showFileModal && (
        <FileUploadModal
          agent={agent}
          isOpen={showFileModal}
          onClose={() => setShowFileModal(false)}
          onSuccess={(message) => addSystemMessage(message)}
        />
      )}

      {/* Persona Edit Modal */}
      {showPersonaModal && (
        <PersonaEditModal
          agent={agent}
          isOpen={showPersonaModal}
          onClose={() => setShowPersonaModal(false)}
          onSuccess={(message1, message2) => {
            addSystemMessage(message1);
            addSystemMessage(message2);
          }}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <ChatbotSettingsModal
          agent={agent}
          isOpen={showSettingsModal}
          onClose={() => setShowSettingsModal(false)}
          onSuccess={(message1, message2) => {
            addSystemMessage(message1);
            addSystemMessage(message2);
          }}
        />
      )}

      {/* Icon Change Modal */}
      {showIconModal && (
        <IconChangeModal
          agent={agent}
          isOpen={showIconModal}
          onClose={() => setShowIconModal(false)}
          onSuccess={(message) => addSystemMessage(message)}
        />
      )}

      {/* File List Modal */}
      {showFileListModal && (
        <Dialog open={showFileListModal} onOpenChange={setShowFileListModal}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="korean-text">업로드된 문서</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-2">
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8 korean-text">
                  업로드된 문서가 없습니다.
                </p>
              ) : (
                documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium korean-text">{doc.originalName}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(doc.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/documents/${doc.id}/download`;
                          link.download = doc.originalName;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteConfirmModal} onOpenChange={setShowDeleteConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="korean-text">대화방 나가기</DialogTitle>
            <DialogDescription className="korean-text">
              이 대화방을 나가면 모든 대화 기록이 삭제됩니다. 
              삭제된 대화는 복구할 수 없습니다. 
              정말 나가시겠습니까?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmModal(false)}
              className="korean-text"
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (conversation?.id) {
                  deleteConversationMutation.mutate(conversation.id);
                }
              }}
              disabled={deleteConversationMutation.isPending}
              className="korean-text"
            >
              {deleteConversationMutation.isPending ? "삭제 중..." : "나가기"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;