
// @ts-ignore
import OriginalDatabase from 'better-sqlite3'; // Renamed to avoid conflict with exported 'db'
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data';

const dbDir = path.join(process.cwd(), 'src', 'lib');
console.log(`[DB] Target directory for database: ${dbDir}`);

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

let dbInstance: OriginalDatabase.Database;

try {
  console.log(`[DB] Attempting to initialize database instance for: ${dbPath}`);
  // Add verbose logging to better-sqlite3 constructor
  dbInstance = new OriginalDatabase(dbPath, { verbose: console.log });
  console.log(`[DB] Database instance created successfully for: ${dbPath}. Open: ${dbInstance.open}`);
} catch (error) {
  console.error(`[DB] FATAL: Error creating Database instance for ${dbPath}:`, error);
  // If the constructor throws, dbInstance might not be valid.
  throw error; 
}

try {
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

  console.log('[DB] Ensuring "admins" table schema...');
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, -- Storing plain text password (INSECURE)
      sessionToken TEXT
    );
  `);
  console.log('[DB] "admins" table schema ensured.');

  // Seed initial posts data if the table is empty
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

  // Seed initial admin user if the table is empty
  const countAdminsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM admins');
  const { count: adminCount } = countAdminsStmt.get() as { count: number };
  console.log(`[DB] Current admin count: ${adminCount}`);

  if (adminCount === 0) {
    const defaultUsername = 'admin';
    const defaultPassword = '&82Tinabsa'; // Storing plain text password (INSECURE)
    console.log(`[DB] Seeding default admin user: ${defaultUsername}`);
    
    const insertAdminStmt = dbInstance.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    insertAdminStmt.run(defaultUsername, defaultPassword);
    console.log(`[DB] Database seeded with default admin user (username: ${defaultUsername} / password: ${defaultPassword}). WARNING: Password stored in plain text!`);
  }
  console.log('[DB] Database initialization and seeding complete for: ${dbPath}');

} catch (error) {
  console.error(`[DB] FATAL: Error during table creation or seeding for ${dbPath}:`, error);
  if (dbInstance && dbInstance.open) {
    dbInstance.close(); // Attempt to close the DB if an error occurs after opening
    console.log('[DB] Database connection closed due to error during setup.');
  }
  throw error; 
}

export const db = dbInstance;
