import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Use SQLite as fallback when PostgreSQL is unavailable
console.log('Using SQLite database for development due to connectivity issues');

const sqlite = new Database(path.join(process.cwd(), 'dev.db'));
export const db = drizzle(sqlite, { schema });

// Initialize tables for SQLite
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    icon TEXT DEFAULT 'User',
    background_color TEXT DEFAULT 'blue',
    is_active BOOLEAN DEFAULT true,
    is_custom_icon BOOLEAN DEFAULT false,
    manager_id TEXT,
    organization_id INTEGER,
    personality_traits TEXT,
    llm_model TEXT DEFAULT 'gpt-4o',
    chatbot_type TEXT DEFAULT 'general-llm',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    agent_id INTEGER NOT NULL,
    type TEXT DEFAULT 'general',
    last_message_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (agent_id) REFERENCES agents(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    role TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );
`);

// Test database connection
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const result = sqlite.prepare('SELECT 1 as test').get();
    if (result && (result as any).test === 1) {
      console.log('SQLite database connection successful');
      return true;
    }
    return false;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('SQLite database connection failed:', errorMessage);
    return false;
  }
}

// Initialize database schema if connection is available
export async function initializeDatabase(): Promise<boolean> {
  try {
    // Tables are already created in the sqlite.exec() call above
    console.log('SQLite database schema initialized successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize database schema:', errorMessage);
    return false;
  }
}

// Export sqlite instance for compatibility
export const pool = sqlite;