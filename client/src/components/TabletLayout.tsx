import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import AgentList from "@/components/AgentList";
import ChatInterface from "@/components/ChatInterface";
import AgentManagement from "@/components/AgentManagement";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ThemeSelector } from "@/components/ThemeSelector";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, ChevronDown, LogOut, Settings, GraduationCap, Code, Bot, User, FlaskRound, Map, Languages, Dumbbell, Database, Lightbulb, Heart, Calendar, Pen, FileText, Files, Edit, Bell, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@tanstack/react-query";
import type { Agent, Conversation } from "@/types/agent";

const iconMap: Record<string, any> = {
  "fas fa-graduation-cap": GraduationCap,
  "fas fa-code": Code,
  "fas fa-robot": Bot,
  "fas fa-user": User,
  "fas fa-flask": FlaskRound,
  "fas fa-map": Map,
  "fas fa-language": Languages,
  "fas fa-dumbbell": Dumbbell,
  "fas fa-database": Database,
  "fas fa-lightbulb": Lightbulb,
  "fas fa-heart": Heart,
  "fas fa-calendar": Calendar,
  "fas fa-pen": Pen,
  "fas fa-file-alt": FileText,
};

const backgroundColorMap: Record<string, string> = {
  "bg-slate-800": "bg-slate-800",
  "bg-gray-600": "bg-gray-600",
  "bg-red-600": "bg-red-600",
  "bg-orange-600": "bg-orange-600",
  "bg-amber-600": "bg-amber-600",
  "bg-yellow-600": "bg-yellow-600",
  "bg-lime-600": "bg-lime-600",
  "bg-green-600": "bg-green-600",
  "bg-emerald-600": "bg-emerald-600",
  "bg-teal-600": "bg-teal-600",
  "bg-cyan-600": "bg-cyan-600",
  "bg-sky-600": "bg-sky-600",
  "bg-blue-600": "bg-blue-600",
  "bg-indigo-600": "bg-indigo-600",
  "bg-violet-600": "bg-violet-600",
  "bg-purple-600": "bg-purple-600",
  "bg-fuchsia-600": "bg-fuchsia-600",
  "bg-pink-600": "bg-pink-600",
  "bg-rose-600": "bg-rose-600",
};

function getCategoryBadgeStyle(category: string) {
  switch (category) {
    case "학교":
      return "category-badge school";
    case "교수":
      return "category-badge professor";
    case "학생":
      return "category-badge student";
    case "그룹":
      return "category-badge group";
    case "기능형":
      return "category-badge feature";
    default:
      return "category-badge school";
  }
}

// TabletChatHeader component for file/management controls
interface TabletChatHeaderProps {
  agent: any;
  isManagementMode: boolean;
}

