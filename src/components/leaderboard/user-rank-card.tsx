import { Avatar } from '@/components/ui/avatar';
import { LevelBadge } from '@/components/gamification/level-badge';
import type { LeaderboardEntry } from '@/lib/leaderboard-actions';

interface UserRankCardProps {
  user: LeaderboardEntry;
}

export function UserRankCard({ user }: UserRankCardProps) {
  return (
    <div className="border rounded-lg p-4 bg-muted/30">
      <p className="text-sm text-muted-foreground mb-2">Your ranking</p>
      <div className="flex items-center gap-4">
        <div className="text-2xl font-bold text-primary">#{user.rank}</div>
        <div className="flex items-center gap-3 flex-1">
          <Avatar src={user.image} name={user.name} size="md" />
          <div className="flex items-center gap-2">
            <span className="font-medium">{user.name || 'Anonymous'}</span>
            <LevelBadge level={user.level} size="sm" />
          </div>
        </div>
        <div className="text-right">
          <span className="font-bold">{user.points}</span>
          <span className="text-muted-foreground text-sm ml-1">pts</span>
        </div>
      </div>
    </div>
  );
}
