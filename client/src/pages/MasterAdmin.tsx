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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Remove hardcoded organization categories import - now using API data

import { NewCategoryDialog } from "@/components/NewCategoryDialog";
import { PaginationComponent } from "@/components/PaginationComponent";
import { usePagination } from "@/hooks/usePagination";

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
  ChevronUp,
  ChevronDown,
  Palette,
  Menu,
  Download,
  ExternalLink,
  Eye,
  X,
  ChevronsUpDown,
  RefreshCw
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
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategoryField: z.string().optional(),
  llmModel: z.string().optional(),
  chatbotType: z.string().optional(),
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
  role: z.enum(["user", "faculty", "admin"], { required_error: "역할을 선택해주세요" }),
  status: z.enum(["active", "inactive", "pending"], { required_error: "상태를 선택해주세요" }),
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

function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");



  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
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
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");

  // 조직 카테고리 편집 관련 상태
  const [isOrgCategoryEditDialogOpen, setIsOrgCategoryEditDialogOpen] = useState(false);
  const [editingOrgCategory, setEditingOrgCategory] = useState<any>(null);

  // 카테고리 관리자 선택 다이얼로그 상태
  const [isCategoryManagerDialogOpen, setIsCategoryManagerDialogOpen] = useState(false);
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [selectedManagerUniversity, setSelectedManagerUniversity] = useState('all');
  const [selectedManagerCollege, setSelectedManagerCollege] = useState('all');
  const [selectedManagerDepartment, setSelectedManagerDepartment] = useState('all');

  // 문서 상세 팝업 상태
  const [isDocumentDetailOpen, setIsDocumentDetailOpen] = useState(false);
  const [documentDetailData, setDocumentDetailData] = useState<any>(null);
  const [selectedDocumentAgents, setSelectedDocumentAgents] = useState<string[]>([]);
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [tokenPeriod, setTokenPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [agentSortField, setAgentSortField] = useState<string>('name');
  const [agentSortDirection, setAgentSortDirection] = useState<'asc' | 'desc'>('asc');
  const [documentSortField, setDocumentSortField] = useState<string>('name');
  const [documentSortDirection, setDocumentSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const { toast } = useToast();
  const { t } = useLanguage();

  // Logout function
  const logoutUser = async () => {
    try {
      const response = await apiRequest("POST", "/api/auth/logout");
      if (response.ok) {
        window.location.href = "/auth";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      window.location.href = "/auth";
    }
  };

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

  // 사용자 목록 조회
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) throw new Error('Failed to fetch users');
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
  const { data: organizations = [], refetch: refetchOrganizations } = useQuery<any[]>({
    queryKey: ['/api/admin/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch organizations');
      const data = await response.json();
      console.log('Fetched organizations data:', data.length, 'items');
      return data;
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

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
    setUserSearchQuery('');
    setAgentSearchQuery('');
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

  // 새 사용자 생성 뮤테이션
  const createUserMutation = useMutation({
    mutationFn: async (data: NewUserFormData) => {
      const payload = {
        id: data.userId,
        username: data.userId,
        name: data.name,
        email: data.email,
        userType: data.userType,
        role: data.role,
        status: data.status,
        upperCategory: data.upperCategory || null,
        lowerCategory: data.lowerCategory || null,
        detailCategory: data.detailCategory || null,
        position: data.position || null,
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

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Master Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                LoBo AI 챗봇 시스템 관리자 페널
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                메인 서비스
              </Button>
              <Button
                variant="outline"
                onClick={logoutUser}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                활성: {stats?.activeUsers || 0}명
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI 에이전트</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">
                활성: {stats?.activeAgents || 0}개
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">대화</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                총 대화방
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">메시지</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                오늘: {stats?.todayMessages || 0}개
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Content area with tabs */}
        <div className="bg-white rounded-lg shadow-sm border">
          {/* Content placeholder */}
          <div className="p-6">
            <p className="text-center text-gray-500">
              Admin interface content will be rendered here
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MasterAdmin;