function TabletChatHeader({ agent, isManagementMode }: TabletChatHeaderProps) {
  const { t } = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const [showFileListModal, setShowFileListModal] = useState(false);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [showIconModal, setShowIconModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFileModal, setShowFileModal] = useState(false);
  const [notificationState, setNotificationState] = useState<"idle" | "waiting_input" | "waiting_approval">("idle");

  // Add system message function (simplified version)
  const addSystemMessage = (message: string) => {
    // This will be handled by the ChatInterface component
    console.log("System message:", message);
  };

  return (
    <>
      {/* Header Bar */}
      <div className="border-b border-border bg-background px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: agent.backgroundColor }}
            >
              {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) ? (
                <img 
                  src={agent.icon} 
                  alt={`${agent.name} icon`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <User className="text-white w-5 h-5" />
              )}
              {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                <User className="text-white w-5 h-5 hidden" />
              )}
            </div>
            <div>
              <h3 className="font-medium text-foreground korean-text">{agent.name}</h3>
              <p className="text-sm text-muted-foreground korean-text">
                {isManagementMode ? "관리자 모드" : "에이전트 대화"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* Files Button - Only visible in general mode */}
            {!isManagementMode && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2"
                onClick={() => setShowFileListModal(true)}
              >
                <Files className="w-4 h-4" />
              </Button>
            )}
            
            {isManagementMode && (
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="px-3 py-2 korean-text"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  기능선택
                </Button>
              
                {/* Dropdown Menu */}
                {showMenu && (
                  <>
                    {/* Invisible overlay to catch outside clicks */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-background border border-border rounded-xl shadow-lg z-50">
                      <div className="py-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowPersonaModal(true);
                            setShowMenu(false);
                            addSystemMessage("페르소나 편집 창을 열었습니다.");
                          }}
                        >
                          <User className="w-4 h-4 mr-2" />
                          {t('agent.persona')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowIconModal(true);
                            setShowMenu(false);
                            addSystemMessage("아이콘 변경 창을 열었습니다.");
                          }}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          {t('agent.iconChange')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowSettingsModal(true);
                            setShowMenu(false);
                            addSystemMessage("챗봇 설정 창을 열었습니다.");
                          }}
                        >
                          <Settings className="w-4 h-4 mr-2" />
                          {t('agent.settings')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowMenu(false);
                            setNotificationState("waiting_input");
                            addSystemMessage("알림 내용을 입력하세요. 모든 사용자에게 전송됩니다.");
                          }}
                        >
                          <Bell className="w-4 h-4 mr-2" />
                          {t('agent.notification')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={() => {
                            setShowFileModal(true);
                            setShowMenu(false);
                            addSystemMessage("문서 업로드 창을 열었습니다.");
                          }}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          {t('agent.upload')}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-start px-4 py-2 korean-text"
                          onClick={async () => {
                            setShowMenu(false);
                            addSystemMessage("에이전트 성과 분석을 실행합니다...");
                            
                            try {
                              const response = await fetch(`/api/agents/${agent.id}/performance`, {
                                credentials: 'include'
                              });
                              
                              if (response.ok) {
                                const data = await response.json();
                                const performanceMessage = `📊 ${data.agentName} 성과 분석 (${data.period})

📈 주요 지표:

• 총 메시지 수: ${data.metrics.totalMessages}개
• 활성 사용자: ${data.metrics.activeUsers}명
• 업로드 문서: ${data.metrics.documentsCount}개
• 최근 활동: ${data.metrics.recentActivity}건
• 응답률: ${data.metrics.responseRate}
• 평균 응답시간: ${data.metrics.avgResponseTime}
• 만족도: ${data.metrics.satisfaction}

📊 성장 추세:
• 메시지 증가율: ${data.trends.messageGrowth}
• 사용자 증가율: ${data.trends.userGrowth}
• 참여율: ${data.trends.engagementRate}`;
                                
                                addSystemMessage(performanceMessage);
                              } else {
                                addSystemMessage("성과 분석 데이터를 가져오는데 실패했습니다. 다시 시도해주세요.");
                              }
                            } catch (error) {
                              addSystemMessage("성과 분석 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
                            }
                          }}
                        >
                          <BarChart3 className="w-4 h-4 mr-2" />
                          {t('agent.performance')}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Note: Modals would need to be properly imported and implemented */}
    </>
  );
}

