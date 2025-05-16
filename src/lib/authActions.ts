
'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db'; // db.ts will provide the instance from posts.sqlite
import { revalidatePath } from 'next/cache';

const SESSION_COOKIE_NAME = 'session_token';

export interface AdminUser {
  id: number;
  username: string;
}

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const username = formData.get('username') as string;
  const providedPassword = formData.get('password') as string;

  if (!username || !providedPassword) {
    return { success: false, error: 'Username and password are required.' };
  }

  let admin: { id: number; password: string } | undefined;
  try {
    const stmt = db.prepare('SELECT id, password FROM admins WHERE username = ?');
    admin = stmt.get(username) as { id: number; password: string } | undefined;
  } catch (dbError: any) {
    console.error('[AUTH] Database error during admin lookup:', dbError.message);
    return { success: false, error: 'Login failed: Database query error.' };
  }
  

  if (!admin || admin.password !== providedPassword) {
    return { success: false, error: 'Invalid username or password.' };
  }

  const sessionToken = crypto.randomBytes(32).toString('hex');
  
  try {
    const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = ? WHERE id = ?');
    updateTokenStmt.run(sessionToken, admin.id);

    // Verify the token was written
    const verifyTokenStmt = db.prepare('SELECT sessionToken FROM admins WHERE id = ?');
    const updatedAdmin = verifyTokenStmt.get(admin.id) as { sessionToken: string | null } | undefined;

    if (!updatedAdmin || updatedAdmin.sessionToken !== sessionToken) {
      console.error('[AUTH] Failed to verify session token in DB after update. Expected:', sessionToken, 'Got:', updatedAdmin?.sessionToken);
      return { success: false, error: 'Login failed: Could not save session. Please try again.' };
    }
    console.log('[AUTH] Session token verified in DB after update for admin ID:', admin.id);

  } catch (dbError: any) {
    console.error('[AUTH] Database error during session token update/verification:', dbError.message);
    return { success: false, error: 'Login failed: Database error during session save.' };
  }

  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout'); 
  return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  if (token) {
    try {
      const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = NULL WHERE sessionToken = ?');
      updateTokenStmt.run(token);
    } catch (dbError: any) {
      console.error('[AUTH] Database error during logout (clearing token):', dbError.message);
      // Proceed to delete cookie even if DB update fails
    }
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

  try {
    const stmt = db.prepare('SELECT id, username FROM admins WHERE sessionToken = ?');
    const admin = stmt.get(token) as AdminUser | undefined;
    return admin || null;
  } catch (dbError: any) {
    console.error('[AUTH] Database error in getCurrentAdmin:', dbError.message);
    return null; // Return null if there's a DB error to prevent further issues
  }
}
