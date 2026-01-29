# Phase 9: Gamification - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users earn points for engagement actions (posts, comments, likes received, lessons completed), unlock levels at defined thresholds, and can view their ranking on a leaderboard. This phase adds the gamification layer to existing features — no new content types or interactions.

</domain>

<decisions>
## Implementation Decisions

### Points System
- Fixed point amounts per action (not scaled by quality/engagement)
- Points earned for: creating posts, commenting, receiving likes on content, completing lessons
- Content creator earns points when their content receives likes (liker does not earn points)
- Points only visible on profiles and leaderboard — no inline badges on posts/comments

### Levels & Progression
- 10 levels total
- Numeric badge display (Level 1, Level 2, etc.) — not named tiers
- Level badges appear everywhere: profile, posts, comments, member directory, leaderboard
- Toast notification when user levels up (celebratory moment)

### Leaderboard Display
- Three time period tabs: All-time, This month, This day
- Shows top 5 users per time period
- Current user always sees their own rank below top 5 (if not in top 5)
- Dedicated /leaderboard page (no sidebar widget)

### Points Feedback
- No instant toast feedback when earning points — updates silently
- Profile shows total points and current level only — no activity log/history
- Progress bar on profile showing points toward next level (e.g., "240/500 pts to Level 4")
- All level badges same style, only number changes (no color progression)

### Claude's Discretion
- Exact point values per action
- Level threshold progression curve
- Badge visual design
- Progress bar styling

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-gamification*
*Context gathered: 2026-01-23*
