/**
 * DeepL Translation Provider
 * 
 * Uses the DeepL API for high-quality translations.
 * Requires DEEPL_API_KEY and optionally DEEPL_API_URL environment variables.
 */

const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
const DEEPL_API_URL = process.env.DEEPL_API_URL || 'https://api-free.deepl.com';

/**
 * Map ISO 639-1 codes to DeepL format
 * DeepL uses uppercase and some variants (e.g., EN-US, EN-GB, PT-BR)
 */
function toDeepLLanguage(code: string, isTarget: boolean = false): string {
    const upperCode = code.toUpperCase();

    // For target languages, DeepL requires specific variants for some languages
    if (isTarget) {
        switch (upperCode) {
            case 'EN':
                return 'EN-US'; // Default to American English for targets
            case 'PT':
                return 'PT-BR'; // Default to Brazilian Portuguese for targets
            default:
                return upperCode;
        }
    }

    return upperCode;
}

/**
 * Map DeepL language codes back to ISO 639-1
 */
function fromDeepLLanguage(code: string): string {
    return code.split('-')[0].toLowerCase();
}

export interface TranslationResult {
    text: string;
    detectedSourceLanguage?: string;
}

/**
 * Translate a single text using DeepL
 */
export async function translateText(
    text: string,
    sourceLang: string,
    targetLang: string
): Promise<string> {
    if (!DEEPL_API_KEY) {
        console.error('DEEPL_API_KEY is not configured');
        return text; // Return original text as fallback
    }

    if (!text.trim()) {
        return text;
    }

    try {
        const response = await fetch(`${DEEPL_API_URL}/v2/translate`, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: [text],
                source_lang: toDeepLLanguage(sourceLang, false),
                target_lang: toDeepLLanguage(targetLang, true),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepL API error: ${response.status} - ${errorText}`);
            return text; // Return original text as fallback
        }

        const data = await response.json();

        if (data.translations && data.translations.length > 0) {
            return data.translations[0].text;
        }

        return text;
    } catch (error) {
        console.error('DeepL translation error:', error);
        return text; // Return original text as fallback
    }
}

/**
 * Translate multiple texts in a single batch request
 */
export async function translateBatch(
    texts: string[],
    sourceLang: string,
    targetLang: string
): Promise<string[]> {
    if (!DEEPL_API_KEY) {
        console.error('DEEPL_API_KEY is not configured');
        return texts; // Return original texts as fallback
    }

    if (texts.length === 0) {
        return [];
    }

    // Filter out empty strings but keep track of their positions
    const nonEmptyIndices: number[] = [];
    const nonEmptyTexts: string[] = [];

    texts.forEach((text, index) => {
        if (text.trim()) {
            nonEmptyIndices.push(index);
            nonEmptyTexts.push(text);
        }
    });

    if (nonEmptyTexts.length === 0) {
        return texts;
    }

    try {
        const response = await fetch(`${DEEPL_API_URL}/v2/translate`, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: nonEmptyTexts,
                source_lang: toDeepLLanguage(sourceLang, false),
                target_lang: toDeepLLanguage(targetLang, true),
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepL API error: ${response.status} - ${errorText}`);
            return texts; // Return original texts as fallback
        }

        const data = await response.json();

        if (data.translations && data.translations.length === nonEmptyTexts.length) {
            // Reconstruct the result array with translated texts in correct positions
            const result = [...texts];
            data.translations.forEach((translation: { text: string }, index: number) => {
                result[nonEmptyIndices[index]] = translation.text;
            });
            return result;
        }

        return texts;
    } catch (error) {
        console.error('DeepL batch translation error:', error);
        return texts; // Return original texts as fallback
    }
}

/**
 * Detect language of a text using DeepL
 * Returns the detected language code in lowercase ISO 639-1 format
 */
export async function detectLanguageViaTranslation(text: string): Promise<string | null> {
    if (!DEEPL_API_KEY) {
        return null;
    }

    if (!text.trim()) {
        return null;
    }

    try {
        // Send a translation request - DeepL will detect the source language
        const response = await fetch(`${DEEPL_API_URL}/v2/translate`, {
            method: 'POST',
            headers: {
                'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: [text.slice(0, 200)], // Use first 200 chars for detection
                target_lang: 'EN-US', // Target doesn't matter for detection
            }),
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        if (data.translations && data.translations.length > 0) {
            const detectedLang = data.translations[0].detected_source_language;
            return detectedLang ? fromDeepLLanguage(detectedLang) : null;
        }

        return null;
    } catch (error) {
        console.error('DeepL language detection error:', error);
        return null;
    }
}
