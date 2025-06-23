export interface Agent {
  id: number;
  name: string;
  description: string;
  category: "학교" | "교수" | "학생" | "그룹" | "기능형";
  mainCategory?: string;    // 상위 카테고리 (대학교/대학원/연구소/행정)
  subCategory?: string;     // 하위 카테고리 (단과대학 등)
  detailCategory?: string;  // 세부 카테고리 (학과 등)
  llmModel?: string;        // LLM 모델 (gpt-4o, gpt-4o-mini 등)
  chatbotType?: string;     // 챗봇 타입 (strict-doc, doc-fallback-llm, general-llm)
  speakingStyle?: string;   // 말투 설정
  personalityTraits?: string; // 성격 특성
  prohibitedWordResponse?: string; // 금지어 응답
  icon: string;
  backgroundColor: string;
  isCustomIcon?: boolean;
  isActive: boolean;
  managerId?: string;
  llmModel?: string;
  chatbotType?: string;
  speakingStyle?: string;
  personalityTraits?: string;
  prohibitedWordResponse?: string;
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
  unreadCount: number;
  lastReadAt?: string;
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
