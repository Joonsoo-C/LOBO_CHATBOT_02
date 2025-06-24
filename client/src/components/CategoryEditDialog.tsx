import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { AlertTriangle, Users, Building2 } from "lucide-react";

interface Organization {
  id: number;
  name: string;
  type: string;
  parentId?: number;
  memberCount?: number;
  agentCount?: number;
}

interface CategoryEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organization: Organization | null;
  onSave: (updatedOrg: Organization) => void;
  onDelete: (orgId: number) => void;
}

export function CategoryEditDialog({ 
  open, 
  onOpenChange, 
  organization, 
  onSave, 
  onDelete 
}: CategoryEditDialogProps) {
  const [name, setName] = useState(organization?.name || "");
  const [type, setType] = useState(organization?.type || "");
  const [parentCategory, setParentCategory] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!organization) return;
    
    setIsLoading(true);
    try {
      const updatedOrg = {
        ...organization,
        name,
        type,
      };
      onSave(updatedOrg);
      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    if (!organization) return;
    if (confirm(`정말로 "${organization.name}" 조직을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 소속된 모든 사용자와 에이전트에 영향을 줄 수 있습니다.`)) {
      onDelete(organization.id);
      onOpenChange(false);
    }
  };

  const resetForm = () => {
    setName(organization?.name || "");
    setType(organization?.type || "");
    setParentCategory("");
    setDescription("");
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  if (!organization) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>조직 카테고리 설정</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            조직 정보를 수정하거나 상위 조직을 변경할 수 있습니다.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          {/* 현재 조직 정보 */}
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center space-x-2">
              <Building2 className="w-4 h-4" />
              <span>현재 조직 정보</span>
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700 font-medium">조직명:</span>
                <p className="text-blue-900">{organization.name}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">조직 유형:</span>
                <p className="text-blue-900">{organization.type}</p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">소속 인원:</span>
                <p className="text-blue-900 flex items-center space-x-1">
                  <Users className="w-3 h-3" />
                  <span>{organization.memberCount || 0}명</span>
                </p>
              </div>
              <div>
                <span className="text-blue-700 font-medium">에이전트 수:</span>
                <p className="text-blue-900">{organization.agentCount || 0}개</p>
              </div>
            </div>
          </div>

          {/* 조직명 변경 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">조직명 변경</h4>
            <div className="space-y-2">
              <Label>새 조직명</Label>
              <Input 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="조직명을 입력하세요"
              />
            </div>
          </div>

          <Separator />

          {/* 상위 조직 변경 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">상위 조직 변경</h4>
            <div className="space-y-2">
              <Label>새 상위 조직</Label>
              <Select value={parentCategory} onValueChange={setParentCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="상위 조직을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">상위 조직 없음 (최상위)</SelectItem>
                  <SelectItem value="로보대학교">로보대학교</SelectItem>
                  <SelectItem value="대학본부">대학본부</SelectItem>
                  <SelectItem value="학사부서">학사부서</SelectItem>
                  <SelectItem value="연구기관">연구기관</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                상위 조직 변경 시 하위 조직과 소속 인원도 함께 이동됩니다.
              </p>
            </div>
          </div>

          <Separator />

          {/* 조직 유형 변경 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">조직 유형 변경</h4>
            <div className="space-y-2">
              <Label>조직 유형</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="조직 유형을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="university">대학교</SelectItem>
                  <SelectItem value="college">대학</SelectItem>
                  <SelectItem value="department">학과/부서</SelectItem>
                  <SelectItem value="center">센터/연구소</SelectItem>
                  <SelectItem value="office">사무실</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* 추가 설명 */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">변경 사유 (선택사항)</h4>
            <div className="space-y-2">
              <Label>변경 사유</Label>
              <Textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="조직 변경 사유를 입력하세요..."
                rows={3}
              />
            </div>
          </div>

          {/* 경고 메시지 */}
          {(name !== organization.name || parentCategory || type !== organization.type) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="text-amber-800 font-medium mb-2">변경 사항 확인</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {name !== organization.name && (
                      <li>• 조직명이 "{organization.name}"에서 "{name}"으로 변경됩니다.</li>
                    )}
                    {parentCategory && (
                      <li>• 상위 조직이 "{parentCategory}"으로 변경됩니다.</li>
                    )}
                    {type !== organization.type && (
                      <li>• 조직 유형이 "{organization.type}"에서 "{type}"으로 변경됩니다.</li>
                    )}
                    <li>• 소속된 {organization.memberCount || 0}명의 사용자와 {organization.agentCount || 0}개의 에이전트에 영향을 줄 수 있습니다.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 버튼 그룹 */}
          <div className="flex justify-between pt-4 border-t">
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isLoading}
            >
              조직 삭제
            </Button>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleClose}>
                취소
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading || (!name.trim())}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {isLoading ? "저장 중..." : "변경사항 저장"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}