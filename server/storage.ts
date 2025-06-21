import {
  users,
  agents,
  conversations,
  messages,
  documents,
  agentStats,
  messageReactions,
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
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

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
  getAllUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]>;
  getAllConversations(): Promise<Conversation[]>;

  // Message operations
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markConversationAsRead(conversationId: number): Promise<void>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getAgentDocuments(agentId: number): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  //delete document operations
  deleteDocument(id: number): Promise<void>;

  // Stats operations
  getAgentStats(agentId: number): Promise<AgentStats | undefined>;
  updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void>;

  // Message reaction operations
  createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  deleteMessageReaction(messageId: number, userId: string): Promise<void>;
  getMessageReactions(messageIds: number[]): Promise<{ [messageId: number]: MessageReaction | undefined }>;

  // Master Admin operations
  getSystemStats(): Promise<any>;
  getAllUsers(): Promise<User[]>;
  getAgentsWithStats(): Promise<any[]>;
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
      .where(and(
        eq(conversations.userId, userId),
        eq(conversations.type, "general") // Only show general conversations in the main list
      ))
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

  async getAllUserConversations(userId: string): Promise<(Conversation & { agent: Agent; lastMessage?: Message })[]> {
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
        const lastMessages = await db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        const lastMessage = lastMessages[0] || undefined;

        return {
          ...conversation,
          agent,
          lastMessage,
        };
      })
    );

    return conversationsWithMessages;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db
      .select()
      .from(conversations)
      .orderBy(desc(conversations.lastMessageAt));
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

    // Update conversation last message time and increment unread count for AI messages
    const updateData: any = { lastMessageAt: new Date() };
    
    // If it's an AI message (not from user), increment unread count
    if (!message.isFromUser) {
      await db
        .update(conversations)
        .set({ 
          lastMessageAt: new Date(),
          unreadCount: sql`unread_count + 1`
        })
        .where(eq(conversations.id, message.conversationId));
    } else {
      await db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, message.conversationId));
    }

    return newMessage;
  }

  async markConversationAsRead(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ 
        unreadCount: 0,
        lastReadAt: new Date()
      })
      .where(eq(conversations.id, conversationId));
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

  async createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction> {
    // First delete any existing reaction from this user for this message
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, reaction.messageId),
        eq(messageReactions.userId, reaction.userId)
      ));

    // Insert the new reaction
    const [result] = await db.insert(messageReactions)
      .values(reaction)
      .returning();
    return result;
  }

  async deleteMessageReaction(messageId: number, userId: string): Promise<void> {
    await db.delete(messageReactions)
      .where(and(
        eq(messageReactions.messageId, messageId),
        eq(messageReactions.userId, userId)
      ));
  }

  async getMessageReactions(messageIds: number[]): Promise<{ [messageId: number]: MessageReaction | undefined }> {
    if (messageIds.length === 0) return {};
    
    const reactions = await db.select()
      .from(messageReactions)
      .where(inArray(messageReactions.messageId, messageIds));

    const result: { [messageId: number]: MessageReaction | undefined } = {};
    reactions.forEach(reaction => {
      result[reaction.messageId] = reaction;
    });
    
    return result;
  }

  // Master Admin operations
  async getSystemStats(): Promise<any> {
    const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const activeUsers = await db.select({ count: sql<number>`count(*)` }).from(users);
    const totalAgents = await db.select({ count: sql<number>`count(*)` }).from(agents);
    const activeAgents = await db.select({ count: sql<number>`count(*)` }).from(agents).where(eq(agents.isActive, true));
    const totalConversations = await db.select({ count: sql<number>`count(*)` }).from(conversations);
    const totalMessages = await db.select({ count: sql<number>`count(*)` }).from(messages);
    
    // Get today's messages
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMessages = await db.select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(sql`${messages.createdAt} >= ${today}`);

    // Calculate weekly growth (placeholder - would need historical data)
    const weeklyGrowth = 15; // Mock data for now

    return {
      totalUsers: totalUsers[0]?.count || 0,
      activeUsers: activeUsers[0]?.count || 0,
      totalAgents: totalAgents[0]?.count || 0,
      activeAgents: activeAgents[0]?.count || 0,
      totalConversations: totalConversations[0]?.count || 0,
      totalMessages: totalMessages[0]?.count || 0,
      todayMessages: todayMessages[0]?.count || 0,
      weeklyGrowth
    };
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async getAgentsWithStats(): Promise<any[]> {
    const agentsData = await db.select().from(agents).orderBy(desc(agents.createdAt));
    
    const agentsWithStats = await Promise.all(agentsData.map(async (agent) => {
      // Get message count for this agent
      const messageCount = await db.select({ count: sql<number>`count(*)` })
        .from(messages)
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.agentId, agent.id));

      // Get average rating (from reactions - assuming positive reactions = good rating)
      const reactions = await db.select({ 
        likes: sql<number>`count(case when ${messageReactions.reaction} = 'like' then 1 end)`,
        dislikes: sql<number>`count(case when ${messageReactions.reaction} = 'dislike' then 1 end)`
      })
        .from(messageReactions)
        .leftJoin(messages, eq(messageReactions.messageId, messages.id))
        .leftJoin(conversations, eq(messages.conversationId, conversations.id))
        .where(eq(conversations.agentId, agent.id));

      const likes = reactions[0]?.likes || 0;
      const dislikes = reactions[0]?.dislikes || 0;
      const totalReactions = likes + dislikes;
      const averageRating = totalReactions > 0 ? (likes / totalReactions) * 5 : undefined;

      return {
        ...agent,
        messageCount: messageCount[0]?.count || 0,
        averageRating
      };
    }));

    return agentsWithStats;
  }
}

export const storage = new DatabaseStorage();