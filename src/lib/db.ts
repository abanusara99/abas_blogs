// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import type { Post } from '@/types';
import { posts as initialPostsData } from './data'; // Your initial posts

const dbDir = path.join(process.cwd(), 'src', 'lib');
if (!fs.existsSync(dbDir) && process.env.NODE_ENV !== 'production') {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = path.join(dbDir, 'blog.sqlite');

export const db = new Database(dbPath);

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS posts (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    createdAt TEXT NOT NULL
  );
`);

// Seed initial data if the table is empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
const { count } = countStmt.get() as { count: number };

if (count === 0) {
  const insertStmt = db.prepare('INSERT INTO posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)');
  db.transaction((postsToSeed: Post[]) => {
    for (const post of postsToSeed) {
      insertStmt.run(post.id, post.title, post.content, post.createdAt.toISOString());
    }
  })(initialPostsData);
  console.log('Database seeded with initial posts.');
}
