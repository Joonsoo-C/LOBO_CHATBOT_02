import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      
      // Reset form
      setSelectedFile(null);
      setDocumentType("");
      setDocumentDescription("");

      toast({
        title: "업로드 완료",
        description: "문서가 성공적으로 업로드되었습니다.",
      });

      // Send completion message to chat
      if (onSuccess) {
        onSuccess(`${data.originalName || selectedFile?.name} 문서 업로드가 저장되었습니다.`);
      }

      // Broadcast document upload notification
      broadcastMutation.mutate({
        agentId: agent.id,
        message: `📄 새로운 문서가 업로드되었습니다: ${data.originalName || selectedFile?.name}`
      });

      onClose();
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
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    } else {
      toast({
        title: "파일 선택 필요",
        description: "업로드할 파일을 선택해주세요.",
        variant: "destructive",
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0.00 MB";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-lg">
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
                <h4 className="text-lg font-medium text-foreground mb-2 korean-text">파일을 드래그하거나 클릭하여 업로드</h4>
                <p className="text-sm text-muted-foreground korean-text">
                  PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일 지원 (최대 50MB)
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="korean-text"
                onClick={(e) => {
                  e.stopPropagation();
                  console.log("파일 선택 버튼 클릭됨");
                  const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                  if (fileInput) {
                    fileInput.click();
                    console.log("파일 입력 클릭 실행됨");
                  }
                }}
              >
                파일 선택
              </Button>
            </div>

            <Input
              id="file-upload"
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              className="hidden"
            />
          </div>

          {/* Selected Files Section */}
          {selectedFile && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-foreground korean-text">선택된 파일 (1개)</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-500 hover:text-red-600 korean-text h-auto p-1"
                >
                  모두 제거
                </Button>
              </div>
              <div className="border border-border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground korean-text">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(selectedFile.size)} • VND.OPENXMLFORMATS-OFFICEDOCUMENT.WORDPROCESSINGML.DOCUMENT
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="text-red-500 hover:text-red-600 h-auto p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Document Type Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium korean-text">문서 종류</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger className="korean-text">
                <SelectValue placeholder="문서 종류" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regulation">규정</SelectItem>
                <SelectItem value="guideline">지침</SelectItem>
                <SelectItem value="manual">매뉴얼</SelectItem>
                <SelectItem value="form">양식</SelectItem>
                <SelectItem value="notice">공지</SelectItem>
                <SelectItem value="reference">참고자료</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Description Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium korean-text">문서 설명</Label>
            <Textarea
              value={documentDescription}
              onChange={(e) => setDocumentDescription(e.target.value)}
              placeholder="문서에 대한 간단한 설명을 입력하세요..."
              className="korean-text resize-none"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={uploadMutation.isPending}
              className="flex-1 korean-text"
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1 korean-text bg-blue-600 hover:bg-blue-700 text-white"
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
  );
}