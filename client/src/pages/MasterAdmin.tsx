import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Import organization categories
import { 
  organizationCategories, 
  getUniqueUpperCategories, 
  getUniqueLowerCategories, 
  getUniqueDetailCategories 
} from "../../../server/organization-categories";

import { NewCategoryDialog } from "@/components/NewCategoryDialog";
import { CategoryEditDialog } from "@/components/CategoryEditDialog";

import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Bot,
  BotMessageSquare,
  MessageSquare,
  FileText,
  Database,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Building2,
  UserCog,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogOut,
  RotateCcw,
  X,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Key,
  Lock,
  Unlock,
  Star,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Flag,
  Share2,
  ExternalLink,
  Copy,
  Archive,
  Unarchive,
  Pin,
  Unpin,
  Globe,
  Wifi,
  WifiOff,
  Signal,
  Zap,
  Cpu,
  HardDrive,
  Memory
} from "lucide-react";

interface User {
  id: string;
  username: string;
  role: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  backgroundColor: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
  averageRating?: number;
}

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  totalMessages: number;
  todayMessages: number;
  weeklyGrowth: number;
}

const agentSchema = z.object({
  name: z.string().min(1, "에이전트 이름은 필수입니다"),
  description: z.string().min(1, "설명은 필수입니다"),
  category: z.string().min(1, "카테고리는 필수입니다"),
  icon: z.string().default("User"),
  backgroundColor: z.string().default("blue"),
  isActive: z.boolean().default(true),
});

const userEditSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email("올바른 이메일을 입력하세요").optional(),
  role: z.string().min(1, "역할은 필수입니다"),
  isActive: z.boolean(),
  notes: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;
type UserEditFormData = z.infer<typeof userEditSchema>;

