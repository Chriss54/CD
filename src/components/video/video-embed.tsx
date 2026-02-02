'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { getEmbedUrl, getThumbnailUrl, type VideoEmbed } from '@/lib/video-utils';

interface VideoEmbedProps {
  embed: VideoEmbed;
}

export function VideoEmbedPlayer({ embed }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailError, setThumbnailError] = useState(false);

  // Fetch Loom thumbnail from oEmbed API
  useEffect(() => {
    if (embed.service === 'loom') {
      const fetchLoomThumbnail = async () => {
        try {
          const oEmbedUrl = `https://www.loom.com/v1/oembed?url=${encodeURIComponent(embed.url)}`;
          const response = await fetch(oEmbedUrl);
          if (response.ok) {
            const data = await response.json();
            if (data.thumbnail_url) {
              setThumbnailUrl(data.thumbnail_url);
              return;
            }
          }
          // Fallback if oEmbed fails
          setThumbnailError(true);
        } catch {
          setThumbnailError(true);
        }
      };
      fetchLoomThumbnail();
    } else {
      // For YouTube/Vimeo, use the static thumbnail URL
      setThumbnailUrl(getThumbnailUrl(embed));
    }
  }, [embed]);

  if (isPlaying) {
    return (
      <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black">
        <iframe
          src={getEmbedUrl(embed)}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${embed.service} video`}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="relative aspect-video w-full rounded-lg overflow-hidden bg-gray-900 group cursor-pointer"
    >
      {/* Thumbnail */}
      {thumbnailUrl && !thumbnailError ? (
        <Image
          src={thumbnailUrl}
          alt={`${embed.service} video thumbnail`}
          fill
          className="object-cover"
          unoptimized // External URLs need unoptimized
          onError={() => setThumbnailError(true)}
        />
      ) : (
        <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
          {/* Loom logo placeholder when thumbnail fails to load */}
          <svg className="w-16 h-16 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </div>
      )}

      {/* Play button overlay */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center group-hover:bg-white transition-colors">
          {/* Play triangle icon */}
          <svg
            className="w-6 h-6 text-gray-900 ml-1"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
