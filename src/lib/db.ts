import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

// Ensure data directory is exist
fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });

const dbPath = path.join(process.cwd(), "data/ota.db");
const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "data/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = drizzle(sqlite, { schema });

// Initialize tables and default admin user
try {
  // Create tables if they don't exist (Drizzle push alternative for zero-config)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      package_name TEXT NOT NULL,
      platform TEXT NOT NULL,
      icon_path TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_apps (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, app_id)
    );
    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      version_number TEXT NOT NULL,
      build_number TEXT,
      file_path TEXT NOT NULL,
      original_file_path TEXT,
      manifest_path TEXT,
      changelog TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS user_groups (
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      PRIMARY KEY (user_id, group_id)
    );
    CREATE TABLE IF NOT EXISTS group_apps (
      group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
      app_id INTEGER NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
      PRIMARY KEY (group_id, app_id)
    );
    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      key TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS public_links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
      token TEXT NOT NULL UNIQUE,
      expires_at TEXT,
      password_hash TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS download_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL REFERENCES versions(id) ON DELETE CASCADE,
      user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      ip_address TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS webhooks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      event TEXT NOT NULL DEFAULT 'new_version',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
   `);

  // Ensure new columns exist for existing databases
  try {
    sqlite.exec("ALTER TABLE versions ADD COLUMN original_file_path TEXT");
    console.log("Migration: Added original_file_path to versions table");
  } catch (e: any) {
    if (!e.message.includes("duplicate column name")) {
      // console.warn("Migration status:", e.message);
    }
  }

  const userCount = sqlite
    .prepare("SELECT COUNT(*) as count FROM users")
    .get() as { count: number };

  if (userCount.count === 0) {
    const defaultPasswordHash = bcrypt.hashSync("admin123", 10);
    sqlite
      .prepare(
        "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
      )
      .run("admin", defaultPasswordHash, "admin");
    console.log("Default admin user created (admin / admin123)");
  }
} catch (e) {
  console.error("Database initialization error:", e);
}

export default db;

export type { User, App, Version, UserApp } from "./schema";
