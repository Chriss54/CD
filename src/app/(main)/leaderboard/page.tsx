import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getLeaderboard, getUserRank, type LeaderboardPeriod } from '@/lib/leaderboard-actions';
import { LeaderboardTabs } from '@/components/leaderboard/leaderboard-tabs';
import { LeaderboardRow } from '@/components/leaderboard/leaderboard-row';
import { UserRankCard } from '@/components/leaderboard/user-rank-card';
import { EmptyState } from '@/components/ui/empty-state';
import { tMany } from '@/lib/translation/helpers';

interface LeaderboardPageProps {
  searchParams: Promise<{ period?: string }>;
}

export default async function LeaderboardPage({ searchParams }: LeaderboardPageProps) {
  const { period: periodParam } = await searchParams;
  const period = (['all-time', 'this-month', 'this-day'].includes(periodParam || '')
    ? periodParam
    : 'all-time') as LeaderboardPeriod;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Fetch leaderboard data
  const [leaders, currentUserRank] = await Promise.all([
    getLeaderboard(period, 5),
    userId ? getUserRank(userId, period) : null,
  ]);

  // Translate all UI text dynamically via DeepL
  const ui = await tMany({
    title: 'Leaderboard',
    noRankingsYet: 'No rankings yet',
    beTheFirst: 'Be the first to earn points!',
    noActivityThisMonth: 'No activity this month yet.',
    noActivityToday: 'No activity today yet.',
  }, 'leaderboard');

  // Check if current user is in top 5
  const isInTopFive = currentUserRank && currentUserRank.rank <= 5;

  // Determine empty state description
  let emptyDescription = ui.beTheFirst;
  if (period === 'this-month') {
    emptyDescription = ui.noActivityThisMonth;
  } else if (period === 'this-day') {
    emptyDescription = ui.noActivityToday;
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">{ui.title}</h1>

      {/* Period tabs */}
      <Suspense fallback={<div className="h-10 bg-muted rounded-lg animate-pulse" />}>
        <LeaderboardTabs />
      </Suspense>

      {/* Leaderboard entries */}
      <div className="mt-6 space-y-2">
        {leaders.length === 0 ? (
          <EmptyState
            title={ui.noRankingsYet}
            description={emptyDescription}
          />
        ) : (
          leaders.map((entry) => (
            <LeaderboardRow
              key={entry.id}
              entry={entry}
              highlight={userId === entry.id}
            />
          ))
        )}
      </div>

      {/* Current user's rank (if not in top 5) */}
      {currentUserRank && !isInTopFive && currentUserRank.points > 0 && (
        <div className="mt-8">
          <UserRankCard user={currentUserRank} />
        </div>
      )}
    </div>
  );
}
