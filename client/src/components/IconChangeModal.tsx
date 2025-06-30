import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Agent } from "@/types/agent";
import { 
  User, School, GraduationCap, Users, Wrench, 
  BookOpen, Calculator, FlaskConical, Computer, 
  Music, Palette, Globe, Heart, Camera, 
  Coffee, Star, Zap, Shield, Trophy 
} from "lucide-react";

interface IconChangeModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const availableIcons = [
  { name: "User", icon: User, value: "User" },
  { name: "School", icon: School, value: "School" },
  { name: "GraduationCap", icon: GraduationCap, value: "GraduationCap" },
  { name: "Users", icon: Users, value: "Users" },
  { name: "Wrench", icon: Wrench, value: "Wrench" },
  { name: "BookOpen", icon: BookOpen, value: "BookOpen" },
  { name: "Calculator", icon: Calculator, value: "Calculator" },
  { name: "FlaskConical", icon: FlaskConical, value: "FlaskConical" },
  { name: "Computer", icon: Computer, value: "Computer" },
  { name: "Music", icon: Music, value: "Music" },
  { name: "Palette", icon: Palette, value: "Palette" },
  { name: "Globe", icon: Globe, value: "Globe" },
  { name: "Heart", icon: Heart, value: "Heart" },
  { name: "Camera", icon: Camera, value: "Camera" },
  { name: "Coffee", icon: Coffee, value: "Coffee" },
  { name: "Star", icon: Star, value: "Star" },
  { name: "Zap", icon: Zap, value: "Zap" },
  { name: "Shield", icon: Shield, value: "Shield" },
  { name: "Trophy", icon: Trophy, value: "Trophy" }
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
        return response;
      } else {
        // Update with standard icon
        const response = await apiRequest("PATCH", `/api/agents/${agent.id}`, {
          icon: data.icon,
          backgroundColor: data.backgroundColor,
          isCustomIcon: false
        });
        return response;
      }
    },
    onSuccess: (updatedAgent) => {
      // First, invalidate all agent-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/agents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/managed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/agents"] });
      queryClient.invalidateQueries({ queryKey: [`/api/agents/${agent.id}`] });
      
      // Critical: Update conversations cache with new agent data
      queryClient.setQueryData(["/api/conversations"], (oldData: any[]) => {
        if (!oldData) return oldData;
        return oldData.map((conv: any) => {
          if (conv.agentId === agent.id) {
            return {
              ...conv,
              agent: {
                ...conv.agent,
                icon: isUsingCustomImage ? customImage : selectedIcon,
                backgroundColor: selectedColor,
                isCustomIcon: isUsingCustomImage
              }
            };
          }
          return conv;
        });
      });
      
      // Invalidate all conversation-related queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Also update any cached individual conversation queries
      queryClient.setQueryData([`/api/conversations`, agent.id], (oldData: any) => {
        if (!oldData || !oldData.agent) return oldData;
        return {
          ...oldData,
          agent: {
            ...oldData.agent,
            icon: isUsingCustomImage ? customImage : selectedIcon,
            backgroundColor: selectedColor,
            isCustomIcon: isUsingCustomImage
          }
        };
      });
      
      queryClient.setQueryData([`/api/conversations/management`, agent.id], (oldData: any) => {
        if (!oldData || !oldData.agent) return oldData;
        return {
          ...oldData,
          agent: {
            ...oldData.agent,
            icon: isUsingCustomImage ? customImage : selectedIcon,
            backgroundColor: selectedColor,
            isCustomIcon: isUsingCustomImage
          }
        };
      });
      
      // Use comprehensive predicate matching for any missed queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey;
          return (
            key.includes("/api/agents") || 
            key.includes(`/api/agents/${agent.id}`) ||
            key.includes("/api/conversations")
          );
        }
      });
      
      // Force immediate refetch of critical data with slight delay for server processing
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/agents"] });
        queryClient.refetchQueries({ queryKey: ["/api/agents/managed"] });
        queryClient.refetchQueries({ queryKey: ["/api/conversations"] });
      }, 100);
      
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
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "잘못된 파일 형식",
          description: "이미지 파일만 업로드할 수 있습니다.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "이미지 파일은 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }
      
      setImageFile(file);
      setIsUsingCustomImage(true);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
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
              <input
                type="file"
                id="image-upload-trigger"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={(e) => {
                  setIsUsingCustomImage(true);
                  handleFileChange(e);
                }}
                className="hidden"
              />
              <Button
                variant={isUsingCustomImage ? "default" : "outline"}
                size="sm"
                className="flex-1"
                type="button"
                onClick={() => {
                  document.getElementById('image-upload-trigger')?.click();
                }}
              >
                이미지 업로드
              </Button>
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
              <Button
                variant="outline"
                onClick={() => document.getElementById('image-upload-drop')?.click()}
                className="w-full"
              >
                <Camera className="w-4 h-4 mr-2" />
                이미지 파일 선택
              </Button>
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