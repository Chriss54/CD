'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createComment } from '@/lib/comment-actions';

interface CommentFormProps {
  postId: string;
}

export function CommentForm({ postId }: CommentFormProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    const submittedContent = content;

    // Clear form immediately for better UX
    setContent('');
    setError(null);

    startTransition(async () => {
      const result = await createComment(postId, submittedContent.trim());

      if ('error' in result) {
        // Restore content on error
        setContent(submittedContent);
        setError(typeof result.error === 'string' ? result.error : 'Failed to post comment');
        return;
      }

      router.refresh();
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="w-full px-3 py-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary"
        rows={3}
        maxLength={2000}
        disabled={isPending}
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          {content.length}/2000
        </div>
        <Button
          type="submit"
          size="sm"
          disabled={isPending || !content.trim()}
        >
          {isPending ? 'Posting...' : 'Post Comment'}
        </Button>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </form>
  );
}
