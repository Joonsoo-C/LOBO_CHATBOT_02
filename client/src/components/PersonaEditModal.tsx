import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PersonaEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: any;
}

interface PersonaData {
  name: string;
  description: string;
  speakingStyle: string;
  personalityTraits: string;
  prohibitedWordResponse: string;
  visibility: string;
  upperCategory: string;
  lowerCategory: string;
  detailCategory: string;
}

const VISIBILITY_OPTIONS = [
  { value: "public", label: "조직 전체 - 소속 조직의 모든 구성원이 사용 가능" },
  { value: "group", label: "그룹 지정 - 특정 그룹의 사용자만 사용 가능" },
  { value: "custom", label: "사용자 지정 - 개별 사용자 선택" },
  { value: "private", label: "프라이빗 - 관리자만 사용 가능" }
];

export default function PersonaEditModal({ isOpen, onClose, agent }: PersonaEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [personaData, setPersonaData] = useState<PersonaData>({
    name: "",
    description: "",
    speakingStyle: "",
    personalityTraits: "",
    prohibitedWordResponse: "",
    visibility: "public",
    upperCategory: "",
    lowerCategory: "",
    detailCategory: ""
  });

  // Initialize persona data when agent changes
  useEffect(() => {
    if (agent && isOpen) {
      setPersonaData({
        name: agent.name || "",
        description: agent.description || "",
        speakingStyle: agent.speakingStyle || "",
        personalityTraits: agent.personalityTraits || "",
        prohibitedWordResponse: agent.prohibitedWordResponse || "",
        visibility: agent.visibility || "public",
        upperCategory: agent.upperCategory || "",
        lowerCategory: agent.lowerCategory || "",
        detailCategory: agent.detailCategory || ""
      });
    }
  }, [agent, isOpen]);

  const handleInputChange = (field: keyof PersonaData, value: string) => {
    setPersonaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updatePersonaMutation = useMutation({
    mutationFn: async (data: PersonaData) => {
      return apiRequest(`/api/admin/agents/${agent.id}/persona`, "PATCH", data);
    },
    onSuccess: () => {
      toast({
        title: "페르소나 수정 완료",
        description: "에이전트의 페르소나가 성공적으로 수정되었습니다."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "수정 실패",
        description: error.message || "페르소나 수정 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePersonaMutation.mutate(personaData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium korean-text">페르소나 편집</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="korean-text">에이전트 이름</Label>
              <Input
                id="name"
                value={personaData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="에이전트 이름을 입력하세요"
                className="korean-text"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category" className="korean-text">카테고리</Label>
              <Select value={agent?.category || ""} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="카테고리" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="학교">학교</SelectItem>
                  <SelectItem value="교수">교수</SelectItem>
                  <SelectItem value="학생">학생</SelectItem>
                  <SelectItem value="그룹">그룹</SelectItem>
                  <SelectItem value="기능형">기능형</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* LLM Model and Chatbot Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="llmModel" className="korean-text">LLM 모델 선택</Label>
              <Select value="gpt-4o" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="GPT-4o (권장)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4o">GPT-4o (권장)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="chatbotType" className="korean-text">챗봇 유형 선택</Label>
              <Select value="doc-fallback-llm" disabled>
                <SelectTrigger>
                  <SelectValue placeholder="문서 우선 + LLM 보완" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doc-fallback-llm">문서 우선 + LLM 보완</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="korean-text">설명</Label>
            <Textarea
              id="description"
              value={personaData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="에이전트의 역할과 기능을 설명하세요"
              className="korean-text resize-none"
              rows={3}
            />
          </div>

          {/* Organization Categories */}
          <div className="space-y-4">
            <Label className="korean-text">소속 조직</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="upperCategory" className="korean-text text-xs">상위 카테고리</Label>
                <Select value="전체" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lowerCategory" className="korean-text text-xs">하위 카테고리</Label>
                <Select value="전체" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="detailCategory" className="korean-text text-xs">세부 카테고리</Label>
                <Select value="전체" disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="전체">전체</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="button" className="w-full korean-text">적용</Button>
          </div>

          {/* Agent Manager */}
          <div className="space-y-2">
            <Label htmlFor="manager" className="korean-text">에이전트 관리자</Label>
            <Select value={agent?.managerId || ""} disabled>
              <SelectTrigger>
                <SelectValue placeholder="정 수빈 (user1081)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user1081">정 수빈 (user1081)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Speaking Style */}
          <div className="space-y-2">
            <Label htmlFor="speakingStyle" className="korean-text">성격/말투 (선택사항)</Label>
            <Textarea
              id="speakingStyle"
              value={personaData.speakingStyle}
              onChange={(e) => handleInputChange('speakingStyle', e.target.value)}
              placeholder="진정하고 전문적인 성격으로 정확한 정보를 제공"
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

          {/* Sharing Scope */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Label className="korean-text text-sm font-medium">공유 범위 설정</Label>
            
            <div className="space-y-2">
              <Label htmlFor="visibility" className="korean-text text-xs">공유 범위</Label>
              <Select 
                value={personaData.visibility} 
                onValueChange={(value) => handleInputChange('visibility', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="공유 범위를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {VISIBILITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Organization Categories for Custom Visibility */}
            {personaData.visibility === "custom" && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="upperCategory" className="korean-text text-xs">상위 카테고리</Label>
                  <Select 
                    value={personaData.upperCategory} 
                    onValueChange={(value) => {
                      handleInputChange('upperCategory', value);
                      handleInputChange('lowerCategory', '');
                      handleInputChange('detailCategory', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      <SelectItem value="대학본부">대학본부</SelectItem>
                      <SelectItem value="인문대학">인문대학</SelectItem>
                      <SelectItem value="공과대학">공과대학</SelectItem>
                      <SelectItem value="자연과학대학">자연과학대학</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lowerCategory" className="korean-text text-xs">하위 카테고리</Label>
                  <Select 
                    value={personaData.lowerCategory} 
                    onValueChange={(value) => {
                      handleInputChange('lowerCategory', value);
                      handleInputChange('detailCategory', '');
                    }}
                    disabled={!personaData.upperCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      <SelectItem value="총장실">총장실</SelectItem>
                      <SelectItem value="국어국문학과">국어국문학과</SelectItem>
                      <SelectItem value="컴퓨터공학과">컴퓨터공학과</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="detailCategory" className="korean-text text-xs">세부 카테고리</Label>
                  <Select 
                    value={personaData.detailCategory} 
                    onValueChange={(value) => handleInputChange('detailCategory', value)}
                    disabled={!personaData.upperCategory || !personaData.lowerCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">전체</SelectItem>
                      <SelectItem value="현대문학전공">현대문학전공</SelectItem>
                      <SelectItem value="소프트웨어전공">소프트웨어전공</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
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