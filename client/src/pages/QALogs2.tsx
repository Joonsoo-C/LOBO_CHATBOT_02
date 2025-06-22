import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  MessageSquare, 
  TrendingUp, 
  Search, 
  Calendar as CalendarIcon,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  RefreshCw,
  X
} from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { ko } from "date-fns/locale";

interface QALog {
  id: number;
  timestamp: string;
  category: string;
  agent: string;
  question: string;
  answer: string;
  satisfaction: "positive" | "negative" | null;
  status: "처리중" | "성공" | "실패";
  responseType: "문서기반" | "일반응답" | "혼합응답";
  responseTime: string;
}

interface QAStats {
  satisfactionRate: number;
  totalQuestions: number;
  responseRate: number;
}

export default function QALogs2() {
  const [selectedTab, setSelectedTab] = useState("logs");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [dateFilter, setDateFilter] = useState("today");
  const [customDateRange, setCustomDateRange] = useState<{from?: Date; to?: Date}>({});
  const [showCustomCalendar, setShowCustomCalendar] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("전체");
  const [satisfactionFilter, setSatisfactionFilter] = useState("전체");
  const [agentFilter, setAgentFilter] = useState("전체");
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<QALog | null>(null);
  const [improvementComment, setImprovementComment] = useState("");

  // Mock data for demonstration
  const mockStats: QAStats = {
    satisfactionRate: 74,
    totalQuestions: 31,
    responseRate: 49.5
  };

  const mockLogs: QALog[] = [
    {
      id: 1,
      timestamp: "06/22 13:21",
      category: "영문학과",
      agent: "영문학과 도우미",
      question: "프로그래밍 심화 수업 예약 방법을 알려주세요",
      answer: "실습실 예약은 학과 사무실에 직접 방문하거나 온라인 예약 시스템을 이용하세요. 자세한 내용은 학과 홈페이지를 참고하세요.",
      satisfaction: null,
      status: "처리중",
      responseType: "일반응답",
      responseTime: "2.3초"
    },
    {
      id: 2,
      timestamp: "01/27 03:39",
      category: "미술학과",
      agent: "미술학과 도우미",
      question: "미술학과 졸업전시는 언제 열리나요?",
      answer: "미술학과 졸업전시는 매년 5월 중순경 학과 전시관에서 개최됩니다.",
      satisfaction: null,
      status: "성공",
      responseType: "문서기반",
      responseTime: "1.8초"
    },
    {
      id: 3,
      timestamp: "01/26 11:35",
      category: "화학과",
      agent: "화학과 도우미",
      question: "분석화학 과목 선수과목이 있나요?",
      answer: "",
      satisfaction: null,
      status: "실패",
      responseType: "일반응답",
      responseTime: "4.1초"
    },
    {
      id: 4,
      timestamp: "01/26 10:34",
      category: "화학과",
      agent: "화학과 도우미",
      question: "화학과에서 취업률이 어떻게 되나요?",
      answer: "화학과 취업률은 약 85%이며, 주요 취업처는 화학회사, 제약회사, 연구소 등입니다.",
      satisfaction: "positive",
      status: "성공",
      responseType: "혼합응답",
      responseTime: "1.5초"
    },
    {
      id: 5,
      timestamp: "01/26 09:33",
      category: "화학과",
      agent: "화학과 도우미",
      question: "화학과 유기화학 실험이 공급됩니다 자세히 알려주세요.",
      answer: "유기화학 실험은 매주 화요일과 목요일에 진행되며, 실험복과 보안경 착용이 필수입니다.",
      satisfaction: null,
      status: "성공",
      responseType: "문서기반",
      responseTime: "2.1초"
    },
    {
      id: 6,
      timestamp: "01/26 08:32",
      category: "물리학과",
      agent: "물리학과 도우미",
      question: "물리학과 졸업논문 주제는 어떻게 정하나니까?",
      answer: "",
      satisfaction: "negative",
      status: "실패",
      responseType: "일반응답",
      responseTime: "3.7초"
    },
    {
      id: 7,
      timestamp: "01/26 02:38",
      category: "생명과학과",
      agent: "생명과학과 도우미",
      question: "생명학과 대학원 진학률이 궁금합니다 자세히 알려주세요.",
      answer: "",
      satisfaction: null,
      status: "실패",
      responseType: "혼합응답",
      responseTime: "5.2초"
    },
    {
      id: 8,
      timestamp: "01/26 01:37",
      category: "생명과학과",
      agent: "생명과학과 도우미",
      question: "분자생물학 실험이 어려워니까?",
      answer: "분자생물학 실험은 기초 생물학 지식이 필요하며, 실습을 통해 점진적으로 익힐 수 있습니다.",
      satisfaction: null,
      status: "성공",
      responseType: "문서기반",
      responseTime: "1.9초"
    }
  ];

  const getDateRange = () => {
    const today = new Date();
    switch (dateFilter) {
      case "today":
        return { from: today, to: today };
      case "week":
        return { from: subWeeks(today, 1), to: today };
      case "month":
        return { from: subMonths(today, 1), to: today };
      case "90days":
        return { from: subDays(today, 90), to: today };
      case "custom":
        return customDateRange;
      default:
        return { from: today, to: today };
    }
  };

  const filteredLogs = mockLogs.filter(log => {
    const matchesKeyword = searchKeyword === "" || 
      log.question.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.category.toLowerCase().includes(searchKeyword.toLowerCase()) ||
      log.agent.toLowerCase().includes(searchKeyword.toLowerCase());

    const matchesCategory = categoryFilter === "전체" || log.category === categoryFilter;
    const matchesSatisfaction = satisfactionFilter === "전체" || 
      (satisfactionFilter === "만족도 높음" && log.satisfaction === "positive") ||
      (satisfactionFilter === "만족도 낮음" && log.satisfaction === "negative") ||
      (satisfactionFilter === "만족도 없음" && log.satisfaction === null);
    const matchesAgent = agentFilter === "전체" || log.agent === agentFilter;

    return matchesKeyword && matchesCategory && matchesSatisfaction && matchesAgent;
  });

  const getSatisfactionIcon = (satisfaction: QALog["satisfaction"]) => {
    if (satisfaction === "positive") return <ThumbsUp className="w-4 h-4 text-green-600" />;
    if (satisfaction === "negative") return <ThumbsDown className="w-4 h-4 text-red-600" />;
    return "—";
  };

  const getStatusBadge = (status: QALog["status"]) => {
    const variants = {
      "처리중": "default",
      "성공": "secondary", 
      "실패": "destructive"
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getResponseTypeBadge = (responseType: QALog["responseType"]) => {
    const variants = {
      "문서기반": "default",
      "일반응답": "secondary",
      "혼합응답": "outline"
    } as const;

    return <Badge variant={variants[responseType]}>{responseType}</Badge>;
  };

  const handleImprovementRequest = (log: QALog) => {
    setSelectedLog(log);
    setShowImprovementModal(true);
  };

  const handleSubmitImprovement = () => {
    // Here you would typically send the improvement request to your API
    console.log("Improvement request for log:", selectedLog?.id, "Comment:", improvementComment);
    setShowImprovementModal(false);
    setSelectedLog(null);
    setImprovementComment("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">질의응답 관리</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          질문과 응답의 품질을 확인하고 개선하세요.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="logs" className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>질문 로그</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>키워드 & 통계</span>
          </TabsTrigger>
        </TabsList>

        {/* Statistics Cards */}
        {selectedTab === "logs" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">응답 만족률</p>
                    <p className="text-2xl font-bold text-green-600">{mockStats.satisfactionRate}%</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">미해결 수</p>
                    <p className="text-2xl font-bold text-orange-600">{mockStats.totalQuestions}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">사용자 만족도</p>
                    <p className="text-2xl font-bold text-blue-600">{mockStats.responseRate}%</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <TabsContent value="logs">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">키워드 검색</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="키워드 입력"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="flex-1"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Date Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    시간 범위
                  </label>
                  <div className="flex space-x-2">
                    <Select value={dateFilter} onValueChange={setDateFilter}>
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="today">오늘</SelectItem>
                        <SelectItem value="week">지난 1주일</SelectItem>
                        <SelectItem value="month">지난달</SelectItem>
                        <SelectItem value="90days">지난 90일</SelectItem>
                        <SelectItem value="custom">사용자 지정</SelectItem>
                      </SelectContent>
                    </Select>

                    {dateFilter === "custom" && (
                      <Popover open={showCustomCalendar} onOpenChange={setShowCustomCalendar}>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm">
                            <CalendarIcon className="w-4 h-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="range"
                            selected={customDateRange}
                            onSelect={setCustomDateRange}
                            locale={ko}
                            numberOfMonths={2}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                  {dateFilter === "custom" && customDateRange.from && (
                    <p className="text-xs text-gray-500 mt-1">
                      {format(customDateRange.from, "MM/dd", { locale: ko })}
                      {customDateRange.to && ` - ${format(customDateRange.to, "MM/dd", { locale: ko })}`}
                    </p>
                  )}
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    응답 범위
                  </label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="영문학과">영문학과</SelectItem>
                      <SelectItem value="미술학과">미술학과</SelectItem>
                      <SelectItem value="화학과">화학과</SelectItem>
                      <SelectItem value="물리학과">물리학과</SelectItem>
                      <SelectItem value="생명과학과">생명과학과</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Satisfaction Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    상위카테고리
                  </label>
                  <Select value={satisfactionFilter} onValueChange={setSatisfactionFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="만족도 높음">만족도 높음</SelectItem>
                      <SelectItem value="만족도 낮음">만족도 낮음</SelectItem>
                      <SelectItem value="만족도 없음">만족도 없음</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Agent Filter */}
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
                    에이전트
                  </label>
                  <Select value={agentFilter} onValueChange={setAgentFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">전체</SelectItem>
                      <SelectItem value="영문학과 도우미">영문학과 도우미</SelectItem>
                      <SelectItem value="미술학과 도우미">미술학과 도우미</SelectItem>
                      <SelectItem value="화학과 도우미">화학과 도우미</SelectItem>
                      <SelectItem value="물리학과 도우미">물리학과 도우미</SelectItem>
                      <SelectItem value="생명과학과 도우미">생명과학과 도우미</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <Button size="sm" onClick={() => window.location.reload()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* QA Logs Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>질의응답 목록</CardTitle>
                <div className="flex items-center space-x-4">
                  <Button variant="outline" size="sm">최신순</Button>
                  <Button variant="outline" size="sm">오래된순</Button>
                  <Button variant="outline" size="sm">만족도 높은순</Button>
                  <Button variant="outline" size="sm">만족도 낮은순</Button>
                  <Button variant="outline" size="sm">응답 상태별 보기</Button>
                </div>
              </div>
              <p className="text-sm text-gray-500">총 {filteredLogs.length}개 중 1-20개 표시</p>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">대화 시각</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">카테고리</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">에이전트</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">질문 내용</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">응답 유형</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">응답 시간</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">응답상태</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">개선요청</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800">
                        <td className="py-3 px-4 text-sm">{log.timestamp}</td>
                        <td className="py-3 px-4 text-sm">{log.category}</td>
                        <td className="py-3 px-4 text-sm">{log.agent}</td>
                        <td className="py-3 px-4 text-sm max-w-md">
                          <div className="truncate" title={log.question}>
                            {log.question}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {getResponseTypeBadge(log.responseType)}
                        </td>
                        <td className="py-3 px-4 text-sm">{log.responseTime}</td>
                        <td className="py-3 px-4 text-sm">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleImprovementRequest(log)}
                          >
                            <MessageCircle className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>키워드 분석 및 통계</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">키워드 분석 및 상세 통계 기능이 여기에 표시됩니다.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Improvement Request Modal */}
      {showImprovementModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">개선 요청 및 코멘트</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowImprovementModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              질의응답에 대한 개선 요청과 코멘트를 작성합니다.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  질문
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-white">{selectedLog.question}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  답변
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {selectedLog.answer || "실습실 예약은 학과 사무실에 직접 방문하거나 온라인 예약 시스템을 이용하세요. 자세한 내용은 학과 홈페이지를 참고하세요."}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  개선 요청 코멘트
                </label>
                <textarea
                  value={improvementComment}
                  onChange={(e) => setImprovementComment(e.target.value)}
                  placeholder="개선이 필요한 내용을 입력해주세요."
                  className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowImprovementModal(false)}
              >
                취소
              </Button>
              <Button 
                onClick={handleSubmitImprovement}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                저장
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}