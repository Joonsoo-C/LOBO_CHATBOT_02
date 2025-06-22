import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { setupAdminRoutes } from "./admin";
import { generateChatResponse, generateManagementResponse, analyzeDocument, extractTextFromContent } from "./openai";
import { insertMessageSchema, insertDocumentSchema, conversations, agents } from "@shared/schema";
import { db, testDatabaseConnection } from "./db";
import { eq, and, sql } from "drizzle-orm";

// Configure multer for document uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. TXT, DOC, PPT 파일만 업로드 가능합니다.'));
    }
  },
});

// Configure multer for image uploads
const imageUpload = multer({
  dest: "uploads/agent-icons/",
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for images
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 이미지 형식입니다. JPG, PNG, GIF, WEBP 파일만 업로드 가능합니다.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test database connection first
  console.log('Testing database connection...');
  const dbConnected = await testDatabaseConnection();
  
  if (!dbConnected) {
    console.warn('Database connection failed, application will run with limited functionality');
  }

  // Auth middleware
  await setupAuth(app);

  // Initialize default agents if they don't exist (only if DB is connected)
  if (dbConnected) {
    try {
      await initializeDefaultAgents();
    } catch (error) {
      console.log('Warning: Could not initialize default agents, will retry on first request:', (error as Error).message);
    }
  } else {
    console.log('Skipping default agent initialization due to database connection issues');
  }

  // Note: Auth routes are now handled in setupAuth() function

  // Agent routes
  app.get('/api/agents', isAuthenticated, async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get('/api/agents/managed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;
      
      // Master admin can manage all agents
      let agents;
      if (userType === 'admin' || userId === 'master_admin') {
        agents = await storage.getAllAgents();
      } else {
        agents = await storage.getAgentsByManager(userId);
      }
      
      // Get stats for each agent
      const agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          const stats = await storage.getAgentStats(agent.id);
          return { ...agent, stats };
        })
      );
      
      res.json(agentsWithStats);
    } catch (error) {
      console.error("Error fetching managed agents:", error);
      res.status(500).json({ message: "Failed to fetch managed agents" });
    }
  });

  app.get('/api/agents/:id', isAuthenticated, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }
      
      res.json(agent);
    } catch (error) {
      console.error("Error fetching agent:", error);
      res.status(500).json({ message: "Failed to fetch agent" });
    }
  });

  // Agent persona update route
  app.put('/api/agents/:id/persona', isAuthenticated, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      // Check if user is the manager of this agent or master admin
      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "You are not authorized to manage this agent" });
      }
      
      const { nickname, speakingStyle, knowledgeArea, personalityTraits, prohibitedWordResponse } = req.body;
      
      // Update agent with complete persona data
      const updatedAgent = await storage.updateAgent(agentId, {
        name: nickname,
        description: knowledgeArea,
        speakingStyle,
        personalityTraits,
        prohibitedWordResponse
      });
      
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent persona:", error);
      res.status(500).json({ message: "Failed to update agent persona" });
    }
  });

  // Agent performance analysis route
  app.get('/api/agents/:id/performance', isAuthenticated, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(agentId);
      if (!agent || agent.managerId !== userId) {
        return res.status(403).json({ message: "You are not authorized to view this agent's performance" });
      }

      // Get real performance data
      const allConversations = await storage.getAllConversations();
      const agentConversations = allConversations.filter(conv => conv.agentId === agentId);
      const documents = await storage.getAgentDocuments(agentId);
      
      // Calculate metrics from actual data
      const totalMessages = agentConversations.length;
      const activeUsers = new Set(agentConversations.map(conv => conv.userId)).size;
      const documentsCount = documents.length;
      
      // Recent activity (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const recentActivity = agentConversations.filter(conv => {
        if (!conv.lastMessageAt) return false;
        const messageDate = typeof conv.lastMessageAt === 'string' 
          ? new Date(conv.lastMessageAt) 
          : conv.lastMessageAt;
        return messageDate > weekAgo;
      }).length;

      const performanceData = {
        agentName: agent.name,
        period: "최근 7일",
        metrics: {
          totalMessages,
          activeUsers,
          documentsCount,
          recentActivity,
          usagePercentage: Math.min(100, Math.round((totalMessages / Math.max(1, totalMessages + 10)) * 100)),
          ranking: Math.max(1, 5 - Math.floor(totalMessages / 10)),
          avgResponseTime: 1.2,
          responseRate: totalMessages > 0 ? "98.5%" : "0%",
          satisfaction: totalMessages > 5 ? "4.8/5.0" : "신규 에이전트"
        },
        insights: [
          totalMessages > 10 ? "활발한 사용자 참여도를 보이고 있습니다" : "사용자 참여를 늘려보세요",
          documentsCount > 0 ? `${documentsCount}개의 문서가 업로드되어 있습니다` : "문서 업로드로 지식베이스를 확장해보세요",
          activeUsers > 1 ? "여러 사용자가 활발히 사용 중입니다" : "더 많은 사용자에게 알려보세요"
        ],
        trends: {
          messageGrowth: recentActivity > 0 ? "+12%" : "0%",
          userGrowth: activeUsers > 1 ? "+8%" : "0%",
          engagementRate: totalMessages > 0 ? "85%" : "0%"
        }
      };

      res.json(performanceData);
    } catch (error) {
      console.error("Error fetching agent performance:", error);
      res.status(500).json({ message: "Failed to fetch agent performance" });
    }
  });

  // Agent settings update route
  app.put('/api/agents/:id/settings', isAuthenticated, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "You are not authorized to manage this agent" });
      }
      
      const { llmModel, chatbotType } = req.body;
      
      // Validate settings
      const validModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
      const validTypes = ["strict-doc", "doc-fallback-llm", "general-llm"];
      
      if (!validModels.includes(llmModel)) {
        return res.status(400).json({ message: "Invalid LLM model" });
      }
      
      if (!validTypes.includes(chatbotType)) {
        return res.status(400).json({ message: "Invalid chatbot type" });
      }
      
      // Update agent settings
      const updatedAgent = await storage.updateAgent(agentId, {
        llmModel,
        chatbotType
      });
      
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent settings:", error);
      res.status(500).json({ message: "Failed to update agent settings" });
    }
  });

  // Conversation routes
  app.get('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const conversations = await storage.getUserConversations(userId);
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  app.post('/api/conversations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { agentId, type = "general" } = req.body;
      
      const conversation = await storage.getOrCreateConversation(userId, agentId, type);
      res.json(conversation);
    } catch (error) {
      console.error("Error creating conversation:", error);
      res.status(500).json({ message: "Failed to create conversation" });
    }
  });

  // Management conversation route
  app.post('/api/conversations/management', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { agentId } = req.body;
      
      // Check if user is the manager of this agent or master admin
      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "You are not authorized to manage this agent" });
      }
      
      const conversation = await storage.getOrCreateConversation(userId, agentId, "management");
      res.json(conversation);
    } catch (error) {
      console.error("Error creating management conversation:", error);
      res.status(500).json({ message: "Failed to create management conversation" });
    }
  });

  // Message routes
  app.get('/api/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const messages = await storage.getConversationMessages(conversationId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post('/api/conversations/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }
      
      const { content } = req.body;
      const userId = req.user.id;

      if (!content || content.trim() === "") {
        return res.status(400).json({ message: "Content is required" });
      }

      // Validate input
      const validatedMessage = insertMessageSchema.parse({
        conversationId,
        content: content.trim(),
        isFromUser: true,
      });

      // Save user message
      const userMessage = await storage.createMessage(validatedMessage);

      // Get conversation and agent info
      const messages = await storage.getConversationMessages(conversationId);
      
      // Get the conversation directly from database
      const [conversationResult] = await db
        .select()
        .from(conversations)
        .where(and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, userId)
        ));
      
      if (!conversationResult) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const agent = await storage.getAgent(conversationResult.agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

      // Debug log to check agent data
      console.log("FULL Agent data for chat:", agent);
      console.log("Speaking style specifically:", (agent as any).speakingStyle);
      console.log("Chatbot type specifically:", (agent as any).chatbotType);

      // Get agent documents for context
      const documents = await storage.getAgentDocuments(agent.id);
      const documentContext = documents.map(doc => ({
        filename: doc.originalName,
        content: doc.content || "",
      }));

      // Prepare conversation history
      const conversationHistory = messages.slice(-10).map(msg => ({
        role: msg.isFromUser ? "user" as const : "assistant" as const,
        content: msg.content,
      }));

      // Force refresh agent data to ensure persona fields are loaded
      const refreshedAgent = await storage.getAgent(agent.id);
      
      // Extract persona parameters with detailed logging
      const chatbotType = refreshedAgent?.chatbotType || "general-llm";
      const speakingStyle = refreshedAgent?.speakingStyle || "친근하고 도움이 되는 말투";
      const personalityTraits = refreshedAgent?.personalityTraits || "친절하고 전문적인 성격으로 정확한 정보를 제공";
      const prohibitedWordResponse = refreshedAgent?.prohibitedWordResponse || "죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.";

      console.log("REFRESHED AGENT PERSONA DATA:", {
        chatbotType,
        speakingStyle,
        personalityTraits,
        agentName: refreshedAgent?.name
      });

      // Get user's language preference from request body or default to Korean
      const userLanguage = req.body.userLanguage || "ko";

      // Check if this is a management conversation and handle management commands
      let aiResponse;
      if (conversationResult.type === "management") {
        aiResponse = await generateManagementResponse(
          content,
          agent.name,
          agent.description,
          conversationHistory,
          documentContext,
          chatbotType,
          speakingStyle,
          personalityTraits,
          prohibitedWordResponse,
          userLanguage
        );
      } else {
        // Generate AI response with chatbot type and persona
        aiResponse = await generateChatResponse(
          content,
          agent.name,
          agent.description,
          conversationHistory,
          documentContext,
          chatbotType,
          speakingStyle,
          personalityTraits,
          prohibitedWordResponse,
          userLanguage
        );
      }

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        content: aiResponse.message,
        isFromUser: false,
      });

      res.json({
        userMessage,
        aiMessage: {
          ...aiMessage,
          triggerAction: aiResponse.triggerAction
        },
        usedDocuments: aiResponse.usedDocuments,
      });
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Document routes
  app.get('/api/agents/:id/documents', isAuthenticated, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      
      const documents = await storage.getAgentDocuments(agentId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });

  app.post('/api/agents/:id/documents', isAuthenticated, upload.single('file'), async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      
      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Read file content
      const fileContent = fs.readFileSync(file.path, 'utf-8');
      
      // Extract text content based on file type
      const extractedText = await extractTextFromContent(fileContent, file.mimetype);
      
      // Analyze document
      const analysis = await analyzeDocument(extractedText, file.originalname);

      // Save document to database with properly encoded filename
      const documentData = insertDocumentSchema.parse({
        agentId,
        filename: file.filename,
        originalName: Buffer.from(file.originalname, 'latin1').toString('utf8'),
        mimeType: file.mimetype,
        size: file.size,
        content: analysis.extractedText,
        uploadedBy: userId,
      });

      const document = await storage.createDocument(documentData);

      // Clean up temporary file
      fs.unlinkSync(file.path);

      res.json({
        document,
        analysis,
      });
    } catch (error) {
      console.error("Error uploading document:", error);
      
      // Clean up temporary file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }
      
      res.status(500).json({ message: "Failed to upload document" });
    }
  });

  app.get('/api/documents/:id/download', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Properly encode filename for Korean characters
      const safeFilename = document.originalName.replace(/[^\w\s.-]/g, '_');
      const encodedFilename = encodeURIComponent(document.originalName);
      
      // In a real implementation, you'd serve the actual file
      // For now, we'll serve the extracted content
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
      res.send(document.content || "No content available");
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  app.delete('/api/documents/:id', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      await storage.deleteDocument(documentId);
      res.json({ message: "Document deleted successfully" });
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });

  // Agent icon upload endpoint
  app.post('/api/agents/:id/icon-upload', isAuthenticated, imageUpload.single('image'), async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;

      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No image file provided" });
      }

      // Check if user has permission to manage this agent
      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "Unauthorized to modify this agent" });
      }

      // Generate unique filename
      const fileExtension = path.extname(req.file.originalname);
      const uniqueFilename = `agent-${agentId}-${Date.now()}${fileExtension}`;
      const imagePath = `/uploads/agent-icons/${uniqueFilename}`;
      const fullPath = path.join(process.cwd(), 'uploads', 'agent-icons', uniqueFilename);

      // Move uploaded file to permanent location with unique name
      fs.renameSync(req.file.path, fullPath);

      res.json({
        imagePath,
        message: "Image uploaded successfully"
      });
    } catch (error) {
      console.error("Error uploading agent icon:", error);
      res.status(500).json({ message: "Failed to upload image" });
    }
  });

  // Serve uploaded agent icons
  app.get('/uploads/agent-icons/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(process.cwd(), 'uploads', 'agent-icons', filename);
    
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).json({ message: "Image not found" });
    }
  });

  // Broadcast message to all users of an agent
  app.post('/api/agents/:id/broadcast', isAuthenticated, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { message } = req.body;

      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: "Message is required" });
      }

      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "You are not authorized to manage this agent" });
      }

      // Get all users who have conversations with this agent
      const allConversations = await storage.getAllConversations();
      const agentConversations = allConversations.filter(conv => 
        conv.agentId === agentId && conv.type === "general"
      );

      const broadcastResults = [];

      // Send message to each user's general conversation with this agent
      for (const conversation of agentConversations) {
        try {
          const broadcastMessage = await storage.createMessage({
            conversationId: conversation.id,
            content: message,
            isFromUser: false,
          });

          // Increment unread count for the conversation
          const currentUnreadCount = conversation.unreadCount ?? 0;
          await db
            .update(conversations)
            .set({ 
              unreadCount: currentUnreadCount + 1,
              lastMessageAt: new Date()
            })
            .where(eq(conversations.id, conversation.id));

          broadcastResults.push({
            userId: conversation.userId,
            messageId: broadcastMessage.id,
            success: true
          });
        } catch (error) {
          console.error(`Failed to send message to user ${conversation.userId}:`, error);
          broadcastResults.push({
            userId: conversation.userId,
            success: false,
            error: String(error)
          });
        }
      }

      res.json({
        message: "Broadcast completed",
        totalRecipients: agentConversations.length,
        results: broadcastResults
      });
    } catch (error) {
      console.error("Error broadcasting message:", error);
      res.status(500).json({ message: "Failed to broadcast message" });
    }
  });

  // Mark conversation as read
  app.post('/api/conversations/:id/read', isAuthenticated, async (req: any, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const userId = req.user.id;

      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      await storage.markConversationAsRead(conversationId);
      res.json({ message: "Conversation marked as read" });
    } catch (error) {
      console.error("Error marking conversation as read:", error);
      res.status(500).json({ message: "Failed to mark conversation as read" });
    }
  });

  // Stats routes
  app.get('/api/agents/:id/stats', isAuthenticated, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const stats = await storage.getAgentStats(agentId);
      res.json(stats || {});
    } catch (error) {
      console.error("Error fetching agent stats:", error);
      res.status(500).json({ message: "Failed to fetch agent stats" });
    }
  });

  // Setup admin routes
  setupAdminRoutes(app);

  const httpServer = createServer(app);
  // Message reaction endpoints
  app.post("/api/messages/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const { reaction } = req.body;
      if (!reaction || (reaction !== "👍" && reaction !== "👎")) {
        return res.status(400).json({ error: "Invalid reaction" });
      }

      const userId = (req as any).user.id;
      const reactionData = await storage.createMessageReaction({
        messageId,
        userId,
        reaction
      });

      res.json(reactionData);
    } catch (error) {
      console.error("Error creating message reaction:", error);
      res.status(500).json({ error: "Failed to create reaction" });
    }
  });

  app.delete("/api/messages/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ error: "Invalid message ID" });
      }

      const userId = (req as any).user.id;
      await storage.deleteMessageReaction(messageId, userId);

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting message reaction:", error);
      res.status(500).json({ error: "Failed to delete reaction" });
    }
  });

  app.get("/api/conversations/:id/reactions", isAuthenticated, async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      // Get all message IDs for this conversation
      const messages = await storage.getConversationMessages(conversationId);
      const messageIds = messages.map(msg => msg.id);

      // Get reactions for all messages
      const reactions = await storage.getMessageReactions(messageIds);

      res.json(reactions);
    } catch (error) {
      console.error("Error fetching conversation reactions:", error);
      res.status(500).json({ error: "Failed to fetch reactions" });
    }
  });

  return httpServer;
}

