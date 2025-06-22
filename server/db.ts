import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Configure connection with retry logic and timeout handling
const connectionString = process.env.DATABASE_URL;
export const pool = new Pool({ 
  connectionString,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Add connection error handling
pool.on('error', (err) => {
  console.warn('Database pool error:', err.message);
});

export const db = drizzle({ client: pool, schema });

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