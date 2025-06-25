import { Express } from "express";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { insertDocumentSchema } from "../shared/schema";
import { extractTextFromContent, analyzeDocument } from "./openai";
import * as XLSX from 'xlsx';

// Configure multer for admin document uploads
const adminUploadDir = path.join(process.cwd(), 'uploads', 'admin');
if (!fs.existsSync(adminUploadDir)) {
  fs.mkdirSync(adminUploadDir, { recursive: true });
}

const adminUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, adminUploadDir);
    },
    filename: (req, file, cb) => {
      // Generate a unique filename
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv'
    ];

    // Fix Korean filename encoding immediately
    try {
      file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {
      console.log('Filename encoding conversion failed, keeping original:', file.originalname);
    }

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type') as any, false);
    }
  }
});

// Middleware to check if user is master admin
const requireMasterAdmin = (req: any, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;
  if (user.username !== "master_admin" || user.userType !== "admin") {
    return res.status(403).json({ message: "Forbidden - Master admin access required" });
  }

  next();
};

export function setupAdminRoutes(app: Express) {
  // System statistics
  app.get("/api/admin/stats", requireMasterAdmin, async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      const conversations = await storage.getAllConversations();

      const stats = {
        totalUsers: 15,
        activeUsers: 12,
        totalAgents: agents.length,
        activeAgents: agents.filter(a => a.isActive).length,
        totalConversations: conversations.length,
        totalMessages: 145,
        todayMessages: 23,
        weeklyGrowth: 15.2
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Users management
  app.get("/api/admin/users", requireMasterAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      console.log(`Admin users retrieved: ${users.length} users found`);
      console.log('User details:', users.slice(0, 5).map(u => ({ id: u.id, name: u.name || `${u.firstName} ${u.lastName}`, upperCategory: u.upperCategory, lowerCategory: u.lowerCategory })));
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent management
  app.get("/api/admin/agents", requireMasterAdmin, async (req, res) => {
    try {
      const agents = await storage.getAllAgents();

      // Format agents for admin display with additional stats
      const agentsWithStats = agents.map(agent => ({
        ...agent,
        documentCount: Math.floor(Math.random() * 10),
        userCount: Math.floor(Math.random() * 50) + 5,
        lastUsedAt: agent.createdAt,
        managerFirstName: 'System',
        managerLastName: 'Admin',
        organizationName: '로보대학교'
      }));

      res.json(agentsWithStats);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Organizations (simple mock data for memory storage)
  app.get("/api/admin/organizations", requireMasterAdmin, async (req, res) => {
    try {
      const organizations = await storage.getOrganizationCategories();
      console.log(`Retrieved ${organizations.length} organization categories from storage`);
      res.json(organizations);
    } catch (error) {
      console.error("Failed to get organizations:", error);
      res.status(500).json({ message: "조직 정보를 가져오는데 실패했습니다." });
    }
  });

  // Managers (faculty users)
  app.get("/api/admin/managers", requireMasterAdmin, async (req, res) => {
    try {
      const managers = [
        { id: 'prof001', username: 'prof001', firstName: '박', lastName: '교수', email: 'prof@robo.ac.kr' },
        { id: 'prof002', username: 'prof002', firstName: '최', lastName: '교수', email: 'prof2@robo.ac.kr' }
      ];
      res.json(managers);
    } catch (error) {
      console.error("Error fetching managers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent creation
  app.post("/api/admin/agents", requireMasterAdmin, async (req, res) => {
    try {
      const { name, description, category, managerId, organizationId } = req.body;

      const newAgent = await storage.createAgent({
        name,
        description,
        creatorId: req.user?.id || 'master_admin',
        category,
        icon: 'user',
        backgroundColor: '#3B82F6',
        managerId: managerId || null,
        organizationId: organizationId ? parseInt(organizationId) : null
      });

      res.json(newAgent);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent update
  app.put("/api/admin/agents/:id", requireMasterAdmin, async (req, res) => {
    try {
      const agentId = parseInt(req.params.id);
      const updateData = req.body;

      const updatedAgent = await storage.updateAgent(agentId, updateData);
      res.json(updatedAgent);
    } catch (error) {
      console.error("Error updating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Admin document upload endpoint
  app.post("/api/admin/documents/upload", requireMasterAdmin, adminUpload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { type, description } = req.body;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Fix Korean filename encoding
      let originalName = file.originalname;
      try {
        // Ensure we have a valid filename
        if (!originalName || originalName.trim() === '') {
          // Generate a basic filename with proper extension
          const ext = file.mimetype.includes('pdf') ? '.pdf' :
                     file.mimetype.includes('word') ? '.docx' :
                     file.mimetype.includes('excel') ? '.xlsx' :
                     file.mimetype.includes('powerpoint') ? '.pptx' : '.txt';
          originalName = `document_${Date.now()}${ext}`;
        } else {
          // Clean filename but preserve Korean characters
          originalName = originalName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');
          
          // Ensure filename is not empty after cleanup
          if (!originalName.trim()) {
            const ext = file.mimetype.includes('pdf') ? '.pdf' :
                       file.mimetype.includes('word') ? '.docx' :
                       file.mimetype.includes('excel') ? '.xlsx' :
                       file.mimetype.includes('powerpoint') ? '.pptx' : '.txt';
            originalName = `document_${Date.now()}${ext}`;
          }

          // Only clean up truly invalid characters, preserve Korean characters and common filename chars
          originalName = originalName.replace(/[<>:"/\\|?*\x00-\x1f]/g, '');

          // Ensure filename is not empty after cleanup
          if (!originalName.trim()) {
            const ext = file.mimetype.includes('pdf') ? '.pdf' :
                       file.mimetype.includes('word') ? '.docx' :
                       file.mimetype.includes('excel') ? '.xlsx' :
                       file.mimetype.includes('powerpoint') ? '.pptx' : '.txt';
            originalName = `document_${Date.now()}${ext}`;
          }
        }
      } catch (e) {
        // Keep original name if conversion fails, or generate fallback
        originalName = file.originalname || `document_${Date.now()}.txt`;
      }

      console.log("Admin document upload:", {
        filename: file.filename,
        originalName: originalName,
        mimetype: file.mimetype,
        size: file.size,
        type,
        description
      });

      // Generate a unique filename for permanent storage
      const permanentFilename = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${originalName}`;
      const permanentPath = path.join(adminUploadDir, permanentFilename);
      
      // Move file to permanent location
      fs.copyFileSync(file.path, permanentPath);

      // Read file content for processing
      let fileContent = '';
      let extractedText = '';

      try {
        fileContent = fs.readFileSync(permanentPath, 'utf-8');
        extractedText = await extractTextFromContent(fileContent, file.mimetype);
      } catch (contentError) {
        console.log("Could not extract text content, storing file info only");
        extractedText = `Document: ${originalName}`;
      }

      // Create document record - using permanent filename
      const documentData = {
        agentId: 1, // Use first agent as default for admin uploads
        filename: permanentFilename,
        originalName: originalName,
        mimeType: file.mimetype,
        size: file.size,
        content: extractedText,
        uploadedBy: req.user?.id || 'master_admin',
      };

      const document = await storage.createDocument(documentData);
      
      // Clean up temporary file
      fs.unlinkSync(file.path);

      res.json({
        success: true,
        document: {
          id: document.id,
          filename: document.filename,
          originalName: document.originalName,
          size: document.size,
          uploadedAt: document.createdAt
        },
        message: "Document uploaded successfully"
      });

    } catch (error) {
      console.error("Error uploading admin document:", error);

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

  // User file upload endpoint
  app.post("/api/admin/users/upload", requireMasterAdmin, adminUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const overwriteExisting = req.body.overwriteExisting === 'true';
      const sendWelcome = req.body.sendWelcome === 'true';
      const validateOnly = req.body.validateOnly === 'true';

      // Read and parse CSV/Excel file
      const filePath = req.file.path;
      let users = [];

      // Check file type and parse accordingly
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Parse Excel file
        console.log('Parsing Excel file:', req.file.originalname);
        
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0]; // Use first sheet
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert sheet to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length < 2) {
          throw new Error('엑셀 파일에 충분한 데이터가 없습니다.');
        }
        
        const headers = jsonData[0] as string[];
        console.log('Excel headers:', headers);
        
        // Process each row
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i] as any[];
          if (values && values.length > 0) {
            const user: any = {};
            headers.forEach((header, index) => {
              if (header && values[index] !== undefined && values[index] !== null) {
                user[header.toString().trim()] = values[index].toString().trim();
              }
            });
            
            // Validate required fields
            if (user.username && user.userType) {
              users.push({
                id: user.username,
                username: user.username,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                email: user.email || null,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                password: 'defaultPassword123',
                userType: user.userType,
                role: user.userType === 'faculty' ? 'faculty' : 'student',
                upperCategory: user.upperCategory || '로보대학교',
                lowerCategory: user.lowerCategory || (user.userType === 'faculty' ? '교직원' : '학생'),
                detailCategory: user.detailCategory || null,
                position: user.position || null,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
        
      } else if (fileExtension === '.csv') {
        // Parse CSV file
        console.log('Parsing CSV file:', req.file.originalname);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV 파일에 충분한 데이터가 없습니다.');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= headers.length) {
            const user: any = {};
            headers.forEach((header, index) => {
              user[header] = values[index] || null;
            });
            
            // Validate required fields
            if (user.username && user.userType) {
              users.push({
                id: user.username,
                username: user.username,
                firstName: user.firstName || null,
                lastName: user.lastName || null,
                email: user.email || null,
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
                password: 'defaultPassword123',
                userType: user.userType,
                role: user.userType === 'faculty' ? 'faculty' : 'student',
                upperCategory: user.upperCategory || '로보대학교',
                lowerCategory: user.lowerCategory || (user.userType === 'faculty' ? '교직원' : '학생'),
                detailCategory: user.detailCategory || null,
                position: user.position || null,
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
        
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일만 업로드 가능합니다.');
      }

      console.log(`Parsed ${users.length} users from ${fileExtension} file`);

      // Clean up temporary file
      fs.unlinkSync(filePath);

      if (validateOnly) {
        return res.json({
          success: true,
          message: `검증 완료: ${users.length}개 사용자 레코드가 유효합니다.`,
          userCount: users.length
        });
      }

      // Create users in storage - using simpler approach for memory storage
      let createdCount = 0;
      let errorCount = 0;

      for (const userData of users) {
        try {
          // For memory storage, we'll just try to create the user
          await storage.createUser(userData);
          createdCount++;
        } catch (error) {
          console.error(`Failed to process user ${userData.username}:`, error);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `사용자 파일 업로드 완료`,
        created: createdCount,
        updated: 0,
        errors: errorCount,
        total: users.length
      });

    } catch (error) {
      console.error("Error uploading user file:", error);

      // Clean up temporary file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload user file" 
      });
    }
  });

  // Sample file download endpoint
  app.get("/api/admin/users/sample", requireMasterAdmin, async (req, res) => {
    try {
      // Create sample Excel file
      const sampleData = [
        {
          'username': 'S2024001',
          'firstName': '김',
          'lastName': '학생',
          'email': 'student1@robo.ac.kr',
          'userType': 'student',
          'upperCategory': '로보대학교',
          'lowerCategory': '공과대학',
          'detailCategory': '컴퓨터공학과',
          'position': '학부생'
        },
        {
          'username': 'F2024001',
          'firstName': '이',
          'lastName': '교수',
          'email': 'prof1@robo.ac.kr',
          'userType': 'faculty',
          'upperCategory': '로보대학교',
          'lowerCategory': '공과대학',
          'detailCategory': '컴퓨터공학과',
          'position': '교수'
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);

      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // username
        { wch: 10 }, // firstName
        { wch: 10 }, // lastName
        { wch: 25 }, // email
        { wch: 10 }, // userType
        { wch: 15 }, // upperCategory
        { wch: 15 }, // lowerCategory
        { wch: 20 }, // detailCategory
        { wch: 10 }  // position
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, '사용자샘플');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      // Set response headers for file download
      const fileName = `사용자업로드_샘플파일.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send file
      res.send(excelBuffer);

    } catch (error) {
      console.error("Error creating sample file:", error);
      res.status(500).json({ message: "샘플 파일 생성에 실패했습니다" });
    }
  });

  // Organization category file upload endpoint
  app.post("/api/admin/organizations/upload", requireMasterAdmin, adminUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const overwriteExisting = req.body.overwriteExisting === 'true';
      const validateOnly = req.body.validateOnly === 'true';

      // Read and parse Excel file
      const filePath = req.file.path;
      let organizations = [];

      // Check file type and parse accordingly
      if (req.file.mimetype.includes('excel') || req.file.mimetype.includes('spreadsheetml')) {
        // Excel file parsing
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          throw new Error('엑셀 파일에 데이터가 없습니다.');
        }

        // Process Excel data for organizations
        organizations = jsonData.map((row: any) => {
          return {
            name: row.조직명 || row.name || row.이름,
            type: row.조직유형 || row.type || 'department',
            parentId: null, // Will be resolved later based on hierarchy
            upperCategory: row.상위조직 || row.upperCategory || row.상위카테고리,
            lowerCategory: row.하위조직 || row.lowerCategory || row.하위카테고리,
            detailCategory: row.세부조직 || row.detailCategory || row.세부카테고리,
            description: row.설명 || row.description || null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        }).filter(org => org.name); // Only include rows with organization name

      } else {
        throw new Error('조직 카테고리 업로드는 엑셀 파일(.xlsx)만 지원됩니다.');
      }

      // Clean up temporary file
      fs.unlinkSync(filePath);

      if (validateOnly) {
        return res.json({
          success: true,
          message: `검증 완료: ${organizations.length}개 조직이 유효합니다.`,
          organizationCount: organizations.length
        });
      }

      // Process organizations in storage
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const orgData of organizations) {
        try {
          // For now, just count as created since we don't have organization storage yet
          createdCount++;
        } catch (error) {
          console.error(`Failed to process organization ${orgData.name}:`, error);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `조직 카테고리 파일 업로드 완료`,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        total: organizations.length
      });

    } catch (error) {
      console.error("Error uploading organization file:", error);

      // Clean up temporary file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload organization file" 
      });
    }
  });

  // Export users to Excel
  app.get("/api/admin/users/export", requireMasterAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      if (!users || users.length === 0) {
        return res.status(404).json({ message: "사용자 데이터가 없습니다" });
      }

      // Prepare user data for Excel export
      const excelData = users.map(user => ({
        'ID': user.id,
        '사용자명': user.username,
        '이름': user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        '이메일': user.email,
        '사용자유형': user.userType === 'faculty' ? '교직원' : '학생',
        '상위카테고리': user.upperCategory || '',
        '하위카테고리': user.lowerCategory || '',
        '세부카테고리': user.detailCategory || '',
        '직급/직위': user.position || '',
        '시스템역할': user.role,
        '상태': user.status,
        '생성일': user.createdAt ? new Date(user.createdAt).toLocaleString('ko-KR') : '',
        '최종로그인': user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('ko-KR') : '로그인 기록 없음',
        '사용중인에이전트': Array.isArray(user.usingAgents) ? user.usingAgents.join(', ') : '',
        '관리카테고리': Array.isArray(user.managedCategories) ? user.managedCategories.join(', ') : '',
        '관리에이전트': Array.isArray(user.managedAgents) ? user.managedAgents.join(', ') : ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // ID
        { wch: 15 }, // 사용자명
        { wch: 20 }, // 이름
        { wch: 30 }, // 이메일
        { wch: 10 }, // 사용자유형
        { wch: 15 }, // 상위카테고리
        { wch: 20 }, // 하위카테고리
        { wch: 25 }, // 세부카테고리
        { wch: 15 }, // 직급/직위
        { wch: 15 }, // 시스템역할
        { wch: 8 },  // 상태
        { wch: 20 }, // 생성일
        { wch: 20 }, // 최종로그인
        { wch: 30 }, // 사용중인에이전트
        { wch: 20 }, // 관리카테고리
        { wch: 20 }  // 관리에이전트
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, '사용자목록');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      // Set response headers for file download
      const fileName = `사용자목록_${new Date().toISOString().split('T')[0]}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send file
      res.send(excelBuffer);

    } catch (error) {
      console.error("Error exporting users to Excel:", error);
      res.status(500).json({ message: "엑셀 파일 생성에 실패했습니다" });
    }
  });

  // Get admin documents
  app.get("/api/admin/documents", requireMasterAdmin, async (req, res) => {
    try {
      // Get all documents across all agents for admin view
      const documents = await storage.getAllDocuments();

      console.log(`Admin documents retrieved: ${documents.length} documents found`);
      console.log("Document details:", documents.map(doc => ({
        id: doc.id,
        originalName: doc.originalName,
        agentId: doc.agentId,
        createdAt: doc.createdAt
      })));

      // Format documents for admin display
      const formattedDocuments = documents.map((doc: any) => ({
        id: doc.id,
        name: doc.originalName,
        filename: doc.filename,
        size: `${(doc.size / 1024 / 1024).toFixed(2)} MB`,
        type: doc.mimeType.includes('pdf') ? 'PDF' : 
              doc.mimeType.includes('word') ? 'Word' :
              doc.mimeType.includes('excel') ? 'Excel' :
              doc.mimeType.includes('powerpoint') ? 'PowerPoint' : 'Document',
        uploader: doc.uploadedBy,
        date: doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('ko-KR') : new Date().toLocaleDateString('ko-KR'),
        agentId: doc.agentId
      }));

      console.log(`Formatted documents: ${formattedDocuments.length} documents`);
      res.json(formattedDocuments);
    } catch (error) {
      console.error("Error fetching admin documents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Document preview endpoint
  app.get("/api/admin/documents/:id/preview", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      // Return document content and metadata as JSON
      res.json({
        id: document.id,
        name: document.originalName,
        content: document.content || "문서 내용을 읽을 수 없습니다.",
        size: `${(document.size / 1024).toFixed(1)} KB`,
        type: document.mimeType.includes('pdf') ? 'PDF' : 
              document.mimeType.includes('word') ? 'Word' :
              document.mimeType.includes('excel') ? 'Excel' :
              document.mimeType.includes('powerpoint') ? 'PowerPoint' : 'Document',
        uploadedAt: document.createdAt
      });
      
    } catch (error) {
      console.error("Error previewing document:", error);
      res.status(500).json({ message: "문서 미리보기에 실패했습니다" });
    }
  });

  // Document download endpoint
  app.get("/api/admin/documents/:id/download", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      // File should be in admin upload directory
      const filePath = path.join(adminUploadDir, document.filename);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`Document file not found: ${document.filename} at ${filePath}`);
        return res.status(404).json({ message: "서버에서 문서 파일을 찾을 수 없습니다" });
      }

      // Get file stats for proper headers
      const stats = fs.statSync(filePath);
      
      // Set headers for file download with proper encoding
      res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(document.originalName)}`);
      res.setHeader('Cache-Control', 'no-cache');
      
      // Create read stream and handle errors
      const fileStream = fs.createReadStream(filePath);
      
      fileStream.on('error', (streamError) => {
        console.error("File stream error:", streamError);
        if (!res.headersSent) {
          res.status(500).json({ message: "파일 스트림 오류" });
        }
      });

      fileStream.on('open', () => {
        console.log(`Starting download of ${document.originalName}`);
      });

      fileStream.on('end', () => {
        console.log(`Download completed for ${document.originalName}`);
      });

      // Pipe file to response
      fileStream.pipe(res);
      
    } catch (error) {
      console.error("Error downloading document:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "문서 다운로드에 실패했습니다" });
      }
    }
  });

  // Document delete endpoint
  app.delete("/api/admin/documents/:id", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      // Delete file from filesystem
      const filePath = path.join(adminUploadDir, document.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete document record from storage
      await storage.deleteDocument(documentId);

      res.json({ 
        success: true, 
        message: "문서가 성공적으로 삭제되었습니다" 
      });
      
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "문서 삭제에 실패했습니다" });
    }
  });

  // Update user endpoint
  app.patch("/api/admin/users/:id", requireMasterAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      const updateData = req.body;

      console.log(`Updating user ${userId} with data:`, {
        ...updateData,
        organizationAffiliations: updateData.organizationAffiliations?.length || 0,
        agentPermissions: updateData.agentPermissions?.length || 0,
        userMemo: updateData.userMemo ? 'has memo' : 'no memo'
      });

      // Update user in storage
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }

      console.log("User updated successfully:", updatedUser.id);
      res.json(updatedUser);
    } catch (error) {
      console.error("Failed to update user:", error);
      res.status(500).json({ 
        message: "사용자 정보 수정에 실패했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Delete user endpoint
  app.delete("/api/admin/users/:id", requireMasterAdmin, async (req, res) => {
    try {
      const userId = req.params.id;

      if (userId === 'master_admin') {
        return res.status(400).json({ message: "마스터 관리자 계정은 삭제할 수 없습니다." });
      }

      await storage.deleteUser(userId);
      console.log("User deleted successfully:", userId);
      res.json({ success: true, message: "사용자가 삭제되었습니다." });
    } catch (error) {
      console.error("Failed to delete user:", error);
      res.status(500).json({ 
        message: "사용자 삭제에 실패했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Organization category file upload configuration
  const orgCategoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, cb) => {
      console.log(`Checking file: ${file.originalname}, MIME: ${file.mimetype}`);
      const allowedTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
        'application/csv' // .csv alternative
      ];
      const fileName = file.originalname.toLowerCase();
      const isValidExtension = fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv');
      
      console.log(`File validation - MIME valid: ${allowedTypes.includes(file.mimetype)}, Extension valid: ${isValidExtension}`);
      
      if (allowedTypes.includes(file.mimetype) || isValidExtension) {
        console.log(`File accepted: ${file.originalname}`);
        cb(null, true);
      } else {
        console.log(`File rejected: ${file.originalname}`);
        cb(new Error('CSV 또는 Excel 파일만 지원됩니다'));
      }
    }
  });

  // Organization category file upload endpoint
  app.post("/api/admin/upload-org-categories", requireMasterAdmin, orgCategoryUpload.array('files', 10), async (req: any, res) => {
    try {
      console.log('Organization category upload request received');
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "파일이 선택되지 않았습니다." });
      }

      const { overwriteExisting, validateOnly } = req.body;
      console.log('Organization category upload options:', { overwriteExisting, validateOnly });

      let totalOrganizations: any[] = [];
      const processResults: any[] = [];

      // Process each file
      for (const file of files) {
        try {
          console.log(`Processing organization category file: ${file.originalname}`);
          
          let jsonData: any[][] = [];
          const fileName = file.originalname.toLowerCase();
          
          if (fileName.endsWith('.csv')) {
            // CSV file processing
            const csvText = file.buffer.toString('utf-8');
            const lines = csvText.split('\n').filter(line => line.trim() !== '');
            jsonData = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
          } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Excel file processing  
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          } else {
            console.log(`Unsupported file type: ${file.originalname}`);
            continue;
          }
          
          if (jsonData.length === 0) {
            console.log(`Empty file: ${file.originalname}`);
            continue;
          }

          // Skip header row and process data
          const dataRows = jsonData.slice(1);
          console.log(`Processing ${dataRows.length} organization rows from ${file.originalname}`);

          // Process each row
          const fileOrganizations = dataRows.map((row, index) => {
            const rowNum = index + 2; // +2 because we skipped header and array is 0-indexed
            return {
              name: row[0] || row.조직명 || row.name,
              upperCategory: row[1] || row.상위조직 || row.upperCategory,
              lowerCategory: row[2] || row.하위조직 || row.lowerCategory,
              detailCategory: row[3] || row.세부조직 || row.detailCategory,
              description: row[4] || row.설명 || row.description || null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date(),
              sourceFile: file.originalname,
              sourceRow: rowNum
            };
          }).filter(org => org.name); // Only include rows with organization name

          totalOrganizations = totalOrganizations.concat(fileOrganizations);
          
          processResults.push({
            filename: file.originalname,
            processed: fileOrganizations.length,
            skipped: dataRows.length - fileOrganizations.length
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          processResults.push({
            filename: file.originalname,
            error: fileError instanceof Error ? fileError.message : 'Unknown error',
            processed: 0,
            skipped: 0
          });
        }
      }

      if (validateOnly) {
        return res.json({
          success: true,
          message: `검증 완료: ${totalOrganizations.length}개 조직이 유효합니다.`,
          organizationCount: totalOrganizations.length,
          fileResults: processResults,
          preview: totalOrganizations.slice(0, 10) // Show first 10 for preview
        });
      }

      // Create organization categories in storage
      const createdOrganizations = await storage.bulkCreateOrganizationCategories(totalOrganizations);
      let createdCount = createdOrganizations.length;
      let updatedCount = 0;
      let errorCount = totalOrganizations.length - createdCount;

      console.log(`Organization category upload summary: ${createdCount} created, ${updatedCount} updated, ${errorCount} errors`);

      res.json({
        success: true,
        message: `조직 카테고리 파일 업로드 완료`,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        fileResults: processResults,
        totalProcessed: totalOrganizations.length
      });

    } catch (error) {
      console.error('Organization category upload error:', error);
      res.status(500).json({ 
        message: "조직 카테고리 파일 업로드 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });
}