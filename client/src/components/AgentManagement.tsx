import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, MessageCircle, TrendingUp, Trophy, Settings, User, BookOpen, GraduationCap, Lightbulb, Heart, Edit, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

import type { Agent, AgentStats } from "@/types/agent";

import IconChangeModal from "./IconChangeModal";

interface ManagedAgent extends Agent {
  stats?: AgentStats;
}

function getIconComponent(iconName: string) {
  const iconMap: { [key: string]: any } = {
    'users': Users,
    'user': User,
    'book-open': BookOpen,
    'graduation-cap': GraduationCap,
    'lightbulb': Lightbulb,
    'heart': Heart,
    'message-circle': MessageCircle,
  };
  
  return iconMap[iconName] || Users;
}

export default function AgentManagement() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const { user } = useAuth();

  const [selectedAgent, setSelectedAgent] = useState<ManagedAgent | null>(null);
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);

  // Check if user has agent management permissions
  const hasAgentManagementRole = user?.role === 'agent_admin' || user?.role === 'master_admin' || user?.userType === 'admin' || user?.id === 'master_admin';
  


  const { data: managedAgents = [], isLoading } = useQuery<ManagedAgent[]>({
    queryKey: ["/api/agents/managed"],
    enabled: hasAgentManagementRole, // Only fetch if user has permissions
  });

  console.log(`[DEBUG] AgentManagement: user role: ${user?.role}, hasPermissions: ${hasAgentManagementRole}, managedAgents count: ${managedAgents.length}`, managedAgents);

  const handleManagementChat = (agentId: number) => {
    console.log(`[DEBUG] AgentManagement: Clicking agent ${agentId}, navigating to /management/${agentId}`);
    setLocation(`/management/${agentId}`);
  };

  const handleIconChange = (agent: ManagedAgent) => {
    setSelectedAgent(agent);
    setIsIconModalOpen(true);
  };

  const handleIconChangeSuccess = (message: string) => {
    toast({
      title: "아이콘 변경 완료",
      description: message,
    });
  };

  // Show access denied message if user doesn't have permissions
  if (!hasAgentManagementRole) {
    return (
      <div className="px-4 py-6">
        <div className="text-center korean-text">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Settings className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">{t('agent.noManagementPermission')}</h3>
          <p className="text-muted-foreground">
            에이전트 관리 권한이 없습니다. 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="px-4 py-6">
        <div className="text-center korean-text">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6">
      <div className="text-center mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
          </div>

        </div>
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
              className="bg-white rounded-2xl p-6 shadow-sm border hover:shadow-md transition-all duration-150 cursor-pointer active:shadow-sm active:scale-[0.98] active:bg-gray-50"
              onClick={() => handleManagementChat(agent.id)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: agent.backgroundColor }}
                  >
                    {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) ? (
                      <img 
                        src={agent.icon} 
                        alt={`${agent.name} icon`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log(`Failed to load custom icon: ${agent.icon}`);
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          target.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      (() => {
                        const IconComponent = getIconComponent(agent.icon);
                        return <IconComponent className="text-white w-5 h-5" />;
                      })()
                    )}
                    {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                      (() => {
                        const IconComponent = getIconComponent(agent.icon);
                        return <IconComponent className="text-white w-5 h-5 hidden" />;
                      })()
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 korean-text">{agent.name}</h3>
                    <p className="text-sm text-gray-600 korean-text">{agent.description}</p>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex space-x-2 mb-4">
                <Badge variant="secondary" className="text-xs">{agent.category}</Badge>
                <Badge className="text-xs bg-green-100 text-green-700 hover:bg-green-100">{t('agent.active')}</Badge>
              </div>

              {/* Statistics Grid */}
              {agent.stats && (
                <>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Users className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">사용자:</span>
                      <span className="font-medium text-gray-900">{agent.stats.activeUsers}명</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MessageCircle className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">{t('agent.totalUsers')}:</span>
                      <span className="font-medium text-gray-900">{agent.stats.totalMessages}개</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">{t('agent.satisfaction')}:</span>
                      <span className="font-medium text-gray-900">{agent.stats.usagePercentage}%</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="text-gray-500 w-4 h-4" />
                      <span className="text-sm text-gray-600">{t('agent.ranking')}:</span>
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


            </div>
          ))}
        </div>
      )}
      


      {selectedAgent && (
        <IconChangeModal
          agent={selectedAgent}
          isOpen={isIconModalOpen}
          onClose={() => setIsIconModalOpen(false)}
          onSuccess={handleIconChangeSuccess}
        />
      )}
    </div>
  );
}