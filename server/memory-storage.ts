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
  type QaLog,
  type InsertQaLog,
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
  private qaLogs: Map<number, QaLog> = new Map();
  private messageReactions: Map<number, MessageReaction> = new Map();
  private organizationCategories: Map<number, any> = new Map();
  private organizationFiles: Map<string, any> = new Map();
  private userFiles: Map<string, any> = new Map();
  
  private nextId = 1;
  private nextUserId = 1;
  private nextAgentId = 1;
  private nextConversationId = 1;
  private nextMessageId = 1;
  private nextDocumentId = 1;
  private nextOrganizationId = 1;
  
  private readonly persistenceDir = path.join(process.cwd(), 'data');
  private readonly documentsFile = path.join(this.persistenceDir, 'documents.json');
  private readonly organizationFilesFile = path.join(this.persistenceDir, 'organization-files.json');
  private readonly userFilesFile = path.join(this.persistenceDir, 'user-files.json');
  private readonly usersFile = path.join(this.persistenceDir, 'memory-storage.json');
  private readonly agentsFile = path.join(this.persistenceDir, 'memory-storage-agents.json');
  private readonly conversationsFile = path.join(this.persistenceDir, 'conversations.json');
  private readonly messagesFile = path.join(this.persistenceDir, 'messages.json');
  private readonly organizationCategoriesFile = path.join(this.persistenceDir, 'organization-categories.json');

  constructor() {
    // Initialize maps (already declared above)
    // Initialize IDs (already declared above)

    // Create data directory if it doesn't exist
    if (!fs.existsSync(this.persistenceDir)) {
      fs.mkdirSync(this.persistenceDir, { recursive: true });
    }

    // Load persisted data from admin center managed files
    this.loadUsersFromAdminCenter();
    this.loadAgentsFromAdminCenter();
    this.loadOrganizationCategoriesFromAdminCenter();
    this.loadPersistedDocuments();
    this.loadPersistedConversations();
    this.loadPersistedMessages();
    this.loadPersistedQALogs();
    this.loadPersistedOrganizationFiles();
    this.loadPersistedUserFiles();

    console.log(`Memory storage initialized with ${this.users.size} users, ${this.agents.size} agents, and ${this.organizationCategories.size} organization categories`);
    // Skip default data initialization - use admin center data only

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

  async loadNewAgentData() {
    try {
      const fs = await import('fs');
      const agentDataPath = './new_agents.json';

      if (fs.existsSync(agentDataPath)) {
        console.log('새 에이전트 데이터 로드 중...');

        const agentData = JSON.parse(fs.readFileSync(agentDataPath, 'utf8'));

        // 기존 에이전트 모두 삭제
        this.agents.clear();

        // 새 에이전트 추가
        let loadedCount = 0;
        for (const agent of agentData) {
          const newAgent: any = {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            creatorId: 'master_admin',
            icon: agent.icon || 'Bot',
            backgroundColor: agent.backgroundColor || '#3B82F6',
            category: agent.category || '기능',
            isActive: true,
            status: 'active',
            managerId: agent.managerId || 'prof001',
            organizationId: agent.organizationId || 1,
            visibility: 'public',
            maxInputLength: 1000,
            llmModel: 'gpt-4o',
            chatbotType: 'general-llm',
            speakingStyle: '친근하고 도움이 되는 말투',
            personalityTraits: '친절하고 전문적인 성격으로 정확한 정보를 제공',
            documentManagerIds: [],
            agentEditorIds: [],
            isCustomIcon: false,
            maxResponseLength: null,
            prohibitedWordResponse: '죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.',
            upperCategory: null,
            lowerCategory: null,
            detailCategory: null,
            personaName: null,
            rolePrompt: null,
            uploadFormats: [],
            uploadMethod: null,
            maxFileCount: null,
            maxFileSizeMB: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          this.agents.set(agent.id, newAgent);
          loadedCount++;
        }

        console.log(`✅ ${loadedCount}개의 새 에이전트가 로드되었습니다.`);
        this.nextId = Math.max(this.nextId, loadedCount + 1);
      }
    } catch (error) {
      console.error('새 에이전트 데이터 로드 오류:', error);
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

  async createUser(userData: UpsertUser): Promise<User> {
    const user: User = {
      id: userData.id,
      username: userData.username,
      email: userData.email || null,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      name: userData.name || null,
      role: userData.role || "user",
      status: userData.status || "active",
      userType: userData.userType || "student",
      position: userData.position || null,
      upperCategory: userData.upperCategory || null,
      lowerCategory: userData.lowerCategory || null,
      detailCategory: userData.detailCategory || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: userData.lastLoginAt || null,
      profileImageUrl: userData.profileImageUrl || null,
      passwordHash: userData.passwordHash || "",
      password: userData.password || "",
      groups: userData.groups || [],
      usingAgents: userData.usingAgents || [],
      managedCategories: userData.managedCategories || [],
      managedAgents: userData.managedAgents || [],
      organizationAffiliations: userData.organizationAffiliations || [],
      agentPermissions: userData.agentPermissions || [],
      userMemo: userData.userMemo || null,
      permissions: userData.permissions || {},
      lockedReason: userData.lockedReason || null,
      deactivatedAt: userData.deactivatedAt || null,
      loginFailCount: 0,
      lastLoginIP: userData.lastLoginIP || null,
      authProvider: userData.authProvider || "email",
      termsAcceptedAt: userData.termsAcceptedAt || null
    };

    this.users.set(user.id, user);
    this.savePersistedUsers(); // Auto-save after creating user
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id);

    const user: User = {
      ...existingUser,
      id: userData.id,
      username: userData.username,
      email: userData.email || existingUser?.email || null,
      firstName: userData.firstName || existingUser?.firstName || "",
      lastName: userData.lastName || existingUser?.lastName || "",
      name: userData.name || existingUser?.name || null,
      role: userData.role || existingUser?.role || "user",
      status: userData.status || existingUser?.status || "active",
      userType: userData.userType || existingUser?.userType || "student",
      position: userData.position || existingUser?.position || null,
      upperCategory: userData.upperCategory || existingUser?.upperCategory || null,
      lowerCategory: userData.lowerCategory || existingUser?.lowerCategory || null,
      detailCategory: userData.detailCategory || existingUser?.detailCategory || null,
      createdAt: existingUser?.createdAt || new Date(),
      updatedAt: new Date(),
      lastLoginAt: userData.lastLoginAt || existingUser?.lastLoginAt || null,
      profileImageUrl: userData.profileImageUrl || existingUser?.profileImageUrl || null,
      passwordHash: userData.passwordHash || existingUser?.passwordHash || "",
      password: userData.password || existingUser?.password || "",
      groups: userData.groups || existingUser?.groups || [],
      usingAgents: userData.usingAgents || existingUser?.usingAgents || [],
      managedCategories: userData.managedCategories || existingUser?.managedCategories || [],
      managedAgents: userData.managedAgents || existingUser?.managedAgents || [],
      organizationAffiliations: userData.organizationAffiliations || existingUser?.organizationAffiliations || [],
      agentPermissions: userData.agentPermissions || existingUser?.agentPermissions || [],
      userMemo: userData.userMemo || existingUser?.userMemo || null,
      permissions: userData.permissions || existingUser?.permissions || {},
      lockedReason: userData.lockedReason || existingUser?.lockedReason || null,
      deactivatedAt: userData.deactivatedAt || existingUser?.deactivatedAt || null,
      loginFailCount: userData.loginFailCount !== undefined ? userData.loginFailCount : (existingUser?.loginFailCount || 0),
      lastLoginIP: userData.lastLoginIP || existingUser?.lastLoginIP || null,
      authProvider: userData.authProvider || existingUser?.authProvider || "email",
      termsAcceptedAt: userData.termsAcceptedAt || existingUser?.termsAcceptedAt || null
    };

    this.users.set(user.id, user);
    this.savePersistedUsers(); // Auto-save after upserting user
    return user;
  }

  async updateUser(id: string, updates: any): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: new Date(),
    };

    this.users.set(id, updatedUser);
    this.savePersistedUsers(); // Auto-save after updating user
    return updatedUser;
  }

  async clearAllUsers(): Promise<{ deletedCount: number; deletedUsers: string[] }> {
    const deletedUsers: string[] = [];
    let deletedCount = 0;

    // 마스터 관리자 계정은 보존
    for (const [id, user] of this.users.entries()) {
      if (id !== 'master_admin') {
        deletedUsers.push(`${user.name || user.username} (ID: ${id})`);
        this.users.delete(id);
        deletedCount++;
      }
    }

    // 변경사항 저장
    this.savePersistedUsers();

    console.log(`🗑️ ${deletedCount}개의 사용자가 삭제되었습니다 (master_admin 제외):`);
    deletedUsers.forEach(userName => console.log(`   - ${userName}`));

    return { deletedCount, deletedUsers };
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

  async clearAllAgents(): Promise<void> {
    this.agents.clear();
    cache.delete('all_agents');
  }

  async deleteRoboUniversityAgents(): Promise<{ deletedCount: number; deletedAgents: string[] }> {
    const deletedAgents: string[] = [];
    let deletedCount = 0;

    // 로보대학교 관련 에이전트 찾기 및 삭제 (이름 또는 설명에 포함된 경우)
    console.log(`현재 에이전트 수: ${this.agents.size}`);
    
    // Map을 배열로 변환하여 안전하게 순회
    const agentsToDelete: number[] = [];
    
    this.agents.forEach((agent, id) => {
      console.log(`검사 중: ${agent.name} (ID: ${id})`);
      if ((agent.name && agent.name.includes('로보대학교')) || 
          (agent.description && agent.description.includes('로보대학교'))) {
        console.log(`삭제 대상 발견: ${agent.name}`);
        agentsToDelete.push(id);
        deletedAgents.push(`${agent.name} (ID: ${id})`);
      }
    });
    
    // 실제 삭제 수행
    for (const agentId of agentsToDelete) {
      this.agents.delete(agentId);
      deletedCount++;
    }
    
    console.log(`🗑️ ${deletedCount}개의 로보대학교 에이전트가 삭제되었습니다:`);
    deletedAgents.forEach(agentName => console.log(`   - ${agentName}`));

    return { deletedCount, deletedAgents };
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
    
    // Invalidate cache
    cache.delete('all_agents');
    
    // Save to persistent storage immediately
    this.savePersistedAgents();
    
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
    
    // Save to persistent storage
    this.savePersistedConversations();
    
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

  async updateConversation(conversationId: number, updates: Partial<Conversation>): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }

    // Update the conversation with the provided updates
    const updatedConversation = {
      ...conversation,
      ...updates
    };

    this.conversations.set(conversationId, updatedConversation);
    
    // Clear cache
    cache.delete(`user_conversations_${conversation.userId}`);
    cache.delete(`conversation_${conversationId}`);
    
    // Save to persistent storage
    this.savePersistentData();
    this.savePersistedConversations();
    this.savePersistedMessages();
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    // Always fetch fresh data for management conversations to ensure persistence
    const messages = Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));

    console.log(`Loading messages for conversation ${conversationId}: found ${messages.length} messages`);
    return messages;
  }

  async getAllMessages(): Promise<Message[]> {
    return Array.from(this.messages.values())
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

    // Update conversation's lastMessageAt  
    const conversation = this.conversations.get(message.conversationId);
    if (conversation) {
      conversation.lastMessageAt = newMessage.createdAt;

      // Invalidate related caches
      cache.delete(`user_conversations_${conversation.userId}`);
      cache.delete(`conversation_messages_${message.conversationId}`);
    }

    // Save to persistent storage
    this.savePersistedMessages();
    this.savePersistedConversations();

    return newMessage;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    const conversation = this.conversations.get(conversationId);
    if (conversation) {
      const updatedConversation = {
        ...conversation,
        unreadCount: 0,
        lastReadAt: new Date()
      };
      this.conversations.set(conversationId, updatedConversation);
      
      // Clear cache and save to persistent storage
      cache.delete(`user_conversations_${conversation.userId}`);
      cache.delete(`conversation_${conversationId}`);
      this.savePersistedConversations();
      
      console.log(`Marked conversation ${conversationId} as read and persisted`);
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
      manager: organization.manager !== undefined ? organization.manager : existingOrganization.manager,
      updatedAt: new Date()
    };

    this.organizationCategories.set(id, updatedOrganization);
    console.log(`Updated organization category ${id}:`, updatedOrganization);

    await this.saveOrganizationCategoriesToFile();
    return updatedOrganization;
  }

  async deleteOrganizationCategory(id: number): Promise<void> {
    this.organizationCategories.delete(id);
    await this.saveOrganizationCategoriesToFile();
  }

  async bulkCreateOrganizationCategories(organizations: any[], shouldOverwrite: boolean = false): Promise<any[]> {
    const createdOrganizations: any[] = [];
    const updatedOrganizations: any[] = [];
    const uniqueOrgs = new Map<string, any>();

    console.log(`Starting bulk creation of ${organizations.length} organization categories`);
    console.log(`Current organization count before bulk creation: ${this.organizationCategories.size}`);
    console.log(`Overwrite mode: ${shouldOverwrite}`);

    // Only clear existing data if explicitly requested to overwrite
    if (shouldOverwrite) {
      console.log('Overwrite mode: Clearing existing organization categories');
      this.organizationCategories.clear();
      this.nextOrganizationId = 1;
    }

    // Deduplicate organizations based on name and hierarchy
    for (const org of organizations) {
      const key = `${org.name || ''}-${org.upperCategory || ''}-${org.lowerCategory || ''}-${org.detailCategory || ''}`;
      if (!uniqueOrgs.has(key)) {
        uniqueOrgs.set(key, org);
      }
    }

    console.log(`Deduplicated from ${organizations.length} to ${uniqueOrgs.size} unique organizations`);

    // Process organizations - merge or create
    for (const org of uniqueOrgs.values()) {
      // Check if organization already exists by matching name and hierarchy
      const existingOrg = this.findExistingOrganization(org.name, org.upperCategory, org.lowerCategory, org.detailCategory);

      if (existingOrg && !shouldOverwrite) {
        // Merge mode: Update existing organization while preserving critical data
        console.log(`Merging existing organization: ${existingOrg.name} (ID: ${existingOrg.id})`);

        const updatedOrganization = {
          ...existingOrg, // Preserve existing data including connections
          // Only update non-critical fields if they have new values
          description: org.description || existingOrg.description,
          status: org.status || existingOrg.status,
          isActive: org.isActive !== undefined ? org.isActive : existingOrg.isActive,
          updatedAt: new Date()
          // Preserve: id, name, hierarchy, manager, createdAt, and any other connected data
        };

        this.organizationCategories.set(existingOrg.id, updatedOrganization);
        updatedOrganizations.push(updatedOrganization);

      } else {
        // Create new organization
        const id = shouldOverwrite ? this.nextOrganizationId++ : Math.max(...Array.from(this.organizationCategories.keys()), this.nextOrganizationId - 1) + 1;
        this.nextOrganizationId = Math.max(this.nextOrganizationId, id + 1);

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
    }

    console.log(`Organization count after bulk operation: ${this.organizationCategories.size}`);
    console.log(`Created: ${createdOrganizations.length}, Updated: ${updatedOrganizations.length}`);
    await this.saveOrganizationCategoriesToFile();

    const totalProcessed = [...createdOrganizations, ...updatedOrganizations];
    console.log(`Bulk processed ${totalProcessed.length} organization categories and saved to persistence`);
    return totalProcessed;
  }



  async deleteAllOrganizationCategories(): Promise<void> {
    console.log('Clearing all organization categories from memory storage');
    this.organizationCategories.clear();
    this.nextOrganizationId = 1;
    await this.saveOrganizationCategoriesToFile();
    console.log('All organization categories have been cleared from memory storage');
  }

  // Get unique user status values from stored users
  getUniqueUserStatuses(): string[] {
    const statuses = new Set<string>();
    
    for (const user of this.users.values()) {
      if (user.status && user.status.trim() !== '') {
        statuses.add(user.status.trim());
      }
    }
    
    return Array.from(statuses).sort();
  }

  // Helper method to find existing organization by name and hierarchy
  private findExistingOrganization(name: string, upperCategory?: string, lowerCategory?: string, detailCategory?: string): any | null {
    for (const org of this.organizationCategories.values()) {
      // Match by name and full hierarchy
      if (org.name === name && 
          org.upperCategory === (upperCategory || null) &&
          org.lowerCategory === (lowerCategory || null) &&
          org.detailCategory === (detailCategory || null)) {
        return org;
      }
    }
    return null;
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

  // Organization file management methods
  async saveOrganizationFileRecord(fileRecord: any): Promise<void> {
    this.organizationFiles.set(fileRecord.fileName, fileRecord);
    this.savePersistedOrganizationFiles();
  }

  async getOrganizationFiles(): Promise<any[]> {
    return Array.from(this.organizationFiles.values());
  }

  async deleteOrganizationFile(fileName: string): Promise<boolean> {
    const deleted = this.organizationFiles.delete(fileName);
    if (deleted) {
      this.savePersistedOrganizationFiles();
    }
    return deleted;
  }

  private savePersistedOrganizationFiles(): void {
    try {
      const organizationFilesFile = path.join(this.persistenceDir, 'organization-files.json');
      const filesArray = Array.from(this.organizationFiles.values()).map(file => ({
        ...file,
        uploadedAt: file.uploadedAt?.toISOString ? file.uploadedAt.toISOString() : file.uploadedAt
      }));

      fs.writeFileSync(organizationFilesFile, JSON.stringify(filesArray, null, 2));
      console.log(`Saved ${filesArray.length} organization files to persistence`);
    } catch (error) {
      console.error('Failed to save organization files to file:', error);
    }
  }

  private loadPersistedOrganizationFiles(): void {
    try {
      const organizationFilesFile = path.join(this.persistenceDir, 'organization-files.json');

      if (fs.existsSync(organizationFilesFile)) {
        const data = fs.readFileSync(organizationFilesFile, 'utf8');
        const filesArray = JSON.parse(data);

        for (const file of filesArray) {
          const fileRecord = {
            ...file,
            uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : new Date()
          };
          this.organizationFiles.set(file.fileName, fileRecord);
        }

        console.log(`Loaded ${this.organizationFiles.size} organization files from persistence`);
      } else {
        console.log('No organization files found, starting with empty data');
      }
    } catch (error) {
      console.error('Failed to load organization files from persistence:', error);
    }
  }

  // User file management methods
  async saveUserFile(fileInfo: any): Promise<void> {
    this.userFiles.set(fileInfo.id, {
      ...fileInfo,
      uploadedAt: new Date(fileInfo.uploadedAt)
    });
    this.savePersistedUserFiles();
  }

  async getUserFiles(): Promise<any[]> {
    return Array.from(this.userFiles.values());
  }

  async deleteUserFile(fileId: string): Promise<void> {
    this.userFiles.delete(fileId);
    this.savePersistedUserFiles();
  }

  private savePersistedUserFiles(): void {
    try {
      const userFilesArray = Array.from(this.userFiles.values()).map(file => ({
        ...file,
        uploadedAt: file.uploadedAt?.toISOString()
      }));

      fs.writeFileSync(this.userFilesFile, JSON.stringify(userFilesArray, null, 2));
      console.log(`Saved ${userFilesArray.length} user files to persistence`);
    } catch (error) {
      console.error('Failed to save user files to persistence:', error);
    }
  }

  private loadPersistedUserFiles(): void {
    try {
      if (fs.existsSync(this.userFilesFile)) {
        const data = fs.readFileSync(this.userFilesFile, 'utf8');
        const userFilesArray = JSON.parse(data);

        for (const file of userFilesArray) {
          this.userFiles.set(file.id, {
            ...file,
            uploadedAt: file.uploadedAt ? new Date(file.uploadedAt) : new Date()
          });
        }

        console.log(`Loaded ${this.userFiles.size} user files from persistence`);
      } else {
        console.log('No user files found, starting with empty data');
      }
    } catch (error) {
      console.error('Failed to load user files from persistence:', error);
    }
  }

  private loadUsersFromAdminCenter(): void {
    try {
      if (fs.existsSync(this.usersFile)) {
        const data = fs.readFileSync(this.usersFile, 'utf8');
        const parsedData = JSON.parse(data);
        
        // 새로운 구조: {users: [...], qaLogs: [...], ...}
        const usersArray = parsedData.users || parsedData;
        
        if (Array.isArray(usersArray)) {
          for (const user of usersArray) {
            this.users.set(user.id, {
              ...user,
              createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
              updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
            });
          }
        }

        console.log(`Loaded ${this.users.size} users from admin center (memory-storage.json)`);
      } else {
        console.log('No admin center users file found, starting with empty data');
      }
    } catch (error) {
      console.error('Error loading users from admin center:', error);
    }
  }

  private loadAgentsFromAdminCenter(): void {
    try {
      if (fs.existsSync(this.agentsFile)) {
        const data = fs.readFileSync(this.agentsFile, 'utf8');
        const agentsData = JSON.parse(data);

        // Handle both array and object formats
        let agentsArray;
        if (Array.isArray(agentsData)) {
          agentsArray = agentsData;
        } else if (typeof agentsData === 'object' && agentsData !== null) {
          // Convert object format to array
          agentsArray = Object.values(agentsData);
        } else {
          console.log('Invalid agents data format, starting with empty data');
          return;
        }

        for (const agent of agentsArray) {
          this.agents.set(agent.id, {
            ...agent,
            createdAt: agent.createdAt ? new Date(agent.createdAt) : new Date(),
            updatedAt: agent.updatedAt ? new Date(agent.updatedAt) : new Date()
          });
          this.nextAgentId = Math.max(this.nextAgentId, agent.id + 1);
        }

        console.log(`Loaded ${this.agents.size} agents from admin center (memory-storage-agents.json)`);
      } else {
        console.log('No admin center agents file found, starting with empty data');
      }
    } catch (error) {
      console.error('Error loading agents from admin center:', error);
    }
  }

  private loadOrganizationCategoriesFromAdminCenter(): void {
    try {
      if (fs.existsSync(this.organizationCategoriesFile)) {
        const data = fs.readFileSync(this.organizationCategoriesFile, 'utf8');
        const categoriesArray = JSON.parse(data);

        for (const category of categoriesArray) {
          this.organizationCategories.set(category.id, {
            ...category,
            createdAt: category.createdAt ? new Date(category.createdAt) : new Date(),
            updatedAt: category.updatedAt ? new Date(category.updatedAt) : new Date()
          });
          this.nextOrganizationId = Math.max(this.nextOrganizationId, category.id + 1);
        }

        console.log(`Loaded ${this.organizationCategories.size} organization categories from admin center (organization-categories.json)`);
      } else {
        console.log('No admin center organization categories file found, starting with empty data');
      }
    } catch (error) {
      console.error('Error loading organization categories from admin center:', error);
    }
  }

   private async savePersistedUsers(): Promise<void> {
    try {
      const usersFile = path.join(this.persistenceDir, 'users.json');
      const usersArray = Array.from(this.users.values()).map(user => ({
        ...user,
        createdAt: user.createdAt?.toISOString(),
        updatedAt: user.updatedAt?.toISOString()
      }));

      fs.writeFileSync(usersFile, JSON.stringify(usersArray, null, 2));
      console.log(`Saved ${usersArray.length} users to persistence`);
    } catch (error) {
      console.error('Failed to save users to persistence:', error);
    }
  }
  // Add cache clearing method
  clearCache(): void {
    console.log("Clearing memory storage cache");
    // Clear any cached data if needed
  }

  private loadPersistedConversations(): void {
    try {
      if (fs.existsSync(this.conversationsFile)) {
        const data = JSON.parse(fs.readFileSync(this.conversationsFile, 'utf8'));
        const conversationsWithDates = (data.conversations || []).map(([id, conv]: [number, any]) => [
          id,
          {
            ...conv,
            createdAt: conv.createdAt ? new Date(conv.createdAt) : null,
            lastReadAt: conv.lastReadAt ? new Date(conv.lastReadAt) : null,
            lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : null
          }
        ]);
        this.conversations = new Map(conversationsWithDates);
        console.log(`Loaded ${this.conversations.size} conversations from persistence`);
      }
    } catch (error) {
      console.error('Failed to load persisted conversations:', error);
      this.conversations = new Map();
    }
  }

  private loadPersistedMessages(): void {
    try {
      if (fs.existsSync(this.messagesFile)) {
        const data = JSON.parse(fs.readFileSync(this.messagesFile, 'utf8'));
        const messagesWithDates = (data.messages || []).map(([id, msg]: [number, any]) => [
          id,
          {
            ...msg,
            createdAt: msg.createdAt ? new Date(msg.createdAt) : null
          }
        ]);
        this.messages = new Map(messagesWithDates);
        console.log(`Loaded ${this.messages.size} messages from persistence`);
      }
    } catch (error) {
      console.error('Failed to load persisted messages:', error);
      this.messages = new Map();
    }
  }

  private loadPersistedQALogs(): void {
    try {
      // Q&A 로그는 메인 memory-storage.json 파일에서 로드
      if (fs.existsSync(this.usersFile)) {
        const data = JSON.parse(fs.readFileSync(this.usersFile, 'utf8'));
        if (data.qaLogs && Array.isArray(data.qaLogs)) {
          // QA 로그 데이터를 Map으로 변환하고 Date 객체 복원
          const qaLogsWithDates = data.qaLogs.map((log: any) => [
            log.id,
            {
              ...log,
              timestamp: new Date(log.timestamp),
              createdAt: log.createdAt ? new Date(log.createdAt) : new Date(),
              updatedAt: log.updatedAt ? new Date(log.updatedAt) : new Date()
            }
          ]);
          this.qaLogs = new Map(qaLogsWithDates);
          console.log(`Loaded ${this.qaLogs.size} Q&A logs from persistence`);
        }
      }
    } catch (error) {
      console.error('Failed to load persisted Q&A logs:', error);
      this.qaLogs = new Map();
    }
  }

  private savePersistedConversations(): void {
    try {
      const conversationsData = {
        conversations: Array.from(this.conversations.entries()).map(([id, conv]) => [
          id,
          {
            ...conv,
            createdAt: conv.createdAt?.toISOString(),
            lastReadAt: conv.lastReadAt?.toISOString(),
            lastMessageAt: conv.lastMessageAt?.toISOString()
          }
        ])
      };

      fs.writeFileSync(this.conversationsFile, JSON.stringify(conversationsData, null, 2));
    } catch (error) {
      console.error('Failed to save conversations to persistence:', error);
    }
  }

  private savePersistedMessages(): void {
    try {
      const messagesData = {
        messages: Array.from(this.messages.entries()).map(([id, msg]) => [
          id,
          {
            ...msg,
            createdAt: msg.createdAt?.toISOString()
          }
        ])
      };

      fs.writeFileSync(this.messagesFile, JSON.stringify(messagesData, null, 2));
    } catch (error) {
      console.error('Failed to save messages to persistence:', error);
    }
  }

  private savePersistedAgents(): void {
    try {
      const agentsData = {
        agents: Array.from(this.agents.entries()).map(([id, agent]) => [
          id,
          {
            ...agent,
            createdAt: agent.createdAt?.toISOString(),
            updatedAt: agent.updatedAt?.toISOString()
          }
        ])
      };

      fs.writeFileSync(this.agentsFile, JSON.stringify(agentsData, null, 2));
      console.log('✓ Agent data saved to persistence');
    } catch (error) {
      console.error('Failed to save agents to persistence:', error);
    }
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

  async deleteAgentsByOrganization(organizationName: string): Promise<number> {
    const initialCount = this.agents.size;
    const agentsToDelete: number[] = [];

    for (const [agentId, agent] of this.agents.entries()) {
      const hasOrgAffiliation =
        agent.upperCategory === organizationName ||
        agent.lowerCategory === organizationName ||
        (agent as any).organizationName === organizationName;

      if (hasOrgAffiliation) {
        agentsToDelete.push(agentId);
      }
    }

    agentsToDelete.forEach(agentId => this.agents.delete(agentId));

    const deletedCount = agentsToDelete.length;

    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} agents with ${organizationName} affiliation`);
      cache.delete('all_agents'); // Invalidate agent cache
    }

    return deletedCount;
  }

  async deleteRoboUniversityOrganizations(): Promise<{ deletedCount: number }> {
    const organizationsToDelete: number[] = [];
    
    for (const [orgId, org] of this.organizationCategories.entries()) {
      const hasRoboAffiliation =
        org.upperCategory === "로보대학교" ||
        org.lowerCategory === "로보대학교" ||
        org.detailCategory === "로보대학교" ||
        org.name === "로보대학교" ||
        (org.name && org.name.includes("로보대학교")) ||
        (org.upperCategory && org.upperCategory.includes("로보대학교")) ||
        (org.lowerCategory && org.lowerCategory.includes("로보대학교")) ||
        (org.detailCategory && org.detailCategory.includes("로보대학교"));

      if (hasRoboAffiliation) {
        organizationsToDelete.push(orgId);
      }
    }

    organizationsToDelete.forEach(orgId => this.organizationCategories.delete(orgId));

    const deletedCount = organizationsToDelete.length;

    if (deletedCount > 0) {
      console.log(`🗑️ Deleted ${deletedCount} organization categories with 로보대학교 affiliation`);
      // Save to persistence file
      this.saveOrganizationCategoriesToFile();
      // Clear cache
      if (cache) {
        cache.delete('all_organizations');
        cache.delete('organization_categories');
      }
    }

    return { deletedCount };
  }

  async clearAllOrganizationCategories(): Promise<void> {
    this.organizationCategories.clear();
    this.nextOrganizationId = 1;
    console.log('All organization categories cleared from memory storage');
    
    // Save the cleared state to persistence
    this.saveOrganizationCategoriesToFile();
    
    // Clear cache
    if (cache) {
      cache.delete('all_organizations');
      cache.delete('organization_categories');
    }
  }

  // QA Logs Methods
  async getQaLogs(): Promise<QaLog[]> {
    const logs = Array.from(this.qaLogs.values());
    return logs.sort((a, b) => {
      const aTime = a.timestamp?.getTime() || 0;
      const bTime = b.timestamp?.getTime() || 0;
      return bTime - aTime; // 최신순 정렬
    });
  }

  async getQaLogById(id: number): Promise<QaLog | undefined> {
    return this.qaLogs.get(id);
  }

  async createQaLog(data: InsertQaLog): Promise<QaLog> {
    const id = this.nextQaLogId++;
    const qaLog: QaLog = {
      id,
      timestamp: data.timestamp,
      agentType: data.agentType,
      agentName: data.agentName,
      userType: data.userType,
      questionContent: data.questionContent,
      responseContent: data.responseContent,
      responseType: data.responseType,
      responseTime: data.responseTime,
      agentId: data.agentId || null,
      userId: data.userId || null,
      improvementRequest: data.improvementRequest || null,
      createdAt: new Date(),
    };
    
    this.qaLogs.set(id, qaLog);
    
    // Clear cache
    if (cache) {
      cache.delete('qa_logs');
    }
    
    return qaLog;
  }

  async updateQaLog(id: number, data: Partial<InsertQaLog>): Promise<QaLog | undefined> {
    const existing = this.qaLogs.get(id);
    if (!existing) return undefined;

    const updated: QaLog = {
      ...existing,
      ...data,
    };

    this.qaLogs.set(id, updated);

    // Clear cache
    if (cache) {
      cache.delete('qa_logs');
    }

    // Save to persistence
    this.saveToPersistence();

    return updated;
  }

  async deleteQaLog(id: number): Promise<boolean> {
    const deleted = this.qaLogs.delete(id);
    
    if (deleted && cache) {
      cache.delete('qa_logs');
    }
    
    return deleted;
  }

  async clearAllQALogs(): Promise<void> {
    this.qaLogs.clear();
    console.log('All QA logs cleared from memory storage');
    
    // Clear cache
    if (cache) {
      cache.delete('qa_logs');
    }
  }

  async clearAllQaLogs(): Promise<void> {
    this.qaLogs.clear();
    console.log('All QA logs cleared from memory storage');
    
    // Clear cache
    if (cache) {
      cache.delete('qa_logs');
    }
  }

  private nextQaLogId = 1;
}