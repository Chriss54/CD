---
phase: 01-foundation
plan: 03
subsystem: ui
tags: [next.js, react, tailwind, routing, layout, server-components]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Next.js 16 project scaffold, Tailwind v4 CSS config, cn() utility
provides:
  - Application shell with sidebar navigation and header
  - Route group (main) for authenticated app routes
  - Placeholder pages for Home, Feed, Classroom, Calendar, Members
  - NavLink client component with active state detection
  - Reusable Button component
affects: [02-auth, 03-profiles, 04-posts, 06-courses, 08-events]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Components by default
    - Client boundary pushed to deepest level (NavLink only)
    - Route groups for layout segmentation

key-files:
  created:
    - src/app/(main)/layout.tsx
    - src/app/(main)/page.tsx
    - src/app/(main)/feed/page.tsx
    - src/app/(main)/classroom/page.tsx
    - src/app/(main)/calendar/page.tsx
    - src/app/(main)/members/page.tsx
    - src/components/layout/sidebar.tsx
    - src/components/layout/header.tsx
    - src/components/layout/nav-link.tsx
    - src/components/ui/button.tsx
  modified:
    - src/lib/db.ts

key-decisions:
  - "Server Components default - only NavLink needs 'use client' for usePathname"
  - "Route group (main) isolates app shell from future auth routes"
  - "Keep existing Geist font from 01-01 instead of switching to Inter"

patterns-established:
  - "Server Component by default: Only add 'use client' when hooks needed"
  - "Layout composition: Sidebar + Header + main content area"
  - "Route groups: (main) for app routes, future (auth) for login/register"

# Metrics
duration: 4min
completed: 2026-01-22
---

# Phase 01 Plan 03: App Shell Summary

**Navigation sidebar with 5 routes using Server Components by default and NavLink client boundary for active state**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-22T20:47:32Z
- **Completed:** 2026-01-22T20:51:52Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- App shell with fixed sidebar (64px) and header (16px)
- NavLink component using usePathname for active route highlighting
- 5 placeholder pages all building successfully as static content
- Production build verified with all routes prerendered

## Task Commits

Each task was committed atomically:

1. **Task 1: Create layout components** - `99cb82c` (feat)
2. **Task 2: Create route group and placeholder pages** - `47ac459` (feat)
3. **Task 3: Verify navigation and styling** - `82801fb` (fix)

## Files Created/Modified

**Created:**
- `src/components/layout/nav-link.tsx` - Client component with usePathname for active state
- `src/components/layout/sidebar.tsx` - Server component with navigation structure
- `src/components/layout/header.tsx` - Server component placeholder header
- `src/components/ui/button.tsx` - Reusable button with variant/size props
- `src/app/(main)/layout.tsx` - Main route group layout with sidebar + header
- `src/app/(main)/page.tsx` - Home/dashboard page
- `src/app/(main)/feed/page.tsx` - Feed placeholder
- `src/app/(main)/classroom/page.tsx` - Classroom placeholder
- `src/app/(main)/calendar/page.tsx` - Calendar placeholder
- `src/app/(main)/members/page.tsx` - Members placeholder

**Modified:**
- `src/lib/db.ts` - Fixed Prisma import path

**Deleted:**
- `src/app/page.tsx` - Replaced by route group page

## Decisions Made
- Kept Geist font from 01-01 rather than switching to Inter (already configured and working)
- Server Components by default - only NavLink has 'use client' directive
- Route group (main) for authenticated app, anticipating (auth) group later

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed Prisma client import path for build**
- **Found during:** Task 3 (Verify navigation and styling)
- **Issue:** Production build failed - `@/generated/prisma` not found (Prisma 7 uses client.ts not index.ts)
- **Fix:** Changed import from `@/generated/prisma` to `@/generated/prisma/client`
- **Files modified:** src/lib/db.ts
- **Verification:** Production build succeeds, all 5 routes prerendered
- **Committed in:** 82801fb

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix from 01-02 database setup to enable build. No scope creep.

## Issues Encountered
- Prisma 7 generated client structure differs from Prisma 6 - folder import doesn't work, explicit client.ts import required

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- App shell complete with navigation structure
- All routes accessible at /, /feed, /classroom, /calendar, /members
- Ready for auth integration (Phase 2) to add user session to header/sidebar
- Layout components ready to receive real content in subsequent phases

---
*Phase: 01-foundation*
*Completed: 2026-01-22*
