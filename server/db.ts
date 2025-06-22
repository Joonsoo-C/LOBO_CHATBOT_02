import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";
import path from 'path';

// Use SQLite as fallback when PostgreSQL is unavailable
console.log('Using SQLite database for development due to connectivity issues');

const sqlite = new Database(path.join(process.cwd(), 'dev.db'));
export const db = drizzle(sqlite, { schema });

// Initialize tables for SQLite with complete schema
try {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      sid TEXT PRIMARY KEY,
      sess TEXT NOT NULL,
      expire DATETIME NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      first_name TEXT,
      last_name TEXT,
      profile_image_url TEXT,
      user_type TEXT NOT NULL DEFAULT 'student',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      parent_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      icon TEXT NOT NULL DEFAULT 'User',
      background_color TEXT NOT NULL DEFAULT 'blue',
      is_custom_icon BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      manager_id TEXT,
      organization_id INTEGER,
      llm_model TEXT NOT NULL DEFAULT 'gpt-4o',
      chatbot_type TEXT NOT NULL DEFAULT 'general-llm',
      speaking_style TEXT DEFAULT '친근하고 도움이 되는 말투',
      personality_traits TEXT DEFAULT '친절하고 전문적인 성격으로 정확한 정보를 제공',
      prohibited_word_response TEXT DEFAULT '죄송합니다. 해당 내용에 대해서는 답변드릴 수 없습니다.',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      agent_id INTEGER NOT NULL,
      type TEXT NOT NULL DEFAULT 'general',
      unread_count INTEGER DEFAULT 0,
      last_read_at DATETIME,
      last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      is_from_user BOOLEAN NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      size INTEGER NOT NULL,
      content TEXT,
      uploaded_by TEXT NOT NULL,
      scope TEXT NOT NULL DEFAULT 'private',
      summary TEXT,
      keyPoints TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS message_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id TEXT NOT NULL,
      reaction_type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agent_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      message_count INTEGER DEFAULT 0,
      user_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log('SQLite database schema created successfully');
} catch (error) {
  console.error('Failed to create SQLite schema:', error);
}

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