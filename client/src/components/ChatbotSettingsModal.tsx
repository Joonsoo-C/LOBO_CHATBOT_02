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
    detailCategory: (agent as any).detailCategory || ""
  });

  // Fetch organization categories
  const { data: organizationCategories = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ["/api/organization-categories"],
    enabled: isOpen,
  });

  // Fetch users for user selection (always fetch when modal is open)
  const { data: users = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ["/api/admin/users"],
    enabled: isOpen,
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

  // Debug logging
  console.log("Organization categories loaded:", organizationCategories, "isLoading:", isLoadingOrgs);
  console.log("Upper categories:", getUpperCategories());
  console.log("Users data:", users, "isLoading:", isLoadingUsers, "visibility:", settings.visibility);

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

  // State for selected users
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [userUpperCategory, setUserUpperCategory] = useState("");
  const [userLowerCategory, setUserLowerCategory] = useState("");
  const [userDetailCategory, setUserDetailCategory] = useState("");

  // Filter users based on search and category
  const filteredUsers = users.filter((user: any) => {
    // Search filter
    const matchesSearch = !userSearch || 
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase());
    
    // Category filters - empty string or "all" means show all
    const matchesUpperCategory = !userUpperCategory || 
      user.upperCategory === userUpperCategory;
    
    const matchesLowerCategory = !userLowerCategory || 
      user.lowerCategory === userLowerCategory;
    
    const matchesDetailCategory = !userDetailCategory || 
      user.detailCategory === userDetailCategory;
    
    const allMatches = matchesSearch && matchesUpperCategory && matchesLowerCategory && matchesDetailCategory;
    
    // Debug logging for first few users or filtered results
    if (user.name === 'Master Admin' || user.name === '정수빈' || user.name === '장지훈' || allMatches) {
      console.log('User filter check:', user.name, {
        filters: { userUpperCategory, userLowerCategory, userDetailCategory },
        userCategories: { upper: user.upperCategory, lower: user.lowerCategory, detail: user.detailCategory },
        matches: { search: matchesSearch, upper: matchesUpperCategory, lower: matchesLowerCategory, detail: matchesDetailCategory },
        result: allMatches
      });
    }
    
    return allMatches;
  });

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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="w-5 h-5 text-gray-900 dark:text-white" />
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

          {/* Sharing Scope Selection */}
          <div className="space-y-4">
            <Label className="korean-text">공유 범위</Label>
            <Select
              value={settings.visibility}
              onValueChange={(value) => {
                setSettings(prev => ({ 
                  ...prev, 
                  visibility: value,
                  upperCategory: value === "group" ? prev.upperCategory : "",
                  lowerCategory: value === "group" ? prev.lowerCategory : "",
                  detailCategory: value === "group" ? prev.detailCategory : ""
                }));
              }}
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

            {/* Group Category Selection */}
            {settings.visibility === 'group' && (
              <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Upper Category */}
                  <div className="space-y-2">
                    <Label className="korean-text text-sm">상위 카테고리</Label>
                    <Select
                      value={settings.upperCategory || ""}
                      onValueChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        upperCategory: value, 
                        lowerCategory: "", 
                        detailCategory: "" 
                      }))}
                    >
                      <SelectTrigger className="korean-text">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {getUpperCategories().map((category) => (
                          <SelectItem key={category} value={category} className="korean-text">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Lower Category */}
                  <div className="space-y-2">
                    <Label className="korean-text text-sm">하위 카테고리</Label>
                    <Select
                      value={settings.lowerCategory || ""}
                      onValueChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        lowerCategory: value, 
                        detailCategory: "" 
                      }))}
                      disabled={!settings.upperCategory}
                    >
                      <SelectTrigger className="korean-text">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {getLowerCategories(settings.upperCategory || "").map((category) => (
                          <SelectItem key={category} value={category} className="korean-text">
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Detail Category */}
                  <div className="space-y-2">
                    <Label className="korean-text text-sm">세부 카테고리</Label>
                    <Select
                      value={settings.detailCategory || ""}
                      onValueChange={(value) => setSettings(prev => ({ 
                        ...prev, 
                        detailCategory: value 
                      }))}
                      disabled={!settings.upperCategory || !settings.lowerCategory}
                    >
                      <SelectTrigger className="korean-text">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {getDetailCategories(settings.upperCategory || "", settings.lowerCategory || "").map((category) => (
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

            {/* User Selection Interface */}
            {settings.visibility === 'user' && (
              <div className="space-y-4 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="space-y-4">
                  {/* User Search */}
                  <div className="space-y-2">
                    <Label className="korean-text text-sm font-medium">사용자 검색 및 선택</Label>
                    <input
                      type="text"
                      placeholder="사용자 이름, ID, 이메일로 검색..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full px-3 py-2 border rounded-md korean-text"
                    />
                  </div>

                  {/* User Category Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="korean-text text-sm">상위 조직</Label>
                      <Select
                        value={userUpperCategory || "all"}
                        onValueChange={(value) => {
                          setUserUpperCategory(value === "all" ? "" : value);
                          setUserLowerCategory("");
                          setUserDetailCategory("");
                        }}
                      >
                        <SelectTrigger className="korean-text">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {getUpperCategories().map((category) => (
                            <SelectItem key={category} value={category} className="korean-text">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="korean-text text-sm">하위 조직</Label>
                      <Select
                        value={userLowerCategory || "all"}
                        onValueChange={(value) => {
                          setUserLowerCategory(value === "all" ? "" : value);
                          setUserDetailCategory("");
                        }}
                        disabled={!userUpperCategory}
                      >
                        <SelectTrigger className="korean-text">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {getLowerCategories(userUpperCategory).map((category) => (
                            <SelectItem key={category} value={category} className="korean-text">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="korean-text text-sm">세부 조직</Label>
                      <Select
                        value={userDetailCategory || "all"}
                        onValueChange={(value) => setUserDetailCategory(value === "all" ? "" : value)}
                        disabled={!userUpperCategory || !userLowerCategory}
                      >
                        <SelectTrigger className="korean-text">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {getDetailCategories(userUpperCategory, userLowerCategory).map((category) => (
                            <SelectItem key={category} value={category} className="korean-text">
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* User Selection Table */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="korean-text text-sm font-medium">사용자 선택</Label>
                      <span className="text-sm text-gray-500">선택된 사용자: {selectedUsers.length}명</span>
                    </div>
                    
                    <div className="border rounded-md max-h-64 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 py-2 text-left">선택</th>
                            <th className="px-3 py-2 text-left">이름</th>
                            <th className="px-3 py-2 text-left">ID</th>
                            <th className="px-3 py-2 text-left">이메일</th>
                            <th className="px-3 py-2 text-left">소속</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((user: any) => (
                            <tr key={user.id || user.username} className="border-t hover:bg-gray-50">
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={selectedUsers.includes(user.id || user.username)}
                                  onChange={(e) => {
                                    const userId = user.id || user.username;
                                    if (e.target.checked) {
                                      setSelectedUsers(prev => [...prev, userId]);
                                    } else {
                                      setSelectedUsers(prev => prev.filter(id => id !== userId));
                                    }
                                  }}
                                  className="w-4 h-4"
                                />
                              </td>
                              <td className="px-3 py-2 korean-text">{user.name || 'Master Admin'}</td>
                              <td className="px-3 py-2 korean-text">{user.username}</td>
                              <td className="px-3 py-2 korean-text">{user.email}</td>
                              <td className="px-3 py-2 korean-text text-xs">
                                {user.upperCategory} &gt; {user.lowerCategory} &gt; {user.detailCategory}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {filteredUsers.length === 0 && (
                        <div className="p-4 text-center text-gray-500 korean-text">
                          검색 조건에 맞는 사용자가 없습니다.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

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