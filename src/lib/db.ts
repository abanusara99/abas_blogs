
// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data'; // Your initial posts
import crypto from 'crypto';

const dbDir = path.join(process.cwd(), 'src', 'lib');
if (!fs.existsSync(dbDir) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'blog.sqlite');

export const db = new Database(dbPath);

// Create posts table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

// Create admins table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    hashedPassword TEXT NOT NULL,
    salt TEXT NOT NULL,
    sessionToken TEXT
  );
`);

// Seed initial posts data if the table is empty
const countPostsStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
const { count: postCount } = countPostsStmt.get() as { count: number };

if (postCount === 0) {
  const insertPostStmt = db.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
  db.transaction((postsToSeed: Post[]) => {
    for (const post of postsToSeed) {
      insertPostStmt.run(post.id, post.title, post.content, post.createdAt.toISOString());
    }
  })(initialPostsData);
  console.log('Database seeded with initial posts.');
}

// Seed initial admin user if the table is empty
const countAdminsStmt = db.prepare('SELECT COUNT(*) as count FROM admins');
const { count: adminCount } = countAdminsStmt.get() as { count: number };

if (adminCount === 0) {
  const defaultUsername = 'admin';
  const defaultPassword = 'password123'; // IMPORTANT: Change this in a real application
  const salt = crypto.randomBytes(16).toString('hex');
  const hashedPassword = crypto.pbkdf2Sync(defaultPassword, salt, 100000, 64, 'sha512').toString('hex');

  const insertAdminStmt = db.prepare('INSERT INTO admins (username, hashedPassword, salt) VALUES (?, ?, ?)');
  insertAdminStmt.run(defaultUsername, hashedPassword, salt);
  console.log('Database seeded with default admin user (admin/password123). PLEASE CHANGE THE PASSWORD.');
}
