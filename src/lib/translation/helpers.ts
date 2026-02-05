/**
 * UI Translation Helpers
 * 
 * Helper functions for getting user language and translating UI text.
 */

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { translateUIText as translateText } from '@/lib/translation/ui';

/**
 * Get the current user's preferred language code
 */
export async function getUserLanguage(): Promise<string> {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) return 'en';

    const user = await db.user.findUnique({
        where: { id: userId },
        select: { languageCode: true },
    });

    return user?.languageCode || 'en';
}

/**
 * Translate a UI text string for the current user
 */
export async function t(
    text: string,
    context: string = 'general'
): Promise<string> {
    const userLanguage = await getUserLanguage();

    if (userLanguage === 'en') {
        return text;
    }

    return translateText(text, 'en', userLanguage, context);
}

/**
 * Translate multiple UI text strings in parallel
 */
export async function tMany(
    texts: Record<string, string>,
    context: string = 'general'
): Promise<Record<string, string>> {
    const userLanguage = await getUserLanguage();

    if (userLanguage === 'en') {
        return texts;
    }

    const entries = Object.entries(texts);
    const translatedValues = await Promise.all(
        entries.map(([, value]) => translateText(value, 'en', userLanguage, context))
    );

    const result: Record<string, string> = {};
    entries.forEach(([key], index) => {
        result[key] = translatedValues[index];
    });

    return result;
}
