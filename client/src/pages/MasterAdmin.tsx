import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { 
  Users, 
  MessageSquare, 
  Bot, 
  Settings, 
  TrendingUp, 
  Download, 
  Upload, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff,
  FileText,
  Search,
  Filter,
  Plus,
  BarChart,
  Activity,
  Globe,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  userType: string;
  organizationCategory: string;
  status: string;
  createdAt: string;
}

interface Agent {
  id: number;
  name: string;
  description: string;
  category: string;
  icon: string;
  backgroundColor: string;
  isActive: boolean;
  status: string;
  createdAt: string;
}

interface Document {
  id: number;
  originalName: string;
  agentId: number;
  uploadedAt: string;
  fileSize: number;
}

interface OrganizationCategory {
  id: number;
  name: string;
  upperCategory: string;
  lowerCategory: string;
  status: string;
}

export default function MasterAdmin() {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentTab, setCurrentTab] = useState("dashboard");
  const [showPassword, setShowPassword] = useState(false);

  // User management states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("all");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [currentUserPage, setCurrentUserPage] = useState(1);
  const usersPerPage = 10;

  // Agent management states  
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [agentStatusFilter, setAgentStatusFilter] = useState("all");
  const [agentTypeFilter, setAgentTypeFilter] = useState("all");
  const [currentAgentPage, setCurrentAgentPage] = useState(1);
  const agentsPerPage = 10;

  // Dialog states
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
  });

  // Fetch documents
  const { data: documents = [], isLoading: documentsLoading } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
  });

  // Fetch organization categories
  const { data: organizationCategories = [], isLoading: organizationCategoriesLoading } = useQuery<OrganizationCategory[]>({
    queryKey: ["/api/organization-categories"],
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Failed to logout");
      return response.json();
    },
    onSuccess: () => {
      setLocation("/auth");
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      toast({
        title: "로그아웃 실패",
        description: "로그아웃 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Filter users
  const filteredUsers = (users as User[]).filter((user: User) => {
    const matchesSearch = user.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesStatus = userStatusFilter === "all" || user.status === userStatusFilter;
    const matchesType = userTypeFilter === "all" || user.userType === userTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Filter agents
  const filteredAgents = (agents as Agent[]).filter((agent: Agent) => {
    const matchesSearch = agent.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
                         agent.description.toLowerCase().includes(agentSearchQuery.toLowerCase());
    const matchesStatus = agentStatusFilter === "all" || agent.status === agentStatusFilter;
    const matchesType = agentTypeFilter === "all" || agent.category === agentTypeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Pagination for users
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentUserPage - 1) * usersPerPage,
    currentUserPage * usersPerPage
  );

  // Pagination for agents
  const totalAgentPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const paginatedAgents = filteredAgents.slice(
    (currentAgentPage - 1) * agentsPerPage,
    currentAgentPage * agentsPerPage
  );

  // Calculate statistics
  const totalUsers = (users as User[]).length;
  const activeUsers = (users as User[]).filter((u: User) => u.status === "active").length;
  const totalAgents = (agents as Agent[]).length;
  const activeAgents = (agents as Agent[]).filter((a: Agent) => a.isActive).length;
  const totalDocuments = (documents as Document[]).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Master Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => window.open("/", "_blank")}
                className="flex items-center space-x-2"
              >
                <Globe className="w-4 h-4" />
                <span>메인 서비스</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="agents">에이전트 관리</TabsTrigger>
            <TabsTrigger value="documents">문서 관리</TabsTrigger>
            <TabsTrigger value="categories">조직 카테고리</TabsTrigger>
            <TabsTrigger value="system">시스템 설정</TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">전체 사용자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    활성: {activeUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">AI 에이전트</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    활성: {activeAgents}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">업로드된 문서</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    전체 문서 수
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">시스템 상태</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">정상</div>
                  <p className="text-xs text-muted-foreground">
                    모든 서비스 운영 중
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="사용자 검색..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={userTypeFilter} onValueChange={setUserTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="유형 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="faculty">교수</SelectItem>
                      <SelectItem value="staff">직원</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        새 사용자 추가
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>새 사용자 추가</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="username">사용자명</Label>
                          <Input id="username" placeholder="사용자명을 입력하세요" />
                        </div>
                        <div>
                          <Label htmlFor="fullName">전체 이름</Label>
                          <Input id="fullName" placeholder="전체 이름을 입력하세요" />
                        </div>
                        <div>
                          <Label htmlFor="email">이메일</Label>
                          <Input id="email" type="email" placeholder="이메일을 입력하세요" />
                        </div>
                        <div>
                          <Label htmlFor="userType">사용자 유형</Label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="사용자 유형 선택" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="student">학생</SelectItem>
                              <SelectItem value="faculty">교수</SelectItem>
                              <SelectItem value="staff">직원</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button variant="outline" onClick={() => setIsNewUserDialogOpen(false)}>
                            취소
                          </Button>
                          <Button>사용자 생성</Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>사용자명</TableHead>
                      <TableHead>이름</TableHead>
                      <TableHead>이메일</TableHead>
                      <TableHead>유형</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.fullName}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{user.userType}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.status === "active" ? "default" : "secondary"}>
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    총 {filteredUsers.length}개 중 {((currentUserPage - 1) * usersPerPage) + 1}-{Math.min(currentUserPage * usersPerPage, filteredUsers.length)}개 표시
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentUserPage(Math.max(1, currentUserPage - 1))}
                      disabled={currentUserPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentUserPage(Math.min(totalUserPages, currentUserPage + 1))}
                      disabled={currentUserPage === totalUserPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agents Tab */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>에이전트 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <Input
                      placeholder="에이전트 검색..."
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={agentStatusFilter} onValueChange={setAgentStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="상태 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={agentTypeFilter} onValueChange={setAgentTypeFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="유형 필터" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="학교">학교</SelectItem>
                      <SelectItem value="교수">교수</SelectItem>
                      <SelectItem value="학생">학생</SelectItem>
                      <SelectItem value="그룹">그룹</SelectItem>
                      <SelectItem value="기능형">기능형</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>이름</TableHead>
                      <TableHead>설명</TableHead>
                      <TableHead>카테고리</TableHead>
                      <TableHead>상태</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead>작업</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAgents.map((agent: Agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-medium">{agent.name}</TableCell>
                        <TableCell>{agent.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{agent.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.isActive ? "default" : "secondary"}>
                            {agent.isActive ? "활성" : "비활성"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(agent.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    총 {filteredAgents.length}개 중 {((currentAgentPage - 1) * agentsPerPage) + 1}-{Math.min(currentAgentPage * agentsPerPage, filteredAgents.length)}개 표시
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentAgentPage(Math.max(1, currentAgentPage - 1))}
                      disabled={currentAgentPage === 1}
                    >
                      이전
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentAgentPage(Math.min(totalAgentPages, currentAgentPage + 1))}
                      disabled={currentAgentPage === totalAgentPages}
                    >
                      다음
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>문서 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">문서 관리</h3>
                  <p className="text-gray-500">업로드된 문서들을 관리할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>조직 카테고리 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">조직 카테고리</h3>
                  <p className="text-gray-500">조직 카테고리를 관리할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>시스템 설정</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">시스템 설정</h3>
                  <p className="text-gray-500">시스템 설정을 관리할 수 있습니다.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}