
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

export async function login(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const username = formData.get('username') as string;
  const providedPassword = formData.get('password') as string;

  console.log('[AUTH] Login attempt for username:', username);

  if (!username || !providedPassword) {
    console.log('[AUTH] Login failed: Username or password not provided.');
    return { success: false, error: 'Username and password are required.' };
  }

  let admin: { id: number; password: string } | undefined;
  try {
    const stmt = db.prepare('SELECT id, password FROM admins WHERE username = ?');
    admin = stmt.get(username) as { id: number; password: string } | undefined;
  } catch (dbError: any) {
    console.error('[AUTH] Database error during admin lookup for username:', username, 'Error:', dbError.message, 'Stack:', dbError.stack);
    return { success: false, error: 'Login failed: Database query error.' };
  }
  

  if (!admin || admin.password !== providedPassword) {
    console.log('[AUTH] Login failed: Invalid username or password for username:', username);
    return { success: false, error: 'Invalid username or password.' };
  }
  console.log('[AUTH] Password check passed for admin ID:', admin.id);


  const sessionToken = crypto.randomBytes(32).toString('hex');
  console.log('[AUTH] Generated sessionToken for admin ID', admin.id, ':', sessionToken);

  try {
    const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = ? WHERE id = ?');
    const updateResult = updateTokenStmt.run(sessionToken, admin.id);
    console.log('[AUTH] DB update for sessionToken (admin ID:', admin.id, ') result (changes):', updateResult.changes);


    if (updateResult.changes === 0) {
      console.error('[AUTH] Failed to update session token in DB for admin ID:', admin.id, '(no rows affected). This likely means the admin ID was not found for update.');
      return { success: false, error: 'Login failed: Could not save session (update failed).' };
    }

    // Verify the token was written
    const verifyTokenStmt = db.prepare('SELECT sessionToken FROM admins WHERE id = ?');
    const updatedAdmin = verifyTokenStmt.get(admin.id) as { sessionToken: string | null } | undefined;

    if (!updatedAdmin || updatedAdmin.sessionToken !== sessionToken) {
      console.error('[AUTH] Failed to verify session token in DB after update. Admin ID:', admin.id, 'Expected:', sessionToken, 'Got:', updatedAdmin?.sessionToken);
      return { success: false, error: 'Login failed: Could not save session (verification failed). Please try again.' };
    }
    console.log('[AUTH] Session token successfully verified in DB after update for admin ID:', admin.id);

  } catch (dbError: any) {
    console.error('[AUTH] Database error during session token update/verification. Admin ID:', admin.id, 'Error:', dbError.message, 'Stack:', dbError.stack);
    return { success: false, error: 'Login failed: Database error during session save.' };
  }

  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
    sameSite: 'lax',
  });
  console.log('[AUTH] Session cookie set for admin ID:', admin.id, 'Token:', sessionToken);


  revalidatePath('/', 'layout'); 
  return { success: true };
}

export async function logout(): Promise<{ success: boolean }> {
  const token = cookies().get(SESSION_COOKIE_NAME)?.value;
  console.log('[AUTH] Logout attempt. Token from cookie:', token);
  if (token) {
    try {
      const updateTokenStmt = db.prepare('UPDATE admins SET sessionToken = NULL WHERE sessionToken = ?');
      const result = updateTokenStmt.run(token);
      console.log('[AUTH] Cleared sessionToken in DB for token:', token, 'Result (changes):', result.changes);
    } catch (dbError: any) {
      console.error('[AUTH] Database error during logout (clearing token):', dbError.message, 'Stack:', dbError.stack);
    }
  }
  cookies().delete(SESSION_COOKIE_NAME);
  console.log('[AUTH] Session cookie deleted.');
  revalidatePath('/', 'layout'); 
  return { success: true };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = cookies(); 
  const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  console.log('[AUTH] getCurrentAdmin: Attempting to get current admin.');
  console.log('[AUTH] getCurrentAdmin: Token from cookie:', tokenFromCookie);


  if (!tokenFromCookie) {
    console.log('[AUTH] getCurrentAdmin: No session token found in cookies.');
    return null;
  }

  try {
    // Select all relevant fields for debugging, even if only id and username are returned.
    const stmt = db.prepare('SELECT id, username, password, sessionToken FROM admins WHERE sessionToken = ?');
    console.log('[AUTH] getCurrentAdmin: Querying DB with token:', tokenFromCookie);
    const admin = stmt.get(tokenFromCookie) as (AdminUser & { password?: string, sessionToken?: string | null }) | undefined;

    if (admin) {
      console.log('[AUTH] getCurrentAdmin: Admin found in DB by token. Admin ID:', admin.id, 'Username:', admin.username, 'DB Token:', admin.sessionToken);
      return { id: admin.id, username: admin.username };
    } else {
      console.log('[AUTH] getCurrentAdmin: No admin found in DB for token:', tokenFromCookie);
      // For debugging, let's see all admins and their tokens if no match is found.
      try {
        const allAdminsInDB = db.prepare('SELECT id, username, password, sessionToken FROM admins').all();
        console.log('[AUTH] getCurrentAdmin: DEBUG - All admins currently in DB:', JSON.stringify(allAdminsInDB, null, 2));
      } catch (debugDbError: any) {
        console.error('[AUTH] getCurrentAdmin: DEBUG - Error fetching all admins:', debugDbError.message);
      }
      return null;
    }
  } catch (dbError: any) {
    console.error('[AUTH] getCurrentAdmin: Database error:', dbError.message, 'Stack:', dbError.stack);
    return null; 
  }
}
