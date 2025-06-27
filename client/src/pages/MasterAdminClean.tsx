import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  Users,
  UserPlus,
  Bot,
  MessageSquare,
  FileText,
  TrendingUp,
  Activity,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit,
  Eye,
  X,
  User,
  GraduationCap,
  BookOpen,
  Shield,
  Brain,
  Zap,
  Target,
  Coffee,
  Music,
  Heart,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
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
  type: string;
  icon: string;
  backgroundColor: string;
  isActive: boolean;
  createdAt: string;
  messageCount: number;
  averageRating?: number;
  upperCategory?: string;
  lowerCategory?: string;
  detailCategory?: string;
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
  name: z.string().min(1, "에이전트 이름은 필수입니다").max(20, "에이전트 이름은 최대 20자입니다"),
  description: z.string().max(200, "설명은 최대 200자입니다").optional(),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  type: z.string().optional(),
  icon: z.string().optional(),
  backgroundColor: z.string().optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

function MasterAdmin() {
  // 상태 관리
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // 에이전트 검색 관련 상태
  const [agentSearchQuery, setAgentSearchQuery] = useState("");
  const [selectedAgentType, setSelectedAgentType] = useState("all");
  const [selectedAgentStatus, setSelectedAgentStatus] = useState("all");
  const [selectedUpperCategory, setSelectedUpperCategory] = useState("all");
  const [selectedLowerCategory, setSelectedLowerCategory] = useState("all");
  const [selectedDetailCategory, setSelectedDetailCategory] = useState("all");
  const [hasSearched, setHasSearched] = useState(false);
  
  // 정렬 관련 상태
  const [agentSortField, setAgentSortField] = useState("name");
  const [agentSortDirection, setAgentSortDirection] = useState<"asc" | "desc">("asc");

  const queryClient = useQueryClient();

  // 시스템 통계 조회
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
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

  // 조직 카테고리 데이터 조회
  const { data: organizationHierarchy } = useQuery({
    queryKey: ['/api/admin/organization-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organization-categories');
      if (!response.ok) throw new Error('Failed to fetch organization categories');
      return response.json();
    }
  });

  // 상위, 하위, 세부 카테고리 옵션 계산
  const uniqueUpperCategories = useMemo(() => {
    if (!organizationHierarchy) return [];
    return Array.from(new Set(organizationHierarchy.map((org: any) => org.upperCategory).filter(Boolean)));
  }, [organizationHierarchy]);

  const filteredLowerCategories = useMemo(() => {
    if (!organizationHierarchy || selectedUpperCategory === 'all') return [];
    return Array.from(new Set(
      organizationHierarchy
        .filter((org: any) => org.upperCategory === selectedUpperCategory)
        .map((org: any) => org.lowerCategory)
        .filter(Boolean)
    ));
  }, [organizationHierarchy, selectedUpperCategory]);

  const filteredDetailCategories = useMemo(() => {
    if (!organizationHierarchy || selectedLowerCategory === 'all') return [];
    return Array.from(new Set(
      organizationHierarchy
        .filter((org: any) => 
          org.upperCategory === selectedUpperCategory && 
          org.lowerCategory === selectedLowerCategory
        )
        .map((org: any) => org.detailCategory)
        .filter(Boolean)
    ));
  }, [organizationHierarchy, selectedUpperCategory, selectedLowerCategory]);

  // 에이전트 필터링 로직
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    
    let filtered = [...agents];

    // 검색어 필터
    if (agentSearchQuery.trim()) {
      const query = agentSearchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
      );
    }

    // 타입 필터
    if (selectedAgentType !== 'all') {
      filtered = filtered.filter(agent => agent.type === selectedAgentType);
    }

    // 상태 필터
    if (selectedAgentStatus !== 'all') {
      if (selectedAgentStatus === 'active') {
        filtered = filtered.filter(agent => agent.isActive);
      } else if (selectedAgentStatus === 'inactive') {
        filtered = filtered.filter(agent => !agent.isActive);
      }
    }

    // 상위 카테고리 필터
    if (selectedUpperCategory !== 'all') {
      filtered = filtered.filter(agent => agent.upperCategory === selectedUpperCategory);
    }

    // 하위 카테고리 필터
    if (selectedLowerCategory !== 'all') {
      filtered = filtered.filter(agent => agent.lowerCategory === selectedLowerCategory);
    }

    // 세부 카테고리 필터
    if (selectedDetailCategory !== 'all') {
      filtered = filtered.filter(agent => agent.detailCategory === selectedDetailCategory);
    }

    return filtered;
  }, [agents, agentSearchQuery, selectedAgentType, selectedAgentStatus, selectedUpperCategory, selectedLowerCategory, selectedDetailCategory]);

  // 정렬된 에이전트 목록
  const sortedAgents = useMemo(() => {
    if (!filteredAgents) return [];
    
    return [...filteredAgents].sort((a, b) => {
      let aValue = '';
      let bValue = '';
      
      switch (agentSortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'status':
          aValue = a.isActive ? '사용 중' : '미사용';
          bValue = b.isActive ? '사용 중' : '미사용';
          break;
        case 'createdAt':
          aValue = a.createdAt;
          bValue = b.createdAt;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }
      
      if (agentSortDirection === 'asc') {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [filteredAgents, agentSortField, agentSortDirection]);

  // 에이전트 검색 실행
  const handleAgentSearch = () => {
    setHasSearched(true);
  };

  // 에이전트 정렬 핸들러
  const handleAgentSort = (field: string) => {
    if (agentSortField === field) {
      setAgentSortDirection(agentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAgentSortField(field);
      setAgentSortDirection('asc');
    }
  };

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

  if (!stats) {
    return <div className="p-8">데이터를 로딩 중입니다...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                마스터 관리자 시스템
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                LoBo AI 챗봇 시스템 관리
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" asChild>
                <Link href="/" target="_blank">
                  <Bot className="w-4 h-4 mr-2" />
                  메인 서비스
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/auth">
                  <User className="w-4 h-4 mr-2" />
                  로그아웃
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">대시보드</TabsTrigger>
            <TabsTrigger value="agents">에이전트 관리</TabsTrigger>
            <TabsTrigger value="users">사용자 관리</TabsTrigger>
            <TabsTrigger value="conversations">대화 로그</TabsTrigger>
            <TabsTrigger value="documents">문서 관리</TabsTrigger>
          </TabsList>

          {/* 대시보드 탭 */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    활성 사용자: {stats.activeUsers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 에이전트</CardTitle>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalAgents}</div>
                  <p className="text-xs text-muted-foreground">
                    활성 에이전트: {stats.activeAgents}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">총 대화</CardTitle>
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalConversations}</div>
                  <p className="text-xs text-muted-foreground">
                    총 메시지: {stats.totalMessages}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">오늘 메시지</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.todayMessages}</div>
                  <p className="text-xs text-muted-foreground">
                    주간 증가율: +{stats.weeklyGrowth}%
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* 에이전트 관리 탭 */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">에이전트 검색 및 관리</h2>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                새 에이전트 추가
              </Button>
            </div>

            {/* 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label>이름/설명 검색</Label>
                  <Input 
                    placeholder="에이전트 이름 또는 설명..."
                    value={agentSearchQuery}
                    onChange={(e) => setAgentSearchQuery(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>유형</Label>
                  <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="유형 선택" />
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

                <div>
                  <Label>상태</Label>
                  <Select value={selectedAgentStatus} onValueChange={setSelectedAgentStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="상태 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">사용 중</SelectItem>
                      <SelectItem value="inactive">미사용</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>상위 카테고리</Label>
                  <Select value={selectedUpperCategory} onValueChange={setSelectedUpperCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="상위 카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {uniqueUpperCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>하위 카테고리</Label>
                  <Select 
                    value={selectedLowerCategory} 
                    onValueChange={setSelectedLowerCategory}
                    disabled={selectedUpperCategory === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="하위 카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {filteredLowerCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>세부 카테고리</Label>
                  <Select 
                    value={selectedDetailCategory} 
                    onValueChange={setSelectedDetailCategory}
                    disabled={selectedLowerCategory === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="세부 카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {filteredDetailCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {hasSearched ? (
                    <>검색 결과: <strong>{filteredAgents.length}</strong>개</>
                  ) : (
                    <>총 <strong>{agents?.length || 0}</strong>개의 에이전트</>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAgentSearch}>
                    <Search className="w-4 h-4 mr-2" />
                    검색
                  </Button>
                  {hasSearched && (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAgentSearchQuery('');
                        setSelectedAgentType('all');
                        setSelectedAgentStatus('all');
                        setSelectedUpperCategory('all');
                        setSelectedLowerCategory('all');
                        setSelectedDetailCategory('all');
                        setHasSearched(false);
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      초기화
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* 에이전트 테이블 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead onClick={() => handleAgentSort('name')} className="cursor-pointer">
                      이름 <ArrowUpDown className="w-4 h-4 inline ml-1" />
                    </TableHead>
                    <TableHead>설명</TableHead>
                    <TableHead onClick={() => handleAgentSort('type')} className="cursor-pointer">
                      유형 <ArrowUpDown className="w-4 h-4 inline ml-1" />
                    </TableHead>
                    <TableHead onClick={() => handleAgentSort('status')} className="cursor-pointer">
                      상태 <ArrowUpDown className="w-4 h-4 inline ml-1" />
                    </TableHead>
                    <TableHead>메시지 수</TableHead>
                    <TableHead>관리</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedAgents.map((agent) => (
                    <TableRow key={agent.id}>
                      <TableCell className="font-medium">{agent.name}</TableCell>
                      <TableCell className="max-w-xs truncate">{agent.description}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{agent.type}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={agent.isActive ? "default" : "secondary"}>
                          {agent.isActive ? "사용 중" : "미사용"}
                        </Badge>
                      </TableCell>
                      <TableCell>{agent.messageCount}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* 기타 탭들은 간단한 placeholder */}
          <TabsContent value="users">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">사용자 관리</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">사용자 관리 기능 개발 중입니다.</p>
            </div>
          </TabsContent>

          <TabsContent value="conversations">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">대화 로그</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">대화 로그 기능 개발 중입니다.</p>
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold">문서 관리</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-2">문서 관리 기능 개발 중입니다.</p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default MasterAdmin;