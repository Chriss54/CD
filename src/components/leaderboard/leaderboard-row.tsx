import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/gamification/level-badge';
import type { LeaderboardEntry } from '@/lib/leaderboard-actions';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  highlight?: boolean;
}

export function LeaderboardRow({ entry, highlight = false }: LeaderboardRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-4 p-4 rounded-lg',
        highlight ? 'bg-primary/5 border border-primary/20' : 'bg-muted/50'
      )}
    >
      {/* Rank */}
      <div className="w-8 text-center font-bold text-lg text-muted-foreground">
        #{entry.rank}
      </div>

      {/* User info */}
      <Link href={`/members/${entry.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar src={entry.image} name={entry.name} size="md" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{entry.name || 'Anonymous'}</span>
          <LevelBadge level={entry.level} size="sm" />
        </div>
      </Link>

      {/* Points */}
      <div className="text-right">
        <span className="font-bold">{entry.points}</span>
        <span className="text-muted-foreground text-sm ml-1">pts</span>
      </div>
    </div>
  );
}
