
'use server';

import { z } from 'zod';
import { getLoggedInUserEmail, getSessionToken, logoutFromAllOtherDevices as authLogoutFromAll } from '@/app/(auth)/actions';
import pool from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { Session, Alias } from '@/types';
import bcrypt from 'bcrypt';
import { PDFDocument, rgb, StandardFonts, PDFFont } from 'pdf-lib';
import { format } from 'date-fns';
import fs from 'fs/promises';
import path from 'path';


// Schemas
const updateAppPreferencesSchema = z.object({
    defaultAliasCount: z.coerce.number().min(1).max(5),
    defaultAliasLength: z.enum(['12', '16']).transform(Number),
});

const updateNotificationPreferencesSchema = z.object({
    notifyOnAliasCreation: z.preprocess((val) => val === 'on', z.boolean()),
    notifyOnSecurityEvent: z.preprocess((val) => val === 'on', z.boolean()),
    sendWeeklySummary: z.preprocess((val) => val === 'on', z.boolean()),
});

const updateAliasGenerationRulesSchema = z.object({
    aliasSeparator: z.enum(['-', '_', '.']),
    aliasCase: z.enum(['mixed', 'lowercase', 'uppercase']),
});


// Types
type ActionState = {
  message?: string;
  success: boolean;
  error?: string;
};

export type SettingsData = {
    email: string;
    defaultAliasCount: number;
    defaultAliasLength: number;
    notifyOnAliasCreation: boolean;
    notifyOnSecurityEvent: boolean;
    sendWeeklySummary: boolean;
    aliasSeparator: '-' | '_' | '.';
    aliasCase: 'mixed' | 'lowercase' | 'uppercase';
};


// Actions
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

export async function getSettingsData(): Promise<SettingsData | null> {
    const email = await getLoggedInUserEmail();
    if (!email) {
        return null;
    }

    try {
        const result = await pool.query(
            `SELECT 
                u.email,
                s.default_alias_count as "defaultAliasCount", 
                s.default_alias_length as "defaultAliasLength", 
                s.notify_on_alias_creation as "notifyOnAliasCreation", 
                s.notify_on_security_event as "notifyOnSecurityEvent", 
                s.send_weekly_summary as "sendWeeklySummary", 
                s.alias_separator as "aliasSeparator", 
                s.alias_case as "aliasCase" 
             FROM users u
             LEFT JOIN user_settings s ON u.id = s.user_id
             WHERE u.email = $1`,
            [email]
        );
        if (result.rows.length === 0) {
            return null;
        }
        const data = result.rows[0];
        // Provide default values if settings are not yet populated for a user
        return {
            email: data.email,
            defaultAliasCount: data.defaultAliasCount || 1,
            defaultAliasLength: data.defaultAliasLength || 12,
            notifyOnAliasCreation: data.notifyOnAliasCreation || false,
            notifyOnSecurityEvent: data.notifyOnSecurityEvent || true,
            sendWeeklySummary: data.sendWeeklySummary || false,
            aliasSeparator: data.aliasSeparator || '-',
            aliasCase: data.aliasCase || 'mixed',
        };
    } catch (e: any) {
        console.error('Get settings data error:', e);
        return null;
    }
}

export async function updateAppPreferences(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const userId = await getUserId();
    if (!userId) {
        return { success: false, error: 'You must be logged in to update preferences.' };
    }
    
    const validatedFields = updateAppPreferencesSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return {
            success: false,
            error: validatedFields.error.errors[0].message,
        };
    }
    
    const { defaultAliasCount, defaultAliasLength } = validatedFields.data;

    try {
        await pool.query(
            'UPDATE user_settings SET default_alias_count = $1, default_alias_length = $2, updated_at = NOW() WHERE user_id = $3',
            [defaultAliasCount, defaultAliasLength, userId]
        );

        revalidatePath('/settings');
        revalidatePath('/create-alias'); 

        return { success: true, message: 'Application preferences updated successfully!' };
    } catch (e: any) {
        console.error('App preferences update error:', e);
        return { success: false, error: 'A database error occurred.' };
    }
}