export default function TabletLayout() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"chat" | "management">("chat");
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useLanguage();

  // Parse URL to get selected agent
  useEffect(() => {
    if (location.startsWith("/chat/")) {
      const agentId = parseInt(location.split("/chat/")[1]);
      if (!isNaN(agentId)) {
        setSelectedAgentId(agentId);
        setActiveTab("chat");
      }
    } else if (location.startsWith("/management/")) {
      const agentId = parseInt(location.split("/management/")[1]);
      if (!isNaN(agentId)) {
        setSelectedAgentId(agentId);
        setActiveTab("management");
      }
    } else if (location === "/management") {
      setActiveTab("management");
      setSelectedAgentId(null);
    } else {
      setActiveTab("chat");
      setSelectedAgentId(null);
    }
  }, [location]);

  // Category options with translations
  const categories = [
    { value: "전체", label: "전체" },
    { value: "학교", label: "학교" },
    { value: "교수", label: "교수" },
    { value: "학생", label: "학생" },
    { value: "그룹", label: "그룹" },
    { value: "기능형", label: "기능형" }
  ];

  const { data: agents = [], isLoading: agentsLoading } = useQuery<Agent[]>({
    queryKey: ["/api/agents"],
    refetchInterval: 30000, // Refetch every 30 seconds to catch admin changes
  });

  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
    refetchInterval: 3000,
    refetchIntervalInBackground: true,
  });

  const logout = useMutation({
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

  // Filter and sort agents based on search, category, and recent messages
  const filteredAgents = agents
    .filter((agent: Agent) => {
      const matchesSearch = searchQuery === "" || 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === "전체" || agent.category === selectedCategory;
      
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      // For general chat mode, sort by most recent message first
      if (activeTab === "chat") {
        const conversationA = conversations.find(conv => conv.agentId === a.id);
        const conversationB = conversations.find(conv => conv.agentId === b.id);
        
        const hasRecentA = conversationA?.lastMessageAt;
        const hasRecentB = conversationB?.lastMessageAt;
        
        if (hasRecentA && hasRecentB) {
          // Both have messages - sort by most recent first
          const timeA = new Date(conversationA.lastMessageAt).getTime();
          const timeB = new Date(conversationB.lastMessageAt).getTime();
          return timeB - timeA;
        } else if (hasRecentA && !hasRecentB) {
          // Only A has messages - A comes first
          return -1;
        } else if (!hasRecentA && hasRecentB) {
          // Only B has messages - B comes first
          return 1;
        } else {
          // Neither has messages - sort by category priority
          const categoryOrder: Record<string, number> = { 
            "학교": 1, "교수": 2, "그룹": 3, "학생": 4, "기능형": 5 
          };
          return (categoryOrder[a.category] || 6) - (categoryOrder[b.category] || 6);
        }
      }
      
      // For management mode, maintain category order
      const categoryOrder: Record<string, number> = { 
        "학교": 1, "교수": 2, "그룹": 3, "학생": 4, "기능형": 5 
      };
      return (categoryOrder[a.category] || 6) - (categoryOrder[b.category] || 6);
    });

  const selectedAgent = selectedAgentId ? agents.find(agent => agent.id === selectedAgentId) : null;

  const handleAgentSelect = (agentId: number) => {
    setSelectedAgentId(agentId);
    const path = activeTab === "management" ? `/management/${agentId}` : `/chat/${agentId}`;
    navigate(path);
  };

  if (agentsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center korean-text">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Agent List */}
      <div className="w-96 border-r border-border bg-muted/50 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          {/* Search and Settings */}
          <div className="flex items-center gap-2 mb-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={t('home.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 bg-muted border-none korean-text h-11"
              />
            </div>
            
            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-11 px-4 text-sm korean-text flex-shrink-0"
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="korean-text h-11 px-4 flex-shrink-0">
                  <Settings className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 z-[99999]" sideOffset={5}>
                <DropdownMenuItem
                  className="korean-text cursor-pointer"
                  onClick={() => {
                    // Account settings functionality - placeholder for now
                    toast({
                      title: t('home.accountSettings'),
                      description: "계정 설정 기능이 곧 추가될 예정입니다.",
                    });
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  {t('home.accountSettings')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="korean-text">
                  <ThemeSelector />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="korean-text cursor-pointer"
                  onClick={() => logout.mutate()}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('common.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Tab Navigation */}
          <div className="grid grid-cols-2 gap-0 bg-muted rounded-xl p-1">
            <Button
              variant={activeTab === "chat" ? "default" : "ghost"}
              size="lg"
              className="korean-text h-14"
              onClick={() => {
                setActiveTab("chat");
                navigate("/");
              }}
            >
              {t('agent.generalChat')}
            </Button>
            <Button
              variant={activeTab === "management" ? "default" : "ghost"}
              size="lg"
              className="korean-text h-14"
              onClick={() => {
                setActiveTab("management");
                navigate("/management");
              }}
            >
              {t('agent.management')}
            </Button>
          </div>
        </div>

        {/* Agent List */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "chat" && (
            <div className="p-4 space-y-3">
              {filteredAgents.map((agent) => {
                const conversation = conversations.find(conv => conv.agentId === agent.id);
                const isSelected = selectedAgentId === agent.id;
                
                return (
                  <div
                    key={agent.id}
                    onClick={() => handleAgentSelect(agent.id)}
                    className={`relative bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-transparent'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 ${backgroundColorMap[agent.backgroundColor] || "bg-gray-600"} rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden`}>
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
                          <User className="text-white w-6 h-6" />
                        )}
                        {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                          <User className="text-white w-6 h-6 hidden" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-foreground truncate korean-text">
                              {agent.name}
                            </h3>
                            <span className={getCategoryBadgeStyle(agent.category)}>
                              {agent.category}
                            </span>
                          </div>
                          {conversation?.lastMessageAt && (
                            <span className="text-xs text-muted-foreground korean-text">
                              {formatDistanceToNow(new Date(conversation.lastMessageAt), { 
                                addSuffix: true, 
                                locale: ko 
                              })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between space-x-2">
                          <p className="text-sm text-muted-foreground truncate korean-text flex-1">
                            {conversation?.lastMessage?.content || agent.description}
                          </p>
                          {conversation && conversation.unreadCount > 0 && (
                            <span className="notification-badge ml-2 flex-shrink-0">{conversation.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {activeTab === "management" && (
            <AgentManagement />
          )}
        </div>
      </div>

      {/* Right Panel - Chat Interface */}
      <div className="flex-1 flex flex-col bg-muted/30">
        <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
          {selectedAgent ? (
            activeTab === "chat" ? (
              <ChatInterface agent={selectedAgent} isManagementMode={false} />
            ) : (
              <ChatInterface agent={selectedAgent} isManagementMode={true} />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center korean-text max-w-md mx-auto">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Settings className="text-white w-10 h-10" />
                </div>
                <h3 className="text-xl font-medium text-foreground mb-3 text-center">
                  {activeTab === "chat" ? t('home.selectAgent') : t('home.manageAgent')}
                </h3>
                <p className="text-muted-foreground text-center leading-relaxed">
                  {activeTab === "chat" 
                    ? t('home.selectAgentDesc')
                    : t('home.manageAgentDesc')
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}