import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.join(process.cwd(), 'ota.db');
const db = new Database(dbPath);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'user';
}

export interface App {
  id: number;
  name: string;
  package_name: string;
  platform: 'android' | 'ios';
  created_at: string;
  latest_version?: string;
}

export interface Version {
  id: number;
  app_id: number;
  version_number: string;
  build_number?: string;
  file_path: string;
  manifest_path?: string;
  changelog?: string;
  created_at: string;
}

export interface UserApp {
  user_id: number;
  app_id: number;
}

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'user')) NOT NULL DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    package_name TEXT NOT NULL,
    platform TEXT CHECK(platform IN ('android', 'ios')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS user_apps (
    user_id INTEGER NOT NULL,
    app_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, app_id),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_id INTEGER NOT NULL,
    version_number TEXT NOT NULL,
    build_number TEXT,
    file_path TEXT NOT NULL,
    manifest_path TEXT,
    changelog TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (app_id) REFERENCES apps (id) ON DELETE CASCADE
  );
`);

export default db;
