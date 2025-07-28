import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Save, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@/types/agent";

interface BasicInfoEditModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  onCancel?: (message: string) => void;
}

interface BasicInfoData {
  name: string;
  description: string;
  upperCategory: string;
  lowerCategory: string;
  detailCategory: string;
  type: string;
  status: string;
}

export default function BasicInfoEditModal({ agent, isOpen, onClose, onSuccess, onCancel }: BasicInfoEditModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [basicInfoData, setBasicInfoData] = useState<BasicInfoData>({
    name: agent.name || "",
    description: agent.description || "",
    upperCategory: agent.upperCategory || "전체",
    lowerCategory: agent.lowerCategory || "전체", 
    detailCategory: agent.detailCategory || "전체",
    type: agent.category || "기능형",
    status: agent.status || "active"
  });

  // Fetch organization categories
  const { data: organizationCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/organization-categories"],
  });

  // Update form data when agent changes
  useEffect(() => {
    setBasicInfoData({
      name: agent.name || "",
      description: agent.description || "",
      upperCategory: agent.upperCategory || "전체",
      lowerCategory: agent.lowerCategory || "전체",
      detailCategory: agent.detailCategory || "전체", 
      type: agent.category || "기능형",
      status: agent.status || "active"
    });
  }, [agent]);

  const updateBasicInfoMutation = useMutation({
    mutationFn: async (data: BasicInfoData) => {
      const response = await apiRequest("PUT", `/api/agents/${agent.id}/basic-info`, data);
      return response.json();
    },
    onSuccess: (updatedAgent) => {
      toast({
        title: "기본 정보 업데이트 완료",
        description: "에이전트 기본 정보가 성공적으로 업데이트되었습니다.",
      });
      
      // Send completion message to chat
      if (onSuccess) {
        const changes = [];
        if (basicInfoData.description !== agent.description) changes.push(`설명: ${basicInfoData.description}`);
        if (basicInfoData.type !== agent.category) changes.push(`유형: ${basicInfoData.type}`);
        
        const changeText = changes.length > 0 ? changes.join(', ') + ' 변경됨. ' : '';
        onSuccess(`${changeText}기본 정보가 저장되었습니다.`);
      }
      
      // Update the cache with the fresh data from server
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
    // Include name field but mark it as read-only from frontend perspective
    updateBasicInfoMutation.mutate({
      name: basicInfoData.name,
      description: basicInfoData.description,
      upperCategory: basicInfoData.upperCategory,
      lowerCategory: basicInfoData.lowerCategory,
      detailCategory: basicInfoData.detailCategory,
      type: basicInfoData.type,
      status: basicInfoData.status
    });
  };

  const handleInputChange = (field: keyof BasicInfoData, value: string) => {
    setBasicInfoData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (onCancel) {
      onCancel("기본 정보 편집을 취소하였습니다.");
    }
    onClose();
  };

  if (!isOpen) return null;

  // Get unique categories with proper filtering
  const upperCategories = Array.from(new Set(
    (organizationCategories || [])
      .map(org => org.upperCategory)
      .filter(Boolean)
  )).sort();

  const lowerCategories = Array.from(new Set(
    (organizationCategories || [])
      .filter(org => {
        if (basicInfoData.upperCategory === "전체") return true;
        return org.upperCategory === basicInfoData.upperCategory;
      })
      .map(org => org.lowerCategory)
      .filter(Boolean)
  )).sort();

  const detailCategories = Array.from(new Set(
    (organizationCategories || [])
      .filter(org => {
        if (basicInfoData.upperCategory === "전체") return true;
        if (basicInfoData.lowerCategory === "전체") {
          return org.upperCategory === basicInfoData.upperCategory;
        }
        return org.upperCategory === basicInfoData.upperCategory && 
               org.lowerCategory === basicInfoData.lowerCategory;
      })
      .map(org => org.detailCategory)
      .filter(Boolean)
  )).sort();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] md:max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header - 고정, 높이 50% 줄임 */}
        <div className="flex items-center justify-between p-3 border-b bg-white rounded-t-2xl flex-shrink-0">
          <div className="flex items-center space-x-2 pl-6">
            <User className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-medium korean-text">기본 정보</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-10 h-10" />
          </Button>
        </div>

        {/* Content - 스크롤 가능 */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className="p-6 space-y-6" id="basic-info-form">
          {/* Agent Name - Read Only */}
          <div className="space-y-2">
            <Label className="korean-text">에이전트 이름</Label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md korean-text text-gray-700">
              {basicInfoData.name}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="korean-text">에이전트 소개</Label>
            <Textarea
              id="description"
              value={basicInfoData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="에이전트의 역할이나 기능을 간단히 소개해 주세요."
              className="korean-text resize-none"
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-gray-500">* 소개에 입력된 내용은 사용자들을 위한 안내 메시지에 활용됩니다.</p>
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label className="korean-text">에이전트 유형 *</Label>
            <Select value={basicInfoData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="학교">학교</SelectItem>
                <SelectItem value="교수">교수</SelectItem>
                <SelectItem value="그룹">그룹</SelectItem>
                <SelectItem value="기능형">기능형</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organization Categories */}
          <div className="grid grid-cols-1 gap-4">
            {/* Upper Category */}
            <div className="space-y-2">
              <Label className="korean-text">소속 상위 조직 *</Label>
              <Select 
                value={basicInfoData.upperCategory} 
                onValueChange={(value) => {
                  handleInputChange('upperCategory', value);
                  // Reset lower and detail categories when upper category changes
                  handleInputChange('lowerCategory', '전체');
                  handleInputChange('detailCategory', '전체');
                }}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="상위 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="전체">전체</SelectItem>
                  {upperCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lower Category */}
            <div className="space-y-2">
              <Label className="korean-text">하위 조직</Label>
              <Select 
                value={basicInfoData.lowerCategory} 
                onValueChange={(value) => {
                  handleInputChange('lowerCategory', value);
                  // Reset detail category when lower category changes
                  handleInputChange('detailCategory', '전체');
                }}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="하위 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="전체">전체</SelectItem>
                  {lowerCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Detail Category */}
            <div className="space-y-2">
              <Label className="korean-text">세부 조직</Label>
              <Select 
                value={basicInfoData.detailCategory} 
                onValueChange={(value) => handleInputChange('detailCategory', value)}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="세부 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent className="z-[10000]">
                  <SelectItem value="전체">전체</SelectItem>
                  {detailCategories.map((category: string) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="korean-text">상태</Label>
            <Select value={basicInfoData.status} onValueChange={(value) => handleInputChange('status', value)}>
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="상태를 선택하세요" />
              </SelectTrigger>
              <SelectContent className="z-[10000]">
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
              </SelectContent>
            </Select>
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
              form="basic-info-form"
              type="submit" 
              className="flex-1 korean-text"
              disabled={updateBasicInfoMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateBasicInfoMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}