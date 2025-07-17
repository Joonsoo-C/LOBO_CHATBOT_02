import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Upload, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Agent } from "@/types/agent";

interface FileUploadModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

export default function FileUploadModal({ agent, isOpen, onClose, onSuccess }: FileUploadModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");
  const [documentVisibility, setDocumentVisibility] = useState(true);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Broadcast notification mutation for document uploads
  const broadcastMutation = useMutation({
    mutationFn: async ({ agentId, message }: { agentId: number; message: string }) => {
      const response = await apiRequest("POST", `/api/agents/${agentId}/broadcast`, { message });
      return response.json();
    },
    onSuccess: (data) => {
      console.log(`Document upload notification sent to ${data.totalRecipients} users`);
      queryClient.invalidateQueries({
        queryKey: ["/api/conversations"]
      });
    },
    onError: (error) => {
      console.error("Failed to broadcast document upload notification:", error);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (files: File[]) => {
      const results = [];
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("documentType", documentType);
        formData.append("description", documentDescription);
        formData.append("isVisible", documentVisibility.toString());

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 60초 타임아웃
        
        try {
          const response = await fetch(`/api/agents/${agent.id}/documents`, {
            method: "POST",
            body: formData,
            credentials: "include",
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`${response.status}: ${errorText}`);
          }

          const result = await response.json();
          results.push({ file, result });
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('업로드 시간 초과: 파일이 너무 크거나 네트워크가 느립니다.');
          }
          throw error;
        }
      }
      
      return results;
    },
    onSuccess: (results: any[]) => {
      console.log('Document uploads successful:', results);
      
      queryClient.invalidateQueries({
        queryKey: [`/api/agents/${agent.id}/documents`]
      });
      
      const fileNames = results.map(r => r.result.document?.originalName || r.file.name).join(', ');

      // Show success toast message
      toast({
        title: "문서 업로드 완료",
        description: `${results.length}개 파일이 성공적으로 업로드되었습니다.`,
      });

      // Send completion message to chat
      if (onSuccess) {
        onSuccess(`${results.length}개 문서 업로드가 완료되었습니다: ${fileNames}`);
      }

      // Broadcast document upload notification
      broadcastMutation.mutate({
        agentId: agent.id,
        message: `📄 ${results.length}개의 새로운 문서가 업로드되었습니다`
      });

      // Reset form and close modal
      setSelectedFiles([]);
      setDocumentType("");
      setDocumentDescription("");
      setDocumentVisibility(true);
      onClose();
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        setErrorMessage("인증이 만료되었습니다. 다시 로그인해주세요.");
        setShowErrorModal(true);
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
      } else {
        setErrorMessage(error.message || "파일 업로드에 실패했습니다. 다시 시도해주세요.");
        setShowErrorModal(true);
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
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];

    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("지원하지 않는 파일 형식입니다. PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT 파일만 업로드 가능합니다.");
      setShowErrorModal(true);
      return false;
    }

    if (file.size > maxSize) {
      setErrorMessage("파일 크기가 너무 큽니다. 최대 50MB까지 업로드 가능합니다.");
      setShowErrorModal(true);
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newValidFiles: File[] = [];
      
      for (const file of files) {
        // 최대 5개까지만 허용
        if (selectedFiles.length + newValidFiles.length >= 5) {
          toast({
            title: "파일 개수 제한",
            description: "최대 5개까지만 선택할 수 있습니다.",
            variant: "destructive",
          });
          break;
        }
        
        if (validateFile(file)) {
          newValidFiles.push(file);
        }
      }
      
      if (newValidFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...newValidFiles]);
        if (documentType === "") {
          setDocumentType("기타");
        }
      }
    }
    
    // 파일 입력 값 리셋
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const newValidFiles: File[] = [];
      
      for (const file of files) {
        // 최대 5개까지만 허용
        if (selectedFiles.length + newValidFiles.length >= 5) {
          toast({
            title: "파일 개수 제한",
            description: "최대 5개까지만 선택할 수 있습니다.",
            variant: "destructive",
          });
          break;
        }
        
        if (validateFile(file)) {
          newValidFiles.push(file);
        }
      }
      
      if (newValidFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...newValidFiles]);
        if (documentType === "") {
          setDocumentType("기타");
        }
      }
    }
  };

  const handleUpload = () => {
    if (selectedFiles.length > 0) {
      uploadMutation.mutate(selectedFiles);
    }
  };
  
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Upload Modal */}
      <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm" onClick={onClose}>
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-background border rounded-lg shadow-lg" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-foreground korean-text">
                문서 파일 업로드
              </h3>
              <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* File Upload Section */}
              <div 
                className={`p-8 border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
                  isDragOver 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
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
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-foreground korean-text">업로드할 문서 파일을 드래그하거나 파일 선택 버튼을 클릭하세요. </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 5개, 각각 50MB)
                    </p>
                  </div>
                  <Button variant="outline" type="button" className="korean-text">
                    파일 선택
                  </Button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Selected Files Display */}
              {selectedFiles.length > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 korean-text">
                      선택된 파일 ({selectedFiles.length}개)
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllFiles}
                      className="text-red-600 hover:text-red-700"
                    >
                      전체 파일 삭제
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-blue-900 dark:text-blue-100 text-sm truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400">
                              {(file.size / 1024 / 1024).toFixed(2)} MB • {file.type.split('/')[1]?.toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1 ml-2"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Details Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground korean-text">문서 종류</h4>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="korean-text">
                    <SelectValue placeholder="문서 종류를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
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

              <div className="space-y-2">
                <Label htmlFor="document-description" className="korean-text">문서 설명</Label>
                <Textarea
                  id="document-description"
                  placeholder="문서에 대한 간단한 설명을 입력하세요..."
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  className="korean-text"
                  rows={3}
                />
              </div>

              {/* Document Visibility Setting */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 korean-text">문서 노출 설정</h4>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="agent-document-visible" 
                      className="rounded" 
                      checked={documentVisibility}
                      onChange={(e) => setDocumentVisibility(e.target.checked)}
                    />
                    <Label htmlFor="agent-document-visible" className="korean-text">일반 사용자에게 이 문서를 표시</Label>
                  </div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 ml-6 korean-text">
                    체크 해제 시 관리자만 해당 문서에 접근할 수 있습니다.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="korean-text"
                  disabled={uploadMutation.isPending}
                >
                  취소
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={selectedFiles.length === 0 || uploadMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white korean-text"
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
            </div>
          </div>
        </div>
      </div>
      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl">
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              업로드 실패
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              {errorMessage}
            </p>
            <div className="flex justify-center">
              <Button
                onClick={() => {
                  setShowErrorModal(false);
                  setErrorMessage("");
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-8 py-2 rounded-lg"
              >
                확인
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}