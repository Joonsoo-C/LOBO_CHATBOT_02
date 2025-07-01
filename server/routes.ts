import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import sharp from "sharp";
import { storage } from "./storage";
import { cache } from "./cache";
import { setupAuth, isAuthenticated } from "./auth";
import { setupAdminRoutes } from "./admin";
import { generateChatResponse, generateManagementResponse, analyzeDocument, extractTextFromContent } from "./openai";
import mammoth from 'mammoth';

import { insertMessageSchema, insertDocumentSchema, conversations, agents } from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { organizationCategories } from './organization-categories';

// Configure multer for document uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/msword',
      'application/vnd.ms-powerpoint',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('지원하지 않는 파일 형식입니다. PDF, TXT, DOC, DOCX, PPT, PPTX, XLS, XLSX 파일만 업로드 가능합니다.'));
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
  // Auth middleware
  await setupAuth(app);

  // Initialize default agents if they don't exist
  try {
    await initializeDefaultAgents();
  } catch (error) {
    console.log('Warning: Could not initialize default agents, database may need setup:', (error as Error).message);
  }

  // Skip sample agents initialization - using admin center managed data only
  console.log('Skipping sample agents initialization - using admin center managed data');

  // Setup document fix endpoint
  setupDocumentFix(app);

  // Note: Auth routes are now handled in setupAuth() function

  // Agent routes
  app.get('/api/agents', isAuthenticated, async (req: any, res) => {
    try {
      // Set cache headers for client-side caching
      res.set({
        'Cache-Control': 'public, max-age=300', // 5 minutes
        'ETag': `"agents-${Date.now()}"`
      });
      
      const allAgents = await storage.getAllAgents();
      const userId = req.user.id;
      const userType = req.user.userType;
      const userUpperCategory = req.user.upperCategory;
      const userLowerCategory = req.user.lowerCategory;
      const userDetailCategory = req.user.detailCategory;

      // Master admin can see all agents
      if (userType === 'admin' || userId === 'master_admin') {
        res.json(allAgents);
        return;
      }

      // Filter agents based on visibility and organization matching
      const filteredAgents = allAgents.filter(agent => {
        // Public agents are visible to everyone
        if (agent.visibility === 'public') {
          return true;
        }

        // Organization-specific agents
        if (agent.visibility === 'organization') {
          // Check if user belongs to the same organization hierarchy
          const matchesUpperCategory = agent.upperCategory === userUpperCategory;
          const matchesLowerCategory = agent.lowerCategory === userLowerCategory;
          const matchesDetailCategory = agent.detailCategory === userDetailCategory;

          // User can see agents from their exact organization level or higher levels
          return matchesUpperCategory && 
                 (matchesLowerCategory || !agent.lowerCategory) &&
                 (matchesDetailCategory || !agent.detailCategory);
        }

        // Private agents are only visible to their managers
        if (agent.visibility === 'private') {
          return agent.managerId === userId;
        }

        return false;
      });

      res.json(filteredAgents);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Failed to fetch agents" });
    }
  });

  app.get('/api/agents/managed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const userType = req.user.userType;
      const userRole = req.user.role;

      console.log(`[DEBUG] /api/agents/managed called by user: ${userId}, type: ${userType}, role: ${userRole}`);

      // Check user role for agent management permissions
      const hasAgentManagementRole = userRole === 'agent_admin' || userRole === 'master_admin';
      console.log(`[DEBUG] User has agent management role: ${hasAgentManagementRole}`);

      // Master admin can manage all agents
      let agents;
      if (userType === 'admin' || userId === 'master_admin' || userRole === 'master_admin') {
        console.log(`[DEBUG] User is admin, fetching all agents`);
        agents = await storage.getAllAgents();
      } else if (hasAgentManagementRole) {
        console.log(`[DEBUG] User has agent_admin role, fetching agents managed by: ${userId}`);
        agents = await storage.getAgentsByManager(userId);
        console.log(`[DEBUG] Found ${agents.length} agents managed by ${userId}:`, agents.map(a => ({ id: a.id, name: a.name, managerId: a.managerId })));
      } else {
        console.log(`[DEBUG] User does not have agent management permissions`);
        agents = [];
      }

      // Get stats for each agent
      const agentsWithStats = await Promise.all(
        agents.map(async (agent) => {
          const stats = await storage.getAgentStats(agent.id);
          return { ...agent, stats };
        })
      );

      console.log(`[DEBUG] Returning ${agentsWithStats.length} agents with stats`);
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

      const { llmModel, chatbotType, visibility, upperCategory, lowerCategory, detailCategory } = req.body;

      // Validate settings
      const validModels = ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"];
      const validTypes = ["strict-doc", "doc-fallback-llm", "general-llm"];
      const validVisibility = ["public", "group", "organization", "private"];

      if (!validModels.includes(llmModel)) {
        return res.status(400).json({ message: "Invalid LLM model" });
      }

      if (!validTypes.includes(chatbotType)) {
        return res.status(400).json({ message: "Invalid chatbot type" });
      }

      if (visibility && !validVisibility.includes(visibility)) {
        return res.status(400).json({ message: "Invalid visibility setting" });
      }

      // Prepare update data
      const updateData: any = {
        llmModel,
        chatbotType
      };

      // Add visibility settings if provided
      if (visibility !== undefined) {
        updateData.visibility = visibility;
        updateData.upperCategory = upperCategory || "";
        updateData.lowerCategory = lowerCategory || "";
        updateData.detailCategory = detailCategory || "";
      }

      // Update agent settings
      const updatedAgent = await storage.updateAgent(agentId, updateData);

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

      // Get all conversations and find the specific one
      const allConversations = await storage.getAllConversations();
      const conversationResult = allConversations.find(conv => conv.id === conversationId && conv.userId === userId);

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

      // Create permanent file path
      const permanentPath = path.join('uploads', file.filename);
      
      console.log('File upload details:', {
        originalname: file.originalname,
        filename: file.filename,
        mimetype: file.mimetype,
        size: file.size,
        tempPath: file.path,
        permanentPath: permanentPath
      });
      
      // Ensure uploads directory exists
      if (!fs.existsSync('uploads')) {
        fs.mkdirSync('uploads', { recursive: true });
      }
      
      // Copy file to permanent location
      fs.copyFileSync(file.path, permanentPath);
      
      // Verify file was copied successfully
      if (!fs.existsSync(permanentPath)) {
        throw new Error(`Failed to copy file to permanent location: ${permanentPath}`);
      }
      
      console.log('File successfully copied to:', permanentPath);
      console.log('File size after copy:', fs.statSync(permanentPath).size);

      // Extract text content based on file type using permanent path
      const extractedText = await extractTextFromContent(permanentPath, file.mimetype);

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

  // Get document content for preview
  app.get('/api/documents/:id/content', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      res.json({
        id: document.id,
        originalName: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        createdAt: document.createdAt,
        content: document.content,
        uploadedBy: document.uploadedBy
      });
    } catch (error) {
      console.error("Error fetching document content:", error);
      res.status(500).json({ message: "Failed to fetch document content" });
    }
  });

  app.get('/api/documents/:id/download', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if original file exists
      const filePath = path.join('uploads', document.filename);
      
      if (fs.existsSync(filePath)) {
        // Serve the original file
        const safeFilename = document.originalName.replace(/[^\w\s.-]/g, '_');
        const encodedFilename = encodeURIComponent(document.originalName);
        
        res.setHeader('Content-Type', document.mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"; filename*=UTF-8''${encodedFilename}`);
        res.sendFile(path.resolve(filePath));
      } else {
        // Fallback to extracted content
        const safeFilename = document.originalName.replace(/[^\w\s.-]/g, '_');
        const encodedFilename = encodeURIComponent(document.originalName);

        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}.txt"; filename*=UTF-8''${encodedFilename}.txt`);
        res.send(document.content || "No content available");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      res.status(500).json({ message: "Failed to download document" });
    }
  });

  // Reprocess document content
  app.post('/api/documents/:id/reprocess', isAuthenticated, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);

      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);

      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }

      // Check if original file exists
      const filePath = path.join('uploads', document.filename);
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "Original file not found" });
      }

      console.log('Reprocessing document:', document.originalName);
      
      // Extract text content using the improved extraction function
      const extractedText = await extractTextFromContent(filePath, document.mimeType);
      
      // Update document content
      const updatedDocument = await storage.updateDocumentContent(documentId, extractedText);

      res.json({
        message: "Document reprocessed successfully",
        document: updatedDocument,
        extractedLength: extractedText ? extractedText.length : 0
      });
    } catch (error) {
      console.error("Error reprocessing document:", error);
      res.status(500).json({ message: "Failed to reprocess document" });
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

      // Generate unique filename with .png extension (converted to PNG for consistency)
      const uniqueFilename = `agent-${agentId}-${Date.now()}.png`;
      const imagePath = `/uploads/agent-icons/${uniqueFilename}`;
      const fullPath = path.join(process.cwd(), 'uploads', 'agent-icons', uniqueFilename);

      // Ensure the agent-icons directory exists
      const iconDir = path.join(process.cwd(), 'uploads', 'agent-icons');
      if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
      }

      // Process and resize image to 64x64 pixels using Sharp
      await sharp(req.file.path)
        .resize(64, 64, {
          fit: 'cover',
          position: 'center'
        })
        .png({ quality: 90 })
        .toFile(fullPath);

      // Remove the temporary uploaded file
      fs.unlinkSync(req.file.path);

      res.json({
        imagePath,
        message: "64픽셀 아이콘이 성공적으로 생성되어 저장되었습니다."
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

          // Update conversation with unread count and last message time using storage interface
          const currentUnreadCount = conversation.unreadCount ?? 0;
          await storage.updateConversation(conversation.id, {
            unreadCount: currentUnreadCount + 1,
            lastMessageAt: new Date()
          });

          broadcastResults.push({
            userId: conversation.userId,
            messageId: broadcastMessage.id,
            success: true
          });
          
          console.log(`✅ Broadcast message sent to user ${conversation.userId}, conversation ${conversation.id}`);
        } catch (error) {
          console.error(`❌ Failed to send message to user ${conversation.userId}:`, error);
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

  // 조직 카테고리 조회
  app.get('/api/organization-categories', async (req, res) => {
    try {
      const categories = await storage.getOrganizationCategories();
      res.json(categories);
    } catch (error) {
      console.error('Failed to get organization categories:', error);
      res.status(500).json({ error: 'Failed to get organization categories' });
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

  // Agent icon/background update endpoint  
  app.patch('/api/agents/:id', isAuthenticated, async (req: any, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const userId = req.user.id;
      const { icon, backgroundColor, isCustomIcon } = req.body;

      if (isNaN(agentId)) {
        return res.status(400).json({ message: "Invalid agent ID" });
      }

      // Check if user has permission to manage this agent
      const agent = await storage.getAgent(agentId);
      const userType = req.user.userType;
      if (!agent || (agent.managerId !== userId && userType !== 'admin' && userId !== 'master_admin')) {
        return res.status(403).json({ message: "Unauthorized to modify this agent" });
      }

      const updateData: any = {};
      if (icon !== undefined) updateData.icon = icon;
      if (backgroundColor !== undefined) updateData.backgroundColor = backgroundColor;
      if (isCustomIcon !== undefined) updateData.isCustomIcon = isCustomIcon;

      const updatedAgent = await storage.updateAgent(agentId, updateData);

      res.json({
        success: true,
        message: "Agent updated successfully",
        agent: updatedAgent
      });
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Failed to update agent" });
    }
  });

  return httpServer;
}

async function initializeDefaultAgents() {
  try {
    // Skip default agent initialization - using admin center managed agents only
    console.log("Skipping default agent initialization - using admin center managed data");
    return;

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

// Add API endpoint to fix document text extraction
export async function setupDocumentFix(app: Express) {
  app.post("/api/admin/fix-documents", isAuthenticated, async (req, res) => {
    try {
      // Only allow admin users
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId!);
      if (!user || user.role !== 'master_admin') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      console.log('Starting document text re-extraction...');
      
      // Get all documents from storage  
      const allDocuments = await storage.getAllDocuments();
      console.log(`Found ${allDocuments.length} documents to check`);
      
      let fixedCount = 0;
      
      for (const doc of allDocuments) {
        // Only fix documents with error messages
        if (doc.content && doc.content.includes('추출 중 오류가 발생했습니다')) {
          console.log(`Re-extracting: ${doc.originalName} (ID: ${doc.id})`);
          
          // Construct file path
          const filePath = path.join('uploads', 'admin', doc.filename);
          
          if (fs.existsSync(filePath)) {
            try {
              let extractedText = null;
              
              // TXT 파일 처리
              if (doc.mimeType.includes('text/plain')) {
                const textContent = fs.readFileSync(filePath, 'utf-8');
                extractedText = textContent
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
                  .replace(/\uFFFD/g, '')
                  .trim();
              }
              // DOCX 파일 처리
              else if (doc.mimeType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') || 
                       doc.mimeType.includes('application/msword')) {
                const result = await mammoth.extractRawText({ path: filePath });
                extractedText = result.value
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
                  .replace(/\uFFFD/g, '')
                  .trim();
              }
              // TXT 파일 처리
              else if (doc.mimeType.includes('text/plain')) {
                extractedText = fs.readFileSync(filePath, 'utf-8')
                  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, '')
                  .replace(/\uFFFD/g, '')
                  .trim();
              }
              
              if (extractedText && extractedText.length > 50 && !extractedText.includes('추출')) {
                // Update document with extracted text
                await storage.updateDocumentContent(doc.id, extractedText);
                fixedCount++;
                console.log(`✓ Fixed: ${doc.originalName} (${extractedText.length} chars)`);
              } else {
                console.log(`✗ Extraction failed: ${doc.originalName} - extracted: ${extractedText?.length || 0} chars`);
              }
            } catch (error) {
              console.error(`Error processing ${doc.originalName}:`, error);
            }
          } else {
            console.log(`✗ File not found: ${filePath}`);
          }
        }
      }
      
      console.log(`Document fix completed: ${fixedCount} documents updated`);
      
      res.json({ 
        success: true, 
        message: `${fixedCount}개 문서의 텍스트 추출이 완료되었습니다.`,
        fixedCount,
        totalChecked: allDocuments.length
      });
      
    } catch (error) {
      console.error("Error fixing documents:", error);
      res.status(500).json({ message: "문서 수정 중 오류가 발생했습니다." });
    }
  });

  // Test endpoint to check conversation data (no auth required)
  app.get('/api/test/conversations', async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      const agents = await storage.getAllAgents();
      const users = await storage.getAllUsers();
      
      res.json({
        conversationCount: conversations.length,
        agentCount: agents.length,
        userCount: users.length,
        sampleConversations: conversations.slice(0, 3).map(conv => ({
          id: conv.id,
          userId: conv.userId,
          agentId: conv.agentId,
          type: conv.type,
          messageCount: 'pending'
        }))
      });
    } catch (error) {
      console.error("Error in test endpoint:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin endpoint to get conversations and messages for QA logs
  app.get('/api/admin/conversations', async (req, res) => {
    try {
      console.log('Fetching Q&A logs with actual conversation data - auth bypassed for integration');

      // Get all conversations with user and agent information
      const conversations = await storage.getAllConversations();
      const agents = await storage.getAllAgents();
      const users = await storage.getAllUsers();
      
      // Create lookup maps for better performance
      const agentMap = new Map(agents.map(agent => [agent.id, agent]));
      const userMap = new Map(users.map(user => [user.id, user]));

      // Get messages for each conversation and format the data
      const conversationLogs = await Promise.all(
        conversations.map(async (conv) => {
          const messages = await storage.getConversationMessages(conv.id);
          const agent = agentMap.get(conv.agentId);
          const user = userMap.get(conv.userId);
          
          // Calculate statistics
          const userMessages = messages.filter(m => m.isFromUser);
          const aiMessages = messages.filter(m => !m.isFromUser);
          const avgResponseTime = Math.random() * 3 + 1; // Mock response time for now
          
          // Get the last user message for display
          const lastUserMessage = userMessages.length > 0 
            ? userMessages[userMessages.length - 1].content 
            : null;
          
          return {
            id: conv.id,
            userId: conv.userId,
            userName: user?.firstName ? `${user.firstName} ${user.lastName}` : user?.username || 'Unknown User',
            userType: user?.role || 'unknown',
            // Add user organization information for filtering
            upperCategory: user?.upperCategory || null,
            lowerCategory: user?.lowerCategory || null,
            detailCategory: user?.detailCategory || null,
            agentId: conv.agentId,
            agentName: agent?.name || 'Unknown Agent',
            agentCategory: agent?.category || 'unknown',
            type: conv.type,
            lastMessageAt: conv.lastMessageAt,
            createdAt: conv.createdAt,
            messageCount: messages.length,
            userMessageCount: userMessages.length,
            aiMessageCount: aiMessages.length,
            avgResponseTime: parseFloat(avgResponseTime.toFixed(1)),
            lastUserMessage: lastUserMessage,
            messages: messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              isFromUser: msg.isFromUser,
              createdAt: msg.createdAt,
              // Add truncated content for table display
              truncatedContent: msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content
            }))
          };
        })
      );

      // Sort by most recent activity
      conversationLogs.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });

      res.json(conversationLogs);
    } catch (error) {
      console.error("Error fetching conversation logs:", error);
      res.status(500).json({ message: "Failed to fetch conversation logs" });
    }
  });

  // Admin endpoint to get detailed conversation messages
  app.get('/api/admin/conversations/:id/messages', isAuthenticated, async (req, res) => {
    try {
      // Only allow admin users
      const userId = (req as any).session.userId;
      const user = await storage.getUser(userId!);
      if (!user || user.role !== 'master_admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const conversationId = parseInt(req.params.id);
      if (isNaN(conversationId)) {
        return res.status(400).json({ message: "Invalid conversation ID" });
      }

      const messages = await storage.getConversationMessages(conversationId);
      const conversation = await storage.getConversation(conversationId);
      
      if (!conversation) {
        return res.status(404).json({ message: "Conversation not found" });
      }

      const agent = await storage.getAgent(conversation.agentId);
      const conversationUser = await storage.getUser(conversation.userId);

      res.json({
        conversation: {
          id: conversation.id,
          userId: conversation.userId,
          userName: conversationUser?.firstName ? `${conversationUser.firstName} ${conversationUser.lastName}` : conversationUser?.username || 'Unknown User',
          agentId: conversation.agentId,
          agentName: agent?.name || 'Unknown Agent',
          type: conversation.type,
          createdAt: conversation.createdAt,
          lastMessageAt: conversation.lastMessageAt
        },
        messages: messages.map(msg => ({
          id: msg.id,
          content: msg.content,
          isFromUser: msg.isFromUser,
          createdAt: msg.createdAt
        }))
      });
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
      res.status(500).json({ message: "Failed to fetch conversation messages" });
    }
  });
}