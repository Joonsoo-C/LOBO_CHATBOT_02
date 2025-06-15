import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronDown, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AgentList from "@/components/AgentList";
import AgentManagement from "@/components/AgentManagement";
import type { Agent, Conversation } from "@/types/agent";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "management">("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/auth";
    },
    onError: (error: Error) => {
      toast({
        title: "로그아웃 실패",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredAgents = agents.filter((agent: Agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (agentsLoading) {
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

  return (
    <div className="mobile-container">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="px-4 py-3">
          {/* Header with logout button */}
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-lg font-semibold korean-text">LoBo 챗봇</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="korean-text"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {logoutMutation.isPending ? "로그아웃 중..." : "로그아웃"}
            </Button>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex bg-muted rounded-xl p-1 mb-4">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="sm"
              className="flex-1 korean-text"
              onClick={() => setActiveTab("chat")}
            >
              에이전트 채팅
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "ghost"}
              size="sm"
              className="flex-1 korean-text"
              onClick={() => setActiveTab("management")}
            >
              에이전트 관리
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="에이전트 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-20 bg-muted border-none korean-text"
            />
            <Button
              variant="default"
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2 text-xs korean-text"
            >
              전체 <ChevronDown className="ml-1 w-3 h-3" />
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1">
        {activeTab === "chat" && (
          <AgentList 
            agents={filteredAgents} 
            conversations={conversations}
          />
        )}
        {activeTab === "management" && (
          <AgentManagement />
        )}
      </main>

      {/* Logout Button (for testing) */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = "/api/logout"}
          className="korean-text"
        >
          로그아웃
        </Button>
      </div>
    </div>
  );
}
