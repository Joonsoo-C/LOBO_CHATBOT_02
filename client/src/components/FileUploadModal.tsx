import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest } from "@/lib/queryClient";
import type { Agent, Document } from "@/types/agent";

interface FileUploadModalProps {
  agent: Agent;
  isOpen: boolean;
  onClose: () => void;
}

export default function FileUploadModal({ agent, isOpen, onClose }: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: documents = [], isLoading } = useQuery<Document[]>({
    queryKey: [`/api/agents/${agent.id}/documents`],
    enabled: isOpen,
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
      }
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
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
    onSuccess: () => {
      queryClient.invalidateQueries([`/api/agents/${agent.id}/documents`]);
      setSelectedFile(null);
      toast({
        title: "업로드 완료",
        description: "문서가 성공적으로 업로드되었습니다.",
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.ms-powerpoint',
      ];

      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "지원하지 않는 파일 형식",
          description: "TXT, DOC, PPT 파일만 업로드 가능합니다.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "파일 크기 초과",
          description: "10MB 이하의 파일만 업로드 가능합니다.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

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

  const getFileTypeLabel = (mimeType: string) => {
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word")) return "DOC";
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "PPT";
    if (mimeType.includes("text")) return "TXT";
    return "FILE";
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground korean-text">
            {agent.name} 자료실
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <p className="text-sm text-muted-foreground mb-6 korean-text">
            업로드된 문서를 확인하고 다운로드할 수 있습니다
          </p>

          {/* File Upload Section */}
          <div className="mb-6 p-4 bg-muted rounded-xl">
            <h4 className="text-sm font-medium text-foreground mb-3 korean-text">새 문서 업로드</h4>
            <div className="space-y-3">
              <Input
                type="file"
                accept=".txt,.doc,.docx,.ppt,.pptx"
                onChange={handleFileSelect}
                className="korean-text"
              />
              {selectedFile && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground korean-text">{selectedFile.name}</span>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploadMutation.isPending}
                    className="korean-text"
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    {uploadMutation.isPending ? "업로드 중..." : "업로드"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* File List */}
          {isLoading ? (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground korean-text">문서 목록을 불러오는 중...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground korean-text">업로드된 문서가 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 bg-muted rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-foreground korean-text">
                        {document.originalName}
                      </h4>
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                        <span className="korean-text">{formatDate(document.createdAt)}</span>
                        <span>{formatFileSize(document.size)}</span>
                        <span className="bg-red-100 text-red-600 px-2 py-1 rounded">
                          {getFileTypeLabel(document.mimeType)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleDownload(document.id, document.originalName)}
                    className="korean-text"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    다운로드
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* File Stats */}
          {documents.length > 0 && (
            <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-sm text-muted-foreground">
              <span className="korean-text">총 {documents.length}개의 문서</span>
              <Button variant="ghost" size="sm" onClick={onClose} className="korean-text">
                닫기
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
