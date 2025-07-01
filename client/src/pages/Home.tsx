import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Settings, Search, ChevronDown, LogOut, Languages, User } from "lucide-react";
import { Agent, Conversation } from "@shared/schema";
import AgentList from "@/components/AgentList";
import AgentManagement from "@/components/AgentManagement";
import { AccountSettingsModal } from "@/components/AccountSettingsModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { useDebounce } from "@/hooks/useDebounce";
import { eventBus, EVENTS } from "@/utils/eventBus";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
  role?: string;
}

function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "management">("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [settingsDropdownOpen, setSettingsDropdownOpen] = useState(false);
  const { t } = useLanguage();
  const queryClient = useQueryClient();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    staleTime: 0, // Always consider data stale for immediate updates
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnMount: "always", // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnReconnect: true, // Refetch when reconnecting
  });

  const { data: conversations = [] } = useQuery<(Conversation & { agent: Agent; lastMessage?: any })[]>({
    queryKey: ["/api/conversations"],
  });

  // Listen for agent update events from IconChangeModal
  useEffect(() => {
    console.log("Home.tsx: Setting up eventBus listeners...");
    
    const handleAgentUpdate = () => {
      console.log("Home.tsx: Received agent update event, forcing refresh...");
      // Force remove all cached agent data
      queryClient.removeQueries({ queryKey: ["/api/agents"] });
      queryClient.removeQueries({ queryKey: ["/api/conversations"] });
      
      // Force refetch with immediate execution
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/agents"], type: 'active' });
        queryClient.refetchQueries({ queryKey: ["/api/conversations"], type: 'active' });
      }, 100);
    };

    eventBus.on(EVENTS.FORCE_REFRESH_AGENTS, handleAgentUpdate);
    eventBus.on(EVENTS.AGENT_ICON_CHANGED, handleAgentUpdate);
    
    // Register global window function for direct refresh fallback
    (window as any).forceRefreshAgents = () => {
      console.log("Home.tsx: Global window function called for force refresh");
      handleAgentUpdate();
    };
    
    console.log("Home.tsx: EventBus listeners and window function registered");

    return () => {
      console.log("Home.tsx: Cleaning up eventBus listeners");
      eventBus.off(EVENTS.FORCE_REFRESH_AGENTS, handleAgentUpdate);
      eventBus.off(EVENTS.AGENT_ICON_CHANGED, handleAgentUpdate);
      // Don't delete window function as other components might be using it
    };
  }, [queryClient]);

  const categories = [
    { value: "전체", label: "전체" },
    { value: "학교", label: "학교" },
    { value: "교수", label: "교수" },
    { value: "학생", label: "학생" },
    { value: "그룹", label: "그룹" },
    { value: "기능형", label: "기능형" }
  ];

  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Filter by category
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }

    // Filter by search query using debounced value
    if (debouncedSearchQuery.trim()) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(agent => 
        agent.name.toLowerCase().includes(query) ||
        agent.description.toLowerCase().includes(query)
      );
    }

    // Sort agents by activity
    const agentConversationMap = new Map();
    conversations.forEach(conv => {
      const existing = agentConversationMap.get(conv.agentId);
      if (!existing || (conv.lastMessage && new Date(conv.lastMessage.createdAt) > new Date(existing.lastMessage.createdAt))) {
        agentConversationMap.set(conv.agentId, conv);
      }
    });

    return filtered.sort((a, b) => {
      const aConv = agentConversationMap.get(a.id);
      const bConv = agentConversationMap.get(b.id);
      
      if (aConv && bConv && aConv.lastMessage && bConv.lastMessage) {
        return new Date(bConv.lastMessage.createdAt).getTime() - new Date(aConv.lastMessage.createdAt).getTime();
      } else if (aConv && aConv.lastMessage) {
        return -1;
      } else if (bConv && bConv.lastMessage) {
        return 1;
      } else {
        const categoryOrder: Record<string, number> = { "학교": 0, "교수": 1, "그룹": 2, "학생": 3, "기능형": 4 };
        return (categoryOrder[a.category] ?? 5) - (categoryOrder[b.category] ?? 5);
      }
    });
  }, [agents, conversations, debouncedSearchQuery, selectedCategory]);

  const handleLogout = useCallback(async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        window.location.href = '/auth';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  return (
    <div className="mobile-container no-scroll-bounce scroll-container md:min-h-screen md:w-full">
      {/* Header */}
      <header className="fixed-header-stable md:static md:bg-transparent md:shadow-none md:mb-0">
        <div className="px-4 py-3 md:px-6 md:py-4">
          {/* Header with search and settings */}
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            {/* Search Bar */}
            <div className="relative flex-1 mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 bg-muted border-none korean-text md:h-11 w-full"
              />
            </div>
            
            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 text-xs korean-text md:h-11 md:px-4 md:text-sm flex-shrink-0"
                >
                  {selectedCategory === "전체" ? t('home.categories.all') :
                   selectedCategory === "학교" ? t('home.categories.school') :
                   selectedCategory === "교수" ? t('home.categories.professor') :
                   selectedCategory === "학생" ? t('home.categories.student') :
                   selectedCategory === "그룹" ? t('home.categories.group') :
                   selectedCategory === "기능형" ? t('home.categories.function') :
                   selectedCategory} <ChevronDown className="ml-1 w-3 h-3" />
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
            
            {/* Settings Dropdown */}
            <DropdownMenu open={settingsDropdownOpen} onOpenChange={setSettingsDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="korean-text md:h-11 md:px-4 flex-shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 z-[99999] fixed-dropdown-position" 
                sideOffset={5}
                avoidCollisions={false}
                side="bottom"
                alignOffset={-10}
              >
                <DropdownMenuItem
                  className="korean-text cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    setSettingsDropdownOpen(false); // Close dropdown
                    setShowAccountModal(true);
                  }}
                >
                  <User className="w-4 h-4 mr-2" />
                  계정 설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Languages className="w-4 h-4" />
                    <span className="korean-text text-sm">{t('common.language')}</span>
                  </div>
                  <div className="mt-2">
                    <LanguageSelector />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <div className="px-3 py-2">
                  <ThemeSelector />
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="korean-text cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Apple Messages Tab Navigation */}
          <div className="apple-nav-tabs">
            <div 
              className={`apple-nav-tab ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => setActiveTab("chat")}
            >
              {t('common.chat')}
            </div>
            {(user?.role === 'agent_admin' || user?.role === 'master_admin') && (
              <div 
                className={`apple-nav-tab ${activeTab === "management" ? "active" : ""}`}
                onClick={() => setActiveTab("management")}
              >
                {t('common.management')}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 main-content md:pt-0">
        {activeTab === "chat" && (
          <div className="agent-list-container">
            <AgentList 
              agents={filteredAgents as any} 
              conversations={conversations as any}
            />
          </div>
        )}
        {activeTab === "management" && (
          <div className="px-6 md:px-0">
            <AgentManagement />
          </div>
        )}
      </main>

      {/* Account Settings Modal */}
      <AccountSettingsModal 
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
      />
    </div>
  );
}

export default Home;