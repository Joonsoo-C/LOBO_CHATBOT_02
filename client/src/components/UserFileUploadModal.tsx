
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Upload, Trash2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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

interface UserFileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface UserFile {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  uploadedAt: string;
  status: string;
  userCount: number;
  statusText: string;
}

export default function UserFileUploadModal({ isOpen, onClose, onSuccess }: UserFileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [overwriteExisting, setOverwriteExisting] = useState(false);
  const [validateOnly, setValidateOnly] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<UserFile | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // 업로드된 사용자 파일 목록 조회
  const { data: userFiles = [], isLoading: isLoadingUserFiles, refetch: refetchUserFiles } = useQuery<UserFile[]>({
    queryKey: ["/api/admin/user-files"],
    enabled: isOpen,
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("overwriteExisting", overwriteExisting.toString());
      formData.append("validateOnly", validateOnly.toString());

      const response = await fetch(`/api/admin/users/upload`, {
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
        queryKey: ["/api/admin/users"]
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/admin/user-files"]
      });
      
      setSelectedFile(null);
      setOverwriteExisting(false);
      setValidateOnly(false);

      const actionText = validateOnly ? "검증" : overwriteExisting ? "덮어쓰기" : "추가";
      toast({
        title: `파일 ${actionText} 완료`,
        description: data.message || `파일이 성공적으로 ${actionText}되었습니다.`,
      });

      if (onSuccess) {
        onSuccess();
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

  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/admin/user-files/${fileId}`, {
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
        queryKey: ["/api/admin/user-files"]
      });
      toast({
        title: "삭제 완료",
        description: "파일이 성공적으로 삭제되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "삭제 실패",
        description: error.message || "파일 삭제에 실패했습니다.",
        variant: "destructive",
      });
    },
  });

  const validateFile = (file: File) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'application/csv'
    ];

    const fileName = file.name.toLowerCase();
    const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');

    if (!allowedTypes.includes(file.type) && !isValidExtension) {
      toast({
        title: "지원하지 않는 파일 형식",
        description: "Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드 가능합니다.",
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
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (validateFile(file)) {
      setSelectedFile(file);
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
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await fetch('/api/admin/users/sample', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('샘플 파일 다운로드에 실패했습니다.');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = '사용자업로드_샘플파일.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "다운로드 실패",
        description: "샘플 파일 다운로드에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = (file: UserFile) => {
    setFileToDelete(file);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (fileToDelete) {
      deleteMutation.mutate(fileToDelete.id);
      setDeleteDialogOpen(false);
      setFileToDelete(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-background border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-lg">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="text-lg font-medium text-foreground korean-text">
            사용자 파일 업로드
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
              const fileInput = document.getElementById('user-file-upload') as HTMLInputElement;
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
                    <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        const fileInput = document.getElementById('user-file-upload') as HTMLInputElement;
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
                    <h4 className="text-lg font-medium text-foreground mb-2 korean-text">Excel 또는 CSV 파일을 드래그하거나 클릭하여 업로드</h4>
                    <p className="text-sm text-muted-foreground korean-text mb-4">
                      Excel(.xlsx, .xls) 또는 CSV(.csv) 파일 지원 (최대 50MB)
                    </p>
                  </div>
                  <div className="flex gap-3 justify-center">
                    <Button
                      type="button"
                      variant="default"
                      className="korean-text bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      파일 선택
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleDownloadSample}
                      className="korean-text"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      샘플 파일 다운로드
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <input
              id="user-file-upload"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              multiple={false}
              key={selectedFile ? selectedFile.name : 'user-file-input'}
            />
          </div>

          {/* Upload Options */}
          <div className="mb-6">
            <Label className="text-sm font-medium mb-3 block korean-text">업로드 옵션</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="overwrite-existing"
                  checked={overwriteExisting}
                  onCheckedChange={setOverwriteExisting}
                />
                <Label htmlFor="overwrite-existing" className="text-sm korean-text">
                  기존 사용자 정보 덮어쓰기 (모든 기존 사용자 데이터 삭제 후 새 데이터로 교체)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="validate-only"
                  checked={validateOnly}
                  onCheckedChange={setValidateOnly}
                />
                <Label htmlFor="validate-only" className="text-sm korean-text">
                  검증만 수행 (실제 저장하지 않고 파일 유효성만 확인)
                </Label>
              </div>
            </div>
            
            {/* 동작 방식 설명 */}
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h5 className="text-sm font-medium mb-2 korean-text">동작 방식 안내</h5>
              <div className="text-xs text-muted-foreground space-y-1 korean-text">
                {overwriteExisting ? (
                  <>
                    <p>• 기존 사용자 데이터를 모두 삭제합니다</p>
                    <p>• 새로 업로드된 사용자 데이터로 완전히 교체합니다</p>
                  </>
                ) : (
                  <>
                    <p>• 기존 사용자 데이터는 모두 보존됩니다</p>
                    <p>• 동일한 사용자 ID 또는 이메일이 있는 경우: 기존 정보 유지</p>
                    <p>• 새로 포함된 사용자만 추가 등록됩니다</p>
                  </>
                )}
                {validateOnly && <p>• 파일 유효성만 검증하고 실제 저장은 하지 않습니다</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-border mb-6">
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
              disabled={!selectedFile || uploadMutation.isPending}
              className="flex-1 korean-text relative h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {uploadMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  {validateOnly ? "검증 중..." : "업로드 중..."}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {validateOnly ? "검증 시작" : "업로드 시작"}
                </>
              )}
            </Button>
          </div>

          {/* Uploaded Files List */}
          <div className="pt-6 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-medium text-foreground korean-text">업로드된 사용자 파일</h4>
                <p className="text-xs text-muted-foreground korean-text mt-1">
                  시스템에 반영된 최신 사용자 파일 목록입니다
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => refetchUserFiles()}
                disabled={isLoadingUserFiles}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoadingUserFiles ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
            
            {isLoadingUserFiles ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-muted-foreground korean-text">파일 목록 로딩 중...</p>
              </div>
            ) : userFiles && userFiles.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {userFiles.map((file) => (
                  <div key={file.id} className="flex items-start justify-between p-4 bg-muted rounded-lg border border-border hover:bg-muted/80 transition-colors">
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <h5 className="text-sm font-medium korean-text truncate">{file.filename}</h5>
                        <Badge 
                          variant={
                            file.status === 'applied' ? 'default' :
                            file.status === 'validated' ? 'secondary' :
                            file.status === 'partially_applied' ? 'outline' : 'destructive'
                          }
                          className={`text-xs px-2 py-1 ${
                            file.status === 'applied' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            file.status === 'validated' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
                            file.status === 'partially_applied' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                        >
                          {file.statusText}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">크기:</span>
                          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">사용자:</span>
                          <span className="font-medium text-primary">{file.userCount}명</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">업로드:</span>
                          <span>{new Date(file.uploadedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span className="font-medium">상태:</span>
                          <span className={
                            file.status === 'applied' ? 'text-green-600 dark:text-green-400 font-medium' :
                            file.status === 'validated' ? 'text-blue-600 dark:text-blue-400 font-medium' :
                            file.status === 'partially_applied' ? 'text-yellow-600 dark:text-yellow-400 font-medium' :
                            'text-red-600 dark:text-red-400 font-medium'
                          }>
                            {file.status === 'applied' ? '시스템 반영 완료' :
                             file.status === 'validated' ? '검증 완료 (미반영)' :
                             file.status === 'partially_applied' ? '부분 반영' :
                             file.status === 'processing' ? '처리 중' : '반영 실패'}
                          </span>
                        </div>
                      </div>

                      {/* 상태별 추가 정보 */}
                      {file.status === 'applied' && (
                        <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded border-l-2 border-green-500">
                          <p className="text-xs text-green-700 dark:text-green-300 korean-text">
                            ✅ 이 파일의 모든 사용자 데이터가 시스템에 성공적으로 반영되었습니다.
                          </p>
                        </div>
                      )}
                      
                      {file.status === 'validated' && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border-l-2 border-blue-500">
                          <p className="text-xs text-blue-700 dark:text-blue-300 korean-text">
                            ℹ️ 파일 검증은 완료되었으나 실제 시스템에는 반영되지 않았습니다.
                          </p>
                        </div>
                      )}
                      
                      {file.status === 'partially_applied' && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-2 border-yellow-500">
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 korean-text">
                            ⚠️ 일부 사용자 데이터만 반영되었습니다. 중복 또는 오류가 있는 데이터는 제외되었습니다.
                          </p>
                        </div>
                      )}
                      
                      {(file.status === 'failed' || file.status === 'processing') && (
                        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border-l-2 border-red-500">
                          <p className="text-xs text-red-700 dark:text-red-300 korean-text">
                            {file.status === 'processing' ? 
                              '🔄 파일 처리가 진행 중입니다...' : 
                              '❌ 파일 처리 중 오류가 발생했습니다. 파일 형식이나 내용을 확인해 주세요.'
                            }
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(file)}
                          className="text-destructive hover:text-destructive-foreground hover:bg-destructive/10 ml-2 flex-shrink-0"
                          title="파일 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="korean-text">파일 삭제 확인</AlertDialogTitle>
                          <AlertDialogDescription className="korean-text">
                            '{fileToDelete?.filename}' 파일을 정말로 삭제하시겠습니까?<br/>
                            이 작업은 되돌릴 수 없으며, 파일 기록만 삭제됩니다.<br/>
                            (이미 반영된 사용자 데이터는 유지됩니다)
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
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 opacity-50" />
                </div>
                <h5 className="text-sm font-medium mb-2 korean-text">업로드된 사용자 파일이 없습니다</h5>
                <p className="text-xs korean-text">
                  Excel 또는 CSV 파일을 업로드하여 사용자 데이터를 관리해보세요
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
