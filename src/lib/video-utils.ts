import getVideoId from 'get-video-id';
import type { VideoService, VideoEmbed } from '@/types/post';

// Re-export types for convenience
export type { VideoService, VideoEmbed };

/**
 * Parse a video URL and extract the service and video ID.
 * Only supports YouTube, Vimeo, and Loom.
 */
export function parseVideoUrl(url: string): VideoEmbed | null {
  try {
    const result = getVideoId(url);

    if (!result.id || !result.service) {
      return null;
    }

    // Only accept supported services
    const supportedServices: VideoService[] = ['youtube', 'vimeo', 'loom'];
    if (!supportedServices.includes(result.service as VideoService)) {
      return null;
    }

    return {
      service: result.service as VideoService,
      id: result.id,
      url: url,
    };
  } catch {
    return null;
  }
}

/**
 * Get the thumbnail URL for a video embed.
 * YouTube returns the actual thumbnail, Vimeo/Loom return placeholder (needs API in later phase).
 */
export function getThumbnailUrl(embed: VideoEmbed): string {
  switch (embed.service) {
    case 'youtube':
      return `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`;
    case 'vimeo':
      // Vimeo requires API call for thumbnail, return placeholder for now
      return '/images/video-placeholder.svg';
    case 'loom':
      // Loom thumbnail needs API, return placeholder for now
      return '/images/video-placeholder.svg';
    default:
      return '/images/video-placeholder.svg';
  }
}

/**
 * Get the embed URL for a video (for iframe embedding).
 */
export function getEmbedUrl(embed: VideoEmbed): string {
  switch (embed.service) {
    case 'youtube':
      return `https://www.youtube.com/embed/${embed.id}?autoplay=1`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${embed.id}?autoplay=1`;
    case 'loom':
      return `https://www.loom.com/embed/${embed.id}?autoplay=1`;
    default:
      return '';
  }
}
