import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent, Message, ChatResponse } from "@/types/agent";
import { Send, Upload, Settings } from "lucide-react";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const conversationType = isManagementMode ? "management" : "general";
  const conversationKey = `/api/conversations/${agent.id}/${conversationType}`;

  // Fetch conversation messages
  const { data: messages = [], isLoading } = useQuery({
    queryKey: [conversationKey],
    queryFn: async () => {
      const response = await fetch(conversationKey);
      if (!response.ok) throw new Error('대화를 불러올 수 없습니다');
      return response.json();
    },
  });

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
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: [conversationKey] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData([conversationKey]);

      // Add system message for management mode guidance
      if (isManagementMode && messages.length === 0) {
        const systemMessage: Message = {
          id: Date.now() - 1,
          conversationId: 0,
          content: `안녕하세요! ${agent.name} 에이전트 관리 모드입니다.\n\n다음 기능을 사용할 수 있습니다:\n• 🎭 페르소나 편집: 에이전트의 성격과 말투를 설정\n• 📁 문서 업로드: 에이전트가 참고할 자료 추가\n• 💬 대화 테스트: 설정한 페르소나로 대화 확인\n\n원하는 기능을 선택하거나 자유롭게 대화해보세요!`,
          isFromUser: false,
          createdAt: new Date().toISOString(),
        };
        queryClient.setQueryData([conversationKey], [systemMessage]);
      }

      // Optimistically add user message
      const optimisticUserMessage: Message = {
        id: Date.now(),
        conversationId: 0,
        content,
        isFromUser: true,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData([conversationKey], (old: Message[] = []) => [
        ...old,
        optimisticUserMessage,
      ]);

      return previousMessages;
    },
    onSuccess: (data: ChatResponse) => {
      // Replace optimistic message with real data
      queryClient.setQueryData([conversationKey], (old: Message[] = []) => {
        const withoutOptimistic = old.slice(0, -1);
        return [...withoutOptimistic, data.userMessage, data.aiMessage];
      });
    },
    onError: (error: Error, variables, context) => {
      // Rollback to previous state
      if (context) {
        queryClient.setQueryData([conversationKey], context as Message[]);
      }
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

    sendMessageMutation.mutate(message);
    setMessage("");
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileUploadSuccess = (message: string) => {
    // Add system message about successful upload
    const systemMessage: Message = {
      id: Date.now(),
      conversationId: 0,
      content: `✅ ${message}\n\n업로드된 문서가 에이전트의 지식베이스에 추가되었습니다. 이제 이 정보를 바탕으로 더 정확한 답변을 제공할 수 있습니다.`,
      isFromUser: false,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData([conversationKey], (old: Message[] = []) => [
      ...old,
      systemMessage,
    ]);
  };

  const handlePersonaEditSuccess = (message: string) => {
    // Add system message about successful persona edit
    const systemMessage: Message = {
      id: Date.now(),
      conversationId: 0,
      content: `✅ ${message}\n\n페르소나 설정이 완료되었습니다. 새로운 설정으로 대화를 시작해보세요!`,
      isFromUser: false,
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData([conversationKey], (old: Message[] = []) => [
      ...old,
      systemMessage,
    ]);
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
              <h2 className="font-semibold">{agent.name}</h2>
              <p className="text-sm text-muted-foreground">{agent.description}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Badge variant="outline">{agent.category}</Badge>
            {isManagementMode && (
              <Badge variant="secondary">관리 모드</Badge>
            )}
          </div>
        </div>

        {/* Management Tools */}
        {isManagementMode && (
          <>
            <Separator className="my-4" />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPersonaModalOpen(true)}
                className="flex items-center space-x-1"
              >
                <Settings className="h-4 w-4" />
                <span>페르소나 편집</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFileModalOpen(true)}
                className="flex items-center space-x-1"
              >
                <Upload className="h-4 w-4" />
                <span>문서 업로드</span>
              </Button>
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
                <p className="whitespace-pre-line">{msg.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {format(new Date(msg.createdAt), "HH:mm", { locale: ko })}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-4">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            disabled={sendMessageMutation.isPending}
            className="flex-1"
          />
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