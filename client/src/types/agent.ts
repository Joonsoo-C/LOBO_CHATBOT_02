export interface Agent {
  id: number;
  name: string;
  description: string;
  category: "학교" | "교수" | "기능" | "학과";
  icon: string;
  backgroundColor: string;
  isActive: boolean;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgentStats {
  id: number;
  agentId: number;
  activeUsers: number;
  totalMessages: number;
  usagePercentage: number;
  ranking: number;
  updatedAt: string;
}

export interface Conversation {
  id: number;
  userId: string;
  agentId: number;
  lastMessageAt: string;
  createdAt: string;
  agent: Agent;
  lastMessage?: Message;
}

export interface Message {
  id: number;
  conversationId: number;
  content: string;
  isFromUser: boolean;
  createdAt: string;
}

export interface Document {
  id: number;
  agentId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  content?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface ChatResponse {
  userMessage: Message;
  aiMessage: Message;
  usedDocuments?: string[];
}
