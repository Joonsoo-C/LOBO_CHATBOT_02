import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import AgentList from "@/components/AgentList";
import AgentManagement from "@/components/AgentManagement";
import type { Agent, Conversation } from "@/types/agent";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "management">("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: agents, isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
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

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
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

  const filteredAgents = agents?.filter(agent =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

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
            conversations={conversations || []}
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
