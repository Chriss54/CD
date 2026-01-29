'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getPostLikers, getCommentLikers } from '@/lib/like-actions';
import { Avatar } from '@/components/ui/avatar';

interface LikersListProps {
  targetId: string;
  targetType: 'post' | 'comment';
  isOpen: boolean;
  onClose: () => void;
}

type Liker = {
  id: string;
  name: string | null;
  image: string | null;
};

export function LikersList({
  targetId,
  targetType,
  isOpen,
  onClose,
}: LikersListProps) {
  const [likers, setLikers] = useState<Liker[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchLikers = useCallback(async () => {
    setIsLoading(true);
    try {
      const action =
        targetType === 'post' ? getPostLikers : getCommentLikers;
      const data = await action(targetId);
      setLikers(data);
    } catch (error) {
      console.error('Failed to fetch likers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [targetId, targetType]);

  useEffect(() => {
    if (isOpen) {
      fetchLikers();
    }
  }, [isOpen, fetchLikers]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-lg max-w-sm w-full mx-4 max-h-[60vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold">Likes</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4">
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Loading...
            </div>
          ) : likers.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              No likes yet
            </div>
          ) : (
            <ul className="space-y-3">
              {likers.map((liker) => (
                <li key={liker.id}>
                  <Link
                    href={`/members/${liker.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={onClose}
                  >
                    <Avatar src={liker.image} name={liker.name} size="sm" />
                    <span className="font-medium truncate">
                      {liker.name || 'Unknown'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
