import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  speakingStyle: string;
  knowledgeArea: string;
  personalityTraits: string;
  prohibitedWordResponse: string;
}

export default function PersonaEditModal({ agent, isOpen, onClose, onSuccess, onCancel }: PersonaEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [personaData, setPersonaData] = useState<PersonaData>({
    nickname: agent.name || "",
    speakingStyle: agent.speakingStyle || "친근하고 도움이 되는 말투",
    knowledgeArea: agent.description || "",
    personalityTraits: agent.personalityTraits || "친절하고 전문적인 성격으로 정확한 정보를 제공",
    prohibitedWordResponse: agent.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다."
  });

  // Update form data when agent changes
  useEffect(() => {
    setPersonaData({
      nickname: agent.name || "",
      speakingStyle: agent.speakingStyle || "친근하고 도움이 되는 말투",
      knowledgeArea: agent.description || "",
      personalityTraits: agent.personalityTraits || "친절하고 전문적인 성격으로 정확한 정보를 제공",
      prohibitedWordResponse: agent.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다."
    });
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
        if (personaData.speakingStyle !== agent.speakingStyle) changes.push(`말투 스타일: ${personaData.speakingStyle}`);
        
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium korean-text">에이전트 페르소나 편집</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Nickname */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="korean-text">닉네임</Label>
            <Input
              id="nickname"
              value={personaData.nickname}
              onChange={(e) => handleInputChange('nickname', e.target.value)}
              placeholder="에이전트 닉네임을 입력하세요"
              className="korean-text"
            />
          </div>

          {/* Speaking Style */}
          <div className="space-y-2">
            <Label htmlFor="speakingStyle" className="korean-text">말투 스타일</Label>
            <Textarea
              id="speakingStyle"
              value={personaData.speakingStyle}
              onChange={(e) => handleInputChange('speakingStyle', e.target.value)}
              placeholder="말투와 대화 스타일을 설명하세요"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Knowledge Area */}
          <div className="space-y-2">
            <Label htmlFor="knowledgeArea" className="korean-text">지식/전문 분야</Label>
            <Textarea
              id="knowledgeArea"
              value={personaData.knowledgeArea}
              onChange={(e) => handleInputChange('knowledgeArea', e.target.value)}
              placeholder="전문 지식 분야를 설명하세요"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Personality Traits */}
          <div className="space-y-2">
            <Label htmlFor="personalityTraits" className="korean-text">성격 특성</Label>
            <Textarea
              id="personalityTraits"
              value={personaData.personalityTraits}
              onChange={(e) => handleInputChange('personalityTraits', e.target.value)}
              placeholder="성격과 의사 표현 방식을 설명하세요"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Prohibited Word Response */}
          <div className="space-y-2">
            <Label htmlFor="prohibitedWordResponse" className="korean-text">금칙어 반응 방식</Label>
            <Textarea
              id="prohibitedWordResponse"
              value={personaData.prohibitedWordResponse}
              onChange={(e) => handleInputChange('prohibitedWordResponse', e.target.value)}
              placeholder="금칙어 탐지 시 반응 방식을 설정하세요"
              className="korean-text resize-none"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 korean-text"
              onClick={onClose}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              className="flex-1 korean-text"
              disabled={updatePersonaMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updatePersonaMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}