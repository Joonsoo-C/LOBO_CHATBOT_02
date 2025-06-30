import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Save, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@/types/agent";

interface ChatbotSettingsModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onCancel?: (message: string) => void;
}

interface ChatbotSettings {
  llmModel: string;
  chatbotType: string;
  visibility: string;
  upperCategory?: string;
  lowerCategory?: string;
  detailCategory?: string;
}

const LLM_MODELS = [
  { value: "gpt-4o", label: "GPT-4o (추천)" },
  { value: "gpt-4o-mini", label: "GPT-4o Mini (빠름)" },
  { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo (경제적)" }
];

const CHATBOT_TYPES = [
  { 
    value: "strict-doc", 
    label: "문서 기반 전용",
    description: "문서 기반 응답만 가능, 문서 외 질문은 부드럽게 거절"
  },
  { 
    value: "doc-fallback-llm", 
    label: "문서 우선 + LLM",
    description: "문서를 우선 사용하고 없으면 일반 LLM 결과 출력"
  },
  { 
    value: "general-llm", 
    label: "일반 챗봇",
    description: "일반 LLM 챗봇처럼 자유 대화"
  }
];

const VISIBILITY_OPTIONS = [
  { 
    value: "public", 
    label: "조직 전체 - 소속 조직의 모든 구성원이 사용 가능" 
  },
  { 
    value: "group", 
    label: "그룹 지정 - 특정 그룹의 사용자만 사용 가능" 
  },
  { 
    value: "organization", 
    label: "사용자 지정 - 개별 사용자 선택" 
  },
  { 
    value: "private", 
    label: "프라이빗 - 관리자만 사용 가능" 
  }
];

export default function ChatbotSettingsModal({ agent, isOpen, onClose, onSuccess, onCancel }: ChatbotSettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch organization categories
  const { data: organizationCategories = [] } = useQuery({
    queryKey: ["/api/organization-categories"],
    enabled: isOpen,
  });

  // Get unique upper categories
  const getUpperCategories = () => {
    if (!Array.isArray(organizationCategories)) return [];
    const upperCats: string[] = [];
    organizationCategories.forEach((org: any) => {
      if (org.upperCategory && !upperCats.includes(org.upperCategory)) {
        upperCats.push(org.upperCategory);
      }
    });
    return upperCats;
  };

  // Get lower categories for selected upper category
  const getLowerCategories = (upperCategory: string) => {
    if (!upperCategory || !Array.isArray(organizationCategories)) return [];
    const lowerCats: string[] = [];
    organizationCategories.forEach((org: any) => {
      if (org.upperCategory === upperCategory && org.lowerCategory && !lowerCats.includes(org.lowerCategory)) {
        lowerCats.push(org.lowerCategory);
      }
    });
    return lowerCats;
  };

  // Get detail categories for selected upper and lower categories
  const getDetailCategories = (upperCategory: string, lowerCategory: string) => {
    if (!upperCategory || !lowerCategory || !Array.isArray(organizationCategories)) return [];
    const detailCats: string[] = [];
    organizationCategories.forEach((org: any) => {
      if (org.upperCategory === upperCategory && org.lowerCategory === lowerCategory && org.detailCategory && !detailCats.includes(org.detailCategory)) {
        detailCats.push(org.detailCategory);
      }
    });
    return detailCats;
  };
  
  const [settings, setSettings] = useState<ChatbotSettings>({
    llmModel: (agent as any).llmModel || "gpt-4o",
    chatbotType: (agent as any).chatbotType || "general-llm",
    visibility: (agent as any).visibility || "public",
    upperCategory: (agent as any).upperCategory || "",
    lowerCategory: (agent as any).lowerCategory || "",
    detailCategory: (agent as any).detailCategory || ""
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: ChatbotSettings) => {
      const response = await apiRequest("PUT", `/api/agents/${agent.id}/settings`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "챗봇 설정 업데이트 완료",
        description: "챗봇 설정이 성공적으로 업데이트되었습니다.",
      });
      
      // Send completion message to chat
      if (onSuccess) {
        const modelLabel = LLM_MODELS.find(m => m.value === settings.llmModel)?.label || settings.llmModel;
        const typeLabel = CHATBOT_TYPES.find(t => t.value === settings.chatbotType)?.label || settings.chatbotType;
        const visibilityLabel = VISIBILITY_OPTIONS.find(v => v.value === settings.visibility)?.label || "조직 전체";
        
        let message = `챗봇 설정이 저장되었습니다.\n\nLLM 모델: ${modelLabel}\n챗봇 유형: ${typeLabel}\n공유 범위: ${visibilityLabel}`;
        
        if (settings.visibility === "organization" && settings.upperCategory) {
          message += `\n소속 조직: ${settings.upperCategory}`;
          if (settings.lowerCategory) message += ` > ${settings.lowerCategory}`;
          if (settings.detailCategory) message += ` > ${settings.detailCategory}`;
        }
        
        onSuccess(message);
      }
      
      // Invalidate agent data to refresh
      queryClient.invalidateQueries({
        queryKey: [`/api/agents/${agent.id}`]
      });
      
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "설정 업데이트 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settings);
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel("챗봇 설정 변경을 취소하였습니다.");
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-medium korean-text">챗봇 설정</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Settings Info */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-medium korean-text text-sm">현재 설정</h3>
            <div className="text-sm text-gray-600 korean-text">
              <p>LLM 모델: {LLM_MODELS.find(m => m.value === settings.llmModel)?.label}</p>
              <p>챗봇 유형: {CHATBOT_TYPES.find(t => t.value === settings.chatbotType)?.label}</p>
              <p>공유 범위: {VISIBILITY_OPTIONS.find(v => v.value === settings.visibility)?.label || "조직 전체"}</p>
            </div>
          </div>

          {/* LLM Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="llmModel" className="korean-text">LLM 모델 선택</Label>
            <Select
              value={settings.llmModel}
              onValueChange={(value) => setSettings(prev => ({ ...prev, llmModel: value }))}
            >
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="LLM 모델을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {LLM_MODELS.map((model) => (
                  <SelectItem key={model.value} value={model.value} className="korean-text">
                    {model.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Chatbot Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="chatbotType" className="korean-text">챗봇 유형 선택</Label>
            <Select
              value={settings.chatbotType}
              onValueChange={(value) => setSettings(prev => ({ ...prev, chatbotType: value }))}
            >
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="챗봇 유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {CHATBOT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value} className="korean-text">
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-gray-500">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Visibility/Sharing Scope Selection */}
          <div className="space-y-2">
            <Label htmlFor="visibility" className="korean-text">공유 범위</Label>
            <Select
              value={settings.visibility}
              onValueChange={(value) => setSettings(prev => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="공유 범위를 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {VISIBILITY_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="korean-text">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Organization Categories (only show for organization visibility) */}
          {settings.visibility === "organization" && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="korean-text text-sm font-medium">소속 조직</Label>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Upper Category */}
                <div className="space-y-2">
                  <Label className="korean-text text-xs">상위 카테고리</Label>
                  <Select
                    value={settings.upperCategory || ""}
                    onValueChange={(value) => setSettings(prev => ({ 
                      ...prev, 
                      upperCategory: value,
                      lowerCategory: "",
                      detailCategory: ""
                    }))}
                  >
                    <SelectTrigger className="korean-text text-sm">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="korean-text">전체</SelectItem>
                      {getUpperCategories().map((category: string) => (
                        <SelectItem key={category} value={category} className="korean-text">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Lower Category */}
                <div className="space-y-2">
                  <Label className="korean-text text-xs">하위 카테고리</Label>
                  <Select
                    value={settings.lowerCategory || ""}
                    onValueChange={(value) => setSettings(prev => ({ 
                      ...prev, 
                      lowerCategory: value,
                      detailCategory: ""
                    }))}
                  >
                    <SelectTrigger className="korean-text text-sm">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="korean-text">전체</SelectItem>
                      {getLowerCategories(settings.upperCategory || "").map((category: string) => (
                        <SelectItem key={category} value={category} className="korean-text">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Detail Category */}
                <div className="space-y-2">
                  <Label className="korean-text text-xs">세부 카테고리</Label>
                  <Select
                    value={settings.detailCategory || ""}
                    onValueChange={(value) => setSettings(prev => ({ 
                      ...prev, 
                      detailCategory: value
                    }))}
                  >
                    <SelectTrigger className="korean-text text-sm">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" className="korean-text">전체</SelectItem>
                      {getDetailCategories(settings.upperCategory || "", settings.lowerCategory || "").map((category: string) => (
                        <SelectItem key={category} value={category} className="korean-text">
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 korean-text"
            >
              취소
            </Button>
            <Button
              type="submit"
              disabled={updateSettingsMutation.isPending}
              className="flex-1 korean-text"
            >
              {updateSettingsMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>저장 중...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="w-4 h-4" />
                  <span>설정 저장</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}