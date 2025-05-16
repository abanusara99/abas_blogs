
import BetterSqlite3, { type Database as BetterSqlite3DatabaseInstance } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types'; // Keep for initialPostsData if re-enabled
import { posts as initialPostsData } from './data'; // Keep for initialPostsData if re-enabled

const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, 'src', 'lib');
const dbPath = path.join(dbDir, 'blog.sqlite');

let dbInstance: BetterSqlite3DatabaseInstance;

console.log(`[DB] Starting database initialization for: ${dbPath}`);

try {
  // Ensure the directory exists
  if (!fs.existsSync(dbDir)) {
    console.log(`[DB] Directory ${dbDir} does not exist. Creating it...`);
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`[DB] Directory ${dbDir} created.`);
  } else {
    console.log(`[DB] Directory ${dbDir} already exists.`);
  }

  // Attempt to delete a potentially corrupted 0-byte file
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    if (stats.size === 0) {
      console.warn(`[DB] WARNING: Database file ${dbPath} exists but is 0 bytes. Attempting to delete it.`);
      try {
        fs.unlinkSync(dbPath);
        console.log(`[DB] Successfully deleted 0-byte file: ${dbPath}`);
      } catch (unlinkError) {
        console.error(`[DB] ERROR: Failed to delete 0-byte file ${dbPath}. Error:`, unlinkError);
        // Proceed, better-sqlite3 might handle it or fail predictably
      }
    }
  }

  // Initialize the database instance
  console.log('[DB] Attempting to instantiate BetterSqlite3...');
  dbInstance = new BetterSqlite3(dbPath, { fileMustExist: false });
  console.log('[DB] BetterSqlite3 instance created.');

  // Set PRAGMA journal_mode
  console.log('[DB] Setting PRAGMA journal_mode = WAL...');
  dbInstance.pragma('journal_mode = WAL');
  console.log('[DB] PRAGMA journal_mode set.');

  // Create admins table
  console.log('[DB] Ensuring "admins" table schema...');
  dbInstance.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `);
  console.log('[DB] "admins" table schema ensured.');

  // Seed default admin if table is empty
  const countAdminsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM admins');
  const { count: adminCount } = countAdminsStmt.get() as { count: number };
  if (adminCount === 0) {
    const defaultUsername = 'admin';
    const defaultPassword = '&82Tinabsa'; // Plain text password
    console.log(`[DB] Seeding default admin user: ${defaultUsername} with plain text password.`);
    const insertAdminStmt = dbInstance.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    insertAdminStmt.run(defaultUsername, defaultPassword);
    console.log('[DB] Default admin user seeded.');
  } else {
    console.log('[DB] Admin users already exist, skipping seed.');
  }

  // Create posts table (re-added for basic functionality if admin setup works)
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

  // Seed initial posts if table is empty
  const countPostsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM posts');
  const { count: postCount } = countPostsStmt.get() as { count: number };
  if (postCount === 0) {
    console.log('[DB] Seeding initial posts...');
    const insertPostStmt = dbInstance.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
    dbInstance.transaction((postsToSeed: Post[]) => {
      for (const post of postsToSeed) {
        insertPostStmt.run(post.id, post.title, post.content, post.createdAt.toISOString());
      }
    })(initialPostsData);
    console.log('[DB] Initial posts seeded.');
  } else {
    console.log('[DB] Posts already exist, skipping seed.');
  }


  console.log(`[DB] Database initialization successful for: ${dbPath}`);

} catch (error) {
  const err = error as Error & { code?: string };
  let originalErrorMessage = err.message;
  if (err.code === 'SQLITE_NOTADB') { // better-sqlite3 specific error code
    originalErrorMessage = 'SqliteError: file is not a database';
  }
  
  console.error(`[DB] FATAL: Error during database initialization process for ${dbPath}.`);
  console.error(`[DB] Error Name: ${err.name}`);
  console.error(`[DB] Error Code: ${err.code || 'N/A'}`);
  console.error(`[DB] Error Message: ${err.message}`);
  console.error(`[DB] Full error stack:`, err.stack);

  if (dbInstance && dbInstance.open) {
    try {
      dbInstance.close();
      console.log('[DB] Database connection closed due to error during setup.');
    } catch (closeError) {
      console.error('[DB] Error closing database connection after initial error:', closeError);
    }
  }
  // This is the error the user is seeing.
  throw new Error(`Database initialization failed. Check console for [DB] logs. Original error: ${originalErrorMessage}`);
}

export const db: BetterSqlite3DatabaseInstance = dbInstance;
