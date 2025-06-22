import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import ChatInterface from "@/components/ChatInterface";
import type { Agent } from "@/types/agent";

export default function Management() {
  const { agentId } = useParams<{ agentId: string }>();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: [`/api/agents/${agentId}`],
    enabled: !!agentId,
  });

  // Check if user is the manager of this agent or master admin
  const isAuthorized = agent && user && (agent.managerId === user.id || user.userType === 'admin' || user.id === 'master_admin');

  if (isLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center korean-text">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center korean-text">
            <p className="text-muted-foreground">에이전트를 찾을 수 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center korean-text">
            <p className="text-muted-foreground">이 에이전트를 관리할 권한이 없습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return <ChatInterface agent={agent} isManagementMode={true} />;
}