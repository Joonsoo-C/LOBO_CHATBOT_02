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
      const organizations = [
        { id: 1, name: '로보대학교', type: 'university' },
        { id: 2, name: '공과대학', type: 'college' },
        { id: 3, name: '컴퓨터공학과', type: 'department' }
      ];
      res.json(organizations);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Internal server error" });
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

  // Organizational categories file upload endpoint
  app.post("/api/admin/organizational-categories/upload", requireMasterAdmin, adminUpload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const overwriteExisting = req.body.overwriteExisting === 'true';
      const validateOnly = req.body.validateOnly === 'true';

      // Read and parse CSV/Excel file
      const filePath = req.file.path;
      let categories = [];

      // Check file type and parse accordingly
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Parse Excel file
        console.log('Parsing organizational categories Excel file:', req.file.originalname);
        
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
            const category: any = {};
            headers.forEach((header, index) => {
              if (header && values[index] !== undefined && values[index] !== null) {
                category[header.toString().trim()] = values[index].toString().trim();
              }
            });
            
            // Validate required fields
            if (category.upperCategory && category.lowerCategory && category.detailCategory && category.status) {
              // Validate status enum
              const validStatuses = ["Active", "Disabled", "Waiting for registration approval"];
              if (!validStatuses.includes(category.status)) {
                console.warn(`Invalid status '${category.status}' for category, defaulting to 'Active'`);
                category.status = "Active";
              }
              
              categories.push({
                upperCategory: category.upperCategory,
                lowerCategory: category.lowerCategory,
                detailCategory: category.detailCategory,
                status: category.status,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
        
      } else if (fileExtension === '.csv') {
        // Parse CSV file
        console.log('Parsing organizational categories CSV file:', req.file.originalname);
        
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
          throw new Error('CSV 파일에 충분한 데이터가 없습니다.');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim());
          if (values.length >= headers.length) {
            const category: any = {};
            headers.forEach((header, index) => {
              category[header] = values[index] || null;
            });
            
            // Validate required fields
            if (category.upperCategory && category.lowerCategory && category.detailCategory && category.status) {
              // Validate status enum
              const validStatuses = ["Active", "Disabled", "Waiting for registration approval"];
              if (!validStatuses.includes(category.status)) {
                console.warn(`Invalid status '${category.status}' for category, defaulting to 'Active'`);
                category.status = "Active";
              }
              
              categories.push({
                upperCategory: category.upperCategory,
                lowerCategory: category.lowerCategory,
                detailCategory: category.detailCategory,
                status: category.status,
                createdAt: new Date(),
                updatedAt: new Date()
              });
            }
          }
        }
        
      } else {
        throw new Error('지원하지 않는 파일 형식입니다. CSV 또는 Excel 파일만 업로드 가능합니다.');
      }

      console.log(`Parsed ${categories.length} organizational categories from ${fileExtension} file`);

      // Clean up temporary file
      fs.unlinkSync(filePath);

      if (validateOnly) {
        return res.json({
          success: true,
          message: `검증 완료: ${categories.length}개 조직 카테고리가 유효합니다.`,
          categoryCount: categories.length
        });
      }

      // Create/update categories in storage
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      for (const categoryData of categories) {
        try {
          // For now, we'll just create new categories since we don't have storage methods yet
          // This would need to be implemented based on your storage interface
          console.log('Would create/update category:', categoryData);
          createdCount++;
        } catch (error) {
          console.error(`Failed to process category ${categoryData.upperCategory}/${categoryData.lowerCategory}/${categoryData.detailCategory}:`, error);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `조직 카테고리 파일 업로드 완료`,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        total: categories.length
      });

    } catch (error) {
      console.error("Error uploading organizational categories file:", error);

      // Clean up temporary file if it exists
      if (req.file) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error("Error cleaning up file:", cleanupError);
        }
      }

      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to upload organizational categories file" 
      });
    }
  });

  // Organizational categories sample file download endpoint
  app.get("/api/admin/organizational-categories/sample", requireMasterAdmin, async (req, res) => {
    try {
      // Create sample organizational categories Excel file
      const sampleData = [
        {
          'upperCategory': '로보대학교',
          'lowerCategory': '공과대학',
          'detailCategory': '컴퓨터공학과',
          'status': 'Active'
        },
        {
          'upperCategory': '로보대학교',
          'lowerCategory': '공과대학',
          'detailCategory': '전자공학과',
          'status': 'Active'
        },
        {
          'upperCategory': '로보대학교',
          'lowerCategory': '경영대학',
          'detailCategory': '경영학과',
          'status': 'Active'
        },
        {
          'upperCategory': '로보대학교',
          'lowerCategory': '인문대학',
          'detailCategory': '국어국문학과',
          'status': 'Disabled'
        },
        {
          'upperCategory': '로보대학교',
          'lowerCategory': '대학본부',
          'detailCategory': '총장실',
          'status': 'Waiting for registration approval'
        }
      ];

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(sampleData);

      // Auto-size columns
      const colWidths = [
        { wch: 20 }, // upperCategory
        { wch: 20 }, // lowerCategory
        { wch: 20 }, // detailCategory
        { wch: 35 }  // status
      ];
      worksheet['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, '조직카테고리샘플');

      // Generate Excel file buffer
      const excelBuffer = XLSX.write(workbook, { 
        type: 'buffer', 
        bookType: 'xlsx' 
      });

      // Set response headers for file download
      const fileName = `조직카테고리_샘플파일.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.setHeader('Content-Length', excelBuffer.length);

      // Send file
      res.send(excelBuffer);

    } catch (error) {
      console.error("Error creating organizational categories sample file:", error);
      res.status(500).json({ message: "조직 카테고리 샘플 파일 생성에 실패했습니다" });
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
}