'use client';

import { useState, useEffect } from 'react';
import { parseVideoUrl, type VideoEmbed } from '@/lib/video-utils';

interface VideoInputProps {
  onAdd: (embed: VideoEmbed) => void;
  onPendingChange?: (hasPending: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export function VideoInput({ onAdd, onPendingChange, disabled, compact }: VideoInputProps) {
  const [url, setUrl] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Notify parent when there's a pending URL
  useEffect(() => {
    onPendingChange?.(showInput && url.trim().length > 0);
  }, [url, showInput, onPendingChange]);

  const handleAdd = () => {
    const embed = parseVideoUrl(url);

    if (!embed) {
      setError('Invalid video URL. Supported: YouTube, Vimeo, Loom');
      return;
    }

    onAdd(embed);
    setUrl('');
    setError(null);
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
    if (e.key === 'Escape') {
      setShowInput(false);
      setUrl('');
      setError(null);
    }
  };

  // Compact mode: show buttons that expand to input
  if (compact) {
    if (!showInput) {
      return (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowInput(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            Bild/Video
          </button>
          <button
            type="button"
            onClick={() => setShowInput(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
            </svg>
            Link
          </button>
        </div>
      );
    }

    // Expanded state: full width input with buttons on new line
    return (
      <div className="space-y-2">
        {/* URL input - full width */}
        <div className="flex gap-2 items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Video URL einfügen (YouTube, Vimeo, Loom)..."
            disabled={disabled}
            autoFocus
            className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => { setShowInput(false); setUrl(''); setError(null); }}
            className="shrink-0 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Schließen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Add button */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled || !url.trim()}
            className="px-4 py-2 text-sm font-medium rounded-full bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Hinzufügen
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  // Default mode: full input
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Paste video URL (YouTube, Vimeo, Loom)..."
          disabled={disabled}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={disabled || !url.trim()}
          className="px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

