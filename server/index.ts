import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { initializeSampleAgents } from "./initialize-sample-agents";
import { initializeSampleUsers, initializeSampleOrganizations } from "./initialize-sample-users";

const app = express();

// Store connected SSE clients
const sseClients = new Set<any>();

// SSE endpoint for real-time updates
app.get('/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Add client to the set
  sseClients.add(res);
  console.log('SSE client connected, total clients:', sseClients.size);

  // Send initial connection message
  res.write('data: {"type":"connected"}\n\n');

  // Handle client disconnect
  req.on('close', () => {
    sseClients.delete(res);
    console.log('SSE client disconnected, remaining clients:', sseClients.size);
  });
});

// Broadcast function for sending updates to all clients
export function broadcastAgentUpdate(agentId: number, updateData: any) {
  const message = JSON.stringify({
    type: 'agent_update',
    agentId,
    data: updateData
  });
  
  const messageData = `data: ${message}\n\n`;
  
  sseClients.forEach((client) => {
    try {
      client.write(messageData);
    } catch (error) {
      // Remove dead connections
      sseClients.delete(client);
    }
  });
  
  console.log(`Broadcasted agent update for agent ${agentId} to ${sseClients.size} clients`);
}

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

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

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
  const httpServer = await registerRoutes(app);

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
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  httpServer.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);

    // System now uses admin center managed database files only
    console.log("LoBo AI messenger now using admin center managed database files");
  });

  // Skip all sample data initialization - using admin center managed database files only
  console.log("LoBo AI messenger integrated with admin center managed database files");
})();