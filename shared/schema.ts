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
  // 기존 필드들 (호환성 유지)
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
  
  // 1. 기본 정보 (추가)
  name: varchar("name", { length: 50 }), // 사용자 이름
  passwordHash: text("password_hash"), // 암호화된 비밀번호 (별도 필드)
  lastLoginAt: timestamp("last_login_at"), // 마지막 로그인 시각
  
  // 2. 카테고리 및 소속 정보
  upperCategory: varchar("upper_category"), // 상위 카테고리 (예: 단과대학, 본부)
  lowerCategory: varchar("lower_category"), // 하위 카테고리 (예: 학과, 부서)
  detailCategory: varchar("detail_category"), // 세부 카테고리
  groups: jsonb("groups").default(JSON.stringify([])), // 추가 소속 그룹
  
  // 사용 중인 에이전트 목록
  usingAgents: jsonb("using_agents").default(JSON.stringify([])), // 사용자가 현재 사용 중인 에이전트 ID 목록
  
  // 카테고리 운영자 권한
  managedCategories: jsonb("managed_categories").default(JSON.stringify([])), // 카테고리 운영자가 관리하는 카테고리명 목록
  
  // 에이전트/QA/문서 관리자 권한
  managedAgents: jsonb("managed_agents").default(JSON.stringify([])), // 에이전트/QA/문서 관리자가 관리하는 에이전트명 목록
  
  // 3. 역할 및 권한 정보
  role: varchar("role").notNull().default("user"), // 시스템 내 역할 (System Role)
  position: varchar("position"), // 조직 내 직책/역할 (Organization Role/Position)
  permissions: jsonb("permissions"), // 커스텀 권한 세트
  
  // 4. 계정 상태 정보
  status: varchar("status").notNull().default("active"), // 계정 상태
  lockedReason: text("locked_reason"), // 계정 잠금 사유
  deactivatedAt: timestamp("deactivated_at"), // 비활성화된 시각
  
  // 5. 활동 및 인증 정보
  loginFailCount: integer("login_fail_count").default(0), // 연속 로그인 실패 횟수
  lastLoginIP: varchar("last_login_ip"), // 마지막 로그인 IP 주소
  authProvider: varchar("auth_provider").default("email"), // 인증 수단
  termsAcceptedAt: timestamp("terms_accepted_at"), // 이용약관 동의 일시
});

// 조직 구조 테이블
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: varchar("type").notNull(), // "university", "graduate_school", "college", "department"
  parentId: integer("parent_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  
  // 1. 기본 정보 (Basic Info)
  name: varchar("name", { length: 20 }).notNull(),
  description: varchar("description", { length: 200 }).notNull(),
  creatorId: varchar("creator_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  
  // 2. 카테고리 및 상태 정보
  upperCategory: varchar("upper_category").default("전체"), // 상위 카테고리 (예: 단과대학)
  lowerCategory: varchar("lower_category").default("전체"), // 하위 카테고리 (예: 학과)
  detailCategory: varchar("detail_category").default("전체"), // 세부 카테고리
  status: varchar("status").default("active"), // "active", "inactive", "pending"
  
  // 3. 모델 및 응답 설정
  llmModel: varchar("llm_model").notNull().default("gpt-4o"), // 사용 모델
  chatbotType: varchar("chatbot_type").notNull().default("general-llm"), // "strict-doc", "doc-fallback-llm", "general-llm"
  maxInputLength: integer("max_input_length").default(2048), // 최대 입력 길이
  maxResponseLength: integer("max_response_length").default(1024), // 최대 응답 길이
  
  // 4. 역할 및 페르소나 설정
  personaName: varchar("persona_name"), // 페르소나 닉네임
  speakingStyle: text("speaking_style").default("공손하고 친절한 말투"),
  personalityTraits: text("personality_traits").default("친절하고 전문적인 성격으로 정확한 정보를 제공"),
  rolePrompt: text("role_prompt"), // 역할 프롬프트
  prohibitedWordResponse: text("prohibited_word_response").default("죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다."),
  
  // 5. 문서 연결 및 업로드
  uploadFormats: jsonb("upload_formats").default(JSON.stringify(["PDF", "DOCX", "TXT"])), // 업로드 가능한 포맷
  uploadMethod: varchar("upload_method").default("dragdrop"), // "dragdrop", "onedrive"
  maxFileCount: integer("max_file_count").default(100), // 최대 문서 수
  maxFileSizeMB: integer("max_file_size_mb").default(100), // 최대 파일 크기(MB)
  documentManagerIds: jsonb("document_manager_ids").default(JSON.stringify([])), // 문서 업로드/연결 권한자 목록
  
  // 6. 권한 및 접근 설정
  visibility: varchar("visibility").default("private"), // "private", "custom", "group", "organization"
  allowedGroups: jsonb("allowed_groups").default(JSON.stringify([])), // 접근 가능한 사용자 그룹
  agentManagerIds: jsonb("agent_manager_ids").default(JSON.stringify([])), // 에이전트 관리자 목록
  agentEditorIds: jsonb("agent_editor_ids").default(JSON.stringify([])), // 에이전트 편집 가능 사용자 목록
  
  // 기존 UI 관련 필드들 (호환성 유지)
  icon: text("icon").notNull(),
  backgroundColor: text("background_color").notNull(),
  isCustomIcon: boolean("is_custom_icon").default(false),
  
  // 기존 레거시 필드들 (호환성 유지)
  category: text("category").notNull(),
  managerId: varchar("manager_id").references(() => users.id),
  organizationId: integer("organization_id").references(() => organizations.id),
  isActive: boolean("is_active").default(true),
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

export const messageReactions = pgTable("message_reactions", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").references(() => messages.id).notNull(),
  userId: text("user_id").references(() => users.id).notNull(),
  reaction: text("reaction").notNull(), // "👍" or "👎"
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  conversations: many(conversations),
  managedAgents: many(agents),
  uploadedDocuments: many(documents),
}));

