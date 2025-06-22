import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use standard PostgreSQL driver instead of Neon serverless
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Add connection error handling
pool.on('error', (err) => {
  console.warn('Database pool error:', err.message);
});

export const db = drizzle(pool, { schema });

// Test database connection with retry logic
export async function testDatabaseConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT 1 as test');
      client.release();
      
      if (result.rows[0]?.test === 1) {
        console.log('Database connection successful');
        return true;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`Database connection attempt ${i + 1} failed:`, errorMessage);
      
      // If it's a Neon endpoint disabled error, don't retry
      if (errorMessage.includes('endpoint is disabled')) {
        console.error('Neon database endpoint is disabled - this requires manual intervention');
        return false;
      }
      
      if (i === retries - 1) {
        console.error('All database connection attempts failed');
        return false;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
  return false;
}

// Initialize database schema if connection is available
export async function initializeDatabase(): Promise<boolean> {
  try {
    const client = await pool.connect();
    
    // Create basic tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        icon VARCHAR(255) DEFAULT 'User',
        background_color VARCHAR(50) DEFAULT 'blue',
        is_active BOOLEAN DEFAULT true,
        is_custom_icon BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    client.release();
    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize database schema:', errorMessage);
    return false;
  }
}