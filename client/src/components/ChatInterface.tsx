import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent, Message, ChatResponse } from "@/types/agent";
import { Send, Upload, Settings, MoreVertical, Bot, FileText, MessageSquare, Users, TrendingUp, BarChart3 } from "lucide-react";
import FileUploadModal from "./FileUploadModal";
import PersonaEditModal from "./PersonaEditModal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface ChatInterfaceProps {
  agent: Agent;
  isManagementMode?: boolean;
}

export default function ChatInterface({ agent, isManagementMode = false }: ChatInterfaceProps) {
  const [message, setMessage] = useState("");
  const [isFileModalOpen, setIsFileModalOpen] = useState(false);
  const [isPersonaModalOpen, setIsPersonaModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isAnnouncementMode, setIsAnnouncementMode] = useState(false);
  const [pendingAnnouncement, setPendingAnnouncement] = useState("");
  const [systemMessages, setSystemMessages] = useState<Message[]>([]);
  const [optimisticMessages, setOptimisticMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const conversationType = isManagementMode ? "management" : "general";
  const conversationKey = `/api/conversations/${agent.id}/${conversationType}`;

  // Fetch conversation messages
  const { data: conversation, isLoading } = useQuery({
    queryKey: [conversationKey],
    queryFn: async () => {
      const response = await fetch(conversationKey);
      if (!response.ok) throw new Error('대화를 불러올 수 없습니다');
      return response.json();
    },
  });

  const messages = [...systemMessages, ...(conversation || []), ...optimisticMessages];

  // Add system message helper
  const addSystemMessage = (content: string) => {
    const systemMessage: Message = {
      id: Date.now(),
      conversationId: 0,
      content,
      isFromUser: false,
      createdAt: new Date().toISOString(),
    };
    setSystemMessages(prev => [...prev, systemMessage]);
  };

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string): Promise<ChatResponse> => {
      const response = await fetch(`/api/conversations/${agent.id}/${conversationType}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('메시지 전송에 실패했습니다');
      return response.json();
    },
    onMutate: async (content: string) => {
      // Add optimistic message
      setOptimisticMessages(prev => [...prev, {
        id: Date.now(),
        conversationId: conversation?.id || 0,
        content,
        isFromUser: true,
        createdAt: new Date().toISOString(),
      }]);
      setIsTyping(true);
      setMessage("");
    },
    onSuccess: (data: ChatResponse) => {
      // Clear optimistic messages and typing
      setOptimisticMessages([]);
      setIsTyping(false);
      
      // Invalidate query to refetch
      queryClient.invalidateQueries({ queryKey: [conversationKey] });
    },
    onError: (error: Error) => {
      setOptimisticMessages([]);
      setIsTyping(false);
      toast({
        title: "메시지 전송 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sendMessageMutation.isPending) return;

    // Handle announcement mode
    if (isAnnouncementMode) {
      if (pendingAnnouncement) {
        setPendingAnnouncement(message);
        setMessage("");
        addSystemMessage(`📢 공지사항이 설정되었습니다: "${message}"\n\n이 메시지가 사용자들에게 표시됩니다.`);
        return;
      }
    }

    // Regular message sending
    sendMessageMutation.mutate(message);
    addSystemMessage(pendingAnnouncement ? `📢 공지: ${pendingAnnouncement}\n\n사용자 메시지: ${message}` : message);
    setIsAnnouncementMode(false);
    setPendingAnnouncement("");
  };

  const handleCancel = () => {
    setMessage("");
    addSystemMessage("❌ 작업이 취소되었습니다.");
    setIsAnnouncementMode(false);
    setPendingAnnouncement("");
  };

  const handleStop = () => {
    setMessage("");
    addSystemMessage("⏹️ 대화가 중단되었습니다.");
  };

  const handleReset = () => {
    setMessage("");
    addSystemMessage("🔄 대화가 초기화되었습니다. 새로운 대화를 시작하세요.");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize management mode with welcome message
  useEffect(() => {
    if (isManagementMode && systemMessages.length === 0 && (!conversation || conversation.length === 0)) {
      addSystemMessage(`안녕하세요! ${agent.name} 에이전트 관리 모드입니다.\n\n다음 기능을 사용할 수 있습니다:\n• 🎭 페르소나 편집: 에이전트의 성격과 말투를 설정\n• 📁 문서 업로드: 에이전트가 참고할 자료 추가\n• 📊 성능 분석: 에이전트 사용량 및 통계 확인\n• 💬 대화 테스트: 설정한 페르소나로 대화 확인\n\n원하는 기능을 선택하거나 자유롭게 대화해보세요!`);
    }
  }, [isManagementMode, systemMessages.length, conversation]);

  // Management function handlers
  const handlePersonaEdit = () => {
    setIsPersonaModalOpen(true);
    setShowMenu(false);
    addSystemMessage("🎭 페르소나 편집 모드가 시작되었습니다.\n\n에이전트의 성격, 말투, 전문 분야 등을 설정할 수 있습니다.");
  };

  const handlePerformanceAnalysis = () => {
    setShowMenu(false);
    addSystemMessage(`📊 ${agent.name} 에이전트 성능 분석\n\n• 활성 사용자: 24명 (전일 대비 +12%)\n• 총 대화 수: 156회\n• 평균 응답 시간: 2.3초\n• 사용자 만족도: 4.2/5.0\n• 주요 질문 카테고리:\n  - 학사 일정: 35%\n  - 수강 신청: 28%\n  - 시설 안내: 20%\n  - 기타: 17%\n\n📈 지난 7일간 사용량이 꾸준히 증가하고 있습니다.`);
  };

  const handleAnnouncementMode = () => {
    setShowMenu(false);
    setIsAnnouncementMode(true);
    addSystemMessage("📢 공지사항 모드가 활성화되었습니다.\n\n다음 메시지가 사용자들에게 공지사항으로 전달됩니다.");
  };

  const handleFileUpload = () => {
    setIsFileModalOpen(true);
    setShowMenu(false);
    addSystemMessage("📁 문서 업로드 기능이 열렸습니다.\n\n에이전트가 참고할 문서를 업로드하여 더 정확한 답변을 제공할 수 있도록 도와주세요.");
  };

  const handleViewDocuments = () => {
    setShowMenu(false);
    addSystemMessage("📋 업로드된 문서 목록을 확인합니다.\n\n현재 등록된 문서들을 통해 에이전트가 전문적인 답변을 제공할 수 있습니다.");
  };

  const handleFileUploadSuccess = (message: string) => {
    addSystemMessage(`✅ ${message}\n\n업로드된 문서가 에이전트의 지식베이스에 추가되었습니다. 이제 이 정보를 바탕으로 더 정확한 답변을 제공할 수 있습니다.`);
  };

  const handlePersonaEditSuccess = (message: string) => {
    addSystemMessage(`✅ ${message}\n\n페르소나 설정이 완료되었습니다. 새로운 설정으로 대화를 시작해보세요!`);
    addSystemMessage("대화 테스트를 통해 새로운 페르소나가 잘 적용되었는지 확인해보세요!");
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">대화를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10" style={{ backgroundColor: agent.backgroundColor }}>
              <AvatarFallback className="text-white text-lg">
                {agent.icon}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold korean-text">{agent.name}</h2>
              <p className="text-sm text-muted-foreground korean-text">{agent.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{agent.category}</Badge>
            {isManagementMode && (
              <Badge variant="secondary" className="korean-text">관리 모드</Badge>
            )}
            {isManagementMode && (
              <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handlePersonaEdit} className="korean-text">
                    <Bot className="mr-2 h-4 w-4" />
                    페르소나 편집
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleFileUpload} className="korean-text">
                    <Upload className="mr-2 h-4 w-4" />
                    문서 업로드
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewDocuments} className="korean-text">
                    <FileText className="mr-2 h-4 w-4" />
                    문서 관리
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePerformanceAnalysis} className="korean-text">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    성능 분석
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAnnouncementMode} className="korean-text">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    공지사항 모드
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {/* Management Status */}
        {isManagementMode && (
          <>
            <Separator className="my-3" />
            <div className="space-y-2">
              {isAnnouncementMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-800 korean-text">공지사항 모드 활성</span>
                  </div>
                  <p className="text-xs text-amber-700 mt-1 korean-text">다음 메시지가 공지사항으로 전송됩니다.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg: Message) => (
            <div
              key={msg.id}
              className={`flex ${msg.isFromUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.isFromUser
                    ? "bg-primary text-primary-foreground ml-4"
                    : "bg-muted mr-4"
                }`}
              >
                <p className="whitespace-pre-line korean-text">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(msg.createdAt), "HH:mm", { locale: ko })}
                </p>
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3 mr-4">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        {isAnnouncementMode && pendingAnnouncement && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-800 korean-text">공지사항 준비: {pendingAnnouncement}</p>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={isAnnouncementMode ? "공지사항을 입력하세요..." : "메시지를 입력하세요..."}
            disabled={sendMessageMutation.isPending}
            className="flex-1 korean-text"
          />
          {isAnnouncementMode && (
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="korean-text"
            >
              취소
            </Button>
          )}
          <Button
            type="submit"
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      {/* Modals */}
      <FileUploadModal
        agent={agent}
        isOpen={isFileModalOpen}
        onClose={() => setIsFileModalOpen(false)}
        onSuccess={handleFileUploadSuccess}
      />
      <PersonaEditModal
        agent={agent}
        isOpen={isPersonaModalOpen}
        onClose={() => setIsPersonaModalOpen(false)}
        onSuccess={handlePersonaEditSuccess}
      />
    </div>
  );
}