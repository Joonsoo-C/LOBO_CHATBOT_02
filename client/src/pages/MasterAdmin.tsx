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
  const [hasSearched, setHasSearched] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [hasDocumentSearched, setHasDocumentSearched] = useState(false);
  const [isDocumentUploadDialogOpen, setIsDocumentUploadDialogOpen] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState('all');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");
  const [tokenPeriod, setTokenPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
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

  // 필터링된 사용자 목록 계산 (검색이 실행된 경우에만)
  const filteredUsers = useMemo(() => {
    if (!users || !hasSearched) return [];
    
    let filtered = users;
    
    // 검색어 필터링
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      
      // * 입력시 전체 검색 (조직 필터만 적용)
      if (query === '*') {
        // 전체 사용자 반환 (조직 필터는 아래에서 적용)
        filtered = users;
      } else {
        // 일반 검색 (이름, 학번, 교번, 이메일)
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(query) ||
          user.firstName?.toLowerCase().includes(query) ||
          user.lastName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
        );
      }
    }
    
    // 조직 필터링 (현재는 기본 구현, 실제로는 사용자 테이블에 조직 정보가 필요)
    // TODO: 사용자 스키마에 조직 정보 추가 후 실제 필터링 구현
    
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.open('/', '_blank')}
              >
                LoBo 챗봇
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
                  <Button variant="outline" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                </div>
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
                          소속 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          학년/직급
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
                      {!hasSearched ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">사용자 검색</p>
                              <p className="text-sm">
                                위의 검색 조건을 설정하고 "사용자 검색" 버튼을 클릭하여 사용자를 찾아보세요.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredUsers?.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">검색 결과 없음</p>
                              <p className="text-sm">
                                검색 조건에 맞는 사용자가 없습니다. 다른 조건으로 검색해보세요.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers?.map((user) => (
                          <tr key={user.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </div>
                              {user.email && (
                                <div className="text-xs text-gray-500">{user.email}</div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.username}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.userType === 'faculty' ? '로보대학교 컴퓨터공학과' : 
                                 user.userType === 'student' ? '컴퓨터공학과' : '시스템 관리'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-500">
                                {user.userType === 'faculty' ? '교수' : 
                                 user.userType === 'student' ? '4학년' : 
                                 user.userType === 'admin' ? '시스템관리자' : '-'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.userType === 'faculty' ? 'default' : user.userType === 'admin' ? 'destructive' : 'secondary'}>
                                {user.userType === 'faculty' ? '교직원' : 
                                 user.userType === 'admin' ? '관리자' :
                                 user.userType === 'student' ? '학생' : '기타'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                활성
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString('ko-KR') : '2025. 6. 21.'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" title="계정 편집">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="계정 삭제">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
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

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이름
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          에이전트 카테고리
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소속
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          문서 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          최종 사용일
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {agents?.map((agent) => (
                        <tr 
                          key={agent.id}
                          className={`cursor-pointer transition-all duration-200 group ${
                            agent.isActive 
                              ? 'hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:shadow-md hover:scale-[1.01]' 
                              : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 opacity-70 hover:opacity-90'
                          }`}
                          onClick={() => openEditAgentDialog(agent)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm font-medium transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                            }`}>
                              {agent.name}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={agent.isActive ? "outline" : "secondary"}>
                              {agent.category}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                            }`}>
                              {(agent as any).managerFirstName && (agent as any).managerLastName 
                                ? `${(agent as any).managerFirstName} ${(agent as any).managerLastName}` 
                                : '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-500 group-hover:text-gray-600' 
                                : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500'
                            }`}>
                              {(agent as any).organizationName || '-'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                            }`}>
                              {(agent as any).documentCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400' 
                                : 'text-gray-500 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                            }`}>
                              {(agent as any).userCount || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <div className={`transition-colors duration-200 ${
                              agent.isActive 
                                ? 'text-gray-500 group-hover:text-gray-600' 
                                : 'text-gray-400 dark:text-gray-600 group-hover:text-gray-500'
                            }`}>
                              {(agent as any).lastUsedAt 
                                ? new Date((agent as any).lastUsedAt).toLocaleDateString('ko-KR')
                                : '-'}
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

          {/* 질문/응답 로그 */}
          <TabsContent value="conversations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">질문/응답 로그</h2>
              <div className="flex space-x-2">
                <Button variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  로그 내보내기
                </Button>
                <Button variant="outline">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  분석 보고서
                </Button>
              </div>
            </div>

            {/* 필터링 옵션 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">로그 필터링</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>에이전트</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="에이전트 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체 에이전트</SelectItem>
                      <SelectItem value="academic">학사 도우미</SelectItem>
                      <SelectItem value="student">학생회 도우미</SelectItem>
                      <SelectItem value="research">연구 지원 도우미</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>사용자 유형</Label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="사용자 유형" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="faculty">교직원</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>기간</Label>
                  <Select defaultValue="today">
                    <SelectTrigger>
                      <SelectValue placeholder="기간 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">오늘</SelectItem>
                      <SelectItem value="week">최근 1주일</SelectItem>
                      <SelectItem value="month">최근 1개월</SelectItem>
                      <SelectItem value="quarter">최근 3개월</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>키워드 검색</Label>
                  <Input placeholder="질문 내용 검색..." />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  총 <strong>1,247</strong>개의 질문/응답 로그
                </div>
                <Button>
                  필터 적용
                </Button>
              </div>
            </div>

            {/* 통계 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">오늘 질문 수</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">247</div>
                  <p className="text-xs text-muted-foreground">
                    전일 대비 +12%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">평균 응답 시간</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">2.3초</div>
                  <p className="text-xs text-muted-foreground">
                    전일 대비 -0.3초
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">문서 활용률</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">84%</div>
                  <p className="text-xs text-muted-foreground">
                    문서 기반 응답 비율
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">사용자 만족도</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">4.6/5</div>
                  <p className="text-xs text-muted-foreground">
                    평균 평가 점수
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 질문/응답 로그 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle>최근 질문/응답 로그</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          에이전트
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          질문
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          응답 유형
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          응답 시간
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.21 14:23
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">S2024001</div>
                              <div className="text-xs text-gray-500">학생</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">학사 도우미</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            수강신청 기간이 언제인가요?
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="bg-green-100 text-green-800">문서 기반</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          1.8초
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" title="상세 보기">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" title="피드백">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.21 14:20
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">F2024002</div>
                              <div className="text-xs text-gray-500">교수</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">연구 지원 도우미</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            연구비 신청 절차에 대해 알려주세요
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="bg-blue-100 text-blue-800">하이브리드</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          3.2초
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" title="상세 보기">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" title="피드백">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.21 14:18
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">S2024003</div>
                              <div className="text-xs text-gray-500">학생</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">학생회 도우미</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            동아리 행사 예산은 어떻게 신청하나요?
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary" className="bg-gray-100 text-gray-800">AI 생성</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2.1초
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" title="상세 보기">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" title="피드백">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.21 14:15
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">S2024004</div>
                              <div className="text-xs text-gray-500">학생</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">학사 도우미</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                            졸업 요건을 확인하고 싶어요
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="bg-green-100 text-green-800">문서 기반</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          1.5초
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" title="상세 보기">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" title="피드백">
                              <MessageSquare className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 인기 질문 분석 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>인기 질문 TOP 10</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">수강신청 관련 문의</span>
                      <Badge variant="outline">89건</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">졸업 요건 확인</span>
                      <Badge variant="outline">67건</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">장학금 신청</span>
                      <Badge variant="outline">54건</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">학과 사무실 위치</span>
                      <Badge variant="outline">43건</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">연구실 배정</span>
                      <Badge variant="outline">38건</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>응답 품질 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">문서 기반 응답</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-green-600 h-2 rounded-full" style={{width: '84%'}}></div>
                        </div>
                        <span className="text-sm font-medium">84%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">하이브리드 응답</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{width: '12%'}}></div>
                        </div>
                        <span className="text-sm font-medium">12%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">AI 생성 응답</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div className="bg-gray-600 h-2 rounded-full" style={{width: '4%'}}></div>
                        </div>
                        <span className="text-sm font-medium">4%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 토큰 관리 */}
          <TabsContent value="tokens" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">토큰 관리</h2>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                새 토큰 생성
              </Button>
            </div>

            {/* 월간 사용량 카드 */}
            <Card className="w-full max-w-md">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">월간 사용량</span>
                  <div className="w-6 h-6 text-gray-400">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600 mb-2">사용량</div>
                  <div className="text-2xl font-bold">847K / 1M 토큰</div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                    <div className="bg-blue-500 h-3 rounded-full" style={{width: '73%'}}></div>
                  </div>
                  <div className="text-sm text-blue-600 font-medium mt-2">73% 사용</div>
                </div>
                <div className="text-xs text-gray-500 pt-2 border-t">
                  다음 갱신: 2024년 1월 1일
                </div>
              </CardContent>
            </Card>

            {/* 토큰 사용 추이 그래프 */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">토큰 사용 추이</CardTitle>
                  <div className="flex items-center space-x-2 text-sm">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tokenPeriod === 'daily' ? "text-blue-600 bg-blue-50" : "text-gray-500"}
                      onClick={() => setTokenPeriod('daily')}
                    >
                      일별
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tokenPeriod === 'weekly' ? "text-blue-600 bg-blue-50" : "text-gray-500"}
                      onClick={() => setTokenPeriod('weekly')}
                    >
                      주별
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tokenPeriod === 'monthly' ? "text-blue-600 bg-blue-50" : "text-gray-500"}
                      onClick={() => setTokenPeriod('monthly')}
                    >
                      월별
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className={tokenPeriod === 'all' ? "text-blue-600 bg-blue-50" : "text-gray-500"}
                      onClick={() => setTokenPeriod('all')}
                    >
                      분석 전체
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64 relative">
                  {/* Y축 레이블 */}
                  <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 py-2">
                    <span>600000</span>
                    <span>450000</span>
                    <span>300000</span>
                    <span>150000</span>
                    <span>0</span>
                  </div>
                  
                  {/* 그래프 영역 */}
                  <div className="ml-12 h-full relative">
                    {/* 격자선 */}
                    <div className="absolute inset-0">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div 
                          key={i} 
                          className="absolute w-full border-t border-gray-200" 
                          style={{top: `${i * 25}%`}}
                        />
                      ))}
                    </div>
                    
                    {/* 막대 그래프 */}
                    <div className="relative h-full flex items-end justify-between px-4">
                      {tokenPeriod === 'daily' && (
                        <>
                          {/* 어제 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '45%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '65%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '55%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '40%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">어제</span>
                          </div>
                          
                          {/* 오늘 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '80%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '70%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '55%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">오늘</span>
                          </div>
                        </>
                      )}
                      
                      {tokenPeriod === 'weekly' && (
                        <>
                          {/* 1주 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '50%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '75%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '60%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '45%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">1주</span>
                          </div>
                          
                          {/* 2주 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '80%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '70%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '55%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">2주</span>
                          </div>
                          
                          {/* 3주 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '55%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '70%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '65%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '50%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">3주</span>
                          </div>
                          
                          {/* 4주 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '75%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '90%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '85%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '70%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">4주</span>
                          </div>
                        </>
                      )}
                      
                      {tokenPeriod === 'monthly' && (
                        <>
                          {/* 9월 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '40%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '60%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '50%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '35%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">9월</span>
                          </div>
                          
                          {/* 10월 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '55%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '75%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '65%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '50%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">10월</span>
                          </div>
                          
                          {/* 11월 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '65%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '85%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '75%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '60%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">11월</span>
                          </div>
                          
                          {/* 12월 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '80%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '95%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '90%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '75%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">12월</span>
                          </div>
                        </>
                      )}
                      
                      {tokenPeriod === 'all' && (
                        <>
                          {/* 2022 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '30%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '45%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '35%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '25%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">2022</span>
                          </div>
                          
                          {/* 2023 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '60%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '75%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '70%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '55%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">2023</span>
                          </div>
                          
                          {/* 2024 */}
                          <div className="flex flex-col items-center space-y-2 flex-1">
                            <div className="w-16 relative" style={{height: '200px'}}>
                              <div className="absolute bottom-0 w-full bg-blue-500 rounded-t" style={{height: '85%'}}></div>
                              <div className="absolute bottom-0 w-full bg-green-500 rounded-t" style={{height: '95%', opacity: 0.8}}></div>
                              <div className="absolute bottom-0 w-full bg-orange-500 rounded-t" style={{height: '90%', opacity: 0.6}}></div>
                              <div className="absolute bottom-0 w-full bg-red-500 rounded-t" style={{height: '80%', opacity: 0.4}}></div>
                            </div>
                            <span className="text-xs text-gray-500">2024</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 카테고리 관리 */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">카테고리 관리</h2>
            </div>

            {/* 카테고리 관리 방법 안내 */}
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
                    대학 LMS 시스템과 연동하여 조직 구조를 자동으로 동기화합니다.
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
                    CSV/Excel 파일을 업로드하여 조직 구조를 일괄 등록합니다.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 카테고리 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">카테고리 검색 및 관리</h3>
              
              {/* 조직 유형 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>조직 유형</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="university">대학교</SelectItem>
                      <SelectItem value="graduate">대학원</SelectItem>
                      <SelectItem value="college">단과대학</SelectItem>
                      <SelectItem value="department">학과</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>상위 조직</Label>
                  <Select value={selectedCollege} onValueChange={setSelectedCollege} disabled={selectedUniversity === 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="robo_univ">로보대학교</SelectItem>
                      <SelectItem value="robo_grad">로보대학교 대학원</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>단과대학</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={selectedCollege === 'all' || selectedUniversity === 'all'}>
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
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* 카테고리 검색 */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="조직명으로 검색..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                    />
                  </div>
                  <Button onClick={executeSearch}>
                    카테고리 검색
                  </Button>
                  <Button>
                    새 조직 추가
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 <strong>*</strong>을 입력하고 검색하면 선택된 필터 범위에서 전체 조직을 조회할 수 있습니다.
                </p>
              </div>
              
              {/* 검색 결과 표시 */}
              {hasSearched && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  검색 결과: 12개 조직
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
                          조직명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          조직 유형
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상위 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          하위 조직 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소속 인원
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {!hasSearched ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">카테고리 검색</p>
                              <p className="text-sm">
                                위의 검색 조건을 설정하고 "카테고리 검색" 버튼을 클릭하여 조직을 찾아보세요.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                로보대학교
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">대학교</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              4개 단과대학
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              12,500명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" title="조직 편집">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" title="하위 조직 보기">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                공과대학
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">단과대학</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              로보대학교
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              8개 학과
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              3,200명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" title="조직 편집">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" title="하위 조직 보기">
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                컴퓨터공학과
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">학과</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              공과대학
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              320명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" title="조직 편집">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" title="소속 인원 보기">
                                  <Users className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                경영학과
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="outline">학과</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              경영대학
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              -
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              450명
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-1">
                                <Button variant="outline" size="sm" title="조직 편집">
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" title="소속 인원 보기">
                                  <Users className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 문서 관리 */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">문서 관리</h2>
            </div>

            {/* 문서 업로드 방법 안내 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card 
                className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsLmsDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    LMS 문서 연동
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    LMS 시스템에서 강의 자료 및 문서를 자동으로 가져옵니다.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-green-200 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsDocumentUploadDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    직접 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    PDF, Word, Excel 파일을 직접 업로드하여 관리합니다.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">문서 통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">전체 문서</span>
                    <span className="font-medium">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">활성 문서</span>
                    <span className="font-medium">1,180</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">비활성 문서</span>
                    <span className="font-medium">54</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">총 용량</span>
                    <span className="font-medium">2.3 GB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">문서 종류별 분포</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">PDF</span>
                    <span className="font-medium">856 (69%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Word</span>
                    <span className="font-medium">245 (20%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Excel</span>
                    <span className="font-medium">98 (8%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">기타</span>
                    <span className="font-medium">35 (3%)</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">최근 업로드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <div className="font-medium">2024학년도 수강신청 안내.pdf</div>
                    <div className="text-gray-500">2시간 전</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">졸업요건 변경 안내.docx</div>
                    <div className="text-gray-500">5시간 전</div>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">학과 교육과정.xlsx</div>
                    <div className="text-gray-500">1일 전</div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 문서 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">문서 검색 및 관리</h3>
              
              {/* 카테고리 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>문서 카테고리</Label>
                  <Select value={selectedDocumentCategory} onValueChange={setSelectedDocumentCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="lecture">강의 자료</SelectItem>
                      <SelectItem value="policy">정책 문서</SelectItem>
                      <SelectItem value="manual">매뉴얼</SelectItem>
                      <SelectItem value="form">양식</SelectItem>
                      <SelectItem value="notice">공지사항</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>파일 형식</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="ppt">PowerPoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>업로드 기간</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="today">오늘</SelectItem>
                      <SelectItem value="week">1주일</SelectItem>
                      <SelectItem value="month">1개월</SelectItem>
                      <SelectItem value="year">1년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={() => {
                    setSelectedDocumentCategory('all');
                    setDocumentSearchQuery('');
                    setHasDocumentSearched(false);
                  }}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* 문서 검색 */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="문서명, 내용으로 검색..."
                      value={documentSearchQuery}
                      onChange={(e) => setDocumentSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && setHasDocumentSearched(true)}
                    />
                  </div>
                  <Button onClick={() => setHasDocumentSearched(true)}>
                    <FileText className="w-4 h-4 mr-2" />
                    문서 검색
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  💡 <strong>*</strong>을 입력하고 검색하면 선택된 카테고리 범위에서 전체 문서를 조회할 수 있습니다.
                </p>
              </div>
              
              {/* 검색 결과 표시 */}
              {hasDocumentSearched && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  검색 결과: 2개 문서
                  {documentSearchQuery && ` (검색어: "${documentSearchQuery}")`}
                </div>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>문서 목록</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          문서명
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          종류
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          크기
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          업로드일
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          작업
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            2024학년도 수강신청 안내.pdf
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">PDF</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2.1 MB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.21
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            졸업요건 변경 안내.docx
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline">Word</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          450 KB
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          2024.01.20
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="default" className="bg-green-100 text-green-800">활성</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
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
              <DialogTitle>에이전트 설정</DialogTitle>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editAgentForm.control}
                    name="llmModel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>LLM 모델 선택</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "gpt-4o-mini"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="GPT-4o Mini (빠름)" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="gpt-4o-mini">GPT-4o Mini (빠름)</SelectItem>
                            <SelectItem value="gpt-4o">GPT-4o (균형)</SelectItem>
                            <SelectItem value="gpt-4-turbo">GPT-4 Turbo (정확)</SelectItem>
                            <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (경제적)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editAgentForm.control}
                    name="chatbotType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>챗봇 유형 선택</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value || "doc-fallback-llm"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="문서 우선 + LLM..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="doc-fallback-llm">문서 우선 + LLM 보완</SelectItem>
                            <SelectItem value="strict-doc">문서 기반 전용</SelectItem>
                            <SelectItem value="general-llm">자유 대화형</SelectItem>
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

                {/* 소속 조직 선택 - 3단계 드롭다운 */}
                <div className="space-y-4">
                  <FormLabel className="text-base font-medium">소속 조직</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-sm text-gray-600">전체/대학원/대학교</Label>
                      <Select defaultValue="전체">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="대학교">대학교</SelectItem>
                          <SelectItem value="대학원">대학원</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">단과대학</Label>
                      <Select defaultValue="전체">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="공과대학">공과대학</SelectItem>
                          <SelectItem value="경영대학">경영대학</SelectItem>
                          <SelectItem value="인문대학">인문대학</SelectItem>
                          <SelectItem value="자연과학대학">자연과학대학</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">학과</Label>
                      <Select defaultValue="전체">
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="컴퓨터공학과">컴퓨터공학과</SelectItem>
                          <SelectItem value="전자공학과">전자공학과</SelectItem>
                          <SelectItem value="기계공학과">기계공학과</SelectItem>
                          <SelectItem value="경영학과">경영학과</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button variant="default" className="h-11 px-6 bg-blue-600 hover:bg-blue-700">
                        적용
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 에이전트 관리자 */}
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

                {/* 숨겨진 조직 ID 필드 */}
                <FormField
                  control={editAgentForm.control}
                  name="organizationId"
                  render={({ field }) => (
                    <FormItem style={{ display: 'none' }}>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

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
                      {updateAgentMutation.isPending ? "수정 중..." : "저장"}
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
                <Label>문서 카테고리</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">강의 자료</SelectItem>
                    <SelectItem value="policy">정책 문서</SelectItem>
                    <SelectItem value="manual">매뉴얼</SelectItem>
                    <SelectItem value="form">양식</SelectItem>
                    <SelectItem value="notice">공지사항</SelectItem>
                    <SelectItem value="curriculum">교육과정</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>적용 범위</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-gray-600">전체/대학원/대학교</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="graduate">대학원</SelectItem>
                        <SelectItem value="undergraduate">대학교</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">단과대학</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="engineering">공과대학</SelectItem>
                        <SelectItem value="business">경영대학</SelectItem>
                        <SelectItem value="humanities">인문대학</SelectItem>
                        <SelectItem value="science">자연과학대학</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">학과</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="computer">컴퓨터공학과</SelectItem>
                        <SelectItem value="electrical">전자공학과</SelectItem>
                        <SelectItem value="mechanical">기계공학과</SelectItem>
                        <SelectItem value="business_admin">경영학과</SelectItem>
                        <SelectItem value="economics">경제학과</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      적용
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>문서 설명</Label>
                <Textarea 
                  placeholder="문서에 대한 간단한 설명을 입력하세요..."
                  rows={3}
                />
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

        {/* 문서 업로드 다이얼로그 */}
        <Dialog open={isDocumentUploadDialogOpen} onOpenChange={setIsDocumentUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>문서 업로드</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mb-4">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 50MB)
                </p>
                <Button variant="outline">
                  파일 선택
                </Button>
              </div>

              <div>
                <Label>문서 카테고리</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">강의 자료</SelectItem>
                    <SelectItem value="policy">정책 문서</SelectItem>
                    <SelectItem value="manual">매뉴얼</SelectItem>
                    <SelectItem value="form">양식</SelectItem>
                    <SelectItem value="notice">공지사항</SelectItem>
                    <SelectItem value="curriculum">교육과정</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>적용 범위</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <Label className="text-sm text-gray-600">전체/대학원/대학교</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="graduate">대학원</SelectItem>
                        <SelectItem value="undergraduate">대학교</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">단과대학</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="engineering">공과대학</SelectItem>
                        <SelectItem value="business">경영대학</SelectItem>
                        <SelectItem value="humanities">인문대학</SelectItem>
                        <SelectItem value="science">자연과학대학</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">학과</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="computer">컴퓨터공학과</SelectItem>
                        <SelectItem value="electrical">전자공학과</SelectItem>
                        <SelectItem value="mechanical">기계공학과</SelectItem>
                        <SelectItem value="business_admin">경영학과</SelectItem>
                        <SelectItem value="economics">경제학과</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button className="w-full">
                      적용
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>문서 설명</Label>
                <Textarea 
                  placeholder="문서에 대한 간단한 설명을 입력하세요..."
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">업로드 옵션</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="auto-categorize" className="rounded" />
                    <Label htmlFor="auto-categorize">AI 자동 분류 활성화</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="extract-keywords" className="rounded" />
                    <Label htmlFor="extract-keywords">키워드 자동 추출</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="notify-users" className="rounded" />
                    <Label htmlFor="notify-users">해당 범위 사용자에게 알림 발송</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsDocumentUploadDialogOpen(false)}>
                  취소
                </Button>
                <Button>
                  업로드 시작
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