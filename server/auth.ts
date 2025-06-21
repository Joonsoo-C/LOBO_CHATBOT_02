import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

async function comparePasswords(supplied: string, stored: string) {
  return await bcrypt.compare(supplied, stored);
}

export function setupAuth(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !user.password || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, firstName, lastName, email, userType } = req.body;
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "사용자가 이미 존재합니다" });
      }

      const hashedPassword = await hashPassword(password);
      const user = await storage.createUser({
        id: username, // 학번/교번을 ID로 사용
        username,
        password: hashedPassword,
        firstName,
        lastName,
        email,
        userType: userType || "student",
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ 
          id: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          userType: user.userType
        });
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "회원가입 중 오류가 발생했습니다" });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as SelectUser;
    res.status(200).json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType
    });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    res.json({
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      userType: user.userType
    });
  });

  // Master Admin API endpoints
  app.get("/api/admin/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (user.username !== "master_admin") return res.sendStatus(403);

    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error("Failed to get system stats:", error);
      res.status(500).json({ message: "Failed to get system stats" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (user.username !== "master_admin") return res.sendStatus(403);

    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Failed to get users:", error);
      res.status(500).json({ message: "Failed to get users" });
    }
  });

  app.get("/api/admin/agents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (user.username !== "master_admin") return res.sendStatus(403);

    try {
      const agents = await storage.getAgentsWithStats();
      res.json(agents);
    } catch (error) {
      console.error("Failed to get agents:", error);
      res.status(500).json({ message: "Failed to get agents" });
    }
  });

  app.post("/api/admin/agents", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    if (user.username !== "master_admin") return res.sendStatus(403);

    try {
      const { name, description, category, icon, backgroundColor, personality, chatbotType, llmModel } = req.body;
      
      if (!name || !description || !category || !icon || !backgroundColor) {
        return res.status(400).json({ message: "Required fields missing" });
      }

      const agent = await storage.createAgent({
        name,
        description,
        category,
        icon,
        backgroundColor,
        personalityTraits: personality || "친절하고 전문적인 성격으로 정확한 정보를 제공",
        chatbotType: chatbotType || "general-llm",
        llmModel: llmModel || "gpt-4o",
        isActive: true,
        managerId: user.id,
      });

      res.json(agent);
    } catch (error) {
      console.error("Failed to create agent:", error);
      res.status(500).json({ message: "Failed to create agent" });
    }
  });
}

export const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};