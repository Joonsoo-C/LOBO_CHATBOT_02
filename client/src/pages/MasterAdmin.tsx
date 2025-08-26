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
import { LanguageSelector } from "@/components/LanguageSelector";
import { PaginationComponent } from "@/components/PaginationComponent";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";


// Remove hardcoded organization categories import - now using API data

import { NewCategoryDialog } from "@/components/NewCategoryDialog";
import { usePagination } from "@/hooks/usePagination";
import AgentFileUploadModal from "@/components/AgentFileUploadModal";
import IconChangeModal from "@/components/IconChangeModal";

// AgentDocumentList component
interface AgentDocumentListProps {
  agentId?: number;
}

const AgentDocumentList: React.FC<AgentDocumentListProps> = ({ agentId }) => {
  const { t } = useLanguage();
  const { data: documents, refetch } = useQuery({
    queryKey: [`/api/admin/documents`, agentId],
    enabled: !!agentId,
    refetchOnWindowFocus: true,
    refetchInterval: 5000, // 5초마다 자동 새로고침
    queryFn: async () => {
      const response = await fetch('/api/admin/documents', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    }
  });

  const { toast } = useToast();

  // 선택된 에이전트의 문서만 필터링
  const agentDocuments = useMemo(() => {
    if (!documents || !agentId) return [];
    return documents.filter((doc: any) => doc.agentId === agentId);
  }, [documents, agentId]);

  // 문서 가시성 토글 뮤테이션
  const toggleDocumentVisibilityMutation = useMutation({
    mutationFn: async ({ documentId, isVisible }: { documentId: number; isVisible: boolean }) => {
      const response = await fetch(`/api/documents/${documentId}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isVisible })
      });
      if (!response.ok) throw new Error('Failed to update document visibility');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/documents`, agentId] });
      toast({
        title: "설정 변경 완료",
        description: "문서 노출 설정이 변경되었습니다."
      });
    },
    onError: () => {
      toast({
        title: "설정 변경 실패",
        description: "문서 노출 설정 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 문서 학습 사용 토글 뮤테이션
  const toggleDocumentTrainingMutation = useMutation({
    mutationFn: async ({ documentId, isUsedForTraining }: { documentId: number; isUsedForTraining: boolean }) => {
      const response = await fetch(`/api/documents/${documentId}/training`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isUsedForTraining })
      });
      if (!response.ok) throw new Error('Failed to update document training setting');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/documents`, agentId] });
      toast({
        title: "설정 변경 완료",
        description: "문서 학습 설정이 변경되었습니다."
      });
    },
    onError: () => {
      toast({
        title: "설정 변경 실패",
        description: "문서 학습 설정 변경 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 문서-에이전트 연결 업데이트 뮤테이션
  const updateDocumentAgentConnectionsMutation = useMutation({
    mutationFn: async ({ documentId, connectedAgents }: { documentId: number; connectedAgents: number[] }) => {
      const response = await fetch(`/api/documents/${documentId}/agent-connections`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ connectedAgents })
      });
      if (!response.ok) throw new Error('Failed to update document agent connections');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/documents`] });
      toast({
        title: "에이전트 연결 완료",
        description: "선택한 에이전트들에 문서가 연결되었습니다."
      });
    },
    onError: () => {
      toast({
        title: "연결 실패",
        description: "문서와 에이전트 연결 중 오류가 발생했습니다.",
        variant: "destructive"
      });
    }
  });

  // 문서 연결된 에이전트 조회 기능 임시 비활성화 (로그인 문제 해결을 위해)

  // 파일 크기 포맷
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 날짜 포맷
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return "날짜 오류";
    }
  };

  // 문서 종류 매핑
  const getDocumentTypeBadge = (doc: any) => {
    // 사용자가 설정한 문서 종류가 있으면 사용, 없으면 파일 확장자 기준
    if (doc.type) {
      return { label: doc.type, color: 'default' };
    }
    
    // 파일 확장자 기준 자동 분류
    const extension = doc.originalName?.split('.').pop()?.toLowerCase() || '';
    switch (extension) {
      case 'pdf': return { label: 'PDF', color: 'destructive' };
      case 'doc': 
      case 'docx': return { label: 'Word', color: 'default' };
      case 'ppt': 
      case 'pptx': return { label: 'PowerPoint', color: 'secondary' };
      case 'xls': 
      case 'xlsx': return { label: 'Excel', color: 'outline' };
      case 'txt': return { label: 'Text', color: 'secondary' };
      default: return { label: '기타', color: 'outline' };
    }
  };


  // 문서 미리보기
  const handleDocumentPreview = async (doc: any) => {
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}/preview`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`미리보기 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      
      toast({
        title: "미리보기 열림",
        description: `${doc.originalName} 문서가 새 창에서 열렸습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "미리보기 실패",
        description: error instanceof Error ? error.message : "문서 미리보기 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 문서 다운로드
  const handleDocumentDownload = async (doc: any) => {
    try {
      const response = await fetch(`/api/admin/documents/${doc.id}/download`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`다운로드 실패: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = doc.originalName || doc.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "다운로드 완료",
        description: `${doc.originalName} 파일이 다운로드되었습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "다운로드 실패",
        description: error instanceof Error ? error.message : "문서 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 문서 삭제
  const handleDocumentDelete = async (doc: any) => {
    if (!confirm(`"${doc.originalName}" 문서를 삭제하시겠습니까?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/documents/${doc.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`삭제 실패: ${response.status}`);
      }
      
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents', agentId] });
      
      toast({
        title: "삭제 완료",
        description: `${doc.originalName} 문서가 삭제되었습니다.`,
      });
    } catch (error: any) {
      toast({
        title: "삭제 실패",
        description: error instanceof Error ? error.message : "문서 삭제 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-t pt-6">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-lg font-semibold">업로드된 문서 목록</Label>
        <Badge variant="outline">총 {agentDocuments.length}개</Badge>
      </div>
      
      {agentDocuments.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-sm">업로드된 문서가 없습니다</p>
          <p className="text-xs mt-1">위의 업로드 영역을 사용해서 문서를 추가하세요</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  문서명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  종류
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  크기
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  업로드 날짜
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  노출 설정
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  학습 적용
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  설정
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {agentDocuments.map((doc: any) => {
                const docType = getDocumentTypeBadge(doc);
                return (
                  <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-blue-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {doc.originalName || doc.filename}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {doc.description || '설명 없음'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={docType.color as any}>{docType.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-100">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDocumentVisibilityMutation.mutate({
                            documentId: doc.id,
                            isVisible: !doc.isVisibleToUsers
                          })}
                          disabled={toggleDocumentVisibilityMutation.isPending}
                          className="p-1"
                          title={doc.isVisibleToUsers ? "일반 사용자에게 노출됨" : "일반 사용자에게 숨김"}
                        >
                          {doc.isVisibleToUsers ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <span className="text-xs text-gray-500">
                          {doc.isVisibleToUsers ? "노출" : "비노출"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleDocumentTrainingMutation.mutate({
                            documentId: doc.id,
                            isUsedForTraining: !doc.isUsedForTraining
                          })}
                          disabled={toggleDocumentTrainingMutation.isPending}
                          className="p-1"
                          title={doc.isUsedForTraining ? "에이전트 학습에 사용됨" : "에이전트 학습에 사용 안함"}
                        >
                          {doc.isUsedForTraining ? (
                            <Brain className="w-4 h-4 text-blue-600" />
                          ) : (
                            <BrainCircuit className="w-4 h-4 text-gray-400" />
                          )}
                        </Button>
                        <span className="text-xs text-gray-500">
                          {doc.isUsedForTraining ? "학습" : "미학습"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex space-x-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="미리보기"
                          onClick={() => handleDocumentPreview(doc)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title={t('admin.download')}
                          onClick={() => handleDocumentDownload(doc)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          title="삭제" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDocumentDelete(doc)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// UserActiveAgents component
interface UserActiveAgentsProps {
  userId?: string;
  getUserRoleForAgent: (userData: any, agent: any) => string;
  getUserRoleDisplayForAgent: (userData: any, agent: any) => string;
  onAgentClick?: (agent: any) => void;
}

const UserActiveAgents: React.FC<UserActiveAgentsProps> = ({ userId, getUserRoleForAgent, getUserRoleDisplayForAgent, onAgentClick }) => {
  const { t } = useLanguage();
  const { data: userConversations, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/conversations`],
    enabled: !!userId,
  });

  const { data: userData } = useQuery({
    queryKey: [`/api/admin/users/${userId}`],
    enabled: !!userId,
  });

  console.log('UserActiveAgents - userId:', userId, 'conversations:', userConversations, 'userData:', userData);

  // 헬퍼 함수들
  const getCategoryBadgeColor = (category: string) => {
    // 에이전트 유형 뱃지는 색깔 등 시각적으로 부각시키지 않음
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  };

  const getSystemRoleInKorean = (role: string) => {
    switch (role) {
      case "user": return "일반 사용자";
      case "master_admin": return "마스터 관리자";
      case "operation_admin": return "운영 관리자";
      case "category_admin": return "카테고리 관리자";
      case "agent_admin": return "에이전트 관리자";
      case "qa_admin": return "QA 관리자";
      case "doc_admin": return "문서 관리자";
      case "external": return "외부 사용자";
      default: return "일반 사용자";
    }
  };

  const getSystemRoleBadgeColor = (role: string) => {
    switch (role) {
      case "master_admin": return "bg-red-100 text-red-800 border-red-200";
      case "operation_admin": return "bg-purple-100 text-purple-800 border-purple-200";
      case "category_admin": return "bg-blue-100 text-blue-800 border-blue-200";
      case "agent_admin": return "bg-green-100 text-green-800 border-green-200";
      case "qa_admin": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "doc_admin": return "bg-orange-100 text-orange-800 border-orange-200";
      case "external": return "bg-gray-100 text-gray-800 border-gray-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };





  if (!userId) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">사용자를 선택해주세요.</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">{t('admin.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</div>
      </div>
    );
  }

  if (!userConversations || !Array.isArray(userConversations) || userConversations.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400">사용 중인 에이전트가 없습니다.</div>
      </div>
    );
  }

  // 중복 에이전트 제거
  const uniqueConversations = userConversations.reduce((acc: any[], conversation: any) => {
    const agent = conversation.agent;
    if (!agent) return acc;
    
    // 이미 같은 에이전트가 있는지 확인
    const existingIndex = acc.findIndex(item => item.agent.id === agent.id);
    if (existingIndex === -1) {
      acc.push(conversation);
    } else {
      // 더 최근 대화로 업데이트
      if (new Date(conversation.lastMessageAt || 0) > new Date(acc[existingIndex].lastMessageAt || 0)) {
        acc[existingIndex] = conversation;
      }
    }
    return acc;
  }, []);

  return (
    <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 max-h-96 overflow-y-auto">
      <div className="space-y-3">
        {uniqueConversations.map((conversation: any, index: number) => {
          const agent = conversation.agent;
          if (!agent) return null;
          
          return (
            <div 
              key={`${agent.id}-${conversation.id}` || index} 
              className="border rounded-lg p-3 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              onClick={() => onAgentClick?.(agent)}
            >
              <div className="flex items-start space-x-3">
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                  style={{ backgroundColor: agent.backgroundColor || '#4F46E5' }}
                >
                  {agent.icon?.startsWith('/uploads') ? (
                    <img 
                      src={agent.icon} 
                      alt={agent.name}
                      className="w-8 h-8 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
                        if (fallback) fallback.style.display = 'block';
                      }}
                    />
                  ) : null}
                  <span 
                    className={`fallback-icon text-sm ${agent.icon?.startsWith('/uploads') ? 'hidden' : 'block'}`}
                    style={{ display: agent.icon?.startsWith('/uploads') ? 'none' : 'block' }}
                  >
                    {agent.icon === 'Bot' ? (
                      <Bot className="w-4 h-4" />
                    ) : agent.icon && !agent.icon.startsWith('/uploads') ? (
                      agent.icon
                    ) : (
                      agent.name?.charAt(0) || '?'
                    )}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {agent.name}
                    </h4>
                    <Badge variant="outline" className={`text-xs flex-shrink-0 ml-2 ${getCategoryBadgeColor(agent.category || agent.type)}`}>
                      {agent.category || agent.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-1">
                    {agent.description || '에이전트 설명이 없습니다.'}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getSystemRoleBadgeColor(getUserRoleForAgent(userData, agent))} font-medium`}
                    >
                      {getUserRoleDisplayForAgent(userData, agent)}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.lastMessageAt 
                        ? formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: true, locale: ko })
                        : '2025.06.27'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// UserActiveAgentsSection component with count
interface UserActiveAgentsSectionProps {
  userId?: string;
  getUserRoleForAgent: (userData: any, agent: any) => string;
  getUserRoleDisplayForAgent: (userData: any, agent: any) => string;
  onAgentClick?: (agent: any) => void;
}

const UserActiveAgentsSection: React.FC<UserActiveAgentsSectionProps> = ({ userId, getUserRoleForAgent, getUserRoleDisplayForAgent, onAgentClick }) => {
  const { data: userConversations } = useQuery({
    queryKey: [`/api/admin/users/${userId}/conversations`],
    enabled: !!userId,
  });

  // 중복 에이전트 제거하여 개수 계산
  const uniqueAgentCount = useMemo(() => {
    if (!userConversations || !Array.isArray(userConversations)) return 0;
    
    const uniqueAgents = userConversations.reduce((acc: any[], conversation: any) => {
      const agent = conversation.agent;
      if (!agent) return acc;
      
      // 이미 같은 에이전트가 있는지 확인
      const existingIndex = acc.findIndex(item => item.id === agent.id);
      if (existingIndex === -1) {
        acc.push(agent);
      }
      return acc;
    }, []);
    
    return uniqueAgents.length;
  }, [userConversations]);

  return (
    <>
      <Label className="peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-medium text-[14px]">
        사용 중인 에이전트 목록 ({uniqueAgentCount}개)
      </Label>
      <UserActiveAgents 
        userId={userId} 
        getUserRoleForAgent={getUserRoleForAgent}
        getUserRoleDisplayForAgent={getUserRoleDisplayForAgent}
        onAgentClick={onAgentClick}
      />
    </>
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
  ChevronLeft,
  ChevronRight,
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
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  HardDrive,
  Star,
  BrainCircuit,
  EyeOff,
  ImageIcon,
  Info,
  UserCog,
  Share2,
  FileUp,
  Clipboard,
  Building
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

  personality: z.string().optional(),
  additionalPrompt: z.string().optional(),
  
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
  userType: z.enum(["student", "faculty", "other"]).optional(),
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

function MasterAdmin() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // 에이전트 검색 모달 상태
  const [isAgentSearchDialogOpen, setIsAgentSearchDialogOpen] = useState(false);
  
  // 페이지네이션 상태들 - 모든 관리 목록에 동일하게 적용
  const [organizationCurrentPage, setOrganizationCurrentPage] = useState(1);
  const [userCurrentPage, setUserCurrentPage] = useState(1);
  const [agentCurrentPage, setAgentCurrentPage] = useState(1);
  const AGENTS_PER_PAGE = 15;
  const [documentCurrentPage, setDocumentCurrentPage] = useState(1);
  const [qaLogCurrentPage, setQaLogCurrentPage] = useState(1);
  const [tokenCurrentPage, setTokenCurrentPage] = useState(1);
  const [documentAgentCurrentPage, setDocumentAgentCurrentPage] = useState(1);
  const [orgTokenCurrentPage, setOrgTokenCurrentPage] = useState(1); // 조직별 토큰 사용량 목록 페이지네이션
  
  // 페이지네이션 설정 (모든 관리 섹션에 일관된 15개 항목)
  const ITEMS_PER_PAGE = 15;
  const ORG_TOKENS_PER_PAGE = 10; // 조직별 토큰 사용량 목록은 10개 항목

  // 헬퍼 함수들
  // 인덱싱 상태 매핑
  const getIndexingStatus = (doc: any) => {
    // 문서의 인덱싱 상태를 반환 (예시: id 기반으로 랜덤하게 상태 생성)
    const docId = doc.id || 0;
    const status = ['완료', '인덱싱 중', '실패'][docId % 3];
    
    const statusConfig = {
      '완료': { label: '완료', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
      '인덱싱 중': { label: '인덱싱 중', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
      '실패': { label: '실패', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    };
    
    return statusConfig[status as keyof typeof statusConfig] || statusConfig['완료'];
  };

  const getUserRoleForAgent = (userData: any, agent: any) => {
    if (!userData || !agent) return 'user';
    
    console.log('MasterAdmin getUserRoleForAgent - userData:', userData, 'agent:', agent);
    console.log('agent.managerId:', agent.managerId, 'userData.id:', userData.id, 'userData.username:', userData.username);
    
    // 마스터 관리자는 항상 마스터 관리자로 표시
    if ((userData as any).role === 'master_admin') {
      return 'master_admin';
    }
    
    // 에이전트 관리자인지 확인
    if (agent.managerId === userData.id || agent.managerId === userData.username) {
      console.log('Found agent manager match in MasterAdmin!');
      return 'agent_admin';
    }
    
    // 에이전트 편집자인지 확인
    if (agent.agentEditorIds && agent.agentEditorIds.includes(userData.id || userData.username)) {
      return 'agent_admin';
    }
    
    // 문서 관리자인지 확인
    if (agent.documentManagerIds && agent.documentManagerIds.includes(userData.id || userData.username)) {
      return 'doc_admin';
    }
    
    // 기본값은 사용자의 시스템 역할
    console.log('Falling back to user role in MasterAdmin:', (userData as any).role);
    return (userData as any).role || 'user';
  };

  const getUserRoleDisplayForAgent = (userData: any, agent: any) => {
    const role = getUserRoleForAgent(userData, agent);
    const getSystemRoleInKorean = (role: string) => {
      switch (role) {
        case "user": return "일반 사용자";
        case "master_admin": return "마스터 관리자";
        case "operation_admin": return "운영 관리자";
        case "category_admin": return "카테고리 관리자";
        case "agent_admin": return "에이전트 관리자";
        case "qa_admin": return "QA 관리자";
        case "doc_admin": return "문서 관리자";
        case "external": return "외부 사용자";
        default: return "일반 사용자";
      }
    };
    return getSystemRoleInKorean(role);
  };
  
  // 토큰 관리 상태
  const [tokenPeriodFilter, setTokenPeriodFilter] = useState("month");
  const [tokenUpperCategoryFilter, setTokenUpperCategoryFilter] = useState("all");
  const [tokenLowerCategoryFilter, setTokenLowerCategoryFilter] = useState("all");
  const [tokenDetailCategoryFilter, setTokenDetailCategoryFilter] = useState("all");
  const [tokenOrganizationNameFilter, setTokenOrganizationNameFilter] = useState("all");
  const [tokenKeywordFilter, setTokenKeywordFilter] = useState("");
  const [tokenModelFilter, setTokenModelFilter] = useState("all");
  const [tokenSortField, setTokenSortField] = useState<keyof TokenUsage>('timestamp');
  const [tokenSortDirection, setTokenSortDirection] = useState<'asc' | 'desc'>('desc');

  // 토큰 월별 캘린더 상태
  const [tokenCalendarYear, setTokenCalendarYear] = useState(new Date().getFullYear());
  const [tokenSelectedMonth, setTokenSelectedMonth] = useState<number | null>(new Date().getMonth() + 1);
  const [tokenCalendarOpen, setTokenCalendarOpen] = useState(false);

  // 토큰 정렬 함수
  const handleTokenSort = (field: string) => {
    if (tokenSortField === field) {
      if (tokenSortDirection === 'asc') {
        setTokenSortDirection('desc');
      } else {
        // 내림차순에서 기본 순서(정렬 없음)로 변경
        setTokenSortField('timestamp' as keyof TokenUsage);
        setTokenSortDirection('desc');
      }
    } else {
      setTokenSortField(field as keyof TokenUsage);
      setTokenSortDirection('asc');
    }
  };

  // 토큰 정렬 아이콘 반환 함수
  const getTokenSortIcon = (field: string) => {
    if (tokenSortField !== field) return '▭'; // 기본(중립)
    return tokenSortDirection === 'asc' ? '▲' : '▼';
  };

  // 토큰 정렬 툴팁 텍스트 반환 함수  
  const getTokenSortTooltip = (field: string, label: string) => {
    if (tokenSortField !== field) return `${label}으로 정렬`;
    if (tokenSortDirection === 'asc') return `${label} 내림차순 정렬`;
    return `${label} 정렬 해제`;
  };

  // Q&A 로그 조직 상태
  const [qaSelectedUpperCategory, setQASelectedUpperCategory] = useState('all');
  const [qaSelectedLowerCategory, setQASelectedLowerCategory] = useState('all');
  const [qaSelectedDetailCategory, setQASelectedDetailCategory] = useState('all');
  const [qaSelectedOrganizationName, setQASelectedOrganizationName] = useState('all');
  
  // Q&A 로그 추가 필터 상태
  const [qaUserTypeFilter, setQaUserTypeFilter] = useState('all');
  const [qaPeriodFilter, setQaPeriodFilter] = useState('today');
  const [qaSearchQuery, setQaSearchQuery] = useState('');
  
  // Q&A 로그 정렬 상태
  const [qaSortField, setQaSortField] = useState<string>('');
  const [qaSortDirection, setQaSortDirection] = useState<'asc' | 'desc'>('asc');

  // Q&A 로그 정렬 함수
  const handleQASort = (field: string) => {
    if (qaSortField === field) {
      if (qaSortDirection === 'asc') {
        setQaSortDirection('desc');
      } else {
        // 내림차순에서 기본 순서(정렬 없음)로 변경
        setQaSortField('');
        setQaSortDirection('asc');
      }
    } else {
      setQaSortField(field);
      setQaSortDirection('asc');
    }
  };

  // 정렬 아이콘 반환 함수
  const getSortIcon = (field: string) => {
    if (qaSortField !== field) return '▭'; // 기본(중립)
    return qaSortDirection === 'asc' ? '▲' : '▼';
  };

  // 정렬 툴팁 텍스트 반환 함수  
  const getSortTooltip = (field: string, label: string) => {
    if (qaSortField !== field) return `${label}으로 정렬`;
    if (qaSortDirection === 'asc') return `${label} 내림차순 정렬`;
    return `${label} 정렬 해제`;
  };
  
  // 질의응답 상세보기 모달 상태
  const [showQADetailModal, setShowQADetailModal] = useState(false);
  const [selectedQALog, setSelectedQALog] = useState<any>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  
  // 대화 메시지 가져오기 함수
  const fetchConversationMessages = async (conversationId: number) => {
    setLoadingMessages(true);
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      setConversationMessages(messages);
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
      setConversationMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  // 토큰 상세 모달에서 대화 메시지 가져오기
  const fetchTokenDetailMessages = async (conversationId: number) => {
    try {
      const response = await fetch(`/api/admin/conversations/${conversationId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      const messages = await response.json();
      setTokenDetailMessages(messages);
    } catch (error) {
      console.error('Error fetching token detail messages:', error);
      setTokenDetailMessages([]);
    }
  };

  // 디버깅을 위한 모달 상태 추적
  React.useEffect(() => {
    console.log('QA Modal State Changed:', { showQADetailModal, selectedQALog: !!selectedQALog });
    
    // 모달이 열리고 selectedQALog가 있을 때 메시지와 코멘트 가져오기
    if (showQADetailModal && selectedQALog?.id) {
      fetchConversationMessages(selectedQALog.id);
      loadQACommentMutation.mutate(selectedQALog.id);
    } else {
      setConversationMessages([]);
      setImprovementComment('');
    }
  }, [showQADetailModal, selectedQALog]);

  // 토큰 상세 모달 상태
  const [isTokenDetailDialogOpen, setIsTokenDetailDialogOpen] = useState(false);
  const [selectedTokenDetail, setSelectedTokenDetail] = useState<any>(null);
  const [tokenDetailMessages, setTokenDetailMessages] = useState<any[]>([]);

  // 토큰 상세 모달 상태 추적
  React.useEffect(() => {
    if (isTokenDetailDialogOpen && selectedTokenDetail?.id) {
      fetchTokenDetailMessages(selectedTokenDetail.id);
    } else {
      setTokenDetailMessages([]);
    }
  }, [isTokenDetailDialogOpen, selectedTokenDetail]);
  
  // 개선요청 및 코멘트 모달 상태
  const [improvementComment, setImprovementComment] = useState('');
  const [isLoadingComment, setIsLoadingComment] = useState(false);

  // Manager tab 상태 (에이전트 상세 모달에서 사용)
  const [currentManagerTab, setCurrentManagerTab] = useState<'agent' | 'document' | 'qa'>('agent');

  // Manager tab change handler with search state reset
  const handleManagerTabChange = (value: 'agent' | 'document' | 'qa') => {
    setCurrentManagerTab(value);
    // Reset search states when switching tabs
    setManagerSearchQuery('');
    setManagerFilterUpperCategory('all');
    setManagerFilterLowerCategory('all'); 
    setManagerFilterDetailCategory('all');
    setManagerCurrentPage(1);
  };

  // QA 개선 코멘트 관련 뮤테이션
  const saveQACommentMutation = useMutation({
    mutationFn: async ({ conversationId, comment }: { conversationId: number; comment: string }) => {
      const response = await fetch('/api/admin/qa-comments', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ conversationId, comment }),
      });
      if (!response.ok) throw new Error('Failed to save comment');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "저장 완료",
        description: "개선 요청 코멘트가 저장되었습니다.",
      });
      setImprovementComment('');
    },
    onError: (error) => {
      console.error('QA comment save error:', error);
      toast({
        title: "저장 실패",
        description: "개선 요청 코멘트 저장에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const loadQACommentMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/admin/qa-comments/${conversationId}`, {
        credentials: 'include',
      });
      if (response.status === 404) {
        return null; // 코멘트가 없는 경우
      }
      if (!response.ok) throw new Error('Failed to load comment');
      return response.json();
    },
    onSuccess: (data) => {
      if (data && data.comment) {
        setImprovementComment(data.comment);
      } else {
        setImprovementComment('');
      }
    },
    onError: (error) => {
      console.error('QA comment load error:', error);
      setImprovementComment('');
    },
  });

  // Missing state variables for QA modal functionality
  const [isDocumentDetailOpen, setIsDocumentDetailOpen] = useState(false);
  const [documentDetailData, setDocumentDetailData] = useState(null);

  // Custom user access filtering states
  const [filteredUsersForCustomAccess, setFilteredUsersForCustomAccess] = useState([]);
  const [selectedCustomUsers, setSelectedCustomUsers] = useState([]);
  const [userFilterSearchQuery, setUserFilterSearchQuery] = useState('');
  const [userFilterUpperCategory, setUserFilterUpperCategory] = useState('all');
  const [userFilterLowerCategory, setUserFilterLowerCategory] = useState('all');
  const [userFilterDetailCategory, setUserFilterDetailCategory] = useState('all');

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
      console.log('Fetching conversation logs...');
      const response = await fetch('/api/admin/conversations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Conversation logs response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Conversation logs fetch failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch conversation logs: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      console.log('Conversation logs loaded successfully:', data?.length || 0, 'conversations');
      console.log('Sample conversation log:', data?.[0]);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Messages data query for QA modal functionality
  const { data: messages } = useQuery({
    queryKey: ['/api/admin/messages'],
    queryFn: async () => {
      const response = await fetch('/api/admin/messages', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    }
  });

  // Rename conversationLogs to conversations for consistency with QA modal
  const conversations = conversationLogs;

  // 조직 카테고리 데이터 조회
  const { data: organizationCategories } = useQuery({
    queryKey: ['/api/admin/organization-categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/organization-categories', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organization categories');
      }
      return response.json();
    }
  });

  // 인기 질문 TOP 5 데이터 조회
  const { data: popularQuestions, isLoading: popularQuestionsLoading, error: popularQuestionsError } = useQuery({
    queryKey: ['/api/admin/popular-questions'],
    queryFn: async () => {
      const response = await fetch('/api/admin/popular-questions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (!response.ok) {
        console.error('Popular questions fetch failed:', response.status, response.statusText);
        throw new Error(`Failed to fetch popular questions: ${response.status}`);
      }
      const data = await response.json();
      console.log('Popular questions loaded:', data?.length || 0, 'questions');
      return data;
    },
    retry: 2,
    retryDelay: 1000,
  });





  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isNewUserDialogOpen, setIsNewUserDialogOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isAgentDialogOpen, setIsAgentDialogOpen] = useState(false);
  const [isAgentDetailDialogOpen, setIsAgentDetailDialogOpen] = useState(false);


  const [isLmsDialogOpen, setIsLmsDialogOpen] = useState(false);
  const [isUserDetailDialogOpen, setIsUserDetailDialogOpen] = useState(false);
  const [userSortField, setUserSortField] = useState<string>('name');
  const [userSortDirection, setUserSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedUniversity, setSelectedUniversity] = useState('all');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedIndividualOrganization, setSelectedIndividualOrganization] = useState('all');
  const [selectedOrgStatus, setSelectedOrgStatus] = useState('all');
  const [selectedAgentType, setSelectedAgentType] = useState('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [documentSearchQuery, setDocumentSearchQuery] = useState('');
  const [hasDocumentSearched, setHasDocumentSearched] = useState(false);
  const [isDocumentUploadDialogOpen, setIsDocumentUploadDialogOpen] = useState(false);
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState('all');
  const [isDocumentDetailDialogOpen, setIsDocumentDetailDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [isDeleteDocumentDialogOpen, setIsDeleteDocumentDialogOpen] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState('all');
  const [selectedDocumentPeriod, setSelectedDocumentPeriod] = useState('all');
  const [isNewCategoryDialogOpen, setIsNewCategoryDialogOpen] = useState(false);

  // IconChangeModal states (새로운 모달 시스템)
  const [showIconChangeModal, setShowIconChangeModal] = useState(false);
  const [selectedAgentForIconChange, setSelectedAgentForIconChange] = useState<Agent | null>(null);
  

  

  
  // 조직 편집 관련 상태
  const [isOrgCategoryEditDialogOpen, setIsOrgCategoryEditDialogOpen] = useState(false);
  const [editingOrgCategory, setEditingOrgCategory] = useState<any>(null);
  

  
  // 문서 상세 팝업 상태 - 중복 제거됨 (위에서 이미 선언됨)
  const [selectedDocumentAgents, setSelectedDocumentAgents] = useState<string[]>([]);
  const [connectedAgentsList, setConnectedAgentsList] = useState<number[]>([]);
  
  // 문서 편집 상태
  const [editingDocumentStatus, setEditingDocumentStatus] = useState<string>('active');
  const [editingDocumentType, setEditingDocumentType] = useState<string>('기타');
  const [editingDocumentDescription, setEditingDocumentDescription] = useState<string>('');
  const [editingDocumentVisibility, setEditingDocumentVisibility] = useState<boolean>(true);
  
  // 문서 상세 팝업 필터 상태
  const [selectedAgentManager, setSelectedAgentManager] = useState('');
  const [selectedAgentStatus, setSelectedAgentStatus] = useState('');
  const [tokenPeriod, setTokenPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('daily');
  const [agentSortField, setAgentSortField] = useState<string>('name');
  const [agentSortDirection, setAgentSortDirection] = useState<'asc' | 'desc'>('asc');
  const [documentSortField, setDocumentSortField] = useState<string>('name');
  const [documentSortDirection, setDocumentSortDirection] = useState<'asc' | 'desc'>('asc');
  const [organizationSortField, setOrganizationSortField] = useState<string>('upperCategory');
  const [organizationSortDirection, setOrganizationSortDirection] = useState<'asc' | 'desc'>('asc');
  
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
  const [documentVisibility, setDocumentVisibility] = useState(true);
  const [documentUploadType, setDocumentUploadType] = useState<string>('기타');
  const [documentUploadDescription, setDocumentUploadDescription] = useState<string>('');
  
  // 사용자 파일 업로드 관련 상태
  const [selectedUserFiles, setSelectedUserFiles] = useState<File[]>([]);
  const [isFileUploadDialogOpen, setIsFileUploadDialogOpen] = useState(false);
  const [isUserFileUploading, setIsUserFileUploading] = useState(false);
  const [userFileUploadProgress, setUserFileUploadProgress] = useState(0);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [sendWelcome, setSendWelcome] = useState(false);

  const userFileInputRef = useRef<HTMLInputElement>(null);
  
  // 에이전트 파일 업로드 관련 상태
  const [isAgentFileUploadModalOpen, setIsAgentFileUploadModalOpen] = useState(false);

  // Organization category upload states
  const [isOrgCategoryUploadDialogOpen, setIsOrgCategoryUploadDialogOpen] = useState(false);
  const [selectedOrgCategoryFiles, setSelectedOrgCategoryFiles] = useState<File[]>([]);
  const [isOrgCategoryUploading, setIsOrgCategoryUploading] = useState(false);
  const [orgCategoryUploadProgress, setOrgCategoryUploadProgress] = useState(0);
  const [orgOverwriteExisting, setOrgOverwriteExisting] = useState(false);

  const orgCategoryFileInputRef = useRef<HTMLInputElement>(null);
  
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agentFileInputRef = useRef<HTMLInputElement>(null);
  
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

  
  // 새 사용자 생성 폼의 동적 소속 정보 상태
  const [newUserAffiliations, setNewUserAffiliations] = useState([
    { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
  ]);

  // 사용자 편집 폼의 동적 소속 정보 상태
  const [userEditAffiliations, setUserEditAffiliations] = useState([
    { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
  ]);

  // 새 사용자 소속 정보 추가 함수 (최대 3개)
  const addNewUserAffiliation = () => {
    if (newUserAffiliations.length < 3) {
      setNewUserAffiliations(prev => [
        ...prev,
        { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
      ]);
    }
  };

  // 새 사용자 소속 정보 삭제 함수
  const removeNewUserAffiliation = (index: number) => {
    if (newUserAffiliations.length > 1) {
      setNewUserAffiliations(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 새 사용자 소속 정보 업데이트 함수
  const updateNewUserAffiliation = (index: number, field: string, value: string) => {
    setNewUserAffiliations(prev => prev.map((affiliation, i) => 
      i === index ? { ...affiliation, [field]: value } : affiliation
    ));
  };

  // 사용자 편집 소속 정보 추가 함수 (최대 3개)
  const addUserEditAffiliation = () => {
    if (userEditAffiliations.length < 3) {
      setUserEditAffiliations(prev => [
        ...prev,
        { upperCategory: '', lowerCategory: '', detailCategory: '', position: '' }
      ]);
    }
  };

  // 사용자 편집 소속 정보 삭제 함수
  const removeUserEditAffiliation = (index: number) => {
    if (userEditAffiliations.length > 1) {
      setUserEditAffiliations(prev => prev.filter((_, i) => i !== index));
    }
  };

  // 사용자 편집 소속 정보 업데이트 함수
  const updateUserEditAffiliation = (index: number, field: string, value: string) => {
    setUserEditAffiliations(prev => prev.map((affiliation, i) => 
      i === index ? { ...affiliation, [field]: value } : affiliation
    ));
  };
  
  // 관리자 검색 상태
  const [managerSearchQuery, setManagerSearchQuery] = useState('');
  const [managerFilterUpperCategory, setManagerFilterUpperCategory] = useState('all');
  const [managerFilterLowerCategory, setManagerFilterLowerCategory] = useState('all');
  const [managerFilterDetailCategory, setManagerFilterDetailCategory] = useState('all');
  const [managerFilterStatus, setManagerFilterStatus] = useState('all');
  const [managerFilterSystemRole, setManagerFilterSystemRole] = useState('all');
  const [managerCurrentPage, setManagerCurrentPage] = useState(1);
  const [managerItemsPerPage] = useState(10);

  // 관리자 검색 상태 초기화 함수
  const resetManagerSearchState = () => {
    setManagerSearchQuery('');
    setManagerFilterUpperCategory('all');
    setManagerFilterLowerCategory('all');
    setManagerFilterDetailCategory('all');
    setManagerFilterStatus('all');
    setManagerFilterSystemRole('all');
    setManagerCurrentPage(1);
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
            <SelectContent className="z-[10000]">
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
                    {t('org.select')}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              {t('admin.noQuestionData')}
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // 공유 설정 상태
  const [selectedGroups, setSelectedGroups] = useState<Array<{id: string, upperCategory: string, lowerCategory?: string, detailCategory?: string}>>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  // userFilterSearchQuery 등 중복 제거됨 (위에서 이미 선언됨)
  
  // 조직 선택 상태
  const [selectedUpperCategory, setSelectedUpperCategory] = useState<string>('');
  const [selectedLowerCategory, setSelectedLowerCategory] = useState<string>('');
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string>('');
  
  // 파일 업로드 상태
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<string>('');
  
  // 에이전트 파일 업로드 상태
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [agentDocumentType, setAgentDocumentType] = useState<string>('기타');
  const [agentDocumentDescription, setAgentDocumentDescription] = useState<string>('');
  const [agentDocumentVisible, setAgentDocumentVisible] = useState<boolean>(true);
  const [isAgentFileUploading, setIsAgentFileUploading] = useState(false);
  const [agentFileUploadProgress, setAgentFileUploadProgress] = useState(0);
  const [uploadedAgentDocuments, setUploadedAgentDocuments] = useState<{
    id: string | number;
    originalName: string;
    type: string;
    description: string;
    visible: boolean;
    uploadDate: string;
    size: number;
    status?: string;
  }[]>([]);
  
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

  // Move organization-dependent calculations after useQuery declarations

  // 레거시 상수들 (삭제된 중복 상태 변수들을 위한 호환성 유지)
  const usersPerPage = 15;

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
        case 'avgTokenUsage':
          // 평균 토큰 사용량 정렬
          const tokenUsageData = [
            { username: 'master_admin', usage: 85.2 },
            { username: 'user1082', usage: 67.3 },
            { username: 'prof001', usage: 92.4 },
            { username: 'student001', usage: 73.1 },
            { username: 'admin001', usage: 88.6 },
            { username: 'faculty001', usage: 78.9 },
            { username: 'user123', usage: 95.7 },
            { username: 'staff001', usage: 82.3 }
          ];
          aValue = tokenUsageData.find(data => data.username === a.username)?.usage || 75;
          bValue = tokenUsageData.find(data => data.username === b.username)?.usage || 75;
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return userSortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return userSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, userSortField, userSortDirection]);

  // 필터링된 사용자 목록 (검색 및 조직 필터 적용)
  const filteredSortedUsers = useMemo(() => {
    if (!sortedUsers || !hasSearched) return [];
    
    return sortedUsers.filter((user: any) => {
      const matchesSearch = !userSearchQuery || 
        user.username?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (user as any).name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchesUpperCategory = !selectedUniversity || selectedUniversity === 'all' || 
        (user as any).upperCategory === selectedUniversity;
      const matchesLowerCategory = !selectedCollege || selectedCollege === 'all' || 
        (user as any).lowerCategory === selectedCollege;
      const matchesDetailCategory = !selectedDepartment || selectedDepartment === 'all' || 
        (user as any).detailCategory === selectedDepartment;
      
      return matchesSearch && matchesUpperCategory && matchesLowerCategory && matchesDetailCategory;
    });
  }, [sortedUsers, hasSearched, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment]);

  // 사용자 페이지네이션 계산
  const totalUserPages = Math.ceil(filteredSortedUsers.length / ITEMS_PER_PAGE);
  const userStartIndex = (userCurrentPage - 1) * ITEMS_PER_PAGE;
  const userEndIndex = userStartIndex + ITEMS_PER_PAGE;
  const paginatedUsers = filteredSortedUsers.slice(userStartIndex, userEndIndex);

  // 사용자 데이터가 로드되면 자동으로 검색 상태를 true로 설정
  React.useEffect(() => {
    if (users && users.length > 0 && !hasSearched) {
      setHasSearched(true);
    }
  }, [users, hasSearched]);

  // 문서 상세 팝업이 열릴 때 기존 연결된 에이전트들 로드 - 안전한 방식으로 처리
  React.useEffect(() => {
    if (documentDetailData) {
      // 문서 상세 팝업이 처음 열릴 때 빈 배열로 초기화
      setConnectedAgentsList([]);
    }
  }, [documentDetailData]);

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

      // 사용자 정보 생성 (실제 사용자 중 랜덤 선택)
      const userIndex = index % (users?.length || 1);
      const selectedUser = users?.[userIndex] || users?.[0];
      
      tokenData.push({
        id: index + 1, // For conversation lookup
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
        // 기본 정보 섹션용 추가 필드들
        userName: selectedUser ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.username : '사용자',
        userUpperCategory: selectedUser?.upperCategory || org?.upperCategory || '대학본부',
        userLowerCategory: selectedUser?.lowerCategory || org?.lowerCategory || '총장실',
        userDetailCategory: selectedUser?.detailCategory || org?.detailCategory || '총장비서실',
        llmModel: model,
        responseTime: ((index * 137) % 240 + 10) / 100, // 0.1 ~ 2.5초 일관된 응답시간
        estimatedCost: Math.round((inputTokens + outputTokens + indexTokens + preprocessingTokens) * 0.087)
      });
    });

    return tokenData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [agents, organizations, users]);

  // 토큰 데이터 필터링
  const filteredTokenData = useMemo(() => {
    let filtered = [...sampleTokenData];

    // 기간 필터링 (캘린더 선택 월 우선)
    const now = new Date();
    
    if (tokenSelectedMonth && tokenCalendarYear) {
      // 캘린더에서 특정 월을 선택한 경우
      const startDate = new Date(tokenCalendarYear, tokenSelectedMonth - 1, 1);
      const endDate = new Date(tokenCalendarYear, tokenSelectedMonth, 0);
      filtered = filtered.filter(token => {
        const tokenDate = new Date(token.timestamp);
        return tokenDate >= startDate && tokenDate <= endDate;
      });
    } else {
      // 기본 기간 필터링
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

    // 조직명 필터링 (임시: organizationName 속성이 없으므로 빈 구현)
    if (tokenOrganizationNameFilter !== 'all') {
      // 토큰 데이터에 조직명 속성이 없으므로 임시로 모든 데이터를 통과시킴
      // 실제 구현시에는 토큰 데이터에 organizationName 필드를 추가하거나
      // agent와 organization 데이터를 조인해서 필터링해야 함
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
    if (tokenSortField && tokenSortField !== 'timestamp') {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (tokenSortField) {
          case 'timestamp':
            aValue = new Date(a.timestamp);
            bValue = new Date(b.timestamp);
            break;
          case 'agentName':
            aValue = a.agentName || '';
            bValue = b.agentName || '';
            break;
          case 'question':
            aValue = a.question || '';
            bValue = b.question || '';
            break;
          default:
            aValue = a[tokenSortField as keyof TokenUsage];
            bValue = b[tokenSortField as keyof TokenUsage];
            break;
        }
        
        // 숫자 정렬
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return tokenSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // 날짜 정렬
        if (aValue instanceof Date && bValue instanceof Date) {
          return tokenSortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }
        
        // 문자열 정렬
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (tokenSortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }
        
        return 0;
      });
    }

    return filtered;
  }, [sampleTokenData, tokenPeriodFilter, tokenSelectedMonth, tokenCalendarYear, tokenUpperCategoryFilter, tokenLowerCategoryFilter, tokenDetailCategoryFilter, tokenOrganizationNameFilter, tokenKeywordFilter, tokenModelFilter, tokenSortField, tokenSortDirection]);

  // 종량제 필터링 및 드릴다운 상태
  const [tokenDrilldownTab, setTokenDrilldownTab] = useState('tokens');
  const [userRiskFilter, setUserRiskFilter] = useState('all');
  const [orgRiskFilter, setOrgRiskFilter] = useState('all');
  const [selectedOrgForDrilldown, setSelectedOrgForDrilldown] = useState('');

  // 토큰 한도 설정 팝업 상태
  const [showTokenLimitModal, setShowTokenLimitModal] = useState(false);
  const [selectedOrgForTokenLimit, setSelectedOrgForTokenLimit] = useState<any>(null);
  const [tokenLimitSettings, setTokenLimitSettings] = useState({
    monthlyLimit: ''
  });

  // 사용량 위험 통계 계산 (샘플 데이터)
  const usageRiskStats = useMemo(() => {
    // 실제 구현에서는 사용자별 한도/사용량 데이터를 기반으로 계산
    const sampleUserUsageData = [
      { userId: 'user1', limit: 100000, used: 95000, org: '총장비서실' },
      { userId: 'user2', limit: 80000, used: 72000, org: '기획예산팀' },
      { userId: 'user3', limit: 120000, used: 125000, org: '홍보팀' },
      { userId: 'user4', limit: 90000, used: 78000, org: '교무팀' },
      { userId: 'user5', limit: 110000, used: 105000, org: '학생지원팀' },
    ];

    // 위험 구간 계산 (80-89%=경고, 90-99%=높음, ≥100%=초과)
    const riskStudents = sampleUserUsageData.reduce((acc, user) => {
      const usagePercent = (user.used / user.limit) * 100;
      if (usagePercent >= 100) acc.over++;
      else if (usagePercent >= 90) acc.high++;
      else if (usagePercent >= 80) acc.warning++;
      return acc;
    }, { warning: 0, high: 0, over: 0, total: 0 });
    riskStudents.total = riskStudents.warning + riskStudents.high + riskStudents.over;

    // 조직별 위험도 계산 (샘플)
    const riskOrganizations = { warning: 2, high: 1, over: 1, total: 4 };

    // 월말 초과 예상 (단순 추정)
    const monthEndPrediction = { students: 8, organizations: 3 };

    // 잔여 한도 10% 이하 (사용률 90% 이상)
    const criticalUsers = sampleUserUsageData.filter(user => (user.used / user.limit) >= 0.9).length;

    return {
      riskStudents,
      riskOrganizations,
      monthEndPrediction,
      criticalUsers
    };
  }, []);

  // 조직별 사용률 Top 5
  const topOrganizationsByUsage = useMemo(() => {
    // 실제 구현에서는 조직별 집계 데이터 사용
    return [
      { name: '홍보팀', usagePercent: 104.2, totalUsers: 5, totalUsed: 521000, totalLimit: 500000 },
      { name: '기획예산팀', usagePercent: 97.8, totalUsers: 8, totalUsed: 782400, totalLimit: 800000 },
      { name: '교무팀', usagePercent: 89.5, totalUsers: 12, totalUsed: 1074000, totalLimit: 1200000 },
      { name: '학생지원팀', usagePercent: 86.7, totalUsers: 10, totalUsed: 867000, totalLimit: 1000000 },
      { name: '총장비서실', usagePercent: 78.4, totalUsers: 3, totalUsed: 235200, totalLimit: 300000 }
    ].sort((a, b) => b.usagePercent - a.usagePercent);
  }, []);

  // 한도 초과 조직 Top 5
  const overLimitOrganizations = useMemo(() => {
    return [
      { name: '홍보팀', overLimitUsers: 3, totalUsers: 5, totalOverage: 21000 },
      { name: '연구지원팀', overLimitUsers: 2, totalUsers: 6, totalOverage: 15000 },
      { name: '대외협력팀', overLimitUsers: 1, totalUsers: 4, totalOverage: 8500 },
      { name: 'IT지원팀', overLimitUsers: 2, totalUsers: 8, totalOverage: 12000 },
      { name: '인사팀', overLimitUsers: 1, totalUsers: 5, totalOverage: 5200 }
    ].sort((a, b) => b.totalOverage - a.totalOverage);
  }, []);

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

  // Q&A 로그 분석 데이터 계산
  const qaAnalyticsData = useMemo(() => {
    // 최다 질문 에이전트 TOP3 (샘플 데이터)
    const topAgents = [
      { id: 1, name: '정수빈 교수의 현대 문학', icon: '📚', questionCount: 892, category: '학교' },
      { id: 2, name: '학사 일정 안내', icon: '📅', questionCount: 756, category: '학교' },
      { id: 3, name: '수강신청 도우미', icon: '📝', questionCount: 634, category: '기능' }
    ];

    // 학교 에이전트의 질의응답만 필터링
    const schoolAgentLogs = conversationLogs?.filter(log => log.agentCategory === '학교') || [];
    
    // 기간 필터 적용
    const now = new Date();
    const filteredLogs = schoolAgentLogs.filter(log => {
      const logDate = new Date(log.lastMessageAt || log.createdAt);
      switch (qaPeriodFilter) {
        case 'today':
          return logDate.toDateString() === now.toDateString();
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return logDate >= weekAgo;
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return logDate >= monthAgo;
        default:
          return true;
      }
    });

    // 메시지에서 키워드 추출 (사용자 메시지만)
    const userMessages = filteredLogs.flatMap(log => 
      (log.messages || []).filter(msg => msg.isFromUser).map(msg => msg.content)
    );

    // 간단한 키워드 추출 (한국어 단어 기준)
    const keywordCount: { [key: string]: number } = {};
    const commonKeywords = ['수강신청', '졸업요건', '학점인정', '등록금', '장학금', '기숙사', '교환학생', '학회활동', '연구실', '학과사무실', '과제', '시험', '성적', '휴학', '복학', '전과', '취업', '인턴십'];
    
    userMessages.forEach(message => {
      commonKeywords.forEach(keyword => {
        if (message.includes(keyword)) {
          keywordCount[keyword] = (keywordCount[keyword] || 0) + 1;
        }
      });
    });

    // 인기 질문 주제 TOP10 (전체 질문에서 주제 추출)
    const popularTopics = Object.entries(keywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ topic: keyword, count }));

    // 신규 질문 주제 (기간별 새로운 주제들)
    const recentLogs = schoolAgentLogs.filter(log => {
      const logDate = new Date(log.lastMessageAt || log.createdAt);
      const recentPeriod = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 최근 1주일
      return logDate >= recentPeriod;
    });

    const recentMessages = recentLogs.flatMap(log => 
      (log.messages || []).filter(msg => msg.isFromUser).map(msg => msg.content)
    );

    const recentKeywordCount: { [key: string]: number } = {};
    recentMessages.forEach(message => {
      commonKeywords.forEach(keyword => {
        if (message.includes(keyword)) {
          recentKeywordCount[keyword] = (recentKeywordCount[keyword] || 0) + 1;
        }
      });
    });

    const newTopics = Object.entries(recentKeywordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ topic: keyword, count, isNew: true }));

    return {
      topAgents,
      popularTopics,
      newTopics
    };
  }, [conversationLogs, qaPeriodFilter]);

  // 토큰 데이터 페이지네이션 (통일된 15개 항목 페이지네이션)
  const tokenTotalPages = Math.ceil(filteredTokenData.length / ITEMS_PER_PAGE);
  const tokenStartIndex = (tokenCurrentPage - 1) * ITEMS_PER_PAGE;
  const tokenEndIndex = tokenStartIndex + ITEMS_PER_PAGE;
  const paginatedTokenData = filteredTokenData.slice(tokenStartIndex, tokenEndIndex);

  // filteredUsers 별칭 정의 (기존 코드 호환성을 위해)
  const filteredUsers = filteredSortedUsers;

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
      
      // 상태 필터링
      const matchesStatus = managerFilterStatus === "all" || 
        (managerFilterStatus === "active" && (user as any).status === "활성") ||
        (managerFilterStatus === "inactive" && (user as any).status === "비활성");
      
      // 시스템 역할 필터링
      const matchesSystemRole = managerFilterSystemRole === "all" || 
        (user as any).systemRole === managerFilterSystemRole;
      
      return matchesSearch && matchesUpper && matchesLower && matchesDetail && matchesStatus && matchesSystemRole;
    });
  }, [allManagers, managerSearchQuery, managerFilterUpperCategory, managerFilterLowerCategory, managerFilterDetailCategory, managerFilterStatus, managerFilterSystemRole]);

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

  // 업로드된 조직 파일 목록 조회
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

  // 토큰 필터용 조직명 목록
  const filteredTokenOrganizationNames = useMemo(() => {
    if (tokenUpperCategoryFilter === 'all' || tokenLowerCategoryFilter === 'all' || tokenDetailCategoryFilter === 'all') {
      return [];
    }
    let filtered = organizations || [];
    if (tokenUpperCategoryFilter !== 'all') {
      filtered = filtered.filter(org => org.upperCategory === tokenUpperCategoryFilter);
    }
    if (tokenLowerCategoryFilter !== 'all') {
      filtered = filtered.filter(org => org.lowerCategory === tokenLowerCategoryFilter);
    }
    if (tokenDetailCategoryFilter !== 'all') {
      filtered = filtered.filter(org => org.detailCategory === tokenDetailCategoryFilter);
    }
    const names = Array.from(new Set(filtered.map(org => org.name).filter(Boolean)));
    return names.sort();
  }, [tokenUpperCategoryFilter, tokenLowerCategoryFilter, tokenDetailCategoryFilter, organizations]);

  // Q&A 로그 섹션 전용 조직 필터링 로직
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

  const qaFilteredOrganizationNames = useMemo(() => {
    if (qaSelectedDetailCategory === 'all') {
      if (qaSelectedUpperCategory === 'all' && qaSelectedLowerCategory === 'all') {
        const names = Array.from(new Set((organizations || []).map(org => org.name).filter(Boolean)));
        return names.sort();
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
    if (qaSelectedDetailCategory !== 'all') {
      filtered = filtered.filter(org => org.detailCategory === qaSelectedDetailCategory);
    }
    const names = Array.from(new Set(filtered.map(org => org.name).filter(Boolean)));
    return names.sort();
  }, [qaSelectedUpperCategory, qaSelectedLowerCategory, qaSelectedDetailCategory, organizations]);

  // Q&A 로그 완전한 필터링 로직
  const filteredConversationLogs = useMemo(() => {
    if (!conversationLogs) {
      console.log('No conversationLogs data');
      return [];
    }
    
    console.log('Total conversationLogs:', conversationLogs.length);
    console.log('Sample conversation log:', conversationLogs[0]);
    let filtered = [...conversationLogs];
    
    // 임시로 모든 대화 표시 (디버그용)
    console.log('All conversations loaded, no initial filtering');
    // filtered = filtered.filter(log => 
    //   log.messageCount && log.messageCount > 0
    // );
    
    // 검색어 필터링
    if (qaSearchQuery.trim()) {
      const query = qaSearchQuery.toLowerCase();
      filtered = filtered.filter(log => 
        (log.lastUserMessage && log.lastUserMessage.toLowerCase().includes(query)) ||
        (log.agentName && log.agentName.toLowerCase().includes(query)) ||
        (log.userName && log.userName.toLowerCase().includes(query))
      );
    }
    
    // 기간 필터링
    const now = new Date();
    switch (qaPeriodFilter) {
      case 'today':
        filtered = filtered.filter(log => {
          const logDate = new Date(log.lastMessageAt || log.updatedAt);
          return logDate.toDateString() === now.toDateString();
        });
        break;
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(log => {
          const logDate = new Date(log.lastMessageAt || log.updatedAt);
          return logDate >= weekAgo;
        });
        break;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(log => {
          const logDate = new Date(log.lastMessageAt || log.updatedAt);
          return logDate >= monthAgo;
        });
        break;
      case 'quarter':
        const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(log => {
          const logDate = new Date(log.lastMessageAt || log.updatedAt);
          return logDate >= quarterAgo;
        });
        break;
    }
    
    // 사용자 유형 필터링
    if (qaUserTypeFilter !== 'all') {
      filtered = filtered.filter(log => {
        const userType = log.userType?.toLowerCase() || '';
        const position = log.userPosition?.toLowerCase() || '';
        switch (qaUserTypeFilter) {
          case 'student':
            return userType === 'student' || position.includes('학생') || position.includes('대학원생') || position.includes('학부생');
          case 'faculty':
            return userType === 'faculty' || position.includes('교수') || position.includes('직원') || position.includes('연구원');
          case 'admin':
            return userType.includes('admin') || position.includes('관리자') || position.includes('마스터');
          default:
            return true;
        }
      });
    }
    
    // 상위 조직 필터링
    if (qaSelectedUpperCategory !== 'all') {
      filtered = filtered.filter(log => log.upperCategory === qaSelectedUpperCategory);
    }
    
    // 하위 조직 필터링
    if (qaSelectedLowerCategory !== 'all') {
      filtered = filtered.filter(log => log.lowerCategory === qaSelectedLowerCategory);
    }
    
    // 세부 조직 필터링
    if (qaSelectedDetailCategory !== 'all') {
      filtered = filtered.filter(log => log.detailCategory === qaSelectedDetailCategory);
    }
    
    // 조직명 필터링
    if (qaSelectedOrganizationName !== 'all') {
      filtered = filtered.filter(log => {
        // 조직 카테고리 데이터에서 해당 조직명 찾기
        const organization = organizationCategories?.find(org => org.name === qaSelectedOrganizationName);
        if (organization) {
          return log.upperCategory === organization.upperCategory &&
                 log.lowerCategory === organization.lowerCategory &&
                 log.detailCategory === organization.detailCategory;
        }
        return false;
      });
    }
    
    // Q&A 로그 정렬 적용
    if (qaSortField) {
      filtered.sort((a: any, b: any) => {
        let aValue: any;
        let bValue: any;
        
        switch (qaSortField) {
          case 'responseMethod':
            // 응답 방식 그룹별 정렬: 문서만(우선) -> 문서 우선 + LLM -> LLM 우선
            const responseTypes = ['문서 우선 + LLM', 'LLM 우선', '문서만'];
            const aMethodIndex = (a.id || 1) % 3;
            const bMethodIndex = (b.id || 1) % 3;
            aValue = responseTypes[aMethodIndex];
            bValue = responseTypes[bMethodIndex];
            // 같은 그룹끼리 정렬하기 위해 우선순위 부여
            const methodPriority = { '문서만': 0, '문서 우선 + LLM': 1, 'LLM 우선': 2 };
            aValue = methodPriority[aValue as keyof typeof methodPriority];
            bValue = methodPriority[bValue as keyof typeof methodPriority];
            break;
          case 'responseStatus':
            // 응답 상태 그룹별 정렬: 성공(우선) -> 실패
            const aHasResponse = a.lastUserMessage && a.messageCount > 1;
            const bHasResponse = b.lastUserMessage && b.messageCount > 1;
            aValue = aHasResponse ? 0 : 1; // 성공=0 (우선), 실패=1
            bValue = bHasResponse ? 0 : 1;
            break;
          case 'responseTime':
            // 응답시간 수치별 정렬 (0.1초 ~ 2.5초)
            const aSeed = a.id || 1;
            const bSeed = b.id || 1;
            aValue = ((aSeed * 137) % 240 + 10) / 100; // 0.1 ~ 2.5초
            bValue = ((bSeed * 137) % 240 + 10) / 100;
            break;
          case 'createdAt':
            // 대화 시작 시각별 정렬
            aValue = new Date(a.createdAt || 0);
            bValue = new Date(b.createdAt || 0);
            break;
          case 'agentName':
            // 에이전트명별 정렬
            aValue = a.agentName || '';
            bValue = b.agentName || '';
            break;
          default:
            return 0;
        }
        
        // 문자열 정렬
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (qaSortDirection === 'asc') {
            return aValue.localeCompare(bValue);
          } else {
            return bValue.localeCompare(aValue);
          }
        }
        
        // 숫자 정렬
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return qaSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // 날짜 정렬
        if (aValue instanceof Date && bValue instanceof Date) {
          return qaSortDirection === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
        }
        
        return 0;
      });
    }
    
    console.log('Filtered conversationLogs:', filtered.length);
    return filtered;
  }, [conversationLogs, qaSearchQuery, qaPeriodFilter, qaUserTypeFilter, qaSelectedUpperCategory, qaSelectedLowerCategory, qaSelectedDetailCategory, qaSortField, qaSortDirection]);

  // 필터된 조직 목록 (실시간 필터링) - API 데이터 사용
  const filteredOrganizationCategories = useMemo(() => {
    if (!organizations || organizations.length === 0) return [];
    
    let filtered = [...organizations];
    
    
    // 검색어 필터링
    if (userSearchQuery.trim()) {
      const query = userSearchQuery.toLowerCase();
      filtered = filtered.filter(category => 
        (category.upperCategory && category.upperCategory.toLowerCase().includes(query)) ||
        (category.lowerCategory && category.lowerCategory.toLowerCase().includes(query)) ||
        (category.detailCategory && category.detailCategory.toLowerCase().includes(query)) ||
        (category.name && category.name.toLowerCase().includes(query))
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
    
    // 상태 필터링
    if (selectedOrgStatus !== 'all') {
      filtered = filtered.filter(category => 
        category.status === selectedOrgStatus
      );
    }
    
    // 정렬 적용
    filtered.sort((a: any, b: any) => {
      let aValue: any;
      let bValue: any;
      
      switch (organizationSortField) {
        case 'upperCategory':
          aValue = a.upperCategory || '';
          bValue = b.upperCategory || '';
          break;
        case 'lowerCategory':
          aValue = a.lowerCategory || '';
          bValue = b.lowerCategory || '';
          break;
        case 'detailCategory':
          aValue = a.detailCategory || '';
          bValue = b.detailCategory || '';
          break;
        case 'personnelCount':
          // 소속 인원 수 (랜덤하지만 일관된 값 생성)
          aValue = a.detailCategory ? Math.floor(Math.random() * 300) + 50 : Math.floor(Math.random() * 5000) + 1000;
          bValue = b.detailCategory ? Math.floor(Math.random() * 300) + 50 : Math.floor(Math.random() * 5000) + 1000;
          break;
        case 'agentCount':
          // 에이전트 수 (랜덤하지만 일관된 값 생성)
          aValue = Math.floor(Math.random() * 10) + 1;
          bValue = Math.floor(Math.random() * 10) + 1;
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        default:
          aValue = a.upperCategory || '';
          bValue = b.upperCategory || '';
      }
      
      // 문자열 비교
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue, 'ko');
        return organizationSortDirection === 'asc' ? comparison : -comparison;
      }
      
      // 숫자 비교
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return organizationSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });
    
    return filtered;
  }, [organizations, userSearchQuery, selectedUniversity, selectedCollege, selectedDepartment, selectedOrgStatus, organizationSortField, organizationSortDirection]);

  // Organization categories pagination state
  const [orgCategoriesCurrentPage, setOrgCategoriesCurrentPage] = useState(1);

  // Organization categories pagination calculations (통일된 15개 항목 페이지네이션)
  const totalOrgCategoriesPages = Math.ceil((filteredOrganizationCategories?.length || 0) / ITEMS_PER_PAGE);
  const organizationCategoriesStartIndex = (orgCategoriesCurrentPage - 1) * ITEMS_PER_PAGE;
  const organizationCategoriesEndIndex = organizationCategoriesStartIndex + ITEMS_PER_PAGE;
  const paginatedOrganizationCategories = filteredOrganizationCategories?.slice(organizationCategoriesStartIndex, organizationCategoriesEndIndex) || [];

  // 검색 실행 함수
  const executeSearch = () => {
    setHasSearched(true);
    setUserCurrentPage(1); // 검색 시 첫 페이지로 이동
    setOrgCategoriesCurrentPage(1); // 조직 페이지도 리셋
  };

  // 필터 초기화 함수
  const resetFilters = () => {
    setSelectedUniversity('all');
    setSelectedCollege('all');
    setSelectedDepartment('all');
    setSelectedOrgStatus('all'); // 상태 필터 초기화
    setSelectedDocumentType('all'); // 상태 필터 초기화
    setSelectedDocumentPeriod('all'); // 시스템 역할 필터 초기화
    setSelectedAgentType('all'); // 유형 필터 초기화
    setUserSearchQuery('');
    setHasSearched(false);
    setUserCurrentPage(1); // 필터 초기화 시 첫 페이지로 이동
    setOrgCategoriesCurrentPage(1); // 조직 페이지도 리셋
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

  // 조직 편집 폼 초기화
  const orgCategoryEditForm = useForm<OrgCategoryEditFormData>({
    resolver: zodResolver(orgCategoryEditSchema),
    defaultValues: {
      name: "",
      upperCategory: "",
      lowerCategory: "",
      detailCategory: "",
      description: "",
      status: "활성",
    },
  });

  // 사용자 상세 정보 편집 열기
  const openUserDetailDialog = (user: User) => {
    console.log('Opening user detail dialog for user:', user);
    setSelectedUser(user);
    userEditForm.reset({
      name: (user as any).name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email || "",
      userType: (user as any).userType || "student",
      upperCategory: (user as any).upperCategory || "none",
      lowerCategory: (user as any).lowerCategory || "",
      detailCategory: (user as any).detailCategory || "",
      position: (user as any).position || "",
      role: (user.role as any) || "user",
      status: (user as any).status || "active",
    });
    
    // 사용자 편집 소속 정보 초기화
    setUserEditAffiliations([{
      upperCategory: (user as any).upperCategory || "",
      lowerCategory: (user as any).lowerCategory || "",
      detailCategory: (user as any).detailCategory || "",
      position: (user as any).position || ""
    }]);
    
    console.log('Selected user set to:', user);
    setIsUserDetailDialogOpen(true);
  };

  // 사용자 편집 뮤테이션
  const updateUserMutation = useMutation({
    mutationFn: async (data: UserEditFormData & { id: string }) => {
      const payload = {
        name: data.name,
        email: data.email || null,
        userType: data.userType,
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

  // 조직 편집 열기
  const openOrgCategoryEditDialog = (category: any) => {
    setEditingOrgCategory(category);
    orgCategoryEditForm.reset({
      name: category.name || category.detailCategory || "",
      upperCategory: category.upperCategory || "",
      lowerCategory: category.lowerCategory || "",
      detailCategory: category.detailCategory || "",
      description: category.description || "",
      status: category.status || "활성",
    });
    setIsOrgCategoryEditDialogOpen(true);
  };

  // 조직 편집 뮤테이션
  const updateOrgCategoryMutation = useMutation({
    mutationFn: async (data: OrgCategoryEditFormData & { id: number }) => {
      const updatePayload = {
        name: data.name,
        upperCategory: data.upperCategory || null,
        lowerCategory: data.lowerCategory || null,
        detailCategory: data.detailCategory || null,
        description: data.description || null,
        status: data.status,
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

  // Q&A 로그 조직 핸들러 함수들
  const handleQAUpperCategoryChange = (value: string) => {
    setQASelectedUpperCategory(value);
    setQASelectedLowerCategory('all');
    setQASelectedDetailCategory('all');
    setQASelectedOrganizationName('all');
  };

  const handleQALowerCategoryChange = (value: string) => {
    setQASelectedLowerCategory(value);
    setQASelectedDetailCategory('all');
    setQASelectedOrganizationName('all');
  };

  const handleQADetailCategoryChange = (value: string) => {
    setQASelectedDetailCategory(value);
    setQASelectedOrganizationName('all'); // 세부 조직 변경 시 조직명 초기화
  };

  const handleQAOrganizationNameChange = (value: string) => {
    setQASelectedOrganizationName(value);
  };

  // Q&A 로그 필터 초기화 함수
  const resetQAFilters = () => {
    setQASelectedUpperCategory('all');
    setQASelectedLowerCategory('all');
    setQASelectedDetailCategory('all');
    setQASelectedOrganizationName('all');
    setQaUserTypeFilter('all');
    setQaPeriodFilter('today');
    setQaSearchQuery('');
    setQaLogCurrentPage(1); // 페이지 리셋
  };

  // 기간 필터에 따른 날짜 범위 계산
  const calculateDateRange = (periodFilter: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    switch (periodFilter) {
      case 'today':
        return {
          start: today,
          end: today,
          isRange: false
        };
      case 'week':
        const weekStart = new Date(year, month, date - 6);
        return {
          start: weekStart,
          end: today,
          isRange: true
        };
      case 'month':
        const monthStart = new Date(year, month - 1, date);
        return {
          start: monthStart,
          end: today,
          isRange: true
        };
      case 'quarter':
        const quarterStart = new Date(year, month - 3, date);
        return {
          start: quarterStart,
          end: today,
          isRange: true
        };
      default:
        return {
          start: today,
          end: today,
          isRange: false
        };
    }
  };

  // 날짜를 YYYY.MM.DD 형식으로 포맷
  const formatDateForPill = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 기간 필터 pill 텍스트 생성
  const getPeriodPillText = () => {
    const { start, end, isRange } = calculateDateRange(qaPeriodFilter);
    
    if (!isRange) {
      return formatDateForPill(start);
    }
    
    return `${formatDateForPill(start)} ~ ${formatDateForPill(end)}`;
  };

  // 토큰용 기간 필터 pill 텍스트 생성
  const getTokenPeriodPillText = () => {
    if (tokenSelectedMonth && tokenCalendarYear) {
      const currentDate = new Date();
      const selectedDate = new Date(tokenCalendarYear, tokenSelectedMonth - 1, 1);
      const isCurrentMonth = selectedDate.getMonth() === currentDate.getMonth() && 
                            selectedDate.getFullYear() === currentDate.getFullYear();
      
      if (isCurrentMonth) {
        // 현재 월인 경우: 1일부터 오늘까지
        const startDate = new Date(tokenCalendarYear, tokenSelectedMonth - 1, 1);
        return `${formatDateForPill(startDate)} ~ ${formatDateForPill(currentDate)}`;
      } else {
        // 특정 월인 경우: 해당 월의 1일부터 마지막 날까지
        const startDate = new Date(tokenCalendarYear, tokenSelectedMonth - 1, 1);
        const endDate = new Date(tokenCalendarYear, tokenSelectedMonth, 0); // 해당 월의 마지막 날
        return `${formatDateForPill(startDate)} ~ ${formatDateForPill(endDate)}`;
      }
    }
    
    const { start, end, isRange } = calculateDateRange(tokenPeriodFilter);
    
    if (!isRange) {
      return formatDateForPill(start);
    }
    
    return `${formatDateForPill(start)} ~ ${formatDateForPill(end)}`;
  };

  // 선택된 월과 조직 카테고리에 따른 요약 카드 텍스트 생성
  const getTokenCardText = () => {
    // 조직 카테고리 필터 상태 확인
    const hasUpperFilter = tokenUpperCategoryFilter !== 'all';
    const hasLowerFilter = tokenLowerCategoryFilter !== 'all';
    const hasDetailFilter = tokenDetailCategoryFilter !== 'all';
    
    // 선택된 조직 카테고리 이름 생성
    const getOrgCategoryText = () => {
      if (hasDetailFilter) {
        return tokenDetailCategoryFilter;
      } else if (hasLowerFilter) {
        return tokenLowerCategoryFilter;
      } else if (hasUpperFilter) {
        return tokenUpperCategoryFilter;
      }
      return '';
    };
    
    const orgCategoryText = getOrgCategoryText();
    const isFiltered = hasUpperFilter || hasLowerFilter || hasDetailFilter;
    
    if (tokenSelectedMonth && tokenCalendarYear) {
      const currentDate = new Date();
      const selectedDate = new Date(tokenCalendarYear, tokenSelectedMonth - 1, 1);
      const isCurrentMonth = selectedDate.getMonth() === currentDate.getMonth() && 
                            selectedDate.getFullYear() === currentDate.getFullYear();
      
      if (isCurrentMonth) {
        return {
          dailyAverage: isFiltered ? `${orgCategoryText} 토큰 소비량 일일 평균` : "토큰 소비량 일일 평균",
          monthlyPredicted: isFiltered ? `${orgCategoryText} 이번 달 예상 토큰 소비량` : "이번 달 예상 토큰 소비량",
          shortageOrganizations: isFiltered ? `${orgCategoryText} 토큰 부족 예상 조직` : "이번 달 토큰 부족 예상 조직",
          shortageUsers: isFiltered ? `${orgCategoryText} 토큰 부족 예상 사용자` : "이번 달 토큰 부족 예상 사용자",
          dailyAverageDescription: isFiltered ? `${orgCategoryText} 최근 30일 평균 기준` : "최근 30일 평균 기준",
          monthlyPredictedDescription: isFiltered ? `${orgCategoryText} 현재 사용량 추세 기준` : "현재 사용량 추세 기준",
          shortageOrganizationsDescription: isFiltered ? `${orgCategoryText} 평균 사용량 증가율 기준` : "평균 사용량 증가율 기준",
          shortageUsersDescription: isFiltered ? `${orgCategoryText} 최근 7일 평균 사용량 기준` : "최근 7일 평균 사용량 기준"
        };
      } else {
        const yearSuffix = String(tokenCalendarYear).slice(-2);
        return {
          dailyAverage: isFiltered ? `${orgCategoryText} ${yearSuffix}년 ${tokenSelectedMonth}월 토큰 소비량 일일 평균` : `${yearSuffix}년 ${tokenSelectedMonth}월 토큰 소비량 일일 평균`,
          monthlyPredicted: isFiltered ? `${orgCategoryText} ${yearSuffix}년 ${tokenSelectedMonth}월 토큰 소비량` : `${yearSuffix}년 ${tokenSelectedMonth}월 토큰 소비량`,
          shortageOrganizations: isFiltered ? `${orgCategoryText} ${yearSuffix}년 ${tokenSelectedMonth}월 토큰 부족 조직` : `${yearSuffix}년 ${tokenSelectedMonth}월 토큰 부족 조직`,
          shortageUsers: isFiltered ? `${orgCategoryText} ${yearSuffix}년 ${tokenSelectedMonth}월 토큰 부족 사용자` : `${yearSuffix}년 ${tokenSelectedMonth}월 토큰 부족 예상 사용자`,
          dailyAverageDescription: isFiltered ? `${orgCategoryText} ${tokenSelectedMonth}월 전체 평균 기준` : `${tokenSelectedMonth}월 전체 평균 기준`,
          monthlyPredictedDescription: isFiltered ? `${orgCategoryText} ${tokenSelectedMonth}월 실제 사용량` : `${tokenSelectedMonth}월 실제 사용량`,
          shortageOrganizationsDescription: isFiltered ? `${orgCategoryText} ${tokenSelectedMonth}월 한도 초과 조직` : `${tokenSelectedMonth}월 한도 초과 조직`,
          shortageUsersDescription: isFiltered ? `${orgCategoryText} ${tokenSelectedMonth}월 한도 초과 예상` : `${tokenSelectedMonth}월 한도 초과 예상`
        };
      }
    }
    
    return {
      dailyAverage: isFiltered ? `${orgCategoryText} 토큰 소비량 일일 평균` : "토큰 소비량 일일 평균",
      monthlyPredicted: isFiltered ? `${orgCategoryText} 이번 달 예상 토큰 소비량` : "이번 달 예상 토큰 소비량",
      shortageOrganizations: isFiltered ? `${orgCategoryText} 토큰 부족 예상 조직` : "이번 달 토큰 부족 예상 조직",
      shortageUsers: isFiltered ? `${orgCategoryText} 토큰 부족 예상 사용자` : "이번 달 토큰 부족 예상 사용자",
      dailyAverageDescription: isFiltered ? `${orgCategoryText} 최근 30일 평균 기준` : "최근 30일 평균 기준",
      monthlyPredictedDescription: isFiltered ? `${orgCategoryText} 현재 사용량 추세 기준` : "현재 사용량 추세 기준",
      shortageOrganizationsDescription: isFiltered ? `${orgCategoryText} 평균 사용량 증가율 기준` : "평균 사용량 증가율 기준",
      shortageUsersDescription: isFiltered ? `${orgCategoryText} 최근 7일 평균 사용량 기준` : "최근 7일 평균 사용량 기준"
    };
  };

  const handleQALogsExcelExport = async () => {
    try {
      const response = await fetch('/api/admin/qa-logs/export', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `질문응답로그_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "다운로드 완료",
        description: "질문 응답 로그가 성공적으로 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('QA logs Excel export error:', error);
      toast({
        variant: "destructive",
        title: "다운로드 실패",
        description: "질문 응답 로그 다운로드 중 오류가 발생했습니다.",
      });
    }
  };

  // 질의응답 상세보기 모달 열기 함수
  const openQADetailModal = (log: any) => {
    console.log('QA Detail Modal opened with log:', log);
    setSelectedQALog(log);
    setShowQADetailModal(true);
  };



  // 에이전트 전용 상태 (사용자 검색과 분리)
  const [agentSearchQuery, setAgentSearchQuery] = useState('');
  const [agentFilterUpperCategory, setAgentFilterUpperCategory] = useState('all');
  const [agentFilterLowerCategory, setAgentFilterLowerCategory] = useState('all');
  const [agentFilterDetailCategory, setAgentFilterDetailCategory] = useState('all');
  const [agentFilterType, setAgentFilterType] = useState('all');
  const [agentFilterStatus, setAgentFilterStatus] = useState('all');
  const [hasAgentSearched, setHasAgentSearched] = useState(true);

  // 에이전트 검색 함수
  const handleAgentSearch = () => {
    setHasAgentSearched(true);
    setAgentCurrentPage(1); // 검색 시 페이지 리셋
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
    setAgentCurrentPage(1); // 필터 초기화 시 페이지 리셋
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

  const handleOrganizationSort = (field: string) => {
    if (organizationSortField === field) {
      setOrganizationSortDirection(organizationSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setOrganizationSortField(field);
      setOrganizationSortDirection('asc');
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

  // 에이전트 페이지네이션 처리
  const paginatedAgents = useMemo(() => {
    if (!sortedAgents) return [];
    const startIndex = (agentCurrentPage - 1) * AGENTS_PER_PAGE;
    const endIndex = startIndex + AGENTS_PER_PAGE;
    return sortedAgents.slice(startIndex, endIndex);
  }, [sortedAgents, agentCurrentPage, AGENTS_PER_PAGE]);

  const agentTotalPages = Math.ceil((sortedAgents?.length || 0) / AGENTS_PER_PAGE);

  // 사용자 목록 페이지네이션
  const userPagination = usePagination({
    data: sortedUsers,
    itemsPerPage: ITEMS_PER_PAGE,
  });



  // 조직 목록 페이지네이션
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
      additionalPrompt: "",
      
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
      setUploadedAgentDocuments([]);
      setAgentDocumentType('기타');
      setAgentDocumentDescription('');
      setAgentDocumentVisible(true);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "에이전트 생성에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  // 에이전트 Excel 내보내기 뮤테이션
  const exportAgentsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/agents/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      const blob = await response.blob();
      return blob;
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `Agent_List_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "성공",
        description: t('admin.agentDownloadSuccess'),
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: t('admin.agentDownloadFailed'),
        variant: "destructive",
      });
    },
  });

  // 에이전트 Excel 내보내기 함수
  const exportAgentsToExcel = () => {
    exportAgentsMutation.mutate();
  };



  // 문서-에이전트 연결 관련 핸들러
  const handleAgentSelection = (agentId: number, isSelected: boolean) => {
    setConnectedAgentsList(prev => {
      if (isSelected) {
        return [...prev, agentId];
      } else {
        return prev.filter(id => id !== agentId);
      }
    });
  };

  const handleSaveDocumentConnections = () => {
    if (documentDetailData) {
      updateDocumentAgentConnectionsMutation.mutate({
        documentId: documentDetailData.id,
        connectedAgents: connectedAgentsList
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
        setSelectedDocumentFiles(prev => {
          const totalFiles = prev.length + validFiles.length;
          if (totalFiles > 8) {
            const allowedCount = 8 - prev.length;
            const allowedFiles = validFiles.slice(0, allowedCount);
            
            if (allowedCount > 0) {
              toast({
                title: "파일 개수 제한",
                description: `최대 8개까지만 선택 가능합니다. ${allowedCount}개 파일만 추가되었습니다.`,
                variant: "destructive",
              });
              return [...prev, ...allowedFiles];
            } else {
              toast({
                title: "파일 개수 제한",
                description: "최대 8개까지만 선택할 수 있습니다.",
                variant: "destructive",
              });
              return prev;
            }
          }
          
          return [...prev, ...validFiles];
        });
        
        if (validFiles.length <= 8) {
          toast({
            title: "파일 선택됨",
            description: `${validFiles.length}개 파일이 선택되었습니다.`,
          });
        }
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
        if (file.size > 50 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (파일 크기가 50MB를 초과함)`);
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


      const response = await fetch('/api/admin/upload-org-categories', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '조직 파일 업로드에 실패했습니다');
      }

      const result = await response.json();
      setOrgCategoryUploadProgress(100);
      
      toast({
        title: "업로드 완료",
        description: result.message || `${result.totalProcessed || selectedOrgCategoryFiles.length}개 조직이 처리되었습니다.`,
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
        description: error.message || "조직 파일 업로드 중 오류가 발생했습니다.",
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

  // 조직 엑셀 내보내기 핸들러
  const handleOrganizationExcelExport = async () => {
    try {
      const response = await fetch('/api/admin/organizations/export', {
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
      link.download = `조직목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "내보내기 완료",
        description: "조직 목록이 엑셀 파일로 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('Organization Excel export error:', error);
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

  // 샘플 사용자 파일 다운로드 핸들러 (엑셀 형식)
  const handleDownloadSampleFile = async () => {
    try {
      const response = await fetch('/api/admin/users/sample', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('샘플 파일 다운로드에 실패했습니다');
      }

      // 파일 다운로드
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = '사용자_등록_샘플.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "다운로드 완료",
        description: "사용자 등록 샘플 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      console.error('Sample file download error:', error);
      toast({
        title: "다운로드 실패",
        description: "샘플 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  };

  // 샘플 조직 카테고리 파일 다운로드 핸들러
  const handleDownloadOrgSampleFile = () => {
    const csvContent = `조직명,상위 조직,하위 조직,세부 조직
컴퓨터공학과,공과대학,공학부,컴퓨터공학과
기계공학과,공과대학,공학부,기계공학과
국어국문학과,인문대학,문학부,국어국문학과
경영학과,경영대학,경영학부,경영학과`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sample_organizations.csv');
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
          formData.append('type', documentUploadType);
          formData.append('description', documentUploadDescription || '관리자 업로드 문서');
          formData.append('isVisibleToUsers', documentVisibility.toString());

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
        setDocumentUploadType('기타');
        setDocumentUploadDescription('');
        setDocumentVisibility(true);
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

  // 조직 파일 삭제 뮤테이션
  const deleteOrgFileMutation = useMutation({
    mutationFn: async (fileName: string) => {
      const response = await apiRequest("DELETE", `/api/admin/organization-files/${encodeURIComponent(fileName)}`);
      return response.json();
    },
    onSuccess: () => {
      refetchOrgFiles();
      toast({
        title: "파일 삭제 완료",
        description: "조직 파일이 성공적으로 삭제되었습니다.",
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

  // 문서-에이전트 연결 업데이트 mutation
  const updateDocumentAgentConnectionsMutation = useMutation({
    mutationFn: async ({ documentId, connectedAgents }: { documentId: string, connectedAgents: number[] }) => {
      const response = await fetch(`/api/admin/documents/${documentId}/agents`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectedAgents }),
      });
      if (!response.ok) throw new Error('Failed to update document connections');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "성공",
        description: "문서-에이전트 연결이 업데이트되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "오류", 
        description: error.message || "연결 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

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

  // 문서 가시성 업데이트 뮤테이션
  const updateDocumentVisibilityMutation = useMutation({
    mutationFn: async ({ documentId, isVisible }: { documentId: number; isVisible: boolean }) => {
      const response = await fetch(`/api/documents/${documentId}/visibility`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ isVisible }),
      });
      if (!response.ok) throw new Error('Failed to update document visibility');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      toast({
        title: "가시성 업데이트 완료",
        description: `문서가 일반 사용자에게 ${variables.isVisible ? '표시' : '숨김'} 처리되었습니다.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "가시성 업데이트 실패",
        description: error.message || "문서 가시성 업데이트 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    },
  });

  // 문서 정보 업데이트 mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { id: string; status: string; type: string; description: string; connectedAgents: number[]; isVisibleToUsers?: boolean }) => {
      const response = await fetch(`/api/admin/documents/${data.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          status: data.status,
          type: data.type,
          description: data.description,
          connectedAgents: data.connectedAgents,
          isVisibleToUsers: data.isVisibleToUsers,
        }),
      });
      
      if (!response.ok) {
        throw new Error('문서 정보 업데이트 실패');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
      
      toast({
        title: "성공",
        description: "문서 정보가 저장되었습니다.",
      });
      setIsDocumentDetailOpen(false);
      setDocumentDetailData(null);
    },
    onError: (error: Error) => {
      toast({
        title: "오류",
        description: "문서 정보 저장에 실패했습니다.",
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

  // 에이전트 파일 업로드 핸들러
  const handleAgentFileUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "파일을 선택해주세요",
        description: "업로드할 문서 파일을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedAgent) {
      toast({
        title: "에이전트를 선택해주세요",
        description: "문서를 업로드할 에이전트를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!agentDocumentType) {
      toast({
        title: "문서 종류를 선택해주세요",
        description: "업로드할 문서의 종류를 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsAgentFileUploading(true);
    setAgentFileUploadProgress(0);

    try {
      let successCount = 0;
      let errorCount = 0;
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('agentId', selectedAgent.id.toString());
          formData.append('documentType', agentDocumentType);
          formData.append('description', agentDocumentDescription || '');

          const response = await fetch('/api/admin/documents/upload', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          successCount++;
        } catch (error) {
          errorCount++;
          console.error(`에이전트 파일 업로드 실패: ${file.name}`, error);
        }

        // 진행률 업데이트
        setAgentFileUploadProgress(((i + 1) / totalFiles) * 100);
      }

      if (successCount > 0) {
        toast({
          title: "업로드 완료",
          description: `${successCount}개 파일이 성공적으로 업로드되었습니다.${errorCount > 0 ? ` (${errorCount}개 실패)` : ''}`,
        });
        
        // 실시간 캐시 무효화 - 모든 문서 관련 캐시 새로고침
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/documents'] });
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/documents', selectedAgent.id] });
        await queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
        
        // ChatInterface의 에이전트 문서 캐시도 무효화
        await queryClient.invalidateQueries({ queryKey: [`/api/agents/${selectedAgent.id}/documents`] });
        
        // 추가적인 강제 새로고침 - await 사용하여 즉시 새로고침
        await queryClient.refetchQueries({ queryKey: ['/api/admin/documents'] });
        await queryClient.refetchQueries({ queryKey: ['/api/admin/documents', selectedAgent.id] });
        await queryClient.refetchQueries({ queryKey: [`/api/agents/${selectedAgent.id}/documents`] });
        
        // 추가 대기 시간으로 캐시 동기화 보장
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // 업로드된 문서를 목록에 추가
        const newUploadedDocs = selectedFiles
          .slice(0, successCount)
          .map((file, index) => ({
            id: Date.now() + index,
            originalName: file.name,
            type: agentDocumentType,
            description: agentDocumentDescription || '설명 없음',
            visible: agentDocumentVisible,
            uploadDate: new Date().toLocaleDateString('ko-KR'),
            size: file.size
          }));
        
        setUploadedAgentDocuments(prev => [...prev, ...newUploadedDocs]);
        
        // 선택된 파일과 입력값 초기화
        setSelectedFiles([]);
        setAgentDocumentType('기타');
        setAgentDocumentDescription('');
        
        // 파일 입력 필드 초기화
        if (agentFileInputRef.current) {
          agentFileInputRef.current.value = '';
        }
      }

      if (errorCount > 0 && successCount === 0) {
        toast({
          title: "업로드 실패",
          description: "모든 파일 업로드에 실패했습니다.",
          variant: "destructive",
        });
      }
      
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: "에이전트 파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsAgentFileUploading(false);
      setAgentFileUploadProgress(0);
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
                  <h1 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white whitespace-nowrap overflow-hidden text-ellipsis">{t('admin.title')}</h1>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis">
                    {t('admin.subtitle')}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-4">
                <LanguageSelector />
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open('/', '_blank')}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <span className="hidden sm:inline">{t('admin.chatbot')}</span>
                  <span className="sm:hidden">{t('admin.chatbot')}</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleLogout}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">{t('admin.logout')}</span>
                  <span className="sm:hidden">{t('admin.logout')}</span>
                </Button>
              </div>
            </div>
          </div>
        </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8 pt-8 md:pt-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="admin-tabs-responsive">
            <TabsTrigger value="dashboard" className="admin-tab-trigger">
              <BarChart3 className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.dashboard')}</span>
              <span className="sm:hidden">{t('admin.dashboard')}</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="admin-tab-trigger">
              <Database className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.categories')}</span>
              <span className="sm:hidden">{t('nav.organizations')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="admin-tab-trigger">
              <Users className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.users')}</span>
              <span className="sm:hidden">{t('nav.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="agents" className="admin-tab-trigger">
              <Bot className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.agents')}</span>
              <span className="sm:hidden">{t('nav.agents')}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="admin-tab-trigger">
              <FileText className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.documents')}</span>
              <span className="sm:hidden">{t('nav.documents')}</span>
            </TabsTrigger>
            <TabsTrigger value="conversations" className="admin-tab-trigger">
              <MessageSquare className="admin-tab-icon" />
              <span className="hidden sm:inline">질문 응답 로그</span>
              <span className="sm:hidden">{t('nav.qa')}</span>
            </TabsTrigger>
            <TabsTrigger value="tokens" className="admin-tab-trigger">
              <Zap className="admin-tab-icon" />
              <span className="hidden sm:inline">{t('admin.tokens')}</span>
              <span className="sm:hidden">{t('nav.tokens')}</span>
            </TabsTrigger>

          </TabsList>

          {/* 대시보드 */}
          <TabsContent value="dashboard" className="space-y-4">
            {/* 상단 주요 지표 - 6개 카드를 2행으로 배치 */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              <Card className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">{t('admin.totalUsers')}</div>
                    <div className="text-base font-bold">{stats?.totalUsers || 0}</div>
                    <div className="text-xs text-[#16a34a]">{t('admin.activeUsers')}: {stats?.activeUsers || 0}</div>
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">{t('admin.totalAgents')}</div>
                    <div className="text-base font-bold">{stats?.totalAgents || 0}</div>
                    <div className="text-xs text-[#16a34a]">{t('admin.activeAgents')}: {stats?.activeAgents || 0}</div>
                  </div>
                  <Bot className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>

              <Card className="p-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground mb-0.5">총 조직</div>
                    <div className="text-base font-bold">124</div>
                    <div className="text-xs text-[#16a34a]">활성 조직: 98</div>
                  </div>
                  <Building className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>



              <Card className="p-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 mb-0.5">{t('admin.todayQuestionsTitle')}</div>
                    <div className="text-base font-bold text-green-900 dark:text-green-100">247</div>
                    <div className="text-xs text-green-700 dark:text-green-300">+12%</div>
                  </div>
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
              </Card>

              <Card className="p-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 mb-0.5">{t('admin.avgResponseTimeTitle')}</div>
                    <div className="text-base font-bold text-green-900 dark:text-green-100">2.3초</div>
                    <div className="text-xs text-green-700 dark:text-green-300">-0.3초</div>
                  </div>
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
              </Card>

              <Card className="p-2 border-green-200 bg-green-50 dark:bg-green-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-green-600 mb-0.5">{t('admin.responseSuccessTitle')}</div>
                    <div className="text-base font-bold text-green-900 dark:text-green-100">96.8%</div>
                    <div className="text-xs text-green-700 dark:text-green-300">{t('admin.dailyImprovement')}</div>
                  </div>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </Card>
            </div>

            {/* 하단 부가 지표 - 4개 카드를 1행으로 배치 */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <Card className="p-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-600 mb-0.5">업로드 문서 총량</div>
                    <div className="text-base font-bold text-orange-900 dark:text-orange-100">0.1M</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">AI 학습 데이터</div>
                  </div>
                  <FileText className="h-4 w-4 text-orange-600" />
                </div>
              </Card>

              <Card className="p-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-600 mb-0.5">{t('admin.tokenDailyAvgTitle')}</div>
                    <div className="text-base font-bold text-orange-900 dark:text-orange-100">2.6K</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">{t('admin.weeklyCompared')}</div>
                  </div>
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
              </Card>

              <Card className="p-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-600 mb-0.5">토큰 소비량 월 평균</div>
                    <div className="text-base font-bold text-orange-900 dark:text-orange-100">78K</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">전월 대비</div>
                  </div>
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
              </Card>

              <Card className="p-2 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-orange-600 mb-0.5">이번 달 예상 토큰 소비량</div>
                    <div className="text-base font-bold text-orange-900 dark:text-orange-100">2.4M</div>
                    <div className="text-xs text-orange-700 dark:text-orange-300">월말 예상</div>
                  </div>
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
              </Card>
            </div>

            {/* 추가 경고 카드 - 토큰 부족 예상 조직/사용자 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              <Card className="p-2 border-red-200 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-600 mb-0.5">이번 달 토큰 부족 예상 조직</div>
                    <div className="text-base font-bold text-red-900 dark:text-red-100">15개 조직</div>
                    <div className="text-xs text-red-700 dark:text-red-300">현재 사용량 기준 예상</div>
                  </div>
                  <Building className="h-4 w-4 text-red-600" />
                </div>
              </Card>

              <Card className="p-2 border-red-200 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-red-600 mb-0.5">이번 달 토큰 부족 예상 사용자</div>
                    <div className="text-base font-bold text-red-900 dark:text-red-100">73명 사용자</div>
                    <div className="text-xs text-red-700 dark:text-red-300">월 한도 초과 예상</div>
                  </div>
                  <Users className="h-4 w-4 text-red-600" />
                </div>
              </Card>
            </div>

            {/* 하단 인기 질문과 시스템 상태 - 1행으로 배치 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
              {/* 인기 질문 TOP 5 카드 - 보라색 계열 */}
              <Card className="border-purple-200 bg-purple-50 dark:bg-purple-900/20 p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs text-purple-800 dark:text-purple-200">{t('admin.popularQuestionsTop5')}</h3>
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                </div>
                {popularQuestionsLoading ? (
                  <div className="text-center py-2">
                    <div className="text-sm text-muted-foreground">{t('admin.loading')}</div>
                  </div>
                ) : popularQuestionsError ? (
                  <div className="text-center py-2">
                    <div className="text-sm text-red-500">{t('admin.dataLoadError')}</div>
                  </div>
                ) : popularQuestions && popularQuestions.length > 0 ? (
                  <div className="space-y-2">
                    {popularQuestions.slice(0, 5).map((question: any) => (
                      <div key={question.rank} className="flex items-center justify-between p-1.5 bg-white/60 dark:bg-gray-800/60 rounded">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1 mb-0.5">
                            <Badge variant="outline" className="text-xs font-bold px-1 py-0">#{question.rank}</Badge>
                            <span className="text-xs text-muted-foreground truncate">{question.agentName}</span>
                          </div>
                          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                            {question.question}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-1">
                          <div className="text-xs font-bold text-[#16a34a]">{question.count}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <div className="text-sm text-muted-foreground">{t('admin.noQuestionData')}</div>
                  </div>
                )}
              </Card>

              {/* 시스템 상태 */}
              <Card className="p-2">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-xs">{t('admin.systemStatus')}</h3>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs">{t('admin.database')}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                      {t('admin.status.healthy')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs">{t('admin.openaiApi')}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                      {t('admin.status.healthy')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs">{t('admin.sessionStore')}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                      {t('admin.status.healthy')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-0.5">
                    <span className="text-xs">{t('admin.fileUpload')}</span>
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs px-1 py-0">
                      {t('admin.status.healthy')}
                    </Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          {/* 사용자 관리 */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t('admin.userManagement')}</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleExcelExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('user.downloadUserList')}</span>
                </Button>
              </div>
            </div>

            {/* 사용자 관리 액션 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card 
                className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsLmsDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    {t('user.lmsIntegrationRecommended')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('user.lmsIntegrationDesc')}
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
                    {t('user.fileUploadAction')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    파일을 업로드해 여러 사용자를 일괄 등록합니다.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsNewUserDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-orange-600" />
                    {t('user.addNewUser')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('user.addNewUserDesc')}
                  </p>
                </CardContent>
              </Card>
            </div>



            {/* 사용자 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <CardTitle className="font-semibold tracking-tight text-[20px]">{t('user.userSearch')}</CardTitle>
              
              {/* 조직 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">상위 조직</Label>
                  <Select value={selectedUniversity} onValueChange={handleUpperCategoryChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      {upperCategories.map((category, index) => (
                        <SelectItem key={`upper-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">하위 조직</Label>
                  <Select 
                    value={selectedCollege} 
                    onValueChange={handleLowerCategoryChange}
                    disabled={selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={`h-10 ${selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      {lowerCategories.map((category, index) => (
                        <SelectItem key={`lower-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">세부 조직</Label>
                  <Select 
                    value={selectedDepartment} 
                    onValueChange={handleDetailCategoryChange}
                    disabled={selectedCollege === 'all' || selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={`h-10 ${selectedCollege === 'all' || selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      {detailCategories.map((category, index) => (
                        <SelectItem key={`detail-${category}-${index}`} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button onClick={resetFilters} className="h-10 w-full">
                    {t('org.resetFilters')}
                  </Button>
                </div>
              </div>

              {/* 상태 및 시스템 역할 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.status')}</Label>
                  <Select value={selectedDocumentType} onValueChange={(value) => {
                    setSelectedDocumentType(value);
                    executeSearch();
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      <SelectItem value="active">활성</SelectItem>
                      <SelectItem value="inactive">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('user.systemRole')}</Label>
                  <Select value={selectedDocumentPeriod} onValueChange={(value) => {
                    setSelectedDocumentPeriod(value);
                    executeSearch();
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      <SelectItem value="user">일반 사용자</SelectItem>
                      <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                      <SelectItem value="operation_admin">운영관리자</SelectItem>
                      <SelectItem value="master_admin">마스터 관리자</SelectItem>
                      <SelectItem value="external">외부 사용자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.searchKeyword')}</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder={t('admin.searchPlaceholder')}
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                      className="h-10 flex-1"
                    />
                    <Button onClick={executeSearch} className="h-10 px-6">{t('admin.searchButton')}</Button>
                  </div>
                </div>
              </div>
              
              {/* 검색 결과 표시 - 숨김 처리됨 */}
            </div>

            {/* 사용자 목록 테이블 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">{t('admin.userListTitle')}</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {filteredUsers?.length || 0}개 사용자 중 {((userCurrentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(userCurrentPage * ITEMS_PER_PAGE, filteredUsers?.length || 0)}개 표시
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.user')}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.organization')}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.positionRole')}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.email')}
                        </th>
                        <th className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${userSortField === 'avgTokenUsage' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleUserSort('avgTokenUsage')}
                            title="평균 토큰 사용량으로 정렬">
                          <div className="flex items-center justify-center">
                            <span>평균 토큰 사용량(%)</span>
                            <span className={`ml-1 ${userSortField === 'avgTokenUsage' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {userSortField === 'avgTokenUsage' ? (userSortDirection === 'asc' ? '▲' : '▼') : '▭'}
                            </span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.status')}
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.edit')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredUsers?.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p className="text-lg font-medium mb-2">{t('admin.noSearchResults')}</p>
                              <p className="text-sm">
                                {t('admin.noSearchResultsDesc')}
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
                              {(() => {
                                // 사용자별 평균 토큰 사용량 샘플 데이터
                                const tokenUsageData = [
                                  { username: 'master_admin', usage: 85.2 },
                                  { username: 'user1082', usage: 67.3 },
                                  { username: 'prof001', usage: 92.4 },
                                  { username: 'student001', usage: 73.1 },
                                  { username: 'admin001', usage: 88.6 },
                                  { username: 'faculty001', usage: 78.9 },
                                  { username: 'user123', usage: 95.7 },
                                  { username: 'staff001', usage: 82.3 }
                                ];
                                
                                const userUsage = tokenUsageData.find(data => data.username === user.username)?.usage || 
                                                Math.floor(Math.random() * 40 + 60); // 60-100% 범위의 랜덤값
                                
                                const getUsageColor = (percent: number) => {
                                  if (percent >= 100) return 'text-red-600 dark:text-red-400 font-bold';
                                  if (percent >= 90) return 'text-orange-600 dark:text-orange-400 font-semibold';
                                  if (percent >= 80) return 'text-amber-600 dark:text-amber-400';
                                  return 'text-green-600 dark:text-green-400';
                                };
                                
                                return (
                                  <span className={`text-sm font-mono ${getUsageColor(userUsage)}`}>
                                    {userUsage}%
                                  </span>
                                );
                              })()}
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
              <PaginationComponent
                currentPage={userCurrentPage}
                totalPages={totalUserPages}
                onPageChange={setUserCurrentPage}
                totalItems={filteredSortedUsers.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemName="사용자"
                showItemCount={false}
              />
            )}
          </TabsContent>

          {/* 에이전트 관리 */}
          <TabsContent value="agents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t('admin.agentManagement')}</h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  onClick={exportAgentsToExcel}
                  disabled={exportAgentsMutation.isPending}
                  className="flex items-center space-x-2"
                >
                  {exportAgentsMutation.isPending ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></span>
                      <span>{t('common.downloading')}</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>{t('agent.downloadAgentList')}</span>
                    </>
                  )}
                </Button>
              </div>
              
            {/* 새 에이전트 생성 모달 */}
            <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
                <DialogContent className="max-w-4xl h-[80vh] max-h-[80vh] flex flex-col relative">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>{t('agent.createNewAgent')}</DialogTitle>
                  </DialogHeader>
                  
                  {/* 탭 네비게이션 */}
                  <Tabs value={agentCreationTab} onValueChange={(value) => setAgentCreationTab(value as AgentCreationTab)} className="flex flex-col flex-1 overflow-hidden">
                    <TabsList className="grid w-full grid-cols-6 mb-6 flex-shrink-0">
                      <TabsTrigger value="basic" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        기본 정보
                      </TabsTrigger>
                      <TabsTrigger value="persona" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        페르소나
                      </TabsTrigger>
                      <TabsTrigger value="model" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white text-xs">
                        모델 및 응답 설정
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
                      <form onSubmit={agentForm.handleSubmit((data) => createAgentMutation.mutate(data))} className="flex flex-col flex-1 overflow-hidden">
                        {/* 탭 콘텐츠 영역 - 고정 높이 설정 */}
                        <div className="flex-1 overflow-y-auto min-h-0 pb-20">
                        
                        {/* 기본 정보 탭 */}
                        <TabsContent value="basic" className="space-y-6">
                          <div className="space-y-6">
                            {/* 에이전트 이름 */}
                            <FormField
                              control={agentForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">에이전트 이름*</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder={t('agent.maxTwentyChars')} 
                                      maxLength={20} 
                                      className="focus:ring-2 focus:ring-blue-500"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <div className="text-xs text-gray-500">{field.value?.length || 0}/20{t('common.characters')}</div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />




                            <FormField
                              control={agentForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">에이전트 소개</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder={t('agent.descriptionPlaceholder')}
                                      maxLength={200}
                                      className="min-h-[80px] focus:ring-2 focus:ring-blue-500"
                                      {...field} 
                                    />
                                  </FormControl>
                                  <div className="text-xs text-gray-500">{field.value?.length || 0}/200{t('common.characters')}</div>
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
                                      <Input placeholder="예: 민지, 도우미, 상담봇" {...field} />
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
                                        placeholder="예: 친구처럼 편안한 말투로 말해주세요."
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
                                name="personality"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">성격 특성</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 친절하고 인내심 있는 성격, 논리적인 사고, 유머감각 있음 등"
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
                                name="additionalPrompt"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">역할/지식/전문 분야</FormLabel>
                                    <FormControl>
                                      <Textarea 
                                        placeholder="예: 입학상담, 진로코칭, 프로그래밍, 영어 에세이 등"
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

                        {/* 모델 및 응답 설정 탭 */}
                        <TabsContent value="model" className="space-y-6">
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <FormField
                                control={agentForm.control}
                                name="llmModel"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">{t('agent.llmModel')}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "gpt-4o"}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
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
                                    <FormLabel className="text-sm font-medium text-gray-700">응답 생성 방식</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value || "doc-fallback-llm"}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="strict-doc">
                                          <div className="flex flex-col">
                                            <div className="font-medium">문서 기반 전용</div>
                                            <div className="text-xs text-gray-500">문서 기반 응답만 가능, 문서 외 질문은 부드럽게 거절</div>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="doc-fallback-llm">
                                          <div className="flex flex-col">
                                            <div className="font-medium">문서 우선 + LLM</div>
                                            <div className="text-xs text-gray-500">문서를 우선 사용하고 없으면 일반 LLM 결과 출력</div>
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="general-llm">
                                          <div className="flex flex-col">
                                            <div className="font-medium">LLM 전용</div>
                                            <div className="text-xs text-gray-500">일반 LLM 챗봇처럼 자유 대화</div>
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              {/* 웹 검색 설정 - LLM + 웹 검색 선택 시에만 표시 */}
                              {agentForm.watch("chatbotType") === "llm-with-web-search" && (
                                <div className="border-t pt-4 space-y-4">
                                  <h3 className="text-sm font-medium text-gray-700">웹 검색 설정</h3>
                                  
                                  <FormField
                                    control={agentForm.control}
                                    name="webSearchEnabled"
                                    render={({ field }) => (
                                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                          <FormLabel className="text-sm font-medium">웹 검색 사용</FormLabel>
                                          <div className="text-xs text-gray-500">
                                            실시간 웹 검색을 통해 최신 정보를 제공합니다
                                          </div>
                                        </div>
                                        <FormControl>
                                          <input
                                            type="checkbox"
                                            checked={field.value || false}
                                            onChange={(e) => field.onChange(e.target.checked)}
                                            className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                        </FormControl>
                                      </FormItem>
                                    )}
                                  />

                                  {agentForm.watch("webSearchEnabled") && (
                                    <>
                                      <FormField
                                        control={agentForm.control}
                                        name="searchEngine"
                                        render={({ field }) => (
                                          <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">검색 엔진</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "bing"}>
                                              <FormControl>
                                                <SelectTrigger>
                                                  <SelectValue placeholder="검색 엔진을 선택하세요" />
                                                </SelectTrigger>
                                              </FormControl>
                                              <SelectContent className="z-[10000]">
                                                <SelectItem value="bing">Bing Search API</SelectItem>
                                              </SelectContent>
                                            </Select>
                                            <FormMessage />
                                          </FormItem>
                                        )}
                                      />

                                      {agentForm.watch("searchEngine") === "bing" && (
                                        <FormField
                                          control={agentForm.control}
                                          name="bingApiKey"
                                          render={({ field }) => (
                                            <FormItem>
                                              <FormLabel className="text-sm font-medium text-gray-700">Bing API 키</FormLabel>
                                              <FormControl>
                                                <Input 
                                                  type="password"
                                                  placeholder="Bing Search API 키를 입력하세요"
                                                  {...field}
                                                />
                                              </FormControl>
                                              <div className="text-xs text-gray-500">
                                                Microsoft Azure Cognitive Services에서 Bing Search API 키를 발급받을 수 있습니다.
                                              </div>
                                              <FormMessage />
                                            </FormItem>
                                          )}
                                        />
                                      )}
                                    </>
                                  )}
                                </div>
                              )}

                              <FormField
                                control={agentForm.control}
                                name="maxInputLength"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">{t('agent.maxInputLength')}</FormLabel>
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
                                    <FormLabel className="text-sm font-medium text-gray-700">{t('agent.maxOutputLength')}</FormLabel>
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
                          <div className="space-y-6">
                            {/* 숨겨진 파일 입력 */}
                            <input
                              ref={agentFileInputRef}
                              type="file"
                              accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.csv,.hwp,.jpg,.png,.gif"
                              multiple
                              onChange={handleAgentFileInputChange}
                              style={{ display: 'none' }}
                            />
                            
                            {/* 파일 드래그 앤 드롭 영역 */}
                            <div 
                              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={handleAgentFileSelect}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.add('border-blue-400', 'bg-blue-50');
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.currentTarget.classList.remove('border-blue-400', 'bg-blue-50');
                                const files = Array.from(e.dataTransfer.files);
                                if (files.length > 0) {
                                  setSelectedFiles(prev => [...prev, ...files]);
                                }
                              }}
                            >
                              <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                                <FileText className="w-8 h-8 text-blue-600" />
                              </div>
                              <div className="space-y-2">
                                <p className="text-lg font-medium text-gray-900">파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                                <p className="text-sm text-gray-500">지원 파일 : pdf, doc, docx, txt, ppt, pptx, xls, xlsx, csv, hwp, jpg, png, gif</p>
                                <p className="text-sm text-gray-500">(최대 8개 / 파일당 최대 50MB)</p>
                              </div>
                              <Button 
                                type="button" 
                                variant="outline" 
                                className="mt-4 bg-white hover:bg-gray-50 border-gray-300"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAgentFileSelect();
                                }}
                              >
                                파일 선택
                              </Button>
                            </div>
                            
                            {/* 선택된 파일 목록 */}
                            {selectedFiles.length > 0 && (
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <Label className="text-sm font-medium text-gray-900">선택된 파일 ({selectedFiles.length}개)</Label>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedFiles([])}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                                    >
                                      전체 삭제
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="default"
                                      size="sm"
                                      onClick={async () => {
                                        if (selectedFiles.length === 0) return;
                                        
                                        setIsAgentFileUploading(true);
                                        setAgentFileUploadProgress(0);
                                        
                                        try {
                                          for (let i = 0; i < selectedFiles.length; i++) {
                                            const file = selectedFiles[i];
                                            const formData = new FormData();
                                            formData.append('file', file);
                                            formData.append('type', agentDocumentType || '기타');
                                            formData.append('description', agentDocumentDescription || '');
                                            formData.append('visible', agentDocumentVisible ? 'true' : 'false');
                                            
                                            // 진행률 업데이트
                                            setAgentFileUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
                                            
                                            // 업로드 시뮬레이션 (실제 API 엔드포인트로 교체 필요)
                                            await new Promise(resolve => setTimeout(resolve, 500));
                                            
                                            // 업로드된 문서 목록에 추가
                                            const newDocument = {
                                              id: `temp-${Date.now()}-${i}`,
                                              originalName: file.name,
                                              type: agentDocumentType || '기타',
                                              size: file.size,
                                              uploadDate: new Date().toLocaleDateString('ko-KR'),
                                              visible: agentDocumentVisible,
                                              description: agentDocumentDescription || '',
                                              status: '최종 반영됨'
                                            };
                                            
                                            setUploadedAgentDocuments(prev => [...prev, newDocument]);
                                          }
                                          
                                          toast({
                                            title: "업로드 완료",
                                            description: `${selectedFiles.length}개 파일이 성공적으로 업로드되었습니다.`,
                                          });
                                          
                                          // 업로드 완료 후 선택된 파일 초기화
                                          setSelectedFiles([]);
                                        } catch (error) {
                                          toast({
                                            title: "업로드 실패",
                                            description: "파일 업로드 중 오류가 발생했습니다.",
                                            variant: "destructive",
                                          });
                                        } finally {
                                          setIsAgentFileUploading(false);
                                          setAgentFileUploadProgress(0);
                                        }
                                      }}
                                      disabled={isAgentFileUploading || selectedFiles.length === 0}
                                      className="bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {isAgentFileUploading ? (
                                        <div className="flex items-center space-x-2">
                                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                          <span>{agentFileUploadProgress}%</span>
                                        </div>
                                      ) : (
                                        '업로드 시작'
                                      )}
                                    </Button>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="bg-white rounded-lg p-3 flex items-center justify-between border border-gray-200">
                                      <div className="flex items-center space-x-3">
                                        <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                                          <FileText className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                          <p className="font-medium text-gray-900 text-sm">{file.name}</p>
                                          <p className="text-xs text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.includes('pdf') ? 'PDF' : 
                                             file.type.includes('word') || file.name.includes('.doc') ? 'DOCUMENT' : 
                                             file.type.includes('sheet') || file.name.includes('.xls') ? 'DOCUMENT' : 
                                             file.type.includes('presentation') || file.name.includes('.ppt') ? 'DOCUMENT' : 
                                             'DOCUMENT'}
                                          </p>
                                        </div>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                                        }}
                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0 flex items-center justify-center"
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* 문서 종류 */}
                            <div className="space-y-2">
                              <Label className="text-base font-medium text-gray-900">문서 종류</Label>
                              <Select value={agentDocumentType || "기타"} onValueChange={setAgentDocumentType}>
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="선택" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  <SelectItem value="강의 자료">강의 자료</SelectItem>
                                  <SelectItem value="교육과정">교육과정</SelectItem>
                                  <SelectItem value="정책 문서">정책 문서</SelectItem>
                                  <SelectItem value="매뉴얼">매뉴얼</SelectItem>
                                  <SelectItem value="양식">양식</SelectItem>
                                  <SelectItem value="공지사항">공지사항</SelectItem>
                                  <SelectItem value="기타">기타</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {/* 문서 설명 */}
                            <div className="space-y-2">
                              <Label className="text-base font-medium text-gray-900">문서 설명</Label>
                              <Textarea 
                                placeholder="문서에 대한 간단한 설명을 입력하세요..."
                                value={agentDocumentDescription}
                                onChange={(e) => setAgentDocumentDescription(e.target.value)}
                                className="min-h-[100px] resize-none"
                              />
                            </div>
                            
                            {/* 문서 노출 설정 */}
                            <div className="space-y-3">
                              <Label className="text-base font-medium text-gray-900">문서 노출 설정</Label>
                              <div className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  id="agentDocumentVisible"
                                  checked={agentDocumentVisible}
                                  onChange={(e) => setAgentDocumentVisible(e.target.checked)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <Label htmlFor="agentDocumentVisible" className="text-sm font-medium cursor-pointer">
                                  일반 사용자에게 이 문서를 표시
                                </Label>
                              </div>
                              <p className="text-xs text-gray-500 ml-6">
                                체크 해제 시 관리자만 해당 문서 존재를 인지할 수 있습니다.
                              </p>
                            </div>

                            {/* 업로드된 문서 목록 */}
                            {uploadedAgentDocuments.length > 0 && (
                              <div className="border-t pt-6">
                                <div className="flex items-center justify-between mb-4">
                                  <Label className="text-base font-medium text-gray-900">업로드된 파일 ({uploadedAgentDocuments.length}개)</Label>
                                </div>
                                
                                <div className="space-y-3">
                                  {uploadedAgentDocuments.map((doc) => (
                                    <div key={doc.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                          <div className="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-green-600" />
                                          </div>
                                          
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                                {doc.originalName}
                                              </h4>
                                              <span className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs">
                                                {doc.type}
                                              </span>
                                            </div>
                                            
                                            <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                              <span>{doc.uploadDate}</span>
                                              <span>•</span>
                                              <span>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
                                              <span className="text-blue-600 font-medium">{uploadedAgentDocuments.length}개 조직 반영</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-2 ml-4">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setUploadedAgentDocuments(prev => prev.filter(d => d.id !== doc.id));
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 w-8 h-8 p-0 flex items-center justify-center"
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                          <div className="text-red-500 text-sm font-medium">삭제</div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* 관리자 선정 탭 */}
                        <TabsContent value="managers" className="space-y-4">
                          <div className="space-y-4">
                            {/* 간단한 설명 */}
                            <div className="text-sm text-gray-600 px-1">
                              에이전트 관리자는 최대 3명까지 공동 관리자를 선정할 수 있습니다.
                            </div>

                            {/* 선정된 관리자 영역 */}
                            <div className="space-y-3">
                              <h4 className="text-base font-medium text-gray-900">선정된 에이전트 관리자</h4>
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
                            </div>

                            {/* 사용자 검색 영역 */}
                            <div className="bg-white border border-gray-100 rounded-lg shadow-sm">
                              <div className="p-4 space-y-4">
                                <h4 className="text-base font-medium text-gray-900">사용자 검색</h4>
                                
                                {/* 조직 필터 - 첫 번째 행 */}
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">상위 조직</Label>
                                    <Select value={managerFilterUpperCategory} onValueChange={(value) => {
                                      setManagerFilterUpperCategory(value);
                                      setManagerFilterLowerCategory('all');
                                      setManagerFilterDetailCategory('all');
                                      setManagerCurrentPage(1);
                                    }}>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="전체" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="all">전체</SelectItem>
                                        {getUpperCategories().map((cat) => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">하위 조직</Label>
                                    <Select value={managerFilterLowerCategory} onValueChange={(value) => {
                                      setManagerFilterLowerCategory(value);
                                      setManagerFilterDetailCategory('all');
                                      setManagerCurrentPage(1);
                                    }} disabled={managerFilterUpperCategory === 'all'}>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="전체" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="all">전체</SelectItem>
                                        {getLowerCategories(managerFilterUpperCategory).map((cat) => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">세부 조직</Label>
                                    <Select value={managerFilterDetailCategory} onValueChange={(value) => {
                                      setManagerFilterDetailCategory(value);
                                      setManagerCurrentPage(1);
                                    }} disabled={managerFilterLowerCategory === 'all'}>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="전체" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="all">전체</SelectItem>
                                        {getDetailCategories(managerFilterUpperCategory, managerFilterLowerCategory).map((cat) => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* 상태 및 역할 필터 - 두 번째 행 */}
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">상태</Label>
                                    <Select value={managerFilterStatus} onValueChange={(value) => {
                                      setManagerFilterStatus(value);
                                      setManagerCurrentPage(1);
                                    }}>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="전체" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="all">전체</SelectItem>
                                        <SelectItem value="active">활성</SelectItem>
                                        <SelectItem value="inactive">비활성</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">시스템 역할</Label>
                                    <Select value={managerFilterSystemRole} onValueChange={(value) => {
                                      setManagerFilterSystemRole(value);
                                      setManagerCurrentPage(1);
                                    }}>
                                      <SelectTrigger className="h-10">
                                        <SelectValue placeholder="전체" />
                                      </SelectTrigger>
                                      <SelectContent className="z-[10000]">
                                        <SelectItem value="all">전체</SelectItem>
                                        <SelectItem value="master_admin">마스터 관리자</SelectItem>
                                        <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                                        <SelectItem value="operation_admin">운영 관리자</SelectItem>
                                        <SelectItem value="category_admin">카테고리 관리자</SelectItem>
                                        <SelectItem value="qa_admin">QA 관리자</SelectItem>
                                        <SelectItem value="doc_admin">문서 관리자</SelectItem>
                                        <SelectItem value="user">일반 사용자</SelectItem>
                                        <SelectItem value="external">외부 사용자</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>

                                {/* 검색어 입력 및 버튼 - 세 번째 행 */}
                                <div className="grid grid-cols-4 gap-4 items-end">
                                  <div className="col-span-2 space-y-2">
                                    <Label className="text-sm font-medium text-gray-700">검색어</Label>
                                    <Input
                                      type="text"
                                      placeholder="사용자명 또는 이메일 주소를 입력하세요"
                                      value={managerSearchQuery}
                                      onChange={(e) => setManagerSearchQuery(e.target.value)}
                                      className="h-10"
                                    />
                                  </div>
                                  
                                  <Button
                                    variant="outline"
                                    onClick={resetManagerSearchState}
                                    className="h-10"
                                  >
                                    필터 초기화
                                  </Button>
                                  
                                  <Button
                                    variant="default"
                                    onClick={() => setManagerCurrentPage(1)}
                                    className="h-10"
                                  >
                                    검색
                                  </Button>
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
                                                  handleUserSelect(user, 'agent');
                                                } else {
                                                  // 체크해제 시 에이전트 관리자 선택에서 제거
                                                  setSelectedAgentManagers(prev => 
                                                    prev.filter(m => m.id !== user.id)
                                                  );
                                                }
                                              }}
                                              checked={selectedAgentManagers.some(m => m.id === user.id)}
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
                                      <SelectContent className="z-[10000]">
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
                                    <SelectContent className="z-[10000]">
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
                                    <SelectContent className="z-[10000]">
                                      <SelectItem value="none">{t('admin.none')}</SelectItem>
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
                                    <SelectContent className="z-[10000]">
                                      <SelectItem value="none">{t('admin.none')}</SelectItem>
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
                                    <SelectContent className="z-[10000]">
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
                                    <SelectContent className="z-[10000]">
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
                                    <SelectContent className="z-[10000]">
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

                        </div>

                        {/* 하단 버튼 - 고정 위치 */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between pt-4 pb-6 px-6 bg-white border-t flex-shrink-0">
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
                                setUploadedAgentDocuments([]);
                                setAgentDocumentType('기타');
                                setAgentDocumentDescription('');
                                setAgentDocumentVisible(true);
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

            {/* 에이전트 관리 액션 버튼들 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <Card 
                className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  console.log('에이전트 수동 추가 버튼 클릭됨');
                  setIsAgentDialogOpen(true);
                  console.log('isAgentDialogOpen 상태 변경 요청됨');
                }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-blue-600" />
                    새 에이전트 수동 추가
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    새로운 에이전트를 직접 생성하고 설정합니다.
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-green-200 bg-green-50 dark:bg-green-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsAgentFileUploadModalOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    파일 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">파일을 업로드해 여러 에이전트를 일괄 등록할 수 있습니다</p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-[20px]">에이전트 검색</h3>
                {/* 필터 행 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.upperCategory')}</Label>
                    <Select value={agentFilterUpperCategory} onValueChange={(value) => {
                      setAgentFilterUpperCategory(value);
                      setAgentFilterLowerCategory('all');
                      setAgentFilterDetailCategory('all');
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
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
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.lowerCategory')}</Label>
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
                      <SelectContent className="z-[10000]">
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
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.detailCategory')}</Label>
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
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        {getDetailCategories(agentFilterUpperCategory, agentFilterLowerCategory).map((category, index) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* 유형 및 상태 필터 행 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">유형</Label>
                    <Select value={agentFilterType} onValueChange={(value) => {
                      setAgentFilterType(value);
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
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
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.status')}</Label>
                    <Select value={agentFilterStatus} onValueChange={(value) => {
                      setAgentFilterStatus(value);
                      setHasAgentSearched(true);
                    }}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="active">활성</SelectItem>
                        <SelectItem value="inactive">비활성</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Button 
                      className="h-10 w-full"
                      onClick={resetAgentFilters}
                    >
                      {t('admin.filterReset')}
                    </Button>
                  </div>
                </div>
                
                {/* 검색 행 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div className="col-span-3">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.searchKeyword')}</Label>
                    <Input
                      placeholder={language === 'ko' ? '에이전트 이름 또는 설명 키워드를 입력하세요.' : t('admin.agentKeywordPlaceholder')}
                      value={agentSearchQuery}
                      onChange={(e) => setAgentSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAgentSearch()}
                      className="h-10"
                    />
                  </div>
                  <div>
                    <Button 
                      onClick={handleAgentSearch}
                      className="h-10 px-6"
                    >
                      {t('admin.searchButton')}
                    </Button>
                  </div>
                </div>
                
            </div>

            

            {/* 에이전트 목록 */}
            {hasAgentSearched ? (
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="font-semibold tracking-tight text-[20px]">{t('admin.agentListTitle')}</CardTitle>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    전체 {sortedAgents?.length || 0}개 에이전트 중 {Math.min((agentCurrentPage - 1) * AGENTS_PER_PAGE + 1, sortedAgents?.length || 0)}-{Math.min(agentCurrentPage * AGENTS_PER_PAGE, sortedAgents?.length || 0)}개 표시
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">에이전트 이름</th>
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
                          <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            설정
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {(!paginatedAgents || paginatedAgents.length === 0) ? (
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
                          paginatedAgents.map((agent) => (
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
                                          'fas fa-book': BookOpen,
                                          'fas fa-brain': Brain,
                                          'fas fa-coffee': Coffee,
                                          'fas fa-music': Music,
                                          'fas fa-target': Target,
                                          'fas fa-zap': Zap,
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
                
                {/* 에이전트 페이지네이션 */}
                {agentTotalPages > 1 && (
                  <PaginationComponent
                    currentPage={agentCurrentPage}
                    totalPages={agentTotalPages}
                    onPageChange={setAgentCurrentPage}
                    totalItems={filteredAgents?.length || 0}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemName="에이전트"
                    showItemCount={false}
                  />
                )}
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="font-semibold tracking-tight text-[20px]">에이전트 검색</CardTitle>
                </CardHeader>
                <CardContent className="py-12">
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">{t('admin.emptySearchMessage')}</p>
                    <p className="text-sm">
{t('admin.searchCondition')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* 질문 응답 로그 */}
          <TabsContent value="conversations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">질문 응답 로그</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleQALogsExcelExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>질문 응답 로그 다운로드</span>
                </Button>
              </div>
            </div>



            {/* 필터링 옵션 */}
            <div className="space-y-4">
              <h3 className="font-semibold mb-4 text-[20px]">로그 검색</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">상위 조직</Label>
                  <Select value={qaSelectedUpperCategory} onValueChange={handleQAUpperCategoryChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">하위 조직</Label>
                  <Select value={qaSelectedLowerCategory} onValueChange={handleQALowerCategoryChange} disabled={qaSelectedUpperCategory === 'all'}>
                    <SelectTrigger className={`h-10 ${qaSelectedUpperCategory === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
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
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">세부 조직</Label>
                  <Select 
                    value={qaSelectedDetailCategory} 
                    onValueChange={handleQADetailCategoryChange}
                    disabled={qaSelectedLowerCategory === 'all' || qaSelectedUpperCategory === 'all'}
                  >
                    <SelectTrigger className={`h-10 ${qaSelectedLowerCategory === 'all' || qaSelectedUpperCategory === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {qaFilteredDetailCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">개별 조직</Label>
                  <Select 
                    value={qaSelectedOrganizationName} 
                    onValueChange={handleQAOrganizationNameChange}
                    disabled={qaSelectedDetailCategory === 'all'}
                  >
                    <SelectTrigger className={`h-10 ${qaSelectedDetailCategory === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {qaFilteredOrganizationNames.map((name, index) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button variant="outline" className="h-10 w-full border-gray-300 bg-white hover:bg-gray-50" onClick={resetQAFilters}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mt-6">
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">사용자 유형</Label>
                  <Select value={qaUserTypeFilter} onValueChange={setQaUserTypeFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="student">학생</SelectItem>
                      <SelectItem value="faculty">교직원</SelectItem>
                      <SelectItem value="admin">관리자</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-1">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">기간</Label>
                  <Select value={qaPeriodFilter} onValueChange={setQaPeriodFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="오늘" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="today">오늘</SelectItem>
                      <SelectItem value="week">최근 1주일</SelectItem>
                      <SelectItem value="month">최근 1개월</SelectItem>
                      <SelectItem value="quarter">최근 3개월</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">검색어</Label>
                  <Input 
                    placeholder={language === 'ko' ? '질문 키워드 또는 에이전트 이름으로 검색하세요.' : 'Search by question content or agent name...'}
                    className="h-10" 
                    value={qaSearchQuery}
                    onChange={(e) => setQaSearchQuery(e.target.value)}
                    aria-label="Q&A 로그 검색어 입력"
                    aria-describedby="qa-search-help"
                  />
                  <div id="qa-search-help" className="sr-only">
                    질문 내용이나 에이전트 이름을 입력하여 Q&A 로그를 검색할 수 있습니다.
                  </div>
                </div>
                <div className="md:col-span-1">
                  <Button className="h-10 w-full bg-blue-600 hover:bg-blue-700 text-white">
                    검색
                  </Button>
                </div>
              </div>
            </div>

            {/* 기간 날짜 정보 */}
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-base font-medium">
                <span className="text-gray-500 dark:text-gray-400">📅</span>
                <span>{getPeriodPillText()}</span>
              </div>
            </div>

            {/* Q&A 분석 카드 섹션 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* 카드 1: 인기 질문 키워드 TOP5 */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[20px] text-gray-800 dark:text-gray-200">인기 질문 주제 TOP10</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {qaUserTypeFilter === 'student' ? '학생들이 가장 많이 한 질문 주제' :
                       qaUserTypeFilter === 'faculty' ? '교직원들이 가장 많이 한 질문 주제' :
                       qaUserTypeFilter === 'admin' ? '관리자들이 가장 많이 한 질문 주제' :
                       '가장 많이 한 질문 주제'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {qaAnalyticsData.popularTopics.slice(0, 10).map((topic, index) => (
                    <button
                      key={topic.topic}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                      onClick={() => {
                        // 드릴다운: 검색창에 해당 주제 자동 입력 후 질문 응답 목록 갱신
                        setQaSearchQuery(topic.topic);
                      }}
                      title={`${topic.topic} 주제로 검색`}
                    >
                      <span className="w-5 h-5 rounded-full bg-blue-600 dark:bg-blue-400 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      {topic.topic}
                      <span className="text-blue-600 dark:text-blue-400 font-bold">({topic.count})</span>
                    </button>
                  ))}
                </div>
                {qaAnalyticsData.popularTopics.length > 10 && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    + {qaAnalyticsData.popularTopics.length - 10}개 더
                  </div>
                )}
              </Card>

              {/* 카드 2: 신규 질문 주제 */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[20px] text-gray-800 dark:text-gray-200">신규 질문 주제</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">새롭게 등장한 질문 주제</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {qaAnalyticsData.newTopics.length > 0 ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {qaAnalyticsData.newTopics.slice(0, 10).map((topic, index) => (
                          <button
                            key={topic.topic}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                            onClick={() => {
                              // 드릴다운: 해당 주제로 질문 목록 필터
                              setQaSearchQuery(topic.topic);
                            }}
                            title={`${topic.topic} 신규 주제로 검색`}
                          >
                            <span className="w-4 h-4 rounded-full bg-green-600 dark:bg-green-400 text-white text-xs flex items-center justify-center font-bold">
                              {index + 1}
                            </span>
                            {topic.topic}
                            <span className="text-green-600 dark:text-green-400 font-bold">({topic.count})</span>
                          </button>
                        ))}
                      </div>
                      {qaAnalyticsData.newTopics.length > 10 && (
                        <div className="text-xs text-gray-500">
                          + {qaAnalyticsData.newTopics.length - 10}개 더
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-2">
                      {qaPeriodFilter === 'today' ? '오늘' : 
                       qaPeriodFilter === 'week' ? '이번 주' : 
                       qaPeriodFilter === 'month' ? '이번 달' : '해당 기간'} 신규 질문 주제가 없습니다
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* 질문/응답 로그 테이블 */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <CardTitle className="font-semibold tracking-tight text-[20px]">{t('admin.questionAnswerList')}</CardTitle>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    전체 {filteredConversationLogs?.length || 0}개 질문응답 중 {((qaLogCurrentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(qaLogCurrentPage * ITEMS_PER_PAGE, filteredConversationLogs?.length || 0)}개 표시
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${qaSortField === 'agentName' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleQASort('agentName')}
                            title={getSortTooltip('agentName', '에이전트명')}>
                          <div className="flex items-center justify-between">
                            <span>{t('admin.agentName')}</span>
                            <span className={`ml-1 ${qaSortField === 'agentName' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getSortIcon('agentName')}
                            </span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('admin.question')}
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${qaSortField === 'responseMethod' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleQASort('responseMethod')}
                            title={getSortTooltip('responseMethod', '응답 방식')}>
                          <div className="flex items-center justify-between">
                            <span>응답 방식</span>
                            <span className={`ml-1 ${qaSortField === 'responseMethod' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getSortIcon('responseMethod')}
                            </span>
                          </div>
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${qaSortField === 'responseStatus' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleQASort('responseStatus')}
                            title={getSortTooltip('responseStatus', '응답 상태')}>
                          <div className="flex items-center justify-between">
                            <span>응답 상태</span>
                            <span className={`ml-1 ${qaSortField === 'responseStatus' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getSortIcon('responseStatus')}
                            </span>
                          </div>
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${qaSortField === 'responseTime' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleQASort('responseTime')}
                            title={getSortTooltip('responseTime', '응답 시간')}>
                          <div className="flex items-center justify-between">
                            <span>{t('admin.responseTime')}</span>
                            <span className={`ml-1 ${qaSortField === 'responseTime' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getSortIcon('responseTime')}
                            </span>
                          </div>
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${qaSortField === 'createdAt' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleQASort('createdAt')}
                            title={getSortTooltip('createdAt', '대화 시각')}>
                          <div className="flex items-center justify-between">
                            <span>대화 시각</span>
                            <span className={`ml-1 ${qaSortField === 'createdAt' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getSortIcon('createdAt')}
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {conversationLogsLoading ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <div className="text-gray-500 dark:text-gray-400">
                              <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
                              <p>대화 기록을 불러오는 중...</p>
                            </div>
                          </td>
                        </tr>
                      ) : conversationLogsError ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center">
                            <div className="text-red-500">
                              <XCircle className="w-6 h-6 mx-auto mb-2" />
                              <p>대화 기록을 불러오는데 실패했습니다</p>
                              <p className="text-sm text-gray-500 mt-1">{conversationLogsError.message}</p>
                            </div>
                          </td>
                        </tr>
                      ) : (() => {
                        console.log('DEBUGGING Q&A LIST:');
                        console.log('conversationLogs:', conversationLogs);
                        console.log('filteredConversationLogs:', filteredConversationLogs);
                        console.log('filteredConversationLogs.length:', filteredConversationLogs?.length);
                        
                        // 필터링 및 정렬된 대화 목록 사용
                        if (filteredConversationLogs && filteredConversationLogs.length > 0) {
                          console.log('Showing filtered/sorted conversations:', filteredConversationLogs.length);
                          return filteredConversationLogs.slice((qaLogCurrentPage - 1) * ITEMS_PER_PAGE, qaLogCurrentPage * ITEMS_PER_PAGE).map((log: any) => (
                            <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer" onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openQADetailModal(log);
                            }}>
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
                                <Badge variant="default" className="bg-blue-100 text-blue-800">
                                  {(() => {
                                    // 대화 ID를 기반으로 응답 방식 결정
                                    const seed = log.id || 1;
                                    const responseTypes = ['문서 우선 + LLM', 'LLM 우선', '문서만'];
                                    return responseTypes[seed % 3];
                                  })()}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                {(() => {
                                  // 대화에 메시지가 있고, lastUserMessage가 있으면 AI 응답도 있다고 가정
                                  const hasResponse = log.lastUserMessage && log.messageCount > 1;
                                  return hasResponse ? (
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                      성공
                                    </Badge>
                                  ) : (
                                    <Badge variant="destructive" className="bg-red-100 text-red-800">
                                      실패
                                    </Badge>
                                  );
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {(() => {
                                  // 대화 ID를 기반으로 일관된 응답 시간 생성 (0.1초 ~ 2.5초)
                                  const seed = log.id || 1;
                                  const responseTime = ((seed * 137) % 240 + 10) / 100; // 0.1 ~ 2.5초
                                  return responseTime.toFixed(1) + '초';
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(log.lastMessageAt).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: '2-digit', 
                                  day: '2-digit',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </td>
                            </tr>
                          ));
                        }
                        
                        // 데이터가 없으면 기본 메시지 표시
                        return (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center">
                              <div className="text-gray-500 dark:text-gray-400">
                                <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p className="text-lg font-medium mb-2">대화 기록이 없습니다</p>
                                <p className="text-sm">
                                  사용자가 에이전트와 대화를 시작하면 여기에 기록이 표시됩니다.
                                </p>
                              </div>
                            </td>
                          </tr>
                        );
                      })()}
                    </tbody>
                  </table>
                </div>
                
                {/* QA 로그 페이지네이션 */}
                {filteredConversationLogs && filteredConversationLogs.length > ITEMS_PER_PAGE && (
                  <PaginationComponent
                    currentPage={qaLogCurrentPage}
                    totalPages={Math.ceil(filteredConversationLogs.length / ITEMS_PER_PAGE)}
                    onPageChange={setQaLogCurrentPage}
                    totalItems={filteredConversationLogs.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemName="질문응답"
                    showItemCount={false}
                  />
                )}
              </CardContent>
            </Card>

          </TabsContent>

          {/* 토큰 관리 */}
          <TabsContent value="tokens" className="space-y-6">
          </TabsContent>

          {/* 조직 관리 */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t('admin.organizationManagement')}</h2>
              <div className="flex space-x-2">
                <Button 
                  variant="outline"
                  onClick={handleOrganizationExcelExport}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>조직 목록 다운로드</span>
                </Button>
              </div>
            </div>

            {/* 카테고리 관리 방법 안내 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card 
                className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsLmsDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Database className="w-5 h-5 mr-2 text-blue-600" />
                    {t('org.lmsIntegrationRecommended')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    대학 LMS 시스템과 연동하여 조직 정보를 자동으로 동기화합니다
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
                    {t('org.fileUploadAction')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('org.fileUploadDesc')}
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="border-orange-200 bg-orange-50 dark:bg-orange-900/20 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setIsNewCategoryDialogOpen(true)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center">
                    <Plus className="w-5 h-5 mr-2 text-orange-600" />
                    {t('org.addNewCategoryManual')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('org.addNewCategoryDesc')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 조직 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold text-[20px]">{t('org.searchAndManagement')}</h3>
              
              {/* 3단계 카테고리 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('org.upperCategory')}</Label>
                  <Select value={selectedUniversity} onValueChange={handleUpperCategoryChange}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      {uniqueUpperCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('org.lowerCategory')}</Label>
                  <Select value={selectedCollege} onValueChange={handleLowerCategoryChange} disabled={selectedUniversity === 'all'}>
                    <SelectTrigger className={`h-10 ${selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t('org.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('org.all')}</SelectItem>
                      {filteredLowerCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('org.detailCategory')}</Label>
                  <Select 
                    value={selectedDepartment} 
                    onValueChange={handleDetailCategoryChange}
                    disabled={selectedCollege === 'all' || selectedUniversity === 'all'}
                  >
                    <SelectTrigger className={`h-10 ${selectedCollege === 'all' || selectedUniversity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder={t("org.selectOption")} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t("org.all")}</SelectItem>
                      {filteredDetailCategories.map((category, index) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button onClick={resetFilters} className="h-10 w-full">
                    {t('org.resetFilters')}
                  </Button>
                </div>
              </div>

              {/* 카테고리 검색 */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">상태</Label>
                  <Select value={selectedOrgStatus} onValueChange={setSelectedOrgStatus}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="활성">활성</SelectItem>
                      <SelectItem value="비활성">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('doc.searchKeyword')}</Label>
                  <Input
                    placeholder={t('org.searchByName')}
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                    className="h-10"
                  />
                </div>
                <div>
                  <Button onClick={executeSearch} className="h-10 w-full">
                    {t('admin.search')}
                  </Button>
                </div>
              </div>
              
              
            </div>

            <Card className="rounded-lg border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">{t('org.organizationList')}</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {filteredOrganizationCategories?.length || 0}개 조직 중 {organizationCategoriesStartIndex + 1}-{Math.min(organizationCategoriesEndIndex, filteredOrganizationCategories?.length || 0)}개 표시
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
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                          onClick={() => handleOrganizationSort('personnelCount')}
                        >
                          <div className="flex items-center justify-between">
                            <span>소속 인원</span>
                            <div className="flex flex-col ml-1 opacity-60">
                              <ChevronUp className={`w-3 h-3 -mb-1 ${organizationSortField === 'personnelCount' && organizationSortDirection === 'asc' ? 'text-blue-600 opacity-100' : ''}`} />
                              <ChevronDown className={`w-3 h-3 ${organizationSortField === 'personnelCount' && organizationSortDirection === 'desc' ? 'text-blue-600 opacity-100' : ''}`} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                          onClick={() => handleOrganizationSort('agentCount')}
                        >
                          <div className="flex items-center justify-between">
                            <span>에이전트 수</span>
                            <div className="flex flex-col ml-1 opacity-60">
                              <ChevronUp className={`w-3 h-3 -mb-1 ${organizationSortField === 'agentCount' && organizationSortDirection === 'asc' ? 'text-blue-600 opacity-100' : ''}`} />
                              <ChevronDown className={`w-3 h-3 ${organizationSortField === 'agentCount' && organizationSortDirection === 'desc' ? 'text-blue-600 opacity-100' : ''}`} />
                            </div>
                          </div>
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700 select-none"
                          onClick={() => handleOrganizationSort('status')}
                        >
                          <div className="flex items-center justify-between">
                            <span>상태</span>
                            <div className="flex flex-col ml-1 opacity-60">
                              <ChevronUp className={`w-3 h-3 -mb-1 ${organizationSortField === 'status' && organizationSortDirection === 'asc' ? 'text-blue-600 opacity-100' : ''}`} />
                              <ChevronDown className={`w-3 h-3 ${organizationSortField === 'status' && organizationSortDirection === 'desc' ? 'text-blue-600 opacity-100' : ''}`} />
                            </div>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          선택
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredOrganizationCategories.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-12 text-center">
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
              <PaginationComponent
                currentPage={orgCategoriesCurrentPage}
                totalPages={totalOrgCategoriesPages}
                onPageChange={(page) => setOrgCategoriesCurrentPage(page)}
                totalItems={filteredOrganizationCategories.length}
                itemsPerPage={ITEMS_PER_PAGE}
                itemName="조직"
                showItemCount={false}
              />
            )}
          </TabsContent>

          {/* 조직 편집 다이얼로그 */}
          <Dialog open={isOrgCategoryEditDialogOpen} onOpenChange={setIsOrgCategoryEditDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby="org-edit-description">
              <DialogHeader>
                <DialogTitle className="font-semibold tracking-tight text-[20px]">조직 상세 정보</DialogTitle>
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

                    {/* 조직 선택 - 드롭박스 */}
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
                              <SelectContent className="z-[10000]">
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
                                <SelectTrigger className="mt-[8px] mb-[8px]">
                                  <SelectValue placeholder="하위 조직 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[10000]">
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
                                <SelectTrigger className="mt-[8px] mb-[8px]">
                                  <SelectValue placeholder="세부 조직 선택" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="z-[10000]">
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
                            <SelectContent className="z-[10000]">
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
                              // 에이전트 검색 모달을 열고 해당 조직으로 필터링
                              setSelectedUniversity(editingOrgCategory?.upperCategory || 'all');
                              setSelectedCollege(editingOrgCategory?.lowerCategory || 'all');
                              setSelectedDepartment(editingOrgCategory?.detailCategory || 'all');
                              setHasSearched(true);
                              
                              // 조직 상세 정보 모달 닫기
                              setIsOrgCategoryEditDialogOpen(false);
                              setEditingOrgCategory(null);
                              
                              // 에이전트 검색 모달 열기
                              setIsAgentSearchDialogOpen(true);
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

                      {/* 이번 달 평균 토큰 사용량 */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium">토큰 사용량</Label>
                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                          <button
                            type="button"
                            onClick={() => {
                              // 토큰 관리 탭으로 이동하고 해당 조직으로 필터링
                              setActiveTab("tokens");
                              setTokenUpperCategoryFilter(editingOrgCategory?.upperCategory || 'all');
                              setTokenLowerCategoryFilter(editingOrgCategory?.lowerCategory || 'all');
                              setTokenDetailCategoryFilter(editingOrgCategory?.detailCategory || 'all');
                              setIsOrgCategoryEditDialogOpen(false);
                            }}
                            className="text-left w-full hover:bg-orange-100 dark:hover:bg-orange-800/30 p-2 rounded transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-600 dark:text-gray-400">이번 달 평균 사용량</span>
                              <ExternalLink className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div className="font-bold text-orange-600 dark:text-orange-400 text-[20px]">
                              {(() => {
                                // 해당 조직의 토큰 데이터에서 평균 사용률 계산
                                const orgTokenData = filteredTokenData.filter(token => 
                                  token.upperCategory === editingOrgCategory?.upperCategory &&
                                  token.lowerCategory === editingOrgCategory?.lowerCategory &&
                                  token.detailCategory === editingOrgCategory?.detailCategory
                                );
                                
                                if (orgTokenData.length > 0) {
                                  const avgUsage = orgTokenData.reduce((sum, token) => sum + token.totalTokens, 0) / orgTokenData.length / 100;
                                  const percentage = Math.min(100, Math.max(0, avgUsage));
                                  return `${percentage.toFixed(1)}%`;
                                }
                                
                                // 기본값 (조직별로 다른 값)
                                const defaultPercentage = 65 + (editingOrgCategory?.id || 0) % 30;
                                return `${defaultPercentage}%`;
                              })()}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              클릭하여 토큰 관리에서 보기
                            </div>
                          </button>
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
                              placeholder="조직에 대한 추가 설명이나 메모를 입력하세요."
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
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



          {/* 문서 관리 */}
          <TabsContent value="documents" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">{t('admin.documentManagement')}</h2>
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
{t('admin.lmsIntegration')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
{t('admin.lmsIntegrationDesc')}
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
파일 업로드
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
공통 문서를 한 번에 업로드하고, 다양한 에이전트에 연동하세요.
                  </p>
                </CardContent>
              </Card>
            </div>



            {/* 문서 통계 카드 - 질문/응답 관리 스타일과 동일한 컴팩트 레이아웃 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalDocuments')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{documentList?.length || 0}</div>
                    <div className="text-xs text-gray-500">{t('admin.countUnit')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.indexFailureRate')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">2.4%</div>
                    <div className="text-xs text-red-600">{t('admin.processingFailure')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <XCircle className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.inactiveDocuments')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">0</div>
                    <div className="text-xs text-gray-500">{t('admin.countUnit')}</div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">{t('admin.totalCapacity')}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-gray-900 dark:text-white">
                      {documentList?.reduce((total, doc) => {
                        const sizeInMB = parseFloat(doc.size?.replace(' MB', '') || '0');
                        return total + sizeInMB;
                      }, 0).toFixed(1) || '0'}
                    </div>
                    <div className="text-xs text-gray-500">MB</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 문서 검색 및 필터링 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border p-6 space-y-4">
              <h3 className="font-semibold mb-4 text-[20px]">{t('admin.documentSearch')}</h3>
              
              {/* 카테고리 필터 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.documentKind')}</Label>
                  <Select value={selectedDocumentCategory} onValueChange={(value) => {
                    setSelectedDocumentCategory(value);
                    handleDocumentFilterChange();
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('admin.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="lecture">{t('admin.lectureData')}</SelectItem>
                      <SelectItem value="policy">{t('admin.policyDoc')}</SelectItem>
                      <SelectItem value="manual">{t('admin.manual')}</SelectItem>
                      <SelectItem value="form">{t('admin.form')}</SelectItem>
                      <SelectItem value="notice">{t('admin.notice')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('admin.fileFormat')}</Label>
                  <Select value={selectedDocumentType} onValueChange={(value) => {
                    setSelectedDocumentType(value);
                    handleDocumentFilterChange();
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('admin.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="word">Word</SelectItem>
                      <SelectItem value="excel">Excel</SelectItem>
                      <SelectItem value="ppt">PowerPoint</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">업로드 기간</Label>
                  <Select value={selectedDocumentPeriod} onValueChange={(value) => {
                    setSelectedDocumentPeriod(value);
                    handleDocumentFilterChange();
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder={t('admin.selectOption')} />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">{t('common.all')}</SelectItem>
                      <SelectItem value="today">{t('admin.today')}</SelectItem>
                      <SelectItem value="week">{t('admin.oneWeek')}</SelectItem>
                      <SelectItem value="month">{t('admin.oneMonth')}</SelectItem>
                      <SelectItem value="year">{t('admin.oneYear')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button onClick={resetDocumentFilters} className="h-10 w-full">
                    {t('admin.filterReset')}
                  </Button>
                </div>
              </div>

              {/* 문서 검색 */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div className="col-span-3">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">{t('common.searchKeyword')}</Label>
                  <Input
                    placeholder={language === 'ko' ? '문서명으로 검색하세요.' : t('admin.searchByContent')}
                    value={documentSearchQuery}
                    onChange={(e) => setDocumentSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && setHasDocumentSearched(true)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Button onClick={() => setHasDocumentSearched(true)} className="h-10 w-full">
                    {t('common.search')}
                  </Button>
                </div>
              </div>
              
              {/* 검색 결과 표시 */}
              {hasDocumentSearched && (
                <div className="text-sm text-gray-600 dark:text-gray-400">
{t('admin.searchResults')}: 2{t('admin.documentFound')}
                  {documentSearchQuery && ` (${t('common.searchKeyword')}: "${documentSearchQuery}")`}
                </div>
              )}
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="font-semibold tracking-tight text-[20px]">{t('admin.documentList')}</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  전체 {documentList?.length || 0}개 문서 중 {documentList && documentList.length > 0 ? ((documentCurrentPage - 1) * ITEMS_PER_PAGE) + 1 : 0}-{documentList && documentList.length > 0 ? Math.min(documentCurrentPage * ITEMS_PER_PAGE, documentList.length) : 0}개 표시
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
                            <span>{t('admin.fileName')}</span>
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
                            <span>유형</span>
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
                          <span>{t('admin.size')}</span>
                          {documentSortField === 'size' && (
                            documentSortDirection === 'asc' ? 
                            <ChevronUp className="w-4 h-4" /> : 
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </th>
                        <th 
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none"
                          onClick={() => handleDocumentSort('indexing')}
                        >
                          <div className="flex items-center space-x-1">
                            <span>인덱싱</span>
                            {documentSortField === 'indexing' && (
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
                            <span>{t('admin.uploadedDate')}</span>
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
                            <span>{t('admin.connectedAgent')}</span>
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
                          노출
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          {t('common.settings')}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {/* 실제 업로드된 문서 */}
                      {documentList && documentList.length > 0 ? (
                        documentList
                          .slice((documentCurrentPage - 1) * ITEMS_PER_PAGE, documentCurrentPage * ITEMS_PER_PAGE)
                          .map((doc, index) => (
                          <tr 
                            key={index}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setDocumentDetailData(doc);
                              setSelectedDocument(doc);
                              // 연결된 에이전트 정보 가져오기 (connectedAgents 배열 사용)
                              if (doc.connectedAgents && doc.connectedAgents.length > 0) {
                                const connectedAgentNames = doc.connectedAgents.map((agentId: number) => {
                                  const agent = agents?.find((a: any) => a.id === agentId);
                                  return agent ? agent.name : null;
                                }).filter(name => name !== null);
                                setSelectedDocumentAgents(connectedAgentNames);
                              } else if (doc.agentId) {
                                // 백업: 기존 agentId 사용
                                const agent = agents?.find((a: any) => a.id === doc.agentId);
                                if (agent) {
                                  setSelectedDocumentAgents([agent.name]);
                                } else {
                                  setSelectedDocumentAgents([]);
                                }
                              } else {
                                setSelectedDocumentAgents([]);
                              }
                              // 편집 상태 초기화
                              setEditingDocumentStatus(doc.status || 'active');
                              setEditingDocumentType(doc.type || '기타');
                              setEditingDocumentDescription(doc.description || '');
                              setEditingDocumentVisibility(doc.isVisibleToUsers !== undefined ? doc.isVisibleToUsers : true);
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
                            {doc.type || '기타'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.size}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const indexingStatus = getIndexingStatus(doc);
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${indexingStatus.color}`}>
                                  {indexingStatus.label}
                                </span>
                              );
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {doc.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-wrap gap-1">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                                {(() => {
                                  const agent = agents?.find((a: any) => a.id === doc.agentId);
                                  return agent ? agent.name : `에이전트 ${doc.agentId}`;
                                })()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              활성
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              <div
                                className="p-2 h-8 w-8 rounded-lg flex items-center justify-center"
                                title={doc.isVisibleToUsers === true ? '사용자에게 노출됨' : '사용자에게 숨김'}
                              >
                                {doc.isVisibleToUsers === true ? (
                                  // 노출됨 - 애플 스타일 열린 눈 (진한 파란색)
                                  (<svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="text-blue-600 dark:text-blue-400 drop-shadow-sm"
                                  >
                                    <path
                                      d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="none"
                                    />
                                    <circle
                                      cx="12"
                                      cy="12"
                                      r="3"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      fill="currentColor"
                                      fillOpacity="0.3"
                                    />
                                  </svg>)
                                ) : (
                                  // 숨김 - 애플 스타일 닫힌 눈 (회색, 더 굵은 slash)
                                  (<svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    className="text-red-500 dark:text-red-400 drop-shadow-sm"
                                  >
                                    <g opacity="0.7">
                                      <path
                                        d="M14.12 14.12a3 3 0 1 1-4.24-4.24"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M14.83 9.17A10.43 10.43 0 0 0 12 9C7 9 2.73 12.11 1 16.5a13.16 13.16 0 0 0 2.67 3.61"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      <path
                                        d="M17.39 17.39A13.526 13.526 0 0 0 22 12s-3-7-10-7a9.74 9.74 0 0 0-5.39 1.61"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    </g>
                                    <line
                                      x1="3"
                                      y1="3"
                                      x2="21"
                                      y2="21"
                                      stroke="currentColor"
                                      strokeWidth="2.5"
                                      strokeLinecap="round"
                                      className="text-red-600 dark:text-red-500"
                                    />
                                  </svg>)
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDocumentDetailData(doc);
                                setSelectedDocument(doc);
                                // 연결된 에이전트 정보 가져오기 (connectedAgents 배열 사용)
                                if (doc.connectedAgents && doc.connectedAgents.length > 0) {
                                  const connectedAgentNames = doc.connectedAgents.map((agentId: number) => {
                                    const agent = agents?.find((a: any) => a.id === agentId);
                                    return agent ? agent.name : null;
                                  }).filter(name => name !== null);
                                  setSelectedDocumentAgents(connectedAgentNames);
                                } else if (doc.agentId) {
                                  // 백업: 기존 agentId 사용
                                  const agent = agents?.find((a: any) => a.id === doc.agentId);
                                  if (agent) {
                                    setSelectedDocumentAgents([agent.name]);
                                  } else {
                                    setSelectedDocumentAgents([]);
                                  }
                                } else {
                                  setSelectedDocumentAgents([]);
                                }
                                // 편집 상태 초기화
                                setEditingDocumentStatus(doc.status || 'active');
                                setEditingDocumentType(doc.type || '기타');
                                setEditingDocumentDescription(doc.description || '');
                                setEditingDocumentVisibility(doc.isVisibleToUsers !== undefined ? doc.isVisibleToUsers : true);
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
                          <td colSpan={9} className="px-6 py-12 text-center">
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
                
                {/* 문서 목록 페이지네이션 */}
                {documentList && documentList.length > ITEMS_PER_PAGE && (
                  <PaginationComponent
                    currentPage={documentCurrentPage}
                    totalPages={Math.ceil(documentList.length / ITEMS_PER_PAGE)}
                    onPageChange={setDocumentCurrentPage}
                    totalItems={documentList.length}
                    itemsPerPage={ITEMS_PER_PAGE}
                    itemName="문서"
                    showItemCount={false}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 토큰 관리 */}
          <TabsContent value="tokens" className="space-y-4">
            <h2 className="text-2xl font-bold">{t('admin.tokenManagement')}</h2>

            {/* 토큰 사용량 검색 - 최우선 배치 */}
            <Card>
              <CardHeader>
                <CardTitle className="font-semibold tracking-tight text-[20px]">토큰 사용량 검색</CardTitle>
              </CardHeader>
              <CardContent>
                {/* 상위 - 하위 - 세부 - 조직명 (상단) */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">상위 조직 카테고리</Label>
                    <Select 
                      value={tokenUpperCategoryFilter} 
                      onValueChange={(value) => {
                        setTokenUpperCategoryFilter(value);
                        // 상위 조직 변경 시 하위, 세부 조직, 조직명 초기화
                        setTokenLowerCategoryFilter("all");
                        setTokenDetailCategoryFilter("all");
                        setTokenOrganizationNameFilter("all");
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        {uniqueUpperCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">하위 조직 카테고리</Label>
                    <Select 
                      value={tokenLowerCategoryFilter} 
                      onValueChange={(value) => {
                        setTokenLowerCategoryFilter(value);
                        // 하위 조직 변경 시 세부 조직, 조직명 초기화
                        setTokenDetailCategoryFilter("all");
                        setTokenOrganizationNameFilter("all");
                      }}
                      disabled={tokenUpperCategoryFilter === 'all'}
                    >
                      <SelectTrigger className={`h-10 ${tokenUpperCategoryFilter === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        {filteredTokenLowerCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">세부 조직 카테고리</Label>
                    <Select 
                      value={tokenDetailCategoryFilter} 
                      onValueChange={(value) => {
                        setTokenDetailCategoryFilter(value);
                      }}
                      disabled={tokenLowerCategoryFilter === 'all'}
                    >
                      <SelectTrigger className={`h-10 ${tokenLowerCategoryFilter === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        {filteredTokenDetailCategories.map(category => (
                          <SelectItem key={category} value={category}>{category}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  
                  <div>
                    <Button onClick={() => {
                      setTokenPeriodFilter("month");
                      setTokenUpperCategoryFilter("all");
                      setTokenLowerCategoryFilter("all");
                      setTokenDetailCategoryFilter("all");
                      setTokenKeywordFilter("");
                      setTokenModelFilter("all");
                    }} className="h-10 w-full">
                      필터 초기화
                    </Button>
                  </div>
                </div>

                {/* 기간, 모델, 키워드 (하단) */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end mt-6">
                  <div className="md:col-span-1 relative">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">기간</Label>
                    <div className="relative">
                      {/* 드롭다운 트리거 */}
                      <button
                        onClick={() => setTokenCalendarOpen(!tokenCalendarOpen)}
                        className="w-full h-10 px-3 py-2 border rounded-md bg-white dark:bg-gray-800 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        type="button"
                      >
                        <span className="text-sm">
                          {tokenSelectedMonth ? `${tokenCalendarYear}년 ${tokenSelectedMonth}월` : '기간 선택'}
                        </span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${tokenCalendarOpen ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {/* 캘린더 드롭다운 */}
                      {tokenCalendarOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 z-50 border rounded-md bg-white dark:bg-gray-800 shadow-lg p-3">
                          {/* 연도 헤더 */}
                          <div className="flex items-center justify-between mb-3">
                            <button
                              onClick={() => setTokenCalendarYear(prev => prev - 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              type="button"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-base font-medium">{tokenCalendarYear}</span>
                            <button
                              onClick={() => setTokenCalendarYear(prev => prev + 1)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                              type="button"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                          
                          {/* 월 그리드 */}
                          <div className="grid grid-cols-3 gap-1 text-xs">
                            {['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'].map((monthName, index) => (
                              <button
                                key={monthName}
                                onClick={() => {
                                  const monthNum = index + 1;
                                  setTokenSelectedMonth(monthNum);
                                  setTokenPeriodFilter(`${tokenCalendarYear}-${String(monthNum).padStart(2, '0')}`);
                                  setTokenCalendarOpen(false); // 선택 후 캘린더 닫기
                                }}
                                className={`p-2 text-center rounded hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors ${
                                  tokenSelectedMonth === index + 1 
                                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-medium'
                                    : 'text-gray-600 dark:text-gray-400'
                                }`}
                                type="button"
                              >
                                {monthName}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">모델</Label>
                    <Select value={tokenModelFilter} onValueChange={setTokenModelFilter}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="전체" />
                      </SelectTrigger>
                      <SelectContent className="z-[10000]">
                        <SelectItem value="all">전체</SelectItem>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">검색어</Label>
                    <Input
                      placeholder="에이전트명 또는 질문 키워드로 검색하세요"
                      value={tokenKeywordFilter}
                      onChange={(e) => setTokenKeywordFilter(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  
                  <div className="md:col-span-1">
                    <Button variant="outline" className="h-10 w-full border-gray-300 bg-white hover:bg-gray-50">
                      검색
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 기간 날짜 정보 */}
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full text-base font-medium">
                <span className="text-gray-500 dark:text-gray-400">📅</span>
                <span>{getTokenPeriodPillText()}</span>
              </div>
            </div>

            {/* 토큰 소비량 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* 토큰 소비량 일일 평균 */}
              <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                        <Zap className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">{getTokenCardText().dailyAverage}</h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{getTokenCardText().dailyAverageDescription}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {(() => {
                          const totalTokens = filteredTokenData.reduce((sum, token) => sum + token.totalTokens, 0);
                          const avgDaily = Math.floor(totalTokens / 30 / 1000);
                          const baseValue = tokenSelectedMonth && tokenCalendarYear && 
                            new Date(tokenCalendarYear, tokenSelectedMonth - 1).getTime() !== new Date(new Date().getFullYear(), new Date().getMonth()).getTime() 
                            ? 186 : 247;
                          const calculatedValue = filteredTokenData.length > 0 ? avgDaily : baseValue;
                          return `${calculatedValue}K`;
                        })()}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-300">토큰/일</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 이번 달 예상 토큰 소비량 */}
              <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-100 dark:bg-green-800 rounded-lg">
                        <Zap className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">{getTokenCardText().monthlyPredicted}</h3>
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">{getTokenCardText().monthlyPredictedDescription}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {(() => {
                          const totalTokens = filteredTokenData.reduce((sum, token) => sum + token.totalTokens, 0);
                          const monthlyPredicted = Math.floor(totalTokens / 1000000 * 1.2); // 20% 증가 예상
                          const baseValue = tokenSelectedMonth && tokenCalendarYear && 
                            new Date(tokenCalendarYear, tokenSelectedMonth - 1).getTime() !== new Date(new Date().getFullYear(), new Date().getMonth()).getTime() 
                            ? 5.8 : 7.6;
                          const calculatedValue = filteredTokenData.length > 0 ? Math.max(monthlyPredicted, 1) : baseValue;
                          return `${calculatedValue}M`;
                        })()}
                      </div>
                      <div className="text-xs text-green-700 dark:text-green-300">토큰/월</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 이번 달 토큰 부족 예상 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이번 달 토큰 부족 예상 조직 */}
              <Card className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Building className="h-6 w-6 text-orange-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">{getTokenCardText().shortageOrganizations}</h3>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">{getTokenCardText().shortageOrganizationsDescription}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setTokenKeywordFilter('토큰 부족 예상 조직');
                        // 조직 목록으로 스크롤 이동
                        const tokenTable = document.querySelector('[data-testid="token-usage-table"]');
                        if (tokenTable) {
                          tokenTable.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                      className="text-2xl font-bold text-orange-900 dark:text-orange-100 hover:text-orange-700 dark:hover:text-orange-300 transition-colors cursor-pointer"
                      title="클릭하여 해당 조직 목록 보기"
                    >
                      {(() => {
                        const shortageOrgs = Math.floor(filteredTokenData.length * 0.3); // 약 30%의 조직이 부족 예상
                        const baseValue = tokenSelectedMonth && tokenCalendarYear && 
                          new Date(tokenCalendarYear, tokenSelectedMonth - 1).getTime() !== new Date(new Date().getFullYear(), new Date().getMonth()).getTime() 
                          ? 2 : 3;
                        const calculatedValue = filteredTokenData.length > 0 ? shortageOrgs : baseValue;
                        return `${calculatedValue}개`;
                      })()}
                    </button>
                  </div>
                </CardContent>
              </Card>

              {/* 이번 달 토큰 부족 예상 사용자 */}
              <Card className="border-red-200 bg-red-50 dark:bg-red-900/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-red-600" />
                      <div>
                        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">{getTokenCardText().shortageUsers}</h3>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{getTokenCardText().shortageUsersDescription}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('users');
                      }}
                      className="text-2xl font-bold text-red-900 dark:text-red-100 hover:text-red-700 dark:hover:text-red-300 transition-colors cursor-pointer"
                      title="클릭하여 사용자 목록 보기"
                    >
                      {(() => {
                        // 필터된 데이터에서 토큰 부족 예상 사용자 수 계산 (임시 로직)
                        const estimatedUsers = Math.floor(filteredTokenData.reduce((sum, token) => sum + token.totalTokens, 0) / 100000);
                        const baseValue = tokenSelectedMonth && tokenCalendarYear && 
                          new Date(tokenCalendarYear, tokenSelectedMonth - 1).getTime() !== new Date(new Date().getFullYear(), new Date().getMonth()).getTime() 
                          ? 5 : 8;
                        const calculatedValue = filteredTokenData.length > 0 ? Math.max(estimatedUsers, 1) : baseValue;
                        return `${calculatedValue}명`;
                      })()}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>




            {/* 토큰 사용량 테이블 */}
            <Card data-testid="token-usage-table">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="font-semibold tracking-tight text-[20px]">조직별 토큰 사용량 목록</CardTitle>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    const organizationStats = {};
                    filteredTokenData.forEach(token => {
                      const key = `${token.upperCategory}-${token.lowerCategory}-${token.detailCategory}`;
                      if (!organizationStats[key]) {
                        organizationStats[key] = true;
                      }
                    });
                    const uniqueOrgsCount = Object.keys(organizationStats).length;
                    const startIndex = (orgTokenCurrentPage - 1) * ORG_TOKENS_PER_PAGE + 1;
                    const endIndex = Math.min(orgTokenCurrentPage * ORG_TOKENS_PER_PAGE, uniqueOrgsCount);
                    
                    return uniqueOrgsCount > 0 
                      ? `전체 ${uniqueOrgsCount}개 조직 중 ${startIndex}-${endIndex}개 표시`
                      : '표시할 조직이 없습니다';
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          상위 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          하위 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          세부 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          개별 조직
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          소속 인원
                        </th>
                        <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none ${tokenSortField === 'avgUsagePercent' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-500'}`}
                            onClick={() => handleTokenSort('avgUsagePercent')}
                            title={getTokenSortTooltip('avgUsagePercent', '평균 토큰 사용량')}>
                          <div className="flex items-center justify-between">
                            <span>평균 토큰 사용량(%)</span>
                            <span className={`ml-1 ${tokenSortField === 'avgUsagePercent' ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-gray-400'}`}>
                              {getTokenSortIcon('avgUsagePercent')}
                            </span>
                          </div>
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                          토큰 설정
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {(() => {
                        // filteredTokenData를 기반으로 조직별 토큰 사용량 집계
                        const organizationStats = {};
                        
                        filteredTokenData.forEach(token => {
                          const key = `${token.upperCategory}-${token.lowerCategory}-${token.detailCategory}`;
                          if (!organizationStats[key]) {
                            organizationStats[key] = {
                              upperCategory: token.upperCategory || '미분류',
                              lowerCategory: token.lowerCategory || '미분류', 
                              detailCategory: token.detailCategory || '미분류',
                              totalTokens: 0,
                              count: 0,
                              users: []
                            };
                          }
                          
                          const stats = organizationStats[key];
                          stats.totalTokens += token.totalTokens;
                          stats.count++;
                          if (!stats.users.includes(token.userName)) {
                            stats.users.push(token.userName);
                          }
                        });
                        
                        // Object를 배열로 변환하고 사용률 계산
                        const organizationArray = Object.entries(organizationStats).map(([key, stats]) => {
                          // 토큰 사용률 계산 (토큰 수에 따른 백분율)
                          const avgUsagePercent = Math.min(100, Math.max(0, (stats.totalTokens / 10000) * 100));
                          
                          return {
                            id: key,
                            upperCategory: stats.upperCategory,
                            lowerCategory: stats.lowerCategory,
                            detailCategory: stats.detailCategory,
                            organizationName: stats.detailCategory,
                            totalTokens: stats.totalTokens,
                            avgUsagePercent: Math.round(avgUsagePercent * 10) / 10, // 소수점 1자리
                            personnelCount: stats.users.length,
                            questionCount: stats.count
                          };
                        });
                        
                        // 정렬 적용
                        const sortedOrganizations = organizationArray.sort((a, b) => {
                          if (tokenSortField === 'avgUsagePercent') {
                            return tokenSortDirection === 'asc' ? a.avgUsagePercent - b.avgUsagePercent : b.avgUsagePercent - a.avgUsagePercent;
                          }
                          return 0;
                        });
                        
                        // 페이지네이션 적용
                        const orgTokenStartIndex = (orgTokenCurrentPage - 1) * ORG_TOKENS_PER_PAGE;
                        const orgTokenEndIndex = orgTokenStartIndex + ORG_TOKENS_PER_PAGE;
                        const paginatedOrganizations = sortedOrganizations.slice(orgTokenStartIndex, orgTokenEndIndex);
                        
                        // 빈 결과 처리
                        if (paginatedOrganizations.length === 0 && sortedOrganizations.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                  <p className="text-lg font-medium mb-2">조건에 맞는 조직이 없습니다</p>
                                  <p className="text-sm">
                                    다른 조직 카테고리나 기간을 선택해보세요.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        
                        const getUsageColor = (percent: number) => {
                          if (percent >= 100) return 'text-red-600 dark:text-red-400 font-bold';
                          if (percent >= 90) return 'text-orange-600 dark:text-orange-400 font-semibold';
                          if (percent >= 80) return 'text-amber-600 dark:text-amber-400';
                          return 'text-green-600 dark:text-green-400';
                        };
                        
                        // 페이지네이션이 적용되어 빈 페이지인 경우 처리
                        if (paginatedOrganizations.length === 0) {
                          return (
                            <tr>
                              <td colSpan={7} className="px-6 py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                  <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                  <p className="text-lg font-medium mb-2">해당 페이지에 표시할 조직이 없습니다</p>
                                  <p className="text-sm">
                                    이전 페이지로 이동하거나 다른 조건을 선택해보세요.
                                  </p>
                                </div>
                              </td>
                            </tr>
                          );
                        }
                        
                        return paginatedOrganizations.map((org) => (
                          <tr 
                            key={org.id} 
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{org.upperCategory}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{org.lowerCategory}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{org.detailCategory}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{org.organizationName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 text-center">{org.personnelCount}명</td>
                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-mono ${getUsageColor(org.avgUsagePercent)}`}>
                              {org.avgUsagePercent}%
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  setSelectedOrgForTokenLimit(org);
                                  setShowTokenLimitModal(true);
                                }}
                                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200"
                                title="토큰 사용량 한도 설정"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <circle cx="12" cy="12" r="8" strokeWidth="2" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12M9 9h6M9 15h6" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                </div>

                {/* 조직별 토큰 사용량 페이지네이션 */}
                {(() => {
                  const organizationStats = {};
                  filteredTokenData.forEach(token => {
                    const key = `${token.upperCategory}-${token.lowerCategory}-${token.detailCategory}`;
                    if (!organizationStats[key]) {
                      organizationStats[key] = true;
                    }
                  });
                  const totalOrgTokenPages = Math.ceil(Object.keys(organizationStats).length / ORG_TOKENS_PER_PAGE);
                  
                  return totalOrgTokenPages > 1 && (
                    <PaginationComponent
                      currentPage={orgTokenCurrentPage}
                      totalPages={totalOrgTokenPages}
                      onPageChange={setOrgTokenCurrentPage}
                      totalItems={Object.keys(organizationStats).length}
                      itemsPerPage={ORG_TOKENS_PER_PAGE}
                      itemName="조직"
                      showItemCount={false}
                    />
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>


        </Tabs>



        {/* LMS 연동 다이얼로그 */}
        <Dialog open={isLmsDialogOpen} onOpenChange={setIsLmsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>LMS 연동 설정</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="lms-type" className="text-sm font-medium">LMS 유형</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="LMS 선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="blackboard">Blackboard</SelectItem>
                      <SelectItem value="moodle">Moodle</SelectItem>
                      <SelectItem value="canvas">Canvas</SelectItem>
                      <SelectItem value="sakai">Sakai</SelectItem>
                      <SelectItem value="d2l">D2L Brightspace</SelectItem>
                      <SelectItem value="custom">사용자 정의</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label htmlFor="lms-url" className="text-sm font-medium">LMS 서버 URL</Label>
                  <Input 
                    id="lms-url" 
                    placeholder="https://lms.university.edu" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="api-key" className="text-sm font-medium">API 키</Label>
                  <Input 
                    id="api-key" 
                    type="password"
                    placeholder="LMS API 키 입력" 
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="sync-interval" className="text-sm font-medium">동기화 주기</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="동기화 주기 선택" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="1h">1시간마다</SelectItem>
                      <SelectItem value="6h">6시간마다</SelectItem>
                      <SelectItem value="daily">매일</SelectItem>
                      <SelectItem value="weekly">매주</SelectItem>
                      <SelectItem value="manual">수동</SelectItem>
                    </SelectContent>
                  </Select>
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
                      <Label className="text-sm text-gray-600">상위 조직</Label>
                      <Select defaultValue="인문대학">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="인문대학">인문대학</SelectItem>
                          <SelectItem value="공과대학">공과대학</SelectItem>
                          <SelectItem value="경영대학">경영대학</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">하위 조직</Label>
                      <Select defaultValue="국문학과">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          <SelectItem value="전체">전체</SelectItem>
                          <SelectItem value="국문학과">국문학과</SelectItem>
                          <SelectItem value="영문학과">영문학과</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">세부 조직</Label>
                      <Select defaultValue="4학년">
                        <SelectTrigger>
                          <SelectValue placeholder="전체" />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
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
                  <div className="flex space-x-2">
                    <Button 
                      variant="destructive"
                      onClick={() => setIsDeleteDocumentDialogOpen(true)}
                    >
                      문서 삭제
                    </Button>
                    {selectedDocument && (
                      <Button 
                        variant={selectedDocument.isVisibleToUsers === true ? "secondary" : "outline"}
                        onClick={() => {
                          updateDocumentVisibilityMutation.mutate({
                            documentId: selectedDocument.id,
                            isVisible: selectedDocument.isVisibleToUsers !== true
                          });
                        }}
                        disabled={updateDocumentVisibilityMutation.isPending}
                      >
                        {updateDocumentVisibilityMutation.isPending 
                          ? "처리중..." 
                          : selectedDocument.isVisibleToUsers === true 
                            ? "사용자에게 숨김" 
                            : "사용자에게 표시"
                        }
                      </Button>
                    )}
                  </div>
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
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-gray-900 dark:text-white" />
                <DialogTitle>문서 파일 업로드</DialogTitle>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                공통 문서를 한 번에 업로드하고, 다양한 에이전트에 연동하세요.
              </div>
              <div className="border-b mt-3"></div>
            </DialogHeader>
            <div className="space-y-6">
              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xlsx,.csv,.hwp,.jpg,.jpeg,.png,.gif"
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
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                <p className="text-sm text-gray-500 mb-4">
                  지원 파일 : pdf, doc, docx, txt, ppt, pptx, xls, xlsx, csv, hwp, jpg, png, gif<br />
                  (최대 8개 / 파일당 최대 50MB)
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
                <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">선택된 파일 ({selectedDocumentFiles.length}개)</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleClearAllFiles}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      전체 삭제
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedDocumentFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{file.name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 문서 종류 선택 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">문서 종류</Label>
                <Select value={documentUploadType} onValueChange={setDocumentUploadType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10000]">
                    <SelectItem value="강의 자료">강의 자료</SelectItem>
                    <SelectItem value="교육과정">교육과정</SelectItem>
                    <SelectItem value="정책 문서">정책 문서</SelectItem>
                    <SelectItem value="매뉴얼">매뉴얼</SelectItem>
                    <SelectItem value="양식">양식</SelectItem>
                    <SelectItem value="공지사항">공지사항</SelectItem>
                    <SelectItem value="기타">기타</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 문서 설명 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">문서 설명</Label>
                <Textarea 
                  placeholder="업로드하는 문서에 대한 설명을 입력하세요"
                  value={documentUploadDescription}
                  onChange={(e) => setDocumentUploadDescription(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>



              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">문서 노출 설정</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="document-visible" 
                      className="rounded" 
                      checked={documentVisibility}
                      onChange={(e) => setDocumentVisibility(e.target.checked)}
                    />
                    <Label htmlFor="document-visible">일반 사용자에게 이 문서를 표시</Label>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 ml-6">
                    체크 해제 시 관리자만 해당 문서에 접근할 수 있습니다.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setSelectedDocumentFiles([]);
                  setDocumentUploadType('기타');
                  setDocumentUploadDescription('');
                  setDocumentVisibility(true);
                  setIsDocumentUploadDialogOpen(false);
                }}>
                  취소
                </Button>
                <Button 
                  onClick={handleDocumentUpload}
                  disabled={selectedDocumentFiles.length === 0 || isDocumentUploading}
                >
                  {isDocumentUploading ? `업로드 중... (${Math.round(documentUploadProgress)}%)` : `업로드 시작`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 새 조직 생성 다이얼로그 */}
        <Dialog open={isNewCategoryDialogOpen} onOpenChange={setIsNewCategoryDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>새 조직 카테고리 생성</DialogTitle>
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
                  <SelectContent className="z-[10000]">
                    <SelectItem value="상위 카테고리 (예: 인문대학)">상위 카테고리 (예: 인문대학)</SelectItem>
                    <SelectItem value="하위 카테고리 (예: 국어국문학과)">하위 카테고리 (예: 국어국문학과)</SelectItem>
                    <SelectItem value="세부 카테고리 (예: 현대문학전공)">세부 카테고리 (예: 현대문학전공)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 상위 카테고리 이름 */}
              <div className="space-y-2">
                <Label>상위 조직 이름 *</Label>
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
                    className="bg-blue-600 hover:bg-blue-700 text-[#ffffff]"
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

        {/* 조직 파일 업로드 다이얼로그 */}
        <Dialog open={isOrgCategoryUploadDialogOpen} onOpenChange={setIsOrgCategoryUploadDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>조직 파일 업로드</DialogTitle>
              <div className="text-sm text-gray-600 mt-2">파일을 업로드해 조직구조를 일괄 등록할 수 있습니다.</div>
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
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onClick={handleOrgCategoryFileSelect}
              >
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                <p className="text-sm text-gray-500 mb-4">
                  지원 파일 : csv, xls, xlsx(최대 50MB)
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
                <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">선택된 파일 ({selectedOrgCategoryFiles.length}개)</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedOrgCategoryFiles([])}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      전체 삭제
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedOrgCategoryFiles.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md"
                      >
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{file.name}</p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrgCategoryFiles(prev => prev.filter((_, i) => i !== index))}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 업로드된 파일 목록 */}
              {uploadedOrgFiles.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">업로드된 파일 ({uploadedOrgFiles.length}개)</Label>
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
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 ml-2 p-1"
                          >
                            {deleteOrgFileMutation.isPending ? '...' : <X className="w-4 h-4" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">파일 형식 요구사항</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadOrgSampleFile}
                    className="korean-text text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    샘플 파일 다운로드
                  </Button>
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 첫 번째 행: 헤더 (조직명, 상위 조직, 하위 조직, 세부 조직)</p>
                  <p>• 조직명: 조직의 정식 명칭 (필수)</p>
                  <p>• 상위 조직: 단과대학/본부 등 최상위 조직</p>
                  <p>• 하위 조직: 학과/처/부 등</p>
                  <p>• 세부 조직: 세부전공/팀/과 등</p>
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
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsOrgCategoryUploadDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={handleOrgCategoryUpload}
                  disabled={selectedOrgCategoryFiles.length === 0 || isOrgCategoryUploading}
                >
                  {isOrgCategoryUploading ? `업로드 중... (${Math.round(orgCategoryUploadProgress)}%)` : `업로드 시작`}
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
              <div className="text-sm text-gray-600 mt-2">파일을 업로드해 여러 사용자를 일괄 등록할 수 있습니다.</div>
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
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                onDragOver={handleDragOver}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDrop={handleUserFileDrop}
                onClick={handleUserFileSelect}
              >
                <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                <p className="text-sm text-gray-500 mb-4">
                  지원 파일 : csv, xls, xlsx(최대 50MB)
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
                <div className="border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">선택된 파일 ({selectedUserFiles.length}개)</h3>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedUserFiles([])}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      전체 삭제
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {selectedUserFiles.map((file, index) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md"
                        >
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 truncate">{file.name}</p>
                              <p className="text-xs text-blue-600 dark:text-blue-400">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedUserFiles(prev => prev.filter((_, i) => i !== index))}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100">파일 형식 요구사항</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSampleFile}
                    className="korean-text text-green-700 border-green-300 hover:bg-green-100"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    샘플 파일 다운로드
                  </Button>
                </div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                  <p>• 첫 번째 행: 헤더 (사용자명, 사용자 ID, 이메일, 유형, 상위 조직, 하위 조직, 세부 조직, 직책)</p>
                  <p>• ID : 학번, 교번 등 사용자 ID(필수)</p>
                  <p>• 유형: 학생, 교직원 등 사용자 유형(필수)</p>
                  <p>• 이메일: 사용자의 학교 이메일 주소(선택)</p>
                  <p>• 상위조직: 사용자가 소속된 최상위 조직(필수)</p>
                  <p>• 하위조직, 세부조직, 직책 : 사용자가 소속된 하위 조직 및 조직내 역할 (선택)</p>
                  <p>• 엑셀 파일의 경우 첫 번째 시트만 처리됩니다.</p>
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

                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsFileUploadDialogOpen(false)}>
                  취소
                </Button>
                <Button 
                  onClick={handleUserFileUpload}
                  disabled={selectedUserFiles.length === 0 || isUserFileUploading}
                >
                  {isUserFileUploading ? `업로드 중... (${Math.round(userFileUploadProgress)}%)` : `업로드 시작`}
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
                      <Label className="text-sm font-medium">노출 여부</Label>
                      <Select 
                        value={editingDocumentVisibility ? "visible" : "hidden"} 
                        onValueChange={(value) => {
                          setEditingDocumentVisibility(value === "visible");
                        }}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          <SelectItem value="visible">일반 사용자에게 표시</SelectItem>
                          <SelectItem value="hidden">관리자만 접근 가능</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">파일 형식</Label>
                      <p className="text-sm mt-1">{documentDetailData.name.split('.').pop()?.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-600 dark:text-gray-400">파일 크기</Label>
                      <p className="text-sm mt-1">{documentDetailData.size}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">문서 상태</Label>
                      <Select value={editingDocumentStatus} onValueChange={setEditingDocumentStatus}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          <SelectItem value="active">사용 중</SelectItem>
                          <SelectItem value="inactive">미사용</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">문서 종류</Label>
                      <Select value={editingDocumentType} onValueChange={setEditingDocumentType}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10000]">
                          <SelectItem value="강의자료">강의자료</SelectItem>
                          <SelectItem value="정책·규정 문서">정책·규정 문서</SelectItem>
                          <SelectItem value="매뉴얼·가이드">매뉴얼·가이드</SelectItem>
                          <SelectItem value="서식·양식">서식·양식</SelectItem>
                          <SelectItem value="공지·안내">공지·안내</SelectItem>
                          <SelectItem value="교육과정">교육과정</SelectItem>
                          <SelectItem value="FAQ·Q&A">FAQ·Q&A</SelectItem>
                          <SelectItem value="연구자료">연구자료</SelectItem>
                          <SelectItem value="회의·내부자료">회의·내부자료</SelectItem>
                          <SelectItem value="기타">기타</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium">문서 설명</Label>
                    <textarea
                      value={editingDocumentDescription}
                      onChange={(e) => setEditingDocumentDescription(e.target.value)}
                      placeholder="문서에 대한 설명을 입력하세요..."
                      className="mt-1 w-full h-20 px-3 py-2 border border-gray-300 rounded-md resize-none text-sm"
                    />
                  </div>
                </div>

                {/* 현재 연결된 에이전트 */}
                <div>
                  <h3 className="text-lg font-medium mb-3">현재 연결된 에이전트</h3>
                  <div className="space-y-3 mb-4">
                    {selectedDocumentAgents.length > 0 ? (
                      selectedDocumentAgents.map((agentName, index) => {
                        const agentData = agents?.find((a: any) => a.name === agentName);
                        const agentOrgData = organizations?.find((org: any) => org.id === agentData?.organizationId);
                        return (
                          <div 
                            key={index}
                            className="bg-white dark:bg-gray-700 border rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{agentName}</h4>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                                      {agentOrgData && (
                                        <div>
                                          <span className="font-medium">조직:</span> {agentOrgData.upperCategory} / {agentOrgData.lowerCategory}
                                          {agentOrgData.detailCategory && ` / ${agentOrgData.detailCategory}`}
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">연결일:</span> {new Date().toLocaleDateString('ko-KR')}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setSelectedDocumentAgents(prev => prev.filter((_, i) => i !== index))}
                                className="text-red-500 hover:text-red-700 p-2"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>연결된 에이전트가 없습니다</p>
                        <p className="text-sm">아래에서 에이전트를 검색하여 연결하세요</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 에이전트 연결 영역 */}
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <h3 className="text-lg font-medium mb-4">에이전트 연결</h3>
                  
                  {/* 에이전트 검색 및 필터 */}
                  <div className="space-y-4 mb-4">
                    {/* 조직 필터 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label className="text-sm font-medium">상위 조직</Label>
                        <Select value={selectedDocumentUpperCategory} onValueChange={setSelectedDocumentUpperCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent className="z-[10000]">
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
                        <Label className="text-sm font-medium">하위 조직</Label>
                        <Select value={selectedDocumentLowerCategory} onValueChange={setSelectedDocumentLowerCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent className="z-[10000]">
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
                        <Label className="text-sm font-medium">세부 조직</Label>
                        <Select value={selectedDocumentDetailCategory} onValueChange={setSelectedDocumentDetailCategory}>
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="전체" />
                          </SelectTrigger>
                          <SelectContent className="z-[10000]">
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
                          <SelectContent className="z-[10000]">
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
                        <Label className="text-sm font-medium">키워드 검색</Label>
                        <Input
                          placeholder="에이전트 이름 또는 설명에 포함된 키워드로 검색..."
                          value={documentAgentSearchQuery}
                          onChange={(e) => setDocumentAgentSearchQuery(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      
                      <div>
                        <Button 
                          onClick={() => {
                            setDocumentAgentSearchQuery("");
                            setSelectedDocumentUpperCategory("all");
                            setSelectedDocumentLowerCategory("all");
                            setSelectedDocumentDetailCategory("all");
                            setSelectedDocumentAgentType("all");
                          }}
                          className="mt-6"
                        >
                          {t('admin.filterReset')}
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
                          {agents && agents.length > 0 ? 
                            agents
                              .filter(agent => {
                                // 검색어 필터
                                const searchMatch = !documentAgentSearchQuery.trim() || 
                                  agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                                  (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                                
                                // 유형 필터
                                const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                                
                                // 조직 필터
                                const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                                const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                                  (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                                  (agent.upperCategory === selectedDocumentUpperCategory);
                                
                                const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                                  (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                                  (agent.lowerCategory === selectedDocumentLowerCategory);
                                
                                const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                                  (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                                  (agent.detailCategory === selectedDocumentDetailCategory);
                                
                                return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                              })
                              .slice((documentAgentCurrentPage - 1) * 10, documentAgentCurrentPage * 10)
                              .map((agent) => (
                            <tr key={agent.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                              <td className="px-4 py-4">
                                <div className="flex items-center">
                                  <div 
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium mr-3"
                                    style={{ backgroundColor: agent.backgroundColor || '#6B7280' }}
                                  >
                                    {(agent as any).isCustomIcon && (agent as any).icon?.startsWith('/uploads/') ? (
                                      <img 
                                        src={`${(agent as any).icon}?t=${Date.now()}`} 
                                        alt={`${agent.name} 아이콘`}
                                        className="w-full h-full object-cover rounded-full"
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.style.display = 'none';
                                          const nextElement = target.nextElementSibling as HTMLElement;
                                          if (nextElement) nextElement.classList.remove('hidden');
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
                                          'fas fa-book': BookOpen,
                                          'fas fa-brain': Brain,
                                          'fas fa-coffee': Coffee,
                                          'fas fa-music': Music,
                                          'fas fa-target': Target,
                                          'fas fa-zap': Zap,
                                        };
                                        const IconComponent = iconMap[iconValue] || User;
                                        return <IconComponent className="text-white w-4 h-4" />;
                                      })()}
                                    </div>
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
                                {(() => {
                                  const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                                  return (
                                    <div>
                                      <div className="text-sm text-gray-900 dark:text-gray-100">
                                        {agentOrgData?.upperCategory || agent.upperCategory || '미지정'}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {agentOrgData?.lowerCategory || agent.lowerCategory || '미지정'}
                                      </div>
                                      {(agentOrgData?.detailCategory || agent.detailCategory) && (
                                        <div className="text-xs text-gray-400">
                                          {agentOrgData?.detailCategory || agent.detailCategory}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-900 dark:text-gray-100">{agent.documentCount || 0}개</span>
                              </td>
                              <td className="px-4 py-4">
                                <span className="text-sm text-gray-900 dark:text-gray-100">{agent.userCount || 0}명</span>
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
                          )) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center">
                                <div className="text-gray-500 dark:text-gray-400">
                                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                  <p className="text-lg font-medium mb-2">에이전트를 찾을 수 없습니다</p>
                                  <p className="text-sm">필터 조건을 확인하거나 검색어를 다시 입력해보세요.</p>
                                </div>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* 에이전트 목록 페이지네이션 */}
                    {agents && agents.length > 0 && (
                      <div className="flex items-center justify-between px-6 py-4 border-t">
                        <div className="text-sm text-gray-500">
                          전체 {agents.filter(agent => {
                            const searchMatch = !documentAgentSearchQuery.trim() || 
                              agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                              (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                            const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                            const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                            const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                              (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                              (agent.upperCategory === selectedDocumentUpperCategory);
                            const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                              (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                              (agent.lowerCategory === selectedDocumentLowerCategory);
                            const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                              (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                              (agent.detailCategory === selectedDocumentDetailCategory);
                            return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                          }).length}개 중 {Math.min(documentAgentCurrentPage * 10, agents.filter(agent => {
                            const searchMatch = !documentAgentSearchQuery.trim() || 
                              agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                              (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                            const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                            const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                            const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                              (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                              (agent.upperCategory === selectedDocumentUpperCategory);
                            const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                              (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                              (agent.lowerCategory === selectedDocumentLowerCategory);
                            const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                              (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                              (agent.detailCategory === selectedDocumentDetailCategory);
                            return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                          }).length)}개 표시
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDocumentAgentCurrentPage(Math.max(1, documentAgentCurrentPage - 1))}
                            disabled={documentAgentCurrentPage === 1}
                            className="w-10 h-10 p-0"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          
                          {(() => {
                            const filteredAgents = agents.filter(agent => {
                              const searchMatch = !documentAgentSearchQuery.trim() || 
                                agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                                (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                              const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                              const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                              const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                                (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                                (agent.upperCategory === selectedDocumentUpperCategory);
                              const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                                (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                                (agent.lowerCategory === selectedDocumentLowerCategory);
                              const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                                (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                                (agent.detailCategory === selectedDocumentDetailCategory);
                              return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                            });
                            return Array.from({ length: Math.ceil(filteredAgents.length / 10) }, (_, i) => i + 1).map(page => (
                              <Button
                                key={page}
                                variant={page === documentAgentCurrentPage ? "default" : "outline"}
                                size="sm"
                                onClick={() => setDocumentAgentCurrentPage(page)}
                                className="w-10 h-10 p-0 !min-w-[40px] !min-h-[40px] !box-border"
                                style={{
                                  width: '40px !important',
                                  height: '40px !important',
                                  minWidth: '40px !important',
                                  minHeight: '40px !important',
                                  border: page === documentAgentCurrentPage ? '2px solid #3b82f6' : '1px solid #d1d5db'
                                }}
                              >
                                {page}
                              </Button>
                            ));
                          })()}
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const filteredAgents = agents.filter(agent => {
                                const searchMatch = !documentAgentSearchQuery.trim() || 
                                  agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                                  (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                                const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                                const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                                const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                                  (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                                  (agent.upperCategory === selectedDocumentUpperCategory);
                                const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                                  (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                                  (agent.lowerCategory === selectedDocumentLowerCategory);
                                const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                                  (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                                  (agent.detailCategory === selectedDocumentDetailCategory);
                                return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                              });
                              setDocumentAgentCurrentPage(Math.min(Math.ceil(filteredAgents.length / 10), documentAgentCurrentPage + 1));
                            }}
                            disabled={(() => {
                              const filteredAgents = agents.filter(agent => {
                                const searchMatch = !documentAgentSearchQuery.trim() || 
                                  agent.name.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()) ||
                                  (agent.description && agent.description.toLowerCase().includes(documentAgentSearchQuery.toLowerCase()));
                                const typeMatch = selectedDocumentAgentType === 'all' || agent.category === selectedDocumentAgentType;
                                const agentOrgData = organizations?.find((org: any) => org.id === agent.organizationId);
                                const upperCategoryMatch = selectedDocumentUpperCategory === 'all' || 
                                  (agentOrgData?.upperCategory === selectedDocumentUpperCategory) ||
                                  (agent.upperCategory === selectedDocumentUpperCategory);
                                const lowerCategoryMatch = selectedDocumentLowerCategory === 'all' || 
                                  (agentOrgData?.lowerCategory === selectedDocumentLowerCategory) ||
                                  (agent.lowerCategory === selectedDocumentLowerCategory);
                                const detailCategoryMatch = selectedDocumentDetailCategory === 'all' || 
                                  (agentOrgData?.detailCategory === selectedDocumentDetailCategory) ||
                                  (agent.detailCategory === selectedDocumentDetailCategory);
                                return searchMatch && typeMatch && upperCategoryMatch && lowerCategoryMatch && detailCategoryMatch;
                              });
                              return documentAgentCurrentPage === Math.ceil(filteredAgents.length / 10);
                            })()}
                            className="w-10 h-10 p-0"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (documentDetailData) {
                        setSelectedDocument(documentDetailData);
                        setIsDeleteDocumentDialogOpen(true);
                      }
                    }}
                    disabled={updateDocumentMutation.isPending}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    문서 삭제
                  </Button>
                  
                  <div className="flex space-x-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setIsDocumentDetailOpen(false);
                        setDocumentDetailData(null);
                      }}
                      disabled={updateDocumentMutation.isPending}
                    >
                      취소
                    </Button>
                    <Button 
                      onClick={() => {
                        if (documentDetailData && selectedDocument) {
                          // 에이전트 이름을 ID로 변환
                          const connectedAgentIds = selectedDocumentAgents.map(agentName => {
                            const agent = agents?.find((a: any) => a.name === agentName);
                            return agent ? agent.id : null;
                          }).filter(id => id !== null);
                          
                          updateDocumentMutation.mutate({
                            id: documentDetailData.id,
                            status: editingDocumentStatus,
                            type: editingDocumentType,
                            description: editingDocumentDescription,
                            connectedAgents: connectedAgentIds,
                            isVisibleToUsers: editingDocumentVisibility,
                          });
                        }
                      }}
                      disabled={updateDocumentMutation.isPending}
                    >
                      {updateDocumentMutation.isPending ? "저장 중..." : "저장"}
                    </Button>
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
              <DialogTitle>사용자 상세 정보</DialogTitle>
              <DialogDescription>사용자 정보를 수정합니다.</DialogDescription>
            </DialogHeader>
            
            {selectedUser ? (
              <Form {...userEditForm}>
                <form onSubmit={userEditForm.handleSubmit((data) => {
                  console.log('Form submitted with data:', data);
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

                {/* 사용자 ID와 사용자 유형 정보를 수평 배치 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 사용자 ID 정보 */}
                  <div className="space-y-1">
                    <div className="text-sm font-medium">사용자 ID</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">{selectedUser?.id || selectedUser?.username}</div>
                  </div>

                  {/* 사용자 유형 */}
                  <div className="space-y-3">
                    <FormField
                      control={userEditForm.control}
                      name="userType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">유형</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="유형 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="student">학생</SelectItem>
                              <SelectItem value="faculty">교직원</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
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
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">소속 정보</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      className="text-xs"
                      onClick={addUserEditAffiliation}
                      disabled={userEditAffiliations.length >= 3}
                    >
                      + 소속된 카테고리 추가
                    </Button>
                  </div>
                  
                  {/* 동적 소속 정보 목록 */}
                  {userEditAffiliations.map((affiliation, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">소속 정보 {index + 1}</Label>
                        {userEditAffiliations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeUserEditAffiliation(index)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm">상위 조직 *</Label>
                          <Select 
                            value={affiliation.upperCategory || ""} 
                            onValueChange={(value) => updateUserEditAffiliation(index, 'upperCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(organizations.map(org => org.upperCategory).filter(Boolean))).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm">하위 조직</Label>
                          <Select 
                            value={affiliation.lowerCategory || ""} 
                            onValueChange={(value) => updateUserEditAffiliation(index, 'lowerCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(
                                organizations
                                  .filter(org => !affiliation.upperCategory || org.upperCategory === affiliation.upperCategory)
                                  .map(org => org.lowerCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm">세부 조직</Label>
                          <Select 
                            value={affiliation.detailCategory || ""} 
                            onValueChange={(value) => updateUserEditAffiliation(index, 'detailCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(
                                organizations
                                  .filter(org => 
                                    (!affiliation.upperCategory || org.upperCategory === affiliation.upperCategory) &&
                                    (!affiliation.lowerCategory || org.lowerCategory === affiliation.lowerCategory)
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
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">직책/역할</Label>
                          <Select 
                            value={affiliation.position || ""} 
                            onValueChange={(value) => updateUserEditAffiliation(index, 'position', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
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
                        </div>
                        
                        <div>
                          {index === 0 ? (
                            <div>
                              <Label className="text-sm">시스템 역할 *</Label>
                              <Select onValueChange={(value) => userEditForm.setValue('role', value)} value={userEditForm.watch('role') || ""}>
                                <SelectTrigger>
                                  <SelectValue placeholder="역할 선택" />
                                </SelectTrigger>
                                <SelectContent className="z-[10000]">
                                  <SelectItem value="user">일반 사용자</SelectItem>
                                  <SelectItem value="master_admin">마스터 관리자</SelectItem>
                                  <SelectItem value="operation_admin">운영 관리자</SelectItem>
                                  <SelectItem value="category_admin">조직 관리자</SelectItem>
                                  <SelectItem value="agent_admin">에이전트 관리자</SelectItem>
                                  <SelectItem value="qa_admin">QA 관리자</SelectItem>
                                  <SelectItem value="doc_admin">문서 관리자</SelectItem>
                                  <SelectItem value="external">외부 사용자</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          ) : (
                            <div>
                              <Label className="text-sm text-gray-400">시스템 역할</Label>
                              <div className="text-sm text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded border">
                                첫 번째 소속에서만 설정
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                </div>

                {/* 사용 중인 에이전트 목록 */}
                <div className="space-y-3">
                  <UserActiveAgentsSection
                    userId={selectedUser?.id}
                    getUserRoleForAgent={getUserRoleForAgent}
                    getUserRoleDisplayForAgent={getUserRoleDisplayForAgent}
                    onAgentClick={openAgentDetailDialog}
                  />
                </div>

                {/* 계정 정보 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">계정 정보</Label>
                    <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                      <div>계정 등록일: 10/4/2024, 6:22:27 PM</div>
                      <div>최종 접속일: 5/31/2025, 9:41:31 AM</div>
                    </div>
                  </div>
                  
                  {/* 계정 상태 */}
                  <div className="space-y-3">
                    <FormField
                      control={userEditForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">계정 상태</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="active">활성</SelectItem>
                              <SelectItem value="inactive">비활성</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* 토큰 사용현황 */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800 space-y-3">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <Label className="text-sm font-medium">토큰 사용 현황</Label>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-300">사용량</span>
                      <span className="text-sm font-medium text-green-600">22% 사용</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: '22%' }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      다음 리셋: 2025-08-31
                    </div>
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
                          placeholder="사용자에 대한 추가 설명이나 메모를 입력하세요."
                          className="min-h-20"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* 버튼 */}
                <div className="flex justify-end space-x-2 pt-4">
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
            ) : (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="text-gray-500 dark:text-gray-400">
                    사용자 정보를 불러오는 중...
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    다이얼로그 상태: {isUserDetailDialogOpen ? '열림' : '닫힘'}
                  </div>
                  <div className="text-xs text-gray-400">
                    선택된 사용자: {selectedUser ? String((selectedUser as any).id || (selectedUser as any).username || '알 수 없음') : '없음'}
                  </div>
                </div>
              </div>
            )}
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
                  <Label className="text-sm font-medium"> 기본 정보</Label>
                  
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
                          <FormLabel className="text-sm">사용자 유형 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="유형 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="z-[10000]">
                              <SelectItem value="student">학생</SelectItem>
                              <SelectItem value="faculty">교직원</SelectItem>
                              <SelectItem value="other">기타</SelectItem>
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
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">소속 정보</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={addNewUserAffiliation}
                        disabled={newUserAffiliations.length >= 3}
                      >
                        + 소속된 카테고리 추가
                      </Button>
                    </div>
                    
                    {/* 동적 소속 정보 목록 */}
                    {newUserAffiliations.map((affiliation, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-gray-700 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">소속 정보 {index + 1}</Label>
                        {newUserAffiliations.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeNewUserAffiliation(index)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label className="text-sm">상위 조직 *</Label>
                          <Select 
                            value={affiliation.upperCategory || ""} 
                            onValueChange={(value) => updateNewUserAffiliation(index, 'upperCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(organizations.map(org => org.upperCategory).filter(Boolean))).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm">하위 조직</Label>
                          <Select 
                            value={affiliation.lowerCategory || ""} 
                            onValueChange={(value) => updateNewUserAffiliation(index, 'lowerCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(
                                organizations
                                  .filter(org => !affiliation.upperCategory || org.upperCategory === affiliation.upperCategory)
                                  .map(org => org.lowerCategory)
                                  .filter(Boolean)
                              )).sort().map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm">세부 조직</Label>
                          <Select 
                            value={affiliation.detailCategory || ""} 
                            onValueChange={(value) => updateNewUserAffiliation(index, 'detailCategory', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
                              {Array.from(new Set(
                                organizations
                                  .filter(org => 
                                    (!affiliation.upperCategory || org.upperCategory === affiliation.upperCategory) &&
                                    (!affiliation.lowerCategory || org.lowerCategory === affiliation.lowerCategory)
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
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">직책/역할</Label>
                          <Select 
                            value={affiliation.position || ""} 
                            onValueChange={(value) => updateNewUserAffiliation(index, 'position', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="선택" />
                            </SelectTrigger>
                            <SelectContent className="z-[10000]">
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
                        </div>
                        
                        <div>
                          {index === 0 ? (
                            <FormField
                              control={newUserForm.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm">시스템 역할 *</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value || ""}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="역할 선택" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[10000]">
                                      <SelectItem value="user">일반 사용자</SelectItem>
                                      <SelectItem value="master_admin">마스터 관리자</SelectItem>
                                      <SelectItem value="operation_admin">운영 관리자</SelectItem>
                                      <SelectItem value="category_admin">조직 관리자</SelectItem>
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
                          ) : (
                            <div>
                              <Label className="text-sm text-gray-400">시스템 역할</Label>
                              <div className="text-sm text-gray-400 p-2 bg-gray-100 dark:bg-gray-700 rounded border">
                                첫 번째 소속에서만 설정
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                            <SelectContent className="z-[10000]">
                              <SelectItem value="active">활성</SelectItem>
                              <SelectItem value="inactive">비활성</SelectItem>
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
                <div className="flex justify-end gap-3 pt-6 border-t">
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
                    {createUserMutation.isPending ? '추가 중...' : '사용자 추가'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* 에이전트 상세 정보 대화상자 */}
        <Dialog open={isAgentDetailDialogOpen} onOpenChange={setIsAgentDetailDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] md:h-[80vh] flex flex-col">
            {/* 고정 헤더 */}
            <DialogHeader className="flex-shrink-0 border-b pb-3 p-3 bg-white dark:bg-gray-800">
              <div className="flex items-center space-x-2">
                <Clipboard className="w-5 h-5 text-black dark:text-white" />
                <DialogTitle>에이전트 상세 정보</DialogTitle>
              </div>
            </DialogHeader>
            
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">{/* 콘텐츠가 여기에 이동됩니다 */}
            {selectedAgent && (
              <>
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
                      모델 및 응답 설정
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
                    <form onSubmit={agentForm.handleSubmit((data) => updateAgentMutation.mutate({ ...data, id: selectedAgent.id }))} className="space-y-6">
                      
                      {/* 기본 정보 탭 */}
                      <TabsContent value="basic" className="space-y-6">
                        <div className="space-y-6">
                          {/* 에이전트 이름 */}
                          <FormField
                            control={agentForm.control}
                            name="name"
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center justify-between">
                                  <FormLabel className="text-sm font-medium text-gray-700">에이전트 이름 *</FormLabel>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedAgentForIconChange(selectedAgent);
                                      setShowIconChangeModal(true);
                                    }}
                                    className="flex items-center gap-2 px-3 py-1 text-xs"
                                  >
                                    <ImageIcon className="w-4 h-4" />
                                    아이콘 변경
                                  </Button>
                                </div>
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
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">에이전트 소개</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="에이전트의 역할이나 기능을 간단히 소개해 주세요." 
                                    maxLength={200}
                                    className="min-h-[100px] focus:ring-2 focus:ring-blue-500"
                                    {...field} 
                                  />
                                </FormControl>
                                <div className="text-xs text-gray-500">{field.value?.length || 0}/200자</div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* 상태 */}
                          <FormField
                            control={agentForm.control}
                            name="status"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm font-medium text-gray-700">상태</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="상태 선택" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="활성">활성</SelectItem>
                                    <SelectItem value="비활성">비활성</SelectItem>
                                    <SelectItem value="대기">대기</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* 에이전트 유형 - 컴팩트 디스플레이 */}
                          <div className="space-y-3">
                            <Label className="text-base font-medium text-gray-900">에이전트 유형</Label>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <FormField
                                control={agentForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                      <FormControl>
                                        <SelectTrigger className="bg-white border-green-300 focus:ring-2 focus:ring-blue-500">
                                          <SelectValue placeholder={t('admin.typeSelection')} />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
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
                          </div>
                          
                          {/* 소속 조직 - 컴팩트 계층형 디스플레이 */}
                          <div className="space-y-3">
                            <Label className="text-base font-medium text-gray-900">에이전트 소속 조직</Label>
                            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                              <div className="space-y-3">
                              <FormField
                                control={agentForm.control}
                                name="upperCategory"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-sm font-medium text-gray-700">상위 조직 *</FormLabel>
                                    <Select 
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        agentForm.setValue('lowerCategory', '');
                                        agentForm.setValue('detailCategory', '');
                                      }} 
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="bg-white border-green-300 focus:ring-2 focus:ring-blue-500">
                                          <SelectValue placeholder="상위 조직 선택" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
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
                                    <FormLabel className="text-sm font-medium text-gray-700">하위 조직 *</FormLabel>
                                    <Select 
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                        agentForm.setValue('detailCategory', '');
                                      }} 
                                      value={field.value}
                                      disabled={!agentForm.watch('upperCategory')}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="bg-white border-green-300 focus:ring-2 focus:ring-blue-500">
                                          <SelectValue placeholder="하위 조직 선택" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
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
                                    <FormLabel className="text-sm font-medium text-gray-700">세부 조직</FormLabel>
                                    <Select 
                                      onValueChange={field.onChange} 
                                      value={field.value}
                                      disabled={!agentForm.watch('lowerCategory')}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="bg-white border-green-300 focus:ring-2 focus:ring-blue-500">
                                          <SelectValue placeholder="세부 조직 선택" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent className="z-[10000]">
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
                                    <Input placeholder={t('agent.nicknamePlaceholder')} {...field} />
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
                                  <FormLabel className="text-sm font-medium text-gray-700">{t('agent.speechStyle')}</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder={t('agent.speechStylePlaceholder')}
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
                              name="personality"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">{t('agent.personality')}</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder={t('agent.personalityPlaceholder')}
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
                              name="additionalPrompt"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">{t('agent.additionalPrompt')}</FormLabel>
                                  <FormControl>
                                    <Textarea 
                                      placeholder={t('agent.additionalPromptPlaceholder')}
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

                      {/* 모델 및 응답 설정 탭 */}
                      <TabsContent value="model" className="space-y-6">
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={agentForm.control}
                              name="llmModel"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">LLM 모델</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[10000]">
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
                              control={agentForm.control}
                              name="chatbotType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-sm font-medium text-gray-700">챗봇 유형</FormLabel>
                                  <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[10000]">
                                      <SelectItem value="doc-fallback-llm">문서 우선 + LLM 보완</SelectItem>
                                      <SelectItem value="strict-doc">문서 기반 전용</SelectItem>
                                      <SelectItem value="general-llm">자유 대화형</SelectItem>
                                      <SelectItem value="llm-with-web-search">LLM + 웹 검색</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* 웹 검색 설정 - LLM + 웹 검색 선택 시에만 표시 */}
                          {agentForm.watch("chatbotType") === "llm-with-web-search" && (
                            <div className="border-t pt-4 space-y-4">
                              <h3 className="text-sm font-medium text-gray-700">웹 검색 설정</h3>
                              
                              <FormField
                                control={agentForm.control}
                                name="webSearchEnabled"
                                render={({ field }) => (
                                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                      <FormLabel className="text-sm font-medium">웹 검색 사용</FormLabel>
                                      <div className="text-xs text-gray-500">
                                        실시간 웹 검색을 통해 최신 정보를 제공합니다
                                      </div>
                                    </div>
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        checked={field.value || false}
                                        onChange={(e) => field.onChange(e.target.checked)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                      />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />

                              {agentForm.watch("webSearchEnabled") && (
                                <>
                                  <FormField
                                    control={agentForm.control}
                                    name="searchEngine"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-sm font-medium text-gray-700">검색 엔진</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || "bing"}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="검색 엔진을 선택하세요" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent className="z-[10000]">
                                            <SelectItem value="bing">Bing Search API</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />

                                  {agentForm.watch("searchEngine") === "bing" && (
                                    <FormField
                                      control={agentForm.control}
                                      name="bingApiKey"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-gray-700">Bing API 키</FormLabel>
                                          <FormControl>
                                            <Input 
                                              type="password"
                                              placeholder="Bing Search API 키를 입력하세요"
                                              {...field}
                                            />
                                          </FormControl>
                                          <div className="text-xs text-gray-500">
                                            Microsoft Azure Cognitive Services에서 Bing Search API 키를 발급받을 수 있습니다.
                                          </div>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* 파일 업로드 탭 */}
                      <TabsContent value="upload" className="space-y-6">
                        <div className="space-y-4">
                          {/* 문서 종류 드롭다운 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">
                              문서 종류 <span className="text-red-500">*</span>
                            </Label>
                            <Select value={agentDocumentType} onValueChange={setAgentDocumentType}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="문서 종류 선택" />
                              </SelectTrigger>
                              <SelectContent className="z-[10000]">
                                <SelectItem value="lecture">강의자료</SelectItem>
                                <SelectItem value="policy">정책·규정 문서</SelectItem>
                                <SelectItem value="manual">매뉴얼·가이드</SelectItem>
                                <SelectItem value="form">서식·양식</SelectItem>
                                <SelectItem value="notice">공지·안내</SelectItem>
                                <SelectItem value="curriculum">교육과정</SelectItem>
                                <SelectItem value="faq">FAQ·Q&A</SelectItem>
                                <SelectItem value="research">연구자료</SelectItem>
                                <SelectItem value="internal">회의·내부자료</SelectItem>
                                <SelectItem value="other">기타</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* 파일 업로드 영역 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">문서 파일 업로드</Label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-1">
                              <div className="text-center">
                                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                                <div className="mt-2 text-sm text-gray-600">
                                  파일을 드래그하거나 클릭하여 업로드
                                </div>
                                <div className="mt-1 text-xs text-gray-500">
                                  지원 형식: TXT, DOC, DOCX, PPT, PPTX (최대 50MB)
                                </div>
                                <Input
                                  type="file"
                                  multiple
                                  accept=".txt,.doc,.docx,.ppt,.pptx"
                                  className="hidden"
                                  ref={agentFileInputRef}
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    setSelectedFiles(prev => [...prev, ...files]);
                                  }}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="mt-2"
                                  onClick={() => agentFileInputRef.current?.click()}
                                >
                                  파일 선택
                                </Button>
                              </div>
                            </div>
                            
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2 mt-4">
                                <Label className="text-sm font-medium">선택된 파일:</Label>
                                {selectedFiles.map((file, index) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                    <span className="text-sm">{file.name}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 업로드 시작 버튼 */}
                            {selectedFiles.length > 0 && (
                              <div className="flex justify-end mt-4">
                                <Button 
                                  onClick={handleAgentFileUpload}
                                  disabled={!agentDocumentType || isAgentFileUploading}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  {isAgentFileUploading ? `업로드 중... (${Math.round(agentFileUploadProgress)}%)` : `업로드 시작`}
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* 문서 설명 입력창 */}
                          <div>
                            <Label className="text-sm font-medium text-gray-700">문서 설명</Label>
                            <Textarea 
                              placeholder="문서에 대한 간단한 설명을 입력하세요..."
                              rows={3}
                              className="mt-1"
                              value={agentDocumentDescription}
                              onChange={(e) => setAgentDocumentDescription(e.target.value)}
                            />
                          </div>

                          {/* 문서 목록 */}
                          <AgentDocumentList agentId={selectedAgent?.id} />
                        </div>
                      </TabsContent>

                      {/* 관리자 선정 탭 */}
                      <TabsContent value="managers" className="space-y-4">
                        <div className="space-y-4">
                          {/* 간단한 설명 */}
                          <div className="text-sm text-gray-600 px-1">
                            에이전트 관리자는 최대 3명까지 공동 관리자를 선정할 수 있습니다.
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
                                  <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
                                    <SelectItem value="all">전체</SelectItem>
                                    {getDetailCategories(managerFilterUpperCategory, managerFilterLowerCategory).map((cat) => (
                                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* 결과 요약 */}
                              <div className="text-xs text-gray-500 flex justify-between items-center">
                                <span>총 {filteredManagerUsers.length}명의 사용자를 찾았습니다</span>
                                <span>
                                  {currentManagerTab} 관리자: {
                                    currentManagerTab === 'agent' ? selectedAgentManagers.length :
                                    currentManagerTab === 'document' ? selectedDocumentManagers.length :
                                    selectedQaManagers.length
                                  }/3명 선택됨
                                </span>
                              </div>

                              {/* 검색 결과 리스트 */}
                              <div className="space-y-2 max-h-64 overflow-y-auto">
                                {filteredManagerUsers.length === 0 ? (
                                  <div className="text-center py-8">
                                    <div className="text-gray-400 mb-2">
                                      <Users className="w-8 h-8 mx-auto" />
                                    </div>
                                    <p className="text-sm text-gray-500">검색 조건에 맞는 사용자가 없습니다</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {filteredManagerUsers.slice((managerCurrentPage - 1) * 10, managerCurrentPage * 10).map((user) => {
                                      const isSelected = (
                                        currentManagerTab === 'agent' ? selectedAgentManagers :
                                        currentManagerTab === 'document' ? selectedDocumentManagers :
                                        selectedQaManagers
                                      ).some(m => m.id === user.id);

                                      const currentList = 
                                        currentManagerTab === 'agent' ? selectedAgentManagers :
                                        currentManagerTab === 'document' ? selectedDocumentManagers :
                                        selectedQaManagers;

                                      return (
                                        <div
                                          key={user.id}
                                          onClick={() => {
                                            if (isSelected) {
                                              // 선택 해제
                                              if (currentManagerTab === 'agent') {
                                                setSelectedAgentManagers(prev => prev.filter(m => m.id !== user.id));
                                              } else if (currentManagerTab === 'document') {
                                                setSelectedDocumentManagers(prev => prev.filter(m => m.id !== user.id));
                                              } else {
                                                setSelectedQaManagers(prev => prev.filter(m => m.id !== user.id));
                                              }
                                            } else if (currentList.length < 3) {
                                              // 선택 추가 (3명 제한)
                                              const newManager = {
                                                id: user.id,
                                                name: (user as any).name || user.id,
                                                email: user.email || '',
                                                upperCategory: user.upperCategory || '',
                                                lowerCategory: user.lowerCategory || '',
                                                role: currentManagerTab
                                              };

                                              if (currentManagerTab === 'agent') {
                                                setSelectedAgentManagers(prev => [...prev, newManager]);
                                              } else if (currentManagerTab === 'document') {
                                                setSelectedDocumentManagers(prev => [...prev, newManager]);
                                              } else {
                                                setSelectedQaManagers(prev => [...prev, newManager]);
                                              }
                                            }
                                          }}
                                          className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 ${
                                            isSelected
                                              ? 'border-blue-300 bg-blue-50'
                                              : currentList.length >= 3
                                              ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                          }`}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                                                isSelected ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                                              }`}>
                                                {((user as any).name || user.id).charAt(0).toUpperCase()}
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                  {(user as any).name || user.id}
                                                </p>
                                                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                                                  {user.role}
                                                </span>
                                                {user.email && (
                                                  <p className="text-xs text-gray-500 mt-1">{user.email}</p>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                    
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
                                  </div>
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
                                  <Select onValueChange={field.onChange} value={field.value || "organization"}>
                                    <FormControl>
                                      <SelectTrigger className="focus:ring-2 focus:ring-blue-500">
                                        <SelectValue />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
                                    <SelectItem value="none">{t('admin.none')}</SelectItem>
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
                                  <SelectContent className="z-[10000]">
                                    <SelectItem value="none">{t('admin.none')}</SelectItem>
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
                                  <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
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
                                  <SelectContent className="z-[10000]">
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
                                      <th className="px-3 py-2 text-left">{t('admin.select')}</th>
                                      <th className="px-3 py-2 text-left">이름</th>
                                      <th className="px-3 py-2 text-left">ID</th>
                                      <th className="px-3 py-2 text-left">조직</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredUsersForCustomAccess.slice(0, 20).map((user) => (
                                      <tr key={user.id} className="hover:bg-gray-50 border-b">
                                        <td className="px-3 py-2">
                                          <Checkbox
                                            checked={selectedCustomUsers.some(u => u.id === user.id)}
                                            onCheckedChange={(checked) => {
                                              if (checked) {
                                                setSelectedCustomUsers([...selectedCustomUsers, user]);
                                              } else {
                                                setSelectedCustomUsers(selectedCustomUsers.filter(u => u.id !== user.id));
                                              }
                                            }}
                                          />
                                        </td>
                                        <td className="px-3 py-2 font-medium">{(user as any).name || user.id}</td>
                                        <td className="px-3 py-2 text-gray-600">{user.id}</td>
                                        <td className="px-3 py-2 text-gray-500">
                                          {[user.upperCategory, user.lowerCategory, user.detailCategory].filter(Boolean).join(' > ')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                              
                              {/* 선택된 사용자 요약 */}
                              {selectedCustomUsers.length > 0 && (
                                <div className="text-xs text-green-600 bg-green-100 p-2 rounded">
                                  {selectedCustomUsers.length}{t('admin.selected')}: {selectedCustomUsers.map(u => (u as any).name || u.id).join(', ')}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </TabsContent>

                      {/* 버튼들 */}
                      <div className="flex justify-between pt-4">
                        <Button 
                          type="button" 
                          variant="destructive"
                          onClick={() => {
                            if (confirm('정말로 이 에이전트를 삭제하시겠습니까?')) {
                              deleteAgentMutation.mutate(selectedAgent.id);
                            }
                          }}
                          disabled={deleteAgentMutation.isPending}
                        >
                          {deleteAgentMutation.isPending ? "삭제 중..." : "삭제"}
                        </Button>
                        <div className="flex space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setIsAgentDetailDialogOpen(false);
                              setSelectedAgent(null);
                            }}
                          >
                            취소
                          </Button>
                          <Button 
                            type="submit"
                            disabled={updateAgentMutation.isPending}
                          >
                            {updateAgentMutation.isPending ? "저장 중..." : "수정"}
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                </Tabs>
              </>
            )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 문서 삭제 확인 다이얼로그 */}
        <Dialog open={isDeleteDocumentDialogOpen} onOpenChange={setIsDeleteDocumentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-red-600">문서 삭제 확인</DialogTitle>
            </DialogHeader>
            {selectedDocument && (
              <div className="space-y-4">
                <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-red-900 dark:text-red-100 mb-2">
                        "{selectedDocument.name}"을(를) 삭제하시겠습니까?
                      </h4>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        이 작업은 되돌릴 수 없으며, 다음과 같이 처리됩니다:
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                        <li>• 문서 파일이 시스템에서 완전히 삭제됩니다</li>
                        <li>• 연결된 에이전트의 업로드 문서 목록에서 제거됩니다</li>
                        <li>• 해당 에이전트에 문서 삭제 알림이 전송됩니다</li>
                        <li>• 기존 대화 기록은 유지되지만 해당 문서 기반 답변은 불가능해집니다</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDeleteDocumentDialogOpen(false)}
                  >
                    취소
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => {
                      if (selectedDocument?.id) {
                        deleteDocumentMutation.mutate(selectedDocument.id);
                        setIsDeleteDocumentDialogOpen(false);
                        setIsDocumentDetailDialogOpen(false);
                      }
                    }}
                    disabled={deleteDocumentMutation.isPending}
                  >
                    {deleteDocumentMutation.isPending ? "삭제 중..." : "삭제 확인"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* 질문응답 상세정보 모달 */}
        <Dialog open={showQADetailModal} onOpenChange={setShowQADetailModal}>
          <DialogContent className="max-w-4xl h-[90vh] md:h-[80vh] flex flex-col">
            {/* 고정 헤더 */}
            <DialogHeader className="flex-shrink-0 border-b pb-4">
              <DialogTitle>질문응답 상세정보</DialogTitle>
              <DialogDescription>
                질문응답의 상세 내용을 확인할 수 있습니다.
              </DialogDescription>
            </DialogHeader>
            
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
            
            {selectedQALog ? (
              <div className="space-y-6">
                {/* 상단 정보 - 2열 구성 */}
                <div className="grid grid-cols-2 gap-8">
                  {/* 왼쪽 열 */}
                  <div className="space-y-4">
                    {/* 에이전트 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">에이전트</div>
                      <div className="text-sm">{selectedQALog.agentName || '정수빈 교수의 현대 문학'}</div>
                    </div>

                    {/* 소속 조직 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">소속 조직</div>
                      <div className="text-sm">
                        {(() => {
                          // 에이전트의 조직 정보를 기반으로 구성
                          const agent = agents.find(a => a.name === selectedQALog.agentName);
                          if (!agent) return '인문대학 > 국어국문학과 > 현대문학전공';
                          
                          const categoryParts = [];
                          if (agent.upperCategory) categoryParts.push(agent.upperCategory);
                          if (agent.lowerCategory) categoryParts.push(agent.lowerCategory);
                          if (agent.detailCategory) categoryParts.push(agent.detailCategory);
                          
                          return categoryParts.length > 0 ? categoryParts.join(' > ') : '인문대학 > 국어국문학과 > 현대문학전공';
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* 오른쪽 열 */}
                  <div className="space-y-4">
                    {/* 대화 시각 */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-1">대화 시각</div>
                      <div className="text-sm">
                        {new Date(selectedQALog.lastMessageAt).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: '2-digit', 
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>

                    {/* 응답 상태와 응답 시간을 한 줄에 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">응답 상태</div>
                        <div className="text-sm">
                          {(() => {
                            const hasResponse = selectedQALog.lastUserMessage && selectedQALog.messageCount > 1;
                            return hasResponse ? (
                              <Badge variant="default" className="bg-green-100 text-green-800">
                                성공
                              </Badge>
                            ) : (
                              <Badge variant="destructive" className="bg-red-100 text-red-800">
                                실패
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">응답 시간</div>
                        <div className="text-sm">
                          {(() => {
                            const seed = selectedQALog.id || 1;
                            const responseTime = ((seed * 137) % 240 + 10) / 100;
                            return responseTime.toFixed(1) + '초';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 질문 내용 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">질문 내용</div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <span className="ml-2">질문을 불러오는 중...</span>
                        </div>
                      ) : (
                        (() => {
                          // 실제 대화 메시지에서 사용자 질문 찾기
                          if (conversationMessages && conversationMessages.length > 0) {
                            // 사용자 메시지 찾기 (role이 'user'인 메시지)
                            const userMessages = conversationMessages
                              .filter(m => m.role === 'user')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            
                            if (userMessages.length > 0 && userMessages[0].content) {
                              return userMessages[0].content;
                            }
                          }
                          
                          // 기본값으로 표시할 질문
                          return selectedQALog?.lastUserMessage || '어떤 것을 도와줄 수 있나?';
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* 응답 내용 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">응답 내용</div>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm">
                      {loadingMessages ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <span className="ml-2">메시지를 불러오는 중...</span>
                        </div>
                      ) : (
                        (() => {
                          // 실제 대화 메시지에서 AI 응답 찾기
                          if (conversationMessages && conversationMessages.length > 0) {
                            // AI 응답 메시지 찾기 (role이 'assistant' 또는 'ai'인 메시지)
                            const aiMessages = conversationMessages
                              .filter(m => m.role === 'assistant' || m.role === 'ai')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            
                            if (aiMessages.length > 0 && aiMessages[0].content) {
                              return aiMessages[0].content;
                            }
                            
                            // 시스템 메시지도 확인
                            const systemMessages = conversationMessages
                              .filter(m => m.role === 'system')
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                            
                            if (systemMessages.length > 0 && systemMessages[0].content) {
                              return systemMessages[0].content;
                            }
                          }
                          
                          // 실제 메시지가 없을 때 에이전트별 샘플 응답 제공
                          if (selectedQALog && selectedQALog.agentName) {
                            if (selectedQALog.agentName.includes('정수빈') || selectedQALog.agentName.includes('현대 문학')) {
                              return `안녕하세요! 현대 문학에 대해 도움을 드릴 수 있습니다. 

현대 문학 작품은 20세기부터 현재까지의 문학을 포괄하며, 특히 개인의 내면 심리와 사회적 현실을 다양한 기법으로 표현합니다. 

구체적으로 어떤 작품이나 작가에 대해 궁금한 점이 있으시면 언제든 말씀해 주세요.`;
                            } else if (selectedQALog.agentName.includes('기숙사')) {
                              return `기숙사 관련 문의사항에 대해 안내해 드리겠습니다.

입사 신청은 매 학기 시작 전에 온라인으로 접수받으며, 선발 기준은 거리, 성적, 경제적 여건 등을 종합적으로 고려합니다.

구체적인 입사 절차나 시설 이용 안내가 필요하시면 언제든 문의해 주세요.`;
                            } else if (selectedQALog.agentName.includes('교수진')) {
                              return `교수진 정보 검색 서비스입니다.

우리 대학의 모든 교수진 정보를 학과별, 전공별로 검색하실 수 있습니다. 연구 분야, 연락처, 강의 과목 등의 정보를 제공해 드립니다.`;
                            }
                          }
                          
                          return '안녕하세요! 궁금한 것이 있으시면 언제든지 문의해 주세요.';
                        })()
                      )}
                    </div>
                  </div>
                </div>

                {/* 개선 요청 코멘트 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">개선 요청 코멘트</div>
                  {loadQACommentMutation.isPending ? (
                    <div className="w-full h-32 border border-gray-300 rounded-lg flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-gray-500">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        <span className="text-sm">저장된 코멘트를 불러오는 중...</span>
                      </div>
                    </div>
                  ) : (
                    <textarea
                      value={improvementComment}
                      onChange={(e) => setImprovementComment(e.target.value)}
                      className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="개선이 필요한 내용을 입력해주세요."
                      disabled={loadQACommentMutation.isPending}
                    />
                  )}
                  <div className="flex justify-end mt-3 space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setImprovementComment('')}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        if (improvementComment.trim() && selectedQALog?.id) {
                          saveQACommentMutation.mutate({
                            conversationId: selectedQALog.id,
                            comment: improvementComment.trim()
                          });
                        }
                      }}
                      disabled={!improvementComment.trim() || saveQACommentMutation.isPending}
                    >
                      {saveQACommentMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">선택된 질문응답 로그가 없습니다.</p>
              </div>
            )}
            </div>
          </DialogContent>
        </Dialog>



        {/* 에이전트 검색 모달 */}
        <Dialog open={isAgentSearchDialogOpen} onOpenChange={setIsAgentSearchDialogOpen}>
          <DialogContent className="max-w-6xl h-[90vh] md:h-[80vh] flex flex-col">
            {/* 고정 헤더 */}
            <DialogHeader className="flex-shrink-0 border-b pb-4">
              <DialogTitle>에이전트 검색</DialogTitle>
              <DialogDescription>조직별 에이전트를 검색하고 관리할 수 있습니다.</DialogDescription>
            </DialogHeader>
            
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
            <div className="flex-1 flex flex-col space-y-4">
              {/* 검색 필터 영역 */}
              <div className="grid grid-cols-4 gap-4">
                {/* 상위 조직 */}
                <div>
                  <Label>상위 조직</Label>
                  <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {organizationCategories && Array.from(new Set(
                        organizationCategories.map((org: any) => org.upperCategory)
                      )).map((upperCategory: string) => (
                        <SelectItem key={upperCategory} value={upperCategory}>
                          {upperCategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 하위 조직 */}
                <div>
                  <Label>하위 조직</Label>
                  <Select value={selectedCollege} onValueChange={setSelectedCollege}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {selectedUniversity !== 'all' && organizationCategories && Array.from(new Set(
                        organizationCategories
                          .filter((org: any) => org.upperCategory === selectedUniversity)
                          .map((org: any) => org.lowerCategory)
                      )).map((lowerCategory: string) => (
                        <SelectItem key={lowerCategory} value={lowerCategory}>
                          {lowerCategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 세부 조직 */}
                <div>
                  <Label>세부 조직</Label>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {selectedCollege !== 'all' && organizationCategories && Array.from(new Set(
                        organizationCategories
                          .filter((org: any) => 
                            org.upperCategory === selectedUniversity && 
                            org.lowerCategory === selectedCollege
                          )
                          .map((org: any) => org.detailCategory)
                      )).map((detailCategory: string) => (
                        <SelectItem key={detailCategory} value={detailCategory}>
                          {detailCategory}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* 개별 조직 */}
                <div>
                  <Label>개별 조직</Label>
                  <Select value={selectedIndividualOrganization} onValueChange={setSelectedIndividualOrganization}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      {selectedDepartment !== 'all' && organizationCategories && Array.from(new Set(
                        organizationCategories
                          .filter((org: any) => 
                            org.upperCategory === selectedUniversity && 
                            org.lowerCategory === selectedCollege &&
                            org.detailCategory === selectedDepartment &&
                            true
                          )
                          .map((org: any) => org.name)
                      )).map((name: string) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 유형 및 상태 필터 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>유형</Label>
                  <Select value={selectedAgentType} onValueChange={setSelectedAgentType}>
                    <SelectTrigger>
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
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
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent className="z-[10000]">
                      <SelectItem value="all">전체</SelectItem>
                      <SelectItem value="활성">활성</SelectItem>
                      <SelectItem value="비활성">비활성</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* 검색어 */}
              <div>
                <Label>검색어</Label>
                <Input
                  value={agentSearchQuery}
                  onChange={(e) => setAgentSearchQuery(e.target.value)}
                  placeholder="에이전트 이름 또는 설명 키워드를 입력하세요."
                />
              </div>
              
              {/* 필터 초기화 버튼 */}
              <div className="flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedUniversity('all');
                    setSelectedCollege('all');
                    setSelectedDepartment('all');
                    setSelectedIndividualOrganization('all');
                    setSelectedAgentType('all');
                    setSelectedAgentStatus('all');
                    setAgentSearchQuery('');
                    setHasSearched(false);
                  }}
                >
                  필터 초기화
                </Button>
              </div>
              
              {/* 에이전트 목록 */}
              <div className="flex-1 min-h-0">
                <div className="h-full border rounded-lg">
                  <div className="h-full overflow-auto p-4">
                    {filteredAgents.length > 0 ? (
                      <div className="space-y-3">
                        {paginatedAgents.map((agent: any) => (
                          <div 
                            key={agent.id} 
                            className="border rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            onClick={() => {
                              setSelectedAgent(agent);
                              setIsAgentDetailDialogOpen(true);
                              setIsAgentSearchDialogOpen(false);
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 text-blue-600 text-xl">
                                  {agent.icon || '🤖'}
                                </div>
                                <div className="flex-1">
                                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                                    {agent.name}
                                  </h3>
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    {agent.description}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    <Badge variant={agent.isActive ? "default" : "secondary"}>
                                      {agent.isActive ? "활성" : "비활성"}
                                    </Badge>
                                    <Badge variant="outline">
                                      {agent.category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                                <div>관리자: {agent.managerName || "미설정"}</div>
                                <div>조직: {agent.upperCategory} / {agent.lowerCategory}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-32">
                        <p className="text-gray-500">검색 조건에 맞는 에이전트가 없습니다.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 페이지네이션 */}
              {filteredAgents.length > AGENTS_PER_PAGE && (
                <div className="flex justify-center">
                  <PaginationComponent
                    currentPage={agentCurrentPage}
                    totalPages={Math.ceil(filteredAgents.length / AGENTS_PER_PAGE)}
                    onPageChange={setAgentCurrentPage}
                  />
                </div>
              )}
            </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* 토큰 사용량 상세 정보 모달 */}
        <Dialog open={isTokenDetailDialogOpen} onOpenChange={setIsTokenDetailDialogOpen}>
          <DialogContent className="max-w-4xl h-[90vh] md:h-[80vh] flex flex-col">
            {/* 고정 헤더 */}
            <DialogHeader className="flex-shrink-0 border-b pb-4">
              <DialogTitle className="text-xl font-semibold">토큰 사용량 상세 정보</DialogTitle>
            </DialogHeader>
            
            {/* 스크롤 가능한 콘텐츠 */}
            <div className="flex-1 overflow-y-auto">
            
            {selectedTokenDetail && (
              <div className="space-y-6">
                {/* 기본 정보 섹션 */}
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">기본 정보</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">에이전트</span>
                        <span className="text-sm font-medium">{selectedTokenDetail.agentName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">대화 시각</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedTokenDetail.timestamp).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            weekday: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">소속 조직</span>
                        <span className="text-sm font-medium">
                          {selectedTokenDetail.userUpperCategory} &gt; {selectedTokenDetail.userLowerCategory} &gt; {selectedTokenDetail.userDetailCategory}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">응답 상태</span>
                        <span className="text-sm">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            성공
                          </span>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">응답 시간</span>
                        <span className="text-sm font-medium">{selectedTokenDetail.responseTime}초</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">LLM 모델</span>
                        <span className="text-sm font-medium">{selectedTokenDetail.model}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">토큰 사용량 분석</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-blue-600">입력 토큰:</span>
                        <span className="text-sm font-semibold text-blue-600">
                          {selectedTokenDetail.inputTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-green-600">출력 토큰:</span>
                        <span className="text-sm font-semibold text-green-600">
                          {selectedTokenDetail.outputTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-yellow-600">인덱스 토큰:</span>
                        <span className="text-sm font-semibold text-yellow-600">
                          {selectedTokenDetail.indexTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-red-600">읽기 토큰:</span>
                        <span className="text-sm font-semibold text-red-600">
                          {selectedTokenDetail.preprocessingTokens.toLocaleString()}
                        </span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-900">총 토큰:</span>
                          <span className="text-sm font-bold text-gray-900">
                            {selectedTokenDetail.totalTokens.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* 질문/응답 섹션 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3">질문 내용</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border min-h-[120px]">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {tokenDetailMessages.find(m => m.isFromUser)?.content || "어떤 것을 도와줄 수 있나?"}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-base font-medium text-gray-900 mb-3">에이전트 응답</h3>
                      <div className="bg-gray-50 p-4 rounded-lg border min-h-[120px]">
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">
                          {tokenDetailMessages.find(m => !m.isFromUser)?.content || "안녕하세요! 궁금한 것이 있으면 언제든지 물어보세요."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </DialogContent>
        </Dialog>

        {/* 에이전트 파일 업로드 모달 */}
        <AgentFileUploadModal
          isOpen={isAgentFileUploadModalOpen}
          onClose={() => setIsAgentFileUploadModalOpen(false)}
        />

        {/* 아이콘 변경 모달 */}
        {selectedAgentForIconChange && (
          <IconChangeModal
            agent={selectedAgentForIconChange}
            isOpen={showIconChangeModal}
            onClose={() => {
              setShowIconChangeModal(false);
              setSelectedAgentForIconChange(null);
            }}
            onSuccess={() => {
              // 에이전트 정보 업데이트 후 캐시 무효화
              queryClient.invalidateQueries({ queryKey: ['/api/admin/agents'] });
              queryClient.invalidateQueries({ queryKey: ['/api/agents'] });
            }}
          />
        )}

        {/* 새 에이전트 생성 모달 */}
        <Dialog open={isAgentDialogOpen} onOpenChange={setIsAgentDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>새 에이전트 생성</DialogTitle>
            </DialogHeader>
            <Form {...agentForm}>
              <form onSubmit={agentForm.handleSubmit((data) => createAgentMutation.mutate(data))} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>에이전트 이름 <span className="text-red-500">*</span></Label>
                    <FormField
                      control={agentForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="에이전트 이름을 입력하세요"
                              {...field}
                              className="korean-text"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>카테고리 <span className="text-red-500">*</span></Label>
                    <FormField
                      control={agentForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger className="korean-text">
                                <SelectValue placeholder="카테고리 선택" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="학교">학교</SelectItem>
                              <SelectItem value="교수">교수</SelectItem>
                              <SelectItem value="기능">기능</SelectItem>
                              <SelectItem value="학과">학과</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>상위 조직 <span className="text-red-500">*</span></Label>
                  <FormField
                    control={agentForm.control}
                    name="upperCategory"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="korean-text">
                              <SelectValue placeholder="상위 조직 선택" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="대학본부">대학본부</SelectItem>
                            <SelectItem value="인문대학">인문대학</SelectItem>
                            <SelectItem value="자연과학대학">자연과학대학</SelectItem>
                            <SelectItem value="공과대학">공과대학</SelectItem>
                            <SelectItem value="경영대학">경영대학</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>설명</Label>
                  <FormField
                    control={agentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            placeholder="에이전트에 대한 설명을 입력하세요"
                            className="korean-text min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>상태</Label>
                  <FormField
                    control={agentForm.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} value={field.value || "active"}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">활성</SelectItem>
                            <SelectItem value="inactive">비활성</SelectItem>
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
                    onClick={() => {
                      agentForm.reset();
                      setIsAgentDialogOpen(false);
                    }}
                  >
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

        {/* 토큰 한도 설정 팝업 */}
        <Dialog open={showTokenLimitModal} onOpenChange={setShowTokenLimitModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>토큰 사용량 한도 설정</DialogTitle>
              <DialogDescription>
                {selectedOrgForTokenLimit?.organizationName}의 토큰 사용량 한도를 설정합니다.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-8">

              {/* 토큰 사용 현황 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <Label className="text-sm font-medium">
                      {selectedOrgForTokenLimit?.detailCategory || selectedOrgForTokenLimit?.organizationName} 사용자들의 평균 사용 현황
                    </Label>
                  </div>
                  <div className="text-sm font-semibold text-green-600 dark:text-green-400">
                    {(() => {
                      // 해당 조직의 토큰 사용률 계산
                      if (selectedOrgForTokenLimit) {
                        const orgTokenData = filteredTokenData.filter(token => 
                          token.upperCategory === selectedOrgForTokenLimit.upperCategory &&
                          token.lowerCategory === selectedOrgForTokenLimit.lowerCategory &&
                          token.detailCategory === selectedOrgForTokenLimit.detailCategory
                        );
                        
                        if (orgTokenData.length > 0) {
                          const avgUsage = orgTokenData.reduce((sum, token) => sum + token.totalTokens, 0) / orgTokenData.length / 100;
                          const percentage = Math.min(100, Math.max(0, avgUsage));
                          return `평균 ${percentage.toFixed(1)}% 사용`;
                        }
                      }
                      
                      // 기본값
                      return "평균 27% 사용";
                    })()}
                  </div>
                </div>
                
                {/* 진행 바 */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300 ease-in-out"
                    style={{
                      width: `${(() => {
                        if (selectedOrgForTokenLimit) {
                          const orgTokenData = filteredTokenData.filter(token => 
                            token.upperCategory === selectedOrgForTokenLimit.upperCategory &&
                            token.lowerCategory === selectedOrgForTokenLimit.lowerCategory &&
                            token.detailCategory === selectedOrgForTokenLimit.detailCategory
                          );
                          
                          if (orgTokenData.length > 0) {
                            const avgUsage = orgTokenData.reduce((sum, token) => sum + token.totalTokens, 0) / orgTokenData.length / 100;
                            const percentage = Math.min(100, Math.max(0, avgUsage));
                            return percentage;
                          }
                        }
                        return 27;
                      })()}%`
                    }}
                  />
                </div>
                
                {/* 다음 리셋 */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  다음 리셋: {(() => {
                    const nextMonth = new Date();
                    nextMonth.setMonth(nextMonth.getMonth() + 1);
                    nextMonth.setDate(1);
                    nextMonth.setDate(nextMonth.getDate() - 1); // 이번 달 마지막 날
                    return nextMonth.toISOString().split('T')[0];
                  })()}
                </div>
              </div>

              {/* 월간 한도 */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <Label className="text-sm font-medium">월간 토큰 한도</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Input
                    type="number"
                    placeholder="예: 200000"
                    value={tokenLimitSettings.monthlyLimit}
                    onChange={(e) => setTokenLimitSettings(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">토큰</span>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  설정된 한도를 초과하면 해당 조직의 사용자에게 알림이 전송되고, 필요시 사용을 제한할 수 있습니다.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowTokenLimitModal(false);
                  setTokenLimitSettings({
                    monthlyLimit: ''
                  });
                }}
              >
                취소
              </Button>
              <Button
                onClick={() => {
                  // 토큰 한도 설정 저장 로직
                  console.log('토큰 한도 설정:', {
                    organization: selectedOrgForTokenLimit,
                    settings: tokenLimitSettings
                  });
                  setShowTokenLimitModal(false);
                  setTokenLimitSettings({
                    monthlyLimit: ''
                  });
                }}
              >
                설정 저장
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

export default MasterAdmin;