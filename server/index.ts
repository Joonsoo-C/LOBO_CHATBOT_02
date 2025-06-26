import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeSampleAgents } from "./initialize-sample-agents";
import { initializeSampleUsers, initializeSampleOrganizations } from "./initialize-sample-users";

const app = express();

// Enable gzip compression for better performance
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  threshold: 1024, // Only compress responses larger than 1KB
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Add support for Korean filenames in multipart forms
app.use((req, res, next) => {
  // Set proper charset for handling Korean filenames
  req.setEncoding = req.setEncoding || (() => {});
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);

    // 새 에이전트 데이터 로드
    const { storage } = await import("./storage.js");
    if (storage && typeof (storage as any).loadNewAgentData === 'function') {
      await (storage as any).loadNewAgentData();
    }
  });

  // Initialize sample data asynchronously to speed up startup
  Promise.all([
    initializeSampleAgents(),
    initializeSampleUsers(),
    initializeSampleOrganizations()
  ]).then(async () => {
    console.log("Sample data initialization completed");

    // Clean up 로보대학교 affiliated agents and replace with new agents
    const { storage } = await import("./storage.js");
    const deletedCount = await storage.deleteAgentsByOrganization('로보대학교');
    if (deletedCount > 0) {
      console.log(`🧹 Cleaned up ${deletedCount} 로보대학교 affiliated agents from system`);
    }

    // Replace all agents with new data from Final_Updated_AI_Agents_List
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      const finalAgentsPath = path.join(process.cwd(), 'final_agents.json');
      if (fs.existsSync(finalAgentsPath)) {
        console.log('🔄 기존 에이전트를 새 데이터로 교체 중...');
        
        const finalAgentsData = fs.readFileSync(finalAgentsPath, 'utf8');
        const finalAgents = JSON.parse(finalAgentsData);
        
        // Clear all existing agents first
        await storage.clearAllAgents();
        console.log('✅ 기존 에이전트 데이터 삭제 완료');
        
        // Add new agents
        let successCount = 0;
        let failCount = 0;
        
        for (const agentData of finalAgents) {
          try {
            const newAgent = {
              ...agentData,
              id: undefined, // Let storage assign new ID
              creatorId: 'system',
              createdAt: new Date(),
              updatedAt: new Date(),
              isActive: true,
              status: agentData.status || 'active'
            };
            
            await storage.createAgent(newAgent);
            successCount++;
          } catch (error) {
            console.error(`❌ 에이전트 생성 실패 (${agentData.name}):`, error.message);
            failCount++;
          }
        }
        
        console.log(`✅ 에이전트 교체 완료: ${successCount}개 성공, ${failCount}개 실패`);
        
        // Verify final count
        const allAgents = await storage.getAllAgents();
        console.log(`📊 현재 전체 에이전트 수: ${allAgents.length}개`);
        
        // Force save to persistence
        if (typeof storage.saveAgentsToPersistence === 'function') {
          await storage.saveAgentsToPersistence();
          console.log('💾 에이전트 데이터 영구 저장 완료');
        }
      }
    } catch (error) {
      console.error('❌ 에이전트 교체 중 오류:', error.message);
    }

  }).catch((error) => {
    console.error("Error during sample data initialization:", error);
  });
})();