function MasterAdmin() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [isIconChangeDialogOpen, setIsIconChangeDialogOpen] = useState(false);
  const [isLmsDialogOpen, setIsLmsDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [userSortField, setUserSortField] = useState<string>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedDocumentPeriod, setSelectedDocumentPeriod] = useState('all');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);
  const [isCategoryEditDialogOpen, setIsCategoryEditDialogOpen] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<any>(null);
  const [organizationPage, setOrganizationPage] = useState(1);
  const [organizationPerPage] = useState(10);

  // Organization Categories data
  const organizationCategoriesQuery = useQuery({
    queryKey: ['/api/admin/organizations'],
    queryFn: async () => {
      // Use imported organization categories data
      return organizationCategories;
    },
  });

  const organizationCategoriesData = organizationCategoriesQuery.data || [];

  // 새 카테고리 생성 핸들러  
  const handleNewCategorySubmit = (data: any) => {
    toast({
      title: "새 카테고리 생성",
      description: `${data.categoryName} 카테고리가 성공적으로 생성되었습니다.`,
    });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await apiRequest('/api/auth/logout', {
        method: 'POST',
      });
      window.location.href = '/auth';
    } catch (error) {
      console.error('Logout failed:', error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  const tabsContent = (
    <>
      {/* 대시보드 */}
      <TabsContent value="dashboard" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +20% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">활성 에이전트</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 대화</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,890</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 메시지</CardTitle>
              <BotMessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">573</div>
              <p className="text-xs text-muted-foreground">
                +7% from yesterday
              </p>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* 에이전트 관리 */}
      <TabsContent value="agents" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">에이전트 관리</h2>
          <Button onClick={() => setIsAgentDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            새 에이전트 추가
          </Button>
        </div>
      </TabsContent>

      {/* 조직 카테고리 관리 */}
      <TabsContent value="categories" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">조직 카테고리 관리</h2>
            <p className="text-gray-600 dark:text-gray-400">대학 조직 구조를 관리하고 카테고리를 설정합니다.</p>
          </div>
          <Button 
            className="bg-blue-500 hover:bg-blue-600"
            onClick={() => setIsNewCategoryDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            새 카테고리 생성
          </Button>
        </div>

        {/* 조직 목록 테이블 */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>조직 목록</CardTitle>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                전체 {organizationCategoriesData?.length || 0}개 중 {Math.min(organizationPerPage, (organizationCategoriesData?.length || 0) - (organizationPage - 1) * organizationPerPage)}개 표시
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상위 조직
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      하위 조직
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      세부 조직
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      소속 인원
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      에이전트 수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      설정
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {organizationCategoriesData
                    ?.slice((organizationPage - 1) * organizationPerPage, organizationPage * organizationPerPage)
                    ?.map((org: any) => (
                    <tr key={org.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.type === 'university' ? org.name : (org.upperCategory || '미분류')}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {org.type === 'university' ? '대학교' :
                           org.type === 'college' ? '대학' :
                           org.type === 'department' ? '학과' :
                           org.type === 'center' ? '센터' : '기타'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.type !== 'university' ? org.name : (org.lowerCategory || '미분류')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {org.detailCategory || '미분류'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.memberCount || 0}명
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.agentCount || 0}개
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          onClick={() => {
                            setSelectedOrganization(org);
                            setIsCategoryEditDialogOpen(true);
                          }}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 페이지네이션 */}
            {organizationCategoriesData && organizationCategoriesData.length > organizationPerPage && (
              <div className="flex items-center justify-between px-6 py-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    <span className="font-medium">{(organizationPage - 1) * organizationPerPage + 1}</span>
                    {' - '}
                    <span className="font-medium">
                      {Math.min(organizationPage * organizationPerPage, organizationCategoriesData.length)}
                    </span>
                    {' of '}
                    <span className="font-medium">{organizationCategoriesData.length}</span>
                    {' results'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrganizationPage(organizationPage - 1)}
                    disabled={organizationPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    이전
                  </Button>
                  <div className="flex space-x-1">
                    {Array.from(
                      { length: Math.ceil(organizationCategoriesData.length / organizationPerPage) },
                      (_, i) => i + 1
                    )
                      .filter(page => 
                        page === 1 || 
                        page === Math.ceil(organizationCategoriesData.length / organizationPerPage) ||
                        Math.abs(page - organizationPage) <= 2
                      )
                      .map((page, index, arr) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && arr[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-500">...</span>
                          )}
                          <Button
                            variant={page === organizationPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => setOrganizationPage(page)}
                            className="w-10"
                          >
                            {page}
                          </Button>
                        </div>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setOrganizationPage(organizationPage + 1)}
                    disabled={organizationPage === Math.ceil(organizationCategoriesData.length / organizationPerPage)}
                  >
                    다음
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* 사용자 관리 */}
      <TabsContent value="users" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">사용자 관리</h2>
        </div>
      </TabsContent>

      {/* 문서 관리 */}
      <TabsContent value="documents" className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">문서 관리</h2>
        </div>
      </TabsContent>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">마스터 관리자</h1>
            <p className="text-gray-600 dark:text-gray-400">시스템 전체를 관리합니다.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="w-4 h-4" />
            <span>로그아웃</span>
          </Button>
        </div>

        {/* 탭 네비게이션 */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="agents">에이전트 관리</TabsTrigger>
            <TabsTrigger value="categories">조직 카테고리</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="documents">문서 관리</TabsTrigger>
          </TabsList>

          {tabsContent}
        </Tabs>

        {/* 다이얼로그들 */}
        <NewCategoryDialog 
          open={isNewCategoryDialogOpen}
          onOpenChange={setIsNewCategoryDialogOpen}
          onSubmit={handleNewCategorySubmit}
        />

        <CategoryEditDialog
          open={isCategoryEditDialogOpen}
          onOpenChange={setIsCategoryEditDialogOpen}
          organization={selectedOrganization}
          onSave={(updatedOrg) => {
            toast({
              title: "조직 정보 업데이트",
              description: `${updatedOrg.name} 조직 정보가 성공적으로 업데이트되었습니다.`,
            });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
          }}
          onDelete={(orgId) => {
            toast({
              title: "조직 삭제",
              description: "조직이 성공적으로 삭제되었습니다.",
            });
            queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
          }}
        />
      </div>
    </div>
  );
}

export default MasterAdmin;