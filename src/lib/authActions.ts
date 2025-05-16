
'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';
import { revalidatePath } from 'next/cache';

const SESSION_COOKIE_NAME = 'session_token';

export interface AdminUser {
  id: number;
  username: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function verifyPassword(storedHash: string, salt: string, providedPassword: string): boolean {
  const hashOfProvidedPassword = hashPassword(providedPassword, salt);
  // Use timingSafeEqual to prevent timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(storedHash, 'hex'), Buffer.from(hashOfProvidedPassword, 'hex'));
  } catch {
    // Handle cases where buffer lengths might not match, though they should if hashes are same length
    return false;
  }
}

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: 'Username and password are required.' };
  }

  const stmt = db.prepare('SELECT id, hashedPassword, salt FROM admins WHERE username = ?');
  const admin = stmt.get(username) as { id: number; hashedPassword: string; salt: string } | undefined;

  if (!admin || !verifyPassword(admin.hashedPassword, admin.salt, password)) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = ? WHERE id = ?');
  updateTokenStmt.run(sessionToken, admin.id);

  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout'); // Revalidate all paths to update UI based on login state
  return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = NULL WHERE sessionToken = ?');
    updateTokenStmt.run(token);
  }
  cookies().delete(SESSION_COOKIE_NAME);
  revalidatePath('/', 'layout');
  return { success: true };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const stmt = db.prepare('SELECT id, username FROM admins WHERE sessionToken = ?');
  const admin = stmt.get(token) as AdminUser | undefined;

  return admin || null;
}
