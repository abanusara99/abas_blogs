
'use server';

import { cookies } from 'next/headers';
import crypto from 'crypto';
import { db } from './db';
import { revalidatePath } from 'next/cache'; // Import revalidatePath

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
    return { success: false, error: 'Login failed: Database query error while finding admin.' };
  }


  if (!admin || admin.password !== providedPassword) {
    console.log('[AUTH] Login failed: Invalid username or password for username:', username);
    if (admin) {
      console.log(`[AUTH] DEBUG: Stored plain text password for ${username} is "${admin.password}". Provided password was "${providedPassword}".`);
    } else {
      console.log(`[AUTH] DEBUG: No admin user found with username ${username}.`);
    }
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

    // Enhanced verification: Try to fetch the admin by the new sessionToken
    const verifyByTokenStmt = db.prepare('SELECT id, username, sessionToken FROM admins WHERE sessionToken = ?');
    const verifiedAdminByToken = verifyByTokenStmt.get(sessionToken) as (AdminUser & { sessionToken: string | null }) | undefined;

    if (!verifiedAdminByToken || verifiedAdminByToken.sessionToken !== sessionToken || verifiedAdminByToken.id !== admin.id) {
      console.error('[AUTH] Failed to verify session token in DB by querying the token itself. Admin ID:', admin.id, 'Expected Token:', sessionToken, 'Found Admin by Token:', JSON.stringify(verifiedAdminByToken));
      try {
        const allAdminsInDB = db.prepare('SELECT id, username, password, sessionToken FROM admins').all();
        console.log('[AUTH] LOGIN VERIFY FAIL DEBUG - All admins currently in DB:', JSON.stringify(allAdminsInDB.map(a => ({id: a.id, username: a.username, sessionToken: a.sessionToken ? `${(a.sessionToken as string).slice(0,6)}...${(a.sessionToken as string).slice(-6)}` : null, passwordStored: !!a.password})), null, 2));
      } catch (debugDbError: any) {
        console.error('[AUTH] LOGIN VERIFY FAIL DEBUG - Error fetching all admins:', debugDbError.message);
      }
      return { success: false, error: 'Login failed: Could not save session (verification by token failed). Please try again.' };
    }
    console.log('[AUTH] Session token successfully verified in DB by querying token itself for admin ID:', admin.id, 'Username:', verifiedAdminByToken.username);

  } catch (dbError: any) {
    console.error('[AUTH] Database error during session token update/verification. Admin ID:', admin.id, 'Error:', dbError.message, 'Stack:', dbError.stack);
    return { success: false, error: 'Login failed: Database error during session save.' };
  }

  cookies().set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365 * 10, // 10 years
    path: '/',
    sameSite: 'lax',
  });
  console.log('[AUTH] Session cookie set for admin ID:', admin.id, 'Token:', sessionToken);

  revalidatePath('/', 'layout'); // Revalidate paths to ensure UI updates
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
  revalidatePath('/', 'layout'); // Revalidate paths to ensure UI updates
  return { success: true };
}

export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const cookieStore = cookies(); // This is the standard way to get the cookie store in an async context
  const tokenFromCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!tokenFromCookie) {
    // This is normal if the user is not logged in. No need to log every time for this case.
    // console.log('[AUTH] getCurrentAdmin: No session token found in cookies.');
    return null;
  }

  // More detailed logging for when a token IS found
  console.log(`[AUTH] getCurrentAdmin: Attempting to find admin with token from cookie: "${tokenFromCookie}"`);

  try {
    const sql = 'SELECT id, username, password, sessionToken FROM admins WHERE sessionToken = ?';
    console.log(`[AUTH] getCurrentAdmin: Executing SQL: ${sql} with token parameter: "${tokenFromCookie}"`);
    const stmt = db.prepare(sql);
    // Important: Ensure the parameter is passed correctly to stmt.get()
    const admin = stmt.get(tokenFromCookie) as (AdminUser & { password?: string; sessionToken?: string | null }) | undefined;

    if (admin && admin.sessionToken === tokenFromCookie) {
      console.log('[AUTH] getCurrentAdmin: Admin FOUND in DB. Admin ID:', admin.id, 'Username:', admin.username, 'DB Token:', `"${admin.sessionToken}"`);
      return { id: admin.id, username: admin.username };
    } else {
      console.log('[AUTH] getCurrentAdmin: Admin NOT FOUND in DB for token:', `"${tokenFromCookie}"`);
      if (admin && admin.sessionToken !== tokenFromCookie) { // This case should be rare if token is primary key or unique
        console.warn('[AUTH] getCurrentAdmin: DEBUG - An admin record was found, but its DB sessionToken did not match the cookie token. DB Token:', `"${admin.sessionToken}"`);
      }
      try {
        const allAdminsInDB = db.prepare('SELECT id, username, password, sessionToken FROM admins').all();
        console.log('[AUTH] getCurrentAdmin: DEBUG - All admins currently in DB (tokens shown for matching debug):', JSON.stringify(allAdminsInDB.map(a => ({id: a.id, username: a.username, sessionToken: a.sessionToken ? `${(a.sessionToken as string).slice(0,6)}...${(a.sessionToken as string).slice(-6)}` : null, passwordStored: !!a.password})), null, 2));
      } catch (debugDbError: any) {
        console.error('[AUTH] getCurrentAdmin: DEBUG - Error fetching all admins:', debugDbError.message);
      }
      return null;
    }
  } catch (dbError: any) {
    console.error('[AUTH] getCurrentAdmin: Database error during admin lookup for token:', `"${tokenFromCookie}"`, 'Error:', dbError.message);
    console.error('[AUTH] getCurrentAdmin: Full stack for DB error:', dbError.stack);
    return null;
  }
}

