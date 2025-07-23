import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Save, Settings, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  webSearchEnabled?: boolean;
  webSearchEngine?: string;
  customApiKey?: string;
}

const LLM_MODELS = [
  { 
    value: "gpt-4o", 
    label: "GPT-4o",
    tooltip: "GPT-4o는 텍스트, 음성, 이미지 입력을 모두 지원하는 최신 멀티모달 모델로, 응답 속도가 빠르고 비용 효율성이 높습니다."
  },
  { 
    value: "gpt-4", 
    label: "GPT-4",
    tooltip: "GPT-4는 고품질 텍스트 생성에 최적화된 모델로, 복잡한 문제 해결과 분석 능력이 뛰어납니다."
  },
  { 
    value: "gpt-3.5-turbo", 
    label: "GPT-3.5-turbo",
    tooltip: "GPT-3.5-turbo는 빠른 응답 속도와 낮은 비용이 특징인 경량 모델로, 실시간 챗봇에 적합합니다."
  }
];

const CHATBOT_TYPES = [
  { 
    value: "strict-doc", 
    label: "문서 기반 (RAG)",
    tooltip: "업로드한 문서를 기반으로만 답변합니다. 문서에 없는 정보는 제공하지 않습니다."
  },
  { 
    value: "doc-fallback-llm", 
    label: "문서 + LLM 혼합형",
    tooltip: "문서를 우선 참고하되, 부족한 내용은 LLM이 보완하여 답변합니다. 정확성과 유연성을 함께 제공합니다."
  },
  { 
    value: "general-llm", 
    label: "LLM 단독",
    tooltip: "문서를 참조하지 않고, LLM만으로 응답합니다. 일반적 질문에 적합합니다."
  },
  { 
    value: "llm-web-search", 
    label: "LLM + 웹 검색",
    tooltip: "LLM이 외부 검색 결과를 참고하여 최신 정보를 포함한 답변을 생성합니다. 시의성 있는 질문에 적합합니다. (Bing 등 연동 필요)"
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
    value: "user", 
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
  
  // Initialize settings first
  const [settings, setSettings] = useState<ChatbotSettings>({
    llmModel: (agent as any).llmModel || "gpt-4o",
    chatbotType: (agent as any).chatbotType || "general-llm",
    visibility: (agent as any).visibility || "public",
    upperCategory: (agent as any).upperCategory || "",
    lowerCategory: (agent as any).lowerCategory || "",
    detailCategory: (agent as any).detailCategory || "",
    webSearchEnabled: (agent as any).webSearchEnabled || false,
    webSearchEngine: (agent as any).webSearchEngine || "bing",
    customApiKey: (agent as any).customApiKey || ""
  });

  // Fetch organization categories
  const { data: organizationCategories = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["/api/organization-categories"],
    enabled: isOpen,
  });

  // State for selected users (moved before the query that uses them)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userUpperCategory, setUserUpperCategory] = useState("");
  const [userLowerCategory, setUserLowerCategory] = useState("");
  const [userDetailCategory, setUserDetailCategory] = useState("");

  // Fetch users for user selection using search API with category filters
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/users/search", userUpperCategory, userLowerCategory, userDetailCategory],
    enabled: isOpen && settings.visibility === "user",
    queryFn: () => {
      const params = new URLSearchParams();
      if (userUpperCategory && userUpperCategory !== "all") params.append("upperCategory", userUpperCategory);
      if (userLowerCategory && userLowerCategory !== "all") params.append("lowerCategory", userLowerCategory);
      if (userDetailCategory && userDetailCategory !== "all") params.append("detailCategory", userDetailCategory);
      
      return fetch(`/api/users/search?${params.toString()}`).then(res => res.json());
    }
  });

  // Get unique upper categories
  const getUpperCategories = () => {
    if (!organizationCategories || !Array.isArray(organizationCategories)) return [];
    const upperCats = organizationCategories.map((org: any) => org.upperCategory).filter(Boolean);
    const uniqueSet = new Set(upperCats);
    const result: string[] = [];
    uniqueSet.forEach(cat => result.push(cat));
    return result;
  };

  // Get lower categories for selected upper category
  const getLowerCategories = (upperCategory: string) => {
    if (!upperCategory || !organizationCategories || !Array.isArray(organizationCategories)) return [];
    const lowerCats = organizationCategories
      .filter((org: any) => org.upperCategory === upperCategory)
      .map((org: any) => org.lowerCategory)
      .filter(Boolean);
    const uniqueSet = new Set(lowerCats);
    const result: string[] = [];
    uniqueSet.forEach(cat => result.push(cat));
    return result;
  };

  // Get detail categories for selected upper and lower categories
  const getDetailCategories = (upperCategory: string, lowerCategory: string) => {
    if (!upperCategory || !lowerCategory || !organizationCategories || !Array.isArray(organizationCategories)) return [];
    const detailCats = organizationCategories
      .filter((org: any) => org.upperCategory === upperCategory && org.lowerCategory === lowerCategory)
      .map((org: any) => org.detailCategory)
      .filter(Boolean);
    const uniqueSet = new Set(detailCats);
    const result: string[] = [];
    uniqueSet.forEach(cat => result.push(cat));
    return result;
  };



  // Filter users based on search and category
  const filteredUsers = users.filter((user: any) => {
    // Search filter
    const matchesSearch = !userSearch || 
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase());
    
    // Category filters - empty string, "all", or undefined means show all
    const matchesUpperCategory = !userUpperCategory || userUpperCategory === "all" || 
      user.upperCategory === userUpperCategory;
    
    const matchesLowerCategory = !userLowerCategory || userLowerCategory === "all" || 
      user.lowerCategory === userLowerCategory;
    
    const matchesDetailCategory = !userDetailCategory || userDetailCategory === "all" || 
      user.detailCategory === userDetailCategory;
    
    const allMatches = matchesSearch && matchesUpperCategory && matchesLowerCategory && matchesDetailCategory;
    
    // Debug logging - show results when filters are applied
    if ((userUpperCategory && userUpperCategory !== "all") || 
        (userLowerCategory && userLowerCategory !== "all") || 
        (userDetailCategory && userDetailCategory !== "all") ||
        userSearch ||
        allMatches) {
      console.log('🔍 사용자 필터링:', user.name || user.username, {
        필터조건: { 
          상위조직: userUpperCategory || '전체', 
          하위조직: userLowerCategory || '전체', 
          세부조직: userDetailCategory || '전체',
          검색어: userSearch || '없음'
        },
        사용자조직: { 
          상위: user.upperCategory || '없음', 
          하위: user.lowerCategory || '없음', 
          세부: user.detailCategory || '없음' 
        },
        매칭결과: { 
          검색: matchesSearch, 
          상위: matchesUpperCategory, 
          하위: matchesLowerCategory, 
          세부: matchesDetailCategory 
        },
        최종결과: allMatches ? '✅ 포함' : '❌ 제외'
      });
    }
    
    return allMatches;
  });

  // Debug logging after filteredUsers is defined
  console.log("Organization categories loaded:", organizationCategories, "isLoading:", isLoadingOrgs);
  console.log("Upper categories:", getUpperCategories());
  console.log("Users data:", users, "isLoading:", isLoadingUsers, "visibility:", settings.visibility);
  console.log("Filtered users count:", users.length, "->", filteredUsers?.length || 0);
  
  // Refetch users when category selection changes
  const { refetch: refetchUsers } = useQuery({
    queryKey: ["/api/users/search", userUpperCategory, userLowerCategory, userDetailCategory],
    enabled: false, // Don't auto-fetch, only on demand
  });
  
  // Auto-refetch when user category filters change
  useEffect(() => {
    if (isOpen && settings.visibility === "user") {
      refetchUsers();
    }
  }, [userUpperCategory, userLowerCategory, userDetailCategory, settings.visibility, isOpen, refetchUsers]);

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: ChatbotSettings) => {
      const requestData = {
        ...data,
        selectedUsers: settings.visibility === 'user' ? selectedUsers : undefined
      };
      const response = await apiRequest("PUT", `/api/agents/${agent.id}/settings`, requestData);
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
        const visibilityLabel = VISIBILITY_OPTIONS.find(v => v.value === settings.visibility)?.label || settings.visibility;
        
        let message = `챗봇 설정이 저장되었습니다.\n\nLLM 모델: ${modelLabel}\n챗봇 유형: ${typeLabel}\n공유 범위: ${visibilityLabel}`;
        
        if (settings.visibility === 'group' && settings.upperCategory) {
          message += `\n조직: ${settings.upperCategory}`;
          if (settings.lowerCategory) {
            message += ` > ${settings.lowerCategory}`;
          }
          if (settings.detailCategory) {
            message += ` > ${settings.detailCategory}`;
          }
        }
        
        if (settings.visibility === 'user' && selectedUsers.length > 0) {
          message += `\n선택된 사용자: ${selectedUsers.length}명`;
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
            <h2 className="text-lg font-medium korean-text">AI 답변 설정</h2>
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
              <p>답변 생성 방식: {CHATBOT_TYPES.find(t => t.value === settings.chatbotType)?.label}</p>

            </div>
          </div>

          {/* LLM Model Selection */}
          <TooltipProvider>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="llmModel" className="korean-text">LLM 모델</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-[10001]">
                    <p className="korean-text">
                      {LLM_MODELS.find(m => m.value === settings.llmModel)?.tooltip}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={settings.llmModel}
                onValueChange={(value) => setSettings(prev => ({ ...prev, llmModel: value }))}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="LLM 모델을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {LLM_MODELS.map((model) => (
                    <SelectItem key={model.value} value={model.value} className="korean-text">
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipProvider>

          {/* Chatbot Type Selection */}
          <TooltipProvider>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="chatbotType" className="korean-text">응답 방식</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="w-4 h-4 text-gray-400 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs z-[10001]">
                    <p className="korean-text">
                      {CHATBOT_TYPES.find(t => t.value === settings.chatbotType)?.tooltip}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={settings.chatbotType}
                onValueChange={(value) => {
                  setSettings(prev => ({ 
                    ...prev, 
                    chatbotType: value,
                    webSearchEnabled: value === "llm-web-search" ? true : prev.webSearchEnabled
                  }));
                }}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="응답 방식을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  {CHATBOT_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="korean-text">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipProvider>

          {/* Web Search Settings - Only show when LLM + Web Search is selected */}
          {settings.chatbotType === "llm-web-search" && (
            <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
              <h4 className="font-medium korean-text text-sm text-blue-900">웹 검색 엔진 연동</h4>
              
              {/* Web Search Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="korean-text text-sm">웹 검색 활성화</Label>
                  <p className="text-xs text-gray-600 korean-text">외부 검색 결과를 활용하여 답변을 생성합니다</p>
                </div>
                <Switch
                  checked={settings.webSearchEnabled || false}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({ ...prev, webSearchEnabled: checked }))
                  }
                />
              </div>

              {/* Search Engine Selection */}
              {settings.webSearchEnabled && (
                <div className="space-y-2">
                  <Label className="korean-text text-sm">검색 엔진</Label>
                  <Select
                    value={settings.webSearchEngine || "bing"}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, webSearchEngine: value }))}
                  >
                    <SelectTrigger className="korean-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bing" className="korean-text">Bing (기본)</SelectItem>
                      <SelectItem value="custom" className="korean-text">Custom API</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Custom API Key Input */}
                  {settings.webSearchEngine === "custom" && (
                    <div className="space-y-2 mt-3">
                      <Label className="korean-text text-sm">Custom API 키</Label>
                      <Input
                        type="password"
                        placeholder="API 키를 입력하세요"
                        value={settings.customApiKey || ""}
                        onChange={(e) => setSettings(prev => ({ ...prev, customApiKey: e.target.value }))}
                        className="korean-text"
                      />
                      <p className="text-xs text-gray-500 korean-text">
                        향후 다양한 검색 API 연동을 위한 설정입니다
                      </p>
                    </div>
                  )}
                </div>
              )}
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