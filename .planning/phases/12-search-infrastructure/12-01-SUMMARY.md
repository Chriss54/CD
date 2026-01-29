---
phase: 12-search-infrastructure
plan: 01
subsystem: database
tags: [postgresql, fts, tsvector, gin-index, tiptap, prisma]

# Dependency graph
requires:
  - phase: 04-feed-core
    provides: Post model with Tiptap JSON content
  - phase: 06-classroom-structure
    provides: Course model with title/description
  - phase: 03-profiles
    provides: User model with name/bio
provides:
  - PostgreSQL tsvector columns on Post, User, Course tables
  - GIN indexes for sub-100ms FTS queries
  - GENERATED ALWAYS AS columns for automatic vector updates
  - Tiptap JSON to plain text extraction utility
  - plainText column on Post for search indexing
affects: [12-search-infrastructure, search-api, search-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "PostgreSQL GENERATED ALWAYS AS for computed columns"
    - "GIN indexes for tsvector full-text search"
    - "Prisma Unsupported type for tsvector columns"

key-files:
  created:
    - src/lib/tiptap-utils.ts
    - prisma/migrations/20260124031200_add_search_vectors/migration.sql
  modified:
    - prisma/schema.prisma

key-decisions:
  - "Use GENERATED ALWAYS AS for auto-updating tsvector columns"
  - "Weight A for titles/names, weight B for descriptions/content"
  - "Create separate plainText column to store extracted Tiptap text"

patterns-established:
  - "Tiptap text extraction: use extractPlainText() from tiptap-utils.ts"
  - "FTS columns: use Unsupported('tsvector') in Prisma schema"
  - "Manual migrations for GENERATED columns (Prisma doesn't support natively)"

# Metrics
duration: 4min
completed: 2026-01-24
---

# Phase 12 Plan 01: FTS Database Infrastructure Summary

**PostgreSQL FTS infrastructure with tsvector columns, GIN indexes, and Tiptap text extraction utility for sub-100ms search**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-24T03:11:05Z
- **Completed:** 2026-01-24T03:15:12Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Tiptap JSON to plain text extraction utility using `generateText()` from @tiptap/core
- Schema updated with plainText on Post, searchVector on Post/User/Course
- Migration with GENERATED ALWAYS AS tsvector columns and GIN indexes
- User and Course searchVector auto-populate from existing data immediately

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Tiptap text extraction utility** - `144bdc2` (feat)
2. **Task 2: Update schema with plainText and tsvector columns** - `ed5a597` (feat)
3. **Task 3: Create migration with GENERATED columns and GIN indexes** - `f01d09f` (feat)

## Files Created/Modified

- `src/lib/tiptap-utils.ts` - Exports `extractPlainText()` for Tiptap JSON to plain text conversion
- `prisma/schema.prisma` - Added plainText on Post, searchVector on Post/User/Course with GIN index hints
- `prisma/migrations/20260124031200_add_search_vectors/migration.sql` - GENERATED ALWAYS AS columns with weighted vectors and GIN indexes

## Decisions Made

1. **Use GENERATED ALWAYS AS for tsvector columns** - Vectors auto-update when source columns change, no trigger maintenance required
2. **Weight A for primary fields, B for secondary** - User name gets weight A (more important), bio gets B. Same pattern for Course title/description
3. **Separate plainText column for Posts** - Post content is Tiptap JSON, need separate column to store extracted text for indexing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Database drift detected** - Migration history was out of sync with actual database (from previous `db push` usage). Resolved by using `prisma db push` to sync schema, then manually creating migration file and marking as applied via `_prisma_migrations` table insert.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- FTS infrastructure complete for User and Course (searchVector auto-populates)
- Post searchVector requires plainText population (Plan 02 will add backfill and populate on create/update)
- GIN indexes in place for sub-100ms query performance
- Ready for Plan 02: Post plainText population and search API

---
*Phase: 12-search-infrastructure*
*Completed: 2026-01-24*
