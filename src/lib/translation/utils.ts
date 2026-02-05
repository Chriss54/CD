import { createHash } from 'crypto';

// Re-export constants from the client-safe constants file
export {
    SUPPORTED_LANGUAGES,
    LANGUAGE_NAMES,
    isSupportedLanguage,
    getLanguageName
} from './constants';
export type { SupportedLanguage } from './constants';

/**
 * Generate a SHA-256 hash of the given text
 * Used for cache invalidation when content changes
 */
export function hashContent(text: string): string {
    return createHash('sha256').update(text).digest('hex');
}
