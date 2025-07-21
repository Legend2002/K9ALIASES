
'use server';

import { z } from 'zod';
import bcrypt from 'bcrypt';
import { getLoggedInUserEmail, logout } from '@/app/(auth)/actions';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';

const saltRounds = 10;

// Schemas
const updateProfileSchema = z.object({
    displayName: z.string().min(1, 'Display name cannot be empty.'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

const updateThemeSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long.'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "New passwords don't match",
  path: ['confirmPassword'], 
});


// Types
type ActionState = {
  message?: string;
  success: boolean;
  error?: string;
};

export type ProfileData = {
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
    theme: 'light' | 'dark' | 'system';
};


// Actions
export async function getProfileData(): Promise<ProfileData | null> {
    const email = await getLoggedInUserEmail();
    if (!email) {
        return null;
    }

    try {
        const result = await pool.query(
            `SELECT 
                u.email, 
                s.display_name as "displayName", 
                s.first_name as "firstName", 
                s.last_name as "lastName", 
                s.theme 
             FROM users u 
             LEFT JOIN user_settings s ON u.id = s.user_id 
             WHERE u.email = $1`,
            [email]
        );
        if (result.rows.length === 0) {
            return null;
        }
        const data = result.rows[0];
        return {
            email: data.email,
            displayName: data.displayName || data.email.split('@')[0],
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            theme: data.theme || 'system',
        };

    } catch (e: any) {
        console.error('Get profile data error:', e);
        return null;
    }
}

export async function updateProfile(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const email = await getLoggedInUserEmail();
    if (!email) {
        return { success: false, error: 'You must be logged in to update your profile.' };
    }
    
    const validatedFields = updateProfileSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            success: false,
            error: validatedFields.error.errors[0].message,
        };
    }

    const { displayName, firstName, lastName } = validatedFields.data;

    try {
         await pool.query(
            `UPDATE user_settings us
             SET display_name = $1, first_name = $2, last_name = $3 
             FROM users u
             WHERE us.user_id = u.id AND u.email = $4`,
            [displayName, firstName, lastName, email]
        );

        revalidatePath('/profile');
        revalidatePath('/'); // Revalidate root for header update

        return { success: true, message: 'Profile updated successfully!' };
    } catch (e: any) {
        console.error('Profile update error:', e);
        return { success: false, error: 'A database error occurred.' };
    }
}

export async function updateTheme(theme: 'light' | 'dark' | 'system'): Promise<ActionState> {
  const email = await getLoggedInUserEmail();
  if (!email) {
    return { success: false, error: 'You must be logged in to update your theme.' };
  }

  const validatedFields = updateThemeSchema.safeParse({ theme });
  if (!validatedFields.success) {
    return { success: false, error: 'Invalid theme value.' };
  }

  try {
     await pool.query(
        `UPDATE user_settings us
         SET theme = $1 
         FROM users u
         WHERE us.user_id = u.id AND u.email = $2`,
        [validatedFields.data.theme, email]
    );

    revalidatePath('/profile');
    revalidatePath('/'); // Revalidate all app layouts
    return { success: true, message: 'Theme updated successfully!' };
  } catch (error) {
    console.error('Update theme error:', error);
    return { success: false, error: 'A database error occurred.' };
  }
}

export async function changePassword(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = await getLoggedInUserEmail();
  if (!email) {
    return { success: false, error: 'You must be logged in to change your password.' };
  }

  const validatedFields = changePasswordSchema.safeParse(Object.fromEntries(formData));

  if (!validatedFields.success) {
    return {
      success: false,
      error: validatedFields.error.errors[0].message,
    };
  }

  const { currentPassword, newPassword } = validatedFields.data;

  try {
    const userResult = await pool.query('SELECT password_hash FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return { success: false, error: 'User not found.' };
    }
    const user = userResult.rows[0];

    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) {
      return { success: false, error: 'Incorrect current password.' };
    }

    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [newPasswordHash, email]);

    return { success: true, message: 'Password updated successfully!' };
  } catch (e: any) {
    console.error('Password change error:', e);
    return { success: false, error: 'A database error occurred.' };
  }
}

export async function deleteAccount(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = await getLoggedInUserEmail();
  if (!email) {
    return { success: false, error: 'User not found or not logged in.' };
  }

  const client = await pool.connect();
  try {
    const userResult = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return { success: false, error: 'User not found.' };
    }
    const userId = userResult.rows[0].id;

    await client.query('BEGIN');
    
    // Delete all dependent data first
    await client.query('DELETE FROM aliases WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM deleted_aliases WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM custom_domains WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM custom_usernames WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM sessions WHERE user_id = $1', [userId]);
    await client.query('DELETE FROM user_settings WHERE user_id = $1', [userId]);

    // Finally, delete the user
    await client.query('DELETE FROM users WHERE id = $1', [userId]);
    
    await client.query('COMMIT');
    
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error('Account deletion error:', e);
    return { success: false, error: 'A database error occurred during account deletion.' };
  } finally {
    client.release();
  }

  await logout();
  return { success: true, message: 'Account deleted successfully.' };
}
