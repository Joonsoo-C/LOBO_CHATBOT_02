import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  MessageSquare, 
  Bot, 
  BarChart3, 
  TrendingUp,
  Activity,
  LogOut,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalAgents: number;
  activeAgents: number;
  totalConversations: number;
  totalMessages: number;
  todayMessages: number;
  weeklyGrowth: number;
}

export default function Dashboard2() {
  const { t } = useLanguage();

  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/api/admin/stats"],
  });

  const handleLogout = async () => {
    try {
      await apiRequest("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      queryClient.clear();
      window.location.href = "/auth";
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openMainService = () => {
    window.open('/', '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  마스터 관리자 시스템 2
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                variant="outline" 
                onClick={openMainService}
                className="flex items-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>메인 서비스</span>
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>로그아웃</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 사용자</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              <p className="text-xs text-muted-foreground">
                활성 사용자: {stats?.activeUsers || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 에이전트</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalAgents || 0}</div>
              <p className="text-xs text-muted-foreground">
                활성 에이전트: {stats?.activeAgents || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">총 대화</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalConversations || 0}</div>
              <p className="text-xs text-muted-foreground">
                총 메시지: {stats?.totalMessages || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">오늘 메시지</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.todayMessages || 0}</div>
              <p className="text-xs text-muted-foreground">
                주간 성장률: +{stats?.weeklyGrowth || 0}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* System Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>시스템 상태</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span>데이터베이스</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  정상
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>API 서버</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  정상
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>OpenAI 연결</span>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  정상
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>최근 활동</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <span className="font-medium">새로운 사용자 등록</span>
                  <span className="text-muted-foreground ml-2">2시간 전</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">에이전트 설정 변경</span>
                  <span className="text-muted-foreground ml-2">4시간 전</span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">시스템 백업 완료</span>
                  <span className="text-muted-foreground ml-2">6시간 전</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}