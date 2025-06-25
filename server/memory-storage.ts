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
  type OrganizationCategory,
  type InsertOrganizationCategory,
} from "@shared/schema";
import { IStorage } from "./storage";
import { cache } from "./cache";
import * as fs from "fs";
import * as path from "path";

// Temporary in-memory storage to handle database connection issues
export class MemoryStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private agents: Map<number, Agent> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private documents: Map<number, Document> = new Map();
  private agentStats: Map<number, AgentStats> = new Map();
  private messageReactions: Map<number, MessageReaction> = new Map();
  private organizationCategories: Map<number, any> = new Map();
  private nextOrganizationId: number = 1;

  private nextId = 1;
  private readonly persistenceDir = path.join(process.cwd(), 'data');
  private readonly documentsFile = path.join(this.persistenceDir, 'documents.json');

  constructor() {
    this.ensurePersistenceDir();
    this.loadPersistedDocuments();
    this.loadPersistedOrganizationCategories();
    this.initializeDefaultData();

    // Optimize garbage collection
    this.setupPeriodicCleanup();
  }

  private setupPeriodicCleanup() {
    // Clean up old conversations and messages every 30 minutes
    setInterval(() => {
      this.cleanupOldData();
    }, 30 * 60 * 1000);
  }

  private cleanupOldData() {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Remove old conversations without recent activity
    for (const [id, conversation] of this.conversations.entries()) {
      if (conversation.lastMessageAt && conversation.lastMessageAt < thirtyDaysAgo) {
        this.conversations.delete(id);
      }
    }

    // Remove orphaned messages
    const validConversationIds = new Set(this.conversations.keys());
    for (const [id, message] of this.messages.entries()) {
      if (!validConversationIds.has(message.conversationId)) {
        this.messages.delete(id);
      }
    }
  }

  private ensurePersistenceDir() {
    if (!fs.existsSync(this.persistenceDir)) {
      fs.mkdirSync(this.persistenceDir, { recursive: true });
    }
  }

  private loadPersistedDocuments() {
    try {
      if (fs.existsSync(this.documentsFile)) {
        const data = fs.readFileSync(this.documentsFile, 'utf-8');
        const persistedData = JSON.parse(data);

        // Restore documents
        if (persistedData.documents) {
          persistedData.documents.forEach((doc: Document) => {
            // Convert date strings back to Date objects
            if (doc.createdAt) {
              doc.createdAt = new Date(doc.createdAt);
            }
            this.documents.set(doc.id, doc);
          });
        }

        // Update nextId to avoid conflicts
        if (persistedData.nextId) {
          this.nextId = Math.max(this.nextId, persistedData.nextId);
        }

        console.log(`Loaded ${this.documents.size} persisted documents`);

        // Load organization categories separately
        this.loadOrganizationCategoriesFromFile();
      }
    } catch (error) {
      console.error('Error loading persisted documents:', error);
    }
  }

  private savePersistedDocuments() {
    try {
      const data = {
        documents: Array.from(this.documents.values()),
        organizationCategories: Array.from(this.organizationCategories.values()),
        nextId: this.nextId,
        nextOrganizationId: this.nextOrganizationId
      };
      fs.writeFileSync(this.documentsFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving persisted documents:', error);
    }
  }

  private initializeDefaultData() {
    // Create users with pre-hashed passwords (using any type to avoid complex type mismatches)
    const masterAdmin: any = {
      id: "master_admin",
      username: "master_admin",
      firstName: "Master",
      lastName: "Admin",
      password: "$2b$10$e097KpT.lX7HTqlHodUO5.3gIU26TfoFaDbkINPo5egSeY/zf4sb6", // MasterAdmin2024!
      email: "admin@lobo.edu",
      userType: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null,
      name: "Master Admin",
      upperCategory: null,
      lowerCategory: null,
      detailCategory: null,
      role: "admin",
      status: "active",
      passwordHash: null,
      lastLoginAt: null,
      groups: null,
      position: null,
      permissions: null,
      lockedReason: null,
      deactivatedAt: null,
      loginFailCount: 0,
      lastLoginIP: null,
      authProvider: "email",
      termsAcceptedAt: null
    };
    this.users.set("master_admin", masterAdmin);

    // Create demo student account
    const studentUser: any = {
      id: "2024001234",
      username: "2024001234",
      firstName: "김",
      lastName: "학생",
      password: "$2b$10$N8XSxPz/zitNI7exEyKVHuh/AS.CnxoperLS.zOa7UEBmNsUJ7EDO", // student123
      email: "student@lobo.edu",
      userType: "student",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null,
      name: "김학생",
      upperCategory: "로보대학교",
      lowerCategory: "공과대학",
      detailCategory: "컴퓨터공학과",
      role: "user",
      status: "active",
      passwordHash: null,
      lastLoginAt: null,
      groups: null,
      position: null,
      permissions: null,
      lockedReason: null,
      deactivatedAt: null,
      loginFailCount: 0,
      lastLoginIP: null,
      authProvider: "email",
      termsAcceptedAt: null
    };
    this.users.set("2024001234", studentUser);

    // Create demo faculty account
    const facultyUser: any = {
      id: "F2024001",
      username: "F2024001",
      firstName: "이",
      lastName: "교수",
      password: "$2b$10$eYu4kIdi2oqmILaVljmuNOELydq3vW920HbVQhTiiG8xPT5WyiLeO", // faculty123
      email: "faculty@lobo.edu",
      userType: "faculty",
      createdAt: new Date(),
      updatedAt: new Date(),
      profileImageUrl: null,
      name: "이교수",
      upperCategory: "로보대학교",
      lowerCategory: "공과대학",
      detailCategory: "컴퓨터공학과",
      role: "user",
      status: "active",
      passwordHash: null,
      lastLoginAt: null,
      groups: null,
      position: "교수",
      permissions: null,
      lockedReason: null,
      deactivatedAt: null,
      loginFailCount: 0,
      lastLoginIP: null,
      authProvider: "email",
      termsAcceptedAt: null
    };
    this.users.set("F2024001", facultyUser);

    // Create sample agents (simplified to avoid type mismatches)
    const sampleAgents: any[] = [
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
        updatedAt: new Date(),
        creatorId: "master_admin",
        upperCategory: null,
        lowerCategory: null,
        detailCategory: null,
        status: "active",
        visibility: "public",
        maxInputLength: 2048,
        maxResponseLength: 1024,
        responseSpeed: "normal",
        useContext: true,
        contextWindow: 4096,
        temperature: 0.7,
        topP: 1.0,
        frequencyPenalty: 0.0,
        presencePenalty: 0.0,
        modelVersion: "latest",
        customPrompt: null,
        welcomeMessage: null,
        fallbackResponse: null,
        enableFeedback: true,
        feedbackPrompt: null
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
      name: user.name || null,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      userType: user.userType || "student",
      passwordHash: user.passwordHash || null,
      lastLoginAt: user.lastLoginAt || null,
      termsAcceptedAt: user.termsAcceptedAt || null,
      groups: user.groups || [],
      usingAgents: user.usingAgents || [],
      managedCategories: user.managedCategories || [],
      managedAgents: user.managedAgents || [],
      organizationAffiliations: user.organizationAffiliations || [],
      agentPermissions: user.agentPermissions || [],
      userMemo: user.userMemo || null,
      permissions: user.permissions || {},
      position: user.position || null,
      upperCategory: user.upperCategory || null,
      lowerCategory: user.lowerCategory || null,
      detailCategory: user.detailCategory || null,
      position: user.position || null,
      status: user.status || "active",
      role: user.role || "user",
      groups: user.groups || [],
      usingAgents: user.usingAgents || [],
      managedCategories: user.managedCategories || [],
      permissions: user.permissions || {},
      loginFailCount: user.loginFailCount || 0,
      lastLoginIP: user.lastLoginIP || null,
      lockedReason: user.lockedReason || null,
      authProvider: user.authProvider || null,
      deactivatedAt: user.deactivatedAt || null,
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
      name: user.name || null,
      email: user.email || null,
      firstName: user.firstName || null,
      lastName: user.lastName || null,
      profileImageUrl: user.profileImageUrl || null,
      userType: user.userType || "student",
      passwordHash: user.passwordHash || null,
      lastLoginAt: user.lastLoginAt || null,
      termsAcceptedAt: user.termsAcceptedAt || null,
      groups: user.groups || [],
      usingAgents: user.usingAgents || [],
      managedCategories: user.managedCategories || [],
      managedAgents: user.managedAgents || [],
      organizationAffiliations: user.organizationAffiliations || [],
      agentPermissions: user.agentPermissions || [],
      userMemo: user.userMemo || null,
      permissions: user.permissions || {},
      position: user.position || null,
      upperCategory: user.upperCategory || null,
      lowerCategory: user.lowerCategory || null,
      detailCategory: user.detailCategory || null,
      position: user.position || null,
      status: user.status || "active",
      role: user.role || "user",
      groups: user.groups || [],
      usingAgents: user.usingAgents || [],
      managedCategories: user.managedCategories || [],
      permissions: user.permissions || {},
      loginFailCount: user.loginFailCount || 0,
      lastLoginIP: user.lastLoginIP || null,
      lockedReason: user.lockedReason || null,
      authProvider: user.authProvider || null,
      deactivatedAt: user.deactivatedAt || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date()
    };
    this.users.set(user.id, newUser);
    return newUser;
  }

  async updateUser(id: string, updates: any): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      updatedAt: new Date()
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    const cacheKey = 'all_agents';
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const agents = Array.from(this.agents.values());
    cache.set(cacheKey, agents, 2 * 60 * 1000); // Cache for 2 minutes
    return agents;
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
      status: agent.status || "active",
      maxInputLength: agent.maxInputLength || null,
      maxResponseLength: agent.maxResponseLength || null,
      llmModel: agent.llmModel || "gpt-4o",
      chatbotType: agent.chatbotType || "general-llm",
      speakingStyle: agent.speakingStyle || "친근하고 도움이 되는 말투",
      personalityTraits: agent.personalityTraits || "친절하고 전문적인 성격으로 정확한 정보를 제공",
      prohibitedWordResponse: agent.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.",
      upperCategory: agent.upperCategory || null,
      lowerCategory: agent.lowerCategory || null,
      detailCategory: agent.detailCategory || null,
      personaName: agent.personaName || null,
      rolePrompt: agent.rolePrompt || null,
      uploadFormats: agent.uploadFormats || [],
      uploadMethod: agent.uploadMethod || null,
      visibility: agent.visibility || null,
      maxFileCount: agent.maxFileCount || null,
      maxFileSizeMB: agent.maxFileSizeMB || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.agents.set(id, newAgent);

    // Invalidate cache
    cache.delete('all_agents');

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
    const cacheKey = `user_conversations_${userId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const userConversations = Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId && conv.type === "general")
      .sort((a, b) => {
        const aTime = a.lastMessageAt?.getTime() || 0;
        const bTime = b.lastMessageAt?.getTime() || 0;
        return bTime - aTime;
      });

    const result = userConversations.map(conv => {
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

    cache.set(cacheKey, result, 1 * 60 * 1000); // Cache for 1 minute
    return result;
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
    const cacheKey = `conversation_messages_${conversationId}`;
    const cached = cache.get(cacheKey);
    if (cached) return cached;

    const messages = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

    cache.set(cacheKey, messages, 3 * 60 * 1000); // Cache for 3 minutes
    return messages;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const id = this.nextId++;
    const newMessage: Message = {
      ...message,
      id,
      createdAt: new Date()
    };
    this.messages.set(id, newMessage);

    // Update conversation's lastMessageAt  
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = newMessage.createdAt;

      // Invalidate related caches
      cache.delete(`user_conversations_${conversation.userId}`);
      cache.delete(`conversation_messages_${message.conversationId}`);
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
    this.savePersistedDocuments(); // Persist immediately
    console.log(`Document ${id} created and persisted: ${document.originalName}`);
    return newDocument;
  }

  async getAgentDocuments(agentId: number): Promise<Document[]> {
    return Array.from(this.documents.values())
      .filter(doc => doc.agentId === agentId)
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values())
      .sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async deleteDocument(id: number): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      this.documents.delete(id);
      this.savePersistedDocuments(); // Persist immediately
      console.log(`Document ${id} deleted and persisted: ${document.originalName}`);
    }
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

  async getAllUsers(): Promise<User[]> {
    const allUsers = Array.from(this.users.values());
    console.log(`Memory storage getAllUsers: ${allUsers.length} users total`);
    return allUsers;
  }

  async deleteUser(id: string): Promise<void> {
    this.users.delete(id);
  }

  private async savePersistentData(): Promise<void> {
    try {
      const data = {
        users: Array.from(this.users.entries()),
        agents: Array.from(this.agents.entries()),
        conversations: Array.from(this.conversations.entries()),
        messages: Array.from(this.messages.entries()),
        documents: Array.from(this.documents.entries()).map(([id, doc]) => [
          id,
          {
            ...doc,
            createdAt: doc.createdAt.toISOString(),
            updatedAt: doc.updatedAt.toISOString()
          }
        ]),
        agentStats: Array.from(this.agentStats.entries()),
        messageReactions: Array.from(this.messageReactions.entries()),
        nextId: this.nextId
      };

      const dir = path.dirname('./data/memory-storage.json');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync('./data/memory-storage.json', JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save persistent data:', error);
    }
  }

  private loadPersistentData(): void {
    try {
      if (fs.existsSync('./data/memory-storage.json')) {
        const data = JSON.parse(fs.readFileSync('./data/memory-storage.json', 'utf8'));

        this.users = new Map(data.users || []);
        this.agents = new Map(data.agents || []);
        this.conversations = new Map(data.conversations || []);
        this.messages = new Map(data.messages || []);

        const documentsWithDates = (data.documents || []).map(([id, doc]: [number, any]) => [
          id,
          {
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
          }
        ]);
        this.documents = new Map(documentsWithDates);

        this.agentStats = new Map(data.agentStats || []);
        this.messageReactions = new Map(data.messageReactions || []);
        this.nextId = data.nextId || 1;

        if (data.organizationCategories) {
          this.organizationCategories = new Map(data.organizationCategories.map((org: any) => [org.id, {
            ...org,
            createdAt: new Date(org.createdAt),
            updatedAt: new Date(org.updatedAt)
          }]));
          this.nextOrganizationId = Math.max(...data.organizationCategories.map((org: any) => org.id), 0) + 1;
        }

        if (data.nextOrganizationId) {
          this.nextOrganizationId = data.nextOrganizationId;
        }

        console.log(`Loaded ${this.documents.size} persisted documents and ${this.organizationCategories.size} organization categories`);
      }
    } catch (error) {
      console.error('Failed to load persistent data:', error);
    }
  }

  // Organization category management
  async getOrganizationCategories(): Promise<any[]> {
    return Array.from(this.organizationCategories.values());
  }

  async createOrganizationCategory(organization: any): Promise<any> {
    const id = this.nextOrganizationId++;
    const newOrganization = {
      id,
      ...organization,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.organizationCategories.set(id, newOrganization);
    await this.saveOrganizationCategoriesToFile();
    return newOrganization;
  }

  async updateOrganizationCategory(id: number, organization: any): Promise<any> {
    const existingOrganization = this.organizationCategories.get(id);
    if (!existingOrganization) {
      throw new Error(`Organization category with id ${id} not found`);
    }

    const updatedOrganization = {
      ...existingOrganization,
      ...organization,
      updatedAt: new Date()
    };
    this.organizationCategories.set(id, updatedOrganization);
    await this.saveOrganizationCategoriesToFile();
    return updatedOrganization;
  }

  async deleteOrganizationCategory(id: number): Promise<void> {
    this.organizationCategories.delete(id);
    await this.saveOrganizationCategoriesToFile();
  }

  async bulkCreateOrganizationCategories(organizations: any[]): Promise<any[]> {
    const createdOrganizations: any[] = [];
    const uniqueOrgs = new Map<string, any>();

    console.log(`Starting bulk creation of ${organizations.length} organization categories`);
    console.log(`Current organization count before bulk creation: ${this.organizationCategories.size}`);

    // Clear existing data first
    this.organizationCategories.clear();
    this.nextOrganizationId = 1;

    // Deduplicate organizations based on name and hierarchy
    for (const org of organizations) {
      const key = `${org.name || ''}-${org.upperCategory || ''}-${org.lowerCategory || ''}-${org.detailCategory || ''}`;
      if (!uniqueOrgs.has(key)) {
        uniqueOrgs.set(key, org);
      }
    }

    console.log(`Deduplicated from ${organizations.length} to ${uniqueOrgs.size} unique organizations`);

    // Create organizations with proper hierarchy
    for (const org of uniqueOrgs.values()) {
      const id = this.nextOrganizationId++;
      const newOrganization = {
        id,
        name: org.name,
        upperCategory: org.upperCategory || null,
        lowerCategory: org.lowerCategory || null,
        detailCategory: org.detailCategory || null,
        description: org.description || null,
        isActive: org.isActive !== false,
        status: org.status || '활성',
        manager: org.manager || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.organizationCategories.set(id, newOrganization);
      createdOrganizations.push(newOrganization);
      console.log(`Created organization: ${newOrganization.name} (ID: ${id}) - ${newOrganization.upperCategory} > ${newOrganization.lowerCategory} > ${newOrganization.detailCategory}`);
    }

    console.log(`Organization count after bulk creation: ${this.organizationCategories.size}`);
    await this.saveOrganizationCategoriesToFile();
    console.log(`Bulk created ${createdOrganizations.length} unique organization categories and saved to persistence`);
    return createdOrganizations;
  }

  updateOrganizationCategory(id: number, updateData: Partial<OrganizationCategory>): OrganizationCategory | null {
    const existingCategory = this.organizationCategories.get(id);
    if (!existingCategory) {
      return null;
    }

    const updatedCategory: any = {
      ...existingCategory,
      ...updateData,
      updatedAt: new Date()
    };

    this.organizationCategories.set(id, updatedCategory);
    await this.saveOrganizationCategoriesToFile();

    return updatedCategory;
  }

  async deleteAllOrganizationCategories(): Promise<void> {
    console.log('Clearing all organization categories from memory storage');
    this.organizationCategories.clear();
    this.nextOrganizationId = 1;
    await this.saveOrganizationCategoriesToFile();
    console.log('All organization categories have been cleared from memory storage');
  }

  // Method to reload authentic organization data
  async reloadAuthenticOrganizationData(): Promise<void> {
    console.log('Reloading authentic organization data from Excel file');

    // Clear existing data
    this.organizationCategories.clear();
    this.nextOrganizationId = 1;

    // Load the authentic data from the processed file
    this.loadPersistedOrganizationCategories();

    console.log(`Reloaded ${this.organizationCategories.size} authentic organization categories`);
  }

  // Enhanced file persistence for organization categories
  private async saveOrganizationCategoriesToFile(): Promise<void> {
    try {
      const organizationCategoriesFile = path.join(this.persistenceDir, 'organization-categories.json');
      const categoriesArray = Array.from(this.organizationCategories.values()).map(cat => ({
        ...cat,
        createdAt: cat.createdAt?.toISOString(),
        updatedAt: cat.updatedAt?.toISOString()
      }));

      fs.writeFileSync(organizationCategoriesFile, JSON.stringify(categoriesArray, null, 2));
      console.log(`Saved ${categoriesArray.length} organization categories to file`);
    } catch (error) {
      console.error('Failed to save organization categories to file:', error);
    }
  }

  private loadPersistedOrganizationCategories(): void {
    try {
      const organizationCategoriesFile = path.join(this.persistenceDir, 'organization-categories.json');

      if (fs.existsSync(organizationCategoriesFile)) {
        const data = fs.readFileSync(organizationCategoriesFile, 'utf8');
        const categoriesArray = JSON.parse(data);

        for (const cat of categoriesArray) {
          // Fix the incorrect data mapping
          const organizationCategory = {
            ...cat,
            // Correct the data mapping: upperCategory should be actual upper category
            upperCategory: cat.upperCategory || null, // This is actually the upper category
            lowerCategory: cat.lowerCategory || null, // This is actually the lower category  
            detailCategory: cat.detailCategory === '활성' || cat.detailCategory === '비활성' || cat.detailCategory === '등록 승인 대기중' ? null : cat.detailCategory, // Remove status from detailCategory
            status: cat.detailCategory === '활성' || cat.detailCategory === '비활성' || cat.detailCategory === '등록 승인 대기중' ? cat.detailCategory : (cat.status || '활성'),
            name: cat.name && (cat.name === '활성' || cat.name === '비활성' || cat.name === '등록 승인 대기중') ? 
              `${cat.upperCategory || ''} ${cat.lowerCategory || ''}`.trim() : cat.name,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date()
          };
          this.organizationCategories.set(cat.id, organizationCategory);
          this.nextOrganizationId = Math.max(this.nextOrganizationId, cat.id + 1);
        }

        console.log(`Loaded ${this.organizationCategories.size} organization categories from file`);
      } else {
        console.log('No organization categories file found, starting with empty data');
      }
    } catch (error) {
      console.error('Failed to load organization categories from file:', error);
    }
  }

  // Add cache clearing method
  clearCache(): void {
    console.log("Clearing memory storage cache");
    // Clear any cached data if needed
  }

  private async loadOrganizationCategoriesFromFile(): Promise<void> {
    try {
      const organizationCategoriesFile = path.join(this.persistenceDir, 'organization-categories.json');

      if (fs.existsSync(organizationCategoriesFile)) {
        const data = fs.readFileSync(organizationCategoriesFile, 'utf8');
        const categories = JSON.parse(data);

        categories.forEach((cat: any) => {
          this.organizationCategories.set(cat.id, {
            ...cat,
            createdAt: cat.createdAt ? new Date(cat.createdAt) : new Date(),
            updatedAt: cat.updatedAt ? new Date(cat.updatedAt) : new Date()
          });

          if (cat.id >= this.nextOrganizationId) {
            this.nextOrganizationId = cat.id + 1;
          }
        });

        console.log(`Loaded ${categories.length} persisted organization categories`);
      } else {
        console.log('No persisted organization categories found');
      }
    } catch (error) {
      console.error('Failed to load persisted organization categories:', error);
    }
  }
}