import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useFormChanges } from "@/hooks/useFormChanges";
import type { Agent } from "@/types/agent";

interface PersonaEditModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onCancel?: (message: string) => void;
}

interface PersonaData {
  nickname: string;
  speechStyle: string;
  knowledgeArea: string;
  personality: string;
  additionalPrompt: string;
  extraPrompt: string;
}

export default function PersonaEditModal({ agent, isOpen, onClose, onSuccess, onCancel }: PersonaEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // 원본 데이터 (초기값)
  const [originalData, setOriginalData] = useState<PersonaData>({
    nickname: agent.name || "",
    speechStyle: agent.speechStyle || "친근하고 도움이 되는 말투",
    knowledgeArea: agent.description || "",
    personality: agent.personality || "친절하고 전문적인 성격으로 정확한 정보를 제공",
    additionalPrompt: agent.additionalPrompt || "",
    extraPrompt: agent.extraPrompt || ""
  });
  
  const [personaData, setPersonaData] = useState<PersonaData>({
    nickname: agent.name || "",
    speechStyle: agent.speechStyle || "친근하고 도움이 되는 말투",
    knowledgeArea: agent.description || "",
    personality: agent.personality || "친절하고 전문적인 성격으로 정확한 정보를 제공",
    additionalPrompt: agent.additionalPrompt || "",
    extraPrompt: agent.extraPrompt || ""
  });

  // 변경사항 감지
  const hasChanges = useFormChanges(personaData, originalData);

  // Update form data when agent changes
  useEffect(() => {
    const newData = {
      nickname: agent.name || "",
      speechStyle: agent.speechStyle || "친근하고 도움이 되는 말투",
      knowledgeArea: agent.description || "",
      personality: agent.personality || "친절하고 전문적인 성격으로 정확한 정보를 제공",
      additionalPrompt: agent.additionalPrompt || "",
      extraPrompt: agent.extraPrompt || ""
    };
    
    setOriginalData(newData);
    setPersonaData(newData);
  }, [agent]);

  const updatePersonaMutation = useMutation({
    mutationFn: async (data: PersonaData) => {
      const response = await apiRequest("PUT", `/api/agents/${agent.id}/persona`, data);
      return response.json();
    },
    onSuccess: (updatedAgent) => {
      toast({
        title: "페르소나 업데이트 완료",
        description: "에이전트 페르소나가 성공적으로 업데이트되었습니다.",
      });
      
      // Send completion message to chat
      if (onSuccess) {
        const changes = [];
        if (personaData.nickname !== agent.name) changes.push(`닉네임: ${personaData.nickname}`);
        if (personaData.knowledgeArea !== agent.description) changes.push(`지식 분야: ${personaData.knowledgeArea}`);
        if (personaData.speechStyle !== agent.speechStyle) changes.push(`말투 스타일: ${personaData.speechStyle}`);
        
        const changeText = changes.length > 0 ? changes.join(', ') + ' 변경됨. ' : '';
        onSuccess(`${changeText}페르소나 설정이 저장되었습니다.`);
      }
      
      // Immediately update the cache with the fresh data from server
      queryClient.setQueryData(["/api/agents"], (oldAgents: Agent[] | undefined) => {
        if (!oldAgents) return oldAgents;
        return oldAgents.map(a => 
          a.id === agent.id ? updatedAgent : a
        );
      });
      
      // Force a fresh fetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: ["/api/agents"]
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonaMutation.mutate(personaData);
  };

  const handleInputChange = (field: keyof PersonaData, value: string) => {
    setPersonaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel("페르소나 편집을 취소하였습니다.");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] md:max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - 고정, 높이 50% 줄임 */}
        <div className="flex items-center justify-between p-3 border-b bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-2 pl-6">
            <Bot className="w-5 h-5 text-black dark:text-white" />
            <h2 className="text-lg font-medium korean-text">페르소나 설정</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-10 h-10" />
          </Button>
        </div>

        {/* Content - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6" id="persona-form">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="korean-text">닉네임</Label>
            <Input
              id="nickname"
              value={personaData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              placeholder="예: 민지, 도우미, 상담봇"
              className="korean-text"
            />
          </div>

          {/* Speech Style */}
          <div className="space-y-2">
            <Label htmlFor="speechStyle" className="korean-text">말투 스타일</Label>
            <Textarea
              id="speechStyle"
              value={personaData.speechStyle}
              onChange={(e) => handleInputChange('speechStyle', e.target.value)}
              placeholder="예: 친구처럼 편안한 말투로 말해주세요."
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Knowledge Area */}
          <div className="space-y-2">
            <Label htmlFor="knowledgeArea" className="korean-text">역할/ 지식/ 전문 분야</Label>
            <Textarea
              id="knowledgeArea"
              value={personaData.knowledgeArea}
              onChange={(e) => handleInputChange('knowledgeArea', e.target.value)}
              placeholder="예: 입학상담, 진로코칭, 프로그래밍, 영어 에세이 등"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Personality */}
          <div className="space-y-2">
            <Label htmlFor="personality" className="korean-text">성격 특성</Label>
            <Textarea
              id="personality"
              value={personaData.personality}
              onChange={(e) => handleInputChange('personality', e.target.value)}
              placeholder="예: 친절하고 인내심 있는 성격, 논리적인 사고, 유머감각 있음 등"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Additional Prompt */}
          <div className="space-y-2">
            <Label htmlFor="additionalPrompt" className="korean-text">추가 프롬프트</Label>
            <Textarea
              id="additionalPrompt"
              value={personaData.additionalPrompt}
              onChange={(e) => handleInputChange('additionalPrompt', e.target.value)}
              placeholder="예: 간단하고 정중한 말투로, 최대 5줄 이내 요약&#10;예: 숫자와 항목이 있는 리스트 형식으로 대답&#10;예: 감정적인 질문에는 공감 표현을 포함"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Extra Prompt */}
          <div className="space-y-2">
            <Label htmlFor="extraPrompt" className="korean-text">추가 프롬프트</Label>
            <Textarea
              id="extraPrompt"
              value={personaData.extraPrompt}
              onChange={(e) => handleInputChange('extraPrompt', e.target.value)}
              placeholder="예: 간단하고 정중한 말투로, 최대 5줄 이내 요약&#10;예: 숫자와 항목이 있는 리스트 형식으로 대답&#10;예: 감정적인 질문에는 공감 표현을 포함"
              className="korean-text resize-none"
              rows={4}
            />
          </div>

          </form>
        </div>
        
        {/* 고정 버튼 영역 */}
        <div className="border-t p-3 flex-shrink-0">
          <div className="flex space-x-3">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 korean-text"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button 
              form="persona-form"
              type="submit" 
              className="flex-1 korean-text"
              disabled={updatePersonaMutation.isPending || !hasChanges}
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePersonaMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}