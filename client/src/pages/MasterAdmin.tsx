import React, { useState, useEffect, useMemo, useRef } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";


// Remove hardcoded organization categories import - now using API data

import { NewCategoryDialog } from "@/components/NewCategoryDialog";
import { PaginationComponent } from "@/components/PaginationComponent";
import { usePagination } from "@/hooks/usePagination";
import AgentFileUploadModal from "@/components/AgentFileUploadModal";

// UserActiveAgents component
interface UserActiveAgentsProps {
  userId?: string;
}

const UserActiveAgents: React.FC<UserActiveAgentsProps> = ({ userId }) => {
  const { data: userConversations } = useQuery({
    queryKey: [`/api/admin/users/${userId}/conversations`],
    enabled: !!userId,
  });

  const { data: allAgents } = useQuery<any[]>({
    queryKey: ['/api/admin/agents'],
  });

  const userAgentsWithData = useMemo(() => {
    if (!userConversations || !allAgents) return [];
    
    const agentMap = new Map(allAgents.map(agent => [agent.id, agent]));
    const userAgentIds = userConversations
      .filter((conv: any) => conv.userId === userId)
      .map((conv: any) => conv.agentId);
    
    const uniqueAgentIds = [...new Set(userAgentIds)];
    
    return uniqueAgentIds
      .map(agentId => agentMap.get(agentId))
      .filter(Boolean)
      .map(agent => ({
        ...agent,
        lastUsed: userConversations
          .filter((conv: any) => conv.agentId === agent.id && conv.userId === userId)
          .sort((a: any, b: any) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime())[0]?.lastMessageAt || agent.createdAt
      }))
      .sort((a, b) => new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime());
  }, [userConversations, allAgents, userId]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return "정보 없음";
    }
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case "학교": return "bg-blue-100 text-blue-800";
      case "교수": return "bg-purple-100 text-purple-800";
      case "학생": return "bg-green-100 text-green-800";
      case "그룹": return "bg-orange-100 text-orange-800";
      case "기능형": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">사용 중인 에이전트</Label>
      <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
        {userId && userAgentsWithData.length > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-3">
            {userAgentsWithData.map((agent, index) => (
              <div key={agent.id} className="flex items-start space-x-3 p-3 border rounded bg-white dark:bg-gray-700">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{agent.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                    {agent.description}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className={`text-xs ${getCategoryBadgeColor(agent.category)}`}>
                      {agent.category}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      최근 사용: {formatDate(agent.lastUsed)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <div className="text-sm font-medium mb-2">사용 중인 에이전트가 없습니다</div>
            <div className="text-xs">
              이 사용자는 아직 어떤 에이전트도 사용하지 않았습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { 
  Users, 
  MessageSquare, 
  Bot,
  Clock,
  BarChart3,
  DollarSign,
  Settings, 
  Database,
  FileText,
  Shield,
  TrendingUp,
  Activity,
  Plus,
  Edit,
  Trash2,
  LogOut,
  Home,
  User,
  GraduationCap,
  BookOpen,
  Brain,
  RefreshCw,
  Zap,
  Target,
  Coffee,
  Music,
  Heart,
  Upload,
  ChevronUp,
  ChevronDown,
  Palette,
  XCircle,
  Menu,
  Download,
  ExternalLink,
  Eye,
  X,
  ChevronsUpDown,
  Code,
  FlaskRound,
  Map,
  Languages,
  Dumbbell,
  Lightbulb,
  Pen,
  Calendar,
  Bot as BotIcon,
  Database as DatabaseIcon,
  FileText as FileTextIcon,
} from "lucide-react";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
  // 📌 기본 정보
  name: z.string().min(1, "에이전트 이름은 필수입니다").max(20, "에이전트 이름은 최대 20자입니다"),
  description: z.string().max(200, "설명은 최대 200자입니다").optional(),
  category: z.string().min(1, "카테고리를 선택해주세요"),
  icon: z.string().optional(),
  backgroundColor: z.string().optional(),
  
  // 📌 소속 및 상태
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  
  // 📌 모델 및 응답 설정
  llmModel: z.string().optional(),
  chatbotType: z.string().optional(),
  maxInputLength: z.number().optional(),
  maxOutputLength: z.number().optional(),
  
  // 📌 페르소나 설정 (새로운 필드들)
  personaNickname: z.string().optional(),
  speechStyle: z.string().optional(),
  expertiseArea: z.string().optional(),
  personality: z.string().optional(),
  forbiddenResponseStyle: z.string().optional(),
  
  // 📌 파일 업로드 설정
  documentType: z.string().optional(),
  maxFileSize: z.string().optional(),
  
  // 📌 권한 및 접근 설정
  visibility: z.string().optional(),
  managerId: z.string().optional(),
  agentEditorIds: z.array(z.string()).optional(),
  documentManagerIds: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
});

type AgentFormData = z.infer<typeof agentSchema>;

const userEditSchema = z.object({
  name: z.string().min(1, "이름은 필수입니다"),
  email: z.string().email("올바른 이메일 형식이어야 합니다").optional().or(z.literal("")),
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  position: z.string().optional(),
  role: z.enum([
    "master_admin", 
    "operation_admin", 
    "category_admin", 
    "agent_admin", 
    "qa_admin", 
    "doc_admin", 
    "user", 
    "external"
  ]),
  status: z.enum(["active", "inactive", "locked", "pending"]),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

// 새 사용자 생성 스키마
const newUserSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("유효한 이메일 주소를 입력해주세요"),
  userId: z.string().min(1, "사용자 ID를 입력해주세요"),
  userType: z.enum(["student", "faculty"], { required_error: "사용자 타입을 선택해주세요" }),
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  position: z.string().optional(),
  role: z.enum([
    "user", "master_admin", "operation_admin", "category_admin", 
    "agent_admin", "qa_admin", "doc_admin", "external"
  ]).optional(),
  status: z.enum(["active", "inactive", "locked", "pending"]),
});

type NewUserFormData = z.infer<typeof newUserSchema>;

const orgCategoryEditSchema = z.object({
  name: z.string().min(1, "조직명은 필수입니다"),
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["활성", "비활성", "등록 승인 대기중"]),
  manager: z.string().optional(),
});

type OrgCategoryEditFormData = z.infer<typeof orgCategoryEditSchema>;

// 토큰 사용량 데이터 타입
interface TokenUsage {
  id: string;
  timestamp: string;
  agentName: string;
  question: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  indexTokens: number;
  preprocessingTokens: number;
  totalTokens: number;
  upperCategory?: string;
  lowerCategory?: string;
  detailCategory?: string;
}

interface TokenUsage {
  id: string;
  timestamp: string;
  agentName: string;
  question: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  indexTokens: number;
  preprocessingTokens: number;
  totalTokens: number;
  upperCategory?: string;
  lowerCategory?: string;
  detailCategory?: string;
}

function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // 토큰 관리 상태
  const [tokenPeriodFilter, setTokenPeriodFilter] = useState("month");
  const [tokenUpperCategoryFilter, setTokenUpperCategoryFilter] = useState("all");
  const [tokenLowerCategoryFilter, setTokenLowerCategoryFilter] = useState("all");
  const [tokenDetailCategoryFilter, setTokenDetailCategoryFilter] = useState("all");
  const [tokenKeywordFilter, setTokenKeywordFilter] = useState("");
  const [tokenModelFilter, setTokenModelFilter] = useState("all");
  const [tokenSortField, setTokenSortField] = useState<keyof TokenUsage>('timestamp');
  const [tokenSortOrder, setTokenSortOrder] = useState<'asc' | 'desc'>('desc');

  // Q&A 로그 조직 카테고리 상태
  const [qaSelectedUpperCategory, setQASelectedUpperCategory] = useState('all');
  const [qaSelectedLowerCategory, setQASelectedLowerCategory] = useState('all');
  const [qaSelectedDetailCategory, setQASelectedDetailCategory] = useState('all');

  // 에이전트 관리 상태는 아래에서 한 번만 정의됨

  // API 쿼리들을 먼저 선언
  // 관리자 목록 조회 (마스터 관리자, 에이전트 관리자만 필터링)
  const { data: allManagers } = useQuery<User[]>({
    queryKey: ['/api/admin/managers'],
    queryFn: async () => {
      const response = await fetch('/api/admin/managers');
      if (!response.ok) throw new Error('Failed to fetch managers');
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

  // 실제 conversation 로그 데이터 조회
  const { data: conversationLogs, error: conversationLogsError, isLoading: conversationLogsLoading } = useQuery({
    queryKey: ['/api/admin/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/conversations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        console.error('Conversation logs fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch conversation logs: ${response.status}`);
      }
      const data = await response.json();
      console.log('Conversation logs loaded:', data?.length || 0, 'conversations');
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });





  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isAgentDetailDialogOpen, setIsAgentDetailDialogOpen] = useState(false);

  const [isIconChangeDialogOpen, setIsIconChangeDialogOpen] = useState(false);
  const [isLmsDialogOpen, setIsLmsDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [userSortField, setUserSortField] = useState<string>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedAgentType, setSelectedAgentType] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [hasDocumentSearched, setHasDocumentSearched] = useState(false);
  const [isDocumentUploadDialogOpen, setIsDocumentUploadDialogOpen] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState('all');
  const [isDocumentDetailDialogOpen, setIsDocumentDetailDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [selectedDocumentPeriod, setSelectedDocumentPeriod] = useState('all');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);

  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");
  const [isUsingCustomImage, setIsUsingCustomImage] = useState(false);
  const [customImageFile, setCustomImageFile] = useState<File | null>(null);
  const [customImagePreview, setCustomImagePreview] = useState<string | null>(null);
  

  
  // 조직 카테고리 편집 관련 상태
  const [isOrgCategoryEditDialogOpen, setIsOrgCategoryEditDialogOpen] = useState(false);
  const [editingOrgCategory, setEditingOrgCategory] = useState<any>(null);
  
  // 카테고리 관리자 선택 다이얼로그 상태
  const [isCategoryManagerDialogOpen, setIsCategoryManagerDialogOpen] = useState(false);
  const [categoryManagerSearchQuery, setCategoryManagerSearchQuery] = useState('');
  const [selectedManagerUniversity, setSelectedManagerUniversity] = useState('all');
  const [selectedManagerCollege, setSelectedManagerCollege] = useState('all');
  const [selectedManagerDepartment, setSelectedManagerDepartment] = useState('all');
  
  // 문서 상세 팝업 상태
  const [isDocumentDetailOpen, setIsDocumentDetailOpen] = useState(false);
  const [documentDetailData, setDocumentDetailData] = useState<any>(null);
  const [selectedDocumentAgents, setSelectedDocumentAgents] = useState<string[]>([]);
  
  // 문서 상세 팝업 필터 상태
  const [selectedAgentManager, setSelectedAgentManager] = useState('');
  const [selectedAgentStatus, setSelectedAgentStatus] = useState('');
  const [tokenPeriod, setTokenPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [agentSortField, setAgentSortField] = useState<string>('name');
  const [agentSortDirection, setAgentSortDirection] = useState<'asc' | 'desc'>('asc');
  const [documentSortField, setDocumentSortField] = useState<string>('name');
  const [documentSortDirection, setDocumentSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // 문서 상세 팝업 조직 필터 상태
  const [selectedDocumentUpperCategory, setSelectedDocumentUpperCategory] = useState('');
  const [selectedDocumentLowerCategory, setSelectedDocumentLowerCategory] = useState('');
  const [selectedDocumentDetailCategory, setSelectedDocumentDetailCategory] = useState('');
  const [selectedDocumentAgentType, setSelectedDocumentAgentType] = useState('');
  const [documentAgentSearchQuery, setDocumentAgentSearchQuery] = useState('');
  
  // 문서 업로드 관련 상태
  const [selectedDocumentFile, setSelectedDocumentFile] = useState<File | null>(null);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<File[]>([]);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  
  // 사용자 파일 업로드 관련 상태
  const [selectedUserFiles, setSelectedUserFiles] = useState<File[]>([]);
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
  const [isUserFileUploading, setIsUserFileUploading] = useState(false);
  const [userFileUploadProgress, setUserFileUploadProgress] = useState(0);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sendWelcome, setSendWelcome] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);
  const userFileInputRef = useRef<HTMLInputElement>(null);
  
  // 에이전트 파일 업로드 관련 상태
  const [isAgentFileUploadModalOpen, setIsAgentFileUploadModalOpen] = useState(false);

  // Organization category upload states
  const [isOrgCategoryUploadDialogOpen, setIsOrgCategoryUploadDialogOpen] = useState(false);
  const [selectedOrgCategoryFiles, setSelectedOrgCategoryFiles] = useState<File[]>([]);
  const [isOrgCategoryUploading, setIsOrgCategoryUploading] = useState(false);
  const [orgCategoryUploadProgress, setOrgCategoryUploadProgress] = useState(0);
  const [orgOverwriteExisting, setOrgOverwriteExisting] = useState(false);
  const [orgValidateOnly, setOrgValidateOnly] = useState(false);
  const orgCategoryFileInputRef = useRef<HTMLInputElement>(null);
  
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentFileInputRef = useRef<HTMLInputElement>(null);
  
  // 에이전트 생성 탭 상태
  type AgentCreationTab = 'basic' | 'persona' | 'model' | 'upload' | 'sharing' | 'managers';
  const [agentCreationTab, setAgentCreationTab] = useState<AgentCreationTab>('basic');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  // 관리자 선정 상태
  type ManagerInfo = {
    id: string;
    name: string;
    email: string;
    upperCategory: string;
    lowerCategory: string;
    role?: string;
  };
  const [selectedAgentManagers, setSelectedAgentManagers] = useState<ManagerInfo[]>([]);
  const [selectedDocumentManagers, setSelectedDocumentManagers] = useState<ManagerInfo[]>([]);
  const [selectedQaManagers, setSelectedQaManagers] = useState<ManagerInfo[]>([]);
  
  // 관리자 탭 상태 추적
  const [currentManagerTab, setCurrentManagerTab] = useState<'agent' | 'document' | 'qa'>('agent');
  
  // 새 사용자 생성 폼의 동적 소속 정보 상태
  const [newUserAffiliations, setNewUserAffiliations] = useState([
    { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
  ]);

  // 소속 정보 추가 함수 (최대 3개)
  const addNewUserAffiliation = () => {
    if (newUserAffiliations.length < 3) {
      setNewUserAffiliations(prev => [
        ...prev,
        { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
      ]);
    }
  };

  // 소속 정보 삭제 함수
  const removeNewUserAffiliation = (index: number) => {
    if (newUserAffiliations.length > 1) {
      setNewUserAffiliations(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 소속 정보 업데이트 함수
  const updateNewUserAffiliation = (index: number, field: string, value: string) => {
    setNewUserAffiliations(prev => prev.map((affiliation, i) => 
      i === index ? { ...affiliation, [field]: value } : affiliation
    ));
  };
  
  // 관리자 검색 상태
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerFilterUpperCategory, setManagerFilterUpperCategory] = useState('all');
  const [managerFilterLowerCategory, setManagerFilterLowerCategory] = useState('all');
  const [managerFilterDetailCategory, setManagerFilterDetailCategory] = useState('all');
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const [managerItemsPerPage] = useState(10);

  // 관리자 검색 상태 초기화 함수
  const resetManagerSearchState = () => {
    setManagerSearchQuery('');
    setManagerFilterUpperCategory('all');
    setManagerFilterLowerCategory('all');
    setManagerFilterDetailCategory('all');
    setManagerCurrentPage(1);
  };

  // 관리자 탭 변경 핸들러
  const handleManagerTabChange = (newTab: 'agent' | 'document' | 'qa') => {
    if (currentManagerTab !== newTab) {
      resetManagerSearchState();
      setCurrentManagerTab(newTab);
    }
  };

  // ManagerSelector 컴포넌트
  function ManagerSelector({ 
    selectedManagers, 
    onManagerSelect, 
    searchQuery, 
    onSearchQueryChange, 
    filterUpperCategory, 
    onFilterUpperCategoryChange, 
    filterLowerCategory, 
    onFilterLowerCategoryChange, 
    filterDetailCategory, 
    onFilterDetailCategoryChange 
  }: {
    selectedManagers: ManagerInfo[];
    onManagerSelect: (manager: ManagerInfo) => void;
    searchQuery: string;
    onSearchQueryChange: (query: string) => void;
    filterUpperCategory: string;
    onFilterUpperCategoryChange: (category: string) => void;
    filterLowerCategory: string;
    onFilterLowerCategoryChange: (category: string) => void;
    filterDetailCategory: string;
    onFilterDetailCategoryChange: (category: string) => void;
  }) {
    const filteredUsers = users?.filter((user: any) => {
      const matchesSearch = !searchQuery || 
        user.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.username?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesUpperCategory = !filterUpperCategory || filterUpperCategory === 'all' || filterUpperCategory === '' || 
        user.upperCategory === filterUpperCategory;
      const matchesLowerCategory = !filterLowerCategory || filterLowerCategory === 'all' || filterLowerCategory === '' || 
        user.lowerCategory === filterLowerCategory;
      const matchesDetailCategory = !filterDetailCategory || filterDetailCategory === 'all' || filterDetailCategory === '' || 
        user.detailCategory === filterDetailCategory;
        
      return matchesSearch && matchesUpperCategory && matchesLowerCategory && matchesDetailCategory;
    }) || [];

    return (
      <div className="space-y-3">
        {/* 검색 필터 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Input
            placeholder="이름 또는 ID로 검색"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="text-sm"
          />
          <Select value={filterUpperCategory} onValueChange={onFilterUpperCategoryChange}>
            <SelectTrigger className="text-sm">
              <SelectValue placeholder="상위 조직" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체</SelectItem>
              {getUpperCategories().map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* 사용자 목록 */}
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded">
          {filteredUsers.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredUsers.slice(0, 10).map((user: any) => (
                <div
                  key={user.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center"
                  onClick={() => onManagerSelect({
                    id: user.id,
                    name: user.fullName || user.username,
                    email: user.email || `${user.username}@university.ac.kr`,
                    upperCategory: user.upperCategory || '',
                    lowerCategory: user.lowerCategory || ''
                  })}
                >
                  <div>
                    <div className="font-medium text-sm">{user.fullName || user.username}</div>
                    <div className="text-xs text-gray-500">{user.upperCategory} {user.lowerCategory && `> ${user.lowerCategory}`}</div>
                  </div>
                  <button
                    type="button"
                    className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                  >
                    선택
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 공유 설정 상태
  const [selectedGroups, setSelectedGroups] = useState<Array<{id: string, upperCategory: string, lowerCategory?: string, detailCategory?: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userFilterSearchQuery, setUserFilterSearchQuery] = useState('');
  const [userFilterUpperCategory, setUserFilterUpperCategory] = useState('');
  const [userFilterLowerCategory, setUserFilterLowerCategory] = useState('');
  const [userFilterDetailCategory, setUserFilterDetailCategory] = useState('');
  
  // 조직 선택 상태
  const [selectedUpperCategory, setSelectedUpperCategory] = useState<string>('');
  const [selectedLowerCategory, setSelectedLowerCategory] = useState<string>('');
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string>('');
  
  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  
  // 공유 설정 상태
  const [sharingMode, setSharingMode] = useState<'organization' | 'group' | 'user' | 'private'>('organization');
  const [sharingGroups, setSharingGroups] = useState<Array<{upperCategory: string, lowerCategory: string, detailCategory: string}>>([]);
  
  // 조직 필터링 함수들 - 조직 데이터 사용
  const getUpperCategories = () => {
    console.log('Getting upper categories, organizations:', organizations);
    if (!organizations) return [];
    const unique = Array.from(new Set(organizations.map((org: any) => org.upperCategory).filter(Boolean)));
    console.log('Upper categories found:', unique);
    return unique.sort();
  };
  
  const getLowerCategories = (upperCategory: string) => {
    console.log('Getting lower categories for:', upperCategory, 'organizations:', organizations);
    if (!organizations || !upperCategory) return [];
    const filtered = organizations.filter((org: any) => org.upperCategory === upperCategory);
    const unique = Array.from(new Set(filtered.map((org: any) => org.lowerCategory).filter(Boolean)));
    console.log('Lower categories found:', unique);
    return unique.sort();
  };
  
  const getDetailCategories = (upperCategory: string, lowerCategory?: string) => {
    console.log('Getting detail categories for:', upperCategory, lowerCategory, 'organizations:', organizations);
    if (!organizations || !upperCategory) return [];
    const filtered = organizations.filter((org: any) => 
      org.upperCategory === upperCategory && 
      (!lowerCategory || org.lowerCategory === lowerCategory)
    );
    const unique = Array.from(new Set(filtered.map((org: any) => org.detailCategory).filter(Boolean)));
    console.log('Detail categories found:', unique);
    return unique.sort();
  };
  
  const { toast } = useToast();
  const { t } = useLanguage();

  // Move organization-dependent calculations after useQuery declarations

  // 페이지네이션 상태
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 20;
  const organizationCategoriesPerPage = 20;

  // 통계 데이터 조회
  const { data: stats } = useQuery<SystemStats>({
    queryKey: ['/api/admin/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // 조직 목록 조회
  const { data: organizations = [], refetch: refetchOrganizations } = useQuery<any[]>({
    queryKey: ['/api/admin/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    }
  });

  // 사용자 목록 조회
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    }
  });

  // 사용자 상태 목록 조회
  const { data: userStatuses = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/user-statuses'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-statuses');
      if (!response.ok) throw new Error('Failed to fetch user statuses');
      return response.json();
    }
  });

  // 사용자 정렬 함수
  const handleUserSort = (field: string) => {
    if (userSortField === field) {
      setUserSortDirection(userSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setUserSortField(field);
      setUserSortDirection('asc');
    }
  };

  // 정렬된 사용자 목록
  const sortedUsers = useMemo(() => {
    if (!users) return [];
    
    return [...users].sort((a, b) => {
      let aValue: any = '';
      let bValue: any = '';
      
      switch (userSortField) {
        case 'name':
          aValue = (a as any).name || `${a.firstName || ''} ${a.lastName || ''}`.trim();
          bValue = (b as any).name || `${b.firstName || ''} ${b.lastName || ''}`.trim();
          break;
        case 'email':
          aValue = a.email || '';
          bValue = b.email || '';
          break;
        case 'role':
          aValue = a.role || '';
          bValue = b.role || '';
          break;
        case 'status':
          aValue = (a as any).status || 'active';
          bValue = (b as any).status || 'active';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        case 'upperCategory':
          aValue = (a as any).upperCategory || '';
          bValue = (b as any).upperCategory || '';
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return userSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, userSortField, userSortDirection]);

  // 사용자 데이터가 로드되면 자동으로 검색 상태를 true로 설정
  React.useEffect(() => {
    if (users && users.length > 0 && !hasSearched) {
      setHasSearched(true);
    }
  }, [users, hasSearched]);

  // Move this after organizations is declared via useQuery

  // 샘플 토큰 데이터 생성 (146개 질문응답 데이터 기반)
  const sampleTokenData = useMemo(() => {
    if (!agents) return [];
    
    const qaQuestions = [
      "입학 절차에 대해 알려주세요", "장학금 신청 방법이 궁금합니다", "학과 커리큘럼에 대해 설명해주세요", "졸업 요건이 무엇인가요?",
      "동아리 활동에 대해 알려주세요", "기숙사 신청은 어떻게 하나요?", "교환학생 프로그램이 있나요?", "취업 지원 서비스는 무엇이 있나요?",
      "도서관 이용 시간을 알려주세요", "수강신청 방법에 대해 설명해주세요", "학비 납부 일정을 알려주세요", "휴학 신청은 어떻게 하나요?",
      "연구실 참여 방법을 알려주세요", "인턴십 프로그램이 있나요?", "학점 인정 기준이 궁금합니다", "전공 선택은 언제 하나요?",
      "복수전공 신청 방법을 알려주세요", "부전공 이수 요건이 무엇인가요?", "교직 과정은 어떻게 신청하나요?", "외국어 시험 면제 조건이 있나요?",
      "졸업논문 작성 가이드라인을 알려주세요", "성적 이의신청은 어떻게 하나요?", "학사경고 해제 방법이 궁금합니다", "재수강 신청 절차를 알려주세요",
      "학점 포기는 어떻게 하나요?", "전과 신청 조건이 무엇인가요?", "학사 일정표를 확인하고 싶습니다", "수업료 감면 혜택이 있나요?",
      "국가장학금 신청 방법을 알려주세요", "교내 장학금 종류가 궁금합니다", "근로장학생 모집 공고는 언제 나오나요?", "해외연수 프로그램에 대해 알려주세요",
      "교환학생 선발 기준이 무엇인가요?", "어학연수 지원 제도가 있나요?", "창업 지원 프로그램을 소개해주세요", "취업 상담은 어디서 받을 수 있나요?",
      "진로 탐색 프로그램이 있나요?", "자격증 취득 지원 제도를 알려주세요", "온라인 강의 수강 방법이 궁금합니다", "출석 인정 기준을 알려주세요",
      "강의 평가는 언제 실시하나요?", "수업 변경 신청은 어떻게 하나요?", "계절학기 신청 방법을 알려주세요", "학위수여식은 언제 열리나요?",
      "졸업앨범 주문은 어떻게 하나요?", "학생증 재발급 방법을 알려주세요", "주차장 이용 방법이 궁금합니다", "체육시설 사용 안내를 알려주세요",
      "동아리 창설 절차가 궁금합니다", "학생회 선거는 언제 열리나요?", "학과 행사 일정을 확인하고 싶습니다", "축제 참가 방법을 알려주세요"
    ];

    // 더 많은 질문을 추가하여 146개 달성
    for (let i = qaQuestions.length; i < 146; i++) {
      qaQuestions.push(`대학 생활 관련 질문 ${i + 1}`);
    }

    const models = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
    const tokenData: TokenUsage[] = [];
    
    // 146개 질문응답 데이터를 기반으로 토큰 데이터 생성
    qaQuestions.forEach((question, index) => {
      const agentIndex = index % agents.length;
      const agent = agents[agentIndex];
      const model = models[index % models.length];
      
      // 토큰 사용량 계산 (질문 길이와 모델에 따라 다르게)
      const baseTokens = question.length * 2;
      const inputTokens = Math.floor(baseTokens + Math.random() * 200 + 100);
      const outputTokens = Math.floor(inputTokens * 0.3 + Math.random() * 150);
      const indexTokens = Math.floor(Math.random() * 100 + 50);
      const preprocessingTokens = Math.floor(Math.random() * 80 + 20);
      
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 30); // 최근 30일 내
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      
      const orgIndex = index % (organizations?.length || 1);
      const org = organizations?.[orgIndex];

      tokenData.push({
        id: `token_qa_${index}`,
        timestamp: timestamp.toISOString(),
        agentName: agent.name,
        question,
        model,
        inputTokens,
        outputTokens,
        indexTokens,
        preprocessingTokens,
        totalTokens: inputTokens + outputTokens + indexTokens + preprocessingTokens,
        upperCategory: org?.upperCategory,
        lowerCategory: org?.lowerCategory,
        detailCategory: org?.detailCategory,
      });
    });

    return tokenData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [agents, organizations]);

  // 토큰 데이터 필터링
  const filteredTokenData = useMemo(() => {
    let filtered = [...sampleTokenData];

    // 기간 필터링
    const now = new Date();
    switch (tokenPeriodFilter) {
      case 'today':
        filtered = filtered.filter(token => {
          const tokenDate = new Date(token.timestamp);
          return tokenDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(token => new Date(token.timestamp) >= weekAgo);
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(token => new Date(token.timestamp) >= monthAgo);
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(token => new Date(token.timestamp) >= quarterAgo);
        break;
    }

    // 조직 필터링
    if (tokenUpperCategoryFilter !== 'all') {
      filtered = filtered.filter(token => token.upperCategory === tokenUpperCategoryFilter);
    }
    if (tokenLowerCategoryFilter !== 'all') {
      filtered = filtered.filter(token => token.lowerCategory === tokenLowerCategoryFilter);
    }
    if (tokenDetailCategoryFilter !== 'all') {
      filtered = filtered.filter(token => token.detailCategory === tokenDetailCategoryFilter);
    }

    // 키워드 필터링
    if (tokenKeywordFilter.trim()) {
      const keyword = tokenKeywordFilter.toLowerCase();
      filtered = filtered.filter(token => 
        token.agentName.toLowerCase().includes(keyword) ||
        token.question.toLowerCase().includes(keyword)
      );
    }

    // 모델 필터링
    if (tokenModelFilter !== 'all') {
      filtered = filtered.filter(token => token.model === tokenModelFilter);
    }

    // 정렬
    filtered.sort((a, b) => {
      let aValue: any = a[tokenSortField];
      let bValue: any = b[tokenSortField];
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return tokenSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // 문자열이나 다른 타입의 경우
      if (tokenSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      }
      return aValue < bValue ? 1 : -1;
    });

    return filtered;
  }, [sampleTokenData, tokenPeriodFilter, tokenUpperCategoryFilter, tokenLowerCategoryFilter, tokenDetailCategoryFilter, tokenKeywordFilter, tokenModelFilter, tokenSortField, tokenSortOrder]);

  // 토큰 사용량 통계 계산
  const tokenStats = useMemo(() => {
    const totalTokens = filteredTokenData.reduce((sum, token) => sum + token.totalTokens, 0);
    const dailyAverage = Math.round(totalTokens / 30); // 30일 평균
    const estimatedCost = Math.round(totalTokens * 0.087); // 토큰당 약 0.087원 가정 (₩127,000 / 146만 토큰)
    
    return {
      monthly: totalTokens,
      dailyAverage,
      estimatedCost
    };
  }, [filteredTokenData]);

  // 토큰 데이터 페이지네이션
  const [tokenCurrentPage, setTokenCurrentPage] = useState(1);
  const tokenItemsPerPage = 20;
  const tokenTotalPages = Math.ceil(filteredTokenData.length / tokenItemsPerPage);
  const tokenStartIndex = (tokenCurrentPage - 1) * tokenItemsPerPage;
  const tokenEndIndex = tokenStartIndex + tokenItemsPerPage;
  const paginatedTokenData = filteredTokenData.slice(tokenStartIndex, tokenEndIndex);

  // 필터된 사용자 목록
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    
    let filtered = [...users];
    
    // 검색이 실행된 경우 또는 초기 상태에서 필터링 적용
    if (hasSearched || !hasSearched) {
      // 검색 쿼리 필터링 (검색어가 있을 때만)
      if (userSearchQuery.trim()) {
        const query = userSearchQuery.toLowerCase();
        filtered = filtered.filter(user => 
          user.username.toLowerCase().includes(query) ||
          (user.firstName && user.firstName.toLowerCase().includes(query)) ||
          (user.lastName && user.lastName.toLowerCase().includes(query)) ||
          (user.email && user.email.toLowerCase().includes(query))
        );
      }
      
      // 상위 카테고리 필터링
      if (selectedUniversity !== 'all') {
        filtered = filtered.filter(user => 
          (user as any).upperCategory === selectedUniversity
        );
      }
      
      // 하위 카테고리 필터링
      if (selectedCollege !== 'all') {
        filtered = filtered.filter(user => 
          (user as any).lowerCategory === selectedCollege
        );
      }
      
      // 세부 카테고리 필터링
      if (selectedDepartment !== 'all') {
        filtered = filtered.filter(user => 
          (user as any).detailCategory === selectedDepartment
        );
      }
      
      // 상태 필터링
      if (selectedDocumentType !== 'all') {
        filtered = filtered.filter(user => 
          (user as any).status === selectedDocumentType
        );
      }
      
      // 시스템 역할 필터링
      if (selectedDocumentPeriod !== 'all') {
        filtered = filtered.filter(user => 
          user.role === selectedDocumentPeriod
        );
      }
    }
    
    return filtered;
  }, [users, hasSearched, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment, selectedDocumentType, selectedDocumentPeriod]);

  // 페이지네이션된 사용자 목록
  const paginatedUsers = useMemo(() => {
    const startIndex = (userCurrentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  }, [filteredUsers, userCurrentPage, usersPerPage]);

  // 총 페이지 수 계산
  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage);

  // 관리자 선정용 사용자 필터링 (관리자 권한을 가진 사용자만)
  const filteredManagerUsers = useMemo(() => {
    if (!allManagers) return [];
    
    return allManagers.filter(user => {
      // 검색어 필터링
      const matchesSearch = !managerSearchQuery || 
        (user as any).name?.toLowerCase().includes(managerSearchQuery.toLowerCase()) ||
        user.id?.toLowerCase().includes(managerSearchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(managerSearchQuery.toLowerCase());
      
      // 조직 필터링
      const matchesUpper = !managerFilterUpperCategory || managerFilterUpperCategory === "all" || 
        (user as any).upperCategory === managerFilterUpperCategory;
      const matchesLower = !managerFilterLowerCategory || managerFilterLowerCategory === "all" || 
        (user as any).lowerCategory === managerFilterLowerCategory;
      const matchesDetail = !managerFilterDetailCategory || managerFilterDetailCategory === "all" || 
        (user as any).detailCategory === managerFilterDetailCategory;
      
      return matchesSearch && matchesUpper && matchesLower && matchesDetail;
    });
  }, [allManagers, managerSearchQuery, managerFilterUpperCategory, managerFilterLowerCategory, managerFilterDetailCategory]);

  // 관리자 사용자 페이지네이션
  const paginatedManagerUsers = useMemo(() => {
    const startIndex = (managerCurrentPage - 1) * managerItemsPerPage;
    const endIndex = startIndex + managerItemsPerPage;
    return filteredManagerUsers.slice(startIndex, endIndex);
  }, [filteredManagerUsers, managerCurrentPage, managerItemsPerPage]);

  // 관리자 총 페이지 수
  const totalManagerPages = Math.ceil(filteredManagerUsers.length / managerItemsPerPage);

  // 사용자 선택 핸들러
  const handleUserSelect = (user: User, managerType: 'agent' | 'document' | 'qa') => {
    const userInfo: ManagerInfo = {
      id: user.id,
      name: (user as any).name || user.id,
      role: user.role,
      email: user.email || '',
      upperCategory: (user as any).upperCategory || '',
      lowerCategory: (user as any).lowerCategory || ''
    };
    
    switch (managerType) {
      case 'agent':
        if (selectedAgentManagers.length < 3 && !selectedAgentManagers.some(m => m.id === user.id)) {
          setSelectedAgentManagers([...selectedAgentManagers, userInfo]);
        }
        break;
      case 'document':
        if (selectedDocumentManagers.length < 3 && !selectedDocumentManagers.some(m => m.id === user.id)) {
          setSelectedDocumentManagers([...selectedDocumentManagers, userInfo]);
        }
        break;
      case 'qa':
        if (selectedQaManagers.length < 3 && !selectedQaManagers.some(m => m.id === user.id)) {
          setSelectedQaManagers([...selectedQaManagers, userInfo]);
        }
        break;
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

  // 시스템 역할이 "마스터 관리자" 또는 "에이전트 관리자"인 사용자만 필터링
  const managers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => 
      user.role === 'master_admin' || user.role === 'agent_admin'
    );
  }, [users]);



  // 문서 목록 조회
  const { data: documentList } = useQuery<any[]>({
    queryKey: ['/api/admin/documents'],
    queryFn: async () => {
      const response = await fetch('/api/admin/documents');
      if (!response.ok) throw new Error('Failed to fetch documents');
      return response.json();
    }
  });

  // 사용자 파일 조회
  const { data: userFiles = [], refetch: refetchUserFiles } = useQuery({
    queryKey: ['/api/admin/user-files'],
    queryFn: async () => {
      const response = await fetch('/api/admin/user-files');
      if (!response.ok) throw new Error('Failed to fetch user files');
      return response.json();
    }
  });

  // 업로드된 조직 카테고리 파일 목록 조회
  const { data: uploadedOrgFiles = [], refetch: refetchOrgFiles } = useQuery<any[]>({
    queryKey: ['/api/admin/organization-files'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organization-files', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // 고유한 상위 카테고리 추출 (API data 사용) - moved after useQuery
  const uniqueUpperCategories = useMemo(() => {
    const categories = Array.from(new Set((organizations || []).map(org => org.upperCategory).filter(Boolean)));
    console.log('Unique upper categories:', categories);
    return categories.sort();
  }, [organizations]);

  // 선택된 상위 카테고리에 따른 하위 카테고리 필터링
  const filteredLowerCategories = useMemo(() => {
    if (selectedUniversity === 'all') {
      const categories = Array.from(new Set((organizations || []).map(org => org.lowerCategory).filter(Boolean)));
      console.log('All lower categories:', categories);
      return categories.sort();
    }
    const categories = Array.from(new Set((organizations || [])
      .filter(org => org.upperCategory === selectedUniversity)
      .map(org => org.lowerCategory).filter(Boolean)));
    console.log('Filtered lower categories for', selectedUniversity, ':', categories);
    return categories.sort();
  }, [selectedUniversity, organizations]);

  // 선택된 상위/하위 카테고리에 따른 세부 카테고리 필터링
  const filteredDetailCategories = useMemo(() => {
    if (selectedUniversity === 'all' || selectedCollege === 'all') {
      if (selectedUniversity === 'all' && selectedCollege === 'all') {
        const categories = Array.from(new Set((organizations || []).map(org => org.detailCategory).filter(Boolean)));
        return categories.sort();
      }
      return [];
    }
    let filtered = organizations || [];
    if (selectedUniversity !== 'all') {
      filtered = filtered.filter(org => org.upperCategory === selectedUniversity);
    }
    if (selectedCollege !== 'all') {
      filtered = filtered.filter(org => org.lowerCategory === selectedCollege);
    }
    const categories = Array.from(new Set(filtered.map(org => org.detailCategory).filter(Boolean)));
    console.log('Filtered detail categories:', categories);
    return categories.sort();
  }, [selectedUniversity, selectedCollege, organizations]);

  // 조직 계층 구조 생성 (NewUserForm에서 사용)
  const organizationHierarchy = useMemo(() => {
    if (!organizations) return {};
    
    const hierarchy: any = {};
    
    organizations.forEach(org => {
      if (org.upperCategory) {
        if (!hierarchy[org.upperCategory]) {
          hierarchy[org.upperCategory] = {};
        }
        
        if (org.lowerCategory) {
          if (!hierarchy[org.upperCategory][org.lowerCategory]) {
            hierarchy[org.upperCategory][org.lowerCategory] = [];
          }
          
          if (org.detailCategory && !hierarchy[org.upperCategory][org.lowerCategory].includes(org.detailCategory)) {
            hierarchy[org.upperCategory][org.lowerCategory].push(org.detailCategory);
          }
        }
      }
    });
    
    return hierarchy;
  }, [organizations]);

  // 토큰 관리 섹션 전용 필터링 로직
  const filteredTokenLowerCategories = useMemo(() => {
    if (tokenUpperCategoryFilter === 'all') {
      const categories = Array.from(new Set((organizations || []).map(org => org.lowerCategory).filter(Boolean)));
      return categories.sort();
    }
    const categories = Array.from(new Set((organizations || [])
      .filter(org => org.upperCategory === tokenUpperCategoryFilter)
      .map(org => org.lowerCategory).filter(Boolean)));
    return categories.sort();
  }, [tokenUpperCategoryFilter, organizations]);

  const filteredTokenDetailCategories = useMemo(() => {
    if (tokenUpperCategoryFilter === 'all' || tokenLowerCategoryFilter === 'all') {
      if (tokenUpperCategoryFilter === 'all' && tokenLowerCategoryFilter === 'all') {
        const categories = Array.from(new Set((organizations || []).map(org => org.detailCategory).filter(Boolean)));
        return categories.sort();
      }
      return [];
    }
    let filtered = organizations || [];
    if (tokenUpperCategoryFilter !== 'all') {
      filtered = filtered.filter(org => org.upperCategory === tokenUpperCategoryFilter);
    }
    if (tokenLowerCategoryFilter !== 'all') {
      filtered = filtered.filter(org => org.lowerCategory === tokenLowerCategoryFilter);
    }
    const categories = Array.from(new Set(filtered.map(org => org.detailCategory).filter(Boolean)));
    return categories.sort();
  }, [tokenUpperCategoryFilter, tokenLowerCategoryFilter, organizations]);

  // Q&A 로그 섹션 전용 조직 카테고리 필터링 로직
  const qaUniqueUpperCategories = useMemo(() => {
    const categories = Array.from(new Set((organizations || []).map(org => org.upperCategory).filter(Boolean)));
    return categories.sort();
  }, [organizations]);

  const qaFilteredLowerCategories = useMemo(() => {
    if (qaSelectedUpperCategory === 'all') {
      const categories = Array.from(new Set((organizations || []).map(org => org.lowerCategory).filter(Boolean)));
      return categories.sort();
    }
    const categories = Array.from(new Set((organizations || [])
      .filter(org => org.upperCategory === qaSelectedUpperCategory)
      .map(org => org.lowerCategory).filter(Boolean)));
    return categories.sort();
  }, [qaSelectedUpperCategory, organizations]);

  const qaFilteredDetailCategories = useMemo(() => {
    if (qaSelectedUpperCategory === 'all' || qaSelectedLowerCategory === 'all') {
      if (qaSelectedUpperCategory === 'all' && qaSelectedLowerCategory === 'all') {
        const categories = Array.from(new Set((organizations || []).map(org => org.detailCategory).filter(Boolean)));
        return categories.sort();
      }
      return [];
    }
    let filtered = organizations || [];
    if (qaSelectedUpperCategory !== 'all') {
      filtered = filtered.filter(org => org.upperCategory === qaSelectedUpperCategory);
    }
    if (qaSelectedLowerCategory !== 'all') {
      filtered = filtered.filter(org => org.lowerCategory === qaSelectedLowerCategory);
    }
    const categories = Array.from(new Set(filtered.map(org => org.detailCategory).filter(Boolean)));
    return categories.sort();
  }, [qaSelectedUpperCategory, qaSelectedLowerCategory, organizations]);

  // Q&A 로그 조직 카테고리별 필터링 로직
  const filteredConversationLogs = useMemo(() => {
    if (!conversationLogs) return [];
    
    let filtered = [...conversationLogs];
    
    // 상위 조직 카테고리 필터링
    if (qaSelectedUpperCategory !== 'all') {
      filtered = filtered.filter(log => log.upperCategory === qaSelectedUpperCategory);
    }
    
    // 하위 조직 카테고리 필터링
    if (qaSelectedLowerCategory !== 'all') {
      filtered = filtered.filter(log => log.lowerCategory === qaSelectedLowerCategory);
    }
    
    // 세부 조직 카테고리 필터링
    if (qaSelectedDetailCategory !== 'all') {
      filtered = filtered.filter(log => log.detailCategory === qaSelectedDetailCategory);
    }
    
    return filtered;
  }, [conversationLogs, qaSelectedUpperCategory, qaSelectedLowerCategory, qaSelectedDetailCategory]);

  // 필터된 조직 카테고리 목록 (실시간 필터링) - API 데이터 사용
  const filteredOrganizationCategories = useMemo(() => {
    if (!organizations || organizations.length === 0) return [];
    
    let filtered = [...organizations];
    
    // 검색어 필터링
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(category => 
        (category.upperCategory && category.upperCategory.toLowerCase().includes(query)) ||
        (category.lowerCategory && category.lowerCategory.toLowerCase().includes(query)) ||
        (category.detailCategory && category.detailCategory.toLowerCase().includes(query))
      );
    }
    
    // 상위 카테고리 필터링
    if (selectedUniversity !== 'all') {
      filtered = filtered.filter(category => 
        category.upperCategory === selectedUniversity
      );
    }
    
    // 하위 카테고리 필터링
    if (selectedCollege !== 'all') {
      filtered = filtered.filter(category => 
        category.lowerCategory === selectedCollege
      );
    }
    
    // 세부 카테고리 필터링
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(category => 
        category.detailCategory === selectedDepartment
      );
    }
    
    return filtered;
  }, [organizations, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment]);

  // Organization categories pagination state
  const [orgCategoriesCurrentPage, setOrgCategoriesCurrentPage] = useState(1);

  // Organization categories pagination calculations
  const totalOrgCategoriesPages = Math.ceil((filteredOrganizationCategories?.length || 0) / organizationCategoriesPerPage);
  const organizationCategoriesStartIndex = (orgCategoriesCurrentPage - 1) * organizationCategoriesPerPage;
  const organizationCategoriesEndIndex = organizationCategoriesStartIndex + organizationCategoriesPerPage;
  const paginatedOrganizationCategories = filteredOrganizationCategories?.slice(organizationCategoriesStartIndex, organizationCategoriesEndIndex) || [];

  // 검색 실행 함수
  const executeSearch = () => {
    setHasSearched(true);
    setUserCurrentPage(1); // 검색 시 첫 페이지로 이동
    setOrgCategoriesCurrentPage(1); // 조직 카테고리 페이지도 리셋
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedUniversity('all');
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setSelectedDocumentType('all'); // 상태 필터 초기화
    setSelectedDocumentPeriod('all'); // 시스템 역할 필터 초기화
    setSelectedAgentType('all'); // 유형 필터 초기화
    setUserSearchQuery('');
    setHasSearched(false);
    setUserCurrentPage(1); // 필터 초기화 시 첫 페이지로 이동
    setOrgCategoriesCurrentPage(1); // 조직 카테고리 페이지도 리셋
  };

  // 문서 필터 초기화 함수
  const resetDocumentFilters = () => {
    setSelectedDocumentCategory('all');
    setSelectedDocumentType('all');
    setSelectedDocumentPeriod('all');
    setDocumentSearchQuery('');
    setHasDocumentSearched(false);
  };

  // 문서 상세 보기 열기
  const openDocumentDetail = (document: any) => {
    setSelectedDocument(document);
    setIsDocumentDetailDialogOpen(true);
  };

  // 드롭박스 변경 시 자동 검색 실행
  const handleDocumentFilterChange = () => {
    setHasDocumentSearched(true);
  };



  // 사용자 편집 폼 초기화
  const userEditForm = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      name: "",
      email: "",
      upperCategory: "none",
      lowerCategory: "",
      detailCategory: "",
      position: "",
      role: "user",
      status: "active",
    },
  });

  // 새 사용자 생성 폼 초기화
  const newUserForm = useForm<NewUserFormData>({
    resolver: zodResolver(newUserSchema),
    defaultValues: {
      name: "",
      email: "",
      userId: "",
      userType: "student",
      upperCategory: "",
      lowerCategory: "",
      detailCategory: "",
      position: "",
      role: "user",
      status: "active",
    },
  });

  // 조직 카테고리 편집 폼 초기화
  const orgCategoryEditForm = useForm<OrgCategoryEditFormData>({
    resolver: zodResolver(orgCategoryEditSchema),
    defaultValues: {
      name: "",
      upperCategory: "",
      lowerCategory: "",
      detailCategory: "",
      description: "",
      status: "활성",
      manager: "",
    },
  });

  // 사용자 상세 정보 편집 열기
  const openUserDetailDialog = (user: User) => {
    setSelectedUser(user);
    userEditForm.reset({
      name: (user as any).name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || "",
      upperCategory: (user as any).upperCategory || "none",
      lowerCategory: (user as any).lowerCategory || "",
      detailCategory: (user as any).detailCategory || "",
      position: (user as any).position || "",
      role: (user.role as any) || "user",
      status: (user as any).status || "active",
    });
    setIsUserDetailDialogOpen(true);
  };

  // 사용자 편집 뮤테이션
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserEditFormData & { id: string }) => {
      const payload = {
        name: data.name,
        email: data.email || null,
        upperCategory: data.upperCategory === "none" ? null : data.upperCategory,
        lowerCategory: data.lowerCategory || null,
        detailCategory: data.detailCategory || null,
        position: data.position || null,
        role: data.role,
        status: data.status,
      };
      const response = await apiRequest("PATCH", `/api/admin/users/${data.id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "성공",
        description: "사용자 정보가 수정되었습니다.",
      });
      setIsUserDetailDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "사용자 정보 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 로보대학교 조직 삭제 뮤테이션
  const deleteRoboUniversityMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/admin/organizations/robo-university");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      toast({
        title: "삭제 완료",
        description: data.message,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: "로보대학교 조직 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 새 사용자 생성 뮤테이션
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserFormData) => {
      const payload = {
        id: data.userId,
        username: data.userId,
        name: data.name,
        email: data.email,
        userType: data.userType,
        role: data.role || "user",
        status: data.status,
        upperCategory: newUserAffiliations[0]?.upperCategory || null,
        lowerCategory: newUserAffiliations[0]?.lowerCategory || null,
        detailCategory: newUserAffiliations[0]?.detailCategory || null,
        position: newUserAffiliations[0]?.position || null,
        password: "defaultPassword123!", // 기본 비밀번호
      };
      const response = await apiRequest("POST", "/api/admin/users", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "성공",
        description: "새 사용자가 생성되었습니다.",
      });
      setIsNewUserDialogOpen(false);
      newUserForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "사용자 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 조직 카테고리 편집 열기
  const openOrgCategoryEditDialog = (category: any) => {
    setEditingOrgCategory(category);
    orgCategoryEditForm.reset({
      name: category.name || category.detailCategory || "",
      upperCategory: category.upperCategory || "",
      lowerCategory: category.lowerCategory || "",
      detailCategory: category.detailCategory || "",
      description: category.description || "",
      status: category.status || "활성",
      manager: category.manager || "",
    });
    setIsOrgCategoryEditDialogOpen(true);
  };

  // 조직 카테고리 편집 뮤테이션
  const updateOrgCategoryMutation = useMutation({
    mutationFn: async (data: OrgCategoryEditFormData & { id: number }) => {
      const updatePayload = {
        name: data.name,
        upperCategory: data.upperCategory || null,
        lowerCategory: data.lowerCategory || null,
        detailCategory: data.detailCategory || null,
        description: data.description || null,
        status: data.status,
        manager: data.manager || null, // 관리자 정보 포함
      };
      const response = await apiRequest("PATCH", `/api/admin/organizations/${data.id}`, updatePayload);
      return response.json();
    },
    onSuccess: (updatedCategory) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      
      // 현재 편집 중인 카테고리 정보도 업데이트
      if (editingOrgCategory && updatedCategory) {
        setEditingOrgCategory(updatedCategory);
      }
      
      toast({
        title: "성공",
        description: "조직 정보가 수정되었습니다.",
      });
      setIsOrgCategoryEditDialogOpen(false);
      setEditingOrgCategory(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "조직 정보 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 사용자 카테고리 데이터 (실제 사용자 데이터 기반)
  const upperCategories = useMemo(() => {
    if (!users || users.length === 0) return [];
    const categories = Array.from(new Set(users.map(user => (user as any).upperCategory).filter(Boolean)));
    return categories.sort();
  }, [users]);

  const lowerCategories = useMemo(() => {
    if (!users || users.length === 0 || selectedUniversity === 'all') return [];
    const categories = Array.from(new Set(
      users
        .filter(user => (user as any).upperCategory === selectedUniversity)
        .map(user => (user as any).lowerCategory)
        .filter(Boolean)
    ));
    return categories.sort();
  }, [users, selectedUniversity]);

  const detailCategories = useMemo(() => {
    if (!users || users.length === 0 || selectedCollege === 'all' || selectedUniversity === 'all') return [];
    const categories = Array.from(new Set(
      users
        .filter(user => 
          (user as any).upperCategory === selectedUniversity && 
          (user as any).lowerCategory === selectedCollege
        )
        .map(user => (user as any).detailCategory)
        .filter(Boolean)
    ));
    return categories.sort();
  }, [users, selectedUniversity, selectedCollege]);



  // 상위 카테고리 변경 시 하위 카테고리 초기화 (실시간 적용)
  const handleUpperCategoryChange = (value: string) => {
    setSelectedUniversity(value);
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setHasSearched(true); // 실시간 적용
    setUserCurrentPage(1); // 사용자 페이지 리셋
  };

  // 하위 카테고리 변경 시 세부 카테고리 초기화 (실시간 적용)
  const handleLowerCategoryChange = (value: string) => {
    setSelectedCollege(value);
    setSelectedDepartment('all');
    setHasSearched(true); // 실시간 적용
    setUserCurrentPage(1); // 사용자 페이지 리셋
  };

  // 세부 카테고리 변경 시 실시간 적용
  const handleDetailCategoryChange = (value: string) => {
    setSelectedDepartment(value);
    setHasSearched(true); // 실시간 적용
    setUserCurrentPage(1); // 사용자 페이지 리셋
  };

  // Q&A 로그 조직 카테고리 핸들러 함수들
  const handleQAUpperCategoryChange = (value: string) => {
    setQASelectedUpperCategory(value);
    setQASelectedLowerCategory('all');
    setQASelectedDetailCategory('all');
  };

  const handleQALowerCategoryChange = (value: string) => {
    setQASelectedLowerCategory(value);
    setQASelectedDetailCategory('all');
  };

  const handleQADetailCategoryChange = (value: string) => {
    setQASelectedDetailCategory(value);
  };

  // 에이전트 전용 상태 (사용자 검색과 분리)
  const [agentFilterUpperCategory, setAgentFilterUpperCategory] = useState('all');
  const [agentFilterLowerCategory, setAgentFilterLowerCategory] = useState('all');
  const [agentFilterDetailCategory, setAgentFilterDetailCategory] = useState('all');
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentFilterType, setAgentFilterType] = useState('all');
  const [agentFilterStatus, setAgentFilterStatus] = useState('all');
  const [agentFilterManager, setAgentFilterManager] = useState('all');
  const [hasAgentSearched, setHasAgentSearched] = useState(true);

  // 에이전트 행 클릭 핸들러
  const handleAgentRowClick = (agent: Agent) => {
    console.log('Agent row clicked:', agent);
  };

  // 에이전트 편집 핸들러
  const handleEditAgent = (agent: Agent) => {
    console.log('Edit agent:', agent);
  };

  // 에이전트 삭제 핸들러
  const handleDeleteAgent = (agentId: number) => {
    console.log('Delete agent:', agentId);
  };

  // 에이전트 검색 함수
  const handleAgentSearch = () => {
    setHasAgentSearched(true);
  };

  // 문서 텍스트 추출 수정 함수
  const fixDocumentsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/fix-documents");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "성공",
        description: `문서 텍스트 추출이 완료되었습니다. 처리된 문서: ${data.fixedCount}개`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "문서 텍스트 추출 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 문서 텍스트 추출 수정 핸들러
  const handleFixDocuments = () => {
    fixDocumentsMutation.mutate();
  };

  // 에이전트 필터 초기화 함수
  const resetAgentFilters = () => {
    setAgentSearchQuery('');
    setAgentFilterUpperCategory('all');
    setAgentFilterLowerCategory('all');
    setAgentFilterDetailCategory('all');
    setAgentFilterType('all');
    setAgentFilterStatus('all');
    setHasAgentSearched(false);
  };

  // 에이전트 필터링 로직
  const filteredAgents = useMemo(() => {
    if (!agents) return [];
    
    // 검색을 하지 않은 경우 모든 에이전트 표시 (초기 화면)
    if (!hasAgentSearched) return [...agents];
    
    let filtered = [...agents];
    
    // 검색어 필터링
    if (agentSearchQuery.trim()) {
      const query = agentSearchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
      );
    }
    
    // 상위 카테고리 필터링
    if (agentFilterUpperCategory !== 'all') {
      filtered = filtered.filter(agent => 
        (agent as any).upperCategory === agentFilterUpperCategory
      );
    }
    
    // 하위 카테고리 필터링
    if (agentFilterLowerCategory !== 'all') {
      filtered = filtered.filter(agent => 
        (agent as any).lowerCategory === agentFilterLowerCategory
      );
    }
    
    // 세부 카테고리 필터링
    if (agentFilterDetailCategory !== 'all') {
      filtered = filtered.filter(agent => 
        (agent as any).detailCategory === agentFilterDetailCategory
      );
    }
    
    // 에이전트 유형 필터링
    if (agentFilterType !== 'all') {
      filtered = filtered.filter(agent => 
        agent.category === agentFilterType
      );
    }
    
    // 상태 필터링
    if (agentFilterStatus !== 'all') {
      filtered = filtered.filter(agent => {
        if (agentFilterStatus === 'active') return agent.isActive;
        if (agentFilterStatus === 'inactive') return !agent.isActive;
        return true;
      });
    }
    
    return filtered;
  }, [agents, agentSearchQuery, agentFilterUpperCategory, agentFilterLowerCategory, agentFilterDetailCategory, agentFilterType, agentFilterStatus, hasAgentSearched]);



  // 에이전트 정렬 핸들러
  const handleAgentSort = (field: string) => {
    if (agentSortField === field) {
      setAgentSortDirection(agentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAgentSortField(field);
      setAgentSortDirection('asc');
    }
  };

  const handleDocumentSort = (field: string) => {
    if (documentSortField === field) {
      setDocumentSortDirection(documentSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setDocumentSortField(field);
      setDocumentSortDirection('asc');
    }
  };

  // 샘플 문서 데이터
  const sampleDocuments = [
    { name: "2024학년도 수강신청 안내.pdf", type: "강의 자료", size: "2.1 MB", date: "2024-01-15", agents: ["학사 안내봇"], status: "활성", uploader: "admin001" },
    { name: "신입생 오리엔테이션 가이드.docx", type: "정책 문서", size: "1.8 MB", date: "2024-02-28", agents: ["입학처 안내봇"], status: "활성", uploader: "prof001" },
    { name: "졸업논문 작성 가이드라인.pdf", type: "매뉴얼", size: "3.2 MB", date: "2024-03-10", agents: ["학사 안내봇", "교수 상담봇"], status: "활성", uploader: "prof002" },
    { name: "장학금 신청서 양식.xlsx", type: "양식", size: "156 KB", date: "2024-01-20", agents: ["학생 지원봇"], status: "활성", uploader: "admin002" },
    { name: "2024년 1학기 시간표.pdf", type: "공지사항", size: "892 KB", date: "2024-02-05", agents: ["학사 안내봇"], status: "활성", uploader: "admin001" },
    { name: "컴퓨터공학과 교육과정표.pdf", type: "교육과정", size: "1.4 MB", date: "2024-01-30", agents: ["학과 안내봇"], status: "활성", uploader: "prof003" },
    { name: "도서관 이용 안내서.docx", type: "매뉴얼", size: "2.3 MB", date: "2024-02-12", agents: ["도서관 봇"], status: "활성", uploader: "lib001" },
    { name: "기숙사 입사 신청서.pdf", type: "양식", size: "678 KB", date: "2024-01-25", agents: ["생활관 안내봇"], status: "활성", uploader: "dorm001" },
    { name: "취업 준비 가이드북.pdf", type: "강의 자료", size: "4.1 MB", date: "2024-03-05", agents: ["취업 상담봇"], status: "활성", uploader: "career001" },
    { name: "학생회 활동 규정.docx", type: "정책 문서", size: "1.2 MB", date: "2024-02-18", agents: ["학생회 봇"], status: "활성", uploader: "student001" },
    { name: "실험실 안전수칙.pdf", type: "매뉴얼", size: "2.8 MB", date: "2024-01-12", agents: ["안전관리 봇"], status: "활성", uploader: "safety001" },
    { name: "교환학생 프로그램 안내.pdf", type: "공지사항", size: "1.9 MB", date: "2024-02-22", agents: ["국제교류 봇"], status: "활성", uploader: "intl001" },
    { name: "체육관 시설 이용 안내.docx", type: "매뉴얼", size: "1.1 MB", date: "2024-01-08", agents: ["체육시설 봇"], status: "활성", uploader: "sports001" },
    { name: "등록금 납부 안내서.pdf", type: "양식", size: "945 KB", date: "2024-01-18", agents: ["재무 안내봇"], status: "활성", uploader: "finance001" },
    { name: "졸업사정 기준표.xlsx", type: "정책 문서", size: "234 KB", date: "2024-02-15", agents: ["학사 안내봇"], status: "활성", uploader: "admin001" },
    { name: "연구실 배정 신청서.pdf", type: "양식", size: "567 KB", date: "2024-03-01", agents: ["대학원 안내봇"], status: "활성", uploader: "grad001" },
    { name: "학과별 커리큘럼 가이드.pdf", type: "교육과정", size: "3.7 MB", date: "2024-01-22", agents: ["학과 안내봇"], status: "활성", uploader: "prof001" },
    { name: "휴학 신청 절차.docx", type: "매뉴얼", size: "834 KB", date: "2024-02-08", agents: ["학사 안내봇"], status: "활성", uploader: "admin002" },
    { name: "교내 동아리 활동 가이드.pdf", type: "공지사항", size: "1.6 MB", date: "2024-01-28", agents: ["동아리 안내봇"], status: "활성", uploader: "club001" },
    { name: "성적 이의신청서.pdf", type: "양식", size: "412 KB", date: "2024-02-25", agents: ["학사 안내봇"], status: "활성", uploader: "admin001" },
    { name: "캡스톤 프로젝트 가이드라인.pdf", type: "강의 자료", size: "2.9 MB", date: "2024-03-08", agents: ["교수 상담봇"], status: "활성", uploader: "prof004" },
    { name: "학생 상담 프로그램 안내.docx", type: "공지사항", size: "1.3 MB", date: "2024-02-10", agents: ["상담 안내봇"], status: "활성", uploader: "counsel001" },
    { name: "교육실습 신청서.xlsx", type: "양식", size: "189 KB", date: "2024-01-16", agents: ["교육대학 봇"], status: "비활성", uploader: "edu001" },
    { name: "논문 심사 기준표.pdf", type: "정책 문서", size: "1.7 MB", date: "2024-02-28", agents: ["대학원 안내봇"], status: "활성", uploader: "grad002" },
    { name: "학교 시설물 이용 규칙.pdf", type: "매뉴얼", size: "2.4 MB", date: "2024-01-05", agents: ["시설관리 봇"], status: "활성", uploader: "facility001" },
    { name: "인턴십 프로그램 안내서.pdf", type: "공지사항", size: "2.1 MB", date: "2024-03-12", agents: ["취업 상담봇"], status: "활성", uploader: "career002" },
    { name: "학점 교류 신청서.docx", type: "양식", size: "623 KB", date: "2024-02-05", agents: ["학사 안내봇"], status: "활성", uploader: "admin003" },
    { name: "연구윤리 가이드라인.pdf", type: "정책 문서", size: "1.8 MB", date: "2024-01-31", agents: ["연구지원 봇"], status: "활성", uploader: "research001" },
    { name: "학생증 재발급 신청서.pdf", type: "양식", size: "345 KB", date: "2024-02-20", agents: ["학생 지원봇"], status: "활성", uploader: "admin001" },
    { name: "교수법 워크샵 자료.pptx", type: "강의 자료", size: "5.2 MB", date: "2024-03-15", agents: ["교수 개발봇"], status: "활성", uploader: "prof005" }
  ];

  // 문서 정렬 함수
  const sortedDocuments = useMemo(() => {
    // 파일 크기를 바이트로 변환하는 함수 (로컬 함수로 정의)
    const parseSize = (sizeStr: string): number => {
      const units = { 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
      const match = sizeStr.match(/^([\d.]+)\s*(KB|MB|GB)$/);
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2] as keyof typeof units;
        return value * units[unit];
      }
      return 0;
    };

    return [...sampleDocuments].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (documentSortField) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'size':
          // 크기를 바이트 단위로 변환하여 정렬
          aValue = parseSize(a.size);
          bValue = parseSize(b.size);
          break;
        case 'date':
          aValue = new Date(a.date);
          bValue = new Date(b.date);
          break;
        case 'agents':
          aValue = a.agents[0] || '';
          bValue = b.agents[0] || '';
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (documentSortField === 'size' || documentSortField === 'date') {
        // 숫자나 날짜는 직접 비교
        if (documentSortDirection === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      } else {
        // 문자열은 localeCompare 사용
        const aStr = String(aValue);
        const bStr = String(bValue);
        if (documentSortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      }
    });
  }, [sampleDocuments, documentSortField, documentSortDirection]);





  // 정렬된 에이전트 목록
  const sortedAgents = useMemo(() => {
    // 검색을 하지 않은 경우 모든 에이전트 표시, 검색한 경우 필터링된 에이전트 표시
    const agentsToSort = hasAgentSearched ? filteredAgents : agents || [];
    
    return [...agentsToSort].sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      // 특별한 필드들에 대한 처리
      if (agentSortField === 'manager') {
        aValue = (a as any).managerFirstName && (a as any).managerLastName 
          ? `${(a as any).managerFirstName} ${(a as any).managerLastName}` 
          : '';
        bValue = (b as any).managerFirstName && (b as any).managerLastName 
          ? `${(b as any).managerFirstName} ${(b as any).managerLastName}` 
          : '';
      } else if (agentSortField === 'organization') {
        aValue = (a as any).organizationName || '';
        bValue = (b as any).organizationName || '';
      } else if (agentSortField === 'documentCount') {
        aValue = (a as any).documentCount || 0;
        bValue = (b as any).documentCount || 0;
      } else if (agentSortField === 'userCount') {
        aValue = (a as any).userCount || 0;
        bValue = (b as any).userCount || 0;
      } else if (agentSortField === 'createdAt') {
        aValue = (a as any).lastUsedAt || a.createdAt || '';
        bValue = (b as any).lastUsedAt || b.createdAt || '';
      } else {
        aValue = a[agentSortField as keyof Agent];
        bValue = b[agentSortField as keyof Agent];
      }
      
      // 문자열인 경우 대소문자 구분 없이 정렬
      if (typeof aValue === 'string') aValue = aValue.toLowerCase();
      if (typeof bValue === 'string') bValue = bValue.toLowerCase();
      
      if (aValue < bValue) return agentSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return agentSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [agents, filteredAgents, agentSortField, agentSortDirection, hasAgentSearched]);

  // 페이지네이션 설정
  const ITEMS_PER_PAGE = 10;
  
  // 사용자 목록 페이지네이션
  const userPagination = usePagination({
    data: sortedUsers,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // 에이전트 목록 페이지네이션  
  const agentPagination = usePagination({
    data: sortedAgents,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // 조직 카테고리 목록 페이지네이션
  const organizationPagination = usePagination({
    data: filteredOrganizationCategories,
    itemsPerPage: ITEMS_PER_PAGE,
  });

  // 문서 목록 페이지네이션
  const documentPagination = usePagination({
    data: documentList || [],
    itemsPerPage: ITEMS_PER_PAGE,
  });



  // 에이전트 생성 폼
  const agentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      // 📌 기본 정보
      name: "",
      description: "",
      category: "",
      icon: "Bot",
      backgroundColor: "#3B82F6",
      
      // 📌 소속 및 상태
      upperCategory: "",
      lowerCategory: "",
      detailCategory: "",
      status: "active",
      
      // 📌 모델 및 응답 설정
      llmModel: "gpt-4o",
      chatbotType: "doc-fallback-llm",
      maxInputLength: 2048,
      maxOutputLength: 1024,
      
      // 📌 역할 및 페르소나 설정
      personaNickname: "",
      speechStyle: "",
      personality: "",
      forbiddenResponseStyle: "",
      
      // 📌 권한 및 접근 설정
      visibility: "organization",
      managerId: "",
      agentEditorIds: [],
      documentManagerIds: [],
    },
  });



  // 에이전트 생성 뮤테이션
  const createAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData) => {
      const payload = {
        ...data,
        icon: "User", // 기본 아이콘
        backgroundColor: "blue", // 기본 배경색
        creatorId: "admin", // 기본 생성자
        isActive: data.status === "active",
        // 관리자 정보 추가
        managerId: selectedAgentManagers.length > 0 ? selectedAgentManagers[0].id : undefined,
        agentManagerIds: selectedAgentManagers.map(m => m.id),
        documentManagerIds: selectedDocumentManagers.map(m => m.id),
        qaManagerIds: selectedQaManagers.map(m => m.id),
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
      // 관리자 선정 상태 초기화
      setSelectedAgentManagers([]);
      setSelectedDocumentManagers([]);
      setSelectedQaManagers([]);
      setSelectedFiles([]);
      setManagerSearchQuery('');
      setAgentCreationTab('basic');
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "에이전트 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 커스텀 이미지 파일 핸들러
  const handleCustomImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 파일 크기 체크 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "파일 크기 오류",
          description: "이미지 파일은 5MB 이하여야 합니다.",
          variant: "destructive",
        });
        return;
      }

      // 파일 타입 체크
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "파일 형식 오류",
          description: "JPG, PNG, GIF, WEBP 형식만 지원됩니다.",
          variant: "destructive",
        });
        return;
      }

      setCustomImageFile(file);
      setIsUsingCustomImage(true);

      // 미리보기 생성
      const reader = new FileReader();
      reader.onload = (e) => {
        setCustomImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 아이콘 변경 뮤테이션
  const changeIconMutation = useMutation({
    mutationFn: async ({ agentId, icon, backgroundColor, customImageFile }: { 
      agentId: number, 
      icon?: string, 
      backgroundColor: string,
      customImageFile?: File 
    }) => {
      if (customImageFile) {
        // 커스텀 이미지 업로드
        const formData = new FormData();
        formData.append('customImageFile', customImageFile);
        formData.append('backgroundColor', backgroundColor);

        const response = await fetch(`/api/admin/agents/${agentId}/icon`, {
          method: 'PATCH',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('아이콘 변경에 실패했습니다');
        }
        return response.json();
      } else {
        // 기본 아이콘 사용
        const response = await apiRequest("PATCH", `/api/admin/agents/${agentId}/icon`, { icon, backgroundColor });
        return response.json();
      }
    },
    onSuccess: () => {
      // 강력한 캐시 무효화 - 모든 에이전트 관련 쿼리
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/agents/managed'] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === '/api/agents' || 
        query.queryKey[0] === '/api/admin/agents' 
      });
      
      // 강제로 데이터 다시 가져오기
      setTimeout(async () => {
        await Promise.all([
          queryClient.refetchQueries({ queryKey: ['/api/admin/agents'], type: "all" }),
          queryClient.refetchQueries({ queryKey: ['/api/agents'], type: "all" }),
          queryClient.refetchQueries({ queryKey: ['/api/agents/managed'], type: "all" })
        ]);
        console.log("Icon change: All agent queries forcefully refetched");
      }, 100);
      
      toast({
        title: "성공",
        description: "아이콘이 변경되었습니다.",
      });
      setIsIconChangeDialogOpen(false);
      setIconChangeAgent(null);
      // 상태 초기화
      setIsUsingCustomImage(false);
      setCustomImageFile(null);
      setCustomImagePreview(null);
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
      if (isUsingCustomImage && customImageFile) {
        changeIconMutation.mutate({
          agentId: iconChangeAgent.id,
          backgroundColor: selectedBgColor,
          customImageFile: customImageFile
        });
      } else {
        changeIconMutation.mutate({
          agentId: iconChangeAgent.id,
          icon: selectedIcon,
          backgroundColor: selectedBgColor
        });
      }
    }
  };

  // 문서 파일 선택 핸들러
  const handleDocumentFileSelect = () => {
    console.log("파일 선택 버튼 클릭됨");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 에이전트 파일 선택 핸들러
  const handleAgentFileSelect = () => {
    console.log("에이전트 파일 선택 버튼 클릭됨");
    if (agentFileInputRef.current) {
      agentFileInputRef.current.click();
    }
  };

  // 에이전트 파일 선택 변경 핸들러
  const handleAgentFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      const validFiles = files.filter(file => 
        allowedTypes.includes(file.type) && file.size <= 50 * 1024 * 1024
      );
      
      if (validFiles.length !== files.length) {
        toast({
          title: "파일 형식 오류",
          description: "지원하지 않는 파일 형식이 있거나 크기가 50MB를 초과합니다.",
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedFiles((prev: File[]) => [...prev, ...validFiles]);
        toast({
          title: "파일 선택됨",
          description: `${validFiles.length}개 파일이 선택되었습니다.`,
        });
      }
    }
  };

  // 파일 선택 변경 핸들러 (다중 파일 지원)
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // 파일 크기 체크 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (크기 초과)`);
          continue;
        }
        
        // 파일 타입 체크
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(`${file.name} (지원하지 않는 형식)`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "일부 파일이 제외됨",
          description: `${invalidFiles.join(', ')}`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedDocumentFiles(prev => [...prev, ...validFiles]);
        toast({
          title: "파일 선택됨",
          description: `${validFiles.length}개 파일이 선택되었습니다.`,
        });
      }
    }
    
    // 파일 입력 값 리셋 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';
  };

  // 선택된 파일 제거 핸들러
  const handleRemoveFile = (index: number) => {
    setSelectedDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 모든 파일 제거 핸들러
  const handleClearAllFiles = () => {
    setSelectedDocumentFiles([]);
  };

  // 드래그 오버 핸들러
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드래그 엔터 핸들러
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드래그 리브 핸들러
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // 드롭 핸들러
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // 파일 크기 체크 (50MB)
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (크기 초과)`);
          continue;
        }
        
        // 파일 타입 체크
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(`${file.name} (지원하지 않는 형식)`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "일부 파일이 제외됨",
          description: `${invalidFiles.join(', ')}`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedDocumentFiles(prev => [...prev, ...validFiles]);
        toast({
          title: "파일 추가됨",
          description: `${validFiles.length}개 파일이 추가되었습니다.`,
        });
      }
    }
  };

  // 사용자 파일 선택 핸들러
  const handleUserFileSelect = () => {
    if (userFileInputRef.current) {
      userFileInputRef.current.click();
    }
  };

  // Organization category file handlers
  const handleOrgCategoryFileSelect = () => {
    if (orgCategoryFileInputRef.current) {
      orgCategoryFileInputRef.current.click();
    }
  };

  const handleOrgCategoryFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const allowedTypes = [
        'application/vnd.ms-excel', // .xls
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'text/csv', // .csv
        'application/csv' // .csv alternative
      ];
      
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        if (file.size > 10 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (파일 크기가 10MB를 초과함)`);
          continue;
        }
        
        // Check both MIME type and file extension for better compatibility
        const fileName = file.name.toLowerCase();
        const isValidMimeType = allowedTypes.includes(file.type);
        const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
        
        if (!isValidMimeType && !isValidExtension) {
          invalidFiles.push(`${file.name} (지원하지 않는 형식: CSV, Excel 파일만 지원)`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "일부 파일이 제외됨",
          description: `${invalidFiles.join(', ')}`,
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedOrgCategoryFiles(prev => [...prev, ...validFiles]);
        toast({
          title: "파일 추가됨",
          description: `${validFiles.length}개 파일이 추가되었습니다.`,
        });
      }
    }
    
    // Clear the input value so the same file can be selected again
    if (e.target) {
      e.target.value = '';
    }
  };

  const handleOrgCategoryUpload = async () => {
    if (selectedOrgCategoryFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        variant: "destructive",
      });
      return;
    }

    setIsOrgCategoryUploading(true);
    setOrgCategoryUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Add all files to the same FormData
      for (const file of selectedOrgCategoryFiles) {
        formData.append('files', file);
      }
      
      // Add options
      formData.append('overwriteExisting', orgOverwriteExisting.toString());
      formData.append('validateOnly', orgValidateOnly.toString());

      const response = await fetch('/api/admin/upload-org-categories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '조직 카테고리 파일 업로드에 실패했습니다');
      }

      const result = await response.json();
      setOrgCategoryUploadProgress(100);
      
      toast({
        title: "업로드 완료",
        description: result.message || `${result.totalProcessed || selectedOrgCategoryFiles.length}개 조직 카테고리가 처리되었습니다.`,
      });

      // Refresh organization categories data and uploaded files list
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/organization-files'] });
      await refetchOrganizations();
      await refetchOrgFiles();

      setIsOrgCategoryUploadDialogOpen(false);
      setSelectedOrgCategoryFiles([]);
      setOrgCategoryUploadProgress(0);
      
      // Reset filters to show all data
      setSelectedUniversity('all');
      setSelectedCollege('all');
      setSelectedDepartment('all');
      setUserSearchQuery('');
      
    } catch (error: any) {
      console.error('Organization category upload error:', error);
      toast({
        title: "업로드 실패",
        description: error.message || "조직 카테고리 파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsOrgCategoryUploading(false);
    }
  };

  // 사용자 파일 입력 변경 핸들러
  const handleUserFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // 파일 크기 체크 (50MB로 증가)
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (크기 초과 - 최대 50MB)`);
          continue;
        }
        
        // 파일 확장자로 검증 (가장 신뢰할 수 있는 방법)
        const fileName = file.name.toLowerCase();
        const isValidFile = fileName.endsWith('.csv') || 
                           fileName.endsWith('.xlsx') || 
                           fileName.endsWith('.xls');
        
        if (!isValidFile) {
          invalidFiles.push(`${file.name} (지원하지 않는 형식 - .csv, .xlsx, .xls만 가능)`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "일부 파일이 제외됨",
          description: invalidFiles.join(', '),
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedUserFiles(validFiles);
        toast({
          title: "파일 선택됨",
          description: `${validFiles.length}개 파일이 선택되었습니다.`,
        });
      }
    }
    
    e.target.value = '';
  };

  // 사용자 파일 드롭 핸들러
  const handleUserFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];
      
      for (const file of files) {
        // 파일 크기 체크 (50MB로 증가)
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (크기 초과 - 최대 50MB)`);
          continue;
        }
        
        // 파일 확장자로 검증 (가장 신뢰할 수 있는 방법)
        const fileName = file.name.toLowerCase();
        const isValidFile = fileName.endsWith('.csv') || 
                           fileName.endsWith('.xlsx') || 
                           fileName.endsWith('.xls');
        
        if (!isValidFile) {
          invalidFiles.push(`${file.name} (지원하지 않는 형식 - .csv, .xlsx, .xls만 가능)`);
          continue;
        }
        
        validFiles.push(file);
      }
      
      if (invalidFiles.length > 0) {
        toast({
          title: "일부 파일이 제외됨",
          description: invalidFiles.join(', '),
          variant: "destructive",
        });
      }
      
      if (validFiles.length > 0) {
        setSelectedUserFiles(validFiles);
        toast({
          title: "파일 추가됨",
          description: `${validFiles.length}개 파일이 추가되었습니다.`,
        });
      }
    }
  };

  // 사용자 엑셀 내보내기 핸들러
  const handleExcelExport = async () => {
    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('엑셀 내보내기에 실패했습니다');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `사용자목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "내보내기 완료",
        description: "사용자 목록이 엑셀 파일로 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('Excel export error:', error);
      toast({
        title: "내보내기 실패",
        description: "엑셀 파일 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 사용자 파일 업로드 핸들러
  const handleUserFileUpload = async () => {
    if (selectedUserFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 사용자 파일을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUserFileUploading(true);
    setUserFileUploadProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;
      const totalFiles = selectedUserFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedUserFiles[i];
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('overwriteExisting', overwriteExisting.toString());
          formData.append('sendWelcome', sendWelcome.toString());
          formData.append('validateOnly', validateOnly.toString());

          const response = await fetch('/api/admin/users/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`사용자 파일 업로드 실패: ${file.name}`, error);
        }

        // 진행률 업데이트
        setUserFileUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (successCount > 0) {
        toast({
          title: "업로드 완료",
          description: `${successCount}개 파일이 성공적으로 처리되었습니다.${errorCount > 0 ? ` (${errorCount}개 실패)` : ''}`,
        });
        
        // Real-time refresh of both user list and user files
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/user-files'] });
        
        // Also refresh organization data if users have organization affiliations
        queryClient.invalidateQueries({ queryKey: ['/api/admin/organizations'] });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "업로드 실패",
          description: "모든 파일 업로드에 실패했습니다.",
          variant: "destructive",
        });
      }
      
      setSelectedUserFiles([]);
      setIsFileUploadDialogOpen(false);
      
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "사용자 파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsUserFileUploading(false);
      setUserFileUploadProgress(0);
    }
  };

  // 샘플 사용자 파일 다운로드 핸들러
  const handleDownloadSampleFile = () => {
    const csvContent = `username,firstName,lastName,email,userType
2024001001,김,학생,kim.student@example.com,student
2024001002,이,철수,lee.cs@example.com,student
prof001,박,교수,park.prof@example.com,faculty
admin001,최,관리자,choi.admin@example.com,faculty`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_users.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 문서 업로드 핸들러 (다중 파일 지원)
  const handleDocumentUpload = async () => {
    if (selectedDocumentFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 문서 파일을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsDocumentUploading(true);
    setDocumentUploadProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;
      const totalFiles = selectedDocumentFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedDocumentFiles[i];
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', selectedDocumentType || 'all');
          formData.append('description', '관리자 업로드 문서');

          const response = await fetch('/api/admin/documents/upload', {
            method: 'POST',
            body: formData,
          });

          const responseData = await response.json();
          console.log(`업로드 응답:`, responseData);

          if (!response.ok) {
            throw new Error(responseData.message || `Upload failed for ${file.name}`);
          }

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`파일 업로드 실패: ${file.name}`, error);
        }

        // 진행률 업데이트
        setDocumentUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (successCount > 0) {
        toast({
          title: "업로드 완료",
          description: `${successCount}개 파일이 성공적으로 업로드되었습니다.${errorCount > 0 ? ` (${errorCount}개 실패)` : ''}`,
        });
        
        // 문서 목록 새로고침
        queryClient.invalidateQueries({
          queryKey: ['/api/admin/documents']
        });
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "업로드 실패",
          description: "모든 파일 업로드에 실패했습니다.",
          variant: "destructive",
        });
      }
      
      // 성공 시에만 파일 목록과 다이얼로그 닫기
      if (successCount > 0) {
        setSelectedDocumentFiles([]);
        setIsDocumentUploadDialogOpen(false);
      }
      
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "문서 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsDocumentUploading(false);
      setDocumentUploadProgress(0);
    }
  };

  // 문서 재처리 mutation
  const documentReprocessMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await apiRequest("POST", `/api/admin/documents/${documentId}/reprocess`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "재처리 완료",
        description: "문서 텍스트가 성공적으로 재추출되었습니다.",
      });
      setIsDocumentDetailOpen(false);
    },
    onError: (error: Error) => {
      console.error('Document reprocess error:', error);
      toast({
        title: "재처리 실패",
        description: "문서 재처리에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 조직 카테고리 파일 삭제 뮤테이션
  const deleteOrgFileMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const response = await apiRequest("DELETE", `/api/admin/organization-files/${encodeURIComponent(fileName)}`);
      return response.json();
    },
    onSuccess: () => {
      refetchOrgFiles();
      toast({
        title: "파일 삭제 완료",
        description: "조직 카테고리 파일이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      console.error('조직 파일 삭제 오류:', error);
      toast({
        title: "삭제 실패",
        description: "파일 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });





  // 에이전트 수정 뮤테이션
  const updateAgentMutation = useMutation({
    mutationFn: async (data: { id: number; [key: string]: any }) => {
      const payload = {
        ...data,
        isActive: data.status === "active",
      };
      const response = await apiRequest("PUT", `/api/admin/agents/${data.id}`, payload);
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
      setIsAgentDetailDialogOpen(false);
      setSelectedAgent(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "에이전트 수정에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 아이콘 컴포넌트 가져오기 함수
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'User': return '👤';
      case 'Bot': return '🤖';
      case 'GraduationCap': return '🎓';
      case 'Book': return '📚';
      case 'School': return '🏫';
      case 'Users': return '👥';
      case 'Briefcase': return '💼';
      case 'Settings': return '⚙️';
      case 'Heart': return '❤️';
      case 'Star': return '⭐';
      default: return '👤';
    }
  };

  const openAgentDetailDialog = (agent: Agent) => {
    setSelectedAgent(agent);
    
    // 폼에 에이전트 데이터 설정
    agentForm.reset({
      name: agent.name || '',
      category: agent.category || '',
      description: agent.description || '',
      upperCategory: (agent as any).upperCategory || '',
      lowerCategory: (agent as any).lowerCategory || '',
      detailCategory: (agent as any).detailCategory || '',
      personaNickname: (agent as any).personaNickname || '',
      speechStyle: (agent as any).speechStyle || '',
      personality: (agent as any).personality || '',
      llmModel: (agent as any).llmModel || 'gpt-4o',
      chatbotType: (agent as any).chatbotType || 'doc-fallback-llm',
      visibility: (agent as any).visibility || 'public',
      isActive: agent.isActive || false,
    });
    
    // 관리자 선택 상태 초기화
    setSelectedAgentManagers([]);
    setSelectedDocumentManagers([]);
    setSelectedQaManagers([]);
    setSelectedFiles([]);
    
    // 기본 정보 탭으로 시작
    setAgentCreationTab('basic');
    setIsAgentDetailDialogOpen(true);
  };

  const openNewAgentDialog = () => {
    // 새 에이전트 생성 폼 초기화
    agentForm.reset();
    setSelectedAgentManagers([]);
    setSelectedDocumentManagers([]);
    setSelectedQaManagers([]);
    setSelectedFiles([]);
    setManagerSearchQuery('');
    setAgentCreationTab('basic');
    setIsAgentDialogOpen(true);
  };

  const openIconChangeDialog = (agent: Agent) => {
    setIconChangeAgent(agent);
    setSelectedIcon(agent.icon);
    setSelectedBgColor(agent.backgroundColor);
    setIsIconChangeDialogOpen(true);
  };

  // 에이전트 삭제 뮤테이션
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: number) => {
      const response = await fetch(`/api/admin/agents/${agentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete agent');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
      toast({
        title: "성공",
        description: "에이전트가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: error.message || "에이전트 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

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

  // 문서 삭제 뮤테이션
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/admin/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete document');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      setIsDocumentDetailOpen(false);
      toast({
        title: "삭제 완료",
        description: "문서가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message || "문서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 문서 미리보기 핸들러
  const handleDocumentPreview = async (document: any) => {
    try {
      console.log('문서 미리보기 요청:', document.id, document.name);
      
      const response = await fetch(`/api/admin/documents/${document.id}/preview`);
      if (!response.ok) {
        throw new Error(`미리보기 실패: ${response.status}`);
      }
      
      // 서버에서 HTML 응답을 받아서 새 창에 직접 표시
      const htmlContent = await response.text();
      
      const previewWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
      if (previewWindow) {
        previewWindow.document.write(htmlContent);
        previewWindow.document.close();
        
        toast({
          title: "미리보기 열림",
          description: "새 창에서 문서를 확인할 수 있습니다.",
        });
      } else {
        throw new Error('팝업 창을 열 수 없습니다. 팝업 차단을 해제해주세요.');
      }
      
    } catch (error) {
      console.error('문서 미리보기 오류:', error);
      toast({
        title: "미리보기 실패",
        description: error instanceof Error ? error.message : "문서 미리보기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 문서 다운로드 핸들러 (실제 파일 다운로드)
  const handleDocumentDownload = async (doc: any) => {
    try {
      console.log(`Starting download for document: ${doc.name} (ID: ${doc.id})`);
      
      const response = await fetch(`/api/admin/documents/${doc.id}/download`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': '*/*',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Download failed:', response.status, errorText);
        throw new Error(`다운로드 실패: ${response.status}`);
      }
      
      const contentType = response.headers.get('content-type');
      const contentLength = response.headers.get('content-length');
      console.log(`Download response: ${contentType}, ${contentLength} bytes`);
      
      const blob = await response.blob();
      console.log(`Blob created: ${blob.size} bytes, type: ${blob.type}`);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name || `문서_${doc.id}`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "다운로드 완료",
        description: `"${doc.name}"이 성공적으로 다운로드되었습니다.`,
      });
      
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "다운로드 실패", 
        description: error instanceof Error ? error.message : "문서 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 문서 삭제 핸들러
  const handleDocumentDelete = (document: any) => {
    if (window.confirm(`"${document.name}" 문서를 정말 삭제하시겠습니까?`)) {
      deleteDocumentMutation.mutate(document.id);
    }
  };

  // 사용자 파일 삭제 핸들러
  const handleUserFileDelete = async (fileId: string, fileName: string) => {
    if (!window.confirm(`"${fileName}" 파일을 정말 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/user-files/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete user file');
      }
      
      await refetchUserFiles();
      
      toast({
        title: "파일 삭제 완료",
        description: "사용자 파일이 성공적으로 삭제되었습니다.",
      });
    } catch (error) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "파일 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 master-admin-mobile">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b sticky top-0 z-50 pt-safe pt-4 sm:pt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
                <Shield className="w-6 h-6 md:w-8 md:h-8 text-blue-600" />
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">LoBo AI 챗봇 통합 관리자 센터</h1>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pt-8 md:pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="dashboard">
              <BarChart3 className="w-4 h-4 mr-2" />
              대시보드
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Database className="w-4 h-4 mr-2" />
              조직 카테고리 관리
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="agents">
              <Bot className="w-4 h-4 mr-2" />
              에이전트 관리
            </TabsTrigger>
            <TabsTrigger value="documents">
              <FileText className="w-4 h-4 mr-2" />
              문서 관리
            </TabsTrigger>
            <TabsTrigger value="conversations">
              <MessageSquare className="w-4 h-4 mr-2" />
              질문/응답 로그
            </TabsTrigger>
            <TabsTrigger value="tokens">
              <Zap className="w-4 h-4 mr-2" />
              토큰 관리
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">총 사용자</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">총 에이전트</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">총 대화</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">오늘 활동</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">시스템 상태</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">최근 활동</CardTitle>
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
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleExcelExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>다운로드</span>
                </Button>
                <Button 
                  variant="default"
                  onClick={() => setIsNewUserDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ 사용자 추가</span>
                </Button>
              </div>
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



            {/* 사용자 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <CardTitle>사용자 검색</CardTitle>
              
              {/* 조직 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>상위 카테고리</Label>
                  <Select value={selectedUniversity} onValueChange={handleUpperCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {upperCategories.map((category, index) => (
                        <SelectItem key={`upper-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>하위 카테고리</Label>
                  <Select 
                    value={selectedCollege} 
                    onValueChange={handleLowerCategoryChange}
                    disabled={selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {lowerCategories.map((category, index) => (
                        <SelectItem key={`lower-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부 카테고리</Label>
                  <Select 
                    value={selectedDepartment} 
                    onValueChange={handleDetailCategoryChange}
                    disabled={selectedCollege === 'all' || selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={selectedCollege === 'all' || selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {detailCategories.map((category, index) => (
                        <SelectItem key={`detail-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* 상태 및 시스템 역할 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>상태</Label>
                  <Select value={selectedDocumentType} onValueChange={(value) => {
                    setSelectedDocumentType(value);
                    executeSearch();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                      <SelectItem value="locked">잠금</SelectItem>
                      <SelectItem value="pending">대기</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>시스템 역할</Label>
                  <Select value={selectedDocumentPeriod} onValueChange={(value) => {
                    setSelectedDocumentPeriod(value);
                    executeSearch();
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="master_admin">마스터 관리자</SelectItem>
                      <SelectItem value="operation_admin">운영 관리자</SelectItem>
                      <SelectItem value="category_admin">카테고리 관리자</SelectItem>
                      <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                      <SelectItem value="qa_admin">QA 관리자</SelectItem>
                      <SelectItem value="doc_admin">문서 관리자</SelectItem>
                      <SelectItem value="user">일반 사용자</SelectItem>
                      <SelectItem value="external">외부 사용자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div></div>
              </div>

              {/* 사용자 검색 */}
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="사용자명 또는 이메일 주소를 입력하세요."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                    />
                  </div>
                  <Button onClick={executeSearch}>검색</Button>
                </div>
              </div>
              
              {/* 검색 결과 표시 - 숨김 처리됨 */}
            </div>

            {/* 사용자 목록 테이블 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">사용자 목록</CardTitle>
                {hasSearched && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    전체 {filteredUsers.length}명 사용자 중 {((userCurrentPage - 1) * usersPerPage) + 1}-{Math.min(userCurrentPage * usersPerPage, filteredUsers.length)}개 표시
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          사용자
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소속 조직
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          직책/역할
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          이메일
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          수정
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers?.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
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
                        paginatedUsers?.map((user) => (
                          <tr 
                            key={user.id} 
                            className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150 ${
                              !user.isActive ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : ''
                            }`}
                            onClick={() => {
                              openUserDetailDialog(user);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mr-3">
                                  <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {(user as any).name || 
                                     `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                                     user.username}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    <span>{user.username}</span>
                                    {user.email && (
                                      <span className="ml-2 text-blue-600">✓</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <div>
                                <div className="font-medium">{(user as any).upperCategory || '미분류'}</div>
                                <div className="text-xs text-gray-400">
                                  {(user as any).lowerCategory || '미분류'} / {(user as any).detailCategory || '미분류'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {(user as any).position || '일반 구성원'}
                                </div>
                                <div className="text-xs text-blue-600 dark:text-blue-400">
                                  {user.role === 'master_admin' ? '마스터 관리자' :
                                   user.role === 'operation_admin' ? '운영 관리자' :
                                   user.role === 'category_admin' ? '카테고리 관리자' :
                                   user.role === 'agent_admin' ? '에이전트 관리자' :
                                   user.role === 'qa_admin' ? 'QA 관리자' :
                                   user.role === 'doc_admin' ? '문서 관리자' :
                                   user.role === 'external' ? '외부 사용자' : '일반 사용자'}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                              <div className="max-w-48 truncate">
                                {user.email || `${user.username}@university.ac.kr`}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <Badge 
                                variant={
                                  (user as any).status === 'active' ? 'default' :
                                  (user as any).status === 'inactive' ? 'secondary' :
                                  (user as any).status === 'locked' ? 'destructive' :
                                  (user as any).status === 'pending' ? 'outline' : 'secondary'
                                }
                                className={
                                  (user as any).status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                                  (user as any).status === 'inactive' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                                  (user as any).status === 'locked' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                                  (user as any).status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {(user as any).status === 'active' ? '활성' :
                                 (user as any).status === 'inactive' ? '비활성' :
                                 (user as any).status === 'locked' ? '잠금' :
                                 (user as any).status === 'pending' ? '대기' : '활성'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex justify-center">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openUserDetailDialog(user);
                                  }}
                                  className="hover:bg-blue-50 hover:text-blue-600"
                                  title="사용자 정보 수정"
                                >
                                  <Edit className="w-4 h-4" />
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

            {/* 페이지네이션 */}
            {hasSearched && totalUserPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300" style={{ display: 'none' }}>
                  총 {filteredUsers.length}명의 사용자 중 {((userCurrentPage - 1) * usersPerPage) + 1}-{Math.min(userCurrentPage * usersPerPage, filteredUsers.length)}명 표시
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={userCurrentPage === 1}
                  >
                    이전
                  </Button>
                  
                  <div className="flex items-center space-x-1">
                    {/* 첫 페이지 */}
                    {userCurrentPage > 3 && (
                      <>
                        <Button
                          variant={1 === userCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUserCurrentPage(1)}
                        >
                          1
                        </Button>
                        {userCurrentPage > 4 && <span className="px-2">...</span>}
                      </>
                    )}
                    
                    {/* 현재 페이지 주변 페이지들 */}
                    {Array.from({ length: Math.min(5, totalUserPages) }, (_, i) => {
                      const page = Math.max(1, Math.min(userCurrentPage - 2 + i, totalUserPages));
                      if (page < Math.max(1, userCurrentPage - 2) || page > Math.min(userCurrentPage + 2, totalUserPages)) return null;
                      return (
                        <Button
                          key={page}
                          variant={page === userCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUserCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      );
                    })}
                    
                    {/* 마지막 페이지 */}
                    {userCurrentPage < totalUserPages - 2 && (
                      <>
                        {userCurrentPage < totalUserPages - 3 && <span className="px-2">...</span>}
                        <Button
                          variant={totalUserPages === userCurrentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() => setUserCurrentPage(totalUserPages)}
                        >
                          {totalUserPages}
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserCurrentPage(prev => Math.min(prev + 1, totalUserPages))}
                    disabled={userCurrentPage === totalUserPages}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 에이전트 관리 */}
          <TabsContent value="agents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-semibold tracking-tight">에이전트 관리</CardTitle>
                </div>
                <div className="flex gap-3 mt-4">
                  <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        에이전트 수동 추가
                      </Button>
                    </DialogTrigger>
                  </Dialog>
                  <AgentFileUploadModal 
                    isOpen={isAgentFileUploadModalOpen}
                    onClose={() => setIsAgentFileUploadModalOpen(false)}
                    onSuccess={() => {
                      setIsAgentFileUploadModalOpen(false);
                      queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
                    }}
                  />
                  <Button 
                    onClick={() => setIsAgentFileUploadModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 업로드
                  </Button>
                  <div className="text-sm text-gray-600 ml-2 flex items-center">
                    Excel 또는 CSV 파일로 에이전트를 일괄 업로드할 수 있습니다
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* 에이전트 검색 및 관리 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">에이전트 검색 및 관리</h3>
                  
                  {/* 검색 및 필터 영역 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Input
                      placeholder="에이전트 이름 검색..."
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                    <Select value={agentFilterType} onValueChange={setAgentFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder="유형" />
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
                    <Select value={agentFilterStatus} onValueChange={setAgentFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="상태" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="active">활성</SelectItem>
                        <SelectItem value="inactive">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={agentFilterManager} onValueChange={setAgentFilterManager}>
                      <SelectTrigger>
                        <SelectValue placeholder="관리자" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {managers?.map((manager: any) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.fullName || manager.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 결과 및 테이블 */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-600">
                        검색 결과: {filteredAgents?.length || 0}개의 에이전트
                      </p>
                    </div>
                    
                    {/* 에이전트 테이블 */}
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>이름</TableHead>
                            <TableHead>유형</TableHead>
                            <TableHead>관리자</TableHead>
                            <TableHead>상태</TableHead>
                            <TableHead>문서 수</TableHead>
                            <TableHead>사용자 수</TableHead>
                            <TableHead>마지막 사용</TableHead>
                            <TableHead>작업</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAgents?.map((agent: any) => (
                            <TableRow 
                              key={agent.id}
                              className="hover:bg-gray-50 cursor-pointer"
                              onClick={() => handleAgentRowClick(agent)}
                            >
                              <TableCell>
                                <div className="flex items-center space-x-3">
                                  <div 
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${agent.backgroundColor ? `bg-${agent.backgroundColor}` : 'bg-blue-500'}`}
                                  >
                                    {agent.isCustomIcon && agent.icon ? (
                                      <img 
                                        src={agent.icon} 
                                        alt="Custom Icon" 
                                        className="w-6 h-6 rounded-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                          e.currentTarget.nextElementSibling.style.display = 'block';
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs">AI</span>
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">{agent.name}</div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                      {agent.description}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{agent.category}</Badge>
                              </TableCell>
                              <TableCell>
                                {agent.managerName || '미지정'}
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={agent.isActive ? "default" : "secondary"}
                                  className={agent.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                                >
                                  {agent.isActive ? '활성' : '비활성'}
                                </Badge>
                              </TableCell>
                              <TableCell>{agent.documentCount || 0}</TableCell>
                              <TableCell>{agent.userCount || 0}</TableCell>
                              <TableCell>
                                {agent.lastUsed ? new Date(agent.lastUsed).toLocaleDateString('ko-KR') : '사용 없음'}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditAgent(agent);
                                    }}
                                  >
                                    편집
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAgent(agent.id);
                                    }}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    삭제
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 에이전트 생성 모달 */}
            <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
              <DialogContent className="max-w-4xl h-[80vh] max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>새 에이전트 생성</DialogTitle>
                  </DialogHeader>
                  
                  {/* 탭 네비게이션 */}
                  <Tabs value={agentCreationTab} onValueChange={(value) => setAgentCreationTab(value as AgentCreationTab)} className="w-full">
                    <TabsList className="grid w-full grid-cols-6 mb-6">
                      <TabsTrigger value="basic" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        기본 정보
                      </TabsTrigger>
                      <TabsTrigger value="persona" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        페르소나
                      </TabsTrigger>
                      <TabsTrigger value="model" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        모델 설정
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        파일 업로드
                      </TabsTrigger>
                      <TabsTrigger value="managers" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        관리자 선정
                      </TabsTrigger>
                      <TabsTrigger value="sharing" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        공유 설정
                      </TabsTrigger>
                    </TabsList>

                    <Form {...agentForm}>
                      <form onSubmit={agentForm.handleSubmit((data) => createAgentMutation.mutate(data))} className="space-y-6">
                        
                        {/* 기본 정보 탭 */}
                        <TabsContent value="basic" className="space-y-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">에이전트 이름 *</FormLabel>
                                    <FormControl>
                                      <Input 
                                        placeholder="최대 20자" 
                                        maxLength={20} 
                                        className="focus:ring-2 focus:ring-blue-500"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <div className="text-xs text-gray-500">{field.value?.length || 0}/20자</div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">에이전트 유형 *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                          <SelectValue placeholder="유형 선택" />
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
                            
                            {/* 소속 조직 선택 (순차적) */}
                            <div className="space-y-4">
                              <Label className="text-sm font-medium text-gray-700">소속 *</Label>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                  control={agentForm.control}
                                  name="upperCategory"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-gray-600">상위 조직</FormLabel>
                                      <Select 
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          agentForm.setValue('lowerCategory', '');
                                          agentForm.setValue('detailCategory', '');
                                        }} 
                                        defaultValue={field.value}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                            <SelectValue placeholder="상위 조직 선택" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getUpperCategories().map((category, index) => (
                                            <SelectItem key={category} value={category}>
                                              {category}
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
                                  name="lowerCategory"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-gray-600">하위 조직</FormLabel>
                                      <Select 
                                        onValueChange={(value) => {
                                          field.onChange(value);
                                          agentForm.setValue('detailCategory', '');
                                        }} 
                                        defaultValue={field.value}
                                        disabled={!agentForm.watch('upperCategory')}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                            <SelectValue placeholder="하위 조직 선택" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getLowerCategories(agentForm.watch('upperCategory') || '').map((category, index) => (
                                            <SelectItem key={category} value={category}>
                                              {category}
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
                                  name="detailCategory"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs text-gray-600">세부 조직 (선택)</FormLabel>
                                      <Select 
                                        onValueChange={field.onChange} 
                                        defaultValue={field.value}
                                        disabled={!agentForm.watch('upperCategory') || !agentForm.watch('lowerCategory')}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                            <SelectValue placeholder="세부 조직 선택" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {getDetailCategories(agentForm.watch('upperCategory') || '', agentForm.watch('lowerCategory') || '').map((category, index) => (
                                            <SelectItem key={category} value={category}>
                                              {category}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <FormField
                              control={agentForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">에이전트 설명</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="에이전트의 역할과 기능을 설명해주세요 (최대 200자)" 
                                      maxLength={200}
                                      className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <div className="text-xs text-gray-500">{field.value?.length || 0}/200자</div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={agentForm.control}
                              name="personality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">역할/프롬프트</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder="예: 대학원 논문 첨삭 도우미, 학과 정보 안내 봇"
                                      className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </TabsContent>

                        {/* 페르소나 탭 */}
                        <TabsContent value="persona" className="space-y-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="personaNickname"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">닉네임</FormLabel>
                                    <FormControl>
                                      <Input placeholder="예: 민지, 교수님 어시스턴트" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="speechStyle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">말투 스타일</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 공손하고 친절한 말투로 대화합니다"
                                        className="min-h-[60px] focus:ring-2 focus:ring-blue-500"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="expertiseArea"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">지식/전문 분야</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 컴퓨터공학, 프로그래밍, 학사업무, 입학상담 등"
                                        className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="personality"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">성격특성</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 친절하고 도움이 되는 성격, 논리적 사고, 인내심 있음"
                                        className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="forbiddenResponseStyle"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">금칙어 반응 방식</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 죄송하지만 해당 질문에 대해서는 답변드릴 수 없습니다. 다른 주제로 대화해주세요."
                                        className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                        {...field} 
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        {/* 모델 설정 탭 */}
                        <TabsContent value="model" className="space-y-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="llmModel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">사용 LLM 모델</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "gpt-4o"}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="chatbotType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">응답 방식</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "doc-fallback-llm"}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="doc-fallback-llm">문서 우선 + LLM</SelectItem>
                                        <SelectItem value="general-llm">LLM 우선</SelectItem>
                                        <SelectItem value="strict-doc">문서 only</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="maxInputLength"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">최대 입력 글자 수</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="2048" 
                                        defaultValue={2048}
                                        {...field} 
                                        onChange={e => field.onChange(parseInt(e.target.value) || 2048)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={agentForm.control}
                                name="maxOutputLength"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">최대 응답 글자 수</FormLabel>
                                    <FormControl>
                                      <Input 
                                        type="number" 
                                        placeholder="1024" 
                                        defaultValue={1024}
                                        {...field} 
                                        onChange={e => field.onChange(parseInt(e.target.value) || 1024)}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </TabsContent>

                        {/* 파일 업로드 탭 */}
                        <TabsContent value="upload" className="space-y-6">
                          <div className="space-y-4">
                            {/* 숨겨진 파일 입력 */}
                            <input
                              ref={agentFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
                              multiple
                              onChange={handleAgentFileInputChange}
                              style={{ display: 'none' }}
                            />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="documentType"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">문서 유형</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "manual"}>
                                      <FormControl>
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="manual">매뉴얼/가이드</SelectItem>
                                        <SelectItem value="faq">FAQ/질답</SelectItem>
                                        <SelectItem value="policy">정책/규정</SelectItem>
                                        <SelectItem value="procedure">절차/프로세스</SelectItem>
                                        <SelectItem value="reference">참고자료</SelectItem>
                                        <SelectItem value="course">강의자료</SelectItem>
                                        <SelectItem value="research">연구자료</SelectItem>
                                        <SelectItem value="other">기타</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            {/* 드래그 앤 드롭 영역 */}
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={handleAgentFileSelect}
                            >
                              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <div className="space-y-2">
                                <p className="text-lg font-medium text-gray-700">파일을 여기로 드래그하거나 클릭해서 업로드하세요</p>
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  size="lg" 
                                  className="bg-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAgentFileSelect();
                                  }}
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  파일 선택
                                </Button>
                              </div>
                              <div className="mt-4 text-sm text-gray-500">
                                <p>지원 형식: PDF, DOC, DOCX, TXT, PPT, PPTX</p>
                                <p>최대 크기: 50MB</p>
                              </div>
                            </div>
                            
                            {/* 업로드된 파일 목록 */}
                            <div className="space-y-2">
                              <Label className="text-sm font-medium text-gray-700">선택된 파일</Label>
                              <div className="border rounded-lg p-3 bg-white min-h-[100px]">
                                {selectedFiles.length === 0 ? (
                                  <div className="text-center text-sm text-gray-500 py-4">
                                    아직 선택된 파일이 없습니다
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {selectedFiles.map((file, index) => (
                                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                        <div className="flex items-center space-x-2">
                                          <FileText className="w-4 h-4 text-blue-500" />
                                          <span className="text-sm font-medium">{file.name}</span>
                                          <span className="text-xs text-gray-500">
                                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                          </span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                          }}
                                        >
                                          <X className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </TabsContent>

                        {/* 관리자 선정 탭 */}
                        <TabsContent value="managers" className="space-y-4">
                          <div className="space-y-4">
                            {/* 간단한 설명 */}
                            <div className="text-sm text-gray-600 px-1">
                              각 역할별로 최대 3명까지 공동 관리자를 선정할 수 있습니다. 한 사용자가 여러 역할을 동시에 수행할 수 있습니다.
                            </div>

                            {/* 선정된 관리자 영역 - 상단으로 이동 */}
                            <Tabs value={currentManagerTab} onValueChange={(value) => handleManagerTabChange(value as 'agent' | 'document' | 'qa')} className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="agent" className="relative">
                                  에이전트 관리자
                                  {selectedAgentManagers.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {selectedAgentManagers.length}
                                    </span>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="document" className="relative">
                                  문서 관리자
                                  {selectedDocumentManagers.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {selectedDocumentManagers.length}
                                    </span>
                                  )}
                                </TabsTrigger>
                                <TabsTrigger value="qa" className="relative">
                                  QA 관리자
                                  {selectedQaManagers.length > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-purple-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                      {selectedQaManagers.length}
                                    </span>
                                  )}
                                </TabsTrigger>
                              </TabsList>

                              {/* 에이전트 관리자 */}
                              <TabsContent value="agent" className="space-y-3">
                                <div className="min-h-[80px] p-3 border-2 border-dashed border-blue-200 rounded-lg bg-blue-50/30">
                                  {selectedAgentManagers.length === 0 ? (
                                    <div className="flex items-center justify-center h-12">
                                      <p className="text-sm text-gray-500">하단 검색 결과에서 사용자를 클릭하여 선정하세요</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {selectedAgentManagers.map((manager, index) => (
                                        <div key={index} className="inline-flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg border border-blue-200">
                                          <span className="font-medium">{(manager as any).name || manager.id}</span>
                                          <span className="ml-1 text-blue-600">({manager.id})</span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedAgentManagers(prev => prev.filter((_, i) => i !== index))}
                                            className="ml-2 text-blue-600 hover:text-blue-800 hover:bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              {/* 문서 관리자 */}
                              <TabsContent value="document" className="space-y-3">
                                <div className="min-h-[80px] p-3 border-2 border-dashed border-green-200 rounded-lg bg-green-50/30">
                                  {selectedDocumentManagers.length === 0 ? (
                                    <div className="flex items-center justify-center h-12">
                                      <p className="text-sm text-gray-500">하단 검색 결과에서 사용자를 클릭하여 선정하세요</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {selectedDocumentManagers.map((manager, index) => (
                                        <div key={index} className="inline-flex items-center bg-green-100 text-green-800 px-3 py-2 rounded-lg border border-green-200">
                                          <span className="font-medium">{(manager as any).name || manager.id}</span>
                                          <span className="ml-1 text-green-600">({manager.id})</span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedDocumentManagers(prev => prev.filter((_, i) => i !== index))}
                                            className="ml-2 text-green-600 hover:text-green-800 hover:bg-green-200 rounded-full w-5 h-5 flex items-center justify-center"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TabsContent>

                              {/* QA 관리자 */}
                              <TabsContent value="qa" className="space-y-3">
                                <div className="min-h-[80px] p-3 border-2 border-dashed border-purple-200 rounded-lg bg-purple-50/30">
                                  {selectedQaManagers.length === 0 ? (
                                    <div className="flex items-center justify-center h-12">
                                      <p className="text-sm text-gray-500">하단 검색 결과에서 사용자를 클릭하여 선정하세요</p>
                                    </div>
                                  ) : (
                                    <div className="flex flex-wrap gap-2">
                                      {selectedQaManagers.map((manager, index) => (
                                        <div key={index} className="inline-flex items-center bg-purple-100 text-purple-800 px-3 py-2 rounded-lg border border-purple-200">
                                          <span className="font-medium">{(manager as any).name || manager.id}</span>
                                          <span className="ml-1 text-purple-600">({manager.id})</span>
                                          <button
                                            type="button"
                                            onClick={() => setSelectedQaManagers(prev => prev.filter((_, i) => i !== index))}
                                            className="ml-2 text-purple-600 hover:text-purple-800 hover:bg-purple-200 rounded-full w-5 h-5 flex items-center justify-center"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </TabsContent>
                            </Tabs>

                            {/* 검색 시스템 - 하단으로 이동 */}
                            <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                              <div className="p-4 space-y-4">
                                <h4 className="text-base font-medium text-gray-900">사용자 검색</h4>
                                
                                {/* 검색 입력창 */}
                                <div className="relative">
                                  <Input
                                    type="text"
                                    placeholder="이름 또는 사용자 ID로 검색..."
                                    value={managerSearchQuery}
                                    onChange={(e) => setManagerSearchQuery(e.target.value)}
                                    className="h-9 text-sm"
                                  />
                                </div>

                                {/* 조직 필터 */}
                                <div className="grid grid-cols-3 gap-2">
                                  <Select value={managerFilterUpperCategory} onValueChange={(value) => {
                                    setManagerFilterUpperCategory(value);
                                    setManagerFilterLowerCategory('all');
                                    setManagerFilterDetailCategory('all');
                                    setManagerCurrentPage(1);
                                  }}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="상위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getUpperCategories().map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select value={managerFilterLowerCategory} onValueChange={(value) => {
                                    setManagerFilterLowerCategory(value);
                                    setManagerFilterDetailCategory('all');
                                    setManagerCurrentPage(1);
                                  }} disabled={managerFilterUpperCategory === 'all'}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="하위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getLowerCategories(managerFilterUpperCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Select value={managerFilterDetailCategory} onValueChange={(value) => {
                                    setManagerFilterDetailCategory(value);
                                    setManagerCurrentPage(1);
                                  }} disabled={managerFilterLowerCategory === 'all'}>
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="세부 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getDetailCategories(managerFilterUpperCategory, managerFilterLowerCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                {/* 검색 결과 사용자 목록 */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-sm font-medium text-gray-900">사용자 목록</h5>
                                    <span className="text-xs text-gray-500">{filteredManagerUsers.length}명</span>
                                  </div>
                                  
                                  {filteredManagerUsers.length === 0 ? (
                                    <div className="p-6 text-center border border-gray-200 rounded-lg">
                                      <p className="text-sm text-gray-500">검색 조건에 맞는 사용자가 없습니다</p>
                                    </div>
                                  ) : (
                                    <>
                                      {/* 사용자 목록 */}
                                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {paginatedManagerUsers.map((user) => (
                                          <div 
                                            key={user.id} 
                                            className="p-3 hover:bg-gray-50 transition-colors flex items-center space-x-3"
                                          >
                                            <input
                                              type="checkbox"
                                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  handleUserSelect(user, currentManagerTab);
                                                } else {
                                                  // 체크해제 시 현재 탭에 해당하는 선택에서 제거
                                                  if (currentManagerTab === 'agent') {
                                                    setSelectedAgentManagers(prev => 
                                                      prev.filter(m => m.id !== user.id)
                                                    );
                                                  } else if (currentManagerTab === 'document') {
                                                    setSelectedDocumentManagers(prev => 
                                                      prev.filter(m => m.id !== user.id)
                                                    );
                                                  } else if (currentManagerTab === 'qa') {
                                                    setSelectedQaManagers(prev => 
                                                      prev.filter(m => m.id !== user.id)
                                                    );
                                                  }
                                                }
                                              }}
                                              checked={
                                                currentManagerTab === 'agent' 
                                                  ? selectedAgentManagers.some(m => m.id === user.id)
                                                  : currentManagerTab === 'document'
                                                  ? selectedDocumentManagers.some(m => m.id === user.id)
                                                  : selectedQaManagers.some(m => m.id === user.id)
                                              }
                                            />
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center space-x-2">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                  {(user as any).name || user.id}
                                                </p>
                                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                  {user.role}
                                                </span>
                                              </div>
                                              {user.email && (
                                                <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* 페이지네이션 */}
                                      {totalManagerPages > 1 && (
                                        <div className="flex items-center justify-between">
                                          <div className="text-xs text-gray-500">
                                            페이지 {managerCurrentPage} / {totalManagerPages}
                                          </div>
                                          <div className="flex items-center space-x-1">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setManagerCurrentPage(Math.max(1, managerCurrentPage - 1))}
                                              disabled={managerCurrentPage <= 1}
                                              className="h-7 px-2 text-xs"
                                            >
                                              이전
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => setManagerCurrentPage(Math.min(totalManagerPages, managerCurrentPage + 1))}
                                              disabled={managerCurrentPage >= totalManagerPages}
                                              className="h-7 px-2 text-xs"
                                            >
                                              다음
                                            </Button>
                                          </div>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>


                          </div>
                        </TabsContent>

                        {/* 공유 설정 탭 */}
                        <TabsContent value="sharing" className="space-y-6">
                          <div className="space-y-4">
                            <div className="w-full">
                              <FormField
                                control={agentForm.control}
                                name="visibility"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">공유 모드</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "organization"}>
                                      <FormControl>
                                        <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="organization">조직 전체 - 소속 조직의 모든 구성원이 사용 가능</SelectItem>
                                        <SelectItem value="group">그룹 지정 - 특정 그룹만 사용 가능</SelectItem>
                                        <SelectItem value="custom">사용자 지정 - 개별 사용자 선택</SelectItem>
                                        <SelectItem value="private">프라이빗 - 관리자만 사용 가능</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            {/* 그룹 지정 옵션 - 완전 새로운 구조 */}
                            {agentForm.watch('visibility') === 'group' && (
                              <div className="space-y-4 mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <Label className="text-sm font-medium">조직 그룹 지정</Label>
                                
                                {/* 단일 3단계 드롭다운 세트 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <Select value={selectedUpperCategory} onValueChange={(value) => {
                                    setSelectedUpperCategory(value);
                                    setSelectedLowerCategory('');
                                    setSelectedDetailCategory('');
                                  }}>
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="상위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {getUpperCategories().map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select 
                                    value={selectedLowerCategory} 
                                    onValueChange={(value) => {
                                      setSelectedLowerCategory(value);
                                      setSelectedDetailCategory('');
                                    }}
                                    disabled={!selectedUpperCategory}
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="하위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">선택 안함</SelectItem>
                                      {getLowerCategories(selectedUpperCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select 
                                    value={selectedDetailCategory} 
                                    onValueChange={setSelectedDetailCategory}
                                    disabled={!selectedLowerCategory}
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="세부 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">선택 안함</SelectItem>
                                      {getDetailCategories(selectedUpperCategory, selectedLowerCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* 그룹 추가 버튼 - 조건부 활성화 */}
                                <div className="flex justify-between items-center">
                                  <Button 
                                    type="button"
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => {
                                      if (selectedUpperCategory && selectedGroups.length < 10) {
                                        const newGroup = {
                                          id: `group-${Date.now()}`,
                                          upperCategory: selectedUpperCategory,
                                          lowerCategory: selectedLowerCategory || undefined,
                                          detailCategory: selectedDetailCategory || undefined
                                        };
                                        setSelectedGroups([...selectedGroups, newGroup]);
                                        // 입력 필드 초기화
                                        setSelectedUpperCategory('');
                                        setSelectedLowerCategory('');
                                        setSelectedDetailCategory('');
                                      }
                                    }}
                                    disabled={!selectedUpperCategory || selectedGroups.length >= 10}
                                  >
                                    + 그룹 추가
                                  </Button>
                                  
                                  <div className="text-xs text-blue-600">
                                    {selectedGroups.length}/10개 그룹
                                  </div>
                                </div>
                                
                                {/* 추가된 그룹 목록 */}
                                {selectedGroups.length > 0 && (
                                  <div className="space-y-2">
                                    <Label className="text-xs font-medium">추가된 그룹:</Label>
                                    <div className="max-h-32 overflow-y-auto space-y-1">
                                      {selectedGroups.map((group, index) => (
                                        <div key={group.id} className="flex items-center justify-between bg-white p-2 rounded border text-xs">
                                          <span>
                                            {[group.upperCategory, group.lowerCategory, group.detailCategory].filter(Boolean).join(' > ')}
                                          </span>
                                          <Button 
                                            type="button"
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => {
                                              setSelectedGroups(selectedGroups.filter((_, i) => i !== index));
                                            }}
                                            className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                          >
                                            ×
                                          </Button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* 사용자 지정 옵션 */}
                            {agentForm.watch('visibility') === 'custom' && (
                              <div className="space-y-4 mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                <Label className="text-sm font-medium">사용자 검색 및 선택</Label>
                                
                                {/* 사용자 검색 입력창 */}
                                <Input 
                                  placeholder="사용자 이름, ID, 이메일로 검색..." 
                                  value={userFilterSearchQuery}
                                  onChange={(e) => setUserFilterSearchQuery(e.target.value)}
                                  className="focus:ring-2 focus:ring-green-500"
                                />
                                
                                {/* 조직별 필터 */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <Select value={userFilterUpperCategory} onValueChange={setUserFilterUpperCategory}>
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="상위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getUpperCategories().map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select value={userFilterLowerCategory} onValueChange={setUserFilterLowerCategory} disabled={!userFilterUpperCategory}>
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="하위 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getLowerCategories(userFilterUpperCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  <Select value={userFilterDetailCategory} onValueChange={setUserFilterDetailCategory} disabled={!userFilterLowerCategory}>
                                    <SelectTrigger className="text-xs">
                                      <SelectValue placeholder="세부 조직" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">전체</SelectItem>
                                      {getDetailCategories(userFilterUpperCategory, userFilterLowerCategory).map((cat) => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                
                                {/* 사용자 목록 테이블 */}
                                <div className="max-h-64 overflow-y-auto border rounded bg-white">
                                  <table className="w-full text-xs">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-2 py-2 text-left">선택</th>
                                        <th className="px-2 py-2 text-left">이름</th>
                                        <th className="px-2 py-2 text-left">ID</th>
                                        <th className="px-2 py-2 text-left">이메일</th>
                                        <th className="px-2 py-2 text-left">소속</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {/* 필터링된 사용자 목록 표시 */}
                                      {users?.filter(user => {
                                        const matchesSearch = !userFilterSearchQuery || 
                                          (user as any).name?.toLowerCase().includes(userFilterSearchQuery.toLowerCase()) ||
                                          user.id?.toLowerCase().includes(userFilterSearchQuery.toLowerCase()) ||
                                          user.email?.toLowerCase().includes(userFilterSearchQuery.toLowerCase());
                                        
                                        const matchesUpper = !userFilterUpperCategory || userFilterUpperCategory === "all" || (user as any).upperCategory === userFilterUpperCategory;
                                        const matchesLower = !userFilterLowerCategory || userFilterLowerCategory === "all" || (user as any).lowerCategory === userFilterLowerCategory;
                                        const matchesDetail = !userFilterDetailCategory || userFilterDetailCategory === "all" || (user as any).detailCategory === userFilterDetailCategory;
                                        
                                        return matchesSearch && matchesUpper && matchesLower && matchesDetail;
                                      }).slice(0, 50).map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                          <td className="px-2 py-2">
                                            <input 
                                              type="checkbox" 
                                              checked={selectedUsers.includes(user.id)}
                                              onChange={(e) => {
                                                if (e.target.checked) {
                                                  setSelectedUsers([...selectedUsers, user.id]);
                                                } else {
                                                  setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                                }
                                              }}
                                              className="rounded"
                                            />
                                          </td>
                                          <td className="px-2 py-2">{(user as any).name}</td>
                                          <td className="px-2 py-2">{user.id}</td>
                                          <td className="px-2 py-2">{user.email}</td>
                                          <td className="px-2 py-2">
                                            {[(user as any).upperCategory, (user as any).lowerCategory, (user as any).detailCategory].filter(Boolean).join(' > ')}
                                          </td>
                                        </tr>
                                      )) || []}
                                      {(!users || users.length === 0) && (
                                        <tr>
                                          <td colSpan={5} className="px-2 py-4 text-center text-gray-500">
                                            사용자가 없습니다
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                
                                {/* 선택된 사용자 수 표시 */}
                                <div className="text-sm text-gray-600">
                                  선택된 사용자: {selectedUsers.length}명
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                      </form>
                    </Form>

                    {/* 하단 버튼 */}
                    <div className="flex justify-between pt-6 border-t">
                      <div className="flex space-x-2">
                        {agentCreationTab !== 'basic' && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              const tabs = ['basic', 'persona', 'model', 'upload', 'sharing'];
                              const currentIndex = tabs.indexOf(agentCreationTab);
                              if (currentIndex > 0) {
                                setAgentCreationTab(tabs[currentIndex - 1] as any);
                              }
                            }}
                          >
                            ← 이전
                          </Button>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            // 폼 상태 초기화
                            agentForm.reset();
                            setSelectedAgentManagers([]);
                            setSelectedDocumentManagers([]);
                            setSelectedQaManagers([]);
                            setSelectedFiles([]);
                            setManagerSearchQuery('');
                            setAgentCreationTab('basic');
                            setIsAgentDialogOpen(false);
                          }}
                        >
                          취소
                        </Button>
                        {agentCreationTab !== 'sharing' ? (
                          <Button 
                            type="button" 
                            onClick={() => {
                              const tabs = ['basic', 'persona', 'model', 'upload', 'sharing'];
                              const currentIndex = tabs.indexOf(agentCreationTab);
                              if (currentIndex < tabs.length - 1) {
                                setAgentCreationTab(tabs[currentIndex + 1] as any);
                              }
                            }}
                            disabled={agentCreationTab === 'basic' && (!agentForm.watch('name') || !agentForm.watch('category') || !agentForm.watch('upperCategory'))}
                          >
                            다음 →
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => {
                              // 직접 에이전트 생성 함수 호출
                              const formData = agentForm.getValues();
                              createAgentMutation.mutate(formData);
                            }}
                            disabled={createAgentMutation.isPending}
                          >
                            {createAgentMutation.isPending ? "생성 중..." : "에이전트 생성"}
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </DialogContent>
              </Dialog>
            </div>

            {/* 에이전트 관리 섹션 */}
            <Card>
              <CardHeader>
                
                {/* 상단 버튼 섹션 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <Button
                    onClick={() => setIsAgentDialogOpen(true)}
                    className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 h-16 flex items-center justify-center rounded-xl"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    에이전트 수동 추가
                  </Button>
                  
                  <Button
                    onClick={() => setIsAgentFileUploadModalOpen(true)}
                    className="bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 h-16 flex items-center justify-center rounded-xl"
                  >
                    <FileText className="w-5 h-5 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">파일 업로드</div>
                      <div className="text-xs opacity-75">CSV/Excel 파일을 업로드하여 다수의 사용자를 일괄 등록합니다.</div>
                    </div>
                  </Button>
                </div>
                
                <div className="mt-6 pt-[-19px] pb-[-19px]">
                  <h3 className="text-lg font-medium mb-4">에이전트 검색 및 관리</h3>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 필터 행 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">상위 카테고리</Label>
                    <Select value={agentFilterUpperCategory} onValueChange={(value) => {
                      setAgentFilterUpperCategory(value);
                      setAgentFilterLowerCategory('all');
                      setAgentFilterDetailCategory('all');
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {uniqueUpperCategories.map((category, index) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">하위 카테고리</Label>
                    <Select 
                      value={agentFilterLowerCategory} 
                      onValueChange={(value) => {
                        setAgentFilterLowerCategory(value);
                        setAgentFilterDetailCategory('all');
                        setHasAgentSearched(true);
                      }}
                      disabled={agentFilterUpperCategory === 'all'}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {getLowerCategories(agentFilterUpperCategory).map((category, index) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">세부 카테고리</Label>
                    <Select 
                      value={agentFilterDetailCategory} 
                      onValueChange={(value) => {
                        setAgentFilterDetailCategory(value);
                        setHasAgentSearched(true);
                      }}
                      disabled={agentFilterLowerCategory === 'all' || agentFilterUpperCategory === 'all'}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {getDetailCategories(agentFilterUpperCategory, agentFilterLowerCategory).map((category, index) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Button 
                      variant="outline" 
                      className="w-full h-10 mt-6"
                      onClick={resetAgentFilters}
                    >
                      필터 초기화
                    </Button>
                  </div>
                </div>
                
                {/* 유형 및 상태 필터 행 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label className="text-sm font-medium">유형</Label>
                    <Select value={agentFilterType} onValueChange={(value) => {
                      setAgentFilterType(value);
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
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
                    <Label className="text-sm font-medium">상태</Label>
                    <Select value={agentFilterStatus} onValueChange={(value) => {
                      setAgentFilterStatus(value);
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="active">활성</SelectItem>
                        <SelectItem value="inactive">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 검색 행 */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder="에이전트명 또는 설명 키워드를 입력하세요"
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAgentSearch()}
                      className="h-10"
                    />
                  </div>
                  <Button 
                    onClick={handleAgentSearch}
                    className="h-10 px-6"
                  >
                    검색
                  </Button>
                </div>
                
                {/* 검색 결과 표시 */}
                {hasAgentSearched && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    검색 결과: {sortedAgents?.length || 0}개 에이전트
                    {agentSearchQuery && ` (검색어: "${agentSearchQuery}")`}
                  </div>
                )}

              </CardContent>
            </Card>

            

            {/* 에이전트 목록 */}
            {hasAgentSearched ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-semibold tracking-tight text-[20px]">에이전트 목록</CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    전체 {sortedAgents?.length || 0}개 에이전트 표시
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            에이전트명
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            유형
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            관리자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            소속
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            문서
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            사용자
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            수정
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {(!sortedAgents || sortedAgents.length === 0) ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center">
                              <div className="text-gray-500 dark:text-gray-400">
                                <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">검색 결과 없음</p>
                                <p className="text-sm">
                                  검색 조건에 맞는 에이전트가 없습니다. 다른 조건으로 검색해보세요.
                                </p>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          sortedAgents.map((agent) => (
                            <tr 
                              key={agent.id} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                                !agent.isActive ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : ''
                              }`}
                              onClick={() => openAgentDetailDialog(agent)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div 
                                    className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-gray-200 flex items-center justify-center"
                                    style={{ backgroundColor: agent.backgroundColor || '#6B7280' }}
                                  >
                                    {(agent as any).isCustomIcon && (agent as any).icon?.startsWith('/uploads/') ? (
                                      <img 
                                        key={`custom-icon-${agent.id}-${(agent as any).icon}`}
                                        src={`${(agent as any).icon}?t=${Date.now()}`} 
                                        alt={`${agent.name} 커스텀 아이콘`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          console.log(`Failed to load custom icon: ${(agent as any).icon}`);
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const nextElement = target.nextElementSibling as HTMLElement;
                                          if (nextElement) {
                                            nextElement.classList.remove('hidden');
                                          }
                                        }}
                                      />
                                    ) : null}
                                    <div className={`${(agent as any).isCustomIcon && (agent as any).icon?.startsWith('/uploads/') ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                                      {(() => {
                                        const iconValue = agent.icon || 'fas fa-user';
                                        const iconMap: { [key: string]: any } = {
                                          'fas fa-graduation-cap': GraduationCap,
                                          'fas fa-code': Code,
                                          'fas fa-robot': BotIcon,
                                          'fas fa-user': User,
                                          'fas fa-flask': FlaskRound,
                                          'fas fa-map': Map,
                                          'fas fa-language': Languages,
                                          'fas fa-dumbbell': Dumbbell,
                                          'fas fa-database': DatabaseIcon,
                                          'fas fa-lightbulb': Lightbulb,
                                          'fas fa-heart': Heart,
                                          'fas fa-calendar': Calendar,
                                          'fas fa-pen': Pen,
                                          'fas fa-file-alt': FileTextIcon,
                                        };
                                        const IconComponent = iconMap[iconValue] || User;
                                        return <IconComponent className="text-white w-6 h-6" />;
                                      })()}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                      {agent.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-48">
                                      {agent.description}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="outline">
                                  {agent.category}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500 font-mono">
                                  {(agent as any).managerId || `prof${String(agent.id).padStart(3, '0')}`}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div>
                                  <div className="text-sm font-semibold text-gray-900 dark:text-white">
                                    {(agent as any).upperCategory || '로보대학교'}
                                  </div>
                                  <div className="text-xs text-blue-600 dark:text-blue-400">
                                    {(agent as any).lowerCategory || '소속 미분류'}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {(agent as any).documentCount || 0}개
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-center">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {(agent as any).userCount || 0}명
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex justify-center">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    title="에이전트 편집"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openAgentDetailDialog(agent);
                                    }}
                                    className="hover:bg-blue-50 hover:text-blue-600"
                                  >
                                    <Edit className="w-4 h-4 mr-1" />
                                    수정
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
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">에이전트 검색</CardTitle>
                </CardHeader>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">에이전트 검색</p>
                    <p className="text-sm">
                      위의 검색 조건을 설정하고 "검색" 버튼을 클릭하여 에이전트를 찾아보세요.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 질문/응답 로그 */}
          <TabsContent value="conversations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">질문 응답 로그</h2>
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

            {/* 통계 카드 - 상단으로 이동 및 높이 최소화 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">오늘 질문 수</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">247</div>
                    <p className="text-xs text-muted-foreground">+12%</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">평균 응답 시간</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">2.3초</div>
                    <p className="text-xs text-muted-foreground">-0.3초</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">응답 실패율</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">3.2%</div>
                    <p className="text-xs text-muted-foreground">전일 대비</p>
                  </div>
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">사용자 만족도</span>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">4.6/5</div>
                    <p className="text-xs text-muted-foreground">평균 점수</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* 필터링 옵션 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">로그 검색</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>상위조직</Label>
                  <Select value={qaSelectedUpperCategory} onValueChange={handleQAUpperCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {qaUniqueUpperCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>하위조직</Label>
                  <Select value={qaSelectedLowerCategory} onValueChange={handleQALowerCategoryChange} disabled={qaSelectedUpperCategory === 'all'}>
                    <SelectTrigger className={qaSelectedUpperCategory === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {qaFilteredLowerCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부조직</Label>
                  <Select 
                    value={qaSelectedDetailCategory} 
                    onValueChange={handleQADetailCategoryChange}
                    disabled={qaSelectedLowerCategory === 'all' || qaSelectedUpperCategory === 'all'}
                  >
                    <SelectTrigger className={qaSelectedLowerCategory === 'all' || qaSelectedUpperCategory === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {qaFilteredDetailCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="flex justify-end">
                <Button>
                  필터 적용
                </Button>
              </div>
            </div>

            {/* 질문/응답 로그 테이블 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]"> 질문 응답 목록</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {conversationLogs?.length || 0}개 중 {filteredConversationLogs?.length || 0}개 표시
                </div>
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
                          에이전트
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          질문
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          응답 유형
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          응답 실패율
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
                      {conversationLogsLoading ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                              <p>대화 기록을 불러오는 중...</p>
                            </div>
                          </td>
                        </tr>
                      ) : conversationLogsError ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center">
                            <div className="text-red-500">
                              <XCircle className="w-6 h-6 mx-auto mb-2" />
                              <p>대화 기록을 불러오는데 실패했습니다</p>
                              <p className="text-sm text-gray-500 mt-1">{conversationLogsError.message}</p>
                            </div>
                          </td>
                        </tr>
                      ) : filteredConversationLogs && filteredConversationLogs.length > 0 ? (
                        filteredConversationLogs.slice(0, 10).map((log: any) => (
                          <tr key={log.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(log.lastMessageAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit', 
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {log.agentName || '알 수 없는 에이전트'}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                                {log.lastUserMessage || '메시지 없음'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                실제 대화
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              0%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              즉시
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
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-8 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">대화 기록이 없습니다</p>
                              <p className="text-sm">
                                사용자가 에이전트와 대화를 시작하면 여기에 기록이 표시됩니다.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 인기 질문 분석 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">인기 질문 TOP 10</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">응답 품질 분석</CardTitle>
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
          </TabsContent>

          {/* 조직 카테고리 관리 */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">조직 카테고리 관리</h2>
              <Button 
                className="whitespace-nowrap"
                onClick={() => setIsNewCategoryDialogOpen(true)}
              >
                + 새 조직 카테고리 추가
              </Button>
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
                onClick={() => setIsOrgCategoryUploadDialogOpen(true)}
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

            {/* 조직 카테고리 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold">조직 카테고리 검색 및 관리</h3>
              
              {/* 3단계 카테고리 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>상위조직</Label>
                  <Select value={selectedUniversity} onValueChange={handleUpperCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {uniqueUpperCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>하위조직</Label>
                  <Select value={selectedCollege} onValueChange={handleLowerCategoryChange} disabled={selectedUniversity === 'all'}>
                    <SelectTrigger className={selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {filteredLowerCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부조직</Label>
                  <Select 
                    value={selectedDepartment} 
                    onValueChange={handleDetailCategoryChange}
                    disabled={selectedCollege === 'all' || selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={selectedCollege === 'all' || selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {filteredDetailCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
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
                <Label>조직명 검색</Label>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Input
                      placeholder="조직명으로 검색..."
                      value={userSearchQuery}
                      onChange={(e) => {
                        setUserSearchQuery(e.target.value);
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                    />
                  </div>
                  <Button onClick={executeSearch} variant="outline">
                    검색
                  </Button>
                </div>
              </div>
              
              
            </div>

            <Card className="rounded-lg border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">조직 목록</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {filteredOrganizationCategories.length}개 조직 중 {organizationCategoriesStartIndex + 1}-{Math.min(organizationCategoriesEndIndex, filteredOrganizationCategories.length)}개 표시
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full rounded-lg overflow-hidden">
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          관리자
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          소속 인원
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          에이전트 수
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          상태
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          선택
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredOrganizationCategories.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <Database className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">검색 결과 없음</p>
                              <p className="text-sm">
                                검색 조건에 맞는 조직이 없습니다. 다른 조건으로 검색해보세요.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedOrganizationCategories.map((category, index) => {
                          // 소속 인원 수 (랜덤 생성)
                          const getPersonnelCount = () => {
                            if (!category.detailCategory) {
                              return `${Math.floor(Math.random() * 5000) + 1000}명`;
                            } else {
                              return `${Math.floor(Math.random() * 300) + 50}명`;
                            }
                          };

                          // 에이전트 수 (랜덤 생성)
                          const getAgentCount = () => {
                            return Math.floor(Math.random() * 10) + 1;
                          };

                          // 상태에 따른 배지 스타일
                          const getStatusBadge = (status: string) => {
                            switch (status) {
                              case "활성":
                                return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">활성</Badge>;
                              case "비활성":
                                return <Badge variant="secondary" className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">비활성</Badge>;
                              case "등록 승인 대기중":
                                return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">등록 승인 대기중</Badge>;
                              default:
                                return <Badge variant="secondary">알 수 없음</Badge>;
                            }
                          };

                          return (
                            <tr 
                              key={`org-${category.id || index}-${category.upperCategory}-${category.lowerCategory}-${category.detailCategory}`}
                              className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150"
                              onClick={() => openOrgCategoryEditDialog(category)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                  {category.upperCategory || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {category.lowerCategory || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {category.detailCategory || "-"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 dark:text-white">
                                  {category.manager || "미지정"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getPersonnelCount()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {getAgentCount()}개
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge((category as any).status || "활성")}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-1">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    title="조직 편집"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openOrgCategoryEditDialog(category);
                                    }}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* 페이지네이션 */}
            {totalOrgCategoriesPages > 1 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  총 {filteredOrganizationCategories.length}개 조직 중 {organizationCategoriesStartIndex + 1}-{Math.min(organizationCategoriesEndIndex, filteredOrganizationCategories.length)}개 표시
                </div>
                <PaginationComponent
                  currentPage={orgCategoriesCurrentPage}
                  totalPages={totalOrgCategoriesPages}
                  onPageChange={(page) => setOrgCategoriesCurrentPage(page)}
                />
              </div>
            )}
          </TabsContent>

          {/* 조직 카테고리 편집 다이얼로그 */}
          <Dialog open={isOrgCategoryEditDialogOpen} onOpenChange={setIsOrgCategoryEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="org-edit-description">
              <DialogHeader>
                <DialogTitle className="font-semibold tracking-tight text-[20px]">조직 상세 정보 편집</DialogTitle>
                <div id="org-edit-description" className="sr-only">조직의 상세 정보를 편집하고 관리할 수 있습니다.</div>
              </DialogHeader>
              <Form {...orgCategoryEditForm}>
                <form onSubmit={orgCategoryEditForm.handleSubmit((data) => {
                  if (editingOrgCategory) {
                    updateOrgCategoryMutation.mutate({ ...data, id: editingOrgCategory.id });
                  }
                })} className="space-y-6">
                  
                  {/* 기본 정보 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>
                    
                    {/* 조직명 - 텍스트로만 표시 */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">조직명</Label>
                      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border">
                        <span className="text-lg font-semibold text-gray-900 dark:text-white">
                          {editingOrgCategory?.name || editingOrgCategory?.detailCategory || "조직명 없음"}
                        </span>
                      </div>
                    </div>

                    {/* 조직 카테고리 선택 - 드롭박스 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={orgCategoryEditForm.control}
                        name="upperCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>상위 조직</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="상위 조직 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                {uniqueUpperCategories.map((category, index) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={orgCategoryEditForm.control}
                        name="lowerCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>하위 조직</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="하위 조직 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                {Array.from(new Set(organizations?.map(org => org.lowerCategory).filter(Boolean))).map((category, index) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={orgCategoryEditForm.control}
                        name="detailCategory"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>세부 조직</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="세부 조직 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">없음</SelectItem>
                                {Array.from(new Set(organizations?.map(org => org.detailCategory).filter(Boolean))).map((category, index) => (
                                  <SelectItem key={category} value={category}>
                                    {category}
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
                      control={orgCategoryEditForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>상태</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="상태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="활성">활성</SelectItem>
                              <SelectItem value="비활성">비활성</SelectItem>
                              <SelectItem value="등록 승인 대기중">등록 승인 대기중</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 조직 운영 정보 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">조직 운영 정보</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* 연결된 에이전트 수 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">연결된 에이전트</Label>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <button
                            type="button"
                            onClick={() => {
                              // 에이전트 관리 탭으로 이동하고 해당 조직으로 필터링
                              setActiveTab("agents");
                              setSelectedUniversity(editingOrgCategory?.upperCategory || 'all');
                              setSelectedCollege(editingOrgCategory?.lowerCategory || 'all');
                              setSelectedDepartment(editingOrgCategory?.detailCategory || 'all');
                              setHasSearched(true);
                              setIsOrgCategoryEditDialogOpen(false);
                            }}
                            className="text-left w-full hover:bg-blue-100 dark:hover:bg-blue-800/30 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">에이전트 수</span>
                              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="font-bold text-blue-600 dark:text-blue-400 text-[20px]">
                              {Math.floor(Math.random() * 10) + 1}개
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              클릭하여 에이전트 관리에서 보기
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* 소속 인원 수 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">소속 인원</Label>
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <button
                            type="button"
                            onClick={() => {
                              // 사용자 관리 탭으로 이동하고 해당 조직으로 필터링
                              setActiveTab("users");
                              setSelectedUniversity(editingOrgCategory?.upperCategory || 'all');
                              setSelectedCollege(editingOrgCategory?.lowerCategory || 'all');
                              setSelectedDepartment(editingOrgCategory?.detailCategory || 'all');
                              setHasSearched(true);
                              setIsOrgCategoryEditDialogOpen(false);
                            }}
                            className="text-left w-full hover:bg-green-100 dark:hover:bg-green-800/30 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">소속 인원 수</span>
                              <ExternalLink className="w-4 h-4 text-green-600 dark:text-green-400" />
                            </div>
                            <div className="font-bold text-green-600 dark:text-green-400 text-[20px]">
                              {editingOrgCategory?.detailCategory ? 
                                `${Math.floor(Math.random() * 300) + 50}명` : 
                                `${Math.floor(Math.random() * 5000) + 1000}명`
                              }
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              클릭하여 사용자 관리에서 보기
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* 카테고리 관리자 설정 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">카테고리 관리자</Label>
                        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                          <div className="space-y-3">
                            {/* 현재 관리자 표시 */}
                            <div>
                              <span className="text-sm text-gray-600 dark:text-gray-400">현재 관리자</span>
                              <div className="font-semibold text-purple-600 dark:text-purple-400 text-[20px]">
                                {orgCategoryEditForm.watch('manager') || editingOrgCategory?.manager || "미지정"}
                              </div>
                            </div>
                            
                            {/* 관리자 변경 버튼 */}
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setIsCategoryManagerDialogOpen(true)}
                              className="w-full"
                            >
                              <Users className="w-4 h-4 mr-2" />
                              관리자 변경
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 추가 정보 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold border-b pb-2">추가 정보</h3>
                    
                    <FormField
                      control={orgCategoryEditForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>조직 설명 / 메모</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="조직에 대한 설명이나 메모를 입력하세요."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Hidden manager field for form handling */}
                    <FormField
                      control={orgCategoryEditForm.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-2 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsOrgCategoryEditDialogOpen(false)}
                    >
                      취소
                    </Button>
                    <Button type="submit" disabled={updateOrgCategoryMutation.isPending}>
                      {updateOrgCategoryMutation.isPending ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* 카테고리 관리자 선택 다이얼로그 */}
          <Dialog open={isCategoryManagerDialogOpen} onOpenChange={setIsCategoryManagerDialogOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>카테고리 관리자 선택</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* 검색 및 필터 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label>상위 조직</Label>
                      <Select value={selectedManagerUniversity} onValueChange={(value) => {
                        setSelectedManagerUniversity(value);
                        setSelectedManagerCollege('all');
                        setSelectedManagerDepartment('all');
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="상위 조직 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {uniqueUpperCategories.map((category, index) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>하위 조직</Label>
                      <Select 
                        value={selectedManagerCollege} 
                        onValueChange={(value) => {
                          setSelectedManagerCollege(value);
                          setSelectedManagerDepartment('all');
                        }}
                        disabled={selectedManagerUniversity === 'all'}
                      >
                        <SelectTrigger className={selectedManagerUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                          <SelectValue placeholder="하위 조직 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {selectedManagerUniversity === 'all' ? 
                            [] :
                            Array.from(new Set(
                              organizations
                                ?.filter(org => org.upperCategory === selectedManagerUniversity)
                                .map(org => org.lowerCategory)
                                .filter(Boolean)
                            )).sort().map((category, index) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>세부 조직</Label>
                      <Select 
                        value={selectedManagerDepartment} 
                        onValueChange={setSelectedManagerDepartment}
                        disabled={selectedManagerCollege === 'all' || selectedManagerUniversity === 'all'}
                      >
                        <SelectTrigger className={selectedManagerCollege === 'all' || selectedManagerUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}>
                          <SelectValue placeholder="세부 조직 선택" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">전체</SelectItem>
                          {selectedManagerUniversity === 'all' || selectedManagerCollege === 'all' ? 
                            [] :
                            Array.from(new Set(
                              organizations
                                ?.filter(org => 
                                  org.upperCategory === selectedManagerUniversity && 
                                  org.lowerCategory === selectedManagerCollege
                                )
                                .map(org => org.detailCategory)
                                .filter(Boolean)
                            )).sort().map((category, index) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>사용자 검색</Label>
                      <Input
                        placeholder="이름 또는 ID로 검색"
                        value={categoryManagerSearchQuery}
                        onChange={(e) => setCategoryManagerSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* 사용자 목록 */}
                <div className="border rounded-lg">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            이름
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            사용자 ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            소속 조직
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            직책
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            선택
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {sortedUsers?.filter((user: any) => {
                          const matchesSearch = !categoryManagerSearchQuery || 
                            user.fullName?.toLowerCase().includes(categoryManagerSearchQuery.toLowerCase()) ||
                            user.username?.toLowerCase().includes(categoryManagerSearchQuery.toLowerCase());
                          
                          const matchesUniversity = selectedManagerUniversity === 'all' || 
                            user.upperCategory === selectedManagerUniversity;
                          
                          const matchesCollege = selectedManagerCollege === 'all' || 
                            user.lowerCategory === selectedManagerCollege;
                          
                          const matchesDepartment = selectedManagerDepartment === 'all' || 
                            user.detailCategory === selectedManagerDepartment;
                          
                          return matchesSearch && matchesUniversity && matchesCollege && matchesDepartment;
                        }).slice(0, 50).map((user: any) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.fullName || user.username}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-500">
                                {user.username}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-500">
                                {[user.upperCategory, user.lowerCategory, user.detailCategory]
                                  .filter(Boolean).join(' > ') || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-sm text-gray-500">
                                {user.position || user.role || '-'}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const managerName = user.fullName || user.username;
                                  
                                  // Update form field first
                                  orgCategoryEditForm.setValue('manager', managerName);
                                  
                                  // Update the editing organization category state
                                  if (editingOrgCategory) {
                                    const updatedCategory = {
                                      ...editingOrgCategory,
                                      manager: managerName
                                    };
                                    setEditingOrgCategory(updatedCategory);
                                  }
                                  
                                  setIsCategoryManagerDialogOpen(false);
                                  
                                  toast({
                                    title: "관리자 선택됨",
                                    description: `${managerName}이(가) 카테고리 관리자로 선택되었습니다.`,
                                  });
                                }}
                              >
                                선택
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsCategoryManagerDialogOpen(false)}
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

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

            {/* 문서 관리 도구 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card 
                className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleFixDocuments()}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <RefreshCw className="w-5 h-5 mr-2 text-orange-600" />
                    문서 텍스트 추출 수정
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    업로드된 문서의 텍스트 추출 오류를 수정합니다.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">문서 통계</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">전체 문서</span>
                    <span className="font-medium">{documentList?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">활성 문서</span>
                    <span className="font-medium">{documentList?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">비활성 문서</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">총 용량</span>
                    <span className="font-medium">{documentList?.reduce((total, doc) => {
                      const sizeInMB = parseFloat(doc.size?.replace(' MB', '') || '0');
                      return total + sizeInMB;
                    }, 0).toFixed(1) || '0'} MB</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">문서 종류별 분포</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">최근 업로드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documentList && documentList.length > 0 ? (
                    documentList.slice(0, 3).map((doc, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-gray-500">{doc.date}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      업로드된 문서가 없습니다.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 문서 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">문서 검색 및 관리</h3>
              
              {/* 카테고리 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>문서 종류</Label>
                  <Select value={selectedDocumentCategory} onValueChange={(value) => {
                    setSelectedDocumentCategory(value);
                    handleDocumentFilterChange();
                  }}>
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
                  <Select value={selectedDocumentType} onValueChange={(value) => {
                    setSelectedDocumentType(value);
                    handleDocumentFilterChange();
                  }}>
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
                  <Select value={selectedDocumentPeriod} onValueChange={(value) => {
                    setSelectedDocumentPeriod(value);
                    handleDocumentFilterChange();
                  }}>
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
                  <Button variant="outline" onClick={resetDocumentFilters}>
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
                    검색
                  </Button>
                </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">문서 목록</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {documentList?.length || 0}개 문서 표시
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('name')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>문서명</span>
                            {documentSortField === 'name' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('type')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>종류</span>
                            {documentSortField === 'type' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('size')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>크기</span>
                            {documentSortField === 'size' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('date')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>업로드 날짜</span>
                            {documentSortField === 'date' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('agents')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>사용 중인 에이전트</span>
                            {documentSortField === 'agents' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('status')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>상태</span>
                            {documentSortField === 'status' && (
                              documentSortDirection === 'asc' ? 
                              <ChevronUp className="w-4 h-4" /> : 
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          설정
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {/* 실제 업로드된 문서 */}
                      {documentList && documentList.length > 0 ? (
                        documentList.map((doc, index) => (
                          <tr 
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setDocumentDetailData(doc);
                              setSelectedDocumentAgents([]);
                              setIsDocumentDetailOpen(true);
                            }}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 mr-3 text-blue-500" />
                              <div>
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {doc.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                에이전트 {doc.agentId}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              활성
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocumentDetailData(doc);
                                setSelectedDocumentAgents([]);
                                setIsDocumentDetailOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">업로드된 문서가 없습니다</p>
                              <p className="text-sm">
                                문서 업로드 기능을 사용하여 파일을 업로드해보세요.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 토큰 관리 */}
          <TabsContent value="tokens" className="space-y-4">
            <h2 className="text-2xl font-bold">토큰 관리</h2>

            {/* 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">월간 사용량</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{Math.round(tokenStats.monthly / 1000000 * 10) / 10}M 토큰</div>
                  <div className="text-xs text-green-600 mt-1">73% 사용</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">일일 평균</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">{(tokenStats.dailyAverage / 1000).toFixed(1)}K</div>
                  <div className="text-xs text-green-600 mt-1">토큰/일</div>
                  <div className="text-xs text-muted-foreground">↑ 12% 지난 주 대비</div>
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">예상 비용</span>
                </div>
                <div className="mt-2">
                  <div className="text-2xl font-bold">₩{tokenStats.estimatedCost.toLocaleString()}</div>
                  <div className="text-xs text-green-600 mt-1">이번 달</div>
                  <div className="text-xs text-muted-foreground">예상 내</div>
                </div>
              </Card>
            </div>

            {/* 로그 필터링 */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-[20px]">로그 검색</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 상위 - 하위 - 세부 조직 (상단) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="space-y-2">
                    <Label>상위 조직</Label>
                    <Select 
                      value={tokenUpperCategoryFilter} 
                      onValueChange={(value) => {
                        setTokenUpperCategoryFilter(value);
                        // 상위 조직 변경 시 하위 및 세부 조직 초기화
                        setTokenLowerCategoryFilter("all");
                        setTokenDetailCategoryFilter("all");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {uniqueUpperCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>하위 조직</Label>
                    <Select 
                      value={tokenLowerCategoryFilter} 
                      onValueChange={(value) => {
                        setTokenLowerCategoryFilter(value);
                        // 하위 조직 변경 시 세부 조직 초기화
                        setTokenDetailCategoryFilter("all");
                      }}
                      disabled={tokenUpperCategoryFilter === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {filteredTokenLowerCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>세부 조직</Label>
                    <Select 
                      value={tokenDetailCategoryFilter} 
                      onValueChange={setTokenDetailCategoryFilter}
                      disabled={tokenLowerCategoryFilter === 'all'}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {filteredTokenDetailCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* 기간, 모델, 키워드 (하단) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>기간</Label>
                    <Select value={tokenPeriodFilter} onValueChange={setTokenPeriodFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">오늘</SelectItem>
                        <SelectItem value="week">최근 1주일</SelectItem>
                        <SelectItem value="month">최근 1개월</SelectItem>
                        <SelectItem value="quarter">최근 3개월</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>모델</Label>
                    <Select value={tokenModelFilter} onValueChange={setTokenModelFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>키워드</Label>
                    <Input
                      placeholder="에이전트명 또는 질문 키워드"
                      value={tokenKeywordFilter}
                      onChange={(e) => setTokenKeywordFilter(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 토큰 사용량 테이블 */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-[20px]">토큰 사용량 목록</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">시간</th>
                        <th className="text-left p-3 font-medium">에이전트</th>
                        <th className="text-left p-3 font-medium">질문</th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (tokenSortField === 'inputTokens') {
                              setTokenSortOrder(tokenSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setTokenSortField('inputTokens');
                              setTokenSortOrder('desc');
                            }
                          }}
                        >
                          입력 {tokenSortField === 'inputTokens' && (tokenSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (tokenSortField === 'outputTokens') {
                              setTokenSortOrder(tokenSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setTokenSortField('outputTokens');
                              setTokenSortOrder('desc');
                            }
                          }}
                        >
                          출력 {tokenSortField === 'outputTokens' && (tokenSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (tokenSortField === 'indexTokens') {
                              setTokenSortOrder(tokenSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setTokenSortField('indexTokens');
                              setTokenSortOrder('desc');
                            }
                          }}
                        >
                          색인 {tokenSortField === 'indexTokens' && (tokenSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          className="text-left p-3 font-medium cursor-pointer hover:bg-muted/50"
                          onClick={() => {
                            if (tokenSortField === 'preprocessingTokens') {
                              setTokenSortOrder(tokenSortOrder === 'asc' ? 'desc' : 'asc');
                            } else {
                              setTokenSortField('preprocessingTokens');
                              setTokenSortOrder('desc');
                            }
                          }}
                        >
                          문서 전처리 {tokenSortField === 'preprocessingTokens' && (tokenSortOrder === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-left p-3 font-medium">총합</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedTokenData.map((token) => (
                        <tr key={token.id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-xs">
                            {new Date(token.timestamp).toLocaleString('ko-KR', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="p-3 text-xs font-medium">{token.agentName}</td>
                          <td className="p-3 text-xs max-w-xs truncate" title={token.question}>
                            {token.question}
                          </td>
                          <td className="p-3 text-xs text-right">{token.inputTokens.toLocaleString()}</td>
                          <td className="p-3 text-xs text-right">{token.outputTokens.toLocaleString()}</td>
                          <td className="p-3 text-xs text-right">{token.indexTokens.toLocaleString()}</td>
                          <td className="p-3 text-xs text-right">{token.preprocessingTokens.toLocaleString()}</td>
                          <td className="p-3 text-xs text-right font-medium">{token.totalTokens.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 페이지네이션 */}
                {tokenTotalPages > 1 && (
                  <div className="mt-4">
                    <PaginationComponent
                      currentPage={tokenCurrentPage}
                      totalPages={tokenTotalPages}
                      onPageChange={setTokenCurrentPage}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 시스템 설정 */}
          <TabsContent value="system" className="space-y-6">
            <h2 className="text-2xl font-bold">시스템 설정</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">OpenAI 설정</CardTitle>
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
                  <CardTitle className="font-semibold tracking-tight text-[20px]">데이터베이스 관리</CardTitle>
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
                <Label>문서 종류</Label>
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
                    <Label className="text-sm text-gray-600">상위 카테고리</Label>
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
                    <Label className="text-sm text-gray-600">하위 카테고리</Label>
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
                    <Label className="text-sm text-gray-600">세부 카테고리"</Label>
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

        {/* 문서 상세 보기 다이얼로그 */}
        <Dialog open={isDocumentDetailDialogOpen} onOpenChange={setIsDocumentDetailDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>에이전트 연결 설정</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-6">
                {/* 문서 정보 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedDocument.name}</h3>
                      <p className="text-sm text-gray-500">{selectedDocument.size} • {selectedDocument.uploadDate}</p>
                    </div>
                  </div>
                </div>

                {/* 에이전트 검색 */}
                <div>
                  <h4 className="text-base font-medium mb-4">에이전트 검색</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-gray-600">상위 카테고리</Label>
                      <Select defaultValue="인문대학">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="인문대학">인문대학</SelectItem>
                          <SelectItem value="공과대학">공과대학</SelectItem>
                          <SelectItem value="경영대학">경영대학</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">하위 카테고리</Label>
                      <Select defaultValue="국문학과">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="국문학과">국문학과</SelectItem>
                          <SelectItem value="영문학과">영문학과</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">세부 카테고리</Label>
                      <Select defaultValue="4학년">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="1학년">1학년</SelectItem>
                          <SelectItem value="2학년">2학년</SelectItem>
                          <SelectItem value="3학년">3학년</SelectItem>
                          <SelectItem value="4학년">4학년</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 에이전트 목록 */}
                <div className="border rounded-lg">
                  <div className="p-4 border-b bg-gray-50 dark:bg-gray-800">
                    <h4 className="font-medium">국문학과</h4>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="agent1" className="rounded" />
                      <label htmlFor="agent1" className="flex-1 cursor-pointer">
                        <div className="font-medium">한국어문학과 도우미</div>
                        <div className="text-sm text-gray-500">한국어문학과 관련 질문을 도와드립니다</div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="agent2" className="rounded" defaultChecked />
                      <label htmlFor="agent2" className="flex-1 cursor-pointer">
                        <div className="font-medium">고전문학 해설 봇</div>
                        <div className="text-sm text-gray-500">고전 문학 작품 해설 및 감상</div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="agent3" className="rounded" />
                      <label htmlFor="agent3" className="flex-1 cursor-pointer">
                        <div className="font-medium">현대문학 분석 도우미</div>
                        <div className="text-sm text-gray-500">현대 문학 작품 분석 및 비평</div>
                      </label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="checkbox" id="agent4" className="rounded" />
                      <label htmlFor="agent4" className="flex-1 cursor-pointer">
                        <div className="font-medium">창작 지도 멘토</div>
                        <div className="text-sm text-gray-500">소설, 시 창작 지도 및 피드백</div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 연결 요약 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">연결 요약</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    현재 3개의 에이전트에 연결되어 있습니다.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="secondary">영문학과 도우미</Badge>
                    <Badge variant="secondary">고전문학 해설 봇</Badge>
                    <Badge variant="secondary">기술생활 가이드</Badge>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-between">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      // 문서 삭제 로직
                      toast({
                        title: "문서 삭제",
                        description: `${selectedDocument.name}이(가) 삭제되었습니다.`,
                      });
                      setIsDocumentDetailDialogOpen(false);
                    }}
                  >
                    취소
                  </Button>
                  <div className="flex space-x-2">
                    <Button variant="outline" onClick={() => setIsDocumentDetailDialogOpen(false)}>
                      취소
                    </Button>
                    <Button onClick={() => {
                      toast({
                        title: "에이전트 연결 완료",
                        description: "선택한 에이전트들에 문서가 연결되었습니다.",
                      });
                      setIsDocumentDetailDialogOpen(false);
                    }}>
                      에이전트 연결 저장
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 문서 업로드 다이얼로그 */}
        <Dialog open={isDocumentUploadDialogOpen} onOpenChange={setIsDocumentUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>문서 업로드</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                multiple
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleDocumentFileSelect}
              >
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mb-4">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 50MB)
                </p>
                <Button 
                  variant="outline" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDocumentFileSelect();
                  }}
                >
                  파일 선택
                </Button>
              </div>

              {/* 선택된 파일 목록 */}
              {selectedDocumentFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">선택된 파일 ({selectedDocumentFiles.length}개)</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearAllFiles}
                      className="text-red-600 hover:text-red-700"
                    >
                      모두 제거
                    </Button>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      {selectedDocumentFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveFile(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <Label>문서 종류</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="문서 종류" />
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
                    <Label className="text-sm text-gray-600">상위 카테고리</Label>
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
                    <Label className="text-sm text-gray-600">하위 카테고리</Label>
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
                    <Label className="text-sm text-gray-600">세부 카테고리</Label>
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
                <Button 
                  onClick={handleDocumentUpload}
                  disabled={selectedDocumentFiles.length === 0 || isDocumentUploading}
                >
                  {isDocumentUploading ? `업로드 중... (${Math.round(documentUploadProgress)}%)` : `업로드 시작 (${selectedDocumentFiles.length}개 파일)`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 새 조직 카테고리 생성 다이얼로그 */}
        <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>새 카테고리 생성</DialogTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setIsNewCategoryDialogOpen(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 pt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                생성하려는 카테고리 레벨을 선택하세요.
              </p>
              
              {/* 카테고리 레벨 */}
              <div className="space-y-2">
                <Label>카테고리 레벨</Label>
                <Select defaultValue="상위 카테고리 (예: 인문대학)">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="상위 카테고리 (예: 인문대학)">상위 카테고리 (예: 인문대학)</SelectItem>
                    <SelectItem value="하위 카테고리 (예: 국어국문학과)">하위 카테고리 (예: 국어국문학과)</SelectItem>
                    <SelectItem value="세부 카테고리 (예: 현대문학전공)">세부 카테고리 (예: 현대문학전공)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 상위 카테고리 이름 */}
              <div className="space-y-2">
                <Label>상위 카테고리 이름 *</Label>
                <Input 
                  placeholder="예: 인문대학, 공과대학"
                  className="w-full"
                />
              </div>

              {/* 설명 */}
              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea 
                  placeholder="카테고리에 대한 설명을 입력하세요"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* 버튼 그룹 */}
              <div className="flex justify-between pt-4">
                <Button 
                  variant="destructive"
                  className="flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>삭제</span>
                </Button>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsNewCategoryDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setIsNewCategoryDialogOpen(false);
                      toast({
                        title: "카테고리 생성",
                        description: "새 카테고리가 성공적으로 생성되었습니다.",
                      });
                    }}
                  >
                    생성
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 조직 카테고리 파일 업로드 다이얼로그 */}
        <Dialog open={isOrgCategoryUploadDialogOpen} onOpenChange={setIsOrgCategoryUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>조직 카테고리 파일 업로드</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* 숨겨진 파일 입력 */}
              <input
                ref={orgCategoryFileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                multiple
                onChange={handleOrgCategoryFileInputChange}
                style={{ display: 'none' }}
              />
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onClick={handleOrgCategoryFileSelect}
              >
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mb-4">
                  CSV, Excel 파일(.csv, .xls, .xlsx) 지원 (최대 50MB)
                </p>
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOrgCategoryFileSelect();
                  }}
                >
                  파일 선택
                </Button>
              </div>

              {/* 선택된 파일 목록 */}
              {selectedOrgCategoryFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">선택된 파일 ({selectedOrgCategoryFiles.length}개)</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedOrgCategoryFiles([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      모두 제거
                    </Button>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      {selectedOrgCategoryFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrgCategoryFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 업로드된 파일 목록 */}
              {uploadedOrgFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">업로드된 파일 ({uploadedOrgFiles.length}개)</Label>
                    <span className="text-xs text-gray-500">조직 데이터 관련 파일들</span>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      {uploadedOrgFiles.map((file: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className={`w-4 h-4 flex-shrink-0 ${
                              file.type === 'organization' ? 'text-green-500' : 
                              file.originalName?.endsWith('.xlsx') || file.originalName?.endsWith('.xls') || file.originalName?.endsWith('.csv') ? 'text-blue-500' : 
                              'text-gray-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm font-medium truncate">{file.originalName || file.fileName}</p>
                                <div className="flex items-center space-x-1">
                                  {file.type === 'organization' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      조직 파일
                                    </span>
                                  )}
                                  {file.status === 'applied' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                      최종 반영됨
                                    </span>
                                  )}
                                  {file.status === 'validated' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                      검증됨
                                    </span>
                                  )}
                                  {file.status === 'pending' && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                      미반영
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                  {new Date(file.uploadedAt).toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })} • {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                                {file.organizationsCount && (
                                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                    {file.organizationsCount}개 조직 반영
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteOrgFileMutation.mutate(file.originalName || file.fileName)}
                            disabled={deleteOrgFileMutation.isPending}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
                          >
                            {deleteOrgFileMutation.isPending ? '...' : '삭제'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">파일 형식 요구사항</h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 첫 번째 행: 헤더 (조직명, 상위조직, 하위조직, 세부조직)</p>
                  <p>• 조직명: 조직의 정식 명칭 (필수)</p>
                  <p>• 상위조직: 대학/본부 등 최상위 조직</p>
                  <p>• 하위조직: 단과대학/처/부 등</p>
                  <p>• 세부조직: 학과/팀/과 등</p>
                </div>
              </div>

              <div>
                <Label>업로드 옵션</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="org-overwrite-existing" 
                      className="rounded" 
                      checked={orgOverwriteExisting}
                      onChange={(e) => setOrgOverwriteExisting(e.target.checked)}
                    />
                    <Label htmlFor="org-overwrite-existing">기존 조직 정보 덮어쓰기</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="org-validate-only" 
                      className="rounded"
                      checked={orgValidateOnly}
                      onChange={(e) => setOrgValidateOnly(e.target.checked)}
                    />
                    <Label htmlFor="org-validate-only">검증만 수행 (실제 업로드 안함)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    if (confirm("로보대학교 관련 조직 카테고리를 모두 삭제하시겠습니까?")) {
                      deleteRoboUniversityMutation.mutate();
                    }
                  }}
                  disabled={deleteRoboUniversityMutation.isPending}
                >
                  {deleteRoboUniversityMutation.isPending ? "삭제 중..." : "로보대학교 조직 삭제"}
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setIsOrgCategoryUploadDialogOpen(false)}>
                    취소
                  </Button>
                  <Button 
                    onClick={handleOrgCategoryUpload}
                    disabled={selectedOrgCategoryFiles.length === 0 || isOrgCategoryUploading}
                  >
                    {isOrgCategoryUploading ? `업로드 중... (${Math.round(orgCategoryUploadProgress)}%)` : `업로드 시작 (${selectedOrgCategoryFiles.length}개 파일)`}
                  </Button>
                </div>
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
              {/* 숨겨진 파일 입력 */}
              <input
                ref={userFileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                multiple
                onChange={handleUserFileInputChange}
                style={{ display: 'none' }}
              />
              <div 
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleUserFileDrop}
                onClick={handleUserFileSelect}
              >
                <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                <p className="text-lg font-medium mb-2">파일을 드래그하거나 클릭하여 업로드</p>
                <p className="text-sm text-gray-500 mb-4">
                  CSV, Excel 파일 지원 (최대 50MB)
                </p>
                <Button 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUserFileSelect();
                  }}
                >
                  파일 선택
                </Button>
              </div>

              {/* 선택된 파일 목록 */}
              {selectedUserFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">선택된 파일 ({selectedUserFiles.length}개)</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUserFiles([])}
                      className="text-red-600 hover:text-red-700"
                    >
                      모두 제거
                    </Button>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-gray-50 dark:bg-gray-800">
                    <div className="space-y-2">
                      {selectedUserFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded border"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2"
                          >
                            ×
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">파일 형식 요구사항</h4>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 첫 번째 행: 헤더 (username, firstName, lastName, email, userType)</p>
                  <p>• username: 학번/교번 (필수)</p>
                  <p>• userType: "student" 또는 "faculty" (필수)</p>
                  <p>• email: 이메일 주소 (선택)</p>
                  <p>• upperCategory, lowerCategory, detailCategory, position (선택)</p>
                  <p>• 엑셀 파일의 경우 첫 번째 시트만 처리됩니다</p>
                </div>
              </div>

              <div>
                <Label>업로드 옵션</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="overwrite-existing" 
                      className="rounded" 
                      checked={overwriteExisting}
                      onChange={(e) => setOverwriteExisting(e.target.checked)}
                    />
                    <Label htmlFor="overwrite-existing">기존 사용자 정보 덮어쓰기</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="send-welcome" 
                      className="rounded"
                      checked={sendWelcome}
                      onChange={(e) => setSendWelcome(e.target.checked)}
                    />
                    <Label htmlFor="send-welcome">신규 사용자에게 환영 이메일 발송</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="validate-only" 
                      className="rounded"
                      checked={validateOnly}
                      onChange={(e) => setValidateOnly(e.target.checked)}
                    />
                    <Label htmlFor="validate-only">검증만 수행 (실제 업로드 안함)</Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFileUploadDialogOpen(false)}>
                  취소
                </Button>
                <Button variant="outline" onClick={handleDownloadSampleFile}>
                  샘플 파일 다운로드
                </Button>
                <Button 
                  onClick={handleUserFileUpload}
                  disabled={selectedUserFiles.length === 0 || isUserFileUploading}
                >
                  {isUserFileUploading ? `업로드 중... (${Math.round(userFileUploadProgress)}%)` : `업로드 시작 (${selectedUserFiles.length}개 파일)`}
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
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white bg-${selectedBgColor}-500 overflow-hidden`}>
                  {isUsingCustomImage && customImagePreview ? (
                    <img 
                      src={customImagePreview} 
                      alt="Custom icon preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (() => {
                      const IconComponent = iconMap[selectedIcon as keyof typeof iconMap] || User;
                      return <IconComponent className="w-6 h-6 text-white" />;
                    })()
                  )}
                </div>
              </div>

              {/* 아이콘 유형 선택 */}
              <div>
                <h3 className="text-sm font-medium mb-3">아이콘 유형</h3>
                <div className="flex space-x-2">
                  <Button 
                    variant={!isUsingCustomImage ? "default" : "outline"} 
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setIsUsingCustomImage(false);
                      setCustomImageFile(null);
                      setCustomImagePreview(null);
                      setSelectedIcon("User");
                    }}
                  >
                    기본 아이콘
                  </Button>
                  <input
                    type="file"
                    id="custom-image-upload"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleCustomImageChange}
                    style={{ display: 'none' }}
                  />
                  <Button 
                    variant={isUsingCustomImage ? "default" : "outline"}
                    size="sm" 
                    className="flex-1"
                    onClick={() => {
                      document.getElementById('custom-image-upload')?.click();
                    }}
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

        {/* 문서 상세 정보 및 에이전트 연결 팝업 */}
        <Dialog open={isDocumentDetailOpen} onOpenChange={setIsDocumentDetailOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>문서 상세 정보 및 에이전트 연결</DialogTitle>
            </DialogHeader>
            
            {documentDetailData && (
              <div className="space-y-6">
                {/* 문서 정보 */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">문서 정보</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">파일명</Label>
                      <p className="text-sm mt-1">{documentDetailData.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">업로드 시간</Label>
                      <p className="text-sm mt-1">{documentDetailData.date} 14:30:15</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">업로더 ID</Label>
                      <p className="text-sm mt-1">{documentDetailData.uploader}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">파일 형식</Label>
                      <p className="text-sm mt-1">{documentDetailData.name.split('.').pop()?.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">파일 크기</Label>
                      <p className="text-sm mt-1">{documentDetailData.size}</p>
                    </div>
                  </div>
                </div>

                {/* 상태 영역 */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">상태</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">문서 상태</Label>
                      <Select defaultValue="active">
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">사용 중</SelectItem>
                          <SelectItem value="inactive">미사용</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 현재 연결된 에이전트 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">현재 연결된 에이전트</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {selectedDocumentAgents.map((agent, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                      >
                        {agent}
                        <button
                          onClick={() => setSelectedDocumentAgents(prev => prev.filter((_, i) => i !== index))}
                          className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* 에이전트 연결 영역 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">에이전트 연결</h3>
                  
                  {/* 에이전트 검색 및 필터 */}
                  <div className="space-y-4 mb-4">
                    {/* 조직 카테고리 필터 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">상위 카테고리</Label>
                        <Select value={selectedDocumentUpperCategory} onValueChange={setSelectedDocumentUpperCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            {Array.from(new Set(organizations.map(org => org.upperCategory).filter(Boolean))).sort().map((category, index) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">하위 카테고리</Label>
                        <Select value={selectedDocumentLowerCategory} onValueChange={setSelectedDocumentLowerCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            {Array.from(new Set(
                              organizations
                                .filter(org => selectedDocumentUpperCategory === 'all' || org.upperCategory === selectedDocumentUpperCategory)
                                .map(org => org.lowerCategory)
                                .filter(Boolean)
                            )).sort().map((category, index) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">세부 카테고리</Label>
                        <Select value={selectedDocumentDetailCategory} onValueChange={setSelectedDocumentDetailCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">전체</SelectItem>
                            {Array.from(new Set(
                              organizations
                                .filter(org => 
                                  (selectedDocumentUpperCategory === 'all' || org.upperCategory === selectedDocumentUpperCategory) &&
                                  (selectedDocumentLowerCategory === 'all' || org.lowerCategory === selectedDocumentLowerCategory)
                                )
                                .map(org => org.detailCategory)
                                .filter(Boolean)
                            )).sort().map((category, index) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 에이전트 유형 필터와 검색 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">에이전트 유형</Label>
                        <Select value={selectedDocumentAgentType} onValueChange={setSelectedDocumentAgentType}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
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
                        <Label className="text-sm font-medium">에이전트 검색</Label>
                        <Input
                          placeholder="에이전트 이름 또는 설명에 포함된 키워드로 검색..."
                          value={documentAgentSearchQuery}
                          onChange={(e) => setDocumentAgentSearchQuery(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setDocumentAgentSearchQuery("");
                            setSelectedDocumentUpperCategory("all");
                            setSelectedDocumentLowerCategory("all");
                            setSelectedDocumentDetailCategory("all");
                            setSelectedDocumentAgentType("all");
                          }}
                          className="mt-6"
                        >
                          필터 초기화
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 에이전트 테이블 */}
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3">
                      <h4 className="font-medium">사용 가능한 에이전트</h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              에이전트명
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              유형
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              소속
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              문서
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              사용자
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              선택
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                          {agents?.filter(agent => {
                            // 검색어 필터
                            const searchMatch = !documentAgentSearchQuery.trim() || 
                              agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                              (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                            
                            // 유형 필터
                            const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                            
                            return searchMatch && typeMatch;
                          }).map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div className={`w-8 h-8 rounded-full ${agent.backgroundColor} flex items-center justify-center text-white text-sm font-medium mr-3`}>
                                    {agent.icon}
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {agent.name}
                                    </div>
                                    {agent.description && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {agent.description.length > 50 ? `${agent.description.substring(0, 50)}...` : agent.description}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                  {agent.category}
                                </span>
                              </td>
                              <td className="px-4 py-4">
                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                  예술대학
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  음악학과
                                </div>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-900 dark:text-gray-100">3개</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-900 dark:text-gray-100">13명</span>
                              </td>
                              <td className="px-4 py-4">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                  checked={selectedDocumentAgents.includes(agent.name)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedDocumentAgents(prev => [...prev, agent.name]);
                                    } else {
                                      setSelectedDocumentAgents(prev => prev.filter(name => name !== agent.name));
                                    }
                                  }}
                                />
                              </td>
                            </tr>
                          )) || []}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 사용자 상세 정보 편집 다이얼로그 */}
        <Dialog open={isUserDetailDialogOpen} onOpenChange={setIsUserDetailDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>사용자 정보 편집</DialogTitle>
              <DialogDescription>사용자 정보를 수정합니다.</DialogDescription>
            </DialogHeader>
            
            <Form {...userEditForm}>
              <form onSubmit={userEditForm.handleSubmit((data) => {
                if (selectedUser) {
                  updateUserMutation.mutate({ ...data, id: selectedUser.id });
                }
              })} className="space-y-6">
                
                {/* 기본 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={userEditForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>사용자명</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="서지원200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={userEditForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>이메일</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="서.지원200@university.edu" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* 소속 정보 */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">소속 정보</Label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={selectedUser?.role?.includes('admin') ? 'default' : 'secondary'}>
                        {selectedUser?.role?.includes('admin') ? '카테고리 관리자' : '일반 사용자'}
                      </Badge>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          // 소속 카테고리 추가 기능 구현
                          toast({
                            title: "기능 준비 중",
                            description: "소속 카테고리 추가 기능을 준비 중입니다.",
                          });
                        }}
                      >
                        + 소속된 카테고리 추가
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={userEditForm.control}
                      name="upperCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">상위 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(organizations.map(org => org.upperCategory).filter(Boolean))).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userEditForm.control}
                      name="lowerCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">하위 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(
                                organizations
                                  .filter(org => !userEditForm.watch('upperCategory') || userEditForm.watch('upperCategory') === 'none' || org.upperCategory === userEditForm.watch('upperCategory'))
                                  .map(org => org.lowerCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userEditForm.control}
                      name="detailCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">세부 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(
                                organizations
                                  .filter(org => 
                                    (!userEditForm.watch('upperCategory') || userEditForm.watch('upperCategory') === 'none' || org.upperCategory === userEditForm.watch('upperCategory')) &&
                                    (!userEditForm.watch('lowerCategory') || userEditForm.watch('lowerCategory') === 'none' || org.lowerCategory === userEditForm.watch('lowerCategory'))
                                  )
                                  .map(org => org.detailCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={userEditForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">직책/역할</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="학생">학생</SelectItem>
                              <SelectItem value="교수">교수</SelectItem>
                              <SelectItem value="직원">직원</SelectItem>
                              <SelectItem value="연구원">연구원</SelectItem>
                              <SelectItem value="조교">조교</SelectItem>
                              <SelectItem value="대학원생">대학원생</SelectItem>
                              <SelectItem value="박사과정">박사과정</SelectItem>
                              <SelectItem value="석사과정">석사과정</SelectItem>
                              <SelectItem value="학부생">학부생</SelectItem>
                              <SelectItem value="졸업생">졸업생</SelectItem>
                              <SelectItem value="강사">강사</SelectItem>
                              <SelectItem value="부교수">부교수</SelectItem>
                              <SelectItem value="정교수">정교수</SelectItem>
                              <SelectItem value="명예교수">명예교수</SelectItem>
                              <SelectItem value="초빙교수">초빙교수</SelectItem>
                              <SelectItem value="겸임교수">겸임교수</SelectItem>
                              <SelectItem value="시간강사">시간강사</SelectItem>
                              <SelectItem value="연구교수">연구교수</SelectItem>
                              <SelectItem value="외래교수">외래교수</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={userEditForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">시스템 역할</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="일반 사용자" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">일반 사용자</SelectItem>
                              <SelectItem value="master_admin">마스터 관리자</SelectItem>
                              <SelectItem value="operation_admin">운영 관리자</SelectItem>
                              <SelectItem value="category_admin">카테고리 관리자</SelectItem>
                              <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                              <SelectItem value="qa_admin">QA 관리자</SelectItem>
                              <SelectItem value="doc_admin">문서 관리자</SelectItem>
                              <SelectItem value="external">외부 사용자</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 계정 상태 */}
                <FormField
                  control={userEditForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>계정 상태</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">활성</SelectItem>
                          <SelectItem value="inactive">비활성</SelectItem>
                          <SelectItem value="locked">잠금</SelectItem>
                          <SelectItem value="pending">대기</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 사용 중인 에이전트 목록 */}
                <UserActiveAgents userId={selectedUser?.id} />

                {/* 계정 정보 */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">계정 정보</Label>
                  <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                    <div>계정 등록일: 10/4/2024, 6:22:27 PM</div>
                    <div>최종 접속일: 5/31/2025, 9:41:31 AM</div>
                  </div>
                </div>

                {/* 사용자 설명/메모 */}
                <FormField
                  control={userEditForm.control}
                  name="detailCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>사용자 설명/메모</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="사용자에 대한 추가 정보나 메모를 입력하세요..."
                          className="min-h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 버튼 */}
                <div className="flex justify-between pt-4">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsUserDetailDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button type="submit" disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 새 사용자 생성 다이얼로그 */}
        <Dialog open={isNewUserDialogOpen} onOpenChange={setIsNewUserDialogOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">새 사용자 추가</DialogTitle>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                새로운 사용자를 시스템에 추가합니다. 필수 정보를 모두 입력해주세요.
              </div>
            </DialogHeader>
            
            <Form {...newUserForm}>
              <form onSubmit={newUserForm.handleSubmit((data) => {
                createUserMutation.mutate(data);
              })} className="space-y-6">
                
                {/* 사용자 기본 정보 */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <Label className="text-sm font-medium">사용자 기본 정보</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newUserForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">이름 *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="홍길동" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newUserForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">이메일 *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" placeholder="hong@university.edu" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={newUserForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">사용자 ID *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="user123" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newUserForm.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">사용자 타입 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="타입 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="student">학생</SelectItem>
                              <SelectItem value="faculty">교직원</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    

                  </div>
                </div>

                {/* 소속 정보 */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <Label className="text-sm font-medium">소속 정보</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={newUserForm.control}
                      name="upperCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">상위 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(organizations.map(org => org.upperCategory).filter(Boolean))).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newUserForm.control}
                      name="lowerCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">하위 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(
                                organizations
                                  .filter(org => !newUserForm.watch('upperCategory') || newUserForm.watch('upperCategory') === 'none' || org.upperCategory === newUserForm.watch('upperCategory'))
                                  .map(org => org.lowerCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newUserForm.control}
                      name="detailCategory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">세부 카테고리</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || "none"}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">선택</SelectItem>
                              {Array.from(new Set(
                                organizations
                                  .filter(org => 
                                    (!newUserForm.watch('upperCategory') || newUserForm.watch('upperCategory') === 'none' || org.upperCategory === newUserForm.watch('upperCategory')) &&
                                    (!newUserForm.watch('lowerCategory') || newUserForm.watch('lowerCategory') === 'none' || org.lowerCategory === newUserForm.watch('lowerCategory'))
                                  )
                                  .map(org => org.detailCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={newUserForm.control}
                      name="position"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">직책/역할</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="학생">학생</SelectItem>
                              <SelectItem value="교수">교수</SelectItem>
                              <SelectItem value="직원">직원</SelectItem>
                              <SelectItem value="연구원">연구원</SelectItem>
                              <SelectItem value="조교">조교</SelectItem>
                              <SelectItem value="대학원생">대학원생</SelectItem>
                              <SelectItem value="박사과정">박사과정</SelectItem>
                              <SelectItem value="석사과정">석사과정</SelectItem>
                              <SelectItem value="학부생">학부생</SelectItem>
                              <SelectItem value="졸업생">졸업생</SelectItem>
                              <SelectItem value="강사">강사</SelectItem>
                              <SelectItem value="부교수">부교수</SelectItem>
                              <SelectItem value="정교수">정교수</SelectItem>
                              <SelectItem value="명예교수">명예교수</SelectItem>
                              <SelectItem value="초빙교수">초빙교수</SelectItem>
                              <SelectItem value="겸임교수">겸임교수</SelectItem>
                              <SelectItem value="시간강사">시간강사</SelectItem>
                              <SelectItem value="연구교수">연구교수</SelectItem>
                              <SelectItem value="외래교수">외래교수</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={newUserForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">시스템 역할</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ""}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="일반 사용자" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="user">일반 사용자</SelectItem>
                              <SelectItem value="master_admin">마스터 관리자</SelectItem>
                              <SelectItem value="operation_admin">운영 관리자</SelectItem>
                              <SelectItem value="category_admin">카테고리 관리자</SelectItem>
                              <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                              <SelectItem value="qa_admin">QA 관리자</SelectItem>
                              <SelectItem value="doc_admin">문서 관리자</SelectItem>
                              <SelectItem value="external">외부 사용자</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <FormLabel className="text-sm">에이전트 관리자</FormLabel>
                      <Select 
                        onValueChange={(value) => {
                          // Store the selected manager in form state or separate state
                          console.log('Selected agent manager:', value);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="에이전트 관리자 선택 (선택사항)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">없음</SelectItem>
                          {managers.map((manager) => (
                            <SelectItem key={manager.id} value={manager.id}>
                              {(manager as any).name || manager.id} ({manager.id})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* 계정 설정 */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-4">
                  <Label className="text-sm font-medium">계정 설정</Label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={newUserForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm">계정 상태</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="상태 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">활성</SelectItem>
                              <SelectItem value="inactive">비활성</SelectItem>
                              <SelectItem value="locked">잠금</SelectItem>
                              <SelectItem value="pending">대기</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex flex-col justify-center">
                      <Label className="text-sm mb-2">초기 비밀번호</Label>
                      <div className="text-sm text-gray-500 dark:text-gray-400 p-3 bg-blue-50 dark:bg-blue-950 rounded border">
                        시스템에서 자동으로 임시 비밀번호를 생성합니다. <br />
                        사용자의 첫 로그인 시 비밀번호 변경이 요구됩니다.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-between pt-6 border-t">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewUserDialogOpen(false)}
                    className="min-w-[120px]"
                  >
                    취소
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {createUserMutation.isPending ? '생성 중...' : '사용자 생성'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 에이전트 파일 업로드 모달 */}
        <AgentFileUploadModal
          isOpen={isAgentFileUploadModalOpen}
          onClose={() => setIsAgentFileUploadModalOpen(false)}
        />
      </Tabs>
    </main>
  </div>
  );
}

export default MasterAdmin;
