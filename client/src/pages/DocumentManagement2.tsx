import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { FileText, Download, Trash2, Search, Filter, Upload } from "lucide-react";

interface Document {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  agentName: string;
  uploadedBy: string;
  uploadedAt: string;
  content?: string;
}

export default function DocumentManagement2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const { toast } = useToast();

  // Mock data for demonstration
  const mockDocuments: Document[] = [
    {
      id: 1,
      filename: "university_guide_2025.pdf",
      originalName: "대학안내서 2025.pdf",
      mimeType: "application/pdf",
      size: 2048576,
      agentName: "학교 안내",
      uploadedBy: "admin",
      uploadedAt: "2025-06-20T10:30:00Z"
    },
    {
      id: 2,
      filename: "cs_curriculum.docx",
      originalName: "컴퓨터공학과 교육과정.docx",
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1024000,
      agentName: "컴퓨터공학과",
      uploadedBy: "prof001",
      uploadedAt: "2025-06-19T14:20:00Z"
    },
    {
      id: 3,
      filename: "scholarship_info.txt",
      originalName: "장학금 안내.txt",
      mimeType: "text/plain",
      size: 15360,
      agentName: "장학금 안내",
      uploadedBy: "staff001",
      uploadedAt: "2025-06-18T09:15:00Z"
    },
    {
      id: 4,
      filename: "library_rules.pdf",
      originalName: "도서관 이용규정.pdf",
      mimeType: "application/pdf",
      size: 512000,
      agentName: "학교 안내",
      uploadedBy: "admin",
      uploadedAt: "2025-06-17T16:45:00Z"
    }
  ];

  const { data: documents = mockDocuments } = useQuery<Document[]>({
    queryKey: ["/api/admin/documents"],
    initialData: mockDocuments
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/documents/${id}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      toast({ title: "문서가 삭제되었습니다." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/documents"] });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("정말로 이 문서를 삭제하시겠습니까?")) {
      deleteDocumentMutation.mutate(id);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const response = await fetch(`/api/documents/${document.filename}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = document.originalName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast({ title: "문서 다운로드를 시작합니다." });
    } catch (error) {
      toast({ title: "다운로드 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('text')) return '📋';
    if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📊';
    return '📁';
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.uploadedBy.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = selectedAgent === "all" || doc.agentName === selectedAgent;
    const matchesType = selectedType === "all" || doc.mimeType.includes(selectedType);
    
    return matchesSearch && matchesAgent && matchesType;
  });

  const totalSize = documents.reduce((acc, doc) => acc + doc.size, 0);
  const totalSizeFormatted = formatFileSize(totalSize);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>문서 관리 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="문서명 또는 업로더 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedAgent}
              onChange={(e) => setSelectedAgent(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 에이전트</option>
              <option value="학교 안내">학교 안내</option>
              <option value="컴퓨터공학과">컴퓨터공학과</option>
              <option value="장학금 안내">장학금 안내</option>
            </select>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 파일 유형</option>
              <option value="pdf">PDF</option>
              <option value="word">Word 문서</option>
              <option value="text">텍스트 파일</option>
              <option value="powerpoint">PowerPoint</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 기간</option>
              <option value="today">오늘</option>
              <option value="week">최근 7일</option>
              <option value="month">최근 30일</option>
            </select>
          </div>

          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{documents.length}</div>
                <div className="text-sm text-gray-600">총 문서 수</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{totalSizeFormatted}</div>
                <div className="text-sm text-gray-600">총 용량</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{documents.filter(d => d.mimeType.includes('pdf')).length}</div>
                <div className="text-sm text-gray-600">PDF 문서</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredDocuments.length}</div>
                <div className="text-sm text-gray-600">검색 결과</div>
              </CardContent>
            </Card>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">파일</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">에이전트</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">크기</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">업로더</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">업로드 날짜</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">작업</th>
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getFileTypeIcon(doc.mimeType)}
                        </div>
                        <div>
                          <div className="font-medium">{doc.originalName}</div>
                          <div className="text-sm text-gray-500">{doc.filename}</div>
                        </div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge variant="outline">{doc.agentName}</Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {formatFileSize(doc.size)}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {doc.uploadedBy}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(doc.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(doc.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* File Type Distribution */}
          <div className="mt-8">
            <Card>
              <CardHeader>
                <CardTitle>파일 유형별 분포</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-3xl mb-2">📄</div>
                    <div className="font-semibold">{documents.filter(d => d.mimeType.includes('pdf')).length}</div>
                    <div className="text-sm text-gray-600">PDF</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📝</div>
                    <div className="font-semibold">{documents.filter(d => d.mimeType.includes('word')).length}</div>
                    <div className="text-sm text-gray-600">Word</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📋</div>
                    <div className="font-semibold">{documents.filter(d => d.mimeType.includes('text')).length}</div>
                    <div className="text-sm text-gray-600">텍스트</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <div className="font-semibold">{documents.filter(d => d.mimeType.includes('presentation')).length}</div>
                    <div className="text-sm text-gray-600">PowerPoint</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}