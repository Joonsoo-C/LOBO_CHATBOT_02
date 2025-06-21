import { Link } from "wouter";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { GraduationCap, Code, Bot, User, FlaskRound, Map, Languages, Dumbbell, Database, Lightbulb, Heart, Calendar, Pen, FileText } from "lucide-react";
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
  const getConversationForAgent = (agentId: number) => {
    return conversations.find(conv => conv.agentId === agentId);
  };

  const getTimeAgo = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { 
        addSuffix: true, 
        locale: ko 
      });
    } catch {
      return "최근";
    }
  };

  // Category priority order: 학교, 교수, 그룹, 학생, 기능
  const getCategoryPriority = (category: string) => {
    switch (category) {
      case "학교": return 1;
      case "교수": return 2;
      case "그룹": return 3;
      case "학생": return 4;
      case "기능형": return 5;
      default: return 6;
    }
  };

  // Sort agents: first by category priority, then by recent message activity
  const sortedAgents = [...agents].sort((a, b) => {
    const conversationA = getConversationForAgent(a.id);
    const conversationB = getConversationForAgent(b.id);
    
    // If either agent has recent messages, prioritize those
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
      return getCategoryPriority(a.category) - getCategoryPriority(b.category);
    }
  });

  return (
    <div className="px-6 py-2 space-y-3 md:px-6 md:py-4 md:grid md:grid-cols-2 md:gap-4 md:space-y-0 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {sortedAgents.map((agent) => {
        const conversation = getConversationForAgent(agent.id);
        const IconComponent = iconMap[agent.icon] || User;
        const bgColor = backgroundColorMap[agent.backgroundColor] || "bg-gray-600";
        
        return (
          <Link key={agent.id} href={`/chat/${agent.id}`}>
            <div className="relative bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer md:p-5">
              <div className="flex items-center space-x-3 md:space-x-4">
                <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden md:w-14 md:h-14`}>
                  {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) ? (
                    <img 
                      src={agent.icon} 
                      alt={`${agent.name} icon`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        console.log(`Failed to load custom icon: ${agent.icon}`);
                        // Fallback to default icon if image fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        target.nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : (
                    <IconComponent className="text-white w-6 h-6" />
                  )}
                  {(agent.isCustomIcon && agent.icon?.startsWith('/uploads/')) && (
                    <IconComponent className="text-white w-6 h-6 hidden" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1 md:mb-2">
                    <div className="flex items-center space-x-2 md:space-x-3">
                      <h3 className="font-medium text-foreground truncate korean-text md:text-lg">
                        {agent.name}
                      </h3>
                      <span className={getCategoryBadgeStyle(agent.category)}>
                        {agent.category}
                      </span>
                    </div>
                    {conversation?.lastMessageAt && (
                      <span className="text-xs text-muted-foreground korean-text md:text-sm">
                        {getTimeAgo(conversation.lastMessageAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between space-x-2">
                    <p className="text-sm text-muted-foreground truncate korean-text flex-1 md:text-base">
                      {conversation?.lastMessage?.content || agent.description}
                    </p>
                    {conversation && conversation.unreadCount > 0 && (
                      <span className="notification-badge ml-2 flex-shrink-0">{conversation.unreadCount}</span>
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
