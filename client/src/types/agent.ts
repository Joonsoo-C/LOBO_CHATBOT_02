export interface Agent {
  id: number;
  
  // 1. 기본 정보
  name: string;
  description: string;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
  
  // 2. 카테고리 및 상태 정보
  upperCategory?: string;    // 상위 카테고리 (예: 단과대학)
  lowerCategory?: string;    // 하위 카테고리 (예: 학과)
  detailCategory?: string;   // 세부 카테고리
  status?: "active" | "inactive" | "pending";
  
  // 3. 모델 및 응답 설정
  llmModel?: string;         // 사용 모델
  chatbotType?: "strict-doc" | "doc-fallback-llm" | "general-llm";
  maxInputLength?: number;   // 최대 입력 길이
  maxResponseLength?: number; // 최대 응답 길이
  
  // 4. 역할 및 페르소나 설정
  personaNickname?: string;  // 페르소나 닉네임
  speechStyle?: string;      // 말투 스타일
  personality?: string;      // 성격 설명
  expertiseArea?: string;    // 전문 분야
  additionalPrompt?: string; // 추가 프롬프트
  
  // 5. 문서 연결 및 업로드
  uploadFormats?: string[];  // 업로드 가능한 포맷
  uploadMethod?: "dragdrop" | "onedrive";
  maxFileCount?: number;     // 최대 문서 수
  maxFileSizeMB?: number;    // 최대 파일 크기(MB)
  documentManagerIds?: string[]; // 문서 업로드/연결 권한자 목록
  
  // 6. 권한 및 접근 설정
  visibility?: "private" | "custom" | "group" | "organization";
  allowedGroups?: string[];  // 접근 가능한 사용자 그룹
  agentManagerIds?: string[]; // 에이전트 관리자 목록
  agentEditorIds?: string[];  // 에이전트 편집 가능 사용자 목록
  
  // 기존 UI 관련 필드들 (호환성 유지)
  icon: string;
  backgroundColor: string;
  isCustomIcon?: boolean;
  
  // 기존 레거시 필드들 (호환성 유지)
  category: "학교" | "교수" | "학생" | "그룹" | "기능형";
  managerId?: string;
  isActive: boolean;
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
