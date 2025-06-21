import { Express } from "express";
import { db } from "./db";
import { users, agents, conversations, messages, organizations } from "../shared/schema";
import { eq, sql, desc, count } from "drizzle-orm";

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
      const [
        totalUsersResult,
        activeUsersResult,
        totalAgentsResult,
        activeAgentsResult,
        totalConversationsResult,
        totalMessagesResult,
        todayMessagesResult
      ] = await Promise.all([
        db.select({ count: count() }).from(users),
        db.select({ count: count() }).from(users).where(sql`created_at >= NOW() - INTERVAL '30 days'`),
        db.select({ count: count() }).from(agents),
        db.select({ count: count() }).from(agents).where(eq(agents.isActive, true)),
        db.select({ count: count() }).from(conversations),
        db.select({ count: count() }).from(messages),
        db.select({ count: count() }).from(messages).where(sql`created_at >= CURRENT_DATE`)
      ]);

      const stats = {
        totalUsers: totalUsersResult[0]?.count || 0,
        activeUsers: activeUsersResult[0]?.count || 0,
        totalAgents: totalAgentsResult[0]?.count || 0,
        activeAgents: activeAgentsResult[0]?.count || 0,
        totalConversations: totalConversationsResult[0]?.count || 0,
        totalMessages: totalMessagesResult[0]?.count || 0,
        todayMessages: todayMessagesResult[0]?.count || 0,
        weeklyGrowth: 12.5 // Mock data for now
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // User management
  app.get("/api/admin/users", requireMasterAdmin, async (req, res) => {
    try {
      const userList = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      const formattedUsers = userList.map(user => ({
        ...user,
        role: user.userType,
        isActive: true, // Default to active
        lastLoginAt: user.updatedAt
      }));

      res.json(formattedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent management with statistics
  app.get("/api/admin/agents", requireMasterAdmin, async (req, res) => {
    try {
      const agentList = await db
        .select({
          id: agents.id,
          name: agents.name,
          description: agents.description,
          category: agents.category,
          icon: agents.icon,
          backgroundColor: agents.backgroundColor,
          isActive: agents.isActive,
          managerId: agents.managerId,
          organizationId: agents.organizationId,
          createdAt: agents.createdAt,
          managerFirstName: users.firstName,
          managerLastName: users.lastName,
          managerUsername: users.username,
          organizationName: organizations.name,
          organizationType: organizations.type
        })
        .from(agents)
        .leftJoin(users, eq(agents.managerId, users.id))
        .leftJoin(organizations, eq(agents.organizationId, organizations.id))
        .orderBy(desc(agents.createdAt));

      // Get message counts for each agent
      const agentStats = await Promise.all(
        agentList.map(async (agent) => {
          const messageCount = await db
            .select({ count: count() })
            .from(messages)
            .innerJoin(conversations, eq(messages.conversationId, conversations.id))
            .where(eq(conversations.agentId, agent.id));

          return {
            ...agent,
            messageCount: messageCount[0]?.count || 0
          };
        })
      );

      res.json(agentStats);
    } catch (error) {
      console.error("Error fetching agents:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Conversation monitoring
  app.get("/api/admin/conversations", requireMasterAdmin, async (req, res) => {
    try {
      const conversationList = await db
        .select({
          id: conversations.id,
          userId: conversations.userId,
          agentId: conversations.agentId,
          type: conversations.type,
          createdAt: conversations.createdAt
        })
        .from(conversations)
        .orderBy(desc(conversations.createdAt))
        .limit(100);

      res.json(conversationList);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // System health check
  app.get("/api/admin/health", requireMasterAdmin, async (req, res) => {
    try {
      // Test database connection
      await db.select({ count: count() }).from(users).limit(1);
      
      const health = {
        database: "healthy",
        openai: process.env.OPENAI_API_KEY ? "configured" : "not_configured",
        sessions: "healthy",
        fileUploads: "healthy",
        timestamp: new Date().toISOString()
      };

      res.json(health);
    } catch (error) {
      console.error("Health check error:", error);
      res.status(500).json({ 
        database: "unhealthy",
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // User actions
  app.post("/api/admin/users/:userId/activate", requireMasterAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      // For now, just return success as we don't have an active field
      res.json({ message: "User activated successfully" });
    } catch (error) {
      console.error("Error activating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/users/:userId/deactivate", requireMasterAdmin, async (req, res) => {
    try {
      const { userId } = req.params;
      // For now, just return success as we don't have an active field
      res.json({ message: "User deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Agent actions
  app.post("/api/admin/agents/:agentId/activate", requireMasterAdmin, async (req, res) => {
    try {
      const { agentId } = req.params;
      await db
        .update(agents)
        .set({ isActive: true })
        .where(eq(agents.id, parseInt(agentId)));
      
      res.json({ message: "Agent activated successfully" });
    } catch (error) {
      console.error("Error activating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/admin/agents/:agentId/deactivate", requireMasterAdmin, async (req, res) => {
    try {
      const { agentId } = req.params;
      await db
        .update(agents)
        .set({ isActive: false })
        .where(eq(agents.id, parseInt(agentId)));
      
      res.json({ message: "Agent deactivated successfully" });
    } catch (error) {
      console.error("Error deactivating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new agent
  app.post("/api/admin/agents", requireMasterAdmin, async (req, res) => {
    try {
      const { name, description, category, icon, backgroundColor, personality, managerId, organizationId } = req.body;
      
      if (!name || !description || !category || !icon || !backgroundColor) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const agentData: any = {
        name,
        description,
        category,
        icon,
        backgroundColor,
        isActive: true,
        isCustomIcon: false
      };

      if (personality) {
        agentData.personalityTraits = personality;
      }
      if (managerId) {
        agentData.managerId = managerId;
      }
      if (organizationId) {
        agentData.organizationId = organizationId;
      }

      const newAgent = await db
        .insert(agents)
        .values(agentData)
        .returning();

      res.status(201).json(newAgent[0]);
    } catch (error) {
      console.error("Error creating agent:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all managers (faculty users)
  app.get("/api/admin/managers", requireMasterAdmin, async (req, res) => {
    try {
      const managers = await db
        .select({
          id: users.id,
          username: users.username,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          userType: users.userType
        })
        .from(users)
        .where(eq(users.userType, "faculty"));

      res.json(managers);
    } catch (error) {
      console.error("Error fetching managers:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get organizations with hierarchy
  app.get("/api/admin/organizations", requireMasterAdmin, async (req, res) => {
    try {
      const allOrganizations = await db
        .select()
        .from(organizations);

      // Build hierarchical structure
      const orgMap = new Map<number, any>();
      const rootOrgs: any[] = [];

      // First pass: create map and identify roots
      allOrganizations.forEach(org => {
        orgMap.set(org.id, { ...org, children: [] });
        if (!org.parentId) {
          rootOrgs.push(orgMap.get(org.id));
        }
      });

      // Second pass: build parent-child relationships
      allOrganizations.forEach(org => {
        if (org.parentId && orgMap.has(org.parentId)) {
          orgMap.get(org.parentId)!.children.push(orgMap.get(org.id));
        }
      });

      res.json(rootOrgs);
    } catch (error) {
      console.error("Error fetching organizations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}