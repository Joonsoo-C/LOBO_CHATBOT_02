import {
  type User,
  type UpsertUser,
  type Agent,
  type InsertAgent,
  type Conversation,
  type InsertConversation,
  type Message,
  type InsertMessage,
  type Document,
  type InsertDocument,
  type AgentStats,
  type MessageReaction,
  type InsertMessageReaction,
} from "@shared/schema";
import { IStorage } from "./storage";

// Temporary in-memory storage to handle database connection issues
export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private agents: Map<number, Agent> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private documents: Map<number, Document> = new Map();
  private agentStats: Map<number, AgentStats> = new Map();
  private messageReactions: Map<number, MessageReaction> = new Map();
  
  private nextId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create users with pre-hashed passwords
    const masterAdmin: User = {
      id: "master_admin",
      username: "master_admin",
      firstName: "Master",
      lastName: "Admin",
      password: "$2b$10$e097KpT.lX7HTqlHodUO5.3gIU26TfoFaDbkINPo5egSeY/zf4sb6", // MasterAdmin2024!
      email: "admin@lobo.edu",
      userType: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null
    };
    this.users.set("master_admin", masterAdmin);

    // Create demo student account
    const studentUser: User = {
      id: "2024001234",
      username: "2024001234",
      firstName: "김",
      lastName: "학생",
      password: "$2b$10$N8XSxPz/zitNI7exEyKVHuh/AS.CnxoperLS.zOa7UEBmNsUJ7EDO", // student123
      email: "student@lobo.edu",
      userType: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null
    };
    this.users.set("2024001234", studentUser);

    // Create demo faculty account
    const facultyUser: User = {
      id: "F2024001",
      username: "F2024001",
      firstName: "이",
      lastName: "교수",
      password: "$2b$10$eYu4kIdi2oqmILaVljmuNOELydq3vW920HbVQhTiiG8xPT5WyiLeO", // faculty123
      email: "faculty@lobo.edu",
      userType: "faculty",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null
    };
    this.users.set("F2024001", facultyUser);

    // Create sample agents
    const sampleAgents: Agent[] = [
      {
        id: 1,
        name: "학교 안내",
        description: "학교 전반에 대한 정보를 제공합니다",
        category: "학교",
        icon: "School",
        backgroundColor: "blue",
        isActive: true,
        isCustomIcon: false,
        personality: "친근하고 도움이 되는",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "master_admin",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 2,
        name: "입학 상담",
        description: "입학 관련 정보와 상담을 제공합니다",
        category: "학교",
        icon: "GraduationCap",
        backgroundColor: "green",
        isActive: true,
        isCustomIcon: false,
        personality: "정확하고 신뢰할 수 있는",
        llmModel: "gpt-4o",
        chatbotType: "doc-fallback-llm",
        managerId: "master_admin",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 3,
        name: "레포트 작성",
        description: "학술 레포트 작성을 도와드립니다",
        category: "기능형",
        icon: "FileText",
        backgroundColor: "purple",
        isActive: true,
        isCustomIcon: false,
        personality: "체계적이고 논리적인",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 4,
        name: "자기소개서 작성",
        description: "자기소개서 작성 및 첨삭을 도와드립니다",
        category: "기능형",
        icon: "User",
        backgroundColor: "orange",
        isActive: true,
        isCustomIcon: false,
        personality: "격려하고 긍정적인",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 5,
        name: "코딩 과제 도움",
        description: "프로그래밍 과제와 코딩 문제를 해결해드립니다",
        category: "기능형",
        icon: "Code",
        backgroundColor: "indigo",
        isActive: true,
        isCustomIcon: false,
        personality: "논리적이고 정확한",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 6,
        name: "강의 요약 정리",
        description: "강의 내용을 체계적으로 요약 정리해드립니다",
        category: "기능형",
        icon: "BookOpen",
        backgroundColor: "teal",
        isActive: true,
        isCustomIcon: false,
        personality: "체계적이고 명확한",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 7,
        name: "SNS 게시물 작성",
        description: "소셜미디어 게시물 작성을 도와드립니다",
        category: "기능형",
        icon: "MessageCircle",
        backgroundColor: "pink",
        isActive: true,
        isCustomIcon: false,
        personality: "창의적이고 트렌디한",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 8,
        name: "발표 대본 작성",
        description: "프레젠테이션 대본 작성을 도와드립니다",
        category: "기능형",
        icon: "Presentation",
        backgroundColor: "red",
        isActive: true,
        isCustomIcon: false,
        personality: "설득력 있고 명확한",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      },
      {
        id: 9,
        name: "면접 준비",
        description: "취업 면접 준비와 모의면접을 도와드립니다",
        category: "기능형",
        icon: "Users",
        backgroundColor: "yellow",
        isActive: true,
        isCustomIcon: false,
        personality: "격려하고 전문적인",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "F2024001",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        grumpyResponse: null,
        prohibitedWordResponse: null
      }
    ];

    sampleAgents.forEach(agent => this.agents.set(agent.id, agent));
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(user: UpsertUser): Promise<User> {
    const newUser: User = {
      ...user,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    const newUser: User = {
      ...user,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.nextId++;
    const newAgent: Agent = {
      ...agent,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(id: number, updates: any): Promise<Agent> {
    const existing = this.agents.get(id);
    if (!existing) throw new Error('Agent not found');
    
    const updated: Agent = {
      ...existing,
      ...updates,
      updatedAt: new Date()
    };
    this.agents.set(id, updated);
    return updated;
  }

  async getAgentsByManager(managerId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.managerId === managerId);
  }

  // Conversation operations
  async getOrCreateConversation(userId: string, agentId: number, type: string = "general"): Promise<Conversation> {
    const existing = Array.from(this.conversations.values())
      .find(conv => conv.userId === userId && conv.agentId === agentId && conv.type === type);
    
    if (existing) return existing;

    const id = this.nextId++;
    const newConversation: Conversation = {
      id,
      userId,
      agentId,
      type,
      unreadCount: 0,
      lastMessageAt: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId);
    
    return userConversations.map(conv => {
      const agent = this.agents.get(conv.agentId)!;
      const lastMessage = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
      
      return { ...conv, agent, lastMessage };
    });
  }

  async getAllUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    return this.getUserConversations(userId);
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.nextId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);
    
    // Update conversation last message time
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = newMessage.createdAt;
      conversation.updatedAt = new Date();
    }
    
    return newMessage;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      conversation.updatedAt = new Date();
    }
  }

  async incrementUnreadCount(conversationId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = (conversation.unreadCount || 0) + 1;
      conversation.updatedAt = new Date();
    }
  }

  // Document operations
  async getAgentDocuments(agentId: number): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.agentId === agentId);
  }

  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.nextId++;
    const newDocument: Document = {
      ...document,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  // Agent stats operations
  async getAgentStats(): Promise<AgentStats[]> {
    return Array.from(this.agentStats.values());
  }

  async updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void> {
    const existing = this.agentStats.get(agentId);
    const updated: AgentStats = {
      id: existing?.id || this.nextId++,
      agentId,
      totalMessages: 0,
      totalUsers: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      satisfactionScore: 0,
      lastUsedAt: null,
      ...existing,
      ...stats,
      updatedAt: new Date()
    };
    this.agentStats.set(agentId, updated);
  }

  // Message reaction operations
  async getMessageReactions(messageId: number): Promise<MessageReaction[]> {
    return Array.from(this.messageReactions.values()).filter(reaction => reaction.messageId === messageId);
  }

  async createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const id = this.nextId++;
    const newReaction: MessageReaction = {
      ...reaction,
      id,
      createdAt: new Date()
    };
    this.messageReactions.set(id, newReaction);
    return newReaction;
  }

  async deleteMessageReaction(messageId: number, userId: string): Promise<void> {
    const toDelete = Array.from(this.messageReactions.entries())
      .find(([_, reaction]) => reaction.messageId === messageId && reaction.userId === userId);
    
    if (toDelete) {
      this.messageReactions.delete(toDelete[0]);
    }
  }

  // Additional methods for admin functionality
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUsersCount(): Promise<number> {
    return this.users.size;
  }

  async getAgentsCount(): Promise<number> {
    return this.agents.size;
  }
}