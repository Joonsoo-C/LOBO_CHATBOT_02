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
      const result = await pool.query('SELECT 1 as test');
      if (result.rows[0]?.test === 1) {
        console.log('Database connection successful');
        return true;
      }
    } catch (error) {
      console.warn(`Database connection attempt ${i + 1} failed:`, (error as Error).message);
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