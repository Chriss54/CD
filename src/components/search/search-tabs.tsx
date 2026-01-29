'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const TYPES = [
  { id: 'all', label: 'All' },
  { id: 'post', label: 'Posts' },
  { id: 'user', label: 'Members' },
  { id: 'course', label: 'Courses' },
] as const;

interface SearchTabsProps {
  counts: {
    all: number;
    post: number;
    user: number;
    course: number;
  };
}

export function SearchTabs({ counts }: SearchTabsProps) {
  const searchParams = useSearchParams();
  const currentType = searchParams.get('type') || 'all';
  const query = searchParams.get('q') || '';

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {TYPES.map((type) => {
        const count = counts[type.id];
        const href =
          type.id === 'all'
            ? `/search?q=${encodeURIComponent(query)}`
            : `/search?q=${encodeURIComponent(query)}&type=${type.id}`;

        return (
          <Link
            key={type.id}
            href={href}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              currentType === type.id
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {type.label} ({count})
          </Link>
        );
      })}
    </div>
  );
}
