import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  User, 
  Mail, 
  Building, 
  Calendar, 
  Shield, 
  Clock,
  MapPin,
  Edit,
  Key,
  Save,
  X,
  CheckCircle
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

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
  const { t, language } = useLanguage();
  const { toast } = useToast();
  
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  
  // Form states for editing
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editMemo, setEditMemo] = useState("");
  
  // Password change states
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: user, isLoading, refetch } = useQuery<UserData>({
    queryKey: ['/api/user'],
    enabled: isOpen,
  });

  // Initialize edit form when user data is loaded or when editing starts
  useEffect(() => {
    if (user && isEditing) {
      setEditName(user.name || `${user.lastName || ""}${user.firstName || ""}`);
      setEditEmail(user.email || "");
      setEditPosition(user.position || "");
      setEditMemo(user.userMemo || "");
    }
  }, [user, isEditing]);

  // Reset states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [isOpen]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return language === 'ko' ? '정보 없음' : 'No information';
    try {
      if (language === 'ko') {
        return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
      } else {
        return format(new Date(dateString), "MMM dd, yyyy HH:mm");
      }
    } catch {
      return language === 'ko' ? '정보 없음' : 'No information';
    }
  };

  const getUserTypeLabel = (userType: string) => {
    if (language === 'ko') {
      switch (userType) {
        case "student": return "학생";
        case "faculty": return "교직원";
        case "admin": return "관리자";
        default: return userType;
      }
    } else {
      switch (userType) {
        case "student": return "Student";
        case "faculty": return "Faculty";
        case "admin": return "Administrator";
        default: return userType;
      }
    }
  };

  const getRoleLabel = (role: string) => {
    const roleMap: { [key: string]: { ko: string, en: string } } = {
      "일반 사용자": { ko: "일반 사용자", en: "Regular User" },
      "regular_user": { ko: "일반 사용자", en: "Regular User" },
      "마스터 관리자": { ko: "마스터 관리자", en: "Master Admin" },
      "master_admin": { ko: "마스터 관리자", en: "Master Admin" },
      "운영 관리자": { ko: "운영 관리자", en: "Operation Manager" },
      "operation_admin": { ko: "운영 관리자", en: "Operation Manager" },
      "카테고리 관리자": { ko: "카테고리 관리자", en: "Category Manager" },
      "category_admin": { ko: "카테고리 관리자", en: "Category Manager" },
      "에이전트 관리자": { ko: "에이전트 관리자", en: "Agent Manager" },
      "agent_admin": { ko: "에이전트 관리자", en: "Agent Manager" },
      "QA 관리자": { ko: "QA 관리자", en: "QA Manager" },
      "qa_admin": { ko: "QA 관리자", en: "QA Manager" },
      "문서 관리자": { ko: "문서 관리자", en: "Document Manager" },
      "document_admin": { ko: "문서 관리자", en: "Document Manager" },
      "외부 사용자": { ko: "외부 사용자", en: "External User" },
      "external_user": { ko: "외부 사용자", en: "External User" },
    };

    const roleInfo = roleMap[role];
    if (roleInfo) {
      return language === 'ko' ? roleInfo.ko : roleInfo.en;
    }
    return role || (language === 'ko' ? '알 수 없음' : 'Unknown');
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
    if (language === 'ko') {
      switch (status) {
        case "active": return "활성";
        case "inactive": return "비활성";
        case "locked": return "잠금";
        case "pending": return "대기중";
        default: return status || "알 수 없음";
      }
    } else {
      switch (status) {
        case "active": return "Active";
        case "inactive": return "Inactive";
        case "locked": return "Locked";
        case "pending": return "Pending";
        default: return status || "Unknown";
      }
    }
  };

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: {
      name?: string;
      email?: string;
      position?: string;
      userMemo?: string;
    }) => {
      return apiRequest('/api/user/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ko' ? '프로필 업데이트됨' : 'Profile Updated',
        description: language === 'ko' ? '프로필이 성공적으로 업데이트되었습니다.' : 'Your profile has been updated successfully.',
      });
      setIsEditing(false);
      refetch();
    },
    onError: () => {
      toast({
        title: language === 'ko' ? '오류' : 'Error',
        description: language === 'ko' ? '프로필 업데이트 중 오류가 발생했습니다.' : 'An error occurred while updating your profile.',
        variant: "destructive",
      });
    },
  });

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      return apiRequest('/api/user/password', {
        method: 'PATCH',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });
    },
    onSuccess: () => {
      toast({
        title: language === 'ko' ? '비밀번호 변경됨' : 'Password Changed',
        description: language === 'ko' ? '비밀번호가 성공적으로 변경되었습니다.' : 'Your password has been changed successfully.',
      });
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      toast({
        title: language === 'ko' ? '오류' : 'Error',
        description: language === 'ko' ? '비밀번호 변경 중 오류가 발생했습니다.' : 'An error occurred while changing your password.',
        variant: "destructive",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate({
      name: editName,
      email: editEmail,
      position: editPosition,
      userMemo: editMemo,
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: language === 'ko' ? '오류' : 'Error',
        description: language === 'ko' ? '새 비밀번호가 일치하지 않습니다.' : 'New passwords do not match.',
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: language === 'ko' ? '오류' : 'Error',
        description: language === 'ko' ? '비밀번호는 최소 6자 이상이어야 합니다.' : 'Password must be at least 6 characters long.',
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditName("");
    setEditEmail("");
    setEditPosition("");
    setEditMemo("");
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!user) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-lg">
          <div className="text-center py-8">
            <p>{language === 'ko' ? '사용자 정보를 불러올 수 없습니다.' : 'Unable to load user information.'}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold korean-text">
            {language === 'ko' ? '계정 설정' : 'Account Settings'}
          </DialogTitle>
          <DialogDescription>
            {language === 'ko' ? '계정 정보를 확인하고 편집할 수 있습니다.' : 'View and edit your account information.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold korean-text">
                {language === 'ko' ? '기본 정보' : 'Basic Information'}
              </h3>
            </div>
            
            {!isEditing ? (
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '이름' : 'Name'}
                  </span>
                  <span className="font-medium korean-text">
                    {user.name || `${user.lastName || ""}${user.firstName || ""}` || (language === 'ko' ? '정보 없음' : 'No information')}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '사용자명' : 'Username'}
                  </span>
                  <span className="font-mono text-sm">{user.username}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '이메일' : 'Email'}
                  </span>
                  <span className="text-sm">{user.email || (language === 'ko' ? '정보 없음' : 'No information')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '직책' : 'Position'}
                  </span>
                  <span className="korean-text">{user.position || (language === 'ko' ? '정보 없음' : 'No information')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '사용자 유형' : 'User Type'}
                  </span>
                  <Badge variant="outline" className="korean-text">
                    {getUserTypeLabel(user.userType)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {language === 'ko' ? '상태' : 'Status'}
                  </span>
                  <Badge variant={getStatusBadgeVariant(user.status || "active")} className="korean-text">
                    {getStatusLabel(user.status || "active")}
                  </Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Label htmlFor="editName">{language === 'ko' ? '이름' : 'Name'}</Label>
                  <Input
                    id="editName"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="korean-text"
                  />
                </div>
                
                <div>
                  <Label htmlFor="editEmail">{language === 'ko' ? '이메일' : 'Email'}</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="editPosition">{language === 'ko' ? '직책' : 'Position'}</Label>
                  <Input
                    id="editPosition"
                    value={editPosition}
                    onChange={(e) => setEditPosition(e.target.value)}
                    className="korean-text"
                  />
                </div>

                <div>
                  <Label htmlFor="editMemo">{language === 'ko' ? '메모' : 'Memo'}</Label>
                  <Textarea
                    id="editMemo"
                    value={editMemo}
                    onChange={(e) => setEditMemo(e.target.value)}
                    className="korean-text"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Organization Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold korean-text">
                {language === 'ko' ? '조직 정보' : 'Organization Information'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '상위 조직' : 'Upper Organization'}
                </span>
                <span className="korean-text">{user.upperCategory || (language === 'ko' ? '정보 없음' : 'No information')}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '하위 조직' : 'Lower Organization'}
                </span>
                <span className="korean-text">{user.lowerCategory || (language === 'ko' ? '정보 없음' : 'No information')}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '세부 조직' : 'Detail Organization'}
                </span>
                <span className="korean-text">{user.detailCategory || (language === 'ko' ? '정보 없음' : 'No information')}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Permission Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-500" />
              <h3 className="text-lg font-semibold korean-text">
                {language === 'ko' ? '권한 정보' : 'Permission Information'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '시스템 역할' : 'System Role'}
                </span>
                <Badge variant="secondary" className="korean-text">
                  {getRoleLabel(user.role || "일반 사용자")}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Activity Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <h3 className="text-lg font-semibold korean-text">
                {language === 'ko' ? '활동 정보' : 'Activity Information'}
              </h3>
            </div>
            
            <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '가입일' : 'Join Date'}
                </span>
                <span className="text-sm">{formatDate(user.createdAt || null)}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ko' ? '최근 로그인' : 'Last Login'}
                </span>
                <span className="text-sm">{formatDate(user.lastLoginAt || null)}</span>
              </div>
            </div>
          </div>

          {/* Additional Information (Memo) */}
          {user.userMemo && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-500" />
                  <h3 className="text-lg font-semibold korean-text">
                    {language === 'ko' ? '추가 정보' : 'Additional Information'}
                  </h3>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-sm korean-text">{user.userMemo}</p>
                </div>
              </div>
            </>
          )}

          {/* Password Change Section */}
          {showPasswordChange && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-5 w-5 text-red-500" />
                  <h3 className="text-lg font-semibold korean-text">
                    {language === 'ko' ? '비밀번호 변경' : 'Change Password'}
                  </h3>
                </div>
                
                <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <Label htmlFor="currentPassword">
                      {language === 'ko' ? '현재 비밀번호' : 'Current Password'}
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="newPassword">
                      {language === 'ko' ? '새 비밀번호' : 'New Password'}
                    </Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      {language === 'ko' ? '새 비밀번호 확인' : 'Confirm New Password'}
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending}
                      className="korean-text flex-1"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {changePasswordMutation.isPending ? 
                        (language === 'ko' ? '변경 중...' : 'Changing...') : 
                        (language === 'ko' ? '비밀번호 변경' : 'Change Password')
                      }
                    </Button>
                    
                    <Button 
                      onClick={() => setShowPasswordChange(false)}
                      variant="outline"
                      className="korean-text flex-1"
                    >
                      <X className="w-4 h-4 mr-2" />
                      {language === 'ko' ? '취소' : 'Cancel'}
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <Separator />
          
          <div className="flex flex-wrap gap-3 pt-4">
            {!isEditing && !showPasswordChange && (
              <>
                <Button 
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="korean-text flex-1 min-w-[120px]"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '프로필 편집' : 'Edit Profile'}
                </Button>
                
                <Button 
                  onClick={() => setShowPasswordChange(true)}
                  variant="outline"
                  className="korean-text flex-1 min-w-[120px]"
                >
                  <Key className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '비밀번호 변경' : 'Change Password'}
                </Button>
              </>
            )}
            
            {isEditing && (
              <>
                <Button 
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="korean-text flex-1 min-w-[100px]"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? 
                    (language === 'ko' ? '저장 중...' : 'Saving...') : 
                    (language === 'ko' ? '저장' : 'Save')
                  }
                </Button>
                
                <Button 
                  onClick={handleCancelEditing}
                  variant="outline"
                  className="korean-text flex-1 min-w-[100px]"
                >
                  <X className="w-4 h-4 mr-2" />
                  {language === 'ko' ? '취소' : 'Cancel'}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}