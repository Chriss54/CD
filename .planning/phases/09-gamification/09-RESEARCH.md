# Phase 9: Gamification - Research

**Researched:** 2026-01-23
**Domain:** Points system, level progression, leaderboards with PostgreSQL/Prisma
**Confidence:** HIGH

## Summary

This phase implements a gamification layer on top of existing engagement features. The research focused on three areas: (1) points calculation and atomic database updates, (2) level progression curves, and (3) leaderboard ranking queries with PostgreSQL.

The existing codebase already has `points` and `level` fields on the User model (both with sensible defaults), uses Prisma 7.3 with PostgreSQL via Supabase, and follows a server actions pattern for mutations. The gamification implementation should integrate cleanly by modifying existing actions (post creation, commenting, liking, lesson completion) to atomically increment points.

For leaderboards, PostgreSQL's `RANK()` window function provides efficient ranking. Time-based filtering (all-time, this month, this day) can use date range queries with proper indexing. The existing `@@index([points])` on User is ideal for leaderboard performance.

**Primary recommendation:** Use Prisma's atomic `increment` operations within existing server actions for points; use `$queryRaw` with PostgreSQL `RANK()` for leaderboard queries; add Sonner for level-up toast notifications.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.3.0 | Already in project - atomic updates, raw SQL | Supports `increment` operations and `$queryRaw` for window functions |
| PostgreSQL | Latest | Already in project - ranking queries | Native `RANK()` function, efficient date filtering |
| Sonner | ^2.0 | Toast notifications for level-up | Modern, lightweight, works well with Next.js RSC |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Already in project | Date range calculations for time-based leaderboards |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Sonner | React Hot Toast | Sonner has better RSC support, simpler API |
| Raw SQL RANK() | Computed in JS | RANK() is far more efficient for pagination and ties |
| Points in User table | Separate PointsHistory table | Simpler is better for this scope; no need for point history per CONTEXT |

**Installation:**
```bash
npm install sonner
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── gamification-actions.ts    # Points award, level check
│   └── leaderboard-actions.ts     # Leaderboard queries
├── components/
│   ├── gamification/
│   │   ├── level-badge.tsx        # Reusable level display
│   │   ├── points-display.tsx     # Profile points/progress
│   │   └── level-up-toast.tsx     # Toast trigger component
│   └── leaderboard/
│       ├── leaderboard-tabs.tsx   # Time period switcher
│       ├── leaderboard-row.tsx    # Single user entry
│       └── user-rank-card.tsx     # Current user's rank
└── app/(main)/
    └── leaderboard/
        └── page.tsx               # /leaderboard route
```

### Pattern 1: Atomic Points Increment
**What:** Use Prisma's `increment` to avoid race conditions when awarding points
**When to use:** Every point-awarding action (post, comment, like received, lesson complete)
**Example:**
```typescript
// Source: Prisma documentation - atomic operations
await db.user.update({
  where: { id: userId },
  data: {
    points: { increment: POINTS.POST_CREATED },
  },
});
```

### Pattern 2: Integrated Point Awards in Existing Actions
**What:** Modify existing server actions to include point awards rather than separate calls
**When to use:** To maintain atomicity and reduce database round trips
**Example:**
```typescript
// In like-actions.ts togglePostLike
if (!existingLike) {
  // Like: create new like AND award points to post author
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  await db.$transaction([
    db.postLike.create({ data: { userId, postId } }),
    db.user.update({
      where: { id: post.authorId },
      data: { points: { increment: POINTS.LIKE_RECEIVED } },
    }),
  ]);
}
```

### Pattern 3: Level Check After Point Award
**What:** After incrementing points, check if user crossed a level threshold
**When to use:** In point-awarding actions to detect level-ups
**Example:**
```typescript
// Return data about level change for toast
const user = await db.user.update({
  where: { id: userId },
  data: { points: { increment: amount } },
  select: { points: true, level: true },
});

const newLevel = calculateLevel(user.points);
if (newLevel > user.level) {
  await db.user.update({
    where: { id: userId },
    data: { level: newLevel },
  });
  return { levelUp: true, newLevel };
}
return { levelUp: false };
```

### Pattern 4: PostgreSQL RANK() for Leaderboards
**What:** Use raw SQL with RANK() window function for efficient ranking
**When to use:** Leaderboard queries, getting user's rank
**Example:**
```typescript
// Source: Prisma $queryRaw documentation
type LeaderboardEntry = {
  id: string;
  name: string | null;
  image: string | null;
  points: number;
  level: number;
  rank: bigint;
};

const leaderboard = await db.$queryRaw<LeaderboardEntry[]>`
  SELECT id, name, image, points, level,
    RANK() OVER (ORDER BY points DESC) as rank
  FROM "User"
  ORDER BY points DESC
  LIMIT 5
