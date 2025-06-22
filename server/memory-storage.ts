// Temporary file to create clean memory storage implementation
import { User, Agent, Conversation, Message, Document, AgentStats, MessageReaction, UpsertUser, InsertAgent, InsertConversation, InsertMessage, InsertDocument, InsertMessageReaction } from "@shared/schema";
import { IStorage } from "./storage";

export class MemoryStorage implements IStorage {
  private users = new Map<string, User>();
  private agents = new Map<number, Agent>();
  private conversations = new Map<number, Conversation>();
  private messages = new Map<number, Message>();
  private documents = new Map<number, Document>();
  private agentStats = new Map<number, AgentStats>();
  private messageReactions = new Map<number, MessageReaction>();

  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Initialize sample users
    const sampleUsers: User[] = [
      {
        id: "master_admin",
        username: "master_admin",
        password: "$2b$10$hash", // Hashed password
        email: "admin@university.ac.kr",
        firstName: "관리자",
        lastName: "마스터",
        profileImageUrl: null,
        userType: "admin",
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: "student001",
        username: "student001",
        password: "$2b$10$hash",
        email: "student001@university.ac.kr",
        firstName: "김",
        lastName: "학생",
        profileImageUrl: null,
        userType: "student",
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Initialize sample agents
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
        personalityTraits: "친근하고 도움이 되는 성격",
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
        personalityTraits: "정확하고 신뢰할 수 있는 성격",
        prohibitedWordResponse: "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
        llmModel: "gpt-4o",
        chatbotType: "doc-fallback-llm",
        managerId: "master_admin",
        organizationId: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));
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
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    const existingUser = this.users.get(user.id);
    if (existingUser) {
      const updatedUser: User = {
        ...existingUser,
        ...user,
        email: user.email || null,
        firstName: user.firstName || null,
        lastName: user.lastName || null,
        profileImageUrl: user.profileImageUrl || null,
        updatedAt: new Date()
      };
      this.users.set(user.id, updatedUser);
      return updatedUser;
    } else {
      return this.createUser(user);
    }
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const id = this.agents.size + 1;
    const newAgent: Agent = {
      ...agent,
      id,
      isActive: agent.isActive ?? true,
      isCustomIcon: agent.isCustomIcon ?? false,
      managerId: agent.managerId || null,
      organizationId: agent.organizationId || null,
      llmModel: agent.llmModel || "gpt-4o",
      chatbotType: agent.chatbotType || "general-llm",
      speakingStyle: agent.speakingStyle || "친근하고 도움이 되는",
      personalityTraits: agent.personalityTraits || "친근하고 도움이 되는 성격",
      prohibitedWordResponse: agent.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.set(id, newAgent);
    return newAgent;
  }

  async updateAgent(id: number, updates: any): Promise<Agent> {
    const agent = this.agents.get(id);
    if (!agent) {
      throw new Error("Agent not found");
    }
    const updatedAgent: Agent = {
      ...agent,
      ...updates,
      updatedAt: new Date()
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  async getAgentsByManager(managerId: string): Promise<Agent[]> {
    return Array.from(this.agents.values()).filter(agent => agent.managerId === managerId);
  }

  // Conversation operations
  async getOrCreateConversation(userId: string, agentId: number, type?: string): Promise<Conversation> {
    const existing = Array.from(this.conversations.values()).find(
      conv => conv.userId === userId && conv.agentId === agentId && conv.type === (type || "general")
    );
    
    if (existing) {
      return existing;
    }

    const id = this.conversations.size + 1;
    const newConversation: Conversation = {
      id,
      userId,
      agentId,
      type: type || "general",
      unreadCount: 0,
      lastReadAt: null,
      lastMessageAt: new Date(),
      createdAt: new Date()
    };
    this.conversations.set(id, newConversation);
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    const conversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => {
        const aTime = a.lastMessageAt || a.createdAt;
        const bTime = b.lastMessageAt || b.createdAt;
        return (bTime?.getTime() || 0) - (aTime?.getTime() || 0);
      });

    return conversations.map(conv => {
      const agent = this.agents.get(conv.agentId)!;
      const lastMessage = Array.from(this.messages.values())
        .filter(msg => msg.conversationId === conv.id)
        .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0))[0];
      
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
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.messages.size + 1;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);

    // Update conversation last message time
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = new Date();
      this.conversations.set(conversation.id, conversation);
    }

    return newMessage;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      conversation.unreadCount = 0;
      conversation.lastReadAt = new Date();
      this.conversations.set(conversationId, conversation);
    }
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const id = this.documents.size + 1;
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
    return Array.from(this.documents.values()).filter(doc => doc.agentId === agentId);
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
  }

  // Stats operations
  async getAgentStats(agentId: number): Promise<AgentStats | undefined> {
    return this.agentStats.get(agentId) || {
      id: 1,
      agentId,
      activeUsers: 5,
      totalMessages: 150,
      usagePercentage: 75,
      ranking: 1,
      updatedAt: new Date()
    };
  }

  async updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void> {
    const existing = this.agentStats.get(agentId);
    const updated = {
      ...existing,
      ...stats,
      agentId,
      updatedAt: new Date()
    } as AgentStats;
    this.agentStats.set(agentId, updated);
  }

  // Message reaction operations
  async createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    const id = this.messageReactions.size + 1;
    const newReaction: MessageReaction = {
      ...reaction,
      id,
      createdAt: new Date()
    };
    this.messageReactions.set(id, newReaction);
    return newReaction;
  }

  async deleteMessageReaction(messageId: number, userId: string): Promise<void> {
    const reaction = Array.from(this.messageReactions.values())
      .find(r => r.messageId === messageId && r.userId === userId);
    if (reaction) {
      this.messageReactions.delete(reaction.id);
    }
  }

  async getMessageReactions(messageIds: number[]): Promise<{ [messageId: number]: MessageReaction | undefined }> {
    const result: { [messageId: number]: MessageReaction | undefined } = {};
    for (const messageId of messageIds) {
      const reaction = Array.from(this.messageReactions.values())
        .find(r => r.messageId === messageId);
      result[messageId] = reaction;
    }
    return result;
  }
}