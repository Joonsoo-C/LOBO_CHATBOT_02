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
  Upload
} from "lucide-react";
import { Link } from "wouter";

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
});

type AgentFormData = z.infer<typeof agentSchema>;

export default function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [isIconChangeDialogOpen, setIsIconChangeDialogOpen] = useState(false);
  const [isLmsDialogOpen, setIsLmsDialogOpen] = useState(false);
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
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

  // 필터링된 사용자 목록 계산
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = users;
    
    // 검색어 필터링
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.firstName?.toLowerCase().includes(query) ||
        user.lastName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query)
      );
    }
    
    // 조직 필터링 (현재는 기본 구현, 실제로는 사용자 테이블에 조직 정보가 필요)
    // TODO: 사용자 스키마에 조직 정보 추가 후 실제 필터링 구현
    
    return filtered;
  }, [users, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment]);

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
        icon: "User", // 기본 아이콘
        backgroundColor: "blue", // 기본 배경색
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
              <Link href="/">
                <Button variant="outline" size="sm">
                  <Home className="w-4 h-4 mr-2" />
                  메인 서비스
                </Button>
              </Link>
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
          <TabsList className="grid w-full grid-cols-5">
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
              대화 모니터링
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

            {/* 사용자 관리 방법 안내 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card 
                className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsLmsDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    LMS 연동 (권장)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    대학 LMS 시스템과 연동하여 사용자 정보를 자동으로 동기화합니다.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-green-200 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsFileUploadDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    파일 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    CSV/Excel 파일을 업로드하여 다수의 사용자를 일괄 등록합니다.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 조직 필터링 및 검색 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">사용자 검색 및 관리</h3>
              
              {/* 조직 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>전체/대학원/대학교</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="graduate">대학원</SelectItem>
                      <SelectItem value="undergraduate">대학교</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>단과대학</Label>
                  <Select value={selectedCollege} onValueChange={setSelectedCollege} disabled={selectedUniversity === 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="engineering">공과대학</SelectItem>
                      <SelectItem value="business">경영대학</SelectItem>
                      <SelectItem value="liberal">인문대학</SelectItem>
                      <SelectItem value="science">자연과학대학</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>학과</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={selectedCollege === 'all' || selectedUniversity === 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="computer">컴퓨터공학과</SelectItem>
                      <SelectItem value="electrical">전자공학과</SelectItem>
                      <SelectItem value="mechanical">기계공학과</SelectItem>
                      <SelectItem value="business_admin">경영학과</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => {
                    setSelectedUniversity('all');
                    setSelectedCollege('all');
                    setSelectedDepartment('all');
                    setUserSearchQuery('');
                  }}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* 사용자 검색 */}
              <div className="flex space-x-2">
                <div className="flex-1">
                  <Input
                    placeholder="이름, 학번, 교번으로 검색..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                  />
                </div>
                <Button>
                  <Users className="w-4 h-4 mr-2" />
                  새 사용자 추가
                </Button>
              </div>
              
              {/* 검색 결과 표시 */}
              <div className="text-sm text-gray-600 dark:text-gray-400">
                전체 {filteredUsers?.length || 0}명의 사용자
                {userSearchQuery && ` (검색어: "${userSearchQuery}")`}
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자
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
                      {filteredUsers?.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.role === 'faculty' ? 'default' : 'secondary'}>
                              {user.role === 'faculty' ? '교직원' : '학생'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={user.isActive ? 'default' : 'secondary'}>
                              {user.isActive ? '활성' : '비활성'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('ko-KR') : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
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
                    새 에이전트 추가
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
                                    <SelectValue placeholder="카테고리 선택" />
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
                              <Textarea placeholder="에이전트의 역할과 기능을 설명해주세요" {...field} />
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
                              <FormLabel>에이전트 관리자</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="관리자 선택" />
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
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="조직 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {organizations?.map((org) => (
                                    <>
                                      <SelectItem key={org.id} value={org.id.toString()}>
                                        {org.name} ({org.type === 'university' ? '대학교' : 
                                          org.type === 'graduate_school' ? '대학원' : 
                                          org.type === 'college' ? '단과대학' : '학과'})
                                      </SelectItem>
                                      {org.children?.map((college: any) => (
                                        <>
                                          <SelectItem key={college.id} value={college.id.toString()}>
                                            └ {college.name} ({college.type === 'college' ? '단과대학' : '학과'})
                                          </SelectItem>
                                          {college.children?.map((dept: any) => (
                                            <SelectItem key={dept.id} value={dept.id.toString()}>
                                              &nbsp;&nbsp;&nbsp;&nbsp;└ {dept.name} (학과)
                                            </SelectItem>
                                          ))}
                                        </>
                                      ))}
                                    </>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={agentForm.control}
                        name="personality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>성격/말투 (선택사항)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="에이전트의 성격이나 말투를 설명해주세요" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={() => setIsAgentDialogOpen(false)}>
                          취소
                        </Button>
                        <Button type="submit" disabled={createAgentMutation.isPending}>
                          {createAgentMutation.isPending ? "생성 중..." : "에이전트 생성"}
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
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className={`w-12 h-12 rounded-full flex items-center justify-center bg-${agent.backgroundColor}-500`}
                        >
                          {(() => {
                            const IconComponent = iconMap[agent.icon as keyof typeof iconMap] || User;
                            return <IconComponent className="w-6 h-6 text-white" />;
                          })()}
                        </div>
                        <CardTitle className="text-lg">{agent.name}</CardTitle>
                      </div>
                      <Badge variant={agent.isActive ? 'default' : 'secondary'}>
                        {agent.isActive ? '활성' : '비활성'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </p>
                    <div className="flex items-center justify-between text-sm">
                      <span>카테고리: {agent.category}</span>
                      <Badge variant="outline">{agent.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>메시지 수:</span>
                      <span className="font-medium">{agent.messageCount}</span>
                    </div>
                    {(agent as any).managerFirstName && (
                      <div className="flex items-center justify-between text-sm">
                        <span>관리자:</span>
                        <span className="font-medium">{(agent as any).managerFirstName} {(agent as any).managerLastName}</span>
                      </div>
                    )}
                    {(agent as any).organizationName && (
                      <div className="flex items-center justify-between text-sm">
                        <span>소속:</span>
                        <span className="font-medium">{(agent as any).organizationName}</span>
                      </div>
                    )}
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

          {/* 대화 모니터링 */}
          <TabsContent value="conversations" className="space-y-6">
            <h2 className="text-2xl font-bold">대화 모니터링</h2>
            <Card>
              <CardHeader>
                <CardTitle>실시간 대화 현황</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">실시간 대화 모니터링 기능은 곧 출시됩니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시스템 설정 */}
          <TabsContent value="system" className="space-y-6">
            <h2 className="text-2xl font-bold">시스템 설정</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>OpenAI 설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>API 키</Label>
                    <Input type="password" placeholder="sk-..." />
                  </div>
                  <div className="space-y-2">
                    <Label>기본 모델</Label>
                    <Select defaultValue="gpt-4o">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button>설정 저장</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>데이터베이스 관리</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      데이터베이스 백업
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="w-4 h-4 mr-2" />
                      로그 다운로드
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      사용량 분석
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* 에이전트 편집 다이얼로그 */}
        <Dialog open={isEditAgentDialogOpen} onOpenChange={setIsEditAgentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 에이전트 설정</DialogTitle>
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
                              <SelectValue placeholder="카테고리 선택" />
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
                        <Textarea placeholder="에이전트의 역할과 기능을 설명해주세요" {...field} />
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
                        <FormLabel>에이전트 관리자</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="관리자 선택" />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="조직 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {organizations?.map((org) => (
                              <>
                                <SelectItem key={org.id} value={org.id.toString()}>
                                  {org.name} ({org.type === 'university' ? '대학교' : 
                                    org.type === 'graduate_school' ? '대학원' : 
                                    org.type === 'college' ? '단과대학' : '학과'})
                                </SelectItem>
                                {org.children?.map((college: any) => (
                                  <>
                                    <SelectItem key={college.id} value={college.id.toString()}>
                                      └ {college.name} ({college.type === 'college' ? '단과대학' : '학과'})
                                    </SelectItem>
                                    {college.children?.map((dept: any) => (
                                      <SelectItem key={dept.id} value={dept.id.toString()}>
                                        &nbsp;&nbsp;&nbsp;&nbsp;└ {dept.name} (학과)
                                      </SelectItem>
                                    ))}
                                  </>
                                ))}
                              </>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={editAgentForm.control}
                  name="personality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>성격/말투 (선택사항)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="에이전트의 성격이나 말투를 설명해주세요" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => openIconChangeDialog(editingAgent!)}
                  >
                    아이콘 편집
                  </Button>
                  <div className="flex space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditAgentDialogOpen(false)}>
                      취소
                    </Button>
                    <Button type="submit" disabled={updateAgentMutation.isPending}>
                      {updateAgentMutation.isPending ? "수정 중..." : "에이전트 수정"}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* LMS 연동 다이얼로그 */}
        <Dialog open={isLmsDialogOpen} onOpenChange={setIsLmsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>LMS 연동 설정</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lms-type">LMS 유형</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="LMS 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blackboard">Blackboard</SelectItem>
                      <SelectItem value="moodle">Moodle</SelectItem>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="sakai">Sakai</SelectItem>
                      <SelectItem value="d2l">D2L Brightspace</SelectItem>
                      <SelectItem value="custom">사용자 정의</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="lms-url">LMS 서버 URL</Label>
                  <Input 
                    id="lms-url" 
                    placeholder="https://lms.university.edu" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="api-key">API 키</Label>
                  <Input 
                    id="api-key" 
                    type="password"
                    placeholder="LMS API 키 입력" 
                  />
                </div>
                <div>
                  <Label htmlFor="sync-interval">동기화 주기</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="동기화 주기 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1시간마다</SelectItem>
                      <SelectItem value="6h">6시간마다</SelectItem>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                      <SelectItem value="manual">수동</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label>동기화 범위</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="sync-students" className="rounded" />
                    <Label htmlFor="sync-students">학생 정보</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="sync-faculty" className="rounded" />
                    <Label htmlFor="sync-faculty">교수진 정보</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="sync-courses" className="rounded" />
                    <Label htmlFor="sync-courses">강의 정보</Label>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">연동 상태</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  현재 LMS와 연동되지 않음. 위 설정을 완료한 후 연결 테스트를 진행하세요.
                </p>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsLmsDialogOpen(false)}>
                  취소
                </Button>
                <Button variant="outline">
                  연결 테스트
                </Button>
                <Button>
                  연동 시작
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 파일 업로드 다이얼로그 */}
        <Dialog open={isFileUploadDialogOpen} onOpenChange={setIsFileUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>사용자 파일 업로드</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mb-4">
                  CSV, XLSX 파일 지원 (최대 10MB)
                </p>
                <Button variant="outline">
                  파일 선택
                </Button>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">파일 형식 요구사항</h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 첫 번째 행: 헤더 (username, firstName, lastName, email, userType)</p>
                  <p>• username: 학번/교번 (필수)</p>
                  <p>• userType: "student" 또는 "faculty" (필수)</p>
                  <p>• email: 이메일 주소 (선택)</p>
                </div>
              </div>

              <div>
                <Label>업로드 옵션</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="overwrite-existing" className="rounded" />
                    <Label htmlFor="overwrite-existing">기존 사용자 정보 덮어쓰기</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="send-welcome" className="rounded" />
                    <Label htmlFor="send-welcome">신규 사용자에게 환영 이메일 발송</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="validate-only" className="rounded" />
                    <Label htmlFor="validate-only">검증만 수행 (실제 업로드 안함)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFileUploadDialogOpen(false)}>
                  취소
                </Button>
                <Button variant="outline">
                  샘플 파일 다운로드
                </Button>
                <Button>
                  업로드 시작
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 아이콘 변경 다이얼로그 */}
        <Dialog open={isIconChangeDialogOpen} onOpenChange={setIsIconChangeDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>아이콘 변경</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 아이콘 미리보기 */}
              <div className="flex justify-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-${selectedBgColor}-500`}>
                  {(() => {
                    const IconComponent = iconMap[selectedIcon as keyof typeof iconMap] || User;
                    return <IconComponent className="w-6 h-6 text-white" />;
                  })()}
                </div>
              </div>

              {/* 아이콘 유형 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">아이콘 유형</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={selectedIcon !== "custom" ? "default" : "outline"} 
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedIcon("User")}
                  >
                    기본 아이콘
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    disabled
                  >
                    이미지 업로드
                  </Button>
                </div>
              </div>

              {/* 아이콘 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">아이콘 선택</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { icon: "User" },
                    { icon: "GraduationCap" },
                    { icon: "BookOpen" },
                    { icon: "Shield" },
                    { icon: "Brain" },
                    { icon: "Zap" },
                    { icon: "Target" },
                    { icon: "Coffee" },
                    { icon: "Music" },
                    { icon: "Heart" }
                  ].map(({ icon }) => {
                    const IconComponent = iconMap[icon as keyof typeof iconMap];
                    return (
                      <Button
                        key={icon}
                        variant={selectedIcon === icon ? "default" : "outline"}
                        size="sm"
                        className="h-12 w-12 p-0"
                        onClick={() => setSelectedIcon(icon)}
                      >
                        <IconComponent className="w-5 h-5" />
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* 배경색 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">배경색 선택</h3>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { color: "blue", class: "bg-blue-500" },
                    { color: "green", class: "bg-green-500" },
                    { color: "purple", class: "bg-purple-500" },
                    { color: "red", class: "bg-red-500" },
                    { color: "orange", class: "bg-orange-500" },
                    { color: "pink", class: "bg-pink-500" },
                    { color: "yellow", class: "bg-yellow-500" },
                    { color: "cyan", class: "bg-cyan-500" },
                    { color: "gray", class: "bg-gray-500" },
                    { color: "indigo", class: "bg-indigo-500" }
                  ].map(({ color, class: bgClass }) => (
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