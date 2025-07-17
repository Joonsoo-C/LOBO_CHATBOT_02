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
  type OrganizationCategory,
  type InsertOrganizationCategory,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { MemoryStorage } from "./memory-storage";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: any): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

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
  getConversation(id: number): Promise<Conversation | undefined>;
  updateConversation(conversationId: number, updates: Partial<Conversation>): Promise<void>;
  deleteConversationWithMessages(userId: string, agentId: number): Promise<void>;

  // Message operations
  getConversationMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markConversationAsRead(conversationId: number): Promise<void>;
  deleteConversationMessages(conversationId: number): Promise<void>;
  hideConversation(conversationId: number): Promise<void>;
  unhideConversation(conversationId: number): Promise<void>;

  // Document operations
  createDocument(document: InsertDocument): Promise<Document>;
  getAgentDocuments(agentId: number): Promise<Document[]>;
  getAgentDocumentsForUser(agentId: number, userId: string): Promise<Document[]>;
  getAllDocuments(): Promise<Document[]>;
  getDocument(id: number): Promise<Document | undefined>;
  updateDocument(id: number, updates: any): Promise<Document | undefined>;
  //delete document operations
  deleteDocument(id: number): Promise<void>;
  updateDocumentContent(id: number, content: string): Promise<Document | null>;
  updateDocumentVisibility(id: number, isVisible: boolean): Promise<Document | undefined>;
  updateDocumentStatus(id: number, isActive: boolean): Promise<Document | undefined>;

  // Stats operations
  getAgentStats(agentId: number): Promise<AgentStats | undefined>;
  updateAgentStats(agentId: number, stats: Partial<AgentStats>): Promise<void>;

  // Message reaction operations
  createMessageReaction(reaction: InsertMessageReaction): Promise<MessageReaction>;
  deleteMessageReaction(messageId: number, userId: string): Promise<void>;
  getMessageReactions(messageIds: number[]): Promise<{ [messageId: number]: MessageReaction | undefined }>;

  // Organization category operations
  getOrganizationCategories(): Promise<any[]>;
  createOrganizationCategory(organization: any): Promise<any>;
  updateOrganizationCategory(id: number, organization: any): Promise<any>;
  deleteOrganizationCategory(id: number): Promise<void>;
  bulkCreateOrganizationCategories(organizations: any[]): Promise<any[]>;
  clearAllOrganizationCategories(): Promise<void>;
  deleteRoboUniversityOrganizations(): Promise<{ deletedCount: number }>;
  clearCache?(): void;

  // User status operations
  getUniqueUserStatuses(): string[];
}

export class DatabaseStorage implements IStorage {
  // User operations
  async updateUser(id: string, updates: any): Promise<User | undefined> {
    const result = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return result[0];
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<void> {
    await db.delete(users).where(eq(users.id, id));
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
      // If conversation exists but is hidden, unhide it
      if (existing.isHidden) {
        await this.unhideConversation(existing.id);
        return { ...existing, isHidden: false };
      }
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
        eq(conversations.type, "general"), // Only show general conversations in the main list
        eq(conversations.isHidden, false) // Only show non-hidden conversations
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

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  }

  async updateConversation(conversationId: number, updates: Partial<Conversation>): Promise<void> {
    await db
      .update(conversations)
      .set(updates)
      .where(eq(conversations.id, conversationId));
  }

  async deleteConversationWithMessages(userId: string, agentId: number): Promise<void> {
    // Find conversations for this user and agent
    const conversationsToDelete = await db
      .select()
      .from(conversations)
      .where(and(
        eq(conversations.userId, userId),
        eq(conversations.agentId, agentId)
      ));

    for (const conversation of conversationsToDelete) {
      // Delete all messages in this conversation
      await db
        .delete(messages)
        .where(eq(messages.conversationId, conversation.id));

      // Delete message reactions for this conversation
      const conversationMessages = await db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.conversationId, conversation.id));
      
      if (conversationMessages.length > 0) {
        const messageIds = conversationMessages.map(m => m.id);
        await db
          .delete(messageReactions)
          .where(inArray(messageReactions.messageId, messageIds));
      }

      // Delete the conversation itself
      await db
        .delete(conversations)
        .where(eq(conversations.id, conversation.id));
    }
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

  async deleteConversationMessages(conversationId: number): Promise<void> {
    // Delete all messages for this conversation
    await db.delete(messages).where(eq(messages.conversationId, conversationId));
    
    // Update conversation to clear last message info
    await db
      .update(conversations)
      .set({ 
        lastMessageAt: null,
        unreadCount: 0
      })
      .where(eq(conversations.id, conversationId));
  }

  async hideConversation(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ isHidden: true })
      .where(eq(conversations.id, conversationId));
  }

  async unhideConversation(conversationId: number): Promise<void> {
    await db
      .update(conversations)
      .set({ isHidden: false })
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

  async getAllDocuments(): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .orderBy(desc(documents.createdAt));
  }

  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async updateDocument(id: number, updates: any): Promise<Document | undefined> {
    try {
      const result = await db
        .update(documents)
        .set(updates)
        .where(eq(documents.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error("Error updating document:", error);
      throw error;
    }
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

  async updateDocumentContent(id: number, content: string): Promise<Document | null> {
    try {
      const result = await db
        .update(documents)
        .set({ content })
        .where(eq(documents.id, id))
        .returning();
      return result[0] || null;
    } catch (error) {
      console.error("Error updating document content:", error);
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

  // Organization category operations - placeholder implementations for DatabaseStorage
  async getOrganizationCategories(): Promise<any[]> {
    // Placeholder - would normally query from organizationCategories table
    return [];
  }

  async createOrganizationCategory(organization: any): Promise<any> {
    // Placeholder - would normally insert into organizationCategories table
    return organization;
  }

  async updateOrganizationCategory(id: number, organization: any): Promise<any> {
    // Placeholder - would normally update organizationCategories table
    return organization;
  }

  async deleteOrganizationCategory(id: number): Promise<void> {
    // Placeholder - would normally delete from organizationCategories table
  }

  async bulkCreateOrganizationCategories(organizations: any[]): Promise<any[]> {
    // Placeholder - would normally bulk insert into organizationCategories table
    return organizations;
  }

  async clearAllOrganizationCategories(): Promise<void> {
    // Placeholder - would normally truncate organizationCategories table
  }

  async deleteRoboUniversityOrganizations(): Promise<{ deletedCount: number }> {
    // Placeholder - would normally delete Robo University organizations from database
    return { deletedCount: 0 };
  }

  getUniqueUserStatuses(): string[] {
    // For database implementation, this would need actual SQL query
    // For now, return default statuses
    return ['활성', '비활성', '등록 승인 대기중', '휴면'];
  }
}

// Use memory storage with enhanced persistence
console.log('Using memory storage due to database connection issue');
export const storage = new MemoryStorage();