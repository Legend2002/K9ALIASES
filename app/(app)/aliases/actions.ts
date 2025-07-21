
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import pool from '@/lib/db';
import { getLoggedInUserEmail } from '@/app/(auth)/actions';
import { Alias, DeletedAlias } from '@/types';

type ActionResponse<T> = {
  data?: T | null;
  error?: string | null;
  message?: string | null;
};

const AddAliasSchema = z.object({
  alias: z.string().email(),
  description: z.string().min(1, 'Description cannot be empty.'),
});

const DeleteAliasSchema = z.object({
  id: z.string().uuid(),
});

const RestoreAliasSchema = z.object({
  id: z.string().uuid(),
});

const PermanentlyDeleteAliasSchema = z.object({
  id: z.string().uuid(),
});

const UpdateAliasStatusSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});

const ALIAS_LIMIT = 30;

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

export async function addAlias(
  params: z.infer<typeof AddAliasSchema>
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to save an alias.' };
  }
  
  const validatedFields = AddAliasSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { alias, description } = validatedFields.data;

  try {
    // Check for active alias limit
    const activeAliasCountResult = await pool.query(
      'SELECT COUNT(*) FROM aliases WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const activeAliasCount = parseInt(activeAliasCountResult.rows[0].count, 10);
    
    if (activeAliasCount >= ALIAS_LIMIT) {
      return { error: `You have reached the limit of ${ALIAS_LIMIT} active aliases. Please deactivate or delete an alias to add a new one.` };
    }

    const existingAlias = await pool.query(
      'SELECT id FROM aliases WHERE user_id = $1 AND alias = $2',
      [userId, alias]
    );

    if (existingAlias.rows.length > 0) {
      return { error: 'This alias has already been saved.' };
    }

    await pool.query(
      'INSERT INTO aliases (user_id, alias, description) VALUES ($1, $2, $3)',
      [userId, alias, description]
    );

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { data: null };

  } catch (e: any) {
    console.error("Database error in addAlias:", e);
    return { error: 'A database error occurred.' };
  }
}

