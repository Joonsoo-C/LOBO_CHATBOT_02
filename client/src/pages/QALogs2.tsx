import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, Search, Filter, Download } from "lucide-react";

interface QALog {
  id: number;
  userId: string;
  username: string;
  agentName: string;
  question: string;
  answer: string;
  timestamp: string;
  responseTime: number;
  satisfaction?: number;
  category: string;
}

export default function QALogs2() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dateRange, setDateRange] = useState("7days");

  // Mock data for demonstration
  const mockLogs: QALog[] = [
    {
      id: 1,
      userId: "student001",
      username: "김학생",
      agentName: "학교 안내",
      question: "도서관 운영시간이 어떻게 되나요?",
      answer: "도서관은 평일 오전 9시부터 오후 10시까지, 주말은 오전 10시부터 오후 6시까지 운영됩니다.",
      timestamp: "2025-06-22T10:30:00Z",
      responseTime: 1.2,
      satisfaction: 4,
      category: "일반문의"
    },
    {
      id: 2,
      userId: "student002",
      username: "이학생",
      agentName: "컴퓨터공학과",
      question: "졸업요건이 어떻게 되나요?",
      answer: "컴퓨터공학과 졸업요건은 전공필수 45학점, 전공선택 36학점, 교양 30학점 등 총 130학점 이상입니다.",
      timestamp: "2025-06-22T11:15:00Z",
      responseTime: 2.1,
      satisfaction: 5,
      category: "학사문의"
    },
    {
      id: 3,
      userId: "student003",
      username: "박학생",
      agentName: "장학금 안내",
      question: "성적장학금 신청 방법을 알려주세요.",
      answer: "성적장학금은 매 학기 성적 발표 후 자동으로 선발되며, 별도 신청이 필요하지 않습니다.",
      timestamp: "2025-06-22T14:20:00Z",
      responseTime: 1.8,
      satisfaction: 3,
      category: "장학금"
    }
  ];

  const { data: logs = mockLogs } = useQuery<QALog[]>({
    queryKey: ["/api/admin/qa-logs"],
    initialData: mockLogs
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = selectedAgent === "all" || log.agentName === selectedAgent;
    const matchesCategory = selectedCategory === "all" || log.category === selectedCategory;
    
    return matchesSearch && matchesAgent && matchesCategory;
  });

  const handleExport = () => {
    // Export functionality would be implemented here
    console.log("Exporting logs...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>질문/응답 로그 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="질문이나 답변 내용 검색..."
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
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">모든 카테고리</option>
              <option value="일반문의">일반문의</option>
              <option value="학사문의">학사문의</option>
              <option value="장학금">장학금</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="1day">최근 1일</option>
              <option value="7days">최근 7일</option>
              <option value="30days">최근 30일</option>
              <option value="90days">최근 90일</option>
            </select>
            <Button onClick={handleExport} className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>내보내기</span>
            </Button>
          </div>

          {/* Results Count */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              검색 결과: {filteredLogs.length}개의 로그
            </p>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-4 py-2 text-left">시간</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">사용자</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">에이전트</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">질문</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">답변</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">응답시간</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">만족도</th>
                  <th className="border border-gray-200 px-4 py-2 text-left">카테고리</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-4 py-2">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {log.username}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge variant="outline">{log.agentName}</Badge>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 max-w-xs">
                      <div className="truncate" title={log.question}>
                        {log.question}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2 max-w-xs">
                      <div className="truncate" title={log.answer}>
                        {log.answer}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {log.responseTime}초
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      {log.satisfaction ? (
                        <div className="flex items-center space-x-1">
                          <span>{log.satisfaction}</span>
                          <span className="text-yellow-500">★</span>
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="border border-gray-200 px-4 py-2">
                      <Badge variant="secondary">{log.category}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{filteredLogs.length}</div>
                <div className="text-sm text-gray-600">총 질문 수</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {(filteredLogs.reduce((acc, log) => acc + log.responseTime, 0) / filteredLogs.length).toFixed(1)}초
                </div>
                <div className="text-sm text-gray-600">평균 응답시간</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">
                  {filteredLogs.filter(log => log.satisfaction).length > 0 
                    ? (filteredLogs.reduce((acc, log) => acc + (log.satisfaction || 0), 0) / 
                       filteredLogs.filter(log => log.satisfaction).length).toFixed(1)
                    : '-'}
                </div>
                <div className="text-sm text-gray-600">평균 만족도</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}