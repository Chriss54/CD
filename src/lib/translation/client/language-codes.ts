/**
 * Language Code Utilities
 * 
 * Maps BCP-47 browser locale codes to DeepL target language codes.
 * Handles fallbacks for regional variants (e.g., pt → PT-BR).
 */

// DeepL supported languages with their display names
export const SUPPORTED_LANGUAGES = {
    'en': { name: 'English', nativeName: 'English', deeplCode: 'EN-US' },
    'de': { name: 'German', nativeName: 'Deutsch', deeplCode: 'DE' },
    'es': { name: 'Spanish', nativeName: 'Español', deeplCode: 'ES' },
    'fr': { name: 'French', nativeName: 'Français', deeplCode: 'FR' },
    'it': { name: 'Italian', nativeName: 'Italiano', deeplCode: 'IT' },
    'ja': { name: 'Japanese', nativeName: '日本語', deeplCode: 'JA' },
    'ko': { name: 'Korean', nativeName: '한국어', deeplCode: 'KO' },
    'nl': { name: 'Dutch', nativeName: 'Nederlands', deeplCode: 'NL' },
    'pl': { name: 'Polish', nativeName: 'Polski', deeplCode: 'PL' },
    'pt': { name: 'Portuguese', nativeName: 'Português', deeplCode: 'PT-BR' },
    'ru': { name: 'Russian', nativeName: 'Русский', deeplCode: 'RU' },
    'zh': { name: 'Chinese', nativeName: '中文', deeplCode: 'ZH-HANS' },
    'ar': { name: 'Arabic', nativeName: 'العربية', deeplCode: 'AR' },
    'bg': { name: 'Bulgarian', nativeName: 'Български', deeplCode: 'BG' },
    'cs': { name: 'Czech', nativeName: 'Čeština', deeplCode: 'CS' },
    'da': { name: 'Danish', nativeName: 'Dansk', deeplCode: 'DA' },
    'el': { name: 'Greek', nativeName: 'Ελληνικά', deeplCode: 'EL' },
    'et': { name: 'Estonian', nativeName: 'Eesti', deeplCode: 'ET' },
    'fi': { name: 'Finnish', nativeName: 'Suomi', deeplCode: 'FI' },
    'hu': { name: 'Hungarian', nativeName: 'Magyar', deeplCode: 'HU' },
    'id': { name: 'Indonesian', nativeName: 'Bahasa Indonesia', deeplCode: 'ID' },
    'lt': { name: 'Lithuanian', nativeName: 'Lietuvių', deeplCode: 'LT' },
    'lv': { name: 'Latvian', nativeName: 'Latviešu', deeplCode: 'LV' },
    'nb': { name: 'Norwegian', nativeName: 'Norsk', deeplCode: 'NB' },
    'ro': { name: 'Romanian', nativeName: 'Română', deeplCode: 'RO' },
    'sk': { name: 'Slovak', nativeName: 'Slovenčina', deeplCode: 'SK' },
    'sl': { name: 'Slovenian', nativeName: 'Slovenščina', deeplCode: 'SL' },
    'sv': { name: 'Swedish', nativeName: 'Svenska', deeplCode: 'SV' },
    'tr': { name: 'Turkish', nativeName: 'Türkçe', deeplCode: 'TR' },
    'uk': { name: 'Ukrainian', nativeName: 'Українська', deeplCode: 'UK' },
} as const;

// Maps BCP-47 → DeepL target codes (including regional variants)
const DEEPL_TARGET_MAP: Record<string, string> = {
    'en': 'EN-US', 'en-us': 'EN-US', 'en-gb': 'EN-GB', 'en-au': 'EN-US',
    'pt': 'PT-BR', 'pt-br': 'PT-BR', 'pt-pt': 'PT-PT',
    'zh': 'ZH-HANS', 'zh-cn': 'ZH-HANS', 'zh-tw': 'ZH-HANT', 'zh-hans': 'ZH-HANS', 'zh-hant': 'ZH-HANT',
    'de': 'DE', 'de-de': 'DE', 'de-at': 'DE', 'de-ch': 'DE',
    'es': 'ES', 'es-es': 'ES', 'es-mx': 'ES', 'es-ar': 'ES',
    'fr': 'FR', 'fr-fr': 'FR', 'fr-ca': 'FR', 'fr-be': 'FR',
    'ja': 'JA', 'ko': 'KO', 'it': 'IT', 'nl': 'NL', 'pl': 'PL',
    'ru': 'RU', 'ar': 'AR', 'bg': 'BG', 'cs': 'CS', 'da': 'DA',
    'el': 'EL', 'et': 'ET', 'fi': 'FI', 'hu': 'HU', 'id': 'ID',
    'lt': 'LT', 'lv': 'LV', 'nb': 'NB', 'no': 'NB', 'ro': 'RO',
    'sk': 'SK', 'sl': 'SL', 'sv': 'SV', 'tr': 'TR', 'uk': 'UK',
};

/**
 * Convert BCP-47 locale code to DeepL target language code
 * @param locale - BCP-47 locale (e.g., 'en-US', 'pt-BR', 'zh-TW')
 * @returns DeepL target code (e.g., 'EN-US', 'PT-BR', 'ZH-HANT')
 */
export function toDeepLTarget(locale: string): string {
    const normalized = locale.toLowerCase().trim();

    // Try exact match first
    if (DEEPL_TARGET_MAP[normalized]) {
        return DEEPL_TARGET_MAP[normalized];
    }

    // Try base language code (e.g., 'en-US' → 'en')
    const baseLang = normalized.split('-')[0];
    if (DEEPL_TARGET_MAP[baseLang]) {
        return DEEPL_TARGET_MAP[baseLang];
    }

    // Fallback to English
    return 'EN-US';
}

/**
 * Convert DeepL language code back to simple ISO 639-1 code
 * @param code - DeepL code (e.g., 'EN-US', 'PT-BR')
 * @returns ISO 639-1 code (e.g., 'en', 'pt')
 */
export function fromDeepLCode(code: string): string {
    return code.split('-')[0].toLowerCase();
}

/**
 * Get the base language code from any locale
 * @param locale - Any locale format
 * @returns Base language code (e.g., 'en', 'pt', 'zh')
 */
export function getBaseLanguage(locale: string): string {
    return locale.toLowerCase().split('-')[0];
}

/**
 * Check if a language is supported by our translation system
 */
export function isLanguageSupported(locale: string): boolean {
    const base = getBaseLanguage(locale);
    return base in SUPPORTED_LANGUAGES;
}

/**
 * Get language display info
 */
export function getLanguageInfo(locale: string) {
    const base = getBaseLanguage(locale);
    return SUPPORTED_LANGUAGES[base as keyof typeof SUPPORTED_LANGUAGES] || null;
}

export type LanguageCode = keyof typeof SUPPORTED_LANGUAGES;
