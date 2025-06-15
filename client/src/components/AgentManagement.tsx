import { useQuery } from "@tanstack/react-query";
import { Users, MessageCircle, TrendingUp, Trophy, Settings, MessageSquare, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Agent, AgentStats } from "@/types/agent";

interface ManagedAgent extends Agent {
  stats?: AgentStats;
}

export default function AgentManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: managedAgents = [], isLoading } = useQuery<ManagedAgent[]>({
    queryKey: ["/api/agents/managed"],
  });

  const handleGeneralChat = (agentId: number) => {
    setLocation(`/chat/${agentId}`);
  };

  const handleManagementChat = (agentId: number) => {
    setLocation(`/management/${agentId}`);
  };

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

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-medium text-foreground mb-2 korean-text">에이전트 관리</h2>
        <p className="text-muted-foreground text-sm korean-text">관리 중인 에이전트를 선택하여 설정하세요</p>
      </div>

      {managedAgents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground korean-text">관리 중인 에이전트가 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {managedAgents.map((agent) => (
            <div 
              key={agent.id} 
              className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleManagementChat(agent.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-600 rounded-2xl flex items-center justify-center">
                    <Users className="text-white w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 korean-text">{agent.name}</h3>
                    <p className="text-sm text-gray-600 korean-text">{agent.description}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Settings functionality can be added here later
                  }}
                >
                  <Settings className="text-gray-400 w-5 h-5" />
                </Button>
              </div>

              {/* Badges */}
              <div className="flex space-x-2 mb-4">
                <Badge variant="secondary" className="text-xs">교수</Badge>
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">활성</Badge>
              </div>

              {/* Statistics Grid */}
              {agent.stats && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">활성 사용자:</span>
                      <span className="font-medium text-gray-900">{agent.stats.activeUsers}명</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">총 메시지:</span>
                      <span className="font-medium text-gray-900">{agent.stats.totalMessages}개</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">사용률:</span>
                      <span className="font-medium text-gray-900">{agent.stats.usagePercentage}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">순위:</span>
                      <span className="font-medium text-gray-900">#{agent.stats.ranking}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">사용률</span>
                      <span className="text-sm font-medium text-gray-900">{agent.stats.usagePercentage}%</span>
                    </div>
                    <Progress value={agent.stats.usagePercentage} className="h-2" />
                  </div>
                </>
              )}

              {/* Action Buttons - Always show these */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 korean-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGeneralChat(agent.id);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    일반 대화
                  </Button>
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="flex-1 korean-text"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleManagementChat(agent.id);
                    }}
                  >
                    <Wrench className="w-4 h-4 mr-2" />
                    관리 대화
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}