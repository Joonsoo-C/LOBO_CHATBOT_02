import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Building, 
  Calendar, 
  Shield, 
  X,
  Clock,
  MapPin
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface UserData {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  userType: string;
  status?: string;
  role?: string;
  upperCategory?: string;
  lowerCategory?: string;
  detailCategory?: string;
  position?: string;
  createdAt?: string;
  lastLoginAt?: string;
  userMemo?: string;
}

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { t } = useLanguage();
  
  const { data: user, isLoading } = useQuery<UserData>({
    queryKey: ['/api/user'],
    enabled: isOpen,
  });

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "정보 없음";
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch {
      return "정보 없음";
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "student": return "학생";
      case "faculty": return "교직원";
      case "admin": return "관리자";
      default: return userType;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "일반 사용자": return "일반 사용자";
      case "에이전트 관리자": return "에이전트 관리자";
      case "마스터 관리자": return "마스터 관리자";
      case "운영 관리자": return "운영 관리자";
      case "카테고리 관리자": return "카테고리 관리자";
      case "QA 관리자": return "QA 관리자";
      case "문서 관리자": return "문서 관리자";
      case "외부 사용자": return "외부 사용자";
      default: return role || "일반 사용자";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "locked": return "destructive";
      case "pending": return "outline";
      default: return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "활성";
      case "inactive": return "비활성";
      case "locked": return "잠금";
      case "pending": return "대기";
      default: return status || "알 수 없음";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto !z-[9999]">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-xl font-bold korean-text">
            계정 정보
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {user && user.username && (
          <div className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold korean-text">기본 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">이름</span>
                  <span className="font-medium korean-text">
                    {user.name || `${user.lastName || ""}${user.firstName || ""}`}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">사용자 ID</span>
                  <span className="font-mono text-sm">{user.username}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">이메일</span>
                  <span className="text-sm">{user.email || "정보 없음"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">계정 유형</span>
                  <Badge variant="outline" className="korean-text">
                    {getUserTypeLabel(user.userType)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">계정 상태</span>
                  <Badge variant={getStatusBadgeVariant(user.status || "active")} className="korean-text">
                    {getStatusLabel(user.status || "active")}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* 조직 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold korean-text">소속 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">상위 조직</span>
                  <span className="korean-text">{user.upperCategory || "정보 없음"}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">하위 조직</span>
                  <span className="korean-text">{user.lowerCategory || "정보 없음"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">세부 조직</span>
                  <span className="korean-text">{user.detailCategory || "정보 없음"}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">직책</span>
                  <span className="korean-text">{user.position || "정보 없음"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* 권한 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold korean-text">권한 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">시스템 역할</span>
                  <Badge variant="secondary" className="korean-text">
                    {getRoleLabel(user.role || "일반 사용자")}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* 활동 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold korean-text">활동 정보</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">계정 생성일</span>
                  <span className="text-sm">{formatDate(user.createdAt || null)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">마지막 로그인</span>
                  <span className="text-sm">{formatDate(user.lastLoginAt || null)}</span>
                </div>
              </div>
            </div>

            {/* 메모 섹션 (있는 경우) */}
            {user.userMemo && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <h3 className="text-lg font-semibold korean-text">추가 정보</h3>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm korean-text">{user.userMemo}</p>
                  </div>
                </div>
              </>
            )}

            {/* 닫기 버튼 */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} className="korean-text">
                닫기
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}