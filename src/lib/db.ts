
import BetterSqlite3, { type Database as BetterSqlite3DatabaseInstance } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data';

const projectRoot = process.cwd();
console.log(`[DB] Detected project root (process.cwd()): ${projectRoot}`);

const dbDir = path.join(projectRoot, 'src', 'lib');
console.log(`[DB] Target directory for database: ${dbDir}`);

// Ensure the directory exists
if (!fs.existsSync(dbDir)) {
  console.log(`[DB] Directory ${dbDir} does not exist. Attempting to create it...`);
  try {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log(`[DB] Directory ${dbDir} created successfully.`);
  } catch (err) {
    console.error(`[DB] FATAL: Failed to create directory ${dbDir}:`, err);
    // If we can't even create the directory, something is seriously wrong with permissions/environment.
    throw new Error(`Failed to create database directory: ${(err as Error).message}`);
  }
} else {
  console.log(`[DB] Database directory already exists: ${dbDir}`);
}

const dbPath = path.join(dbDir, 'blog.sqlite');
console.log(`[DB] Full path to database file: ${dbPath}`);

let dbInstance: BetterSqlite3DatabaseInstance;

// Check and prepare the file before attempting to initialize the DB
try {
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    console.log(`[DB] Database file ${dbPath} already exists. Size: ${stats.size} bytes.`);
    // If a file exists but is 0 bytes, it's often a sign of a previously failed initialization.
    // better-sqlite3 might interpret this as "file is not a database".
    if (stats.size === 0) {
      console.warn(`[DB] WARNING: Database file ${dbPath} exists but is 0 bytes. Attempting to delete it.`);
      try {
        fs.unlinkSync(dbPath);
        console.log(`[DB] Successfully deleted 0-byte file: ${dbPath}`);
      } catch (unlinkError) {
        console.error(`[DB] ERROR: Failed to delete 0-byte file ${dbPath}. Error:`, unlinkError);
        // Proceeding, but this might be the source of the problem if deletion fails and a 0-byte file remains.
      }
    }
    // If it exists and is not 0 bytes, it might be corrupted.
    // We will let better-sqlite3 attempt to open it and report if it's not a valid database.
  } else {
    console.log(`[DB] Database file ${dbPath} does not exist. It will be created by better-sqlite3.`);
  }
} catch (fileOpError) {
  console.error(`[DB] FATAL: Error during pre-check/cleanup of database file ${dbPath}:`, fileOpError);
  throw new Error(`Error during file operations for database: ${(fileOpError as Error).message}`);
}

try {
  console.log(`[DB] Attempting to initialize database instance for: ${dbPath}`);
  try {
    // Explicitly tell better-sqlite3 it's okay if the file doesn't exist (it will create it).
    // verbose: console.log can be helpful for debugging better-sqlite3 internal operations.
    dbInstance = new BetterSqlite3(dbPath, { verbose: console.log, fileMustExist: false });
  } catch (instantiationError) {
    console.error('[DB] FATAL: Error during `new BetterSqlite3()` instantiation:', instantiationError);
    // This is a critical point. If this fails, the path might be wrong, permissions, or native module issue.
    throw instantiationError; // Re-throw to be caught by outer handler
  }

  console.log(`[DB] Database instance nominally created. Open status from instance: ${dbInstance.open}`);

  if (!dbInstance || !dbInstance.open) {
    // This case should ideally be caught by the instantiationError above.
    console.error('[DB] FATAL: Database instance was not created or is not open immediately after `new BetterSqlite3()`.');
    throw new Error('DB_INIT_FAILURE: Database instance could not be opened or was not returned by constructor.');
  }

  // First actual operation on the DB. If this fails, the file handle might be bad or the file isn't a DB.
  try {
    console.log('[DB] Attempting to set PRAGMA journal_mode = WAL.');
    dbInstance.pragma('journal_mode = WAL'); // This simple PRAGMA can also fail if the DB isn't valid.
    console.log('[DB] Successfully executed PRAGMA journal_mode.');
  } catch (pragmaError) {
    console.error('[DB] FATAL: Error executing PRAGMA journal_mode:', pragmaError);
    // This often indicates the file isn't a valid DB if it happens here.
    throw pragmaError; // Re-throw
  }

  // Create posts table
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
  } catch (postsTableError) {
    console.error('[DB] FATAL: Error creating "posts" table:', postsTableError);
    throw postsTableError;
  }

  // Create admins table (for plain text passwords, per user request)
  try {
    console.log('[DB] Ensuring "admins" table schema for plain text passwords...');
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL, -- Storing plain text password (INSECURE - for prototype only)
        sessionToken TEXT
      );
    `);
    console.log('[DB] "admins" table schema ensured for plain text passwords.');
  } catch (adminsTableError) {
    console.error('[DB] FATAL: Error creating "admins" table:', adminsTableError);
    throw adminsTableError;
  }

  // Seeding data
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
    const defaultPassword = '&82Tinabsa'; // Plain text password
    console.log(`[DB] Seeding default admin user: ${defaultUsername} with plain text password: ${defaultPassword}.`);
    
    const insertAdminStmt = dbInstance.prepare('INSERT INTO admins (username, password) VALUES (?, ?)');
    insertAdminStmt.run(defaultUsername, defaultPassword);
    console.log(`[DB] Database seeded with default admin user (username: ${defaultUsername}). WARNING: Password stored in plain text!`);
  }

  console.log(`[DB] Database initialization and seeding complete for: ${dbPath}`);

} catch (error) {
  const err = error as Error;
  console.error(`[DB] FATAL: Error during database initialization process for ${dbPath}:`, err);
  if (dbInstance && dbInstance.open) {
    try {
      dbInstance.close();
      console.log('[DB] Database connection closed due to error during setup.');
    } catch (closeError) {
      console.error('[DB] Error closing database connection after initial error:', closeError);
    }
  }
  // Consolidate error message construction
  let originalErrorMessage = err.message;
  if (err.name === 'SqliteError' && err.message.includes('file is not a database')) {
    originalErrorMessage = 'SqliteError: file is not a database';
  } else if (err.message.startsWith('DB_INIT_FAILURE:')) {
     originalErrorMessage = err.message; // Preserve specific DB_INIT_FAILURE messages
  }
  
  // This is the error the user is seeing.
  throw new Error(`Database initialization failed. Check console for [DB] logs. Original error: ${originalErrorMessage}`);
}

export const db: BetterSqlite3DatabaseInstance = dbInstance;