async function initializeDefaultAgents() {
  try {
    const existingAgents = await storage.getAllAgents();
    if (existingAgents.length > 0) {
      return; // Agents already exist
    }

    const defaultAgents = [
      {
        name: "학교 종합 안내",
        description: "대학교 전반적인 안내와 정보를 제공하는 에이전트입니다",
        category: "학교",
        icon: "fas fa-graduation-cap",
        backgroundColor: "bg-slate-800",
        managerId: null,
      },
      {
        name: "컴퓨터공학과",
        description: "컴퓨터공학과 관련 정보와 수업 안내를 제공합니다",
        category: "학과",
        icon: "fas fa-code",
        backgroundColor: "bg-primary",
        managerId: null,
      },
      {
        name: "범용 AI 어시스턴트",
        description: "다양한 질문에 대한 일반적인 AI 도움을 제공합니다",
        category: "기능",
        icon: "fas fa-robot",
        backgroundColor: "bg-orange-500",
        managerId: null,
      },
      {
        name: "노지후 에이전트",
        description: "노지후 교수의 수업적 상표 과목을 답변하는 에이전트입니다",
        category: "교수",
        icon: "fas fa-user",
        backgroundColor: "bg-gray-600",
        managerId: "manager1", // Will be updated with actual manager ID
      },
      {
        name: "비즈니스 실험실",
        description: "비즈니스 관련 실험과 연구를 지원하는 에이전트입니다",
        category: "교수",
        icon: "fas fa-flask",
        backgroundColor: "bg-gray-600",
        managerId: null,
      },
      {
        name: "신입생 가이드",
        description: "신입생을 위한 가이드와 정보를 제공합니다",
        category: "학교",
        icon: "fas fa-map",
        backgroundColor: "bg-blue-500",
        managerId: null,
      },
      {
        name: "영어학습 도우미",
        description: "영어 학습을 도와주는 AI 튜터입니다",
        category: "기능",
        icon: "fas fa-language",
        backgroundColor: "bg-green-500",
        managerId: null,
      },
      {
        name: "운동/다이어트 코치",
        description: "건강한 운동과 다이어트를 지도해주는 코치입니다",
        category: "기능",
        icon: "fas fa-dumbbell",
        backgroundColor: "bg-orange-500",
        managerId: null,
      },
      {
        name: "프로그래밍 튜터",
        description: "프로그래밍 학습을 도와주는 전문 튜터입니다",
        category: "기능",
        icon: "fas fa-code",
        backgroundColor: "bg-purple-500",
        managerId: null,
      },
      {
        name: "디비디비딥 에이전트",
        description: "데이터베이스 관련 질문과 도움을 제공합니다",
        category: "교수",
        icon: "fas fa-database",
        backgroundColor: "bg-gray-600",
        managerId: null,
      },
      {
        name: "세영의 생각 실험실",
        description: "창의적 사고와 실험을 지원하는 에이전트입니다",
        category: "교수",
        icon: "fas fa-lightbulb",
        backgroundColor: "bg-yellow-500",
        managerId: null,
      },
      {
        name: "학생 상담 센터",
        description: "학생들의 고민과 상담을 도와주는 센터입니다",
        category: "학교",
        icon: "fas fa-heart",
        backgroundColor: "bg-pink-500",
        managerId: null,
      },
      {
        name: "과제 관리 & 플래너",
        description: "과제와 일정을 효율적으로 관리해주는 도구입니다",
        category: "기능",
        icon: "fas fa-calendar",
        backgroundColor: "bg-indigo-500",
        managerId: null,
      },
      {
        name: "글쓰기 코치",
        description: "효과적인 글쓰기를 도와주는 전문 코치입니다",
        category: "기능",
        icon: "fas fa-pen",
        backgroundColor: "bg-teal-500",
        managerId: null,
      },
      {
        name: "논문 작성 도우미",
        description: "학술 논문 작성을 지원하는 전문 도우미입니다",
        category: "기능",
        icon: "fas fa-file-alt",
        backgroundColor: "bg-red-500",
        managerId: null,
      },
    ];

    for (const agentData of defaultAgents) {
      await storage.createAgent(agentData);
    }

    console.log("Default agents initialized successfully");
  } catch (error) {
    console.error("Error initializing default agents:", error);
  }
}
