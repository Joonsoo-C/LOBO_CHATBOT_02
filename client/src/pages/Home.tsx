import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Search, ChevronDown, LogOut, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import AgentList from "@/components/AgentList";
import AgentManagement from "@/components/AgentManagement";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Agent, Conversation } from "@/types/agent";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // Set active tab based on current URL
  const [activeTab, setActiveTab] = useState<"chat" | "management">(
    window.location.pathname === "/management" ? "management" : "chat"
  );

  // Category options with translations
  const categories = [
    { value: "전체", label: t('home.categoryAll') },
    { value: "학교", label: t('home.categorySchool') },
    { value: "교수", label: t('home.categoryProfessor') },
    { value: "학생", label: t('home.categoryStudent') },
    { value: "그룹", label: t('home.categoryGroup') },
    { value: "기능형", label: t('home.categoryFunction') }
  ];

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 3000, // Poll every 3 seconds for new messages
    refetchIntervalInBackground: true, // Continue polling when tab is not focused
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response.ok;
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.replace("/auth");
    },
    onError: () => {
      queryClient.clear();
      window.location.replace("/auth");
    },
  });

  const filteredAgents = agents.filter((agent: Agent) => {
    // Category filtering
    let categoryMatch = true;
    if (selectedCategory !== "전체") {
      categoryMatch = agent.category === selectedCategory;
    }
    
    // Search query filtering
    let searchMatch = true;
    if (searchQuery.trim()) {
      searchMatch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                   agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return categoryMatch && searchMatch;
  });

  if (agentsLoading) {
    return (
      <div className="mobile-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center korean-text">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-container no-scroll-bounce scroll-container md:max-w-6xl md:mx-auto md:grid md:grid-cols-12 md:gap-6 md:px-6 md:py-4">
      {/* Header */}
      <header className="fixed-header md:static md:bg-transparent md:shadow-none md:col-span-12 md:mb-0">
        <div className="px-4 py-3 md:px-0 md:py-0">
          {/* Header with search and settings */}
          <div className="flex items-center gap-3 mb-4 md:mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 md:max-w-lg">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-20 bg-muted border-none korean-text md:h-11"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 px-2 text-xs korean-text md:h-8 md:px-3"
                  >
                    {categories.find(cat => cat.value === selectedCategory)?.label || selectedCategory} <ChevronDown className="ml-1 w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32 z-[99999]" sideOffset={5}>
                  {categories.map((category) => (
                    <DropdownMenuItem
                      key={category.value}
                      className="korean-text cursor-pointer"
                      onClick={() => setSelectedCategory(category.value)}
                    >
                      {category.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="korean-text md:h-11 md:px-4"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[99999]" sideOffset={5}>
                <DropdownMenuItem className="korean-text cursor-pointer">
                  <Settings className="w-4 h-4 mr-2" />
                  {t('home.accountSettings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <div className="text-sm text-muted-foreground mb-2 korean-text">{t('auth.languageSettings')}</div>
                  <LanguageSelector />
                </div>
                <DropdownMenuSeparator />
                <div className="px-2 py-1">
                  <div className="text-sm text-muted-foreground mb-2 korean-text">{t('auth.themeSettings')}</div>
                  <ThemeSelector />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="korean-text cursor-pointer"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? t('common.loading') : t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Tab Navigation */}
          <div className="tab-navigation grid grid-cols-2 bg-muted rounded-lg p-1 mb-4 md:mb-6 w-full gap-1">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="lg"
              className="korean-text h-14 text-base font-medium"
              onClick={() => setActiveTab("chat")}
            >
              {t('common.chat')}
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "ghost"}
              size="lg"
              className="korean-text h-14 text-base font-medium"
              onClick={() => setActiveTab("management")}
            >
              {t('common.management')}
            </Button>
          </div>

          
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 main-content md:pt-0 md:col-span-12">
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


    </div>
  );
}
