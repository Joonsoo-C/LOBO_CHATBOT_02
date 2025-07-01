import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { format, isToday, isYesterday } from "date-fns";
import { ko } from "date-fns/locale";
import PDFViewer from "./PDFViewer";
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
  Bell,
  Files,
  Download,
  Smile,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Laugh,
  Angry,
  Trash2,
  GraduationCap,
  Code,
  Bot,
  FlaskRound,
  RefreshCw,
  Map,
  Languages,
  Dumbbell,
  Database,
  Lightbulb,
  Calendar,
  Pen
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
import IconChangeModal from "./IconChangeModal";
import { useIsTablet } from "@/hooks/use-tablet";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Agent, Message, ChatResponse, Conversation } from "@/types/agent";

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

export default function ChatInterface({ agent, isManagementMode = false }: ChatInterfaceProps) {
  const isTablet = useIsTablet();
  const { t, language } = useLanguage();
  const [message, setMessage] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showFileListModal, setShowFileListModal] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [notificationState, setNotificationState] = useState<"idle" | "waiting_input" | "waiting_approval">("idle");
  const [pendingNotification, setPendingNotification] = useState("");
  const [hasMarkedAsRead, setHasMarkedAsRead] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<number | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<number, string>>({});
  const [showDocumentPreview, setShowDocumentPreview] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [showPDFViewer, setShowPDFViewer] = useState(false);
  const [selectedPDFDocument, setSelectedPDFDocument] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch reactions for conversation
  const { data: conversationReactions } = useQuery({
    queryKey: [`/api/conversations/${conversation?.id}/reactions`],
    enabled: !!conversation?.id,
  });

  // Update local state when reactions are fetched
  useEffect(() => {
    if (conversationReactions) {
      const reactionMap: Record<number, string> = {};
      Object.entries(conversationReactions).forEach(([messageId, reaction]) => {
        if (reaction) {
          reactionMap[parseInt(messageId)] = (reaction as any).reaction;
        }
      });
      setMessageReactions(reactionMap);
    }
  }, [conversationReactions]);

  // Reaction mutations
  const createReactionMutation = useMutation({
    mutationFn: async ({ messageId, reaction }: { messageId: number; reaction: string }) => {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction }),
      });
      if (!response.ok) throw new Error('Failed to create reaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversation?.id}/reactions`] });
    },
  });

  const deleteReactionMutation = useMutation({
    mutationFn: async (messageId: number) => {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete reaction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversation?.id}/reactions`] });
    },
  });

  // Function to add system message from agent
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: -(Date.now() + Math.floor(Math.random() * 10000)), // Negative ID for optimistic messages
      conversationId: conversation?.id || 0,
      content: `🔧 ${content}`, // Add system indicator prefix
      isFromUser: false,
      createdAt: new Date().toISOString(),
    };
    setOptimisticMessages(prev => [...prev, systemMessage]);
  };

  // Function to check if a message is a system message
  const isSystemMessage = (content: string): boolean => {
    // System prefix indicators
    if (content.startsWith('🔧') || content.startsWith('⚙️') || content.startsWith('📋')) {
      return true;
    }
    
    // Notification keywords
    const notificationKeywords = [
      '업로드되었습니다', '전송되었습니다', '완료되었습니다', '편집 창을 열었습니다',
      '설정 창을 열었습니다', '알림 내용을', '성과 분석', '관리자 모드', '명령어:',
      '새로운 문서', '새로운 기능이', '추가 되었습니다', '결과입니다', '브로드캐스트',
      '세 결과', 'Document upload notification'
    ];
    
    // Check for notification keywords
    for (const keyword of notificationKeywords) {
      if (content.includes(keyword)) {
        return true;
      }
    }
    
    // System icons
    const systemIcons = ['📊', '📈', '🔍', '⚙️', '🔧', '📋', '✅', '⚠️', '📄'];
    for (const icon of systemIcons) {
      if (content.includes(icon)) {
        return true;
      }
    }
    
    // Short system messages (likely notifications)
    if (content.length < 100) {
      const systemPatterns = [
        /입니다\.?$/,     // ends with "입니다"
        /됩니다\.?$/,     // ends with "됩니다"
        /했습니다\.?$/,   // ends with "했습니다"
        /있습니다\.?$/,   // ends with "있습니다"
        /B\d+/,          // contains B followed by numbers
        /결과/,          // contains "결과"
        /알림/,          // contains "알림"
        /기능/,          // contains "기능"
        /추가/,          // contains "추가"
        /변경/,          // contains "변경"
        /설정/           // contains "설정"
      ];
      
      for (const pattern of systemPatterns) {
        if (pattern.test(content)) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Reaction handlers
  const handleReactionToggle = (messageId: number) => {
    setActiveReactionMessageId(prev => prev === messageId ? null : messageId);
  };

  const handleReactionSelect = (messageId: number, reaction: string) => {
    const currentReaction = messageReactions[messageId];
    
    if (currentReaction === reaction) {
      // Remove reaction if same reaction is clicked
      deleteReactionMutation.mutate(messageId);
      setMessageReactions(prev => {
        const newReactions = { ...prev };
        delete newReactions[messageId];
        return newReactions;
      });
    } else {
      // Set new reaction
      createReactionMutation.mutate({ messageId, reaction });
      setMessageReactions(prev => ({
        ...prev,
        [messageId]: reaction
      }));
    }
    
    setActiveReactionMessageId(null);
  };

  const reactionOptions = [
    { emoji: '👍', icon: ThumbsUp, label: 'Like' },
    { emoji: '👎', icon: ThumbsDown, label: 'Dislike' }
  ];


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

  // Get agent documents for file list
  const { data: documents = [] } = useQuery<any[]>({
    queryKey: [`/api/agents/${agent.id}/documents`],
    enabled: showFileListModal
  });

  // Set conversation when data is available and mark as read (only once)
  useEffect(() => {
    if (conversationData && (!conversation || conversation.id !== conversationData.id)) {
      setConversation(conversationData);
      setHasMarkedAsRead(false);
      
      // Clear optimistic messages when switching conversations
      setOptimisticMessages([]);
      setIsTyping(false);
      setHasInitialScrolled(false);
      
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

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  };

  // Auto-mark conversation as read when new messages arrive while user is viewing
  useEffect(() => {
    if (conversation?.id && messages && messages.length > 0) {
      // Get current conversation data from cache
      const conversations = queryClient.getQueryData(["/api/conversations"]) as any[];
      const currentConv = conversations?.find((conv: any) => conv.id === conversation.id);
      
      // Only mark as read if there are unread messages and not already marked for this conversation
      if (currentConv && currentConv.unreadCount > 0 && !hasMarkedAsRead) {
        setHasMarkedAsRead(true);
        markAsReadMutation.mutate(conversation.id);
      }
      
      // Scroll to bottom when new messages arrive
      setTimeout(() => scrollToBottom(), 50);
    }
  }, [messages?.length, conversation?.id, queryClient, markAsReadMutation, hasMarkedAsRead]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!conversation?.id) {
        throw new Error("No conversation found");
      }
      
      const response = await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content,
        isFromUser: true,
        userLanguage: language,
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
        id: -(Date.now() + Math.floor(Math.random() * 10000)), // Negative ID for optimistic messages
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
      // Handle trigger actions from AI response
      if ((data as any).aiMessage?.triggerAction) {
        setTimeout(() => {
          switch ((data as any).aiMessage.triggerAction) {
            case "openPersonaModal":
              setShowPersonaModal(true);
              break;
            case "openSettingsModal":
              setShowSettingsModal(true);
              break;
            case "openFileModal":
              setShowFileModal(true);
              break;
            case "startNotification":
              setNotificationState("waiting_input");
              break;
          }
        }, 500);
      }
      
      // Update messages cache more safely
      queryClient.setQueryData([`/api/conversations/${conversation?.id}/messages`], (oldMessages: Message[] = []) => {
        // Create a copy of existing messages
        const existingMessages = [...oldMessages];
        
        // Check if user message already exists (by content and timestamp proximity)
        const userMessageExists = existingMessages.some(msg => 
          msg.isFromUser && 
          msg.content === data.userMessage.content && 
          Math.abs(new Date(msg.createdAt).getTime() - new Date(data.userMessage.createdAt).getTime()) < 10000
        );
        
        // Add user message if it doesn't exist
        if (!userMessageExists) {
          existingMessages.push(data.userMessage);
        }
        
        // Always add AI message (should be unique)
        existingMessages.push(data.aiMessage);
        
        return existingMessages;
      });
      
      // Clear optimistic messages and typing indicator after updating cache
      setOptimisticMessages([]);
      setIsTyping(false);
      
      // Update conversation list cache with new message data
      queryClient.setQueryData(["/api/conversations"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map(conv => 
          conv.id === conversation?.id 
            ? { 
                ...conv, 
                lastMessage: data.aiMessage,
                lastMessageAt: data.aiMessage.createdAt,
                unreadCount: 0 // Always set to 0 since user is actively viewing this conversation
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
    
    // In management mode, let the AI handle commands and trigger modals based on AI response
    // No special command handling here - let everything go through normal message flow

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
    
    // Clear message first for immediate UI feedback
    setMessage("");
    
    // Normal message sending
    sendMessageMutation.mutate(messageContent);
    
    // Scroll to bottom after sending message
    setTimeout(() => scrollToBottom(), 100);
  };

  // Format message time like messenger apps
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    
    if (isToday(date)) {
      return format(date, 'a h:mm', { locale: ko }); // 오후 3:45
    } else if (isYesterday(date)) {
      return '어제';
    } else {
      return format(date, 'M월 d일', { locale: ko }); // 12월 30일
    }
  };

  // Combine real messages with optimistic messages
  const allMessages = [...(messages || []), ...optimisticMessages];
  
  // Debug logging for message state
  console.log(`[DEBUG] ChatInterface: messages=${messages?.length || 0}, optimistic=${optimisticMessages.length}, all=${allMessages.length}`, {
    messagesLoading,
    conversationId: conversation?.id,
    agentId: agent.id
  });

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Only scroll to bottom when initially entering a conversation (one time only)
  const [hasInitialScrolled, setHasInitialScrolled] = useState(false);
  
  useEffect(() => {
    if (conversation?.id && messages && messages.length > 0 && !hasInitialScrolled) {
      // Only scroll once when first entering a conversation
      requestAnimationFrame(() => {
        const messagesContainer = document.querySelector('.chat-interface-messages');
        if (messagesContainer) {
          messagesContainer.scrollTop = messagesContainer.scrollHeight;
          setHasInitialScrolled(true);
        }
      });
    }
  }, [conversation?.id, messages, hasInitialScrolled]);

  // Reset scroll flag when conversation changes
  useEffect(() => {
    setHasInitialScrolled(false);
  }, [conversation?.id]);

  // Minimal mobile handling - remove all complex viewport logic
  useEffect(() => {
    if (!isTablet) {
      // Do nothing - let browser handle naturally
    }
  }, [isTablet]);

  // Detect device type for interaction
  const [isTouch, setIsTouch] = useState(false);
  
  useEffect(() => {
    const checkTouch = () => {
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkTouch();
    window.addEventListener('touchstart', checkTouch, { once: true });
    return () => window.removeEventListener('touchstart', checkTouch);
  }, []);

  // Click outside to close reaction popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.reaction-popup') && !target.closest('.message-content')) {
        setActiveReactionMessageId(null);
      }
    };

    if (activeReactionMessageId) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeReactionMessageId]);

  // Skip loading state and show welcome message immediately if no messages exist yet
  // This prevents the loading spinner flash before welcome message appears

  return (
    <div className={`${!isTablet ? "chat-page-container" : "chat-interface-container"} flex flex-col h-full bg-transparent overflow-hidden`}>
      {/* Mobile header removed - now using global navigation */}

      {/* Tablet Header - Simplified version without back button */}
      {isTablet && (
        <header className="relative bg-background border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: agent.backgroundColor }}
                >
                  {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) ? (
                    <img 
                      src={agent.icon} 
                      alt={`${agent.name} icon`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Failed to load custom icon: ${agent.icon}`);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    (() => {
                      const IconComponent = iconMap[agent.icon] || User;
                      return <IconComponent className="text-white w-5 h-5" />;
                    })()
                  )}
                  {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                    (() => {
                      const IconComponent = iconMap[agent.icon] || User;
                      return <IconComponent className="text-white w-5 h-5 hidden" />;
                    })()
                  )}
                </div>
                <div>
                  <h3 className="font-medium text-foreground korean-text">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground korean-text">
                    {isManagementMode ? "관리자 모드" : "일반 대화"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {/* Files Button - Only visible in general mode */}
                {!isManagementMode && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2"
                    onClick={() => setShowFileListModal(true)}
                  >
                    <Files className="w-4 h-4" />
                  </Button>
                )}
                
                {isManagementMode && (
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
                      <>
                        {/* Invisible overlay to catch outside clicks */}
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
                                setShowIconModal(true);
                                setShowMenu(false);
                                addSystemMessage("아이콘 변경 창을 열었습니다. 에이전트의 아이콘과 배경색을 변경할 수 있습니다.");
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              아이콘 변경
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
                              onClick={() => {
                                setShowFileListModal(true);
                                setShowMenu(false);
                                addSystemMessage("문서 관리 창을 열었습니다. 업로드된 문서를 확인하고 삭제할 수 있습니다.");
                              }}
                            >
                              <Files className="w-4 h-4 mr-2" />
                              문서 관리
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="w-full justify-start px-4 py-2 korean-text"
                              onClick={async () => {
                                setShowMenu(false);
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
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              성과 분석
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Chat Messages */}
      <div 
        className={`chat-interface-messages ${!isTablet ? "mobile-messages-container" : "flex-1"} px-4 overflow-y-auto chat-scroll chat-messages ${isTablet ? "md:px-12" : "md:px-6"}`}
        style={{ 
          paddingTop: isTablet ? '1rem' : '0', 
          paddingBottom: isTablet ? '1rem' : '40px',
        }}
      >
        <div className="messages-container space-y-4">
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
                const showReactionOptions = activeReactionMessageId === msg.id;
                const messageReaction = messageReactions[msg.id];
                
                // Generate unique key to prevent React key conflicts
                const uniqueKey = msg.id ? `msg-${msg.id}-${index}` : `optimistic-${index}-${Date.now()}-${Math.random()}`;
                
                return (
                  <div key={uniqueKey} className="message-row">
                    <div 
                      className="relative w-full"
                      onMouseEnter={() => {
                        if (!msg.isFromUser && !isSystem) {
                          if (hoverTimeoutRef.current) {
                            clearTimeout(hoverTimeoutRef.current);
                            hoverTimeoutRef.current = null;
                          }
                          setActiveReactionMessageId(msg.id);
                        }
                      }}
                      onMouseLeave={() => {
                        if (!msg.isFromUser && !isSystem) {
                          hoverTimeoutRef.current = setTimeout(() => {
                            setActiveReactionMessageId(null);
                            hoverTimeoutRef.current = null;
                          }, 800);
                        }
                      }}
                    >
                        <div className="flex items-end gap-1">
                          <div
                            className={`${
                              msg.isFromUser
                                ? "minimal-message user"
                                : isSystem
                                  ? "minimal-message system-message"
                                  : "minimal-message assistant"
                            } text-sm md:text-base leading-relaxed korean-text`}
                            onClick={() => {
                              if (!msg.isFromUser && !isSystem) {
                                handleReactionToggle(msg.id);
                              }
                            }}
                          >
                            {msg.content}
                          </div>
                          
                          {/* Time display for AI messages only */}
                          {!msg.isFromUser && !isSystem && msg.createdAt && (
                            <span className="text-xs text-muted-foreground flex-shrink-0 pb-1">
                              {formatMessageTime(msg.createdAt)}
                            </span>
                          )}
                        </div>
                        
                        {/* Reaction Options - positioned to the right of AI messages */}
                        {!msg.isFromUser && !isSystem && showReactionOptions && (
                          <div 
                            className="hidden md:flex gap-1 bg-background border border-border rounded-full shadow-lg px-1 py-1 animate-in fade-in-0 zoom-in-95 duration-150 z-50 absolute left-full top-0 ml-16"
                            onClick={(e) => e.stopPropagation()}
                            onMouseEnter={() => {
                              if (hoverTimeoutRef.current) {
                                clearTimeout(hoverTimeoutRef.current);
                                hoverTimeoutRef.current = null;
                              }
                              setActiveReactionMessageId(msg.id);
                            }}
                            onMouseLeave={() => {
                              hoverTimeoutRef.current = setTimeout(() => {
                                setActiveReactionMessageId(null);
                                hoverTimeoutRef.current = null;
                              }, 800);
                            }}
                          >
                            {reactionOptions.map((option) => (
                              <button
                                key={option.emoji}
                                className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactionSelect(msg.id, option.emoji);
                                }}
                                title={option.label}
                              >
                                {option.emoji === '👍' ? (
                                  <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ThumbsDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Message Reaction Display */}
                        {!msg.isFromUser && !isSystem && messageReaction && (
                          <div className="absolute -bottom-2 left-0 transform translate-y-full">
                            <span className="text-lg bg-background/80 rounded-full px-2 py-1 border border-border">
                              {messageReaction}
                            </span>
                          </div>
                        )}

                        {/* Mobile: Reaction Options below message */}
                        {!msg.isFromUser && !isSystem && showReactionOptions && (
                          <div className="md:hidden absolute top-full left-0 mt-2 flex gap-1 bg-background border border-border rounded-full shadow-lg px-1 py-1 animate-in fade-in-0 zoom-in-95 duration-150 z-50">
                            {reactionOptions.map((option) => (
                              <button
                                key={option.emoji}
                                className="w-6 h-6 rounded-full bg-muted hover:bg-muted/80 transition-colors flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactionSelect(msg.id, option.emoji);
                                }}
                                title={option.label}
                              >
                                {option.emoji === '👍' ? (
                                  <ThumbsUp className="w-3 h-3 text-muted-foreground" />
                                ) : (
                                  <ThumbsDown className="w-3 h-3 text-muted-foreground" />
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="message-row">
                  <div className="minimal-message assistant max-w-[120px]" style={{ float: 'left', clear: 'both' }}>
                    <div className="flex items-center justify-center py-1">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Auto-scroll anchor */}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>



      {/* Message Input */}
      <div className={`minimal-input-container ${isTablet ? "chat-input-area" : "fixed-chat-input"}`}>
        <textarea
          placeholder={t('chat.inputPlaceholder')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          className="minimal-input korean-text"
          disabled={sendMessageMutation.isPending}
          rows={1}
          style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = Math.min(target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          className="minimal-send-button"
          onClick={handleSendMessage}
          disabled={!message.trim() || sendMessageMutation.isPending}
        >
          <Send className="w-4 h-4" />
        </button>
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

      {/* Icon Change Modal */}
      {showIconModal && (
        <IconChangeModal
          agent={agent}
          isOpen={showIconModal}
          onClose={() => setShowIconModal(false)}
          onSuccess={addSystemMessage}
        />
      )}

      {/* File List Modal */}
      {showFileListModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowFileListModal(false)}>
          <div className="bg-background border border-border rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold korean-text">업로드된 파일</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileListModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            {Array.isArray(documents) && documents.length > 0 ? (
              <div className="space-y-3">
                {documents.map((doc: any) => (
                  <div
                    key={doc.id}
                    className="w-full p-4 bg-muted rounded-lg border border-border"
                  >
                    <div className="flex items-start justify-between w-full">
                      <div className="flex items-start space-x-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium korean-text break-words mb-1">
                            {doc.originalName || doc.filename}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>
                              크기: {doc.size ? (doc.size / (1024 * 1024)).toFixed(2) + ' MB' : '알 수 없음'}
                            </span>
                            <span>•</span>
                            <span>
                              업로드: {new Date(doc.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-green-100 dark:hover:bg-green-900/20"
                          onClick={async () => {
                            // Check if it's a PDF file
                            if (doc.mimeType === 'application/pdf') {
                              setSelectedPDFDocument(doc);
                              setShowPDFViewer(true);
                            } else {
                              // For non-PDF files, use the original preview
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/content`, {
                                  credentials: 'include'
                                });
                                if (response.ok) {
                                  const docContent = await response.json();
                                  setSelectedDocument(docContent);
                                  setShowDocumentPreview(true);
                                } else {
                                  toast({
                                    title: "미리보기 실패",
                                    description: "문서 내용을 불러올 수 없습니다.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "오류 발생",
                                  description: "문서 내용 조회 중 오류가 발생했습니다.",
                                  variant: "destructive",
                                });
                              }
                            }
                          }}
                          title="문서 내용 미리보기"
                        >
                          <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />
                        </Button>
                        {(!doc.content || doc.content.length < 50) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-orange-100 dark:hover:bg-orange-900/20"
                            onClick={async () => {
                              try {
                                const response = await fetch(`/api/documents/${doc.id}/reprocess`, {
                                  method: 'POST',
                                  credentials: 'include'
                                });
                                if (response.ok) {
                                  const result = await response.json();
                                  toast({
                                    title: "재처리 완료",
                                    description: `문서 내용을 성공적으로 추출했습니다. (${result.extractedLength}자)`,
                                  });
                                  // Refresh documents list
                                  window.location.reload();
                                } else {
                                  toast({
                                    title: "재처리 실패",
                                    description: "문서 재처리 중 오류가 발생했습니다.",
                                    variant: "destructive",
                                  });
                                }
                              } catch (error) {
                                toast({
                                  title: "오류 발생",
                                  description: "문서 재처리 요청 중 오류가 발생했습니다.",
                                  variant: "destructive",
                                });
                              }
                            }}
                            title="문서 내용 재처리"
                          >
                            <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/20"
                          onClick={() => {
                            // Download file
                            const link = document.createElement('a');
                            link.href = `/api/documents/${doc.id}/download`;
                            link.download = doc.originalName || doc.filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          title="파일 다운로드"
                        >
                          <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        </Button>
                        {isManagementMode && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20"
                            onClick={async () => {
                              if (confirm('이 문서를 삭제하시겠습니까?')) {
                                try {
                                  const response = await fetch(`/api/agents/${agent.id}/documents/${doc.id}`, {
                                    method: 'DELETE',
                                    credentials: 'include'
                                  });
                                  
                                  if (response.ok) {
                                    toast({
                                      title: "문서 삭제 완료",
                                      description: "문서가 성공적으로 삭제되었습니다.",
                                    });
                                    // Force refresh the documents list
                                    await queryClient.invalidateQueries({
                                      queryKey: [`/api/agents/${agent.id}/documents`]
                                    });
                                    // Also force refetch immediately
                                    await queryClient.refetchQueries({
                                      queryKey: [`/api/agents/${agent.id}/documents`]
                                    });
                                  } else {
                                    throw new Error('삭제 실패');
                                  }
                                } catch (error) {
                                  toast({
                                    title: "삭제 실패",
                                    description: "문서 삭제 중 오류가 발생했습니다.",
                                    variant: "destructive",
                                  });
                                }
                              }
                            }}
                            title="문서 삭제"
                          >
                            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground korean-text">업로드된 파일이 없습니다</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Content Preview Modal */}
      {showDocumentPreview && selectedDocument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold korean-text break-words">
                  {selectedDocument.originalName}
                </h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span>크기: {selectedDocument.size ? (selectedDocument.size / (1024 * 1024)).toFixed(2) + ' MB' : '알 수 없음'}</span>
                  <span>•</span>
                  <span>업로드: {new Date(selectedDocument.createdAt).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</span>
                  <span>•</span>
                  <span>업로드자: {selectedDocument.uploadedBy}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="p-2 ml-4"
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedDocument(null);
                }}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="h-full overflow-y-auto">
                {selectedDocument.content ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <pre className="whitespace-pre-wrap korean-text text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border">
                      {selectedDocument.content}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground korean-text text-lg mb-2">내용을 표시할 수 없습니다</p>
                    <p className="text-muted-foreground korean-text text-sm">
                      이 문서에서 텍스트를 추출할 수 없거나 지원되지 않는 형식입니다.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <Button
                variant="outline"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `/api/documents/${selectedDocument.id}/download`;
                  link.download = selectedDocument.originalName;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="korean-text"
              >
                <Download className="w-4 h-4 mr-2" />
                파일 다운로드
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowDocumentPreview(false);
                  setSelectedDocument(null);
                }}
                className="korean-text"
              >
                닫기
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPDFViewer && selectedPDFDocument && (
        <PDFViewer
          documentId={selectedPDFDocument.id}
          documentName={selectedPDFDocument.originalName || selectedPDFDocument.filename}
          onClose={() => {
            setShowPDFViewer(false);
            setSelectedPDFDocument(null);
          }}
          onContentExtracted={(content) => {
            // Handle extracted content if needed
            console.log('Extracted content:', content);
          }}
        />
      )}
    </div>
  );
}