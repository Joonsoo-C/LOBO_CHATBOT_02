import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent } from "@/types/agent";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { 
  User, GraduationCap, Code, Bot, FlaskRound, 
  Map, Languages, Dumbbell, Database, Lightbulb, 
  Heart, Calendar, Pen, FileText, Camera 
} from "lucide-react";

interface IconChangeModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const availableIcons = [
  { name: "졸업모자", icon: GraduationCap, value: "fas fa-graduation-cap" },
  { name: "코드", icon: Code, value: "fas fa-code" },
  { name: "로봇", icon: Bot, value: "fas fa-robot" },
  { name: "사용자", icon: User, value: "fas fa-user" },
  { name: "플라스크", icon: FlaskRound, value: "fas fa-flask" },
  { name: "지도", icon: Map, value: "fas fa-map" },
  { name: "언어", icon: Languages, value: "fas fa-language" },
  { name: "덤벨", icon: Dumbbell, value: "fas fa-dumbbell" },
  { name: "데이터베이스", icon: Database, value: "fas fa-database" },
  { name: "전구", icon: Lightbulb, value: "fas fa-lightbulb" },
  { name: "하트", icon: Heart, value: "fas fa-heart" },
  { name: "캘린더", icon: Calendar, value: "fas fa-calendar" },
  { name: "펜", icon: Pen, value: "fas fa-pen" },
  { name: "문서", icon: FileText, value: "fas fa-file-alt" }
];

const colorOptions = [
  { name: "파란색", value: "#3b82f6", bgClass: "bg-blue-500" },
  { name: "초록색", value: "#10b981", bgClass: "bg-emerald-500" },
  { name: "보라색", value: "#8b5cf6", bgClass: "bg-violet-500" },
  { name: "빨간색", value: "#ef4444", bgClass: "bg-red-500" },
  { name: "주황색", value: "#f97316", bgClass: "bg-orange-500" },
  { name: "분홍색", value: "#ec4899", bgClass: "bg-pink-500" },
  { name: "노란색", value: "#eab308", bgClass: "bg-yellow-500" },
  { name: "청록색", value: "#06b6d4", bgClass: "bg-cyan-500" },
  { name: "회색", value: "#6b7280", bgClass: "bg-gray-500" },
  { name: "남색", value: "#4338ca", bgClass: "bg-indigo-600" }
];