`;
```

### Pattern 5: Time-Based Leaderboard Filtering
**What:** Filter points by date range for "this month" and "this day" periods
**When to use:** Time-scoped leaderboards
**Note:** Since points are stored cumulatively on User (not in a history table), time-based leaderboards would need a PointsHistory table OR a simpler approach: track points earned in current period via a separate mechanism.

**Recommendation for this scope:** Given CONTEXT decisions (no activity log/history), implement time-based leaderboards using a `PointsEvent` table that logs point-earning events with timestamps. This is the only way to accurately calculate "this month" and "this day" rankings.

### Anti-Patterns to Avoid
- **Read-then-write for points:** Never `findUnique` then `update` with calculated value - use atomic `increment`
- **Level calculation in client:** Always calculate on server to prevent manipulation
- **Separate API call for points:** Integrate into existing actions for atomic behavior
- **Fetching all users for ranking:** Use SQL RANK() and LIMIT, never sort in JavaScript

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic counters | Read + calculate + write | Prisma `increment` | Race conditions with concurrent requests |
| Ranking | Sort users in JS | PostgreSQL `RANK()` | Performance - database is optimized for this |
| Toast notifications | Custom toast system | Sonner | Cross-browser, accessible, RSC-compatible |
| Level thresholds | Hardcoded if/else chain | Threshold array lookup | Maintainability, easy to adjust |

**Key insight:** PostgreSQL is purpose-built for ranking queries. The `RANK()` window function handles ties correctly and integrates with `LIMIT` for pagination. Never sort millions of rows in JavaScript.

## Common Pitfalls

### Pitfall 1: Race Conditions on Point Updates
**What goes wrong:** Two concurrent like requests both read points=10, both write points=11
**Why it happens:** Non-atomic read-modify-write pattern
**How to avoid:** Always use Prisma's atomic `increment` operation
**Warning signs:** Points occasionally lower than expected, especially under load

### Pitfall 2: Expensive Leaderboard Queries
**What goes wrong:** Page load takes 5+ seconds, database CPU spikes
**Why it happens:** Sorting entire user table in memory, no index usage
**How to avoid:** Use PostgreSQL `RANK()` with `LIMIT`, ensure `@@index([points])` exists
**Warning signs:** Query times grow linearly with user count

### Pitfall 3: Level Desync from Points
**What goes wrong:** User has 1000 points but level shows 1
**Why it happens:** Level not updated after point increment
**How to avoid:** Check and update level in same transaction as point award
**Warning signs:** Users reporting wrong level display

### Pitfall 4: Time-Based Leaderboard Without History
**What goes wrong:** "This month" leaderboard shows same as all-time
**Why it happens:** Only storing cumulative points, not event history
**How to avoid:** Create PointsEvent table to log when points were earned
**Warning signs:** All three leaderboard tabs show identical rankings

### Pitfall 5: Toast Notification Blocking UI
**What goes wrong:** Level-up toast delays page interaction
**Why it happens:** Toast triggering synchronously in render
**How to avoid:** Use Sonner's async API, trigger from useEffect after data load
**Warning signs:** Page feels sluggish when level-ups occur

### Pitfall 6: Leaderboard N+1 Queries
**What goes wrong:** Leaderboard page makes 5+ database queries
**Why it happens:** Fetching user details separately from rank query
**How to avoid:** Include all display fields (name, image, level) in single RANK() query
**Warning signs:** Multiple sequential database calls in server component

## Code Examples

### Constants Configuration
```typescript
// src/lib/gamification-config.ts
export const POINTS = {
  POST_CREATED: 5,
  COMMENT_CREATED: 2,
  LIKE_RECEIVED: 1,
  LESSON_COMPLETED: 10,
} as const;

// Exponential-ish curve: 0, 50, 120, 210, 320, 450, 600, 770, 960, 1170
export const LEVEL_THRESHOLDS = [
  0,    // Level 1
  50,   // Level 2
  120,  // Level 3
  210,  // Level 4
  320,  // Level 5
  450,  // Level 6
  600,  // Level 7
  770,  // Level 8
  960,  // Level 9
  1170, // Level 10
] as const;

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getPointsToNextLevel(points: number, currentLevel: number): {
  current: number;
  required: number;
  progress: number;
} | null {
  if (currentLevel >= 10) return null; // Max level

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const pointsInLevel = points - currentThreshold;
  const pointsNeeded = nextThreshold - currentThreshold;

  return {
    current: pointsInLevel,
    required: pointsNeeded,
    progress: (pointsInLevel / pointsNeeded) * 100,
  };
}
```

