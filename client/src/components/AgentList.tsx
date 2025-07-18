import { Link, useLocation } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { GraduationCap, Code, Bot, User, FlaskRound, Map, Languages, Dumbbell, Database, Lightbulb, Heart, Calendar, Pen, FileText } from "lucide-react";
import { useMemo } from "react";
import { debounce } from "@/utils/performance";
import { useLanguage } from "@/contexts/LanguageContext";
import type { Agent, Conversation } from "@/types/agent";

interface AgentListProps {
  agents: Agent[];
  conversations: Conversation[];
}

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
  "bg-primary": "bg-primary",
  "bg-orange-500": "bg-orange-500",
  "bg-gray-600": "bg-gray-600",
  "bg-blue-500": "bg-blue-500",
  "bg-green-500": "bg-green-500",
  "bg-purple-500": "bg-purple-500",
  "bg-yellow-500": "bg-yellow-500",
  "bg-pink-500": "bg-pink-500",
  "bg-indigo-500": "bg-indigo-500",
  "bg-teal-500": "bg-teal-500",
  "bg-red-500": "bg-red-500",
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

export default function AgentList({ agents, conversations }: AgentListProps) {
  const [location] = useLocation();
  const { t, language } = useLanguage();
  const getConversationForAgent = useMemo(() => {
    return (agentId: number) => conversations.find(conv => conv.agentId === agentId);
  }, [conversations]);

  const getTimeAgo = useMemo(() => {
    return (date: string) => {
      try {
        const locale = language === 'ko' ? ko : enUS;
        return formatDistanceToNow(new Date(date), { 
          addSuffix: true, 
          locale 
        });
      } catch {
        return t('time.recent');
      }
    };
  }, [language, t]);

  // Category priority order: 학교, 교수, 그룹, 학생, 기능
  const getCategoryPriority = useMemo(() => {
    return (category: string) => {
      switch (category) {
        case "학교": return 1;
        case "교수": return 2;
        case "그룹": return 3;
        case "학생": return 4;
        case "기능형": return 5;
        default: return 6;
      }
    };
  }, []);

  // Sort agents: prioritize those with recent messages, then by category
  const sortedAgents = useMemo(() => {
    return [...agents].sort((a, b) => {
      const conversationA = getConversationForAgent(a.id);
      const conversationB = getConversationForAgent(b.id);
      
      // Check for recent message activity using lastMessageAt
      const hasRecentA = conversationA?.lastMessageAt;
      const hasRecentB = conversationB?.lastMessageAt;
      
      if (hasRecentA && hasRecentB) {
        // Both have messages - sort by most recent message timestamp (newest first)
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
        // Neither has messages - sort by category priority (학교, 교수, 그룹, 학생, 기능형)
        return getCategoryPriority(a.category) - getCategoryPriority(b.category);
      }
    });
  }, [agents, conversations, getConversationForAgent, getCategoryPriority]);

  return (
    <div className="space-y-1 px-4">
      {sortedAgents.map((agent) => {
        const conversation = getConversationForAgent(agent.id);
        const IconComponent = iconMap[agent.icon] || User;
        const bgColor = backgroundColorMap[agent.backgroundColor] || "bg-gray-600";
        
        const isActive = location === `/chat/${agent.id}`;
        
        return (
          <Link key={agent.id} href={`/chat/${agent.id}`} className="block w-full">
            <div className={`p-3 rounded-lg transition-colors duration-200 cursor-pointer border-b border-gray-100 dark:border-gray-800 last:border-b-0 ${
              isActive 
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                : 'bg-white dark:bg-gray-900 hover:bg-gray-50/50 dark:hover:bg-gray-800/20'
            }`}>
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 ${bgColor} rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden md:w-12 md:h-12`}>
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
                    <IconComponent className="text-white w-5 h-5" />
                  )}
                  {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                    <IconComponent className="text-white w-5 h-5 hidden" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium truncate korean-text text-sm md:text-base ${
                        isActive ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {agent.name}
                      </h3>
                      <span className={`${getCategoryBadgeStyle(agent.category)} text-xs px-2 py-0.5 rounded-md`}>
                        {t(`category.${agent.category === '학교' ? 'school' : agent.category === '교수' ? 'professor' : agent.category === '학생' ? 'student' : agent.category === '그룹' ? 'group' : 'function'}`)}
                      </span>
                    </div>
                    {conversation?.lastMessageAt && (
                      <span className={`text-xs korean-text flex-shrink-0 ${
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {getTimeAgo(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate korean-text flex-1 ${
                      isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {conversation?.lastMessage?.content || agent.description}
                    </p>
                    {conversation && conversation.unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center ml-2 flex-shrink-0 shadow-lg border-2 border-white dark:border-gray-800">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
