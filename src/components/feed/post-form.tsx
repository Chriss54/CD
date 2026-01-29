'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { PostEditor } from './post-editor';
import { VideoInput } from '@/components/video/video-input';
import { VideoEmbedPlayer } from '@/components/video/video-embed';
import { createPost, updatePost } from '@/lib/post-actions';
import type { VideoEmbed } from '@/types/post';
import { Button } from '@/components/ui/button';

interface PostFormProps {
  mode: 'create' | 'edit';
  postId?: string;
  initialContent?: string;
  initialEmbeds?: VideoEmbed[];
}

export function PostForm({ mode, postId, initialContent, initialEmbeds }: PostFormProps) {
  const router = useRouter();
  const [content, setContent] = useState<object | null>(
    initialContent ? JSON.parse(initialContent) : null
  );
  const [embeds, setEmbeds] = useState<VideoEmbed[]>(initialEmbeds || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData();
    formData.set('content', JSON.stringify(content));
    formData.set('embeds', JSON.stringify(embeds));

    const result = mode === 'create'
      ? await createPost(formData)
      : await updatePost(postId!, formData);

    if ('error' in result) {
      setError(typeof result.error === 'string' ? result.error : 'An error occurred');
      setIsSubmitting(false);
      return;
    }

    // Success - navigate
    if (mode === 'create') {
      router.push('/feed');
    } else {
      router.push(`/feed/${postId}`);
    }
    router.refresh();
  };

  const removeEmbed = (index: number) => {
    setEmbeds(embeds.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PostEditor
        content={initialContent}
        onChange={(json) => setContent(json)}
        placeholder="What's on your mind?"
      />

      <VideoInput
        onAdd={(embed) => setEmbeds([...embeds, embed])}
        disabled={isSubmitting}
      />

      {/* Display added embeds with remove button */}
      {embeds.length > 0 && (
        <div className="space-y-3">
          {embeds.map((embed, i) => (
            <div key={`${embed.service}-${embed.id}-${i}`} className="relative">
              <VideoEmbedPlayer embed={embed} />
              <button
                type="button"
                onClick={() => removeEmbed(i)}
                className="absolute top-2 right-2 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/70"
                aria-label="Remove video"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : mode === 'create' ? 'Post' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
