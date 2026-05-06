import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from './schema';
import bcrypt from 'bcryptjs';

const dbPath = path.join(process.cwd(), 'ota.db');
const sqlite = new Database(dbPath);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = drizzle(sqlite, { schema });

// Initialize default admin user if no users exist
try {
  const userCount = sqlite.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count === 0) {
    // Generate sync hash for the setup phase to avoid async/await issues at the module level
    const defaultPasswordHash = bcrypt.hashSync('admin', 10);
    sqlite.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
          .run('admin', defaultPasswordHash, 'admin');
    console.log('Default admin user created (admin / admin)');
  }
} catch (e) {
  // Ignore errors if the table doesn't exist yet, it will be handled if migrations are run
}

export default db;

// Re-export types for backward compatibility with other files
export type { User, App, Version, UserApp } from './schema';
