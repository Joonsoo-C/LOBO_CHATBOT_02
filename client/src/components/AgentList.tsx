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
    case "학과":
      return "category-badge school";
    case "교수":
      return "category-badge professor";
    case "기능":
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

  return (
    <div className="px-4 py-2 space-y-3">
      {agents.map((agent) => {
        const conversation = getConversationForAgent(agent.id);
        const IconComponent = iconMap[agent.icon] || User;
        const bgColor = backgroundColorMap[agent.backgroundColor] || "bg-gray-600";
        
        return (
          <Link key={agent.id} href={`/chat/${agent.id}`}>
            <div className="bg-card rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 ${bgColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className="text-white w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-medium text-foreground truncate korean-text">
                      {agent.name}
                    </h3>
                    <span className="text-xs text-muted-foreground korean-text">
                      {conversation?.lastMessageAt ? getTimeAgo(conversation.lastMessageAt) : "새로운"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getCategoryBadgeStyle(agent.category)}>
                      {agent.category}
                    </span>
                    <p className="text-sm text-muted-foreground truncate korean-text">
                      {conversation?.lastMessage?.content || agent.description}
                    </p>
                  </div>
                  {/* Message count badge for some agents */}
                  {agent.name.includes("노지후") && (
                    <div className="mt-1">
                      <span className="notification-badge">5</span>
                    </div>
                  )}
                  {agent.name.includes("비즈니스") && (
                    <div className="mt-1">
                      <span className="notification-badge">31</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
