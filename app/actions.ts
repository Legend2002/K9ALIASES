
"use server";

import pool from '@/lib/db';
import { getLoggedInUserEmail } from "./(auth)/actions";
import type { Domain, Username } from "@/types";

async function getUserIdByEmail(email: string): Promise<string | null> {
  try {
    const userResult = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return null;
    }
    return userResult.rows[0].id;
  } catch (e) {
    console.error("Database error in getUserIdByEmail:", e);
    return null;
  }
}

type AliasFormData = {
  domains: Domain[],
  usernames: Username[],
  preferences: {
    defaultCount: number,
    defaultAliasLength: number,
  }
}

export async function getAliasFormData(): Promise<AliasFormData> {
  const defaultReturn = { 
      domains: [], 
      usernames: [], 
      preferences: { 
          defaultCount: 1, 
          defaultAliasLength: 12,
      } 
  };
  const email = await getLoggedInUserEmail();
  if (!email) {
    return defaultReturn;
  }
  
  const userId = await getUserIdByEmail(email);
  if (!userId) {
     return defaultReturn;
  }
  
  try {
    const result = await pool.query(
        `SELECT
            default_alias_count as "defaultCount",
            default_alias_length as "defaultAliasLength"
         FROM user_settings
         WHERE user_id = $1`,
        [userId]
    );
     if (result.rows.length > 0) {
        const prefs = result.rows[0];
        defaultReturn.preferences.defaultCount = prefs.defaultCount || 1;
        defaultReturn.preferences.defaultAliasLength = prefs.defaultAliasLength || 12;
    }
  } catch (e: any) {
    console.warn("Could not fetch user preferences. Using defaults.", e.message);
  }

  const usernames: Username[] = [];
  usernames.push({
    id: 'primary',
    username: email,
    isDefault: true,
    description: 'Primary Account Email',
    isActive: true,
    createdAt: new Date().toISOString(),
  });

  try {
    const customUsernamesResult = await pool.query(
      `SELECT id, username, description, is_active as "isActive", created_at as "createdAt"
        FROM custom_usernames 
        WHERE user_id = $1 AND is_active = true
        ORDER BY created_at DESC`,
      [userId]
    );

    const customUsernames = customUsernamesResult.rows.map(row => ({
        ...row,
        isDefault: false,
    }));
    
    usernames.push(...customUsernames);
  } catch (error) {
    console.error("Could not fetch custom usernames:", error);
  }

  const domainsResult = await pool.query(
    `SELECT id, user_id as "userId", domain_name as "domainName", description, is_active as "isActive", created_at as "createdAt"
     FROM custom_domains 
     WHERE user_id = $1 AND is_active = true
     ORDER BY created_at DESC`,
    [userId]
  );
  
  return { ...defaultReturn, domains: domainsResult.rows, usernames };
}
