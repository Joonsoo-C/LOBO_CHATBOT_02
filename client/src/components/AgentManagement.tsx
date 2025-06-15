import { useQuery } from "@tanstack/react-query";
import { Users, MessageCircle, TrendingUp, Trophy, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Agent, AgentStats } from "@/types/agent";

interface ManagedAgent extends Agent {
  stats?: AgentStats;
}

export default function AgentManagement() {
  const { toast } = useToast();

  const { data: managedAgents, isLoading } = useQuery<ManagedAgent[]>({
    queryKey: ["/api/agents/managed"],
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

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center korean-text">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!managedAgents || managedAgents.length === 0) {
    return (
      <div className="px-4 py-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-medium text-foreground mb-2 korean-text">에이전트 관리</h2>
          <p className="text-muted-foreground text-sm korean-text">관리 중인 에이전트를 선택하여 설정하세요</p>
        </div>
        
        <div className="text-center py-8">
          <p className="text-muted-foreground korean-text">관리 중인 에이전트가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-foreground mb-2 korean-text">에이전트 관리</h2>
        <p className="text-muted-foreground text-sm korean-text">관리 중인 에이전트를 선택하여 설정하세요</p>
      </div>

      <div className="space-y-4">
        {managedAgents.map((agent) => (
          <div key={agent.id} className="bg-card rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center">
                  <Users className="text-white w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground korean-text">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground korean-text">{agent.description}</p>
                </div>
              </div>
              <Settings className="text-muted-foreground w-5 h-5" />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex space-x-2">
                <span className="category-badge professor">교수</span>
                <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">활성</span>
              </div>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Users className="text-muted-foreground w-4 h-4" />
                  <span className="text-xs text-muted-foreground korean-text">활성 사용자</span>
                </div>
                <div className="text-lg font-semibold text-foreground korean-text">
                  {agent.stats?.activeUsers || 100}명
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MessageCircle className="text-green-600 w-4 h-4" />
                  <span className="text-xs text-muted-foreground korean-text">총 메시지</span>
                </div>
                <div className="text-lg font-semibold text-foreground korean-text">
                  {agent.stats?.totalMessages || 908}개
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <TrendingUp className="text-orange-600 w-4 h-4" />
                  <span className="text-xs text-muted-foreground korean-text">사용률</span>
                </div>
                <div className="text-lg font-semibold text-foreground korean-text">
                  {agent.stats?.usagePercentage || 86}%
                </div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Trophy className="text-purple-600 w-4 h-4" />
                  <span className="text-xs text-muted-foreground korean-text">순위</span>
                </div>
                <div className="text-lg font-semibold text-foreground korean-text">
                  #{agent.stats?.ranking || 2}
                </div>
              </div>
            </div>

            {/* Usage Progress Bar */}
            <div className="mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1 korean-text">
                <span>사용률</span>
                <span>{agent.stats?.usagePercentage || 86}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${agent.stats?.usagePercentage || 86}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
