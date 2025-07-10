import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
  X
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
  const { t } = useLanguage();
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
    if (!dateString) return t('account.noInfo');
    try {
      return format(new Date(dateString), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch {
      return t('account.noInfo');
    }
  };

  const getUserTypeLabel = (userType: string) => {
    switch (userType) {
      case "student": return t('account.student');
      case "faculty": return t('account.faculty');
      case "admin": return t('account.admin');
      default: return userType;
    }
  };

  const getRoleLabel = (role: string) => {
    // Handle both Korean and English role values
    const roleMap: { [key: string]: string } = {
      "일반 사용자": "account.regularUser",
      "regular_user": "account.regularUser",
      "마스터 관리자": "account.masterAdmin",
      "master_admin": "account.masterAdmin",
      "운영 관리자": "account.operationManager",
      "operation_admin": "account.operationManager",
      "카테고리 관리자": "account.categoryManager",
      "category_admin": "account.categoryManager",
      "에이전트 관리자": "account.agentManager",
      "agent_admin": "account.agentManager",
      "QA 관리자": "account.qaManager",
      "qa_admin": "account.qaManager",
      "문서 관리자": "account.documentManager",
      "document_admin": "account.documentManager",
      "외부 사용자": "account.externalUser",
      "external_user": "account.externalUser",
    };

    const translationKey = roleMap[role];
    return translationKey ? t(translationKey) : (role || t('account.unknown'));
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
      case "active": return t('account.active');
      case "inactive": return t('account.inactive');
      case "locked": return t('account.locked');
      case "pending": return t('account.pending');
      default: return status || t('account.unknown');
    }
  };

  // Initialize edit form when user data is loaded
  const initializeEditForm = () => {
    if (user) {
      setEditName(user.name || `${user.lastName || ""}${user.firstName || ""}`);
      setEditEmail(user.email || "");
      setEditPosition(user.position || "");
      setEditMemo(user.userMemo || "");
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
        title: t('account.profileUpdated'),
        description: t('account.profileUpdatedSuccess'),
      });
      setIsEditing(false);
      refetch();
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('account.profileUpdateError'),
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
        title: t('account.passwordChanged'),
        description: t('account.passwordChangedSuccess'),
      });
      setShowPasswordChange(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: () => {
      toast({
        title: t('common.error'),
        description: t('account.passwordChangeError'),
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
        title: t('common.error'),
        description: t('account.passwordMismatch'),
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: t('common.error'),
        description: t('account.passwordTooShort'),
        variant: "destructive",
      });
      return;
    }

    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  const handleStartEditing = () => {
    initializeEditForm();
    setIsEditing(true);
  };

  const handleCancelEditing = () => {
    setIsEditing(false);
    setEditName("");
    setEditEmail("");
    setEditPosition("");
    setEditMemo("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto !z-[9999]">
        <DialogHeader className="pb-4">
          <DialogTitle className="text-xl font-bold korean-text">
            {t('home.accountSettings')}
          </DialogTitle>
        </DialogHeader>

        {user && user.username && (
          <div className="space-y-6">
            {/* 기본 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold korean-text">{t('account.basicInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.name')}</span>
                  <span className="font-medium korean-text">
                    {user.name || `${user.lastName || ""}${user.firstName || ""}`}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.username')}</span>
                  <span className="font-mono text-sm">{user.username}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.email')}</span>
                  <span className="text-sm">{user.email || t('account.noInfo')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.userType')}</span>
                  <Badge variant="outline" className="korean-text">
                    {getUserTypeLabel(user.userType)}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.status')}</span>
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
                <h3 className="text-lg font-semibold korean-text">{t('account.organizationInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.upperOrg')}</span>
                  <span className="korean-text">{user.upperCategory || t('account.noInfo')}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.lowerOrg')}</span>
                  <span className="korean-text">{user.lowerCategory || t('account.noInfo')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.detailOrg')}</span>
                  <span className="korean-text">{user.detailCategory || t('account.noInfo')}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.position')}</span>
                  <span className="korean-text">{user.position || t('account.noInfo')}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* 권한 정보 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold korean-text">{t('account.permissionInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.systemRole')}</span>
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
                <h3 className="text-lg font-semibold korean-text">{t('account.activityInfo')}</h3>
              </div>
              
              <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.joinDate')}</span>
                  <span className="text-sm">{formatDate(user.createdAt || null)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{t('account.lastLogin')}</span>
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
                    <h3 className="text-lg font-semibold korean-text">{t('account.additionalInfo')}</h3>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm korean-text">{user.userMemo}</p>
                  </div>
                </div>
              </>
            )}

            {/* 계정 관리 기능 버튼들 */}
            <Separator />
            
            <div className="flex flex-wrap gap-3 pt-4">
              {!isEditing && (
                <>
                  <Button 
                    onClick={handleStartEditing}
                    variant="outline"
                    className="korean-text flex-1 min-w-[120px]"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    {t('account.editProfile')}
                  </Button>
                  
                  <Button 
                    onClick={() => setShowPasswordChange(true)}
                    variant="outline"
                    className="korean-text flex-1 min-w-[120px]"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {t('account.changePassword')}
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
                    {updateProfileMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                  
                  <Button 
                    onClick={handleCancelEditing}
                    variant="outline"
                    className="korean-text flex-1 min-w-[100px]"
                  >
                    <X className="w-4 h-4 mr-2" />
                    {t('common.cancel')}
                  </Button>
                </>
              )}
            </div>
            
            {/* 프로필 수정 폼 */}
            {isEditing && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-md font-semibold korean-text">{t('account.editProfile')}</h4>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="edit-name" className="korean-text">{t('account.name')}</Label>
                      <Input
                        id="edit-name"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder={t('account.enterName')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-email" className="korean-text">{t('account.email')}</Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder={t('account.enterEmail')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-position" className="korean-text">{t('account.position')}</Label>
                      <Input
                        id="edit-position"
                        value={editPosition}
                        onChange={(e) => setEditPosition(e.target.value)}
                        placeholder={t('account.enterPosition')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-memo" className="korean-text">{t('account.memo')}</Label>
                      <Textarea
                        id="edit-memo"
                        value={editMemo}
                        onChange={(e) => setEditMemo(e.target.value)}
                        placeholder={t('account.enterMemo')}
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
            
            {/* 비밀번호 변경 폼 */}
            {showPasswordChange && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-md font-semibold korean-text">{t('account.changePassword')}</h4>
                    <Button
                      onClick={() => {
                        setShowPasswordChange(false);
                        setCurrentPassword("");
                        setNewPassword("");
                        setConfirmPassword("");
                      }}
                      variant="ghost"
                      size="sm"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="current-password" className="korean-text">{t('account.currentPassword')}</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder={t('account.enterCurrentPassword')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="new-password" className="korean-text">{t('account.newPassword')}</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder={t('account.enterNewPassword')}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="korean-text">{t('account.confirmPassword')}</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('account.enterConfirmPassword')}
                      />
                    </div>
                    
                    <Button 
                      onClick={handleChangePassword}
                      disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                      className="korean-text w-full"
                    >
                      <Key className="w-4 h-4 mr-2" />
                      {changePasswordMutation.isPending ? t('common.changing') : t('account.changePassword')}
                    </Button>
                  </div>
                </div>
              </>
            )}

            {/* 닫기 버튼 */}
            <div className="flex justify-end pt-4">
              <Button onClick={onClose} variant="outline" className="korean-text">
                {t('account.close')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}