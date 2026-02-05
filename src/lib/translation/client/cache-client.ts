/**
 * Client-Side Translation Cache
 * 
 * Two-tier caching system:
 * 1. In-memory cache (fastest, lost on page reload)
 * 2. localStorage cache (persistent across sessions)
 * 
 * Cache key format: sha256(text + "||" + targetLang)
 * The delimiter prevents collisions where text might contain the language code.
 */

const CACHE_PREFIX = 'deepl_cache_';
const MEMORY_CACHE = new Map<string, string>();
const CACHE_VERSION = 'v1'; // Increment to invalidate old caches

/**
 * Generate a cache key using SHA-256 hash
 * Uses the delimiter "||" to prevent collisions
 */
export async function generateCacheKey(text: string, targetLang: string): Promise<string> {
    const input = `${text}||${targetLang}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(input);

    // Use Web Crypto API for hashing
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Return truncated hash (first 16 chars is sufficient for uniqueness)
    return `${CACHE_VERSION}_${hashHex.slice(0, 16)}`;
}

/**
 * Synchronous cache key for quick lookups (simpler hash for memory cache)
 * Used when we need immediate response and can't await
 */
export function generateSyncCacheKey(text: string, targetLang: string): string {
    // Simple hash for synchronous operations
    let hash = 0;
    const input = `${text}||${targetLang}`;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return `${CACHE_VERSION}_${Math.abs(hash).toString(36)}`;
}

/**
 * Get translation from cache (memory first, then localStorage)
 */
export function getFromCache(text: string, targetLang: string): string | null {
    const key = generateSyncCacheKey(text, targetLang);

    // Check memory cache first (fastest)
    const memoryResult = MEMORY_CACHE.get(key);
    if (memoryResult) {
        return memoryResult;
    }

    // Check localStorage (persistent)
    if (typeof window !== 'undefined') {
        try {
            const stored = localStorage.getItem(CACHE_PREFIX + key);
            if (stored) {
                // Also populate memory cache for faster subsequent access
                MEMORY_CACHE.set(key, stored);
                return stored;
            }
        } catch {
            // localStorage might be unavailable (private browsing, etc.)
        }
    }

    return null;
}

/**
 * Store translation in cache (both memory and localStorage)
 */
export function setToCache(text: string, targetLang: string, translation: string): void {
    const key = generateSyncCacheKey(text, targetLang);

    // Store in memory cache
    MEMORY_CACHE.set(key, translation);

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(CACHE_PREFIX + key, translation);
        } catch {
            // localStorage might be full or unavailable
            // Memory cache will still work
        }
    }
}

/**
 * Store multiple translations at once (batch operation)
 */
export function setBatchToCache(
    items: Array<{ text: string; targetLang: string; translation: string }>
): void {
    items.forEach(({ text, targetLang, translation }) => {
        setToCache(text, targetLang, translation);
    });
}

/**
 * Check if a translation exists in cache
 */
export function hasInCache(text: string, targetLang: string): boolean {
    return getFromCache(text, targetLang) !== null;
}

/**
 * Get multiple translations from cache
 * Returns an object mapping original text to cached translation (or null if not cached)
 */
export function getBatchFromCache(
    texts: string[],
    targetLang: string
): Map<string, string | null> {
    const results = new Map<string, string | null>();

    texts.forEach(text => {
        results.set(text, getFromCache(text, targetLang));
    });

    return results;
}

/**
 * Clear all cached translations
 */
export function clearCache(): void {
    MEMORY_CACHE.clear();

    if (typeof window !== 'undefined') {
        try {
            // Only clear our cache entries, not other localStorage data
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    keysToRemove.push(key);
                }
            }
            keysToRemove.forEach(key => localStorage.removeItem(key));
        } catch {
            // Ignore errors
        }
    }
}

/**
 * Get cache statistics (for debugging)
 */
export function getCacheStats(): { memorySize: number; localStorageSize: number } {
    let localStorageSize = 0;

    if (typeof window !== 'undefined') {
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key?.startsWith(CACHE_PREFIX)) {
                    localStorageSize++;
                }
            }
        } catch {
            // Ignore
        }
    }

    return {
        memorySize: MEMORY_CACHE.size,
        localStorageSize,
    };
}
