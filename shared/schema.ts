import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  username: varchar("username").unique().notNull(), // 학번/교번
  password: varchar("password").notNull(), // 해시된 비밀번호
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  userType: varchar("user_type").notNull().default("student"), // "student" or "faculty"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 학교, 교수, 기능
  icon: text("icon").notNull(),
  backgroundColor: text("background_color").notNull(),
  isActive: boolean("is_active").default(true),
  managerId: varchar("manager_id").references(() => users.id),
  llmModel: varchar("llm_model").notNull().default("gpt-4o"), // OpenAI model
  chatbotType: varchar("chatbot_type").notNull().default("general-llm"), // strict-doc, doc-fallback-llm, general-llm
  // Persona fields
  speakingStyle: text("speaking_style").default("친근하고 도움이 되는 말투"),
  personalityTraits: text("personality_traits").default("친절하고 전문적인 성격으로 정확한 정보를 제공"),
  prohibitedWordResponse: text("prohibited_word_response").default("죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다."),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  type: varchar("type").notNull().default("general"), // "general" or "management"
  unreadCount: integer("unread_count").default(0),
  lastReadAt: timestamp("last_read_at"),
  lastMessageAt: timestamp("last_message_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  isFromUser: boolean("is_from_user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id).notNull(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  content: text("content"), // Extracted text content
  uploadedBy: varchar("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentStats = pgTable("agent_stats", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id).notNull().unique(),
  activeUsers: integer("active_users").default(0),
  totalMessages: integer("total_messages").default(0),
  usagePercentage: integer("usage_percentage").default(0),
  ranking: integer("ranking").default(0),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  managedAgents: many(agents),
  uploadedDocuments: many(documents),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  manager: one(users, {
    fields: [agents.managerId],
    references: [users.id],
  }),
  conversations: many(conversations),
  documents: many(documents),
  stats: one(agentStats, {
    fields: [agents.id],
    references: [agentStats.agentId],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(users, {
    fields: [conversations.userId],
    references: [users.id],
  }),
  agent: one(agents, {
    fields: [conversations.agentId],
    references: [agents.id],
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  agent: one(agents, {
    fields: [documents.agentId],
    references: [agents.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id],
  }),
}));

export const agentStatsRelations = relations(agentStats, ({ one }) => ({
  agent: one(agents, {
    fields: [agentStats.agentId],
    references: [agents.id],
  }),
}));

// Insert schemas
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  lastMessageAt: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AgentStats = typeof agentStats.$inferSelect;
