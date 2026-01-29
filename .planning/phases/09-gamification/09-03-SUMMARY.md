---
phase: 09-gamification
plan: 03
subsystem: ui-components
tags: [gamification, level-badge, points-display, profile]
dependency-graph:
  requires: ["09-01"]
  provides: ["level-badge-component", "points-display-component", "badge-integration"]
  affects: ["user-profile", "feed", "member-directory"]
tech-stack:
  added: []
  patterns: ["reusable-ui-components", "accessible-progressbar"]
key-files:
  created:
    - src/components/gamification/level-badge.tsx
    - src/components/gamification/points-display.tsx
  modified:
    - src/types/post.ts
    - src/app/(main)/feed/page.tsx
    - src/app/(main)/feed/[id]/page.tsx
    - src/app/(main)/members/page.tsx
    - src/app/(main)/members/[id]/page.tsx
    - src/components/feed/comment-list.tsx
    - src/components/profile/member-card.tsx
    - src/components/feed/post-card.tsx
    - src/components/feed/comment-card.tsx
decisions:
  - id: "level-badge-sizes"
    choice: "sm (text-xs) and md (text-sm) size variants"
    context: "sm for inline use in posts/comments, md for profile header"
  - id: "progress-bar-accessibility"
    choice: "Full ARIA support with role=progressbar and aria-label"
    context: "Consistent with existing ProgressBar component pattern from 07-02"
metrics:
  duration: "4 min"
  completed: "2026-01-23"
---

# Phase 9 Plan 3: Level Badges & Points Display Summary

LevelBadge component with sm/md sizes, PointsDisplay with progress bar, badges integrated into posts, comments, member cards, and profile page.

## Implementation Details

### LevelBadge Component

Created reusable badge with two sizes:
- `sm`: For inline use in posts, comments, member cards
- `md`: For profile page header

Styling follows CONTEXT.md guidance: same style for all levels, only number changes.

```tsx
<LevelBadge level={3} size="sm" />  // "Lvl 3" in posts/comments
<LevelBadge level={3} size="md" />  // "Lvl 3" in profile header
```

### PointsDisplay Component

Shows current points and progress to next level:
- Level and total points header
- Progress bar with ARIA accessibility
- "240/500 pts to Level 4" format per CONTEXT.md
- "Max level reached!" message at level 10

Uses `getPointsToNextLevel()` from gamification-config.ts.

### Badge Integration

Updated all relevant components and their data sources:

| Location | Component | Data Source |
|----------|-----------|-------------|
| Feed posts | PostCard | author.level from feed page query |
| Post comments | CommentCard | authorLevel from comment-list query |
| Member directory | MemberCard | level from members page query |
| Member profile | Profile page | level, points from profile query |

### Query Updates

Added `level` field to all author/user selects:
- `/feed` page query
- `/feed/[id]` page query
- comment-list query
- `/members` page query
- `/members/[id]` page query

Also added `points` field to profile page for PointsDisplay.

## Commits

| Hash | Description |
|------|-------------|
| cf59dae | Create LevelBadge and PointsDisplay components |
| a6b030d | Add level badges to posts, comments, and member cards |
| bb88c91 | Add PointsDisplay to member profile page |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `npm run build` completes without errors
- LevelBadge renders "Lvl N" format
- PointsDisplay shows points and progress bar
- Level badges appear next to author names in posts
- Level badges appear next to author names in comments
- Level badges appear in member directory cards
- Profile page shows level badge, total points, and progress bar

## Next Phase Readiness

### Prerequisites Met
- LevelBadge component available for any future uses
- PointsDisplay available for dashboard or other profile views

### Recommendations
- None - all UI components for gamification complete
