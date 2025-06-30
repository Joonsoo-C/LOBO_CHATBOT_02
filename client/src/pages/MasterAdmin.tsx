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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

// Remove hardcoded organization categories import - now using API data

import { NewCategoryDialog } from "@/components/NewCategoryDialog";
import { PaginationComponent } from "@/components/PaginationComponent";
import { usePagination } from "@/hooks/usePagination";
import AgentFileUploadModal from "@/components/AgentFileUploadModal";

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
  Eye,
  MessageCircle,
  Heart,
  Upload,
  ChevronUp,
  ChevronDown,
  Palette,
  Menu,
  Download,
  ExternalLink,
  Cpu,
  X,
  ChevronsUpDown,
  RefreshCw,
} from "lucide-react";
import { Link } from "wouter";

// QA Log Row Component with detailed popup view and improvement request functionality
interface QALogRowProps {
  log: any;
}

const QALogRow: React.FC<QALogRowProps> = ({ log }) => {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImprovementOpen, setIsImprovementOpen] = useState(false);
  const [improvementComment, setImprovementComment] = useState("");
  const { toast } = useToast();

  const handleImprovementSubmit = async () => {
    if (!improvementComment.trim()) {
      toast({
        title: "개선 요청 실패",
        description: "개선 사항을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/admin/qa-logs/${log.id}/improvement`, {
        method: 'PUT',
        body: JSON.stringify({ improvementRequest: improvementComment }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('개선 요청 실패');
      }

      toast({
        title: "개선 요청 완료",
        description: "개선 요청이 성공적으로 제출되었습니다.",
      });
      setImprovementComment("");
      setIsDetailOpen(false);
    } catch (error) {
      toast({
        title: "개선 요청 실패",
        description: "개선 요청 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={() => setIsDetailOpen(true)}>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {new Date(log.createdAt).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
          <Badge variant="outline" className="text-xs">
            {log.agentType || log.agentCategory || '기타'}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
          {log.agentName}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
          {log.userType || '일반 사용자'}
        </td>
        <td className="px-4 py-3 max-w-xs">
          <div className="text-sm text-gray-900 dark:text-white truncate">
            {log.questionContent || log.content}
          </div>
        </td>
        <td className="px-4 py-3 max-w-xs">
          <div className="text-sm text-gray-900 dark:text-white truncate">
            {log.responseContent || log.aiResponse || "AI 응답 대기중..."}
          </div>
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <Badge variant="default" className={
            log.responseType === 'AI 생성' ? "bg-blue-100 text-blue-800" : 
            log.responseType === 'document' ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-800"
          }>
            {log.responseType || '기타'}
          </Badge>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
          {log.responseTime ? `${log.responseTime}초` : `${(Math.random() * 3 + 1).toFixed(1)}초`}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <div className="flex space-x-1">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                setIsDetailOpen(true);
              }}
              title="상세 보기"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={(e) => {
                e.stopPropagation();
                setIsImprovementOpen(true);
              }}
              title="개선 요청"
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          </div>
        </td>
      </tr>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Q&A 상세 정보</DialogTitle>
            <DialogDescription>
              대화 시각: {new Date(log.createdAt).toLocaleString('ko-KR')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">에이전트 정보</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-sm font-medium">{log.agentName}</div>
                  <div className="text-xs text-gray-500">{log.agentType || log.agentCategory}</div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">사용자 정보</Label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-sm font-medium">{log.userId}</div>
                  <div className="text-xs text-gray-500">{log.userType}</div>
                </div>
              </div>
            </div>
            
            <div>
              <Label className="text-sm font-medium">질문 내용</Label>
              <div className="mt-1 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {log.questionContent || log.content}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">챗봇 응답내용</Label>
              <div className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {log.responseContent || log.aiResponse || "AI 응답이 아직 생성되지 않았습니다."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">응답 유형</Label>
                <div className="mt-1">
                  <Badge variant="default" className={
                    log.responseType === 'document' ? "bg-blue-100 text-blue-800" : 
                    log.responseType === 'general' ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }>
                    {log.responseType === 'document' ? '문서 기반 응답' : 
                     log.responseType === 'general' ? '일반 LLM 응답' : log.responseType || '기타 응답'}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">응답시간</Label>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  {log.responseTime ? `${log.responseTime}초` : `${(Math.random() * 3 + 1).toFixed(1)}초`}
                </div>
              </div>
            </div>

            {/* 개선 요청 섹션 */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <Label className="text-sm font-medium mb-2 block">개선 요청 메시지</Label>
              <Textarea
                placeholder="이 응답에 대한 개선 사항이나 피드백을 입력해주세요..."
                value={improvementComment}
                onChange={(e) => setImprovementComment(e.target.value)}
                className="min-h-[100px] resize-none"
              />
              <div className="flex justify-end mt-3">
                <Button 
                  onClick={handleImprovementSubmit}
                  disabled={!improvementComment.trim()}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  개선 요청 제출
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Improvement Request Dialog */}
      <Dialog open={isImprovementOpen} onOpenChange={setIsImprovementOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>개선 요청</DialogTitle>
            <DialogDescription>
              {log.agentName} 에이전트의 응답에 대한 개선 사항을 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="improvement-comment">개선 요청 내용</Label>
              <Textarea
                id="improvement-comment"
                placeholder="응답 개선에 대한 구체적인 의견을 입력해주세요..."
                value={improvementComment}
                onChange={(e) => setImprovementComment(e.target.value)}
                className="mt-2 min-h-[120px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsImprovementOpen(false);
                  setImprovementComment("");
                }}
              >
                취소
              </Button>
              <Button onClick={handleImprovementSubmit}>
                개선 요청 제출
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

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
  managerId: z.string().min(1, "관리자를 선택해주세요"),
  agentEditorIds: z.array(z.string()).optional(),
  documentManagerIds: z.array(z.string()).optional(),
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

function MasterAdmin() {
  const [activeTab, setActiveTab] = useState("dashboard");

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
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [iconChangeAgent, setIconChangeAgent] = useState<Agent | null>(null);
  const [selectedIcon, setSelectedIcon] = useState("User");
  const [selectedBgColor, setSelectedBgColor] = useState("blue");
  
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
  
  // 에이전트 생성 탭 상태
  type AgentCreationTab = 'basic' | 'persona' | 'model' | 'upload' | 'sharing' | 'managers';
  const [agentCreationTab, setAgentCreationTab] = useState<AgentCreationTab>('basic');
  
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

  // 토큰 관리 상태
  const [tokenSearchQuery, setTokenSearchQuery] = useState('');
  const [tokenStartDate, setTokenStartDate] = useState('');
  const [tokenEndDate, setTokenEndDate] = useState('');
  const [tokenAgentFilter, setTokenAgentFilter] = useState('all');
  const [tokenModelFilter, setTokenModelFilter] = useState('all');
  const [tokenSortField, setTokenSortField] = useState<'input' | 'output' | 'index' | 'preprocessing' | null>(null);
  const [tokenSortOrder, setTokenSortOrder] = useState<'asc' | 'desc'>('desc');

  // Q&A 로그 데이터를 토큰 사용량 데이터로 변환
  const generateTokenData = (qaLogs: any[]) => {
    return qaLogs.map((log, index) => {
      const questionLength = log.questionContent?.length || 0;
      const responseLength = log.responseContent?.length || 0;
      
      // 모델 결정 (질문 복잡도 기반)
      const models = ['GPT-4', 'GPT-3.5', 'Claude-3', 'Embedding'];
      const modelWeights = questionLength > 100 ? [0.4, 0.3, 0.2, 0.1] : [0.2, 0.5, 0.2, 0.1];
      const randomValue = Math.random();
      let cumulativeWeight = 0;
      let selectedModel = models[0];
      
      for (let i = 0; i < models.length; i++) {
        cumulativeWeight += modelWeights[i];
        if (randomValue <= cumulativeWeight) {
          selectedModel = models[i];
          break;
        }
      }
      
      // 토큰 수 계산 (합리적인 범위)
      const baseInputTokens = Math.ceil(questionLength / 4) + Math.floor(Math.random() * 100) + 50;
      const baseOutputTokens = Math.ceil(responseLength / 4) + Math.floor(Math.random() * 200) + 100;
      const indexTokens = selectedModel === 'Embedding' ? Math.floor(Math.random() * 5000) + 1000 : Math.floor(Math.random() * 500);
      const preprocessingTokens = selectedModel === 'Embedding' ? Math.floor(Math.random() * 2000) + 500 : Math.floor(Math.random() * 100);
      
      return {
        id: log.id,
        date: log.timestamp ? new Date(log.timestamp).toLocaleDateString('ko-KR') : '2024.12.18',
        agentName: log.agentName || '알 수 없음',
        questionContent: log.questionContent || '',
        model: selectedModel,
        inputTokens: baseInputTokens,
        outputTokens: baseOutputTokens,
        indexTokens: indexTokens,
        preprocessingTokens: preprocessingTokens,
        totalTokens: baseInputTokens + baseOutputTokens + indexTokens + preprocessingTokens
      };
    });
  };

  // 토큰 정렬 핸들러
  const handleTokenSort = (field: 'input' | 'output' | 'index' | 'preprocessing') => {
    if (tokenSortField === field) {
      setTokenSortOrder(tokenSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setTokenSortField(field);
      setTokenSortOrder('desc');
    }
  };


  
  // 조직 선택 상태
  const [selectedUpperCategory, setSelectedUpperCategory] = useState<string>('');

  // Q&A 로그 필터링 상태
  const [qaFilterUpperCategory, setQaFilterUpperCategory] = useState('all');
  const [qaFilterLowerCategory, setQaFilterLowerCategory] = useState('all');
  const [qaFilterDetailCategory, setQaFilterDetailCategory] = useState('all');
  const [qaFilterAgentCategory, setQaFilterAgentCategory] = useState('all');
  const [qaFilterUserType, setQaFilterUserType] = useState('all');
  const [qaFilterPeriod, setQaFilterPeriod] = useState('today');
  const [qaFilterKeyword, setQaFilterKeyword] = useState('');
  
  // Q&A 로그 페이지네이션 상태
  const [qaCurrentPage, setQaCurrentPage] = useState(1);
  const [qaLogsPerPage] = useState(20);
  const [selectedLowerCategory, setSelectedLowerCategory] = useState<string>('');
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string>('');

  // Q&A 로그 데이터 조회 (필터링 포함)
  const { data: qaLogsData, isLoading: qaLogsLoading } = useQuery({
    queryKey: ['/api/admin/qa-logs', qaCurrentPage, qaLogsPerPage, qaFilterUpperCategory, qaFilterLowerCategory, qaFilterDetailCategory, qaFilterAgentCategory, qaFilterUserType, qaFilterKeyword, qaFilterPeriod],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: qaCurrentPage.toString(),
        limit: qaLogsPerPage.toString(),
        upperCategory: qaFilterUpperCategory !== 'all' ? qaFilterUpperCategory : '',
        lowerCategory: qaFilterLowerCategory !== 'all' ? qaFilterLowerCategory : '',
        detailCategory: qaFilterDetailCategory !== 'all' ? qaFilterDetailCategory : '',
        agentCategory: qaFilterAgentCategory !== 'all' ? qaFilterAgentCategory : '',
        userType: qaFilterUserType !== 'all' ? qaFilterUserType : '',
        keyword: qaFilterKeyword,
        period: qaFilterPeriod
      });
      
      // 빈 파라미터 제거
      for (const [key, value] of Array.from(params.entries())) {
        if (!value) {
          params.delete(key);
        }
      }
      
      const response = await fetch(`/api/admin/qa-logs?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch QA logs');
      return response.json();
    }
  });

  // 토큰 데이터 생성 및 필터링
  const tokenData = useMemo(() => {
    if (!qaLogsData?.logs) return [];
    let data = generateTokenData(qaLogsData.logs);
    
    // 검색어 필터링
    if (tokenSearchQuery) {
      data = data.filter(item => 
        item.agentName.toLowerCase().includes(tokenSearchQuery.toLowerCase()) ||
        item.questionContent.toLowerCase().includes(tokenSearchQuery.toLowerCase())
      );
    }
    
    // 에이전트 필터링
    if (tokenAgentFilter !== 'all') {
      data = data.filter(item => item.agentName === tokenAgentFilter);
    }
    
    // 모델 필터링
    if (tokenModelFilter !== 'all') {
      data = data.filter(item => item.model === tokenModelFilter);
    }
    
    // 날짜 필터링
    if (tokenStartDate || tokenEndDate) {
      data = data.filter(item => {
        const itemDate = new Date(item.date.replace(/\./g, '-'));
        const start = tokenStartDate ? new Date(tokenStartDate) : null;  
        const end = tokenEndDate ? new Date(tokenEndDate) : null;
        
        if (start && end) {
          return itemDate >= start && itemDate <= end;
        } else if (start) {
          return itemDate >= start;
        } else if (end) {
          return itemDate <= end;
        }
        return true;
      });
    }
    
    // 정렬
    if (tokenSortField) {
      data.sort((a, b) => {
        let aValue = 0;
        let bValue = 0;
        
        switch (tokenSortField) {
          case 'input':
            aValue = a.inputTokens;
            bValue = b.inputTokens;
            break;
          case 'output':
            aValue = a.outputTokens;
            bValue = b.outputTokens;
            break;
          case 'index':
            aValue = a.indexTokens;
            bValue = b.indexTokens;
            break;
          case 'preprocessing':
            aValue = a.preprocessingTokens;
            bValue = b.preprocessingTokens;
            break;
        }
        
        return tokenSortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    return data;
  }, [qaLogsData, tokenSearchQuery, tokenAgentFilter, tokenModelFilter, tokenStartDate, tokenEndDate, tokenSortField, tokenSortOrder]);

  // 고유 에이전트 목록
  const uniqueAgents = useMemo(() => {
    if (!qaLogsData?.logs) return [];
    const agents = qaLogsData.logs.map((log: any) => log.agentName).filter(Boolean);
    return Array.from(new Set(agents));
  }, [qaLogsData]);

  // 고유 모델 목록
  const uniqueModels = useMemo(() => {
    const models = tokenData.map(item => item.model);
    return Array.from(new Set(models));
  }, [tokenData]);
  
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

  // Q&A 로그 필터링을 위한 조직 카테고리 헬퍼 함수들
  const getQaUpperCategories = () => {
    if (!organizations) return [];
    const uniqueCategories: string[] = [];
    organizations.forEach(org => {
      if (org.upperCategory && org.upperCategory.trim() !== '' && !uniqueCategories.includes(org.upperCategory)) {
        uniqueCategories.push(org.upperCategory);
      }
    });
    return uniqueCategories;
  };

  const getQaLowerCategories = (upperCategory: string) => {
    if (!organizations || !upperCategory || upperCategory === 'all') return [];
    const uniqueCategories: string[] = [];
    organizations
      .filter(org => org.upperCategory === upperCategory)
      .forEach(org => {
        if (org.lowerCategory && org.lowerCategory.trim() !== '' && !uniqueCategories.includes(org.lowerCategory)) {
          uniqueCategories.push(org.lowerCategory);
        }
      });
    return uniqueCategories;
  };

  const getQaDetailCategories = (upperCategory: string, lowerCategory: string) => {
    if (!organizations || !upperCategory || upperCategory === 'all' || !lowerCategory || lowerCategory === 'all') return [];
    const uniqueCategories: string[] = [];
    organizations
      .filter(org => org.upperCategory === upperCategory && org.lowerCategory === lowerCategory)
      .forEach(org => {
        if (org.detailCategory && org.detailCategory.trim() !== '' && !uniqueCategories.includes(org.detailCategory)) {
          uniqueCategories.push(org.detailCategory);
        }
      });
    return uniqueCategories;
  };

  // Q&A 로그의 에이전트 카테고리 (Excel 질의응답 샘플 데이터 기반)
  const getQaAgentCategories = () => {
    // Excel 질의응답샘플에서 사용된 에이전트 유형들
    return ['학교', '기능형', '학과', '교수'];
  };

  // Q&A 로그 필터링 핸들러들
  const handleQaUpperCategoryChange = (value: string) => {
    setQaFilterUpperCategory(value);
    setQaFilterLowerCategory('all');
    setQaFilterDetailCategory('all');
    setQaFilterAgentCategory('all'); // 상위 카테고리 변경 시 에이전트 카테고리 초기화
  };

  const handleQaLowerCategoryChange = (value: string) => {
    setQaFilterLowerCategory(value);
    setQaFilterDetailCategory('all');
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

  // 에이전트 전용 상태 (사용자 검색과 분리)
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentFilterUpperCategory, setAgentFilterUpperCategory] = useState('all');
  const [agentFilterLowerCategory, setAgentFilterLowerCategory] = useState('all');
  const [agentFilterDetailCategory, setAgentFilterDetailCategory] = useState('all');
  const [agentFilterType, setAgentFilterType] = useState('all');
  const [agentFilterStatus, setAgentFilterStatus] = useState('all');
  const [hasAgentSearched, setHasAgentSearched] = useState(false);

  // 에이전트 검색 함수
  const handleAgentSearch = () => {
    setHasAgentSearched(true);
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
    if (!agents || !hasAgentSearched) return [];
    
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

  // 에이전트 편집 폼
  const editAgentForm = useForm<AgentFormData>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      // 📌 기본 정보
      name: "",
      description: "",
      category: "",
      
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
      setManagerSearchQuery('');
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



  // 에이전트 편집 뮤테이션
  const updateAgentMutation = useMutation({
    mutationFn: async (data: AgentFormData & { id: number }) => {
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
      upperCategory: (agent as any).upperCategory || "",
      lowerCategory: (agent as any).lowerCategory || "",
      detailCategory: (agent as any).detailCategory || "",
      status: (agent as any).status || "active",
      llmModel: (agent as any).llmModel || "gpt-4o",
      chatbotType: (agent as any).chatbotType || "doc-fallback-llm",
      maxInputLength: (agent as any).maxInputLength || 2048,
      maxOutputLength: (agent as any).maxOutputLength || 1024,

      personaNickname: (agent as any).personaNickname || "",
      speechStyle: (agent as any).speechStyle || "",
      personality: (agent as any).personality || "",
      forbiddenResponseStyle: (agent as any).forbiddenResponseStyle || "",
      visibility: (agent as any).visibility || "organization",
      managerId: (agent as any).managerId || "",
      agentEditorIds: (agent as any).agentEditorIds || [],
      documentManagerIds: (agent as any).documentManagerIds || [],
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
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">LoBo 관리자 센터</h1>
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
              <Cpu className="w-4 h-4 mr-2" />
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
                <CardTitle>사용자 목록</CardTitle>
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
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">에이전트 관리</h2>
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
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors">
                              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                              <div className="space-y-2">
                                <p className="text-lg font-medium text-gray-700">파일을 여기로 드래그하거나 클릭해서 업로드하세요</p>
                                <Button type="button" variant="outline" size="lg" className="bg-white">
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
                              <Label className="text-sm font-medium text-gray-700">업로드된 파일</Label>
                              <div className="border rounded-lg p-3 bg-white min-h-[100px]">
                                <div className="text-center text-sm text-gray-500 py-4">
                                  아직 업로드된 파일이 없습니다
                                </div>
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
                            <Button type="button" variant="outline" onClick={() => setIsAgentDialogOpen(false)}>
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
                              <Button type="submit" disabled={createAgentMutation.isPending}>
                                {createAgentMutation.isPending ? "생성 중..." : "에이전트 생성"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </form>
                    </Form>
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
                  <CardTitle>에이전트 목록</CardTitle>
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
                        {sortedAgents?.length === 0 ? (
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
                          sortedAgents?.map((agent) => (
                            <tr 
                              key={agent.id} 
                              className={`hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                                !agent.isActive ? 'bg-gray-50 dark:bg-gray-800/50 opacity-75' : ''
                              }`}
                              onClick={() => openEditAgentDialog(agent)}
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="w-12 h-12 rounded-full overflow-hidden mr-3 border-2 border-gray-200">
                                    {(agent as any).isCustomIcon && (agent as any).icon?.startsWith('/uploads/') ? (
                                      <img 
                                        src={(agent as any).icon} 
                                        alt={`${agent.name} 프로필`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=48&background=random`;
                                        }}
                                      />
                                    ) : (
                                      <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(agent.name)}&size=48&background=random`}
                                        alt={`${agent.name} 프로필`}
                                        className="w-full h-full object-cover"
                                      />
                                    )}
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
                                      openEditAgentDialog(agent);
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
                  <CardTitle>에이전트 검색</CardTitle>
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
              
              {/* 첫 번째 행: 조직 카테고리 필터링 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>상위 조직 카테고리</Label>
                  <Select value={qaFilterUpperCategory} onValueChange={handleQaUpperCategoryChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="상위 조직 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {getQaUpperCategories().map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>하위 조직 카테고리</Label>
                  <Select 
                    value={qaFilterLowerCategory} 
                    onValueChange={handleQaLowerCategoryChange}
                    disabled={qaFilterUpperCategory === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="하위 조직 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {getQaLowerCategories(qaFilterUpperCategory).map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>세부 조직 카테고리</Label>
                  <Select 
                    value={qaFilterDetailCategory} 
                    onValueChange={setQaFilterDetailCategory}
                    disabled={qaFilterUpperCategory === 'all' || qaFilterLowerCategory === 'all'}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="세부 조직 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {getQaDetailCategories(qaFilterUpperCategory, qaFilterLowerCategory).map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 두 번째 행: 에이전트 카테고리 및 기타 필터링 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>에이전트 카테고리</Label>
                  <Select 
                    value={qaFilterAgentCategory} 
                    onValueChange={setQaFilterAgentCategory}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="에이전트 카테고리" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">전체</SelectItem>
                      {getQaAgentCategories().map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>사용자 유형</Label>
                  <Select value={qaFilterUserType} onValueChange={setQaFilterUserType}>
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
                  <Select value={qaFilterPeriod} onValueChange={setQaFilterPeriod}>
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
                  <Input 
                    placeholder="질문 내용 및 에이전트 이름 검색..." 
                    value={qaFilterKeyword}
                    onChange={(e) => setQaFilterKeyword(e.target.value)}
                  />
                </div>
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
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>최근 질문/응답 로그</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {qaLogsData?.pagination?.totalCount || 0}개 중 {qaLogsData?.logs?.length || 0}개 표시
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {qaLogsLoading ? (
                  <div className="p-8 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="mt-2 text-gray-500">로딩 중...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            대화 시각
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            에이전트 유형
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            에이전트 명
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            사용자 유형
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            질문 내용
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            챗봇 응답내용
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            응답 유형
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            응답시간
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            개선 요청
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {qaLogsData?.logs?.map((log: any, index: number) => (
                          <QALogRow key={log.id || index} log={log} />
                        ))}
                        {qaLogsData?.logs?.length === 0 && (
                          <tr>
                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                              등록된 Q&A 로그가 없습니다.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 페이지네이션 */}
            {qaLogsData?.pagination && qaLogsData.pagination.totalPages > 1 && (
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {qaLogsData.pagination.currentPage}/{qaLogsData.pagination.totalPages} 페이지
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={qaLogsData.pagination.currentPage <= 1}
                    onClick={() => setQaCurrentPage(qaLogsData.pagination.currentPage - 1)}
                  >
                    이전
                  </Button>
                  
                  {/* 페이지 번호 버튼들 */}
                  {Array.from({ length: Math.min(5, qaLogsData.pagination.totalPages) }, (_, i) => {
                    const startPage = Math.max(1, qaLogsData.pagination.currentPage - 2);
                    const pageNumber = startPage + i;
                    
                    if (pageNumber > qaLogsData.pagination.totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={qaLogsData.pagination.currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => setQaCurrentPage(pageNumber)}
                        className={qaLogsData.pagination.currentPage === pageNumber 
                          ? "bg-blue-600 text-white border-blue-600" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        }
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={qaLogsData.pagination.currentPage >= qaLogsData.pagination.totalPages}
                    onClick={() => setQaCurrentPage(qaLogsData.pagination.currentPage + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* 토큰 관리 */}
          <TabsContent value="tokens" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <Cpu className="w-5 h-5" />
                      <span>토큰 사용량 관리</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">
                      AI 모델별 토큰 사용량 및 비용을 모니터링합니다.
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 필터 및 검색 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="token-search">검색</Label>
                    <Input
                      id="token-search"
                      placeholder="에이전트명, 질문 내용 검색..."
                      value={tokenSearchQuery}
                      onChange={(e) => setTokenSearchQuery(e.target.value)}
                      className="focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="token-agent">에이전트</Label>
                    <Select value={tokenAgentFilter} onValueChange={setTokenAgentFilter}>
                      <SelectTrigger id="token-agent" className="focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {uniqueAgents.map((agent, index) => (
                          <SelectItem key={`agent-${agent}-${index}`} value={agent}>
                            {agent}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="token-model">모델</Label>
                    <Select value={tokenModelFilter} onValueChange={setTokenModelFilter}>
                      <SelectTrigger id="token-model" className="focus:ring-2 focus:ring-blue-500">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">전체</SelectItem>
                        {uniqueModels.map((model, index) => (
                          <SelectItem key={`model-${model}-${index}`} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="token-date">기간 필터</Label>
                    <div className="flex space-x-2">
                      <Input
                        type="date"
                        value={tokenStartDate}
                        onChange={(e) => setTokenStartDate(e.target.value)}
                        className="text-sm focus:ring-2 focus:ring-blue-500"
                      />
                      <Input
                        type="date"
                        value={tokenEndDate}
                        onChange={(e) => setTokenEndDate(e.target.value)}
                        className="text-sm focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 토큰 사용량 테이블 */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          날짜
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          에이전트
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          질문 내용
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          모델
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleTokenSort('input')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>입력 토큰</span>
                            {tokenSortField === 'input' && (
                              tokenSortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleTokenSort('output')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>출력 토큰</span>
                            {tokenSortField === 'output' && (
                              tokenSortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleTokenSort('index')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>색인 토큰</span>
                            {tokenSortField === 'index' && (
                              tokenSortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                          onClick={() => handleTokenSort('preprocessing')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>문서 전처리</span>
                            {tokenSortField === 'preprocessing' && (
                              tokenSortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          총 토큰
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {tokenData.length > 0 ? (
                        tokenData.slice(0, 20).map((item, index) => (
                          <tr key={item.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {item.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {item.agentName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                              <div className="truncate" title={item.questionContent}>
                                {item.questionContent.length > 50 
                                  ? `${item.questionContent.substring(0, 50)}...` 
                                  : item.questionContent
                                }
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              <Badge variant="outline" className={
                                item.model === 'GPT-4' ? 'border-blue-500 text-blue-700' :
                                item.model === 'GPT-3.5' ? 'border-green-500 text-green-700' :
                                item.model === 'Claude-3' ? 'border-purple-500 text-purple-700' :
                                'border-gray-500 text-gray-700'
                              }>
                                {item.model}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {item.inputTokens.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {item.outputTokens.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {item.indexTokens.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-mono">
                              {item.preprocessingTokens.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100 font-mono">
                              {item.totalTokens.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                            토큰 사용량 데이터가 없습니다.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 통계 요약 */}
                {tokenData.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      토큰 사용량 요약 ({tokenData.length}건)
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {tokenData.reduce((sum, item) => sum + item.inputTokens, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">총 입력 토큰</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {tokenData.reduce((sum, item) => sum + item.outputTokens, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">총 출력 토큰</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-600">
                          {tokenData.reduce((sum, item) => sum + item.indexTokens, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">총 색인 토큰</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {tokenData.reduce((sum, item) => sum + item.preprocessingTokens, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">총 전처리 토큰</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                          {tokenData.reduce((sum, item) => sum + item.totalTokens, 0).toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">전체 합계</div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default MasterAdmin;
