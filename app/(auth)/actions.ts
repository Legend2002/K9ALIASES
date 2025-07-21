
'use server';

import { redirect } from 'next/navigation';
import { headers, cookies } from 'next/headers';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import pool from '@/lib/db';

const saltRounds = 10;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long.'),
});

type AuthState = {
  message?: string;
  success: boolean;
  error?: string;
};

export async function getSessionToken() {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get('session_token');
    return tokenCookie?.value || null;
}

export async function getLoggedInUserEmail() {
    const token = await getSessionToken();
    if (!token) {
        return null;
    }

    try {
        const sessionsResult = await pool.query(
            `SELECT u.email FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.expires_at > NOW()`
        );
        
        const sessionTokens = await pool.query('SELECT token FROM sessions WHERE expires_at > NOW()');

        for (const row of sessionTokens.rows) {
            try {
                const match = await bcrypt.compare(token, row.token);
                if (match) {
                     const userResult = await pool.query(
                        `SELECT u.email FROM users u JOIN sessions s ON u.id = s.user_id WHERE s.token = $1`,
                        [row.token]
                     );
                     if (userResult.rows.length > 0) {
                        return userResult.rows[0].email;
                     }
                }
            } catch (e) {
                // Ignore tokens that cause bcrypt errors (e.g., old format)
                console.warn("Bcrypt compare failed for a token:", e);
                continue;
            }
        }

        return null; // No matching session found
    } catch (e) {
        console.error("Error fetching user by session token:", e);
        return null;
    }
}

export async function signup(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
      success: false,
    };
  }

  const {email, password} = validatedFields.data;
  const lowerCaseEmail = email.toLowerCase();

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    
    // Check if email exists in the users table (case-insensitive)
    const existingUser = await client.query('SELECT id FROM users WHERE LOWER(email) = $1', [
      lowerCaseEmail,
    ]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return {error: 'This email address is already in use.', success: false};
    }
    
    // Check if email exists in the custom_usernames table (case-insensitive)
    const existingCustomUsername = await client.query('SELECT id FROM custom_usernames WHERE LOWER(username) = $1', [
        lowerCaseEmail,
    ]);
    if (existingCustomUsername.rows.length > 0) {
        await client.query('ROLLBACK');
        return {error: 'This email address is already in use.', success: false};
    }

    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user with the lowercase email
    const newUserResult = await client.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email',
      [lowerCaseEmail, passwordHash]
    );
    
    const newUserId = newUserResult.rows[0].id;
    const newUserEmail = newUserResult.rows[0].email;
    const displayName = newUserEmail.split('@')[0];
    
    // Create a corresponding settings entry for the new user
    await client.query(
        'INSERT INTO user_settings (user_id, display_name) VALUES ($1, $2)',
        [newUserId, displayName]
    );

    await client.query('COMMIT');

  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error(e);
    return {error: `Database error during signup: ${e.message}`, success: false};
  } finally {
    client.release();
  }

  return {
    message: 'Signup successful! Please log in.',
    success: true,
  };
}

export async function login(
  prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const validatedFields = schema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.errors[0].message,
      success: false,
    };
  }

  const {email, password} = validatedFields.data;
  const lowerCaseEmail = email.toLowerCase();

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE LOWER(email) = $1', [
      lowerCaseEmail,
    ]);
    const user = userResult.rows[0];

    if (!user) {
      return {error: 'Invalid email or password.', success: false};
    }

    const match = await bcrypt.compare(password, user.password_hash);

    if (!match) {
      return {error: 'Invalid email or password.', success: false};
    }
    
    // Create a session
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(sessionToken, saltRounds);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const headersList = headers();
    const userAgent = headersList.get('user-agent');
    const ipAddress = headersList.get('x-forwarded-for');

    await pool.query(
        'INSERT INTO sessions (user_id, token, expires_at, user_agent, ip_address) VALUES ($1, $2, $3, $4, $5)',
        [user.id, hashedToken, expiresAt, userAgent, ipAddress]
    );

    cookies().set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60, // 1 week
      path: '/',
    });

  } catch (e: any) {
    console.error(e);
    return {error: `Database error during login: ${e.message}`, success: false};
  }

  redirect('/');
}

export async function logout() {
    const token = await getSessionToken();
    if (token) {
        try {
            const allSessions = await pool.query('SELECT id, token FROM sessions WHERE expires_at > NOW()');
            for (const row of allSessions.rows) {
                try {
                    const match = await bcrypt.compare(token, row.token);
                    if (match) {
                        await pool.query('DELETE FROM sessions WHERE id = $1', [row.id]);
                        break;
                    }
                } catch (e) {
                    continue;
                }
            }
        } catch (e) {
            console.error("Error deleting session from DB on logout:", e);
        }
    }
    cookies().delete('session_token');
    redirect('/login');
}

export async function logoutFromAllOtherDevices(): Promise<{ success: boolean, message?: string, error?: string }> {
    const email = await getLoggedInUserEmail();
    const currentToken = await getSessionToken();

    if (!email || !currentToken) {
        return { success: false, error: 'User or session not found.' };
    }

    try {
        const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return { success: false, error: 'User not found.' };
        }
        const userId = userResult.rows[0].id;

        const sessionsResult = await pool.query(
            'SELECT id, token FROM sessions WHERE user_id = $1 AND expires_at > NOW()',
            [userId]
        );

        const otherSessionIds: string[] = [];

        for (const row of sessionsResult.rows) {
            try {
                const match = await bcrypt.compare(currentToken, row.token);
                if (!match) {
                    otherSessionIds.push(row.id);
                }
            } catch (e) {
                otherSessionIds.push(row.id);
                continue;
            }
        }

        if (otherSessionIds.length > 0) {
             await pool.query(
                'DELETE FROM sessions WHERE id = ANY($1::uuid[])',
                [otherSessionIds]
            );
        }
        
        return { success: true, message: 'Successfully logged out from all other devices.' };
    } catch (e: any) {
        console.error("Error logging out from other devices:", e);
        return { success: false, error: 'A database error occurred.' };
    }
}