export async function updateNotificationPreferences(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const userId = await getUserId();
    if (!userId) {
        return { success: false, error: 'You must be logged in to update preferences.' };
    }
    
    const data = {
        notifyOnAliasCreation: formData.get('notifyOnAliasCreation') || 'off',
        notifyOnSecurityEvent: formData.get('notifyOnSecurityEvent') || 'off',
        sendWeeklySummary: formData.get('sendWeeklySummary') || 'off',
    };

    const validatedFields = updateNotificationPreferencesSchema.safeParse(data);

    if (!validatedFields.success) {
        return {
            success: false,
            error: validatedFields.error.errors[0].message,
        };
    }
    
    const { notifyOnAliasCreation, notifyOnSecurityEvent, sendWeeklySummary } = validatedFields.data;

    try {
        await pool.query(
            'UPDATE user_settings SET notify_on_alias_creation = $1, notify_on_security_event = $2, send_weekly_summary = $3, updated_at = NOW() WHERE user_id = $4',
            [notifyOnAliasCreation, notifyOnSecurityEvent, sendWeeklySummary, userId]
        );

        revalidatePath('/settings');

        return { success: true, message: 'Notification preferences updated successfully!' };
    } catch (e: any) {
        console.error('Notification preferences update error:', e);
        return { success: false, error: 'A database error occurred while updating notification preferences.' };
    }
}

export async function updateAliasGenerationRules(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const userId = await getUserId();
    if (!userId) {
        return { success: false, error: 'You must be logged in to update preferences.' };
    }
    
    const validatedFields = updateAliasGenerationRulesSchema.safeParse(Object.fromEntries(formData));

    if (!validatedFields.success) {
        return { success: false, error: validatedFields.error.errors[0].message };
    }
    
    const { aliasSeparator, aliasCase } = validatedFields.data;

    try {
        await pool.query(
            'UPDATE user_settings SET alias_separator = $1, alias_case = $2, updated_at = NOW() WHERE user_id = $3',
            [aliasSeparator, aliasCase, userId]
        );
        revalidatePath('/settings');
        return { success: true, message: 'Alias generation rules updated!' };
    } catch (e: any) {
        console.error('Alias generation rules update error:', e);
        return { success: false, error: 'A database error occurred.' };
    }
}


export async function getSessions(): Promise<{ currentSession: Session | null; otherSessions: Session[] }> {
    const email = await getLoggedInUserEmail();
    const currentToken = await getSessionToken();
    if (!email || !currentToken) {
        return { currentSession: null, otherSessions: [] };
    }

    try {
        const result = await pool.query(
            `SELECT s.id, s.token, s.user_agent as "userAgent", s.ip_address as "ipAddress", s.created_at as "createdAt"
             FROM sessions s
             JOIN users u ON s.user_id = u.id
             WHERE u.email = $1 AND s.expires_at > NOW()
             ORDER BY s.created_at DESC`,
            [email]
        );

        let currentSession: Session | null = null;
        const otherSessions: Session[] = [];

        for (const row of result.rows) {
            try {
                const match = await bcrypt.compare(currentToken, row.token);
                if (match) {
                    currentSession = row;
                } else {
                    otherSessions.push(row);
                }
            } catch (hashError) {
                // Ignore rows with invalid hash formats, which might occur with old data
                console.warn(`Could not compare token for session ${row.id}:`, hashError);
            }
        }
        
        return { currentSession, otherSessions };
    } catch (e: any) {
        console.error("Get sessions error:", e);
        return { currentSession: null, otherSessions: [] };
    }
}

export async function logoutFromAllOtherDevices(): Promise<ActionState> {
    const result = await authLogoutFromAll();
    if (result.success) {
        revalidatePath('/settings');
        return { success: true, message: result.message };
    }
    return { success: false, error: result.error };
}

// Helper function to wrap text
const getWrappedText = (text: string, font: PDFFont, fontSize: number, maxWidth: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
        const lineWithWord = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(lineWithWord, fontSize);
        if (width <= maxWidth) {
            currentLine = lineWithWord;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
            // Handle case where a single word is longer than maxWidth
            while (font.widthOfTextAtSize(currentLine, fontSize) > maxWidth) {
                let tempLine = '';
                for (const char of currentLine) {
                    if (font.widthOfTextAtSize(tempLine + char, fontSize) > maxWidth) {
                        lines.push(tempLine);
                        tempLine = char;
                    } else {
                        tempLine += char;
                    }
                }
                currentLine = tempLine;
            }
        }
    }
    if (currentLine) {
        lines.push(currentLine);
    }
    return lines;
};


