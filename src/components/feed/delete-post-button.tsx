'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deletePost } from '@/lib/post-actions';
import { Button } from '@/components/ui/button';

interface DeletePostButtonProps {
  postId: string;
}

export function DeletePostButton({ postId }: DeletePostButtonProps) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    const result = await deletePost(postId);

    if ('error' in result) {
      setError(typeof result.error === 'string' ? result.error : 'Failed to delete post');
      setIsDeleting(false);
      return;
    }

    // Success - redirect to feed
    router.push('/feed');
    router.refresh();
  };

  if (!isConfirming) {
    return (
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        className="text-sm text-red-600 hover:text-red-700 hover:underline"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Are you sure?</span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsConfirming(false)}
        disabled={isDeleting}
      >
        Cancel
      </Button>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        {isDeleting ? 'Deleting...' : 'Delete'}
      </Button>
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
