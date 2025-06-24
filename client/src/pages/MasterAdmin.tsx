import React, { useState, useRef, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  BarChart3, Users, Bot, MessageSquare, FileText, Settings, 
  Upload, Download, Search, Filter, ExternalLink, LogOut,
  Plus, Trash2, Edit, Eye, X, Folder, RefreshCw,
  TrendingUp, Calendar, Clock, Activity, AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Interfaces
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

// Component
export default function MasterAdmin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOrgCategoryUploadDialogOpen, setIsOrgCategoryUploadDialogOpen] = useState(false);
  
  // File upload states
  const [selectedOrgCategoryFiles, setSelectedOrgCategoryFiles] = useState<File[]>([]);
  const [orgCategoryOverwriteExisting, setOrgCategoryOverwriteExisting] = useState(false);
  const [orgCategoryValidateOnly, setOrgCategoryValidateOnly] = useState(false);
  const [isOrgCategoryFileUploading, setIsOrgCategoryFileUploading] = useState(false);
  const [orgCategoryFileUploadProgress, setOrgCategoryFileUploadProgress] = useState(0);
  
  const orgCategoryFileInputRef = useRef<HTMLInputElement>(null);

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Logout failed');
      return response.json();
    },
    onSuccess: () => {
      window.location.href = '/auth';
    },
  });

  // File upload handlers
  const handleOrgCategoryFileSelect = useCallback(() => {
    orgCategoryFileInputRef.current?.click();
  }, []);

  const handleOrgCategoryFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedOrgCategoryFiles(prev => [...prev, ...files]);
  }, []);

  const handleOrgCategoryFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    setSelectedOrgCategoryFiles(prev => [...prev, ...files]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleOrgCategoryFileUpload = useCallback(async () => {
    if (selectedOrgCategoryFiles.length === 0) return;

    setIsOrgCategoryFileUploading(true);
    setOrgCategoryFileUploadProgress(0);

    try {
      const formData = new FormData();
      selectedOrgCategoryFiles.forEach((file, index) => {
        formData.append(`files`, file);
      });
      formData.append('overwriteExisting', orgCategoryOverwriteExisting.toString());
      formData.append('validateOnly', orgCategoryValidateOnly.toString());

      const response = await fetch('/api/admin/organizational-categories/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      toast({
        title: "업로드 완료",
        description: `${result.processedCount}개의 조직 카테고리가 처리되었습니다.`,
      });

      setSelectedOrgCategoryFiles([]);
      setIsOrgCategoryUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: "업로드 실패",
        description: error instanceof Error ? error.message : "파일 업로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsOrgCategoryFileUploading(false);
      setOrgCategoryFileUploadProgress(0);
    }
  }, [selectedOrgCategoryFiles, orgCategoryOverwriteExisting, orgCategoryValidateOnly, toast]);

  const handleDownloadOrgCategorySampleFile = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/organizational-categories/sample');
      if (!response.ok) throw new Error('Sample file download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'organizational_categories_sample.xlsx';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "다운로드 완료",
        description: "조직 카테고리 샘플 파일이 다운로드되었습니다.",
      });
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "샘플 파일 다운로드 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">마스터 관리자</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">시스템 전체 관리 및 모니터링</p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  window.open('/', '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                메인 서비스
              </Button>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                <LogOut className="w-4 h-4 mr-2" />
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="dashboard">
                <BarChart3 className="w-4 h-4 mr-2" />
                대시보드
              </TabsTrigger>
              <TabsTrigger value="categories">
                <Folder className="w-4 h-4 mr-2" />
                조직 카테고리
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
                대화 관리
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="w-4 h-4 mr-2" />
                문서 관리
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="w-4 h-4 mr-2" />
                시스템 설정
              </TabsTrigger>
            </TabsList>

            <TabsContent value="categories" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">조직 카테고리 관리</h2>
                  <p className="text-gray-600 dark:text-gray-400">대학 조직 구조 및 카테고리를 관리합니다.</p>
                </div>
                <Button onClick={() => setIsOrgCategoryUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  카테고리 업로드
                </Button>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>조직 카테고리 목록</CardTitle>
                  <CardDescription>현재 등록된 조직 카테고리를 확인하고 관리할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    조직 카테고리 데이터가 없습니다. 파일 업로드를 통해 데이터를 추가해주세요.
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* 조직 카테고리 업로드 다이얼로그 */}
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
                  accept=".csv,.xlsx,.xls"
                  multiple
                  onChange={handleOrgCategoryFileInputChange}
                  style={{ display: 'none' }}
                />
                <div 
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-400 transition-colors"
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleOrgCategoryFileDrop}
                  onClick={handleOrgCategoryFileSelect}
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
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {file.name}
                                </p>
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

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">파일 형식 요구사항</h4>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                    <p>• 첫 번째 행: 헤더 (upperCategory, lowerCategory, detailCategory, status)</p>
                    <p>• upperCategory: 상위 조직 단위 (예: 단과대학, 본부) (필수)</p>
                    <p>• lowerCategory: 중간 조직 단위 (예: 학과, 부서) (필수)</p>
                    <p>• detailCategory: 하위 조직 단위 (예: 전공, 팀) (필수)</p>
                    <p>• status: "Active", "Disabled", "Waiting for registration approval" 중 하나 (필수)</p>
                    <p>• 엑셀 파일의 경우 첫 번째 시트만 처리됩니다</p>
                  </div>
                </div>

                <div>
                  <Label>업로드 옵션</Label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="org-category-overwrite-existing" 
                        className="rounded" 
                        checked={orgCategoryOverwriteExisting}
                        onChange={(e) => setOrgCategoryOverwriteExisting(e.target.checked)}
                      />
                      <Label htmlFor="org-category-overwrite-existing">기존 조직 카테고리 정보 덮어쓰기</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="org-category-validate-only" 
                        className="rounded"
                        checked={orgCategoryValidateOnly}
                        onChange={(e) => setOrgCategoryValidateOnly(e.target.checked)}
                      />
                      <Label htmlFor="org-category-validate-only">검증만 수행 (실제 업로드 안함)</Label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsOrgCategoryUploadDialogOpen(false)}>
                    취소
                  </Button>
                  <Button variant="outline" onClick={handleDownloadOrgCategorySampleFile}>
                    샘플 파일 다운로드
                  </Button>
                  <Button 
                    onClick={handleOrgCategoryFileUpload}
                    disabled={selectedOrgCategoryFiles.length === 0 || isOrgCategoryFileUploading}
                  >
                    {isOrgCategoryFileUploading ? `업로드 중... (${Math.round(orgCategoryFileUploadProgress)}%)` : `업로드 시작 (${selectedOrgCategoryFiles.length}개 파일)`}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
      </main>
    </div>
  );
}