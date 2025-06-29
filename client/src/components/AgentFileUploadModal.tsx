
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Upload, FileText, Download, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";

interface AgentFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AgentFileUploadModal({ isOpen, onClose }: AgentFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clearExisting, setClearExisting] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clearExisting", clearExisting.toString());
      formData.append("validateOnly", validateOnly.toString());

      const response = await fetch("/api/admin/agents/upload", {
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
    onSuccess: (data) => {
      setUploadResult(data);
      
      if (!validateOnly) {
        queryClient.invalidateQueries({
          queryKey: ["/api/agents/managed"]
        });
        
        toast({
          title: "업로드 완료",
          description: `${data.agentCount || data.createdCount || 0}개의 에이전트가 ${validateOnly ? '검증' : '업로드'}되었습니다.`,
        });
      } else {
        toast({
          title: "검증 완료",
          description: `${data.agentCount}개의 에이전트 레코드가 유효합니다.`,
        });
      }
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
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "CSV, XLS, XLSX 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "파일 크기 초과",
        description: "10MB 이하의 파일만 업로드 가능합니다.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
      setUploadResult(null);
    }
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
      setUploadResult(null);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = `name,description,category,upperCategory,lowerCategory,detailCategory,managerId,speechStyle,personality
학생 상담 AI,학생들의 고민과 상담을 도와주는 AI입니다,학생,인문대학,국어국문학과,국어국문학과,admin,친근하고 편안한 말투,공감능력이 뛰어나고 따뜻한 성격
컴퓨터공학과 AI,컴퓨터공학과 관련 정보를 제공하는 AI입니다,학과,공과대학,컴퓨터공학과,컴퓨터공학과,admin,전문적이고 정확한 말투,논리적이고 체계적인 성격`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "agent_sample.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setClearExisting(false);
    setValidateOnly(false);
    setUploadProgress(0);
    setUploadResult(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h3 className="text-lg font-medium text-foreground korean-text">
              에이전트 파일 업로드
            </h3>
            <p className="text-sm text-muted-foreground korean-text mt-1">
              CSV/Excel 파일로 에이전트를 대량 추가하세요
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="p-2">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {/* Sample Download */}
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200 korean-text">
                  파일 업로드
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="korean-text text-green-700 border-green-300 hover:bg-green-100"
              >
                <Download className="w-4 h-4 mr-1" />
                샘플 파일 다운로드
              </Button>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300 mt-2 korean-text">
              CSV/Excel 파일을 업로드하여 다수의 사용자를 일괄 등록합니다.
            </p>
          </div>

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
              const fileInput = document.getElementById('agent-file-upload') as HTMLInputElement;
              if (fileInput) {
                fileInput.click();
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
                    <p className="text-xs text-muted-foreground mt-1">{Math.round(selectedFile.size / 1024)} KB</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const fileInput = document.getElementById('agent-file-upload') as HTMLInputElement;
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
                        setUploadResult(null);
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
                      CSV, XLS, XLSX 파일 지원 (최대 10MB)
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="default"
                    className="korean-text bg-blue-600 hover:bg-blue-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    파일 선택
                  </Button>
                </div>
              )}
            </div>
            <input
              id="agent-file-upload"
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={false}
            />
          </div>

          {/* Upload Options */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block korean-text">업로드 옵션</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate-only"
                  checked={validateOnly}
                  onCheckedChange={setValidateOnly}
                />
                <Label htmlFor="validate-only" className="text-sm korean-text">검증만 수행 (실제 업로드하지 않음)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="clear-existing"
                  checked={clearExisting}
                  onCheckedChange={setClearExisting}
                  disabled={validateOnly}
                />
                <Label htmlFor="clear-existing" className="text-sm korean-text">기존 에이전트 모두 삭제 후 업로드</Label>
              </div>
            </div>
          </div>

          {/* Upload Result */}
          {uploadResult && (
            <div className={`mb-6 p-4 rounded-lg border ${
              uploadResult.success 
                ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
            }`}>
              <div className="flex items-center space-x-2 mb-2">
                {uploadResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600" />
                )}
                <span className={`font-medium korean-text ${
                  uploadResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {uploadResult.success ? '업로드 성공' : '업로드 실패'}
                </span>
              </div>
              <p className={`text-sm korean-text ${
                uploadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
              }`}>
                {uploadResult.message}
              </p>
              {uploadResult.agentCount && (
                <p className={`text-sm korean-text mt-1 ${
                  uploadResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                }`}>
                  처리된 에이전트: {uploadResult.agentCount}개
                </p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {uploadMutation.isPending && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium korean-text">업로드 중...</span>
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-border">
            <Button 
              variant="outline" 
              onClick={handleClose} 
              className="flex-1 korean-text h-12"
              disabled={uploadMutation.isPending}
            >
              취소
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1 korean-text relative h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {validateOnly ? '검증 중...' : '업로드 중...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {validateOnly ? '검증 시작' : '업로드 시작'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
