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
  ChevronUp,
  ChevronDown,
  Palette,
  Menu,
  Download,
  ExternalLink
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

export default function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isEditAgentDialogOpen, setIsEditAgentDialogOpen] = useState(false);
  const [isIconChangeDialogOpen, setIsIconChangeDialogOpen] = useState(false);
  const [isLmsDialogOpen, setIsLmsDialogOpen] = useState(false);
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
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");

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

  // 파일 입력 참조
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const userFileInputRef = React.useRef<HTMLInputElement>(null);

  const { toast } = useToast();
  const { t } = useLanguage();

  // 페이지네이션 상태
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const usersPerPage = 20;

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

  // 사용자 데이터가 로드되면 자동으로 검색 상태를 true로 설정
  React.useEffect(() => {
    if (users && users.length > 0 && !hasSearched) {
      setHasSearched(true);
    }
  }, [users, hasSearched]);

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
    }

    return filtered;
  }, [users, hasSearched, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment]);

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
  const { data: organizations } = useQuery<any[]>({
    queryKey: ['/api/admin/organizations'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organizations');
      if (!response.ok) throw new Error('Failed to fetch organizations');
      return response.json();
    }
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

  // 검색 실행 함수
  const executeSearch = () => {
    setHasSearched(true);
    setUserCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedUniversity('all');
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setUserSearchQuery('');
    setHasSearched(false);
    setUserCurrentPage(1); // 필터 초기화 시 첫 페이지로 이동
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

  // 사용자 카테고리 데이터 (샘플 데이터 기반)
  const upperCategories = useMemo(() => {
    if (!users) return [];
    const categories = [...new Set(users.map(user => (user as any).upperCategory).filter(Boolean))];
    return categories.sort();
  }, [users]);

  const lowerCategories = useMemo(() => {
    if (!users || selectedUniversity === 'all') return [];
    const categories = [...new Set(
      users
        .filter(user => (user as any).upperCategory === selectedUniversity)
        .map(user => (user as any).lowerCategory)
        .filter(Boolean)
    )];
    return categories.sort();
  }, [users, selectedUniversity]);

  const detailCategories = useMemo(() => {
    if (!users || selectedCollege === 'all' || selectedUniversity === 'all') return [];
    const categories = [...new Set(
      users
        .filter(user => 
          (user as any).upperCategory === selectedUniversity && 
          (user as any).lowerCategory === selectedCollege
        )
        .map(user => (user as any).detailCategory)
        .filter(Boolean)
    )];
    return categories.sort();
  }, [users, selectedUniversity, selectedCollege]);

  // 상위 카테고리 변경 시 하위 카테고리 초기화
  const handleUpperCategoryChange = (value: string) => {
    setSelectedUniversity(value);
    setSelectedCollege('all');
    setSelectedDepartment('all');
    executeSearch();
  };

  // 하위 카테고리 변경 시 세부 카테고리 초기화
  const handleLowerCategoryChange = (value: string) => {
    setSelectedCollege(value);
    setSelectedDepartment('all');
    executeSearch();
  };

  // 세부 카테고리 변경 시 검색 실행
  const handleDetailCategoryChange = (value: string) => {
    setSelectedDepartment(value);
    executeSearch();
  };

  // 에이전트 검색 함수
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



  // 필터된 에이전트 목록
  const filteredAgents = useMemo(() => {
    if (!agents) return [];

    let filtered = [...agents];

    // 검색이 실행된 경우에만 필터링 적용
    if (hasSearched) {
      // 검색 쿼리 필터링
      if (userSearchQuery.trim()) {
        const query = userSearchQuery.toLowerCase();
        filtered = filtered.filter(agent => 
          agent.name.toLowerCase().includes(query) ||
          agent.description.toLowerCase().includes(query)
        );
      }

      // 카테고리 필터링
      if (selectedUniversity !== 'all') {
        const categoryMap = {
          'school': '학교',
          'professor': '교수',
          'student': '학생',
          'group': '그룹',
          'function': '기능형'
        };
        filtered = filtered.filter(agent => 
          agent.category === categoryMap[selectedUniversity as keyof typeof categoryMap]
        );
      }

      // 상태 필터링
      if (selectedCollege !== 'all') {
        filtered = filtered.filter(agent => 
          selectedCollege === 'active' ? agent.isActive : !agent.isActive
        );
      }
    }

    return filtered;
  }, [agents, hasSearched, userSearchQuery, selectedUniversity, selectedCollege]);

  // 정렬된 에이전트 목록
  const sortedAgents = useMemo(() => {
    const agentsToSort = hasSearched ? filteredAgents : agents || [];

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
  }, [agents, filteredAgents, agentSortField, agentSortDirection, hasSearched]);



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
      upperCategory: "전체",
      lowerCategory: "전체", 
      detailCategoryField: "전체",
      llmModel: "gpt-4o",
      chatbotType: "general-llm",
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
      upperCategory: "전체",
      lowerCategory: "전체", 
      detailCategoryField: "전체",
      llmModel: "gpt-4o",
      chatbotType: "general-llm",
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
        title: "오류",```python
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

  // 문서 파일 선택 핸들러
  const handleDocumentFileSelect = () => {
    console.log("파일 선택 버튼 클릭됨");
    if (fileInputRef.current) {
      fileInputRef.current.click();
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

  // 사용자 파일 입력 변경 핸들러
  const handleUserFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    if (files.length > 0) {
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of files) {
        // 파일 크기 체크 (10MB)
        if (file.size > 10 * 1024 * 1024) {
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
      const allowedTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      for (const file of files) {
        // 파일 크기 체크 (10MB)
        if (file.size > 10 * 1024 * 1024) {
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
        setSelectedUserFiles(validFiles);
        toast({
          title: "파일 추가됨",
          description: `${validFiles.length}개 파일이 추가되었습니다.`,
        });
      }
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

        // 사용자 목록 새로고침
        queryClient.invalidateQueries({
          queryKey: ['/api/admin/users']
        });
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
          formData.append('type', selectedDocumentType || 'manual');
          formData.append('description', '관리자 업로드 문서');

          const response = await fetch('/api/admin/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
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

      setSelectedDocumentFiles([]);
      setIsDocumentUploadDialogOpen(false);

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

            {/* 사용자 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="text-lg font-semibold mb-4">사용자 검색</h3>

              {/* 조직 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>상위 카테고리</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="대학본부">대학본부</SelectItem>
                      <SelectItem value="학사부서">학사부서</SelectItem>
                      <SelectItem value="인문대학">인문대학</SelectItem>
                      <SelectItem value="사회과학대학">사회과학대학</SelectItem>
                      <SelectItem value="자연과학대학">자연과학대학</SelectItem>
                      <SelectItem value="공과대학">공과대학</SelectItem>
                      <SelectItem value="경영대학">경영대학</SelectItem>
                      <SelectItem value="의과대학">의과대학</SelectItem>
                      <SelectItem value="대학원">대학원</SelectItem>
                      <SelectItem value="연구기관">연구기관</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>하위 카테고리</Label>
                  <Select value={selectedCollege} onValueChange={setSelectedCollege} disabled={selectedUniversity === 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {selectedUniversity === "대학본부" && (
                        <>
                          <SelectItem value="총장실">총장실</SelectItem>
                          <SelectItem value="기획처">기획처</SelectItem>
                          <SelectItem value="교무처">교무처</SelectItem>
                          <SelectItem value="학생처">학생처</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "학사부서" && (
                        <>
                          <SelectItem value="입학처">입학처</SelectItem>
                          <SelectItem value="교육혁신원">교육혁신원</SelectItem>
                          <SelectItem value="국제교류원">국제교류원</SelectItem>
                          <SelectItem value="취업진로센터">취업진로센터</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "인문대학" && (
                        <>
                          <SelectItem value="국어국문학과">국어국문학과</SelectItem>
                          <SelectItem value="영어영문학과">영어영문학과</SelectItem>
                          <SelectItem value="사학과">사학과</SelectItem>
                          <SelectItem value="철학과">철학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "사회과학대학" && (
                        <>
                          <SelectItem value="정치외교학과">정치외교학과</SelectItem>
                          <SelectItem value="행정학과">행정학과</SelectItem>
                          <SelectItem value="사회학과">사회학과</SelectItem>
                          <SelectItem value="심리학과">심리학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "자연과학대학" && (
                        <>
                          <SelectItem value="수학과">수학과</SelectItem>
                          <SelectItem value="물리학과">물리학과</SelectItem>
                          <SelectItem value="화학과">화학과</SelectItem>
                          <SelectItem value="생명과학과">생명과학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "공과대학" && (
                        <>
                          <SelectItem value="컴퓨터공학과">컴퓨터공학과</SelectItem>
                          <SelectItem value="전자공학과">전자공학과</SelectItem>
                          <SelectItem value="기계공학과">기계공학과</SelectItem>
                          <SelectItem value="건축학과">건축학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "경영대학" && (
                        <>
                          <SelectItem value="경영학과">경영학과</SelectItem>
                          <SelectItem value="회계학과">회계학과</SelectItem>
                          <SelectItem value="경제학과">경제학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "의과대학" && (
                        <>
                          <SelectItem value="의학과">의학과</SelectItem>
                          <SelectItem value="간호학과">간호학과</SelectItem>
                          <SelectItem value="약학과">약학과</SelectItem>
                          <SelectItem value="치의학과">치의학과</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "대학원" && (
                        <>
                          <SelectItem value="일반대학원">일반대학원</SelectItem>
                          <SelectItem value="특수대학원">특수대학원</SelectItem>
                          <SelectItem value="전문대학원">전문대학원</SelectItem>
                          <SelectItem value="국제대학원">국제대학원</SelectItem>
                        </>
                      )}
                      {selectedUniversity === "연구기관" && (
                        <>
                          <SelectItem value="중앙연구소">중앙연구소</SelectItem>
                          <SelectItem value="인문사회연구소">인문사회연구소</SelectItem>
                          <SelectItem value="의학연구소">의학연구소</SelectItem>
                          <SelectItem value="공학연구소">공학연구소</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부 카테고리</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment} disabled={selectedCollege === 'all' || selectedUniversity === 'all'}>
                    <SelectTrigger>
                      <SelectValue placeholder="선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {selectedCollege === "총장실" && (
                        <>
                          <SelectItem value="총장비서실">총장비서실</SelectItem>
                          <SelectItem value="대외협력팀">대외협력팀</SelectItem>
                          <SelectItem value="홍보팀">홍보팀</SelectItem>
                        </>
                      )}
                      {selectedCollege === "기획처" && (
                        <>
                          <SelectItem value="기획예산팀">기획예산팀</SelectItem>
                          <SelectItem value="평가관리팀">평가관리팀</SelectItem>
                          <SelectItem value="IR팀">IR팀</SelectItem>
                        </>
                      )}
                      {selectedCollege === "교무처" && (
                        <>
                          <SelectItem value="교무팀">교무팀</SelectItem>
                          <SelectItem value="학사관리팀">학사관리팀</SelectItem>
                          <SelectItem value="수업관리팀">수업관리팀</SelectItem>
                        </>
                      )}
                      {selectedCollege === "학생처" && (
                        <>
                          <SelectItem value="학생지원팀">학생지원팀</SelectItem>
                        </>
                      )}
                      {selectedCollege === "입학처" && (
                        <>
                          <SelectItem value="입학사정팀">입학사정팀</SelectItem>
                          <SelectItem value="입학전형팀">입학전형팀</SelectItem>
                          <SelectItem value="입학홍보팀">입학홍보팀</SelectItem>
                        </>
                      )}
                      {selectedCollege === "국어국문학과" && (
                        <>
                          <SelectItem value="현대문학전공">현대문학전공</SelectItem>
                          <SelectItem value="고전문학전공">고전문학전공</SelectItem>
                          <SelectItem value="국어학전공">국어학전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "영어영문학과" && (
                        <>
                          <SelectItem value="영문학전공">영문학전공</SelectItem>
                          <SelectItem value="영어학전공">영어학전공</SelectItem>
                          <SelectItem value="영어교육전공">영어교육전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "정치외교학과" && (
                        <>
                          <SelectItem value="정치학전공">정치학전공</SelectItem>
                          <SelectItem value="외교학전공">외교학전공</SelectItem>
                          <SelectItem value="국제관계전공">국제관계전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "수학과" && (
                        <>
                          <SelectItem value="순수수학전공">순수수학전공</SelectItem>
                          <SelectItem value="응용수학전공">응용수학전공</SelectItem>
                          <SelectItem value="통계학전공">통계학전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "컴퓨터공학과" && (
                        <>
                          <SelectItem value="소프트웨어공학전공">소프트웨어공학전공</SelectItem>
                          <SelectItem value="인공지능전공">인공지능전공</SelectItem>
                          <SelectItem value="데이터사이언스전공">데이터사이언스전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "전자공학과" && (
                        <>
                          <SelectItem value="반도체공학전공">반도체공학전공</SelectItem>
                          <SelectItem value="통신공학전공">통신공학전공</SelectItem>
                          <SelectItem value="제어공학전공">제어공학전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "경영학과" && (
                        <>
                          <SelectItem value="경영전략전공">경영전략전공</SelectItem>
                          <SelectItem value="마케팅전공">마케팅전공</SelectItem>
                          <SelectItem value="재무관리전공">재무관리전공</SelectItem>
                          <SelectItem value="인사조직전공">인사조직전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "의학과" && (
                        <>
                          <SelectItem value="내과학전공">내과학전공</SelectItem>
                          <SelectItem value="외과학전공">외과학전공</SelectItem>
                          <SelectItem value="소아과학전공">소아과학전공</SelectItem>
                        </>
                      )}
                      {selectedCollege === "일반대학원" && (
                        <>
                          <SelectItem value="박사과정">박사과정</SelectItem>
                          <SelectItem value="석사과정">석사과정</SelectItem>
                          <SelectItem value="석박통합과정">석박통합과정</SelectItem>
                        </>
                      )}
                      {selectedCollege === "중앙연구소" && (
                        <>
                          <SelectItem value="기초과학연구소">기초과학연구소</SelectItem>
                          <SelectItem value="응용과학연구소">응용과학연구소</SelectItem>
                          <SelectItem value="산업기술연구소">산업기술연구소</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    필터 초기화
                  </Button>
                </div>
              </div>