export async function getAliasesForUser(): Promise<ActionResponse<Alias[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'User not authenticated.' };
  }
  
  try {
    const result = await pool.query(
      `SELECT id, alias, description, is_active as "isActive", created_at as "createdAt"
       FROM aliases 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return { data: result.rows };
  } catch (e: any) {
    console.error("A database error occurred while fetching aliases:", e);
    return { error: 'A database error occurred.' };
  }
}

export async function searchAliases(query: string): Promise<ActionResponse<Alias[]>> {
    const userId = await getUserId();
    if (!userId) {
        return { error: 'User not authenticated.' };
    }

    if (!query) {
        return { data: [] };
    }

    try {
        const result = await pool.query(
            `SELECT id, alias, description, is_active as "isActive", created_at as "createdAt"
             FROM aliases 
             WHERE user_id = $1 AND (alias ILIKE $2 OR description ILIKE $2)
             ORDER BY created_at DESC
             LIMIT 7`,
            [userId, `%${query}%`]
        );
        return { data: result.rows };
    } catch (e: any) {
        console.error("A database error occurred while searching aliases:", e);
        return { error: 'A database error occurred during search.' };
    }
}

export async function getAliasesCountForUser(): Promise<ActionResponse<{total: number, active: number, inactive: number, deleted: number, limit: number}>> {
  const userId = await getUserId();
  const defaultCounts = { total: 0, active: 0, inactive: 0, deleted: 0, limit: ALIAS_LIMIT };
  if (!userId) {
    return { error: 'User not authenticated.', data: defaultCounts };
  }
  try {
    const aliasCountsResult = await pool.query(
      `SELECT 
         COUNT(*) FILTER (WHERE is_active = true) as active,
         COUNT(*) FILTER (WHERE is_active = false) as inactive
       FROM aliases 
       WHERE user_id = $1`, 
      [userId]
    );
    
    const deletedCountResult = await pool.query(
      `SELECT COUNT(*) as deleted FROM deleted_aliases WHERE user_id = $1`,
      [userId]
    );
    
    const active = parseInt(aliasCountsResult.rows[0].active, 10);
    const inactive = parseInt(aliasCountsResult.rows[0].inactive, 10);
    const deleted = parseInt(deletedCountResult.rows[0].deleted, 10);
    const total = active + inactive + deleted;
    
    return { 
      data: {
        total,
        active,
        inactive,
        deleted,
        limit: ALIAS_LIMIT
      } 
    };
  } catch (e: any) {
    console.error("A database error occurred while fetching alias count:", e);
    return { error: 'A database error occurred.', data: defaultCounts };
  }
}

export async function deleteAlias(
  params: { id: string }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = DeleteAliasSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id } = validatedFields.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the alias to be deleted
    const aliasResult = await client.query(
      'SELECT id, user_id, alias, description, created_at FROM aliases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (aliasResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'Failed to delete alias. Not found or no permission.' };
    }
    const aliasToDelete = aliasResult.rows[0];

    // Insert into deleted_aliases table
    await client.query(
      'INSERT INTO deleted_aliases (id, user_id, alias, description, created_at) VALUES ($1, $2, $3, $4, $5)',
      [aliasToDelete.id, aliasToDelete.user_id, aliasToDelete.alias, aliasToDelete.description, aliasToDelete.created_at]
    );

    // Delete from aliases table
    const deleteResult = await client.query(
      'DELETE FROM aliases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (deleteResult.rowCount === 0) {
      // This should ideally not happen if the select worked, but it's a good safeguard
      await client.query('ROLLBACK');
      return { error: 'Failed to delete alias. Please try again.' };
    }

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { data: null };
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Database error in deleteAlias transaction:", e);
    return { error: 'Failed to delete alias due to a database error.' };
  } finally {
    client.release();
  }
}

export async function updateAliasStatus(
  params: { id: string; isActive: boolean }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = UpdateAliasStatusSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id, isActive } = validatedFields.data;

  try {
    // If activating, check if the limit is reached
    if (isActive) {
      const activeAliasCountResult = await pool.query(
        'SELECT COUNT(*) FROM aliases WHERE user_id = $1 AND is_active = true',
        [userId]
      );
      const activeAliasCount = parseInt(activeAliasCountResult.rows[0].count, 10);
      if (activeAliasCount >= ALIAS_LIMIT) {
        return { error: `You have reached the limit of ${ALIAS_LIMIT} active aliases.` };
      }
    }

    const result = await pool.query(
      'UPDATE aliases SET is_active = $1 WHERE id = $2 AND user_id = $3',
      [isActive, id, userId]
    );

    if (result.rowCount === 0) {
      return { error: 'Failed to update alias status. Not found or no permission.' };
    }

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { data: null };
  } catch (e: any) {
    console.error("Database error in updateAliasStatus:", e);
    return { error: 'Failed to update alias status.' };
  }
}

export async function getDeletedAliasesForUser(): Promise<ActionResponse<DeletedAlias[]>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'User not authenticated.' };
  }
  
  try {
    const result = await pool.query(
      `SELECT id, alias, description, created_at as "createdAt", deleted_at as "deletedAt"
       FROM deleted_aliases
       WHERE user_id = $1 
       ORDER BY deleted_at DESC`,
      [userId]
    );
    return { data: result.rows };
  } catch (e: any) {
    console.error("A database error occurred while fetching deleted aliases:", e);
    return { error: 'A database error occurred.' };
  }
}

export async function permanentlyDeleteAlias(
  params: { id: string }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = PermanentlyDeleteAliasSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id } = validatedFields.data;

  try {
    const deleteResult = await pool.query(
      'DELETE FROM deleted_aliases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (deleteResult.rowCount === 0) {
      return { error: 'Failed to permanently delete alias. Not found or no permission.' };
    }

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { data: null };
  } catch (e: any) {
    console.error("Database error in permanentlyDeleteAlias:", e);
    return { error: 'Failed to permanently delete alias due to a database error.' };
  }
}

export async function restoreAlias(
  params: { id: string }
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in.' };
  }

  const validatedFields = RestoreAliasSchema.safeParse(params);
  if (!validatedFields.success) {
    return { error: validatedFields.error.errors[0].message };
  }
  const { id } = validatedFields.data;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Find the alias to be restored
    const aliasResult = await client.query(
      'SELECT id, user_id, alias, description, created_at FROM deleted_aliases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (aliasResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return { error: 'Failed to restore alias. Not found or no permission.' };
    }
    const aliasToRestore = aliasResult.rows[0];

    // Check active alias limit
    const activeAliasCountResult = await client.query(
      'SELECT COUNT(*) FROM aliases WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const activeAliasCount = parseInt(activeAliasCountResult.rows[0].count, 10);
    const shouldBeActive = activeAliasCount < ALIAS_LIMIT;

    // Insert back into aliases table
    await client.query(
      'INSERT INTO aliases (id, user_id, alias, description, created_at, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
      [aliasToRestore.id, aliasToRestore.user_id, aliasToRestore.alias, aliasToRestore.description, aliasToRestore.created_at, shouldBeActive]
    );

    // Delete from deleted_aliases table
    const deleteResult = await client.query(
      'DELETE FROM deleted_aliases WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (deleteResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return { error: 'Failed to restore alias. Please try again.' };
    }

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');

    const message = shouldBeActive
      ? 'Alias has been restored and set to active.'
      : 'Alias has been restored as inactive because you have reached your active alias limit.';

    return { message };

  } catch (e: any) {
    await client.query('ROLLBACK');
    // Check for unique constraint violation (just in case)
    if (e.code === '23505') {
        return { error: 'This alias already exists in your active list.' };
    }
    console.error("Database error in restoreAlias transaction:", e);
    return { error: 'Failed to restore alias due to a database error.' };
  } finally {
    client.release();
  }
}

export async function permanentlyDeleteAllAliases(
  ids?: string[]
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  try {
    let query = 'DELETE FROM deleted_aliases WHERE user_id = $1';
    const params: any[] = [userId];

    if (ids && ids.length > 0) {
      query += ' AND id = ANY($2::uuid[])';
      params.push(ids);
    }
    
    await pool.query(query, params);

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { message: 'Selected aliases have been permanently removed.' };
  } catch (e: any) {
    console.error("Database error in permanentlyDeleteAllAliases:", e);
    return { error: 'Failed to delete aliases due to a database error.' };
  }
}

export async function restoreAllDeletedAliases(
  ids?: string[]
): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let selectQuery = 'SELECT id, user_id, alias, description, created_at FROM deleted_aliases WHERE user_id = $1';
    const selectParams: any[] = [userId];

    if (ids && ids.length > 0) {
      selectQuery += ' AND id = ANY($2::uuid[])';
      selectParams.push(ids);
    } else {
      // If no IDs, restore all, so we need to fetch them all
    }

    const deletedAliasesResult = await client.query(selectQuery, selectParams);
    const aliasesToRestore = deletedAliasesResult.rows;

    if (aliasesToRestore.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No aliases to restore.' };
    }

    // To prevent exceeding limits and for simplicity, restore all as inactive.
    for (const alias of aliasesToRestore) {
      // Avoid re-inserting if it somehow already exists
      const existingAlias = await client.query(
        'SELECT id FROM aliases WHERE id = $1',
        [alias.id]
      );
      if (existingAlias.rows.length === 0) {
        await client.query(
          'INSERT INTO aliases (id, user_id, alias, description, created_at, is_active) VALUES ($1, $2, $3, $4, $5, $6)',
          [alias.id, alias.user_id, alias.alias, alias.description, alias.created_at, false]
        );
      }
    }
    
    // Now delete from the deleted_aliases table
    const idsToDelete = aliasesToRestore.map(a => a.id);
    await client.query(
      'DELETE FROM deleted_aliases WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, idsToDelete]
    );

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { message: 'Selected aliases have been restored as inactive.' };
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Database error in restoreAllDeletedAliases transaction:", e);
    return { error: 'Failed to restore aliases due to a database error.' };
  } finally {
    client.release();
  }
}

export async function deleteAllInactiveAliases(ids?: string[]): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let selectQuery = 'SELECT id, user_id, alias, description, created_at FROM aliases WHERE user_id = $1 AND is_active = false';
    const selectParams: any[] = [userId];

    if (ids && ids.length > 0) {
        selectQuery += ' AND id = ANY($2::uuid[])';
        selectParams.push(ids);
    }
    
    const inactiveAliasesResult = await client.query(selectQuery, selectParams);
    const aliasesToDelete = inactiveAliasesResult.rows;

    if (aliasesToDelete.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No matching inactive aliases to delete.' };
    }

    // Insert into deleted_aliases table
    for (const alias of aliasesToDelete) {
      await client.query(
        'INSERT INTO deleted_aliases (id, user_id, alias, description, created_at) VALUES ($1, $2, $3, $4, $5)',
        [alias.id, alias.user_id, alias.alias, alias.description, alias.created_at]
      );
    }
    
    // Delete from aliases table
    const idsToDeleteFromAliases = aliasesToDelete.map(a => a.id);
    await client.query(
      'DELETE FROM aliases WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, idsToDeleteFromAliases]
    );

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { message: 'Selected inactive aliases have been moved to the deleted history.' };
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Database error in deleteAllInactiveAliases transaction:", e);
    return { error: 'Failed to delete inactive aliases due to a database error.' };
  } finally {
    client.release();
  }
}

export async function activateAllInactiveAliases(ids?: string[]): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const activeAliasCountResult = await client.query(
      'SELECT COUNT(*) FROM aliases WHERE user_id = $1 AND is_active = true',
      [userId]
    );
    const activeAliasCount = parseInt(activeAliasCountResult.rows[0].count, 10);
    const availableSlots = ALIAS_LIMIT - activeAliasCount;

    if (availableSlots <= 0) {
      await client.query('ROLLBACK');
      return { message: 'No available slots to activate aliases. Please deactivate some first.' };
    }

    let selectQuery = 'SELECT id FROM aliases WHERE user_id = $1 AND is_active = false';
    const selectParams: (string | number | string[])[] = [userId];

    let idsToActivate: string[];

    if (ids && ids.length > 0) {
      // If specific IDs are provided, use them, but respect the available slots
      idsToActivate = ids.slice(0, availableSlots);
    } else {
      // If no IDs are provided, fetch all inactive aliases up to the available limit
      selectQuery += ' LIMIT $2';
      selectParams.push(availableSlots);
      const inactiveAliasesResult = await client.query(selectQuery, selectParams);
      idsToActivate = inactiveAliasesResult.rows.map(a => a.id);
    }

    if (idsToActivate.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No inactive aliases to activate.' };
    }
    
    await client.query(
      'UPDATE aliases SET is_active = true WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, idsToActivate]
    );

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    
    const message = `Successfully activated ${idsToActivate.length} alias(es).`;
    return { message };
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Database error in activateAllInactiveAliases transaction:", e);
    return { error: 'Failed to activate aliases due to a database error.' };
  } finally {
    client.release();
  }
}

export async function deactivateAllActiveAliases(ids?: string[]): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  try {
    let query = 'UPDATE aliases SET is_active = false WHERE user_id = $1 AND is_active = true';
    const params: any[] = [userId];

    if (ids && ids.length > 0) {
      query += ' AND id = ANY($2::uuid[])';
      params.push(ids);
    }

    const result = await pool.query(query, params);

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/applications');
    return { message: `Successfully deactivated ${result.rowCount} alias(es).` };
  } catch (e: any) {
    console.error("Database error in deactivateAllActiveAliases:", e);
    return { error: 'Failed to deactivate aliases due to a database error.' };
  }
}

export async function deleteAllActiveAliases(ids?: string[]): Promise<ActionResponse<null>> {
  const userId = await getUserId();
  if (!userId) {
    return { error: 'You must be logged in to perform this action.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let selectQuery = 'SELECT id, user_id, alias, description, created_at FROM aliases WHERE user_id = $1 AND is_active = true';
    const selectParams: any[] = [userId];

    if (ids && ids.length > 0) {
        selectQuery += ' AND id = ANY($2::uuid[])';
        selectParams.push(ids);
    }
    
    const activeAliasesResult = await client.query(selectQuery, selectParams);
    const aliasesToDelete = activeAliasesResult.rows;

    if (aliasesToDelete.length === 0) {
      await client.query('ROLLBACK');
      return { message: 'No matching active aliases to delete.' };
    }

    for (const alias of aliasesToDelete) {
      await client.query(
        'INSERT INTO deleted_aliases (id, user_id, alias, description, created_at) VALUES ($1, $2, $3, $4, $5)',
        [alias.id, alias.user_id, alias.alias, alias.description, alias.created_at]
      );
    }
    
    const idsToDeleteFromAliases = aliasesToDelete.map(a => a.id);
    await client.query(
      'DELETE FROM aliases WHERE user_id = $1 AND id = ANY($2::uuid[])',
      [userId, idsToDeleteFromAliases]
    );

    await client.query('COMMIT');

    revalidatePath('/aliases');
    revalidatePath('/');
    revalidatePath('/deleted-aliases');
    revalidatePath('/applications');
    return { message: 'Selected active aliases have been moved to the deleted history.' };
  } catch (e: any) {
    await client.query('ROLLBACK');
    console.error("Database error in deleteAllActiveAliases transaction:", e);
    return { error: 'Failed to delete active aliases due to a database error.' };
  } finally {
    client.release();
  }
}
