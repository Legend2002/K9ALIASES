
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a random alphanumeric string of a given length, with specified casing.
 * @param length The length of the string to generate.
 * @param caseStyle The casing to use: 'mixed', 'lowercase', or 'uppercase'.
 * @returns A random alphanumeric string.
 */
function generateRandomString(length: number, caseStyle: 'mixed' | 'lowercase' | 'uppercase'): string {
  const lowerChars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let chars = '';

  switch (caseStyle) {
    case 'lowercase':
      chars = lowerChars;
      break;
    case 'uppercase':
      chars = upperChars;
      break;
    case 'mixed':
    default:
      chars = lowerChars + upperChars;
      break;
  }
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitizes a description string into a single CamelCase word.
 * @param description The input string.
 * @returns The sanitized string.
 */
function sanitizeDescription(description: string): string {
  if (!description) {
    return "Alias";
  }
  return description
    .replace(/[^a-zA-Z0-9\s]/g, '') // Remove special characters
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

/**
 * Inserts one or more dots randomly into a username string.
 * @param username The username part of an email.
 * @returns A new username with dots inserted.
 */
function addDotsToUsername(username: string): string {
  if (username.length <= 1) {
    return username;
  }
  
  const chars = username.split('');
  let newUsername = chars[0];
  let dotsInserted = 0;
  
  // Iterate from the second character
  for (let i = 1; i < chars.length; i++) {
    // Randomly decide whether to add a dot
    if (Math.random() > 0.5) {
      newUsername += '.';
      dotsInserted++;
    }
    newUsername += chars[i];
  }
  
  // If no dots were inserted by chance, force at least one dot
  if (dotsInserted === 0 && username.length > 1) {
    const insertPosition = Math.floor(Math.random() * (username.length - 1)) + 1;
    newUsername = username.slice(0, insertPosition) + '.' + username.slice(insertPosition);
  }

  return newUsername;
}

/**
 * Generates a secure, disposable email alias.
 * @param options The parameters for alias generation.
 * @returns A newly generated email alias string.
 */
export function generateAlias({
  primaryEmail,
  description,
  length = 12,
  separator = '-',
  caseStyle = 'mixed'
}: {
  primaryEmail: string;
  description: string;
  length?: number;
  separator?: string;
  caseStyle?: 'mixed' | 'lowercase' | 'uppercase';
}): string {
  const emailParts = primaryEmail.split('@');
  if (emailParts.length !== 2) {
    return `invalid.email.${generateRandomString(5, 'lowercase')}@error.com`;
  }
  
  const [username, domain] = emailParts;
  
  const dottedUsername = addDotsToUsername(username);
  const sanitizedDesc = sanitizeDescription(description);
  const randomString = generateRandomString(length, caseStyle);

  // Use '+' for subaddressing, and the custom separator between description and random string
  return `${dottedUsername}+${sanitizedDesc}${separator}${randomString}@${domain}`;
}
