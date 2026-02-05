/**
 * Translation Cache Layer
 * 
 * Stores and retrieves translations from the database to avoid repeated API calls.
 */

import db from '@/lib/db';

/**
 * Get a cached translation from the database
 * Returns the translated content if found and hash matches, null otherwise
 */
export async function getCachedTranslation(
    entityType: string,
    entityId: string,
    fieldName: string,
    targetLanguage: string
): Promise<string | null> {
    try {
        const translation = await db.translation.findUnique({
            where: {
                entityType_entityId_fieldName_targetLanguage: {
                    entityType,
                    entityId,
                    fieldName,
                    targetLanguage,
                },
            },
            select: {
                translatedContent: true,
            },
        });

        return translation?.translatedContent ?? null;
    } catch (error) {
        console.error('Error fetching cached translation:', error);
        return null;
    }
}

/**
 * Get a cached translation only if the source hash matches
 * This ensures we return fresh translations when content changes
 */
export async function getCachedTranslationWithHash(
    entityType: string,
    entityId: string,
    fieldName: string,
    targetLanguage: string,
    sourceHash: string
): Promise<string | null> {
    try {
        const translation = await db.translation.findUnique({
            where: {
                entityType_entityId_fieldName_targetLanguage: {
                    entityType,
                    entityId,
                    fieldName,
                    targetLanguage,
                },
            },
            select: {
                translatedContent: true,
                sourceHash: true,
            },
        });

        // Only return cached translation if hash matches (content unchanged)
        if (translation && translation.sourceHash === sourceHash) {
            return translation.translatedContent;
        }

        return null;
    } catch (error) {
        console.error('Error fetching cached translation:', error);
        return null;
    }
}

export interface SetCachedTranslationParams {
    entityType: string;
    entityId: string;
    fieldName: string;
    sourceLanguage: string;
    sourceHash: string;
    targetLanguage: string;
    translatedContent: string;
    modelProvider: string;
    modelVersion: string;
    confidenceScore?: number;
}

/**
 * Store or update a translation in the cache
 */
export async function setCachedTranslation(
    params: SetCachedTranslationParams
): Promise<void> {
    const {
        entityType,
        entityId,
        fieldName,
        sourceLanguage,
        sourceHash,
        targetLanguage,
        translatedContent,
        modelProvider,
        modelVersion,
        confidenceScore,
    } = params;

    try {
        await db.translation.upsert({
            where: {
                entityType_entityId_fieldName_targetLanguage: {
                    entityType,
                    entityId,
                    fieldName,
                    targetLanguage,
                },
            },
            create: {
                entityType,
                entityId,
                fieldName,
                sourceLanguage,
                sourceHash,
                targetLanguage,
                translatedContent,
                modelProvider,
                modelVersion,
                confidenceScore,
            },
            update: {
                sourceLanguage,
                sourceHash,
                translatedContent,
                modelProvider,
                modelVersion,
                confidenceScore,
            },
        });
    } catch (error) {
        console.error('Error caching translation:', error);
        // Don't throw - caching failures shouldn't break the app
    }
}

/**
 * Delete cached translations for an entity (e.g., when content is deleted)
 */
export async function deleteCachedTranslations(
    entityType: string,
    entityId: string
): Promise<void> {
    try {
        await db.translation.deleteMany({
            where: {
                entityType,
                entityId,
            },
        });
    } catch (error) {
        console.error('Error deleting cached translations:', error);
    }
}
