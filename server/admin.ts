import { Express } from "express";
import { storage } from "./storage";
import multer from "multer";
import fs from "fs";
import path from "path";
import { insertDocumentSchema } from "../shared/schema";
import { extractTextFromContent, analyzeDocument } from "./openai";
// XLSX will be imported dynamically when needed

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
  // User file upload configuration
  const userUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, adminUploadDir);
      },
      filename: (req, file, cb) => {
        // Generate a unique filename
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
        cb(null, uniqueName);
      }
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      // Fix Korean filename encoding immediately
      try {
        const originalBuffer = Buffer.from(file.originalname, 'latin1');
        file.originalname = originalBuffer.toString('utf8');
      } catch (e) {
        console.log('Filename encoding conversion failed, keeping original:', file.originalname);
      }

      console.log('🔍 사용자 파일 업로드 검증 시작:', {
        filename: file.originalname,
        mimetype: file.mimetype,
        fieldname: file.fieldname
      });

      // Primary validation: Check file extension (most reliable)
      const fileName = file.originalname.toLowerCase();
      const validExcelExtensions = ['.xlsx', '.xls'];
      const validCsvExtensions = ['.csv'];
      const allValidExtensions = [...validExcelExtensions, ...validCsvExtensions];
      
      const hasValidExtension = allValidExtensions.some(ext => fileName.endsWith(ext));
      const isExcelFile = validExcelExtensions.some(ext => fileName.endsWith(ext));
      const isCsvFile = validCsvExtensions.some(ext => fileName.endsWith(ext));

      // Secondary validation: MIME type check (less reliable due to browser differences)
      const excelMimeTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/excel',
        'application/x-excel',
        'application/x-msexcel',
        'application/msexcel',
        'application/x-dos_ms_excel',
        'application/xls',
        'application/x-xls',
        'application/zip', // .xlsx sometimes detected as zip
        'application/x-zip-compressed',
        'application/octet-stream' // Generic binary
      ];

      const csvMimeTypes = [
        'text/csv',
        'application/csv',
        'text/comma-separated-values',
        'application/excel', // Sometimes CSV detected as Excel
        'text/plain' // Plain text CSV
      ];

      const allValidMimeTypes = [...excelMimeTypes, ...csvMimeTypes];
      const hasValidMimeType = allValidMimeTypes.includes(file.mimetype);

      console.log('📊 파일 검증 결과:', {
        filename: file.originalname,
        extension_valid: hasValidExtension,
        is_excel: isExcelFile,
        is_csv: isCsvFile,
        mimetype: file.mimetype,
        mimetype_valid: hasValidMimeType
      });

      // Accept file if extension is valid (priority) OR if MIME type suggests Excel/CSV
      if (hasValidExtension) {
        console.log('✅ 파일 확장자 기준으로 승인:', file.originalname);
        cb(null, true);
      } else if (hasValidMimeType && (file.mimetype.includes('excel') || file.mimetype.includes('csv') || file.mimetype.includes('sheet'))) {
        console.log('✅ MIME 타입 기준으로 승인:', file.originalname, file.mimetype);
        cb(null, true);
      } else {
        console.log('❌ 파일 거부:', {
          filename: file.originalname,
          mimetype: file.mimetype,
          reason: '지원되지 않는 파일 형식'
        });
        cb(new Error('지원되지 않는 파일 형식입니다. Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드 가능합니다.') as any, false);
      }
    }
  });

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
      console.log(`Retrieved ${organizations.length} organization categories from storage:`);
      organizations.forEach((org, index) => {
        if (index < 10) { // Log first 10 for debugging
          console.log(`  ${index + 1}. ${org.name || 'Unknown'} (${org.upperCategory || 'None'} > ${org.lowerCategory || 'None'})`);
        }
      });
      if (organizations.length > 10) {
        console.log(`  ... and ${organizations.length - 10} more organizations`);
      }

      // Ensure no caching headers
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });

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

      // Extract text content from the uploaded file
      let extractedText = '';

      try {
        extractedText = await extractTextFromContent(permanentPath, file.mimetype);
        console.log("Extracted text preview:", extractedText.substring(0, 200));
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

  // Agent file upload endpoint
  app.post("/api/admin/agents/upload", requireMasterAdmin, (req, res, next) => {
    console.log('📁 에이전트 파일 업로드 요청 시작');
    
    userUpload.single('file')(req, res, (err) => {
      if (err) {
        console.log('❌ 파일 업로드 multer 오류:', {
          error: err.message,
          code: err.code,
          field: err.field
        });
        
        // Check if it's a file validation error
        if (err.message && err.message.includes('지원되지 않는 파일 형식')) {
          return res.status(400).json({ 
            message: err.message,
            details: 'Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드 가능합니다.',
            supported_formats: ['.xlsx', '.xls', '.csv']
          });
        }
        
        // Other multer errors
        return res.status(400).json({ 
          message: '파일 업로드 중 오류가 발생했습니다.',
          error: err.message 
        });
      }
      
      // Continue with file processing
      next();
    });
  }, async (req, res) => {
    try {
      console.log('📋 에이전트 파일 처리 시작');
      
      if (!req.file) {
        console.log('❌ 업로드된 파일이 없음');
        return res.status(400).json({ message: '파일이 업로드되지 않았습니다.' });
      }

      const clearExisting = req.body.clearExisting === 'true';
      const validateOnly = req.body.validateOnly === 'true';
      
      console.log('📊 업로드 옵션:', {
        clearExisting,
        validateOnly,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size
      });

      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();
      
      let agents: any[] = [];
      
      if (fileExtension === '.csv') {
        // CSV 파일 처리
        const csvData = fs.readFileSync(filePath, 'utf8');
        const parsed = Papa.parse(csvData, { 
          header: true, 
          skipEmptyLines: true,
          encoding: 'utf8'
        });
        agents = parsed.data;
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        // Excel 파일 처리
        const { readFile, utils } = await import('xlsx');
        const workbook = readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        agents = utils.sheet_to_json(worksheet);
      } else {
        return res.status(400).json({ message: '지원되지 않는 파일 형식입니다.' });
      }

      console.log(`📊 파싱된 에이전트 수: ${agents.length}`);

      // 에이전트 데이터 변환 및 검증
      const processedAgents = agents.map((agent: any, index: number) => {
        try {
          return {
            name: agent.name || agent['에이전트명'] || agent['이름'] || `에이전트_${index + 1}`,
            description: agent.description || agent['설명'] || agent['기능설명'] || '',
            category: agent.category || agent['카테고리'] || agent['분류'] || '기능',
            icon: agent.icon || agent['아이콘'] || 'Bot',
            backgroundColor: agent.backgroundColor || agent['배경색'] || '#3B82F6',
            isActive: true,
            managerId: agent.managerId || agent['관리자ID'] || 'prof001',
            organizationId: agent.organizationId || agent['조직ID'] || 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };
        } catch (error) {
          console.error(`에이전트 ${index + 1} 처리 중 오류:`, error);
          return null;
        }
      }).filter(Boolean);

      console.log(`✅ 처리된 에이전트 수: ${processedAgents.length}`);

      if (validateOnly) {
        // 검증만 수행
        return res.json({
          success: true,
          message: `검증 완료: ${processedAgents.length}개 에이전트 레코드가 유효합니다.`,
          agentCount: processedAgents.length
        });
      }

      let createdCount = 0;
      let errorCount = 0;

      if (clearExisting) {
        console.log('기존 에이전트 모두 삭제 중...');
        // 기존 에이전트 모두 삭제
        const existingAgents = await storage.getAllAgents();
        for (const agent of existingAgents) {
          try {
            await storage.deleteAgent(agent.id);
          } catch (error) {
            console.error(`에이전트 ${agent.id} 삭제 실패:`, error);
          }
        }
      }

      // 새 에이전트 생성
      for (const agentData of processedAgents) {
        try {
          await storage.createAgent(agentData);
          createdCount++;
          console.log(`✅ 에이전트 생성 성공: ${agentData.name}`);
        } catch (error) {
          console.error(`에이전트 ${agentData.name} 생성 실패:`, error);
          errorCount++;
        }
      }

      // 임시 파일 정리
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('임시 파일 정리 오류:', cleanupError);
      }

      const responseMessage = clearExisting 
        ? `기존 에이전트를 모두 삭제하고 ${createdCount}개의 새 에이전트로 교체했습니다.`
        : `${createdCount}개의 새 에이전트를 추가했습니다.`;

      res.json({
        success: true,
        message: responseMessage,
        created: createdCount,
        errors: errorCount,
        total: processedAgents.length
      });

    } catch (error) {
      console.error("에이전트 파일 업로드 오류:", error);

      // 임시 파일 정리
      if (req.file?.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (cleanupError) {
          console.error('임시 파일 정리 오류:', cleanupError);
        }
      }

      res.status(500).json({
        success: false,
        message: "에이전트 파일 업로드 중 오류가 발생했습니다.",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // User file upload endpoint
  app.post("/api/admin/users/upload", requireMasterAdmin, (req, res, next) => {
    console.log('📁 사용자 파일 업로드 요청 시작');
    
    userUpload.single('file')(req, res, (err) => {
      if (err) {
        console.log('❌ 파일 업로드 multer 오류:', {
          error: err.message,
          code: err.code,
          field: err.field
        });
        
        // Check if it's a file validation error
        if (err.message && err.message.includes('지원되지 않는 파일 형식')) {
          return res.status(400).json({ 
            message: err.message,
            details: 'Excel(.xlsx, .xls) 또는 CSV(.csv) 파일만 업로드 가능합니다.',
            supported_formats: ['.xlsx', '.xls', '.csv']
          });
        }
        
        // Other multer errors
        return res.status(400).json({ 
          message: '파일 업로드 중 오류가 발생했습니다.',
          error: err.message 
        });
      }
      
      // Continue with file processing
      next();
    });
  }, async (req, res) => {
    try {
      console.log('📋 사용자 파일 처리 시작');
      
      if (!req.file) {
        console.log('❌ 업로드된 파일이 없음');
        return res.status(400).json({ message: "업로드된 파일이 없습니다." });
      }

      console.log('✅ 파일 업로드 성공:', {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });

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

        const { default: XLSX } = await import('xlsx');
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

        // Create column mapping for Korean headers
        const columnMapping: { [key: string]: string } = {
          '사용자ID': 'username',
          '이름': 'name',
          '이메일': 'email',
          '상위카테고리': 'upperCategory',
          '하위카테고리': 'lowerCategory',
          '세부카테고리': 'detailCategory',
          '직책': 'position',
          '상태': 'status',
          '시스템 역할': 'userType',
          'username': 'username',
          'firstName': 'firstName',
          'lastName': 'lastName',
          'name': 'name',
          'email': 'email',
          'userType': 'userType',
          'upperCategory': 'upperCategory',
          'lowerCategory': 'lowerCategory',
          'detailCategory': 'detailCategory',
          'position': 'position'
        };

        // Process each row
        for (let i = 1; i < jsonData.length; i++) {
          const values = jsonData[i] as any[];
          if (values && values.length > 0 && values.some(v => v !== null && v !== undefined && v !== '')) {
            const user: any = {};
            
            headers.forEach((header, index) => {
              if (header && values[index] !== undefined && values[index] !== null && values[index] !== '') {
                const mappedField = columnMapping[header.toString().trim()];
                if (mappedField) {
                  user[mappedField] = values[index].toString().trim();
                }
              }
            });

            // Extract name parts if full name is provided
            if (user.name && !user.firstName && !user.lastName) {
              const nameParts = user.name.trim().split(' ');
              if (nameParts.length >= 2) {
                user.firstName = nameParts[0];
                user.lastName = nameParts.slice(1).join(' ');
              }
            }

            // Generate username if not provided
            if (!user.username && user.name) {
              user.username = user.name.replace(/\s+/g, '') + Math.floor(Math.random() * 1000);
            }

            // Determine user type from role/position
            if (!user.userType) {
              if (user.position && (user.position.includes('교수') || user.position.includes('Professor') || user.position.includes('교직원'))) {
                user.userType = 'faculty';
              } else {
                user.userType = 'student';
              }
            }

            // Validate required fields and create user
            if (user.username && (user.name || (user.firstName && user.lastName))) {
              const fullName = user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim();
              
              users.push({
                id: user.username,
                username: user.username,
                firstName: user.firstName || fullName.split(' ')[0] || null,
                lastName: user.lastName || fullName.split(' ').slice(1).join(' ') || null,
                email: user.email || `${user.username}@university.ac.kr`,
                name: fullName,
                password: 'defaultPassword123',
                userType: user.userType,
                role: user.userType === 'faculty' ? 'faculty' : 'student',
                upperCategory: user.upperCategory || '로보대학교',
                lowerCategory: user.lowerCategory || (user.userType === 'faculty' ? '교직원' : '학생'),
                detailCategory: user.detailCategory || null,
                position: user.position || (user.userType === 'faculty' ? '교수' : '학생'),
                status: user.status || 'active',
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

      // Save file information for tracking
      const userFileInfo = {
        id: Date.now().toString(),
        filename: req.file.originalname,
        originalName: req.file.originalname,
        size: req.file.size,
        uploadedAt: new Date(),
        status: 'processing',
        userCount: users.length,
        path: filePath
      };

      if (validateOnly) {
        userFileInfo.status = 'validated';
        await storage.saveUserFile(userFileInfo);
        
        return res.json({
          success: true,
          message: `검증 완료: ${users.length}개 사용자 레코드가 유효합니다.`,
          userCount: users.length
        });
      }

      // Process users based on overwrite setting
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;

      if (overwriteExisting) {
        console.log('Overwrite mode: Clearing all existing users except master_admin');
        // Clear all existing users except master_admin
        const allUsers = await storage.getAllUsers();
        for (const user of allUsers) {
          if (user.id !== 'master_admin' && user.username !== 'master_admin') {
            try {
              await storage.deleteUser(user.id);
            } catch (error) {
              console.error(`Failed to delete user ${user.id}:`, error);
            }
          }
        }

        // Create all new users
        for (const userData of users) {
          try {
            await storage.createUser(userData);
            createdCount++;
          } catch (error) {
            console.error(`Failed to create user ${userData.username}:`, error);
            errorCount++;
          }
        }
      } else {
        console.log('Merge mode: Adding only new users, preserving existing');
        // Get existing users
        const existingUsers = await storage.getAllUsers();
        const existingUserIds = new Set(existingUsers.map(u => u.id));
        const existingUserEmails = new Set(existingUsers.map(u => u.email).filter(Boolean));

        for (const userData of users) {
          try {
            // Check if user already exists by ID or email
            const userExists = existingUserIds.has(userData.id) || 
                             (userData.email && existingUserEmails.has(userData.email));

            if (userExists) {
              console.log(`User ${userData.username} already exists, skipping (preserving existing data)`);
              updatedCount++; // Count as "preserved"
            } else {
              await storage.createUser(userData);
              createdCount++;
              console.log(`Created new user: ${userData.username}`);
            }
          } catch (error) {
            console.error(`Failed to process user ${userData.username}:`, error);
            errorCount++;
          }
        }
      }

      // Update file status based on results
      if (createdCount === users.length) {
        userFileInfo.status = 'applied';
      } else if (createdCount > 0) {
        userFileInfo.status = 'partially_applied';
      } else {
        userFileInfo.status = 'failed';
      }

      userFileInfo.userCount = createdCount;
      await storage.saveUserFile(userFileInfo);

      // Clean up temporary file after processing
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupError) {
        console.error('Error cleaning up temporary file:', cleanupError);
      }

      const responseMessage = overwriteExisting 
        ? `기존 사용자 데이터를 모두 삭제하고 ${createdCount}명의 새 사용자로 교체했습니다.`
        : `기존 사용자 데이터를 보존하며 ${createdCount}명의 새 사용자를 추가했습니다. ${updatedCount}명의 기존 사용자는 그대로 유지되었습니다.`;

      res.json({
        success: true,
        message: responseMessage,
        created: createdCount,
        updated: updatedCount,
        errors: errorCount,
        total: users.length,
        mode: overwriteExisting ? 'overwrite' : 'merge'
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
      const { default: XLSX } = await import('xlsx');
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

  // Organization category file upload endpoint with special file naming
  const orgUpload = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, adminUploadDir);
      },
      filename: (req, file, cb) => {
        // Generate a unique filename with org prefix for organization files
        const uniqueName = `org-${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
        cb(null, uniqueName);
      }
    }),
    limits: {
      fileSize: 50 * 1024 * 1024, // 50MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
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
        cb(new Error('지원하지 않는 파일 형식입니다. Excel 또는 CSV 파일만 업로드 가능합니다.'));
      }
    }
  });

  app.post("/api/admin/organizations/upload", requireMasterAdmin, orgUpload.single('file'), async (req, res) => {
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
        const { default: XLSX } = await import('xlsx');
        const workbook = XLSX.readFile(filePath);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          throw new Error('엑셀 파일에 데이터가 없습니다.');
        }

        // Process Excel data for organizations - clean and deduplicate
        const uniqueOrgs = new Map();

        jsonData.forEach((row: any) => {
          // Excel has hierarchy structure without name field - use detailCategory as name
          const name = row.세부카테고리 || row.detailCategory || row.조직명 || row.name;
          if (!name) return; // Skip rows without organization name

          const upperCategory = row.상위카테고리 || row.upperCategory || null;
          const lowerCategory = row.하위카테고리 || row.lowerCategory || null;
          const detailCategory = row.세부카테고리 || row.detailCategory || null;

          // Create unique key based on hierarchy
          const key = `${upperCategory || 'ROOT'}-${lowerCategory || 'NONE'}-${detailCategory || 'NONE'}-${name}`;

          if (!uniqueOrgs.has(key)) {
            uniqueOrgs.set(key, {
              name: name.trim(),
              upperCategory: upperCategory ? upperCategory.trim() : null,
              lowerCategory: lowerCategory ? lowerCategory.trim() : null,
              detailCategory: detailCategory ? detailCategory.trim() : null,
              description: row.설명 || row.description || null,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        });

        organizations = Array.from(uniqueOrgs.values());
        console.log(`Extracted ${organizations.length} unique organizations from Excel file`);

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

      // Process and create organization categories using bulk create with merge logic
      const organizationsToCreate = organizations.map(org => ({
        name: org.name,
        upperCategory: org.upperCategory,
        lowerCategory: org.lowerCategory,
        detailCategory: org.detailCategory,
        description: org.description,
        manager: org.manager || null,
        status: org.status || '활성',
        isActive: org.isActive !== false
      }));

      console.log(`Processing ${organizationsToCreate.length} organization categories with merge logic:`);
      console.log(`Overwrite existing: ${overwriteExisting}`);
      organizationsToCreate.slice(0, 5).forEach((org, i) => {
        console.log(`  ${i+1}. ${org.name} (${org.upperCategory} > ${org.lowerCategory} > ${org.detailCategory})`);
      });

      // Clear existing organizations only if explicitly requested
      if (overwriteExisting) {
        console.log('Overwrite mode: Clearing existing organization categories');
        await storage.deleteAllOrganizationCategories();
      }

      const processedCategories = await storage.bulkCreateOrganizationCategories(organizationsToCreate, overwriteExisting);

      // Count actual created vs updated
      const beforeCount = await storage.getOrganizationCategories();
      const currentCount = beforeCount.length;
      const createdCount = Math.max(0, currentCount - (overwriteExisting ? 0 : beforeCount.length - processedCategories.length));
      const updatedCount = processedCategories.length - createdCount;
      const errorCount = Math.max(0, organizations.length - processedCategories.length);

      // Verify the data was saved
      const verifyData = await storage.getOrganizationCategories();
      console.log(`Verification: ${verifyData.length} organization categories now in storage`);

      const message = overwriteExisting 
        ? `조직 카테고리가 완전히 교체되었습니다.`
        : `조직 카테고리가 안전하게 병합되었습니다. 기존 데이터는 보존되었습니다.`;

      res.json({
        success: true,
        message: message,
        created: overwriteExisting ? processedCategories.length : Math.max(0, verifyData.length - (beforeCount.length || 0)),
        updated: overwriteExisting ? 0 : Math.min(processedCategories.length, beforeCount.length || 0),
        errors: errorCount,
        total: organizations.length,
        totalInStorage: verifyData.length,
        mode: overwriteExisting ? 'overwrite' : 'merge'
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

  // Get organization category files
  app.get("/api/admin/organization-files", requireMasterAdmin, async (req, res) => {
    try {
      // Get organization files from storage instead of filesystem scanning
      const organizationFiles = await storage.getOrganizationFiles();

      console.log(`Found ${organizationFiles.length} organization files in storage`);

      // Sort by upload date (newest first)
      organizationFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

      res.json(organizationFiles);
    } catch (error) {
      console.error('Error fetching organization files:', error);
      res.status(500).json({ error: 'Failed to fetch organization files' });
    }
  });

  // Delete organization category file
  app.delete("/api/admin/organization-files/:fileName", requireMasterAdmin, async (req, res) => {
    try {
      const fileName = decodeURIComponent(req.params.fileName);
      const filePath = path.join(process.cwd(), 'uploads', 'admin', fileName);

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "파일을 찾을 수 없습니다" });
      }

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        message: "파일이 성공적으로 삭제되었습니다"
      });
    } catch (error) {
      console.error("Error deleting organization file:", error);
      res.status(500).json({ message: "파일 삭제에 실패했습니다" });
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
      const { default: XLSX } = await import('xlsx');
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // ID
        { wch: 15 }, // 사용자명
        { wch: 20 }, // 이름        { wch: 30 }, // 이메일
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

  // Document existence check endpoint
  app.head("/api/admin/documents/:id", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      console.log(`Checking document existence for ID: ${documentId}`);

      if (isNaN(documentId)) {
        console.log("Invalid document ID provided");
        return res.status(400).end();        }

      const document = await storage.getDocument(documentId);
      console.log(`Document found:`, document ? `${document.originalName} (ID: ${document.id})` : 'null');

      if (!document) {
        return res.status(404).end();
      }

      res.status(200).end();
    } catch (error) {
      console.error("Error checking document:", error);
      res.status(500).end();
    }
  });

  // Document preview endpoint
  app.get("/api/admin/documents/:id/preview", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      console.log(`Document preview requested for ID: ${documentId}`);

      if (isNaN(documentId)) {
        console.log("Invalid document ID for preview");
        return res.status(400).send(`
          <!DOCTYPE html>
          <html><head><meta charset="UTF-8"><title>오류</title></head>
          <body><h1>잘못된 문서 ID입니다</h1></body></html>
        `);
      }

      const document = await storage.getDocument(documentId);
      console.log(`Document for preview:`, document ? `${document.originalName} (Size: ${document.size})` : 'not found');

      if (!document) {
        return res.status(404).send(`
          <!DOCTYPE html>
          <html lang="ko">
          <head><meta charset="UTF-8"><title>문서를 찾을 수 없음</title></head>
          <body>
            <div style="padding: 20px; font-family: Arial, sans-serif;">
              <h1>문서를 찾을 수 없습니다</h1>
              <p>요청하신 문서(ID: ${documentId})를 찾을 수 없습니다.</p>
            </div>
          </body>
          </html>
        `);
      }

      // Set proper headers for Korean text with UTF-8 BOM
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      // Ensure content is properly decoded as UTF-8
      let documentContent = document.content || '내용을 불러올 수 없습니다.';

      // Try to fix encoding issues if content appears to be corrupted
      try {
        // Check if content needs UTF-8 conversion
        if (typeof documentContent === 'string') {
          // Convert any potential encoding issues
          documentContent = Buffer.from(documentContent, 'utf8').toString('utf8');
        }
      } catch (error) {
        console.log('Content encoding conversion failed, using original:', error);
      }

      // Safely encode the document name and content for HTML
      const safeDocumentName = (document.originalName || '제목 없음').replace(/[<>&"']/g, (match) => {
        const htmlEntities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
        return htmlEntities[match as keyof typeof htmlEntities];
      });

      const safeContent = documentContent.replace(/[<>&"']/g, (match) => {
        const htmlEntities = { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#x27;' };
        return htmlEntities[match as keyof typeof htmlEntities];
      }).replace(/\n/g, '<br>');

      // Create HTML response with proper encoding for Korean text
      const htmlContent = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeDocumentName}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
    body {
      font-family: 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', 'Nanum Gothic', sans-serif;
      line-height: 1.8;
      margin: 20px;
      background-color: #f5f5f5;
      color: #333;
      word-break: keep-all;
      overflow-wrap: break-word;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header {
      border-bottom: 2px solid #e0e0e0;
      margin-bottom: 20px;
      padding-bottom: 15px;
    }
    .title {
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .meta {
      color: #666;
      font-size: 14px;
      margin: 5px 0;
    }
    .content {
      white-space: pre-wrap;
      word-wrap: break-word;
      word-break: keep-all;
      overflow-wrap: break-word;
      font-size: 16px;
      line-height: 1.8;
      max-height: 600px;
      overflow-y: auto;
      padding: 15px;
      background-color: #fafafa;
      border: 1px solid #e0e0e0;
      border-radius: 5px;
      font-family: 'Noto Sans KR', '맑은 고딕', 'Malgun Gothic', sans-serif;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="title">${safeDocumentName}</div>
      <div class="meta">파일 크기: ${(document.size / 1024 / 1024).toFixed(2)} MB</div>
      <div class="meta">업로드 날짜: ${new Date(document.createdAt).toLocaleDateString('ko-KR')}</div>
      <div class="meta">파일 형식: ${document.mimeType && document.mimeType.includes('word') ? 'Word' : 
                                     document.mimeType && document.mimeType.includes('pdf') ? 'PDF' :
                                     document.mimeType && document.mimeType.includes('excel') ? 'Excel' :
                                     document.mimeType && document.mimeType.includes('powerpoint') ? 'PowerPoint' : 'Document'}</div>
    </div>
    <div class="content">${safeContent}</div>
  </div>
</body>
</html>`;

      console.log(`Sending preview HTML for document: ${document.originalName}`);

      // Send with UTF-8 BOM to ensure proper Korean character encoding
      const utf8BOM = '\uFEFF';
      const finalContent = utf8BOM + htmlContent;

      res.send(finalContent);

    } catch (error) {
      console.error("Error previewing document:", error);
      res.status(500).send(`
        <!DOCTYPE html>
        <html lang="ko">
        <head><meta charset="UTF-8"><title>미리보기 오류</title></head>
        <body>
          <div style="padding: 20px; font-family: Arial, sans-serif;">
            <h1>문서 미리보기 오류</h1>
            <p>문서 미리보기 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}</p>
          </div>
        </body>
        </html>
      `);
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

  // Document reprocess endpoint - fix encoding for existing documents
  app.post("/api/admin/documents/:id/reprocess", requireMasterAdmin, async (req, res) => {
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }

      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "문서를 찾을 수 없습니다" });
      }

      // Check if file exists
      const filePath = path.join(adminUploadDir, document.filename);
      if (fs.existsSync(filePath)) {
        return res.status(404).json({ message: "파일을 찾을 수 없습니다" });
      }

      console.log(`Reprocessing document: ${document.originalName}`);

      // Re-extract text content using improved extraction
      let reprocessedText = '';
      try {
        reprocessedText = await extractTextFromContent(filePath, document.mimeType);
        console.log("Reprocessed text preview:", reprocessedText.substring(0, 200));
      } catch (extractError) {
        console.error("Failed to reprocess document:", extractError);
        return res.status(500).json({ message: "문서 재처리에 실패했습니다" });
      }

      // Update document content in storage
      await storage.updateDocument(documentId, { content: reprocessedText });

      res.json({
        success: true,
        message: "문서가 성공적으로 재처리되었습니다",
        textLength: reprocessedText.length
      });

    } catch (error) {
      console.error("Error reprocessing document:", error);
      res.status(500).json({ message: "문서 재처리 중 오류가 발생했습니다" });
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
      console.log('=== Organization category upload request received ===');
      const files = req.files;
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "파일이 선택되지 않았습니다." });
      }

      const { overwriteExisting, validateOnly } = req.body;
      console.log('Upload options:', { overwriteExisting, validateOnly });

      let totalOrganizations: any[] = [];
      const processResults: any[] = [];

      // Process each file
      for (const file of files) {
        try {
          console.log(`\n--- Processing file: ${file.originalname} ---`);
          console.log(`File size: ${file.buffer.length} bytes`);
          console.log(`File MIME type: ${file.mimetype}`);

          let organizations: any[] = [];
          const fileName = file.originalname.toLowerCase();

          if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Excel file processing
            console.log('Processing as Excel file...');
            const { default: XLSX } = await import('xlsx');
            const workbook = XLSX.read(file.buffer, { type: 'buffer' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];

            // Convert to JSON with first row as headers
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
            console.log(`Extracted ${jsonData.length} rows from Excel`);

            if (jsonData.length < 2) {
              console.log('Not enough data in Excel file');
              continue;
            }

            // Get headers and data rows
            const headers = jsonData[0];
            const dataRows = jsonData.slice(1);

            console.log('Headers:', headers);
            console.log('Sample data row:', dataRows[0]);

            // Process each data row
            for (let i = 0; i < dataRows.length; i++) {
              const row = dataRows[i];
              if (!row || row.length === 0) continue;

              // Create organization object with flexible field mapping
              const org: any = {};
              headers.forEach((header: any, index: number) => {
                if (header && row[index] !== undefined && row[index] !== null && row[index] !== '') {
                  org[header] = row[index].toString().trim();
                }
              });

              // Handle new header format: 상위조직, 하위조직, 세부조직
              const upperOrg = org['상위조직'] || org['상위카테고리'] || org['상위조직명'] || org['대학'] || org['upperCategory'];
              const lowerOrg = org['하위조직'] || org['하위카테고리'] || org['하위조직명'] || org['단과대학'] || org['학부'] || org['lowerCategory'];
              const detailOrg = org['세부조직'] || org['세부카테고리'] || org['세부조직명'] || org['학과'] || org['전공'] || org['detailCategory'];
              const status = org['상태'] || org['status'] || '활성';

              // Process organizations based on hierarchy level
              if (detailOrg) {
                // Create detail organization with full hierarchy
                organizations.push({
                  name: detailOrg,
                  upperCategory: upperOrg || null,
                  lowerCategory: lowerOrg || null,
                  detailCategory: detailOrg,
                  description: `세부 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
                console.log(`Processed detail org ${i + 1}: ${upperOrg} > ${lowerOrg} > ${detailOrg}`);
              } else if (lowerOrg) {
                // Create lower organization
                organizations.push({
                  name: lowerOrg,
                  upperCategory: upperOrg || null,
                  lowerCategory: lowerOrg,
                  detailCategory: null,
                  description: `하위 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
                console.log(`Processed lower org ${i + 1}: ${upperOrg} > ${lowerOrg}`);
              } else if (upperOrg) {
                // Create upper organization
                organizations.push({
                  name: upperOrg,
                  upperCategory: null,
                  lowerCategory: null,
                  detailCategory: null,
                  description: `상위 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
                console.log(`Processed upper org ${i + 1}: ${upperOrg}`);
              } else {
                // Handle legacy single organization name for backward compatibility
                const name = org['조직명'] || org['대학명'] || org['학과명'] || org['조직'] || 
                            org['name'] || org['Name'] || org['조직 명'] || org['기관명'];

                if (name) {
                  organizations.push({
                    name: name,
                    upperCategory: null,
                    lowerCategory: null,
                    detailCategory: null,
                    description: (org['설명'] || org['description'])?.toString()?.trim() || null,
                    status: status,
                    isActive: status === '활성'
                  });
                  console.log(`Processed single org ${i + 1}: ${name}`);
                }
              }
            }

          } else if (fileName.endsWith('.csv')) {
            // CSV file processing
            console.log('Processing as CSV file...');
            const csvText = file.buffer.toString('utf-8');
            const lines = csvText.split('\n').filter(line => line.trim() !== '');

            if (lines.length < 2) {
              console.log('Not enough data in CSV file');
              continue;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
            console.log('CSV Headers:', headers);

            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
              const org: any = {};

              headers.forEach((header, index) => {
                org[header] = values[index] || null;
              });

              // Handle new CSV header format: 상위조직, 하위조직, 세부조직
              const upperOrg = org['상위조직']?.toString()?.trim() || org['상위카테고리']?.toString()?.trim();
              const lowerOrg = org['하위조직']?.toString()?.trim() || org['하위카테고리']?.toString()?.trim();
              const detailOrg = org['세부조직']?.toString()?.trim() || org['세부카테고리']?.toString()?.trim();
              const status = org['상태']?.toString()?.trim() || '활성';

              // Process organizations based on hierarchy level
              if (detailOrg) {
                // Create detail organization with full hierarchy
                organizations.push({
                  name: detailOrg,
                  upperCategory: upperOrg || null,
                  lowerCategory: lowerOrg || null,
                  detailCategory: detailOrg,
                  description: `세부 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
              } else if (lowerOrg) {
                // Create lower organization
                organizations.push({
                  name: lowerOrg,
                  upperCategory: upperOrg || null,
                  lowerCategory: lowerOrg,
                  detailCategory: null,
                  description: `하위 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
              } else if (upperOrg) {
                // Create upper organization
                organizations.push({
                  name: upperOrg,
                  upperCategory: null,
                  lowerCategory: null,
                  detailCategory: null,
                  description: `상위 조직 (${status})`,
                  status: status,
                  isActive: status === '활성'
                });
              } else {
                // Handle legacy single organization name for backward compatibility
                const name = org['조직명'] || org['대학명'] || org['학과명'] || org['조직'] || 
                            org['name'] || org['Name'] || org['조직 명'] || org['기관명'];

                if (name && name.toString().trim()) {
                  organizations.push({
                    name: name.toString().trim(),
                    upperCategory: null,
                    lowerCategory: null,
                    detailCategory: null,
                    description: (org['설명'] || org['description'])?.toString()?.trim() || null,
                    status: status,
                    isActive: status === '활성'
                  });
                }
              }
            }
          }

          console.log(`Extracted ${organizations.length} valid organizations from ${file.originalname}`);
          totalOrganizations = totalOrganizations.concat(organizations);

          processResults.push({
            filename: file.originalname,
            processed: organizations.length,
            skipped: 0,
            success: true
          });

        } catch (fileError) {
          console.error(`Error processing file ${file.originalname}:`, fileError);
          processResults.push({
            filename: file.originalname,
            error: fileError instanceof Error ? fileError.message : 'Unknown error',
            processed: 0,
            skipped: 0,
            success: false
          });
        }
      }

      console.log(`\n=== Total organizations extracted: ${totalOrganizations.length} ===`);

      if (totalOrganizations.length === 0) {
        return res.status(400).json({
          success: false,
          message: '업로드된 파일에서 유효한 조직 데이터를 찾을 수 없습니다.',
          results: processResults
        });
      }

      if (validateOnly === 'true') {
        return res.json({
          success: true,
          message: `검증 완료: ${totalOrganizations.length}개 조직이 유효합니다.`,
          validated: totalOrganizations.length,
          preview: totalOrganizations.slice(0, 5),
          results: processResults
        });
      }

      // Save to storage with proper merge logic
      console.log('Saving organizations to storage...');
      const shouldOverwrite = overwriteExisting === 'true';

      if (shouldOverwrite) {
        console.log('Overwrite mode: Will replace all existing organization categories');
        await storage.deleteAllOrganizationCategories();
      } else {
        console.log('Merge mode: Will preserve existing organization categories and merge new data');
      }

      const processedOrganizations = await storage.bulkCreateOrganizationCategories(totalOrganizations, shouldOverwrite);
      console.log(`Successfully processed ${processedOrganizations.length} organizations to storage`);

      // Record each uploaded organization file with status
      for (const file of files) {
        // Fix Korean filename encoding
        let originalName = file.originalname;
        try {
          originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (encodingError) {
          console.log('Using original filename as-is');
        }

        const orgFileRecord = {
          fileName: file.filename,
          originalName: originalName,
          uploadedAt: new Date(),
          size: file.size,
          type: 'organization',
          status: shouldOverwrite ? 'replaced' : 'merged', // 작업 모드 표시
          organizationsCount: processedOrganizations.length
        };

        // Save organization file metadata
        await storage.saveOrganizationFileRecord(orgFileRecord);
        console.log(`Organization file record saved: ${orgFileRecord.originalName}`);
      }

      // Verify storage
      const allOrgs = await storage.getOrganizationCategories();
      console.log(`Storage now contains ${allOrgs.length} total organizations`);

      const responseMessage = shouldOverwrite 
        ? '조직 카테고리가 완전히 교체되었습니다.'
        : '조직 카테고리가 안전하게 병합되었습니다. 기존 데이터는 보존되었습니다.';

      res.json({
        success: true,
        message: responseMessage,
        created: shouldOverwrite ? processedOrganizations.length : Math.max(0, allOrgs.length - (totalOrganizations.length || 0)),
        updated: shouldOverwrite ? 0 : Math.min(processedOrganizations.length, allOrgs.length - processedOrganizations.length),
        totalInStorage: allOrgs.length,
        mode: shouldOverwrite ? 'overwrite' : 'merge',
        organizations: processedOrganizations.slice(0, 10), // Return first 10
        results: processResults
      });

    } catch (error) {
      console.error('Organization category upload error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '조직 카테고리 업로드 중 오류가 발생했습니다.'
      });
    }
  });

  // Document upload endpoint
  app.post("/api/admin/documents/upload", requireMasterAdmin, adminUpload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { type, description } = req.body;

      if (!file) {
        return res.status(400).json({ message: "파일이 업로드되지 않았습니다." });
      }

      console.log(`Processing document upload: ${file.originalname}`);
      console.log(`File size: ${file.size} bytes, MIME type: ${file.mimetype}`);

      // Fix Korean filename encoding
      let originalName = file.originalname;
      try {
        originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch (encodingError) {
        console.log('Using original filename as-is');
      }

      // Validate file type
      const allowedTypes = [
        'text/plain',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      const fileExtension = path.extname(originalName).toLowerCase();
      const allowedExtensions = ['.txt', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];

      if (!allowedTypes.includes(file.mimetype) && !allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({ 
          message: "지원하지 않는 파일 형식입니다. TXT, PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX 파일만 업로드 가능합니다." 
        });
      }

      // Create document record
      const document = {
        name: originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        type: type || 'general',
        description: description || '',
        uploadedAt: new Date(),
        path: file.path
      };

      // Save to storage
      const savedDocument = await storage.createDocument(document);

      console.log(`Document saved successfully: ${savedDocument.name} (ID: ${savedDocument.id})`);

      res.json({
        success: true,
        message: '문서가 성공적으로 업로드되었습니다.',
        document: savedDocument
      });

    } catch (error) {
      console.error('Document upload error:', error);

      // Clean up file on error
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '문서 업로드 중 오류가 발생했습니다.'
      });
    }
  });

  // Update organization category endpoint
  app.patch("/api/admin/organizations/:id", requireMasterAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      console.log(`Updating organization category ${id} with data:`, updateData);

      // Ensure manager field is properly handled
      const updateDataProcessed = {
        ...updateData,
        manager: updateData.manager || null,
        updatedAt: new Date()
      };

      // Update the organization category in storage
      const updatedCategory = await storage.updateOrganizationCategory(parseInt(id), updateDataProcessed);

      if (!updatedCategory) {
        return res.status(404).json({ message: "Organization category not found" });
      }

      console.log(`Organization category updated successfully: ${id}`);

      res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating organization category:", error);
      res.status(500).json({ message: "Failed to update organization category" });
    }
  });

  // User file management endpoints
  app.get("/api/admin/user-files", requireMasterAdmin, async (req, res) => {
    try {
      const userFiles = await storage.getUserFiles();
      
      // Sort by upload date, newest first
      const sortedFiles = userFiles.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      );

      const formattedFiles = sortedFiles.map(file => ({
        id: file.id,
        filename: file.originalName,
        originalName: file.originalName,
        size: file.size,
        uploadedAt: file.uploadedAt,
        status: file.status,
        userCount: file.userCount || 0,
        statusText: getStatusText(file.status)
      }));

      res.json(formattedFiles);
    } catch (error) {
      console.error("Error fetching user files:", error);
      res.status(500).json({ message: "Failed to fetch user files" });
    }
  });

  app.delete("/api/admin/user-files/:id", requireMasterAdmin, async (req, res) => {
    try {
      const fileId = req.params.id;
      await storage.deleteUserFile(fileId);
      
      res.json({
        success: true,
        message: "파일이 성공적으로 삭제되었습니다."
      });
    } catch (error) {
      console.error("Error deleting user file:", error);
      res.status(500).json({ message: "Failed to delete user file" });
    }
  });

  function getStatusText(status: string): string {
    switch (status) {
      case 'applied': return '최종 반영됨';
      case 'validated': return '검증됨';
      case 'partially_applied': return '부분 반영됨';
      case 'failed': return '미반영';
      case 'processing': return '처리 중';
      default: return '알 수 없음';
    }
  }
}