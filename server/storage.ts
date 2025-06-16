import {
  users,
  agents,
  conversations,
  messages,
  documents,
  agentStats,
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
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Agent operations
  getAllAgents(): Promise<Agent[]>;
  getAgent(id: number): Promise<Agent | undefined>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: any): Promise<Agent>;
  getAgentsByManager(managerId: string): Promise<Agent[]>;

  // Conversation operations
  getOrCreateConversation(userId: string, agentId: number, type?: string): Promise<Conversation>;
  getUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]>;

  // Message operations
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getAgentDocuments(agentId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  //delete document operations
  deleteDocument(id: number): Promise<void>;

  // Stats operations
  getAgentStats(agentId: number): Promise<AgentStats | undefined>;
  updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Agent operations
  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.isActive, true));
  }

  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent;
  }

  async createAgent(agent: InsertAgent): Promise<Agent> {
    const [newAgent] = await db.insert(agents).values(agent).returning();
    return newAgent;
  }

  async updateAgent(id: number, updates: any): Promise<Agent> {
    const [updatedAgent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
      .returning();
    return updatedAgent;
  }

  async getAgentsByManager(managerId: string): Promise<Agent[]> {
    return await db.select().from(agents).where(eq(agents.managerId, managerId));
  }

  // Conversation operations
  async getOrCreateConversation(userId: string, agentId: number, type: string = "general"): Promise<Conversation> {
    const [existing] = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.userId, userId), 
        eq(conversations.agentId, agentId),
        eq(conversations.type, type)
      ));

    if (existing) {
      return existing;
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({ userId, agentId, type })
      .returning();
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
    const result = await db
      .select({
        conversation: conversations,
        agent: agents,
      })
      .from(conversations)
      .innerJoin(agents, eq(conversations.agentId, agents.id))
      .where(eq(conversations.userId, userId))
      .orderBy(desc(conversations.lastMessageAt));

    // Get last message for each conversation
    const conversationsWithMessages = await Promise.all(
      result.map(async ({ conversation, agent }) => {
        const [lastMessage] = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        return {
          ...conversation,
          agent,
          lastMessage,
        };
      })
    );

    return conversationsWithMessages;
  }

  // Message operations
  async getConversationMessages(conversationId: number): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();

    // Update conversation last message time
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
  }

  // Document operations
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async getAgentDocuments(agentId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.agentId, agentId))
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async deleteDocument(id: number): Promise<void> {
    try {
      await db
        .delete(documents)
        .where(eq(documents.id, id));
    } catch (error) {
      console.error("Error deleting document:", error);
      throw error;
    }
  }

  // Stats operations
  async getAgentStats(agentId: number): Promise<AgentStats | undefined> {
    const [stats] = await db.select().from(agentStats).where(eq(agentStats.agentId, agentId));
    return stats;
  }

  async updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void> {
    await db
      .insert(agentStats)
      .values({ agentId, ...stats })
      .onConflictDoUpdate({
        target: agentStats.agentId,
        set: { ...stats, updatedAt: new Date() },
      });
  }
}

export const storage = new DatabaseStorage();