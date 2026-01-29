'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const PERIODS = [
  { id: 'all-time', label: 'All-time' },
  { id: 'this-month', label: 'This month' },
  { id: 'this-day', label: 'This day' },
] as const;

export function LeaderboardTabs() {
  const searchParams = useSearchParams();
  const currentPeriod = searchParams.get('period') || 'all-time';

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {PERIODS.map((period) => (
        <Link
          key={period.id}
          href={`/leaderboard?period=${period.id}`}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            currentPeriod === period.id
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {period.label}
        </Link>
      ))}
    </div>
  );
}
