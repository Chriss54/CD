---
phase: 12-search-infrastructure
plan: 02
subsystem: api
tags: [postgresql, fts, tsvector, search, server-actions, tiptap, prisma]

# Dependency graph
requires:
  - phase: 12-01
    provides: FTS database infrastructure (tsvector columns, GIN indexes, tiptap-utils)
  - phase: 04-feed-core
    provides: Post model with Tiptap JSON content
provides:
  - Post CRUD with automatic plainText extraction on create/update
  - Backfill script for existing posts without plainText
  - Unified search server action querying Post, User, Course
  - Ranked search results with highlighted snippets
affects: [13-search-ui, search-page, global-search]

# Tech tracking
tech-stack:
  added:
    - tsx (dev dependency for running TypeScript scripts)
  patterns:
    - "Plain text extraction on write (not read) for search indexing"
    - "Unified FTS query with UNION ALL across multiple tables"
    - "ts_headline for snippet generation with <mark> highlighting"
    - "Duration tracking for performance monitoring"

key-files:
  created:
    - scripts/backfill-plain-text.ts
    - src/lib/search-actions.ts
  modified:
    - src/lib/post-actions.ts

key-decisions:
  - "Extract plainText on post create/update rather than on-demand"
  - "Use websearch_to_tsquery for user-friendly query syntax"
  - "Return first 100 chars of plainText as title for posts (posts have no title field)"
  - "Limit search results to 50 to prevent over-fetching"
  - "Only search PUBLISHED courses for security"

patterns-established:
  - "Post mutation pattern: extract plainText, save to column, triggers searchVector via GENERATED"
  - "Search action pattern: unified query with UNION ALL, ts_rank for scoring, ts_headline for snippets"
  - "Script pattern: use dotenv/config for env vars, tsx for TypeScript execution"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 12 Plan 02: Search Integration and API Summary

**Post plainText extraction on CRUD, backfill script, and unified search action returning ranked results with highlighted snippets**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T03:20:00Z
- **Completed:** 2026-01-24T03:24:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- Post CRUD operations now extract plainText from Tiptap content automatically
- Backfill script to populate plainText for existing posts (0 posts needed backfill in current database)
- Unified search server action querying Post, User, and Course tables via PostgreSQL FTS
- Ranked results using ts_rank with weight A for titles, weight B for content
- Search snippets with matched text highlighted using `<mark>` tags

## Task Commits

Each task was committed atomically:

1. **Task 1: Integrate plainText extraction into post-actions** - `3d21b83` (feat)
2. **Task 2: Create backfill script for existing posts** - `5ffcc77` (feat)
3. **Task 3: Create unified search server action** - `cea75ea` (feat)

## Files Created/Modified

- `src/lib/post-actions.ts` - Added extractPlainText import and calls in createPost/updatePost
- `scripts/backfill-plain-text.ts` - Script to populate plainText for existing posts with null values
- `src/lib/search-actions.ts` - Exports `search()` function for unified FTS across all indexed entities
- `package.json` / `package-lock.json` - Added tsx dev dependency

## Decisions Made

1. **Extract plainText on write** - Rather than extracting on-demand for each search, extract once when post is created/updated. More efficient and keeps searchVector always in sync.

2. **Use websearch_to_tsquery** - Supports user-friendly query syntax with quotes for exact phrases, OR for alternatives, and - for exclusion. More intuitive than plainto_tsquery.

3. **First 100 chars as post title** - Posts don't have a title field, so use first 100 characters of plainText as the display title in search results.

4. **Limit 50 results** - Prevents over-fetching and keeps response fast. Pagination can be added later if needed.

5. **PUBLISHED courses only** - Security measure to ensure draft courses don't appear in search results.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Regenerated Prisma client**
- **Found during:** Task 1 (plainText integration)
- **Issue:** TypeScript error - plainText field not recognized in Prisma types
- **Fix:** Ran `npx prisma generate` to regenerate client with schema from Plan 01
- **Files modified:** None (generated files in src/generated/prisma/)
- **Verification:** TypeScript compiles successfully
- **Committed in:** Part of task workflow, not separate commit

**2. [Rule 3 - Blocking] Added dotenv loading to backfill script**
- **Found during:** Task 2 (backfill script)
- **Issue:** Script failed with DATABASE_URL not set error
- **Fix:** Added `import 'dotenv/config'` and run with DOTENV_CONFIG_PATH env var
- **Files modified:** scripts/backfill-plain-text.ts
- **Verification:** Script runs and connects to database
- **Committed in:** 5ffcc77 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for script execution. No scope creep.

## Issues Encountered

None - plan executed smoothly after addressing blocking issues above.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Search infrastructure complete (database + API)
- `search()` function ready to be called from UI components
- Ready for Phase 13: Search UI (search page, global search bar)
- Performance tracking via duration field enables monitoring sub-100ms target

---
*Phase: 12-search-infrastructure*
*Completed: 2026-01-24*