### Award Points Helper
```typescript
// src/lib/gamification-actions.ts
'use server';

import db from '@/lib/db';
import { POINTS, calculateLevel } from '@/lib/gamification-config';

export async function awardPoints(
  userId: string,
  amount: number
): Promise<{ levelUp: boolean; newLevel?: number }> {
  // Atomic increment
  const user = await db.user.update({
    where: { id: userId },
    data: { points: { increment: amount } },
    select: { points: true, level: true },
  });

  // Check for level up
  const newLevel = calculateLevel(user.points);
  if (newLevel > user.level) {
    await db.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
    return { levelUp: true, newLevel };
  }

  return { levelUp: false };
}
```

### Leaderboard Query (All-Time)
```typescript
// src/lib/leaderboard-actions.ts
'use server';

import db from '@/lib/db';

type LeaderboardEntry = {
  id: string;
  name: string | null;
  image: string | null;
  points: number;
  level: number;
  rank: bigint;
};

export async function getLeaderboard(limit: number = 5): Promise<LeaderboardEntry[]> {
  return db.$queryRaw<LeaderboardEntry[]>`
    SELECT id, name, image, points, level,
      RANK() OVER (ORDER BY points DESC) as rank
    FROM "User"
    ORDER BY points DESC
    LIMIT ${limit}
  `;
}

export async function getUserRank(userId: string): Promise<number | null> {
  const result = await db.$queryRaw<{ rank: bigint }[]>`
    SELECT rank FROM (
      SELECT id, RANK() OVER (ORDER BY points DESC) as rank
      FROM "User"
    ) ranked
    WHERE id = ${userId}
  `;

  return result[0] ? Number(result[0].rank) : null;
}
```

### Level Badge Component
```typescript
// src/components/gamification/level-badge.tsx
interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md';
}

export function LevelBadge({ level, size = 'sm' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full
        bg-primary/10 text-primary font-medium
        ${sizeClasses[size]}
      `}
    >
      Lvl {level}
    </span>
  );
}
```

### Sonner Toast Setup
```typescript
// In src/app/layout.tsx or providers.tsx
import { Toaster } from 'sonner';

// Add inside body/providers:
<Toaster position="top-center" richColors />

// To trigger level-up toast (client component):
import { toast } from 'sonner';

toast.success(`Level Up! You're now Level ${newLevel}`, {
  duration: 4000,
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Read-modify-write | Atomic increment | Prisma 2.6+ (2020) | Eliminates race conditions |
| Sort in application | Database window functions | PostgreSQL 8.4+ (2009) | Massive performance improvement |
| Custom toast | Sonner library | 2023 | RSC support, better DX |
| Multiple round trips | $transaction batching | Prisma 2.0+ | Reduced latency |

**Deprecated/outdated:**
- React-toastify: Still works but Sonner has better RSC integration
- Manual ranking with ORDER BY + ROW_NUMBER: RANK() handles ties correctly

## Open Questions

1. **Time-based leaderboard data source**
   - What we know: Current schema only stores cumulative points on User
   - What's unclear: How to calculate "this month" and "this day" without history
   - Recommendation: Add a simple `PointsEvent` table to log point-earning timestamps. Schema:
   ```prisma
   model PointsEvent {
     id        String   @id @default(cuid())
     userId    String
     amount    Int
     action    String   // "POST_CREATED", "LIKE_RECEIVED", etc.
     createdAt DateTime @default(now())

     user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

     @@index([userId, createdAt])
   }
   ```

2. **Points deduction on unlike/delete**
   - What we know: Points are awarded on like/post/comment
   - What's unclear: Should points be deducted when content is deleted or unliked?
   - Recommendation: Do NOT deduct points - this is simpler and more player-friendly. Most gamification systems award permanently.

## Sources

### Primary (HIGH confidence)
- Prisma 7.3 Documentation - Transactions and atomic operations
- PostgreSQL Documentation - RANK() window function
- Existing codebase analysis - Current action patterns, schema

### Secondary (MEDIUM confidence)
- [Prisma Transactions Documentation](https://www.prisma.io/docs/orm/prisma-client/queries/transactions) - Batch and interactive transactions
- [PostgreSQL Leaderboard Query Example](https://blog.programster.org/postgresql-leaderboard-query-example) - RANK() usage patterns
- [Sonner Documentation](https://sonner.emilkowal.ski/) - Toast notifications for React

### Tertiary (LOW confidence)
- [Gamification Level Progression](https://www.gamedeveloper.com/design/quantitative-design---how-to-define-xp-thresholds-) - Level curve design principles
- [System Design: Leaderboard](https://systemdesign.one/leaderboard-system-design/) - Architecture patterns (Redis-based, not applicable to this scope)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project technologies (Prisma, PostgreSQL)
- Architecture: HIGH - Patterns verified against Prisma docs and codebase conventions
- Pitfalls: HIGH - Based on documented database concurrency issues
- Level thresholds: MEDIUM - Curve design is subjective, values are recommendations

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable technologies, no rapid changes expected)
