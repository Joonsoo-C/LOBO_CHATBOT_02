import { useState, useEffect } from "react";
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
import { queryClient } from "@/lib/queryClient";
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
  Home
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

// Form schema for creating new agent
const createAgentSchema = z.object({
  name: z.string().min(1, "에이전트 이름을 입력해주세요"),
  description: z.string().min(1, "에이전트 설명을 입력해주세요"),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  icon: z.string().min(1, "아이콘을 선택해주세요"),
  backgroundColor: z.string().min(1, "배경색을 선택해주세요"),
  personality: z.string().optional(),
  chatbotType: z.string().default("general-llm"),
  llmModel: z.string().default("gpt-4o"),
});

type CreateAgentData = z.infer<typeof createAgentSchema>;

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

export default function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateAgentDialog, setShowCreateAgentDialog] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  // Form for creating new agent
  const createAgentForm = useForm<CreateAgentData>({
    resolver: zodResolver(createAgentSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      icon: "",
      backgroundColor: "",
      personality: "",
      chatbotType: "general-llm",
      llmModel: "gpt-4o",
    },
  });

  // Available options for form dropdowns
  const categoryOptions = [
    { value: "학교", label: "학교" },
    { value: "교수", label: "교수" },
    { value: "학생", label: "학생" },
    { value: "그룹", label: "그룹" },
    { value: "기능형", label: "기능형" },
  ];

  const iconOptions = [
    { value: "GraduationCap", label: "졸업모자" },
    { value: "Users", label: "사용자들" },
    { value: "BookOpen", label: "책" },
    { value: "Calculator", label: "계산기" },
    { value: "Globe", label: "지구본" },
    { value: "Heart", label: "하트" },
    { value: "Star", label: "별" },
    { value: "Zap", label: "번개" },
  ];

  const backgroundColorOptions = [
    { value: "blue", label: "파란색" },
    { value: "green", label: "초록색" },
    { value: "purple", label: "보라색" },
    { value: "red", label: "빨간색" },
    { value: "orange", label: "주황색" },
    { value: "pink", label: "분홍색" },
    { value: "indigo", label: "남색" },
    { value: "gray", label: "회색" },
  ];

  const chatbotTypeOptions = [
    { value: "strict-doc", label: "문서 전용" },
    { value: "doc-fallback-llm", label: "문서 우선" },
    { value: "general-llm", label: "일반 대화" },
  ];

  const llmModelOptions = [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo" },
  ];

  // 통계 데이터 조회
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // 사용자 목록 조회
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // 에이전트 목록 조회
  const { data: agents } = useQuery<Agent[]>({
    queryKey: ['/api/admin/agents'],
    queryFn: async () => {
      const response = await fetch('/api/admin/agents', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch agents');
      return response.json();
    }
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async (data: CreateAgentData) => {
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create agent');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "에이전트 생성 완료",
        description: "새로운 에이전트가 성공적으로 생성되었습니다.",
      });
      setShowCreateAgentDialog(false);
      createAgentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
    },
    onError: (error: Error) => {
      toast({
        title: "에이전트 생성 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onCreateAgent = (data: CreateAgentData) => {
    createAgentMutation.mutate(data);
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
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                새 사용자 추가
              </Button>
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
                      {users?.map((user) => (
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
              <Dialog open={showCreateAgentDialog} onOpenChange={setShowCreateAgentDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    새 에이전트 추가
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새 에이전트 생성</DialogTitle>
                  </DialogHeader>
                  <Form {...createAgentForm}>
                    <form onSubmit={createAgentForm.handleSubmit(onCreateAgent)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createAgentForm.control}
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
                          control={createAgentForm.control}
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
                                  {categoryOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={createAgentForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>에이전트 설명</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="에이전트가 수행할 역할과 기능을 설명해주세요"
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createAgentForm.control}
                          name="icon"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>아이콘</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="아이콘 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {iconOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createAgentForm.control}
                          name="backgroundColor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>배경색</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="배경색 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {backgroundColorOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={createAgentForm.control}
                        name="personality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>성격/어조 (선택사항)</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="에이전트의 말투나 성격을 설정해주세요 (예: 친근하고 도움이 되는, 전문적이고 정확한)"
                                className="min-h-[80px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={createAgentForm.control}
                          name="chatbotType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>챗봇 유형</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="챗봇 유형 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {chatbotTypeOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createAgentForm.control}
                          name="llmModel"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LLM 모델</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="모델 선택" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {llmModelOptions.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setShowCreateAgentDialog(false)}
                        >
                          취소
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createAgentMutation.isPending}
                        >
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
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
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
                    {agent.averageRating && (
                      <div className="flex items-center justify-between text-sm">
                        <span>평균 평점:</span>
                        <span className="font-medium">⭐ {agent.averageRating.toFixed(1)}</span>
                      </div>
                    )}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="flex-1">
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
      </main>
    </div>
  );
}