export const organizationsRelations = relations(organizations, ({ one, many }) => ({
  parent: one(organizations, {
    fields: [organizations.parentId],
    references: [organizations.id],
    relationName: "parentChild",
  }),
  children: many(organizations, {
    relationName: "parentChild",
  }),
  agents: many(agents),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  manager: one(users, {
    fields: [agents.managerId],
    references: [users.id],
  }),
  organization: one(organizations, {
    fields: [agents.organizationId],
    references: [organizations.id],
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

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  reactions: many(messageReactions),
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

export const messageReactionsRelations = relations(messageReactions, ({ one }) => ({
  message: one(messages, {
    fields: [messageReactions.messageId],
    references: [messages.id],
  }),
  user: one(users, {
    fields: [messageReactions.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // 기본 정보
  name: z.string().min(1, "에이전트 이름은 필수입니다").max(20, "에이전트 이름은 최대 20자입니다"),
  description: z.string().max(200, "설명은 최대 200자입니다"),
  creatorId: z.string().min(1, "생성자 ID는 필수입니다"),
  
  // 카테고리 및 상태
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).optional(),
  
  // 모델 및 응답 설정
  llmModel: z.string().optional(),
  chatbotType: z.enum(["strict-doc", "doc-fallback-llm", "general-llm"]).optional(),
  maxInputLength: z.number().min(1).max(10000).optional(),
  maxResponseLength: z.number().min(1).max(10000).optional(),
  
  // 페르소나 설정
  personaName: z.string().optional(),
  speakingStyle: z.string().optional(),
  personalityTraits: z.string().optional(),
  rolePrompt: z.string().optional(),
  prohibitedWordResponse: z.string().optional(),
  
  // 문서 설정
  uploadFormats: z.array(z.string()).optional(),
  uploadMethod: z.enum(["dragdrop", "onedrive"]).optional(),
  maxFileCount: z.number().min(1).max(1000).optional(),
  maxFileSizeMB: z.number().min(1).max(1000).optional(),
  documentManagerIds: z.array(z.string()).optional(),
  
  // 권한 설정
  visibility: z.enum(["private", "custom", "group", "organization"]).optional(),
  allowedGroups: z.array(z.string()).optional(),
  agentManagerIds: z.array(z.string()).optional(),
  agentEditorIds: z.array(z.string()).optional(),
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

export const insertMessageReactionSchema = createInsertSchema(messageReactions).omit({
  id: true,
  createdAt: true,
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  // 기본 정보
  name: z.string().min(1, "이름은 필수입니다").max(50, "이름은 최대 50자입니다").optional(),
  email: z.string().email("올바른 이메일 형식이어야 합니다").max(100, "이메일은 최대 100자입니다").optional(),
  passwordHash: z.string().optional(),
  
  // 카테고리 및 소속
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  groups: z.array(z.string()).optional(),
  usingAgents: z.array(z.string()).optional(),
  managedCategories: z.array(z.string()).optional(),
  managedAgents: z.array(z.string()).optional(),
  
  // 역할 및 권한
  role: z.enum([
    "master_admin", 
    "operation_admin", 
    "category_admin", 
    "agent_admin", 
    "qa_admin", 
    "doc_admin", 
    "user", 
    "external"
  ]).optional(),
  position: z.string().optional(), // 조직 내 직책 (예: 학과장, 조교, 연구원, 매니저 등)
  permissions: z.record(z.boolean()).optional(),
  
  // 계정 상태
  status: z.enum(["active", "inactive", "locked", "pending", "deleted"]).optional(),
  lockedReason: z.string().optional(),
  
  // 활동 및 인증
  loginFailCount: z.number().min(0).optional(),
  lastLoginIP: z.string().optional(),
  authProvider: z.enum(["email", "sso", "oauth"]).optional(),
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Agent = typeof agents.$inferSelect & {
  managerFirstName?: string | null;
  managerLastName?: string | null;
  managerUsername?: string | null;
  organizationName?: string | null;
  organizationType?: string | null;
  messageCount?: number;
};
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type AgentStats = typeof agentStats.$inferSelect;
export type MessageReaction = typeof messageReactions.$inferSelect;
export type InsertMessageReaction = z.infer<typeof insertMessageReactionSchema>;

// User edit schema for admin interface
export const userEditSchema = z.object({
  name: z.string().min(1, "이름을 입력해주세요"),
  email: z.string().email("올바른 이메일 형식을 입력해주세요").optional(),
  upperCategory: z.string().optional(),
  lowerCategory: z.string().optional(),
  detailCategory: z.string().optional(),
  position: z.string().optional(),
  usingAgents: z.array(z.string()).optional(),
  managedCategories: z.array(z.string()).optional(),
  managedAgents: z.array(z.string()).optional(),
  role: z.enum([
    "master_admin", 
    "operation_admin", 
    "category_admin", 
    "agent_admin", 
    "qa_admin", 
    "doc_admin", 
    "user", 
    "external"
  ]),
  status: z.enum(["active", "inactive", "locked", "pending"]),
});

export type UserEditFormData = z.infer<typeof userEditSchema>;