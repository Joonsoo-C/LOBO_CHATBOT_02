import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { X, Save } from "lucide-react";
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
  const { data: organizationCategories = [] } = useQuery({
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
    // Exclude name field from update as it's read-only for chat users
    const { name, ...updateData } = basicInfoData;
    updateBasicInfoMutation.mutate(updateData);
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

  // Get unique categories
  const upperCategories = Array.from(new Set((organizationCategories as any[]).map((org: any) => org.upperCategory))).filter(Boolean);
  const lowerCategories = Array.from(new Set((organizationCategories as any[])
    .filter((org: any) => org.upperCategory === basicInfoData.upperCategory)
    .map((org: any) => org.lowerCategory))).filter(Boolean);
  const detailCategories = Array.from(new Set((organizationCategories as any[])
    .filter((org: any) => org.upperCategory === basicInfoData.upperCategory && org.lowerCategory === basicInfoData.lowerCategory)
    .map((org: any) => org.detailCategory))).filter(Boolean);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={handleClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-medium korean-text">기본 정보</h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Agent Name - Read Only */}
          <div className="space-y-2">
            <Label className="korean-text">에이전트 이름</Label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md korean-text text-gray-700">
              {basicInfoData.name}
            </div>
            <p className="text-xs text-gray-500">* 에이전트 이름은 관리자 시스템에서만 변경 가능합니다.</p>
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
          </div>

          {/* Agent Type */}
          <div className="space-y-2">
            <Label className="korean-text">에이전트 유형 *</Label>
            <Select value={basicInfoData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="유형을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
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
                  handleInputChange('lowerCategory', '전체');
                  handleInputChange('detailCategory', '전체');
                }}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="상위 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {upperCategories.map((category) => (
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
                  handleInputChange('detailCategory', '전체');
                }}
              >
                <SelectTrigger className="korean-text">
                  <SelectValue placeholder="하위 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {lowerCategories.map((category) => (
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
                <SelectContent>
                  <SelectItem value="전체">전체</SelectItem>
                  {detailCategories.map((category) => (
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
              <SelectContent>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
                <SelectItem value="pending">대기</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 korean-text"
              onClick={handleClose}
            >
              취소
            </Button>
            <Button 
              type="submit" 
              className="flex-1 korean-text"
              disabled={updateBasicInfoMutation.isPending}
            >
              <Save className="w-4 h-4 mr-2" />
              {updateBasicInfoMutation.isPending ? "저장 중..." : "저장"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}