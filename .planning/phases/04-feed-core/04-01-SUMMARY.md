---
phase: 04-feed-core
plan: 01
subsystem: database, api
tags: [prisma, tiptap, video-embed, server-actions, zod]

# Dependency graph
requires:
  - phase: 03-profiles
    provides: User model with profile fields
provides:
  - Post model with content and embeds JSON fields
  - Video URL parsing for YouTube, Vimeo, Loom
  - Server actions for post CRUD with ownership verification
affects: [04-02, 04-03, feed-ui, post-composer]

# Tech tracking
tech-stack:
  added: [@tiptap/react, @tiptap/pm, @tiptap/starter-kit, get-video-id, date-fns]
  patterns: [Json fields for Tiptap content, video embed extraction, ownership-based authorization]

key-files:
  created:
    - src/types/post.ts
    - src/lib/video-utils.ts
    - src/lib/validations/post.ts
    - src/lib/post-actions.ts
  modified:
    - prisma/schema.prisma
    - package.json

key-decisions:
  - "Zod 4 requires z.record(keySchema, valueSchema) syntax for records"
  - "Prisma Json fields require cast to Prisma.InputJsonValue for type safety"
  - "Tiptap content stored as raw JSON for flexibility"

patterns-established:
  - "Video embed pattern: parse URL -> extract service/id -> store in embeds array"
  - "Post ownership check: verify post.authorId === session.user.id before update/delete"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 04-01: Post Data Model Summary

**Post model with Tiptap JSON content, video embed parsing for YouTube/Vimeo/Loom, and server actions with ownership verification**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T17:54:24Z
- **Completed:** 2026-01-23T17:58:13Z
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- Post model in database with content (Json), embeds (Json), authorId, timestamps
- Video URL parsing supporting YouTube, Vimeo, and Loom platforms
- Zod validation schema for Tiptap JSON document structure
- Server actions (createPost, updatePost, deletePost) with auth and ownership checks

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create Post model** - `be12cc6` (feat)
2. **Task 2: Create video utilities and validation schema** - `f4fad68` (feat)
3. **Task 3: Create post server actions** - `8269aed` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - Added Post model with User relation
- `src/types/post.ts` - VideoService, VideoEmbed, PostWithAuthor types
- `src/lib/video-utils.ts` - parseVideoUrl, getThumbnailUrl, getEmbedUrl functions
- `src/lib/validations/post.ts` - postSchema with Tiptap JSON and embeds validation
- `src/lib/post-actions.ts` - createPost, updatePost, deletePost server actions
- `package.json` - Added @tiptap/*, get-video-id, date-fns dependencies

## Decisions Made
- **Zod 4 record syntax:** Updated to z.record(z.string(), z.unknown()) as Zod 4 requires explicit key schema
- **Prisma JSON type casting:** Cast validated content/embeds to Prisma.InputJsonValue for type compatibility
- **Tiptap content storage:** Store raw JSON document from Tiptap for maximum flexibility

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Zod 4 record syntax**
- **Found during:** Task 2 (validation schema)
- **Issue:** z.record(z.unknown()) failed - Zod 4 requires key schema
- **Fix:** Changed to z.record(z.string(), z.unknown())
- **Files modified:** src/lib/validations/post.ts
- **Committed in:** f4fad68

**2. [Rule 3 - Blocking] Fixed Prisma JSON type compatibility**
- **Found during:** Task 3 (server actions)
- **Issue:** Validated content type not assignable to Prisma Json field
- **Fix:** Cast to Prisma.InputJsonValue and imported Prisma types
- **Files modified:** src/lib/post-actions.ts
- **Committed in:** 8269aed

---

**Total deviations:** 2 auto-fixed (2 blocking)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
- Prisma client needed regeneration after schema change (`npx prisma generate`) - expected workflow
- Import path for Prisma types is `@/generated/prisma/client` not `@/generated/prisma` - documented pattern from 01-03

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Post data layer complete, ready for Feed UI (04-02)
- Server actions provide full CRUD for post creation
- Video utilities support embed extraction for post composer

---
*Phase: 04-feed-core*
*Completed: 2026-01-23*
