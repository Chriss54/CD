import { generateText } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/**
 * Extracts plain text from a Tiptap JSON document.
 * Used for populating the plainText column for full-text search indexing.
 *
 * @param content - Tiptap JSON document (typically from Post.content)
 * @returns Plain text string, or empty string if extraction fails
 */
export function extractPlainText(content: unknown): string {
  try {
    return generateText(
      content as Parameters<typeof generateText>[0],
      [StarterKit]
    );
  } catch {
    return '';
  }
}