export default function IconChangeModal({ agent, isOpen, onClose, onSuccess }: IconChangeModalProps) {
  const [selectedIcon, setSelectedIcon] = useState(agent.icon || "User");
  const [selectedColor, setSelectedColor] = useState(agent.backgroundColor || "#3b82f6");
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUsingCustomImage, setIsUsingCustomImage] = useState(agent.isCustomIcon || false);

  // Reset state when modal opens/closes or agent changes
  useEffect(() => {
    if (isOpen) {
      setSelectedIcon(agent.icon || "User");
      setSelectedColor(agent.backgroundColor || "#3b82f6");
      setIsUsingCustomImage(agent.isCustomIcon || false);
      setCustomImage(null);
      setImageFile(null);
      
      // If agent has custom icon, show the current image
      if (agent.isCustomIcon && agent.icon) {
        setCustomImage(agent.icon);
      }
    }
  }, [isOpen, agent]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateIconMutation = useMutation({
    mutationFn: async (data: { icon?: string; backgroundColor: string; customImageFile?: File }) => {
      if (data.customImageFile) {
        // Upload custom image first
        const formData = new FormData();
        formData.append('image', data.customImageFile);
        
        const uploadResponse = await fetch(`/api/agents/${agent.id}/icon-upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        });
        
        if (!uploadResponse.ok) {
          throw new Error('이미지 업로드에 실패했습니다.');
        }
        
        const uploadResult = await uploadResponse.json();
        
        // Update agent with custom image path
        const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, {
          icon: uploadResult.imagePath,
          backgroundColor: data.backgroundColor,
          isCustomIcon: true
        });
        return await response.json();
      } else {
        // Update with standard icon
        const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, {
          icon: data.icon,
          backgroundColor: data.backgroundColor,
          isCustomIcon: false
        });
        return await response.json();
      }
    },
    onSuccess: async (response) => {
      console.log("Icon change success, using server response data:", response);
      
      // Get updated agent data from server response
      const updatedAgentData = (response as any).agent;
      
      if (!updatedAgentData) {
        console.error("No agent data in server response");
        return;
      }
      
      // Step 1: Update agent cache with actual server data
      queryClient.setQueryData(["/api/agents"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((agentItem: any) => {
          if (agentItem.id === agent.id) {
            return {
              ...agentItem,
              icon: updatedAgentData.icon,
              backgroundColor: updatedAgentData.backgroundColor,
              isCustomIcon: updatedAgentData.isCustomIcon
            };
          }
          return agentItem;
        });
      });

      // Step 2: Update managed agents cache with actual server data
      queryClient.setQueryData(["/api/agents/managed"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((agentItem: any) => {
          if (agentItem.id === agent.id) {
            return {
              ...agentItem,
              icon: updatedAgentData.icon,
              backgroundColor: updatedAgentData.backgroundColor,
              isCustomIcon: updatedAgentData.isCustomIcon
            };
          }
          return agentItem;
        });
      });
      
      // Step 3: Update conversations cache with actual server data
      queryClient.setQueryData(["/api/conversations"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => {
          if (conv.agentId === agent.id) {
            return {
              ...conv,
              agent: {
                ...conv.agent,
                icon: updatedAgentData.icon,
                backgroundColor: updatedAgentData.backgroundColor,
                isCustomIcon: updatedAgentData.isCustomIcon
              }
            };
          }
          return conv;
        });
      });
      
      console.log("Cache updated with server data, forcing UI refresh...");
      
      // Step 4: Update modal state to reflect changes immediately
      setSelectedIcon(updatedAgentData.icon);
      setSelectedColor(updatedAgentData.backgroundColor);
      if (updatedAgentData.isCustomIcon && updatedAgentData.icon?.startsWith('/uploads/')) {
        setCustomImage(updatedAgentData.icon);
        setIsUsingCustomImage(true);
      } else {
        setCustomImage(null);
        setIsUsingCustomImage(false);
      }
      
      // Step 5: Force comprehensive invalidation and immediate refetch
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/agents"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/agents/managed"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", agent.id] })
      ]).then(() => {
        // Immediately refetch all agent data
        return Promise.all([
          queryClient.refetchQueries({ queryKey: ["/api/agents"] }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/agents"] })
        ]);
      });
      
      // Step 6: Emit global events for immediate UI updates
      console.log("Emitting global agent update events...");
      eventBus.emit(EVENTS.AGENT_ICON_CHANGED, { 
        agentId: agent.id, 
        icon: updatedAgentData.icon, 
        backgroundColor: updatedAgentData.backgroundColor,
        isCustomIcon: updatedAgentData.isCustomIcon 
      });
      eventBus.emit(EVENTS.FORCE_REFRESH_AGENTS);
      
      // Step 6.5: NUCLEAR OPTION - Direct window function call for fallback
      try {
        // Call global refresh functions if available for both Home and TabletLayout
        if (typeof (window as any).forceRefreshAgents === 'function') {
          console.log("Calling window.forceRefreshAgents for Home...");
          (window as any).forceRefreshAgents();
        }
        if (typeof (window as any).forceRefreshAgentsTablet === 'function') {
          console.log("Calling window.forceRefreshAgentsTablet for TabletLayout...");
          (window as any).forceRefreshAgentsTablet();
        }
      } catch (e) {
        console.log("Window function call failed:", e);
      }
      
      // Step 7: NUCLEAR OPTION - Force immediate refetch with multiple strategies
      // Strategy 1: Immediate invalidation
      queryClient.removeQueries({ queryKey: ["/api/agents"] });
      
      // Strategy 2: Force refetch with delay
      setTimeout(async () => {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ["/api/agents"], type: "all" }),
          queryClient.refetchQueries({ queryKey: ["/api/conversations"], type: "all" }),
          queryClient.refetchQueries({ queryKey: ["/api/admin/agents"], type: "all" }),
        ]);
        console.log("Force refetch completed after icon change");
      }, 50);
      
      // Strategy 3: Force page reload to ensure all UI components show updated icon
      setTimeout(() => {
        console.log("Forcing page reload to ensure icon change is visible everywhere");
        window.location.reload();
      }, 1000);
      
      // Step 7: Close modal and show success message
      toast({
        title: "아이콘 변경 완료",
        description: "에이전트 아이콘과 배경색이 성공적으로 변경되었습니다.",
      });
      
      onSuccess?.("아이콘과 배경색이 성공적으로 변경되었습니다.");
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "아이콘 변경 실패",
        description: error.message || "아이콘 변경 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileChange called, event:", event);
    const file = event.target.files?.[0];
    console.log("Selected file:", file);
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.log("Invalid file type:", file.type);
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.log("File too large:", file.size);
        toast({
          title: "파일 크기 초과",
          description: "이미지 파일은 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("Setting file and custom image state");
      setImageFile(file);
      setIsUsingCustomImage(true);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log("FileReader loaded, setting custom image preview");
        setCustomImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      console.log("No file selected");
    }
  };

  const handleSubmit = () => {
    if (isUsingCustomImage && imageFile) {
      updateIconMutation.mutate({
        backgroundColor: selectedColor,
        customImageFile: imageFile
      });
    } else {
      updateIconMutation.mutate({
        icon: selectedIcon,
        backgroundColor: selectedColor
      });
    }
  };

  const selectedIconComponent = availableIcons.find(icon => icon.value === selectedIcon)?.icon || User;
  const SelectedIconComponent = selectedIconComponent;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md korean-text">
        <DialogHeader>
          <DialogTitle>아이콘 변경</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Preview */}
          <div className="flex justify-center">
            <div 
              className="w-16 h-16 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: selectedColor }}
            >
              {isUsingCustomImage && customImage ? (
                <img 
                  src={customImage} 
                  alt="Custom icon preview" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <SelectedIconComponent className="w-8 h-8 text-white" />
              )}
            </div>
          </div>

          {/* Upload Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">아이콘 유형</Label>
            <div className="flex gap-2">
              <Button
                variant={!isUsingCustomImage ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsUsingCustomImage(false);
                  setCustomImage(null);
                  setImageFile(null);
                }}
                className="flex-1"
              >
                기본 아이콘
              </Button>
              <div className="flex-1">
                <input
                  type="file"
                  id="image-upload-input"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={(e) => {
                    console.log("File input changed!", e.target.files);
                    setIsUsingCustomImage(true);
                    handleFileChange(e);
                  }}
                  style={{ display: 'none' }}
                />
                <Button
                  variant={isUsingCustomImage ? "default" : "outline"}
                  size="sm"
                  className="w-full"
                  type="button"
                  onClick={() => {
                    console.log("Image upload button clicked!");
                    const input = document.getElementById('image-upload-input') as HTMLInputElement;
                    if (input) {
                      console.log("Found input, clicking it");
                      input.click();
                    } else {
                      console.error("Input not found!");
                    }
                  }}
                >
                  이미지 업로드
                </Button>
              </div>
            </div>
          </div>



          {/* Custom Image Upload Section */}
          {isUsingCustomImage && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">이미지 파일 선택</Label>
              
              {/* File drop area */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                  id="image-upload-drop"
                />
                <label 
                  htmlFor="image-upload-drop" 
                  className="cursor-pointer flex flex-col items-center space-y-2 hover:text-primary transition-colors"
                >
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    {imageFile ? imageFile.name : "클릭하여 이미지 선택"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    JPG, PNG, GIF, WEBP (최대 5MB)
                  </div>
                </label>
              </div>
              
              {/* Additional upload button for better UX */}
              <label htmlFor="image-upload-drop" className="w-full">
                <Button
                  variant="outline"
                  className="w-full"
                  type="button"
                  asChild
                >
                  <span>
                    <Camera className="w-4 h-4 mr-2" />
                    이미지 파일 선택
                  </span>
                </Button>
              </label>
            </div>
          )}

          {/* Icon Selection - Only show for basic icons */}
          {!isUsingCustomImage && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">아이콘 선택</Label>
              <div className="grid grid-cols-5 gap-2">
                {availableIcons.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  return (
                    <Button
                      key={iconOption.value}
                      variant={selectedIcon === iconOption.value ? "default" : "outline"}
                      size="sm"
                      className="h-12 w-12 p-0"
                      onClick={() => setSelectedIcon(iconOption.value)}
                    >
                      <IconComponent className="w-5 h-5" />
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Color Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">배경색 선택</Label>
            <div className="grid grid-cols-5 gap-2">
              {colorOptions.map((colorOption) => (
                <Button
                  key={colorOption.value}
                  variant="outline"
                  size="sm"
                  className={`h-12 w-12 p-0 border-2 ${
                    selectedColor === colorOption.value ? "border-foreground" : "border-border"
                  }`}
                  onClick={() => setSelectedColor(colorOption.value)}
                >
                  <div 
                    className={`w-8 h-8 rounded ${colorOption.bgClass}`}
                  />
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose} disabled={updateIconMutation.isPending}>
              취소
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={updateIconMutation.isPending}
            >
              {updateIconMutation.isPending ? "변경 중..." : "변경하기"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}