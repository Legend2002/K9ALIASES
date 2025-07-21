
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import pool from '@/lib/db';
import { getLoggedInUserEmail } from '@/app/(auth)/actions';
import { Username } from '@/types';

type ActionResponse<T> = {
  data?: T | null;
  error?: string | null;
};

const AddUsernameSchema = z.object({
  username: z.string().email('Please enter a valid email address.'),
  description: z.string().optional(),
});

const UpdateUsernameSchema = z.object({
  id: z.string().uuid(),
  description: z.string().optional(),
});

const UpdateUsernameStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const DeleteUsernameSchema = z.object({
  id: z.string().uuid(),
});

const USERNAME_LIMIT = 2;

async function getUserId(): Promise<string | null> {
  const email = await getLoggedInUserEmail();
  if (!email) {
    return null;
  }
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return null;
    }
    return userResult.rows[0].id;
  } catch (e) {
    console.error("Database error in getUserId:", e);
    return null;
  }
}

export async function getUsernamesForUser(): Promise<ActionResponse<Username[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'User not authenticated.' };
  }
  
  try {
    const result = await pool.query(
      `SELECT id, username, description, is_active as "isActive", created_at as "createdAt"
       FROM custom_usernames 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    // Add non-database fields
    const usernames = result.rows.map(row => ({
      ...row,
      isDefault: false, // Custom usernames are never the default
    }));
    return { data: usernames };
  } catch (e: any) {
    console.error("A database error occurred while fetching usernames:", e);
    return { error: 'A database error occurred.' };
  }
}

export async function addUsername(
  prevState: ActionResponse<null>,
  formData: FormData
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to add a username.' };
  }

  try {
    const usernameCountResult = await pool.query('SELECT COUNT(*) FROM custom_usernames WHERE user_id = $1', [userId]);
    const usernameCount = parseInt(usernameCountResult.rows[0].count, 10);

    if (usernameCount >= USERNAME_LIMIT) {
      return { error: `You have reached the maximum limit of ${USERNAME_LIMIT} custom usernames.` };
    }

    const validatedFields = AddUsernameSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }
    const { username, description } = validatedFields.data;

    // Check if it's the same as the primary email or display name
    const userResult = await pool.query(
        `SELECT u.email, s.display_name
         FROM users u
         JOIN user_settings s ON u.id = s.user_id
         WHERE u.id = $1`,
        [userId]
    );
    const user = userResult.rows[0];

    if (username === user.email) {
      return { error: 'This is your primary email and cannot be added as a custom username.' };
    }
    if (username === user.display_name) {
        return { error: 'This is your display name and cannot be added as a custom username.' };
    }


    await pool.query(
      'INSERT INTO custom_usernames (user_id, username, description) VALUES ($1, $2, $3)',
      [userId, username, description]
    );

    revalidatePath('/usernames');
    revalidatePath('/');
    return { data: null };
  } catch (e: any) {
    if (e.code === '23505') { // unique_violation
      return { error: 'This username has already been added.' };
    }
    console.error(e);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateUsername(
  prevState: ActionResponse<null>,
  formData: FormData
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to update a username.' };
  }

  const validatedFields = UpdateUsernameSchema.safeParse(Object.fromEntries(formData));
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id, description } = validatedFields.data;

  try {
    const result = await pool.query(
      'UPDATE custom_usernames SET description = $1 WHERE id = $2 AND user_id = $3',
      [description, id, userId]
    );
    if (result.rowCount === 0) {
      return { error: 'Failed to update username. Not found or no permission.' };
    }
    revalidatePath('/usernames');
    return { data: null };
  } catch (e: any) {
    console.error(e);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateUsernameStatus(
  params: { id: string; isActive: boolean }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = UpdateUsernameStatusSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id, isActive } = validatedFields.data;

  try {
    const result = await pool.query(
      'UPDATE custom_usernames SET is_active = $1 WHERE id = $2 AND user_id = $3',
      [isActive, id, userId]
    );
    if (result.rowCount === 0) {
      return { error: 'Failed to update username status. Not found or no permission.' };
    }
    revalidatePath('/usernames');
    revalidatePath('/');
    return { data: null };
  } catch (e: any) {
    console.error(e);
    return { error: 'Failed to update username status.' };
  }
}

export async function deleteUsername(
  params: { id: string }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = DeleteUsernameSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id } = validatedFields.data;

  try {
    const result = await pool.query(
      'DELETE FROM custom_usernames WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    if (result.rowCount === 0) {
      return { error: 'Failed to delete username. Not found or no permission.' };
    }
    revalidatePath('/usernames');
    revalidatePath('/');
    return { data: null };
  } catch (e: any) {
    console.error(e);
    return { error: 'Failed to delete username.' };
  }
}
