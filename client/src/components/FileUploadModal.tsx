import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Upload, AlertTriangle } from "lucide-react";
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [documentType, setDocumentType] = useState<string>("");
  const [documentDescription, setDocumentDescription] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showResultModal, setShowResultModal] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

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
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("documentType", documentType);
      formData.append("description", documentDescription);

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

        return response.json();
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error('업로드 시간 초과: 파일이 너무 크거나 네트워크가 느립니다.');
        }
        throw error;
      }
    },
    onSuccess: (data: any) => {
      console.log('Document upload successful:', data);
      
      // Store result data and show result modal
      setUploadResult(data);
      setShowResultModal(true);
      
      queryClient.invalidateQueries({
        queryKey: [`/api/agents/${agent.id}/documents`]
      });
      
      // Get filename
      const filename = data.document?.originalName || selectedFile?.name || '파일';

      // Send completion message to chat
      if (onSuccess) {
        onSuccess(`${filename} 문서 업로드가 저장되었습니다.`);
      }

      // Broadcast document upload notification
      broadcastMutation.mutate({
        agentId: agent.id,
        message: `📄 새로운 문서가 업로드되었습니다: ${filename}`
      });
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
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setDocumentType("참고자료");
      }
    }
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        setDocumentType("참고자료");
      }
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Upload Modal */}
      <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-background border rounded-lg shadow-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-medium text-foreground korean-text">
                문서 업로드
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
                    <p className="text-lg font-medium text-foreground korean-text">
                      파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 50MB)
                    </p>
                  </div>
                  <Button variant="outline" type="button" className="korean-text">
                    파일 선택
                  </Button>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 korean-text">
                    선택된 파일 (1개)
                  </h4>
                  <div className="flex items-center justify-between bg-white dark:bg-blue-950 border border-blue-200 dark:border-blue-700 rounded-md p-3">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type || 'VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT'}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-1"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    모두 제거
                  </p>
                </div>
              )}

              {/* Document Details Form */}
              <div className="space-y-4">
                <h4 className="font-medium text-foreground korean-text">문서 종류</h4>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="korean-text">
                    <SelectValue placeholder="참고자료" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="참고자료">참고자료</SelectItem>
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
                  disabled={!selectedFile || uploadMutation.isPending}
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
                      업로드 시작 (1개 파일)
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

      {/* Upload Result Modal */}
      <Dialog open={showResultModal} onOpenChange={setShowResultModal}>
        <DialogContent className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-xl" style={{ zIndex: 9999 }}>
          <DialogHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 korean-text">
              문서 업로드 완료
            </DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6">
            {uploadResult && (
              <div className="space-y-4">
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-200 korean-text">
                      {uploadResult.document?.originalName || '문서'}
                    </span>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-300 korean-text mb-3">
                    대화를 통해 다음 기능들을 실행할 수 있습니다:
                  </p>
                  <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1 korean-text">
                    <li>• "페르소나" - 에이전트 성격 및 말투 설정</li>
                    <li>• "챗봇 설정" - LLM 모델 및 동작 방식 변경</li>
                    <li>• "문서 업로드" - 지식베이스 확장용 문서 추가</li>
                    <li>• "알림보내기" - 사용자들에게 공지사항 전송</li>
                    <li>• "성과 분석" - 에이전트 사용 통계 및 분석</li>
                    <li>• "도움말" - 명령어 목록 다시 보기</li>
                  </ul>
                  <p className="text-sm text-amber-700 dark:text-amber-300 korean-text mt-3">
                    원하는 기능을 메시지로 입력하거나, 일반 대화도 가능합니다.
                  </p>
                </div>

                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-800 dark:text-green-200 korean-text">
                      {uploadResult.document?.originalName || '문서'} 업로드가 완료되었습니다.
                    </span>
                  </div>
                  <p className="text-sm text-green-700 dark:text-green-300 korean-text">
                    문서가 성공적으로 업로드되어 에이전트의 지식베이스에 추가되었습니다.
                  </p>
                </div>

                {uploadResult.analysis && (
                  <div className="space-y-3">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 korean-text">
                        문서 분석 결과
                      </h4>
                      <p className="text-sm text-blue-800 dark:text-blue-200 korean-text">
                        {uploadResult.analysis.summary}
                      </p>
                      {uploadResult.analysis.keyPoints && uploadResult.analysis.keyPoints.length > 0 && (
                        <div className="mt-3">
                          <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-1 korean-text">주요 내용:</h5>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            {uploadResult.analysis.keyPoints.map((point: string, index: number) => (
                              <li key={index} className="korean-text">• {point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => {
                  setShowResultModal(false);
                  setUploadResult(null);
                  setSelectedFile(null);
                  setDocumentType("");
                  setDocumentDescription("");
                  onClose();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-2 rounded-lg korean-text"
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