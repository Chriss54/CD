/**
 * Internationalization (i18n) System
 * 
 * Provides translated UI text based on user's preferred language.
 */

import { en, type Messages } from './messages/en';
import { de } from './messages/de';
import { es } from './messages/es';
import { fr } from './messages/fr';

// All available message translations
const messages: Record<string, Messages> = {
    en,
    de,
    es,
    fr,
};

/**
 * Get messages for a specific locale
 * Falls back to English if locale not found
 */
export function getMessages(locale: string): Messages {
    // Normalize locale (e.g., 'en-US' -> 'en')
    const normalizedLocale = locale.toLowerCase().split('-')[0];
    return messages[normalizedLocale] || en;
}

/**
 * Available locales
 */
export const availableLocales = Object.keys(messages);

// Re-export types
export type { Messages };
