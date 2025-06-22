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
import { 
  Users, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  Settings, 
  Database,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Plus,
  Edit,
  Trash2,
  Eye,
  LogOut,
  Home,
  User,
  GraduationCap,
  BookOpen,
  Brain,
  Zap,
  Target,
  Coffee,
  Music,
  Heart,
  Upload,
  ChevronDown
} from "lucide-react";
import { Link } from "wouter";
import OrganizationSelector from "@/components/OrganizationSelector";

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
  category: z.string().min(1, "카테고리를 선택해주세요"),
  personality: z.string().optional(),
  managerId: z.string().min(1, "관리자를 선택해주세요"),
  organizationId: z.string().min(1, "소속 조직을 선택해주세요"),
  llmModel: z.string().optional(),
  chatbotType: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [isIconChangeDialogOpen, setIsIconChangeDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [editSelectedUniversity, setEditSelectedUniversity] = useState('all');
  const [editSelectedCollege, setEditSelectedCollege] = useState('all');
  const [editSelectedDepartment, setEditSelectedDepartment] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");
  const { toast } = useToast();
  const { t } = useLanguage();

  const iconMap = {
    User,
    GraduationCap,
    BookOpen,
    Shield,
    Brain,
    Zap,
    Target,
    Coffee,
    Music,
    Heart
  };

  // 통계 데이터 조회
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // 사용자 목록 조회
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // 에이전트 목록 조회
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['/api/admin/agents'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agents');
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    }
  });

  // 관리자 목록 조회
  const { data: managers } = useQuery<User[]>({
    queryKey: ['/api/admin/managers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/managers');
      if (!response.ok) throw new Error('Failed to fetch managers');
      return response.json();
    }
  });

  // 조직 목록 조회
  const { data: organizations } = useQuery<any[]>({
    queryKey: ['/api/admin/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    }
  });

  // 검색 실행 함수
  const executeSearch = () => {
    setHasSearched(true);
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedUniversity('all');
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setUserSearchQuery('');
    setHasSearched(false);
  };

  // 필터링된 사용자 목록 계산
  const filteredUsers = useMemo(() => {
    if (!users || !hasSearched) return [];

    let filtered = users;

    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();

      if (query === '*') {
        filtered = users;
      } else {
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }
    }

    return filtered;
  }, [users, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment, hasSearched]);

  // 에이전트 생성 폼
  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      personality: "",
      managerId: "",
      organizationId: "",
      llmModel: "gpt-4o-mini",
      chatbotType: "doc-fallback-llm",
    },
  });

  // 에이전트 편집 폼
  const editAgentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      personality: "",
      managerId: "",
      organizationId: "",
    },
  });

  // 에이전트 생성 뮤테이션
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const payload = {
        ...data,
        icon: "User",
        backgroundColor: "blue",
        managerId: data.managerId,
        organizationId: parseInt(data.organizationId),
      };
      const response = await apiRequest("POST", "/api/admin/agents", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/managed'] });
      toast({
        title: "성공",
        description: "새 에이전트가 생성되었습니다.",
      });
      setIsAgentDialogOpen(false);
      agentForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "에이전트 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 아이콘 변경 뮤테이션
  const changeIconMutation = useMutation({
    mutationFn: async ({ agentId, icon, backgroundColor }: { agentId: number, icon: string, backgroundColor: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/agents/${agentId}/icon`, { icon, backgroundColor });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/managed'] });
      toast({
        title: "성공",
        description: "아이콘이 변경되었습니다.",
      });
      setIsIconChangeDialogOpen(false);
      setIconChangeAgent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "아이콘 변경에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleIconChange = () => {
    if (iconChangeAgent) {
      changeIconMutation.mutate({
        agentId: iconChangeAgent.id,
        icon: selectedIcon,
        backgroundColor: selectedBgColor
      });
    }
  };

  // 에이전트 편집 뮤테이션
  const updateAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData & { id: number }) => {
      const payload = {
        name: data.name,
        description: data.description,
        category: data.category,
        personality: data.personality,
        managerId: data.managerId,
        organizationId: parseInt(data.organizationId),
      };
      const response = await apiRequest("PATCH", `/api/admin/agents/${data.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/managed'] });
      toast({
        title: "성공",
        description: "에이전트 정보가 수정되었습니다.",
      });
      setIsEditAgentDialogOpen(false);
      setEditingAgent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "에이전트 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const openEditAgentDialog = (agent: Agent) => {
    setEditingAgent(agent);
    editAgentForm.reset({
      name: agent.name,
      description: agent.description,
      category: agent.category,
      personality: (agent as any).personalityTraits || "",
      managerId: (agent as any).managerId || "",
      organizationId: (agent as any).organizationId?.toString() || "",
    });
    
    // 편집시 조직 선택 상태 초기화
    setEditSelectedUniversity('all');
    setEditSelectedCollege('all');
    setEditSelectedDepartment('all');
    
    setIsEditAgentDialogOpen(true);
  };

  const openIconChangeDialog = (agent: Agent) => {
    setIconChangeAgent(agent);
    setSelectedIcon(agent.icon);
    setSelectedBgColor(agent.backgroundColor);
    setIsIconChangeDialogOpen(true);
  };

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      window.location.href = '/auth';
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  마스터 관리자 시스템
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  대학교 AI 챗봇 서비스 통합 관리
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/', '_blank')}
              >
                챗봇 서비스
              </Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-4 h-4 mr-2" />
              에이전트 관리
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageSquare className="w-4 h-4 mr-2" />
              질문/응답 로그
            </TabsTrigger>
            <TabsTrigger value="tokens">
              <Shield className="w-4 h-4 mr-2" />
              토큰 관리
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Database className="w-4 h-4 mr-2" />
              카테고리 관리
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              문서 관리
            </TabsTrigger>
            <TabsTrigger value="system">
              <Settings className="w-4 h-4 mr-2" />
              시스템 설정
            </TabsTrigger>
          </TabsList>

          {/* 대시보드 */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    활성 사용자: {stats?.activeUsers || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 에이전트</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    활성 에이전트: {stats?.activeAgents || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 대화</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    총 메시지: {stats?.totalMessages || 0}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">오늘 활동</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.todayMessages || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    주간 증가율: +{stats?.weeklyGrowth || 0}%
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 시스템 상태 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>시스템 상태</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">데이터베이스</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      정상
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OpenAI API</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      정상
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">세션 스토어</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      정상
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">파일 업로드</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      정상
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>최근 활동</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm">
                      <span className="text-muted-foreground">10분 전</span>
                      <br />
                      새로운 사용자 가입: F2024002
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">1시간 전</span>
                      <br />
                      에이전트 '학사 도우미' 활성화
                    </div>
                    <div className="text-sm">
                      <span className="text-muted-foreground">3시간 전</span>
                      <br />
                      문서 업로드: 2024학년도 수강신청 안내.pdf
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 사용자 관리 */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">사용자 관리</h2>
            </div>

            {/* 조직 필터링 및 검색 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">사용자 검색 및 관리</h3>

              {/* 조직 필터 */}
              <div className="flex items-center justify-between">
                <OrganizationSelector
                  selectedUniversity={selectedUniversity}
                  selectedCollege={selectedCollege}
                  selectedDepartment={selectedDepartment}
                  onUniversityChange={setSelectedUniversity}
                  onCollegeChange={setSelectedCollege}
                  onDepartmentChange={setSelectedDepartment}
                  showApplyButton={true}
                  onApply={() => {}}
                />
                <Button variant="outline" onClick={resetFilters}>
                  필터 초기화
                </Button>
              </div>

              {/* 사용자 검색 */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="이름, 학번, 교번으로 검색..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                    />
                  </div>
                  <Button onClick={executeSearch}>
                    사용자 검색
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 <strong>*</strong>을 입력하고 검색하면 선택된 조직 범위에서 전체 사용자를 조회할 수 있습니다.
                </p>
              </div>

              {/* 검색 결과 표시 */}
              {hasSearched && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  검색 결과: {filteredUsers?.length || 0}명
                  {userSearchQuery && ` (검색어: "${userSearchQuery}")`}
                </div>
              )}
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          학번/교번
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이메일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          역할
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          마지막 로그인
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {user.email || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <Badge variant={user.role === 'faculty' ? 'default' : 'secondary'}>
                              {user.role === 'student' ? '학생' : user.role === 'faculty' ? '교직원' : '관리자'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? '활성' : '비활성'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : '없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 에이전트 관리 */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">에이전트 관리</h2>
              <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    새 에이전트 생성
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>새 에이전트 생성</DialogTitle>
                  </DialogHeader>
                  <Form {...agentForm}>
                    <form onSubmit={agentForm.handleSubmit((data) => createAgentMutation.mutate(data))} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={agentForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>에이전트 이름</FormLabel>
                              <FormControl>
                                <Input placeholder="예: 학사 도우미" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={agentForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>카테고리</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="카테고리를 선택하세요" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="학교">학교</SelectItem>
                                  <SelectItem value="교수">교수</SelectItem>
                                  <SelectItem value="학생">학생</SelectItem>
                                  <SelectItem value="그룹">그룹</SelectItem>
                                  <SelectItem value="기능형">기능형</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={agentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>설명</FormLabel>
                            <FormControl>
                              <Textarea placeholder="에이전트에 대한 설명을 입력하세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={agentForm.control}
                          name="managerId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>관리자</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="관리자를 선택하세요" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {managers?.map((manager) => (
                                    <SelectItem key={manager.id} value={manager.id}>
                                      {manager.firstName} {manager.lastName} ({manager.username})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={agentForm.control}
                          name="organizationId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>소속 조직</FormLabel>
                              <div className="grid grid-cols-3 gap-2">
                                <Select 
                                  value={selectedUniversity} 
                                  onValueChange={(value) => {
                                    setSelectedUniversity(value);
                                    setSelectedCollege('all');
                                    setSelectedDepartment('all');
                                    field.onChange('');
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="전체" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    {organizations?.map((org) => (
                                      <SelectItem key={org.id} value={org.id.toString()}>
                                        {org.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>

                                <Select 
                                  value={selectedCollege} 
                                  onValueChange={(value) => {
                                    setSelectedCollege(value);
                                    setSelectedDepartment('all');
                                    if (value !== 'all') {
                                      field.onChange(value);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                  disabled={selectedUniversity === 'all'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="단과대학" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    {selectedUniversity !== 'all' && organizations
                                      ?.find(org => org.id.toString() === selectedUniversity)
                                      ?.colleges?.map((college: any) => (
                                        <SelectItem key={college.id} value={college.id.toString()}>
                                          {college.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>

                                <Select 
                                  value={selectedDepartment} 
                                  onValueChange={(value) => {
                                    setSelectedDepartment(value);
                                    if (value !== 'all') {
                                      field.onChange(value);
                                    } else if (selectedCollege !== 'all') {
                                      field.onChange(selectedCollege);
                                    } else {
                                      field.onChange('');
                                    }
                                  }}
                                  disabled={selectedCollege === 'all'}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="학과" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="all">전체</SelectItem>
                                    {selectedCollege !== 'all' && organizations
                                      ?.find(org => org.id.toString() === selectedUniversity)
                                      ?.colleges?.find((college: any) => college.id.toString() === selectedCollege)
                                      ?.departments?.map((dept: any) => (
                                        <SelectItem key={dept.id} value={dept.id.toString()}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAgentDialogOpen(false)}>
                          취소
                        </Button>
                        <Button type="submit" disabled={createAgentMutation.isPending}>
                          {createAgentMutation.isPending ? "생성 중..." : "생성하기"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents?.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg bg-${agent.backgroundColor}-500`}>
                          {React.createElement(iconMap[agent.icon as keyof typeof iconMap] || User, { className: "w-6 h-6 text-white" })}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{agent.name}</CardTitle>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{agent.description}</p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => openIconChangeDialog(agent)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>카테고리: {agent.category}</span>
                      <Badge variant="outline">{agent.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>메시지 수:</span>
                      <span className="font-medium">{agent.messageCount}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditAgentDialog(agent)}>
                        <Edit className="w-4 h-4 mr-1" />
                        편집
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        <BarChart3 className="w-4 h-4 mr-1" />
                        통계
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* 기타 탭들은 간단한 플레이스홀더로 구현 */}
          <TabsContent value="conversations">
            <Card>
              <CardHeader>
                <CardTitle>질문/응답 로그</CardTitle>
              </CardHeader>
              <CardContent>
                <p>질문/응답 로그 관리 기능이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tokens">
            <Card>
              <CardHeader>
                <CardTitle>토큰 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p>API 토큰 및 인증 관리 기능이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories">
            <Card>
              <CardHeader>
                <CardTitle>카테고리 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p>에이전트 카테고리 관리 기능이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card>
              <CardHeader>
                <CardTitle>문서 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <p>문서 업로드 및 관리 기능이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <p>시스템 전체 설정 관리 기능이 여기에 표시됩니다.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 에이전트 편집 다이얼로그 */}
        <Dialog open={isEditAgentDialogOpen} onOpenChange={setIsEditAgentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>에이전트 편집</DialogTitle>
            </DialogHeader>
            <Form {...editAgentForm}>
              <form onSubmit={editAgentForm.handleSubmit((data) => updateAgentMutation.mutate({ ...data, id: editingAgent!.id }))} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editAgentForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>에이전트 이름</FormLabel>
                        <FormControl>
                          <Input placeholder="예: 학사 도우미" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editAgentForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>카테고리</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="카테고리를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="학교">학교</SelectItem>
                            <SelectItem value="교수">교수</SelectItem>
                            <SelectItem value="학생">학생</SelectItem>
                            <SelectItem value="그룹">그룹</SelectItem>
                            <SelectItem value="기능형">기능형</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editAgentForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>설명</FormLabel>
                      <FormControl>
                        <Textarea placeholder="에이전트에 대한 설명을 입력하세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editAgentForm.control}
                    name="managerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>관리자</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="관리자를 선택하세요" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {managers?.map((manager) => (
                              <SelectItem key={manager.id} value={manager.id}>
                                {manager.firstName} {manager.lastName} ({manager.username})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editAgentForm.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>소속 조직</FormLabel>
                        <div className="grid grid-cols-3 gap-2">
                          <Select 
                            value={editSelectedUniversity} 
                            onValueChange={(value) => {
                              setEditSelectedUniversity(value);
                              setEditSelectedCollege('all');
                              setEditSelectedDepartment('all');
                              field.onChange('');
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="전체" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              {organizations?.map((org) => (
                                <SelectItem key={org.id} value={org.id.toString()}>
                                  {org.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            value={editSelectedCollege} 
                            onValueChange={(value) => {
                              setEditSelectedCollege(value);
                              setEditSelectedDepartment('all');
                              if (value !== 'all') {
                                field.onChange(value);
                              } else {
                                field.onChange('');
                              }
                            }}
                            disabled={editSelectedUniversity === 'all'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="단과대학" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              {editSelectedUniversity !== 'all' && organizations
                                ?.find(org => org.id.toString() === editSelectedUniversity)
                                ?.colleges?.map((college: any) => (
                                  <SelectItem key={college.id} value={college.id.toString()}>
                                    {college.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>

                          <Select 
                            value={editSelectedDepartment} 
                            onValueChange={(value) => {
                              setEditSelectedDepartment(value);
                              if (value !== 'all') {
                                field.onChange(value);
                              } else if (editSelectedCollege !== 'all') {
                                field.onChange(editSelectedCollege);
                              } else {
                                field.onChange('');
                              }
                            }}
                            disabled={editSelectedCollege === 'all'}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="학과" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">전체</SelectItem>
                              {editSelectedCollege !== 'all' && organizations
                                ?.find(org => org.id.toString() === editSelectedUniversity)
                                ?.colleges?.find((college: any) => college.id.toString() === editSelectedCollege)
                                ?.departments?.map((dept: any) => (
                                  <SelectItem key={dept.id} value={dept.id.toString()}>
                                    {dept.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditAgentDialogOpen(false)}>
                    취소
                  </Button>
                  <Button type="submit" disabled={updateAgentMutation.isPending}>
                    {updateAgentMutation.isPending ? "수정 중..." : "수정하기"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 아이콘 변경 다이얼로그 */}
        <Dialog open={isIconChangeDialogOpen} onOpenChange={setIsIconChangeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>아이콘 변경</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 아이콘 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">아이콘 선택</h3>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(iconMap).map(([iconName, IconComponent]) => (
                    <Button
                      key={iconName}
                      variant="outline"
                      size="sm"
                      className={`h-12 w-12 p-0 border-2 ${selectedIcon === iconName ? 'border-black' : 'border-gray-200'}`}
                      onClick={() => setSelectedIcon(iconName)}
                    >
                      <IconComponent className="w-6 h-6" />
                    </Button>
                  ))}
                </div>
              </div>

              {/* 배경색 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">배경색 선택</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { color: "blue", className: "bg-blue-500" },
                    { color: "green", className: "bg-green-500" },
                    { color: "purple", className: "bg-purple-500" },
                    { color: "red", className: "bg-red-500" },
                    { color: "orange", className: "bg-orange-500" },
                    { color: "pink", className: "bg-pink-500" },
                    { color: "yellow", className: "bg-yellow-500" },
                    { color: "cyan", className: "bg-cyan-500" },
                    { color: "gray", className: "bg-gray-500" },
                    { color: "indigo", className: "bg-indigo-500" }
                  ].map(({ color, className: bgClass }) => (
                    <Button
                      key={color}
                      variant="outline"
                      size="sm"
                      className={`h-12 w-12 p-0 border-2 ${selectedBgColor === color ? 'border-black' : 'border-gray-200'}`}
                      onClick={() => setSelectedBgColor(color)}
                    >
                      <div className={`w-8 h-8 rounded ${bgClass}`}></div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* 버튼 */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsIconChangeDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleIconChange} disabled={changeIconMutation.isPending}>
                  {changeIconMutation.isPending ? "변경 중..." : "변경하기"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}