export async function exportAliasesToPdf(): Promise<{ success: boolean; data?: string; error?: string }> {
    const email = await getLoggedInUserEmail();
    if (!email) {
        return { success: false, error: "User not authenticated." };
    }

    try {
        const userId = await getUserId();
        if (!userId) {
            return { success: false, error: "User not found." };
        }

        const aliasesResult = await pool.query<Alias>(
            `SELECT id, alias, description, is_active as "isActive", created_at as "createdAt"
             FROM aliases WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        );
        const aliases = aliasesResult.rows;

        const pdfDoc = await PDFDocument.create();
        let page = pdfDoc.addPage();
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
        
        const margin = 50;
        
        // --- Header Section ---
        const logoPath = path.resolve(process.cwd(), 'public/k9-logo.png');
        const logoImageBytes = await fs.readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoImageBytes);
        const logoDims = logoImage.scale(0.25);

        page.drawImage(logoImage, {
            x: margin,
            y: height - margin - logoDims.height,
            width: logoDims.width,
            height: logoDims.height,
        });

        const headerX = margin + logoDims.width + 20;
        page.drawText(`User: ${email}`, {
            x: headerX,
            y: height - margin - 20,
            font,
            size: 10,
            color: rgb(0.3, 0.3, 0.3),
        });
        page.drawText(`Date: ${format(new Date(), 'yyyy-MM-dd HH:mm')}`, {
            x: headerX,
            y: height - margin - 35,
            font,
            size: 10,
            color: rgb(0.3, 0.3, 0.3),
        });

        page.drawText('K9-ALI@SES Alias Export', {
            x: margin,
            y: height - margin - logoDims.height - 25,
            font: boldFont,
            size: 18,
            color: rgb(0, 0, 0),
        });
        // --- End Header Section ---
        
        let yPos = height - margin - logoDims.height - 60;

        // Table properties
        const table = {
            x: margin,
            width: width - margin * 2,
            colWidths: [240, 150, 60, 80],
            headers: ['Alias', 'Description', 'Status', 'Created At'],
            headerFontSize: 10,
            bodyFontSize: 9,
            rowPadding: 5
        };

        const drawTableHeader = (currentPage: any) => {
            let currentX = table.x;
            currentPage.drawRectangle({
                x: table.x,
                y: yPos - table.headerFontSize - table.rowPadding * 2,
                width: table.width,
                height: table.headerFontSize + table.rowPadding * 2,
                color: rgb(0.9, 0.9, 0.9),
                borderWidth: 1,
                borderColor: rgb(0.8, 0.8, 0.8)
            });

            table.headers.forEach((header, i) => {
                currentPage.drawText(header, {
                    x: currentX + table.rowPadding,
                    y: yPos - table.headerFontSize - table.rowPadding + 2,
                    font: boldFont,
                    size: table.headerFontSize
                });
                currentX += table.colWidths[i];
            });
             yPos -= (table.headerFontSize + table.rowPadding * 2);
        };
        
        drawTableHeader(page);

        for (const alias of aliases) {
            const rowData = [
                alias.alias,
                alias.description,
                alias.isActive ? 'Active' : 'Inactive',
                format(new Date(alias.createdAt), 'yyyy-MM-dd')
            ];

            // Wrap text and calculate max lines for the row
            const wrappedCells = rowData.map((text, i) =>
                getWrappedText(text, font, table.bodyFontSize, table.colWidths[i] - (table.rowPadding * 2))
            );
            const maxLines = Math.max(...wrappedCells.map(lines => lines.length));
            const rowHeight = maxLines * (table.bodyFontSize + 2) + (table.rowPadding * 2);
            
            // Check for page break
            if (yPos - rowHeight < margin) {
                page = pdfDoc.addPage();
                yPos = height - margin - 20; 
                drawTableHeader(page);
            }
            
            yPos -= rowHeight;
            let currentX = table.x;

            // Draw cell content
            wrappedCells.forEach((lines, i) => {
                 let lineY = yPos + rowHeight - table.bodyFontSize - table.rowPadding;
                 lines.forEach(line => {
                     page.drawText(line, {
                        x: currentX + table.rowPadding,
                        y: lineY,
                        font,
                        size: table.bodyFontSize,
                        color: rgb(0.1, 0.1, 0.1)
                    });
                    lineY -= (table.bodyFontSize + 2);
                 });
                currentX += table.colWidths[i];
            });

            // Draw row border
            page.drawLine({
                start: { x: table.x, y: yPos },
                end: { x: table.x + table.width, y: yPos },
                thickness: 0.5,
                color: rgb(0.8, 0.8, 0.8)
            });
        }

        const pdfBytes = await pdfDoc.save();
        const pdfBase64 = Buffer.from(pdfBytes).toString('base64');
        
        return { success: true, data: pdfBase64 };

    } catch (e: any) {
        console.error("Export aliases error:", e);
        return { success: false, error: "A database error occurred during PDF export." };
    }
}
