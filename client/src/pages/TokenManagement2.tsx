import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Zap, TrendingUp, Download, Calendar } from "lucide-react";

interface TokenUsage {
  date: string;
  inputTokens: number;
  outputTokens: number;
  indexTokens: number;
  readingTokens: number;
  totalTokens: number;
}

export default function TokenManagement2() {
  const [selectedPeriod, setSelectedPeriod] = useState("daily");
  const [dateRange, setDateRange] = useState("7days");

  // Generate realistic token usage data
  const generateTokenData = (period: string, range: string): TokenUsage[] => {
    const data: TokenUsage[] = [];
    let days = 7;
    
    if (range === "30days") days = 30;
    if (range === "90days") days = 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Weekend usage is typically lower (below 30%)
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      const baseMultiplier = isWeekend ? 0.25 : 1.0;
      
      // Vacation periods (rough approximation)
      const month = date.getMonth();
      const isVacation = month === 0 || month === 1 || month === 6 || month === 7 || month === 11;
      const vacationMultiplier = isVacation ? 0.3 : 1.0;
      
      const multiplier = baseMultiplier * vacationMultiplier;
      
      const baseTokens = 15000 + Math.random() * 5000;
      const totalTokens = Math.floor(baseTokens * multiplier);
      
      // Input tokens: 40-50% of total (bottom segment)
      const inputTokens = Math.floor(totalTokens * (0.40 + Math.random() * 0.10));
      
      // Output tokens: 15-24% of total (second segment)
      const outputTokens = Math.floor(totalTokens * (0.15 + Math.random() * 0.09));
      
      // Index tokens: 15-20% of total (third segment)
      const indexTokens = Math.floor(totalTokens * (0.15 + Math.random() * 0.05));
      
      // Reading tokens: remaining percentage (top segment)
      const readingTokens = totalTokens - inputTokens - outputTokens - indexTokens;
      
      data.push({
        date: date.toISOString().split('T')[0],
        inputTokens,
        outputTokens,
        indexTokens,
        readingTokens,
        totalTokens
      });
    }
    
    return data;
  };

  const { data: tokenData = [] } = useQuery<TokenUsage[]>({
    queryKey: ["/api/admin/token-usage", selectedPeriod, dateRange],
    queryFn: () => Promise.resolve(generateTokenData(selectedPeriod, dateRange)),
  });

  const totalUsage = tokenData.reduce((acc, day) => ({
    inputTokens: acc.inputTokens + day.inputTokens,
    outputTokens: acc.outputTokens + day.outputTokens,
    indexTokens: acc.indexTokens + day.indexTokens,
    readingTokens: acc.readingTokens + day.readingTokens,
    totalTokens: acc.totalTokens + day.totalTokens,
  }), { inputTokens: 0, outputTokens: 0, indexTokens: 0, readingTokens: 0, totalTokens: 0 });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (selectedPeriod === "daily") {
      return `${date.getMonth() + 1}/${date.getDate()}`;
    }
    return dateStr;
  };

  const handleExport = () => {
    console.log("Exporting token usage data...");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>토큰 관리 2</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <div className="flex justify-between items-center mb-6">
              <TabsList>
                <TabsTrigger value="daily">일별</TabsTrigger>
                <TabsTrigger value="weekly">주별</TabsTrigger>
                <TabsTrigger value="monthly">월별</TabsTrigger>
                <TabsTrigger value="overall">전체</TabsTrigger>
              </TabsList>
              
              <div className="flex items-center space-x-4">
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="7days">최근 7일</option>
                  <option value="30days">최근 30일</option>
                  <option value="90days">최근 90일</option>
                </select>
                <Button onClick={handleExport} className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>내보내기</span>
                </Button>
              </div>
            </div>

            <TabsContent value={selectedPeriod}>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-blue-600">
                      {totalUsage.inputTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">입력 토큰</div>
                    <div className="text-xs text-gray-500">
                      {((totalUsage.inputTokens / totalUsage.totalTokens) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">
                      {totalUsage.outputTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">출력 토큰</div>
                    <div className="text-xs text-gray-500">
                      {((totalUsage.outputTokens / totalUsage.totalTokens) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-yellow-600">
                      {totalUsage.indexTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">인덱스 토큰</div>
                    <div className="text-xs text-gray-500">
                      {((totalUsage.indexTokens / totalUsage.totalTokens) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">
                      {totalUsage.readingTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">읽기 토큰</div>
                    <div className="text-xs text-gray-500">
                      {((totalUsage.readingTokens / totalUsage.totalTokens) * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {totalUsage.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600">총 토큰</div>
                    <div className="text-xs text-green-600 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12.3%
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Token Usage Chart */}
              <Card className="mb-8">
                <CardHeader>
                  <CardTitle>토큰 사용량 추이</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tokenData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={formatDate}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                        />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${Number(value).toLocaleString()}`, 
                            name === 'inputTokens' ? '입력 토큰' :
                            name === 'outputTokens' ? '출력 토큰' :
                            name === 'indexTokens' ? '인덱스 토큰' : '읽기 토큰'
                          ]}
                          labelFormatter={(label) => `날짜: ${label}`}
                        />
                        <Legend 
                          formatter={(value) => 
                            value === 'inputTokens' ? '입력 토큰' :
                            value === 'outputTokens' ? '출력 토큰' :
                            value === 'indexTokens' ? '인덱스 토큰' : '읽기 토큰'
                          }
                        />
                        <Bar dataKey="inputTokens" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="outputTokens" stackId="a" fill="#10b981" />
                        <Bar dataKey="indexTokens" stackId="a" fill="#f59e0b" />
                        <Bar dataKey="readingTokens" stackId="a" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Usage Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle>사용량 분석</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">토큰 유형별 분포</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span>입력 토큰</span>
                          </div>
                          <span>{((totalUsage.inputTokens / totalUsage.totalTokens) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span>출력 토큰</span>
                          </div>
                          <span>{((totalUsage.outputTokens / totalUsage.totalTokens) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                            <span>인덱스 토큰</span>
                          </div>
                          <span>{((totalUsage.indexTokens / totalUsage.totalTokens) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span>읽기 토큰</span>
                          </div>
                          <span>{((totalUsage.readingTokens / totalUsage.totalTokens) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-3">사용 패턴</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>일 평균 사용량:</span>
                          <span>{Math.round(totalUsage.totalTokens / tokenData.length).toLocaleString()} 토큰</span>
                        </div>
                        <div className="flex justify-between">
                          <span>최대 사용일:</span>
                          <span>{Math.max(...tokenData.map(d => d.totalTokens)).toLocaleString()} 토큰</span>
                        </div>
                        <div className="flex justify-between">
                          <span>최소 사용일:</span>
                          <span>{Math.min(...tokenData.map(d => d.totalTokens)).toLocaleString()} 토큰</span>
                        </div>
                        <div className="flex justify-between">
                          <span>주말 평균 감소율:</span>
                          <span className="text-orange-600">~70%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}