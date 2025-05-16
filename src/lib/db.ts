
import BetterSqlite3, { type Database as BetterSqlite3DatabaseInstance } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data';

const dbDir = path.join(process.cwd(), 'src', 'lib');
console.log(`[DB] Target directory for database: ${dbDir}`);

// Ensure dbDir exists
if (!fs.existsSync(dbDir)) {
  console.log(`[DB] Creating directory: ${dbDir}`);
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`[DB] Directory ${dbDir} created successfully.`);
  } catch (err) {
    console.error(`[DB] FATAL: Failed to create directory ${dbDir}:`, err);
    throw new Error(`Failed to create database directory: ${(err as Error).message}`);
  }
} else {
  console.log(`[DB] Database directory already exists: ${dbDir}`);
}

const dbPath = path.join(dbDir, 'blog.sqlite');
console.log(`[DB] Full path to database file: ${dbPath}`);

let dbInstance: BetterSqlite3DatabaseInstance;

try {
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`[DB] Database file ${dbPath} already exists. Size: ${stats.size} bytes.`);
    if (stats.size === 0) {
      console.warn(`[DB] WARNING: Database file ${dbPath} exists but is 0 bytes. Attempting to delete it.`);
      try {
        fs.unlinkSync(dbPath);
        console.log(`[DB] Successfully deleted 0-byte file: ${dbPath}`);
      } catch (unlinkError) {
        console.error(`[DB] ERROR: Failed to delete 0-byte file ${dbPath}. Error:`, unlinkError);
      }
    }
  } else {
    console.log(`[DB] Database file ${dbPath} does not exist. It will be created by better-sqlite3.`);
  }

  console.log(`[DB] Attempting to initialize database instance for: ${dbPath}`);
  dbInstance = new BetterSqlite3(dbPath, { verbose: console.log });
  console.log(`[DB] Database instance created successfully for: ${dbPath}. Open: ${dbInstance.open}`);

  console.log('[DB] Ensuring "posts" table schema...');
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      createdAt TEXT NOT NULL
    );
  `);
  console.log('[DB] "posts" table schema ensured.');

  console.log('[DB] Ensuring "admins" table schema for plain text passwords...');
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Storing plain text password (INSECURE)
      sessionToken TEXT
    );
  `);
  console.log('[DB] "admins" table schema ensured for plain text passwords.');

  const countPostsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM posts');
  const { count: postCount } = countPostsStmt.get() as { count: number };
  console.log(`[DB] Current post count: ${postCount}`);

  if (postCount === 0) {
    console.log('[DB] Seeding initial posts...');
    const insertPostStmt = dbInstance.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
    dbInstance.transaction((postsToSeed: Post[]) => {
      for (const post of postsToSeed) {
        insertPostStmt.run(post.id, post.title, post.content, post.createdAt.toISOString());
      }
    })(initialPostsData);
    console.log('[DB] Database seeded with initial posts.');
  }

  const countAdminsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM admins');
  const { count: adminCount } = countAdminsStmt.get() as { count: number };
  console.log(`[DB] Current admin count: ${adminCount}`);

  if (adminCount === 0) {
    const defaultUsername = 'admin';
    const defaultPassword = '&82Tinabsa'; 
    console.log(`[DB] Seeding default admin user: ${defaultUsername} with plain text password.`);
    
    const insertAdminStmt = dbInstance.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    insertAdminStmt.run(defaultUsername, defaultPassword);
    console.log(`[DB] Database seeded with default admin user (username: ${defaultUsername} / password: ${defaultPassword}). WARNING: Password stored in plain text!`);
  }
  console.log(`[DB] Database initialization and seeding complete for: ${dbPath}`);

} catch (error) {
  console.error(`[DB] FATAL: Error during database initialization for ${dbPath}:`, error);
  if (dbInstance && dbInstance.open) {
    try {
      dbInstance.close();
      console.log('[DB] Database connection closed due to error during setup.');
    } catch (closeError) {
      console.error('[DB] Error closing database connection after initial error:', closeError);
    }
  }
  throw new Error(`Database initialization failed. Check console for [DB] logs. Original error: ${(error as Error).message}`);
}

export const db: BetterSqlite3DatabaseInstance = dbInstance;
