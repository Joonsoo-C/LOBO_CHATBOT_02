import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Download, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Agent, Document } from "@/types/agent";

interface FileUploadModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function FileUploadModal({ agent, isOpen, onClose, onSuccess }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // 카테고리 상태
  const [mainCategory, setMainCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [detailCategory, setDetailCategory] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");

  // 업로드 옵션
  const [enableAIAnalysis, setEnableAIAnalysis] = useState<boolean>(false);
  const [enableKeywordExtraction, setEnableKeywordExtraction] = useState<boolean>(false);
  const [enableScopeRestriction, setEnableScopeRestriction] = useState<boolean>(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 상위 카테고리 옵션
  const mainCategories = [
    { value: "all", label: "전체" },
    { value: "university", label: "대학교" },
    { value: "graduate", label: "대학원" }
  ];

  // 하위 카테고리 옵션 (상위 카테고리에 따라 달라짐)
  const getSubCategories = (main: string) => {
    switch (main) {
      case "university":
        return [
          { value: "humanities", label: "인문대학" },
          { value: "social", label: "사회과학대학" },
          { value: "natural", label: "자연과학대학" },
          { value: "engineering", label: "공과대학" },
          { value: "arts", label: "예술대학" },
          { value: "business", label: "경영대학" }
        ];
      case "graduate":
        return [
          { value: "master", label: "석사과정" },
          { value: "phd", label: "박사과정" },
          { value: "professional", label: "전문대학원" }
        ];
      case "research":
        return [
          { value: "science", label: "과학기술연구소" },
          { value: "humanities_research", label: "인문학연구소" },
          { value: "social_research", label: "사회과학연구소" }
        ];
      case "administration":
        return [
          { value: "academic", label: "학사관리" },
          { value: "student", label: "학생지원" },
          { value: "facilities", label: "시설관리" },
          { value: "finance", label: "재정관리" }
        ];
      default:
        return [];
    }
  };

  // 세부 카테고리 옵션
  const getDetailCategories = (main: string, sub: string) => {
    if (main === "university" && sub === "engineering") {
      return [
        { value: "computer", label: "컴퓨터공학과" },
        { value: "mechanical", label: "기계공학과" },
        { value: "electrical", label: "전자공학과" },
        { value: "chemical", label: "화학공학과" }
      ];
    }
    if (main === "university" && sub === "humanities") {
      return [
        { value: "korean", label: "국어국문학과" },
        { value: "english", label: "영어영문학과" },
        { value: "history", label: "사학과" },
        { value: "philosophy", label: "철학과" }
      ];
    }
    // 기타 조합에 대한 세부 카테고리
    return [
      { value: "general", label: "일반" },
      { value: "special", label: "특별" }
    ];
  };

  // 에이전트 목록 조회
  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/admin/agents"],
    enabled: isOpen,
  });

  // Broadcast notification mutation for document uploads
  const broadcastMutation = useMutation({
    mutationFn: async ({ agentId, message }: { agentId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/broadcast`, { message });
      return response.json();
    },
    onSuccess: (data) => {
      console.log(`Document upload notification sent to ${data.totalRecipients} users`);

      // Invalidate conversation cache to refresh the conversation list
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
    onError: (error) => {
      console.error("Failed to broadcast document upload notification:", error);
    }
  });

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/agents/${agent.id}/documents`],
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("mainCategory", mainCategory);
      formData.append("subCategory", subCategory);
      formData.append("detailCategory", detailCategory);
      formData.append("targetAgent", selectedAgent);
      formData.append("description", documentDescription);
      formData.append("enableAIAnalysis", enableAIAnalysis.toString());
      formData.append("enableKeywordExtraction", enableKeywordExtraction.toString());
      formData.append("enableScopeRestriction", enableScopeRestriction.toString());

      const response = await fetch(`/api/agents/${agent.id}/documents`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [`/api/agents/${agent.id}/documents`]
      });
      setSelectedFile(null);
      setMainCategory("");
      setSubCategory("");
      setDetailCategory("");
      setSelectedAgent("");
      setDocumentDescription("");
      setEnableAIAnalysis(false);
      setEnableKeywordExtraction(false);
      setEnableScopeRestriction(false);

      toast({
        title: "업로드 완료",
        description: "문서가 성공적으로 업로드되었습니다.",
      });

      // Send completion message to chat
      if (onSuccess) {
        onSuccess(`${data.originalName || selectedFile?.name} 문서 업로드가 저장되었습니다.`);
      }

      // Broadcast document upload notification to all users
      broadcastMutation.mutate({
        agentId: agent.id,
        message: `📄 새로운 문서가 업로드되었습니다: ${data.originalName || selectedFile?.name}`
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "업로드 실패",
          description: error.message || "파일 업로드에 실패했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "50MB 이하의 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("handleFileSelect called", event.target.files);
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log("No files selected");
      return;
    }

    const file = files[0];
    console.log("Selected file:", file.name, file.size, file.type);

    if (validateFile(file)) {
      setSelectedFile(file);
      console.log("File successfully set");
    } else {
      console.log("File validation failed");
    }

    // Reset the input value to allow selecting the same file again
    event.target.value = '';
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Drag over event");
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Drag leave event");
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    console.log("Drop event triggered");
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    console.log("Dropped files:", files.length);

    if (files.length === 0) {
      console.log("No files in drop event");
      return;
    }

    const file = files[0];
    console.log("Processing dropped file:", file.name, file.size, file.type);

    if (validateFile(file)) {
      setSelectedFile(file);
      console.log("Dropped file successfully set");
    } else {
      console.log("Dropped file validation failed");
    }
  };

  const handleUpload = () => {
    if (selectedFile && mainCategory && subCategory && detailCategory) {
      uploadMutation.mutate(selectedFile);
    } else {
      toast({
        title: "필수 정보 누락",
        description: "파일과 모든 카테고리를 선택해주세요.",
        variant: "destructive",
      });
    }
  };

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`${response.status}: ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/agents/${agent.id}/documents`]
      });
      toast({
        title: "삭제 완료",
        description: "문서가 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "인증 오류",
          description: "다시 로그인해주세요.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      } else {
        toast({
          title: "삭제 실패",
          description: error.message || "파일 삭제에 실패했습니다.",
          variant: "destructive",
        });
      }
    },
  });

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("다운로드에 실패했습니다.");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "파일 다운로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (document: Document) => {
    setDocumentToDelete(document);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const resetCategories = () => {
    setSubCategory("");
    setDetailCategory("");
  };

  const resetDetailCategory = () => {
    setDetailCategory("");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground korean-text">
            문서 업로드
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* File Upload Section */}
          <div 
            className={`mb-6 p-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
              isDragOver 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                : selectedFile
                ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-gray-400'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              console.log("드롭 존 클릭됨");
              const fileInput = document.getElementById('file-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
                console.log("드롭 존에서 파일 입력 클릭 실행됨");
              }
            }}
          >
            <div className="text-center">
              {selectedFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-1 korean-text">선택된 파일</h4>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400 korean-text">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        console.log("다른 파일 선택 버튼 클릭됨");
                        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                        if (fileInput) {
                          fileInput.click();
                        }
                      }}
                      className="korean-text"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      다른 파일 선택
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                      className="korean-text text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-1" />
                      제거
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-foreground mb-2 korean-text">파일을 드래그하거나 클릭하여 업로드</h4>
                    <p className="text-sm text-muted-foreground korean-text mb-4">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 50MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    className="korean-text bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      console.log("파일 선택 버튼 클릭됨");
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      console.log("파일 입력 요소:", fileInput);
                      if (fileInput) {
                        fileInput.click();
                        console.log("파일 입력 클릭 실행됨");
                      } else {
                        console.error("파일 입력 요소를 찾을 수 없음");
                      }
                    }}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
              )}
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={false}
              key={selectedFile ? selectedFile.name : 'file-input'}
            />
          </div>

          {/* Category Selection */}
          <div className="mb-6">
            <h4 className="text-base font-medium text-foreground mb-4 korean-text">적용 범위</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block korean-text">상위 카테고리</Label>
                <Select value={mainCategory} onValueChange={(value) => { setMainCategory(value); resetCategories(); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    {mainCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block korean-text">하위 카테고리</Label>
                <Select value={subCategory} onValueChange={(value) => { setSubCategory(value); resetDetailCategory(); }} disabled={!mainCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSubCategories(mainCategory).map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block korean-text">세부 카테고리</Label>
                <Select value={detailCategory} onValueChange={setDetailCategory} disabled={!subCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="전체" />
                  </SelectTrigger>
                  <SelectContent>
                    {getDetailCategories(mainCategory, subCategory).map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block korean-text">에이전트</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="에이전트 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id.toString()} value={agent.id.toString()}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-[40px] korean-text"
                  onClick={() => {
                    setMainCategory("");
                    setSubCategory("");
                    setDetailCategory("");
                    setSelectedAgent("");
                  }}
                >
                  적용
                </Button>
              </div>
            </div>
          </div>

          {/* Document Description */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-2 block">문서 설명</Label>
            <Textarea
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="문서에 대한 간단한 설명을 입력하세요..."
              className="korean-text"
              rows={3}
            />
          </div>

          {/* Upload Options */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block">업로드 옵션</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ai-analysis"
                  checked={enableAIAnalysis}
                  onCheckedChange={setEnableAIAnalysis}
                />
                <Label htmlFor="ai-analysis" className="text-sm korean-text">AI 자동 분류 활성화</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keyword-extraction"
                  checked={enableKeywordExtraction}
                  onCheckedChange={setEnableKeywordExtraction}
                />
                <Label htmlFor="keyword-extraction" className="text-sm korean-text">키워드 자동 추출</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="scope-restriction"
                  checked={enableScopeRestriction}
                  onCheckedChange={setEnableScopeRestriction}
                />
                <Label htmlFor="scope-restriction" className="text-sm korean-text">해당 범위 사용자에게만 업로드 발송</Label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 korean-text h-12"
              disabled={uploadMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !mainCategory || !subCategory || !detailCategory || uploadMutation.isPending}
              className="flex-1 korean-text relative h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  업로드 시작
                </>
              )}
            </Button>
          </div>

          {/* File List */}
          {documents.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h4 className="text-base font-medium text-foreground mb-4 korean-text">업로드된 문서</h4>
              {isLoading ? (
                <div className="text-center py-4">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-muted-foreground korean-text">문서 목록을 불러오는 중...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <h5 className="text-sm font-medium text-foreground korean-text">
                            {decodeURIComponent(document.originalName || "")}
                          </h5>
                          <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                            <span className="korean-text">{formatDate(document.createdAt)}</span>
                            <span>{formatFileSize(document.size)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDownload(document.id, document.originalName)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(document)}
                              disabled={deleteMutation.isPending}
                              className="text-destructive hover:text-destructive-foreground hover:bg-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="korean-text">문서 삭제 확인</AlertDialogTitle>
                              <AlertDialogDescription className="korean-text">
                                '{documentToDelete?.originalName}' 문서를 정말로 삭제하시겠습니까? 
                                이 작업은 되돌릴 수 없습니다.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="korean-text">취소</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={confirmDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90 korean-text"
                              >
                                삭제
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}