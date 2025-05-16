
'use server';

import BetterSqlite3, { type Database as BetterSqlite3DatabaseInstance } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data';

const projectRoot = process.cwd();
const dbDir = path.join(projectRoot, 'src', 'lib');
const dbPath = path.join(dbDir, 'blog.sqlite');

let dbInstance: BetterSqlite3DatabaseInstance;

console.log(`[DB] Starting database initialization. Target DB path: ${dbPath}`);

try {
  // Step 1: Ensure the directory exists
  console.log(`[DB] Checking if directory ${dbDir} exists.`);
  if (!fs.existsSync(dbDir)) {
    console.log(`[DB] Directory ${dbDir} does not exist. Attempting to create it...`);
    try {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log(`[DB] Directory ${dbDir} created successfully.`);
    } catch (mkdirError: any) {
      console.error(`[DB] FATAL: Failed to create directory ${dbDir}. Error: ${mkdirError.message}`, mkdirError.stack);
      throw new Error(`Failed to create database directory: ${mkdirError.message}`);
    }
  } else {
    console.log(`[DB] Directory ${dbDir} already exists.`);
  }

  // Step 2: Check for and attempt to delete a 0-byte database file
  if (fs.existsSync(dbPath)) {
    console.log(`[DB] File ${dbPath} exists. Checking its size.`);
    const stats = fs.statSync(dbPath);
    if (stats.size === 0) {
      console.warn(`[DB] WARNING: Database file ${dbPath} is 0 bytes. Attempting to delete it.`);
      try {
        fs.unlinkSync(dbPath);
        console.log(`[DB] Successfully deleted 0-byte file: ${dbPath}`);
      } catch (unlinkError: any) {
        console.error(`[DB] ERROR: Failed to delete 0-byte file ${dbPath}. Error: ${unlinkError.message}`, unlinkError.stack);
        // Proceed cautiously, better-sqlite3 might still fail
      }
    } else {
      console.log(`[DB] File ${dbPath} exists and is not 0 bytes (size: ${stats.size} bytes).`);
    }
  } else {
    console.log(`[DB] File ${dbPath} does not exist. It will be created by BetterSqlite3.`);
  }

  // Step 3: Instantiate BetterSqlite3
  try {
    console.log('[DB] Attempting to instantiate BetterSqlite3...');
    // Using fileMustExist: false is default, but explicit for clarity that it should create if not exists.
    dbInstance = new BetterSqlite3(dbPath, { fileMustExist: false }); 
    console.log('[DB] BetterSqlite3 instance created.');
    if (dbInstance && dbInstance.open) {
      console.log('[DB] Database connection is reported as OPEN by better-sqlite3.');
    } else {
      console.warn('[DB] WARNING: BetterSqlite3 instance created, but connection is NOT reported as open.');
      // This state might lead to subsequent errors.
      throw new Error('BetterSqlite3 instance not open after creation.');
    }
  } catch (instantiationError: any) {
    console.error(`[DB] FATAL ERROR DURING BetterSqlite3 INSTANTIATION for ${dbPath}.`);
    console.error(`[DB] Instantiation Error Type: ${instantiationError.name}`);
    console.error(`[DB] Instantiation Error Code: ${instantiationError.code || 'N/A'}`);
    console.error(`[DB] Instantiation Error Message: ${instantiationError.message}`);
    console.error(`[DB] Instantiation Full Stack:`, instantiationError.stack);
    throw instantiationError; // Re-throw to be caught by the outer catch block
  }

  // Step 4: Set PRAGMA journal_mode
  try {
    console.log('[DB] Attempting to set PRAGMA journal_mode = WAL...');
    dbInstance.pragma('journal_mode = WAL');
    console.log('[DB] PRAGMA journal_mode = WAL set successfully.');
  } catch (pragmaError: any) {
    console.error(`[DB] FATAL ERROR SETTING PRAGMA journal_mode for ${dbPath}.`);
    console.error(`[DB] PRAGMA Error Type: ${pragmaError.name}`);
    console.error(`[DB] PRAGMA Error Code: ${pragmaError.code || 'N/A'}`);
    console.error(`[DB] PRAGMA Error Message: ${pragmaError.message}`);
    console.error(`[DB] PRAGMA Full Stack:`, pragmaError.stack);
    if (dbInstance && dbInstance.open) {
      try { dbInstance.close(); console.log('[DB] Closed DB connection after PRAGMA error.'); }
      catch (closeErr: any) { console.error('[DB] Error closing DB after PRAGMA error:', closeErr.message); }
    }
    throw pragmaError; // Re-throw
  }

  // Step 5: Create admins table
  try {
    console.log('[DB] Attempting to ensure "admins" table schema...');
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL 
      );
    `); // Plain text password
    console.log('[DB] "admins" table schema ensured successfully.');
  } catch (adminTableError: any) {
    console.error(`[DB] FATAL ERROR CREATING "admins" TABLE for ${dbPath}.`);
    console.error(`[DB] Admin Table Error Type: ${adminTableError.name}`);
    console.error(`[DB] Admin Table Error Code: ${adminTableError.code || 'N/A'}`);
    console.error(`[DB] Admin Table Error Message: ${adminTableError.message}`);
    console.error(`[DB] Admin Table Full Stack:`, adminTableError.stack);
    if (dbInstance && dbInstance.open) {
      try { dbInstance.close(); console.log('[DB] Closed DB connection after admin table error.'); }
      catch (closeErr: any) { console.error('[DB] Error closing DB after admin table error:', closeErr.message); }
    }
    throw adminTableError; // Re-throw
  }
  
  // Step 6: Seed default admin if table is empty
  const countAdminsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM admins');
  const adminRow = countAdminsStmt.get() as { count: number } | undefined; // Added undefined check
  const adminCount = adminRow ? adminRow.count : 0; // Handle if adminRow is undefined

  if (adminCount === 0) {
    const defaultUsername = 'admin';
    const defaultPassword = '&82Tinabsa'; // Plain text password
    console.log(`[DB] "admins" table is empty. Seeding default admin user: ${defaultUsername} with plain text password.`);
    try {
      const insertAdminStmt = dbInstance.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
      insertAdminStmt.run(defaultUsername, defaultPassword);
      console.log('[DB] Default admin user seeded successfully.');
    } catch (adminSeedError: any) {
        console.error(`[DB] ERROR SEEDING default admin user for ${dbPath}.`);
        console.error(`[DB] Admin Seed Error Type: ${adminSeedError.name}`);
        console.error(`[DB] Admin Seed Error Code: ${adminSeedError.code || 'N/A'}`);
        console.error(`[DB] Admin Seed Error Message: ${adminSeedError.message}`);
        console.error(`[DB] Admin Seed Full Stack:`, adminSeedError.stack);
        // Don't re-throw, allow app to continue if possible, but log severity
    }
  } else {
    console.log(`[DB] Admin users already exist (count: ${adminCount}), skipping default admin seed.`);
  }

  // Step 7: Create posts table
  try {
    console.log('[DB] Attempting to ensure "posts" table schema...');
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        createdAt TEXT NOT NULL
      );
    `);
    console.log('[DB] "posts" table schema ensured successfully.');
  } catch (postsTableError: any) {
    console.error(`[DB] FATAL ERROR CREATING "posts" TABLE for ${dbPath}.`);
    console.error(`[DB] Posts Table Error Type: ${postsTableError.name}`);
    console.error(`[DB] Posts Table Error Code: ${postsTableError.code || 'N/A'}`);
    console.error(`[DB] Posts Table Error Message: ${postsTableError.message}`);
    console.error(`[DB] Posts Table Full Stack:`, postsTableError.stack);
    if (dbInstance && dbInstance.open) {
      try { dbInstance.close(); console.log('[DB] Closed DB connection after posts table error.'); }
      catch (closeErr: any) { console.error('[DB] Error closing DB after posts table error:', closeErr.message); }
    }
    throw postsTableError; // Re-throw
  }

  // Step 8: Seed initial posts if table is empty
  const countPostsStmt = dbInstance.prepare('SELECT COUNT(*) as count FROM posts');
  const postRow = countPostsStmt.get() as { count: number } | undefined; // Added undefined check
  const postCount = postRow ? postRow.count : 0; // Handle if postRow is undefined

  if (postCount === 0) {
    console.log('[DB] "posts" table is empty. Seeding initial posts...');
    try {
        const insertPostStmt = dbInstance.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
        dbInstance.transaction((postsToSeed: Post[]) => {
        for (const post of postsToSeed) {
            insertPostStmt.run(post.id, post.title, post.content, post.createdAt.toISOString());
        }
        })(initialPostsData);
        console.log(`[DB] Initial posts seeded successfully (${initialPostsData.length} posts).`);
    } catch (postsSeedError: any) {
        console.error(`[DB] ERROR SEEDING initial posts for ${dbPath}.`);
        console.error(`[DB] Posts Seed Error Type: ${postsSeedError.name}`);
        console.error(`[DB] Posts Seed Error Code: ${postsSeedError.code || 'N/A'}`);
        console.error(`[DB] Posts Seed Error Message: ${postsSeedError.message}`);
        console.error(`[DB] Posts Seed Full Stack:`, postsSeedError.stack);
        // Don't re-throw
    }
  } else {
    console.log(`[DB] Posts already exist (count: ${postCount}), skipping initial posts seed.`);
  }

  console.log(`[DB] Database initialization process completed for: ${dbPath}`);

} catch (error: any) { // This is the outer catch block
  const originalErrorMessage = error.message || "Unknown error during DB init";
  console.error(`[DB] OVERALL FATAL ERROR during database initialization for ${dbPath}.`);
  console.error(`[DB] Error Type: ${error.name}`);
  console.error(`[DB] Error Code: ${error.code || 'N/A'}`);
  console.error(`[DB] Original Error Message from caught error: ${originalErrorMessage}`);
  console.error(`[DB] Full error stack from caught error:`, error.stack);

  if (dbInstance && dbInstance.open) {
    try {
      dbInstance.close();
      console.log('[DB] Database connection closed due to overall error during setup.');
    } catch (closeError: any) {
      console.error('[DB] Error closing database connection after overall initial error:', closeError.message);
    }
  }
  // This is the error the user is seeing in the Next.js overlay.
  throw new Error(`Database initialization failed. Check console for [DB] logs. Original error: ${originalErrorMessage}`);
}

export const db: BetterSqlite3DatabaseInstance = dbInstance;
    