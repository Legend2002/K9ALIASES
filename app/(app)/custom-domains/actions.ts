
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import pool from '@/lib/db';
import { getLoggedInUserEmail } from '@/app/(auth)/actions';
import { Domain } from '@/types';

type ActionResponse<T> = {
  data?: T | null;
  error?: string | null;
};

const AddDomainSchema = z.object({
  domainName: z.string().min(3, 'Domain name must be at least 3 characters.'),
  description: z.string().optional(),
});

const UpdateDomainStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const UpdateDomainSchema = z.object({
  id: z.string().uuid(),
  domainName: z.string().min(3, 'Domain name must be at least 3 characters.'),
  description: z.string().optional(),
});

const DeleteDomainSchema = z.object({
  id: z.string().uuid(),
});

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

export async function getCustomDomainsForUser(): Promise<ActionResponse<Domain[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'User not authenticated. Please log in to view domains.' };
  }
  
  try {
    const result = await pool.query(
      `SELECT id, user_id as "userId", domain_name as "domainName", description, is_active as "isActive", created_at as "createdAt"
       FROM custom_domains 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return { data: result.rows };
  } catch (e: any) {
    console.error("A database error occurred while fetching domains:", e);
    return { error: 'A database error occurred while fetching domains.' };
  }
}

export async function addDomain(
  prevState: ActionResponse<null>,
  formData: FormData
): Promise<ActionResponse<null>> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { error: 'You must be logged in to add a domain.' };
    }
    
    // Check current domain count
    const domainCountResult = await pool.query('SELECT COUNT(*) FROM custom_domains WHERE user_id = $1', [userId]);
    const domainCount = parseInt(domainCountResult.rows[0].count, 10);

    if (domainCount >= 10) {
      return { error: 'You have reached the maximum limit of 10 custom domains.' };
    }

    const validatedFields = AddDomainSchema.safeParse(Object.fromEntries(formData));
    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }
    const { domainName, description } = validatedFields.data;
    
    const existingDomain = await pool.query(
      'SELECT id FROM custom_domains WHERE user_id = $1 AND domain_name = $2',
      [userId, domainName]
    );

    if (existingDomain.rows.length > 0) {
      return { error: 'You have already added this domain.' };
    }

    await pool.query(
      'INSERT INTO custom_domains (user_id, domain_name, description) VALUES ($1, $2, $3)',
      [userId, domainName, description]
    );

    revalidatePath('/custom-domains');
    revalidatePath('/');
    return { data: null };

  } catch (e: any) {
    console.error(e);
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateDomain(
  prevState: ActionResponse<null>,
  formData: FormData
): Promise<ActionResponse<null>> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { error: 'You must be logged in to update a domain.' };
    }

    const validatedFields = UpdateDomainSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }

    const { id, domainName, description } = validatedFields.data;

    const result = await pool.query(
      'UPDATE custom_domains SET domain_name = $1, description = $2 WHERE id = $3 AND user_id = $4',
      [domainName, description, id, userId]
    );

    if (result.rowCount === 0) {
      return { error: 'Failed to update domain. Domain not found or you do not have permission.' };
    }
    
    revalidatePath('/custom-domains');
    return { data: null };

  } catch (e: any)
  {
    console.error(e);
    // Check for unique constraint violation
    if (e.code === '23505') {
        return { error: 'This domain name is already in use by another of your domains.' };
    }
    return { error: 'An unexpected error occurred.' };
  }
}

export async function updateDomainStatus(
  params: { id: string; isActive: boolean }
): Promise<ActionResponse<null>> {
  try {
    const userId = await getUserId();
    if (!userId) {
        return { error: 'You must be logged in to update a domain.' };
    }
    
    const validatedFields = UpdateDomainStatusSchema.safeParse(params);

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }
    
    const { id, isActive } = validatedFields.data;

    const result = await pool.query(
      `UPDATE custom_domains SET is_active = $1 WHERE id = $2 AND user_id = $3`,
      [isActive, id, userId]
    );

    if (result.rowCount === 0) {
        return { error: 'Failed to update domain status. Domain not found or you do not have permission.' };
    }

    revalidatePath('/custom-domains');
    return { data: null };

  } catch (e: any) {
    console.error(e);
    return { error: 'Failed to update domain status.' };
  }
}

export async function deleteDomain(
  params: { id: string }
): Promise<ActionResponse<null>> {
  try {
    const userId = await getUserId();
    if (!userId) {
      return { error: 'You must be logged in to delete a domain.' };
    }

    const validatedFields = DeleteDomainSchema.safeParse(params);

    if (!validatedFields.success) {
      return { error: validatedFields.error.errors[0].message };
    }
    const { id } = validatedFields.data;

    const result = await pool.query(
      'DELETE FROM custom_domains WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (result.rowCount === 0) {
      return { error: 'Failed to delete domain. Domain not found or you do not have permission.' };
    }

    revalidatePath('/custom-domains');
    revalidatePath('/');
    return { data: null };
  } catch (e: any) {
    console.error(e);
    return { error: 'Failed to delete domain.' };
  }
}
