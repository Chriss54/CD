# Phase 5: Feed Engagement - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can interact with posts through comments, likes, and category filtering. This phase adds engagement features to the existing feed from Phase 4. Post creation/editing and admin moderation are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Comment System
- Flat comments (no nesting/threading)
- Newest comments first
- Users can edit and delete their own comments
- Post author's comments get subtle background highlight (no badge)
- Comment count shown on post cards only when > 0
- Comment input field at the bottom of comment list
- Edited comments show simple "edited" label (no timestamp)
- Deleted comments removed completely (no placeholder)

### Like Behavior
- Thumbs up icon that fills when liked
- Users can see full list of who liked (click count to view)
- Both posts AND comments can be liked
- Like count hidden when zero

### Category System
- Single category per post (required when creating)
- Horizontal tabs at top of feed: All | Category A | Category B | ...
- Category displayed as colored label/badge on each post card
- Category tabs hidden until admin creates categories

### Empty States
- No comments: Friendly prompt "Be the first to comment" with input ready
- Empty category: "No posts in [Category] yet. Be the first!" encouraging posting
- Include illustrations for empty states

### Claude's Discretion
- Exact illustration designs for empty states
- Tab styling and hover states
- Optimistic update implementation details
- Animation/transition effects

</decisions>

<specifics>
## Specific Ideas

No specific product references mentioned — open to standard approaches that fit the existing design.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-feed-engagement*
*Context gathered: 2026-01-23*
