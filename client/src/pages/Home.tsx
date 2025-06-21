import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { Settings, Search, ChevronDown, LogOut, Languages } from "lucide-react";
import { Agent, Conversation } from "@shared/schema";
import AgentList from "@/components/AgentList";
import AgentManagement from "@/components/AgentManagement";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/ThemeSelector";

interface User {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  userType?: string;
}

function Home() {
  const [activeTab, setActiveTab] = useState<"chat" | "management">("chat");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const { t } = useLanguage();

  const { data: user } = useQuery<User>({
    queryKey: ["/api/user"],
  });

  const { data: agents = [] } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
  });

  const { data: conversations = [] } = useQuery<(Conversation & { agent: Agent; lastMessage?: any })[]>({
    queryKey: ["/api/conversations"],
  });

  const categories = [
    { value: "전체", label: t('home.categories.all') },
    { value: "학교", label: t('home.categories.school') },
    { value: "교수", label: t('home.categories.professor') },
    { value: "학생", label: t('home.categories.student') },
    { value: "그룹", label: t('home.categories.group') },
    { value: "기능형", label: t('home.categories.function') }
  ];

  const filteredAgents = useMemo(() => {
    let filtered = agents;

    // Filter by category
    if (selectedCategory !== "전체") {
      filtered = filtered.filter(agent => agent.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
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
      
      if (aConv && bConv) {
        return new Date(bConv.lastMessage.createdAt).getTime() - new Date(aConv.lastMessage.createdAt).getTime();
      } else if (aConv) {
        return -1;
      } else if (bConv) {
        return 1;
      } else {
        const categoryOrder: Record<string, number> = { "학교": 0, "교수": 1, "그룹": 2, "학생": 3, "기능형": 4 };
        return (categoryOrder[a.category] ?? 5) - (categoryOrder[b.category] ?? 5);
      }
    });
  }, [agents, conversations, searchQuery, selectedCategory]);

  const handleLogout = async () => {
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
  };

  return (
    <div className="mobile-container no-scroll-bounce scroll-container md:max-w-6xl md:mx-auto md:grid md:grid-cols-12 md:gap-6 md:px-6 md:py-4">
      {/* Header */}
      <header className="fixed-header md:static md:bg-transparent md:shadow-none md:col-span-12 md:mb-0">
        <div className="px-6 py-3 md:px-0 md:py-0">
          {/* Header with search and settings */}
          <div className="flex items-center gap-2 mb-4 md:mb-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 bg-muted border-none korean-text md:h-11"
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
            
            {/* Settings Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="korean-text md:h-11 md:px-4 flex-shrink-0"
                >
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[99999]" sideOffset={5}>
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

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-0 bg-muted rounded-lg p-1 tab-navigation">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="lg"
              className="flex-1 korean-text h-12 md:h-14"
              onClick={() => setActiveTab("chat")}
            >
              {t('common.chat')}
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "ghost"}
              size="lg"
              className="flex-1 korean-text h-12 md:h-14"
              onClick={() => setActiveTab("management")}
            >
              {t('common.management')}
            </Button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 main-content md:pt-0 md:col-span-12">
        <div className="px-6 md:px-0">
          {activeTab === "chat" && (
            <AgentList 
              agents={filteredAgents as any} 
              conversations={conversations as any}
            />
          )}
          {activeTab === "management" && (
            <AgentManagement />
          )}
        </div>
      </main>
    </div>
  );
}

export default Home;