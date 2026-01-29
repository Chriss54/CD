'use client';

import { useState } from 'react';
import Image from 'next/image';
import { getEmbedUrl, getThumbnailUrl, type VideoEmbed } from '@/lib/video-utils';

interface VideoEmbedProps {
  embed: VideoEmbed;
}

export function VideoEmbedPlayer({ embed }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

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
      <Image
        src={getThumbnailUrl(embed)}
        alt={`${embed.service} video thumbnail`}
        fill
        className="object-cover"
        unoptimized={embed.service !== 'youtube'} // YouTube has actual thumbnails
      />

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
