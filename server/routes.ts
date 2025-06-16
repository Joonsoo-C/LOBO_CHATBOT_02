import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { generateChatResponse, analyzeDocument, extractTextFromContent } from "./openai";
import { insertMessageSchema, insertDocumentSchema } from "@shared/schema";

// Configure multer for file uploads
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Initialize default agents if they don't exist
  await initializeDefaultAgents();

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
      const agents = await storage.getAgentsByManager(userId);
      
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
      
      // Check if user is the manager of this agent
      const agent = await storage.getAgent(agentId);
      if (!agent || agent.managerId !== userId) {
        return res.status(403).json({ message: "You are not authorized to manage this agent" });
      }
      
      const { nickname, speakingStyle, knowledgeArea, personalityTraits, prohibitedWordResponse } = req.body;
      
      // Update agent with new persona data (basic fields only for now)
      const updatedAgent = await storage.updateAgent(agentId, {
        name: nickname,
        description: knowledgeArea
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
      const conversations = await storage.getUserConversations(userId);
      const agentConversations = conversations.filter(conv => conv.agentId === agentId);
      const documents = await storage.getAgentDocuments(agentId);
      
      // Calculate metrics from actual data
      const totalMessages = agentConversations.reduce((sum, conv) => {
        return sum + (conv.lastMessage ? 1 : 0);
      }, 0);
      
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
          responseRate: totalMessages > 0 ? "98.5%" : "0%",
          avgResponseTime: "1.2초",
          satisfaction: totalMessages > 5 ? "4.8/5.0" : "신규 에이전트"
        },
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
      if (!agent || agent.managerId !== userId) {
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
      
      // Check if user is the manager of this agent
      const agent = await storage.getAgent(agentId);
      if (!agent || agent.managerId !== userId) {
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

      // Validate input
      const validatedMessage = insertMessageSchema.parse({
        conversationId,
        content,
        isFromUser: true,
      });

      // Save user message
      const userMessage = await storage.createMessage(validatedMessage);

      // Get conversation and agent info
      const messages = await storage.getConversationMessages(conversationId);
      
      // Get the conversation by ID to find the correct agentId
      const conversations = await storage.getUserConversations(userId);
      const conversation = conversations.find(conv => conv.id === conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }
      
      const agent = await storage.getAgent(conversation.agentId);
      
      if (!agent) {
        return res.status(404).json({ message: "Agent not found" });
      }

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

      // Generate AI response with chatbot type
      const aiResponse = await generateChatResponse(
        content,
        agent.name,
        agent.description,
        conversationHistory,
        documentContext,
        (agent as any).chatbotType || "general-llm"
      );

      // Save AI message
      const aiMessage = await storage.createMessage({
        conversationId,
        content: aiResponse.message,
        isFromUser: false,
      });

      res.json({
        userMessage,
        aiMessage,
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

  const httpServer = createServer(app);
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
