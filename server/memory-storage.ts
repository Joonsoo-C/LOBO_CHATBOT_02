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
        speakingStyle: "친근하고 도움이 되는",
        personalityTraits: "친절하고 전문적인 성격으로 정확한 정보를 제공",
        prohibitedWordResponse: "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
        llmModel: "gpt-4o",
        chatbotType: "general-llm",
        managerId: "master_admin",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
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
        speakingStyle: "정확하고 신뢰할 수 있는",
        personalityTraits: "신뢰할 수 있고 정확한 정보를 제공하는 전문적인 성격",
        prohibitedWordResponse: "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
        llmModel: "gpt-4o",
        chatbotType: "doc-fallback-llm",
        managerId: "master_admin",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
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
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      userType: user.userType || "student",
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
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      userType: user.userType || "student",
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
      isCustomIcon: agent.isCustomIcon || false,
      isActive: agent.isActive || true,
      managerId: agent.managerId || null,
      organizationId: agent.organizationId || null,
      llmModel: agent.llmModel || "gpt-4o",
      chatbotType: agent.chatbotType || "general-llm",
      speakingStyle: agent.speakingStyle || "친근하고 도움이 되는 말투",
      personalityTraits: agent.personalityTraits || "친절하고 전문적인 성격으로 정확한 정보를 제공",
      prohibitedWordResponse: agent.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(id: number, updates: any): Promise<Agent> {
    const existingAgent = this.agents.get(id);
    if (!existingAgent) {
      throw new Error("Agent not found");
    }
    const updatedAgent = { ...existingAgent, ...updates, updatedAt: new Date() };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async getAgentsByManager(managerId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.managerId === managerId);
  }

  // Conversation operations
  async getOrCreateConversation(userId: string, agentId: number, type: string = "general"): Promise<Conversation> {
    const existing = Array.from(this.conversations.values()).find(
      conv => conv.userId === userId && conv.agentId === agentId && conv.type === type
    );

    if (existing) {
      return existing;
    }

    const id = this.nextId++;
    const newConversation: Conversation = {
      id,
      userId,
      agentId,
      type,
      unreadCount: 0,
      lastReadAt: null,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId && conv.type === "general")
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

    return userConversations.map(conv => {
      const agent = this.agents.get(conv.agentId);
      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      return {
        ...conv,
        agent: agent!,
        lastMessage: conversationMessages[0]
      };
    });
  }

  async getAllUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

    return userConversations.map(conv => {
      const agent = this.agents.get(conv.agentId);
      const conversationMessages = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
      
      return {
        ...conv,
        agent: agent!,
        lastMessage: conversationMessages[0]
      };
    });
  }

  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.nextId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);

    // Update conversation
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      this.conversations.set(message.conversationId, {
        ...conversation,
        lastMessageAt: new Date(),
        unreadCount: !message.isFromUser ? (conversation.unreadCount || 0) + 1 : conversation.unreadCount
      });
    }

    return newMessage;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      this.conversations.set(conversationId, {
        ...conversation,
        unreadCount: 0,
        lastReadAt: new Date()
      });
    }
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.nextId++;
    const newDocument: Document = {
      ...document,
      id,
      content: document.content || null,
      createdAt: new Date()
    };
    this.documents.set(id, newDocument);
    return newDocument;
  }

  async getAgentDocuments(agentId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.agentId === agentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Stats operations
  async getAgentStats(agentId: number): Promise<AgentStats | undefined> {
    return this.agentStats.get(agentId);
  }

  async updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void> {
    const existing = this.agentStats.get(agentId);
    const newStats: AgentStats = {
      id: existing?.id || this.nextId++,
      agentId,
      activeUsers: stats.activeUsers || 0,
      totalMessages: stats.totalMessages || 0,
      usagePercentage: stats.usagePercentage || 0,
      ranking: stats.ranking || 0,
      updatedAt: new Date()
    };
    this.agentStats.set(agentId, newStats);
  }

  // Message reaction operations
  async createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    // Delete existing reaction first
    await this.deleteMessageReaction(reaction.messageId, reaction.userId);
    
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
    const reactions = Array.from(this.messageReactions.entries());
    for (const [id, reaction] of reactions) {
      if (reaction.messageId === messageId && reaction.userId === userId) {
        this.messageReactions.delete(id);
        break;
      }
    }
  }

  async getMessageReactions(messageIds: number[]): Promise<{ [messageId: number]: MessageReaction | undefined }> {
    const result: { [messageId: number]: MessageReaction | undefined } = {};
    const reactions = Array.from(this.messageReactions.values());
    
    for (const messageId of messageIds) {
      result[messageId] = reactions.find(r => r.messageId === messageId);
    }
    
    return result;
  }
}