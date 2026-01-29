---
phase: 08-events-calendar
plan: 02
subsystem: ui
tags: [date-fns, timezone, TZDate, calendar, events, react]

# Dependency graph
requires:
  - phase: 08-01
    provides: Event model, CRUD actions, admin pages
provides:
  - Timezone utilities (useUserTimezone, formatEventTime, toLocalDatetimeString)
  - Calendar grid component with month navigation
  - Event list component with date grouping
  - Calendar page at /calendar with view toggle
  - Event detail page at /events/[eventId]
  - Recurring event occurrence generation
affects: [08-03, 08-04]

# Tech tracking
tech-stack:
  added: ["@date-fns/tz", "@tiptap/extension-table (blocking fix)"]
  patterns: ["Client-only timezone detection to avoid SSR hydration mismatch", "EventOccurrence type for recurring events"]

key-files:
  created:
    - src/lib/timezone.ts
    - src/components/calendar/calendar-grid.tsx
    - src/components/calendar/calendar-header.tsx
    - src/components/calendar/calendar-day-cell.tsx
    - src/components/calendar/event-list.tsx
    - src/components/calendar/event-card.tsx
    - src/components/calendar/view-toggle.tsx
    - src/components/calendar/event-time.tsx
    - src/app/(main)/calendar/calendar-client.tsx
    - src/app/(main)/events/[eventId]/page.tsx
    - src/app/(main)/events/[eventId]/event-content.tsx
  modified:
    - package.json
    - src/lib/event-actions.ts
    - src/app/(main)/calendar/page.tsx

key-decisions:
  - "@date-fns/tz TZDate for timezone conversion (SSR-safe with client detection)"
  - "Calendar view as default per CONTEXT.md"
  - "Auto-detect 12h/24h time format from browser locale"
  - "EventOccurrence type pairs event with specific occurrence date for recurring"
  - "Read-only Tiptap with editable: false for event description rendering"

patterns-established:
  - "Client-side timezone hooks with UTC fallback for SSR"
  - "EventOccurrence type for recurring event rendering"

# Metrics
duration: 5min
completed: 2026-01-23
---

# Phase 08 Plan 02: Calendar UI Summary

**Public calendar page with month grid/list views, timezone-aware event display, and recurring event occurrence generation using @date-fns/tz**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-23T22:41:10Z
- **Completed:** 2026-01-23T22:46:28Z
- **Tasks:** 3
- **Files modified:** 15

## Accomplishments
- Installed @date-fns/tz and created timezone utilities with useUserTimezone and useTimeFormat hooks
- Built calendar grid components with month navigation, day cells showing event previews
- Created list view with date grouping (today, tomorrow, this week, by month)
- Implemented view toggle between calendar grid and list views
- Created event detail page with timezone-aware time display and Tiptap description rendering
- Added recurring event occurrence generation (getEventsForMonth, getUpcomingEvents)

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @date-fns/tz and create timezone utilities** - `eda50e0` (feat)
2. **Task 2: Create calendar grid components** - `7a7dfca` (feat)
3. **Task 3: Create list view and calendar page** - `84dc85b` (feat)

## Files Created/Modified
- `src/lib/timezone.ts` - Timezone detection hooks and formatting utilities
- `src/lib/event-actions.ts` - Added TZDate conversion, getEventsForMonth, getUpcomingEvents
- `src/components/calendar/calendar-header.tsx` - Month navigation with prev/next/today
- `src/components/calendar/calendar-day-cell.tsx` - Day cell with event previews
- `src/components/calendar/calendar-grid.tsx` - 7-column month grid using date-fns
- `src/components/calendar/event-time.tsx` - Timezone-aware time display
- `src/components/calendar/event-card.tsx` - Event preview card for list view
- `src/components/calendar/event-list.tsx` - Grouped event list by date category
- `src/components/calendar/view-toggle.tsx` - Calendar/list view switcher
- `src/app/(main)/calendar/page.tsx` - Calendar page with Suspense loading
- `src/app/(main)/calendar/calendar-client.tsx` - Interactive calendar state management
- `src/app/(main)/events/[eventId]/page.tsx` - Event detail page
- `src/app/(main)/events/[eventId]/event-content.tsx` - Client-side event content with Tiptap

## Decisions Made
- Used @date-fns/tz TZDate for timezone conversion with client-side detection and UTC fallback for SSR safety
- Calendar view set as default per CONTEXT.md specification
- Auto-detect 12h/24h time format from browser locale (useTimeFormat hook)
- Created EventOccurrence type to pair events with specific occurrence dates for recurring event display
- Used read-only Tiptap editor (editable: false) for event description rendering, consistent with lesson content pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Installed missing @tiptap/extension-table dependency**
- **Found during:** Task 3 (npm run build verification)
- **Issue:** Pre-existing build failure - @tiptap/extension-table not installed but imported in lesson-content.tsx and lesson-editor.tsx
- **Fix:** Ran `npm install @tiptap/extension-table`
- **Files modified:** package.json, package-lock.json
- **Verification:** npm run build succeeds
- **Committed in:** 84dc85b (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Essential fix for build. Pre-existing issue unrelated to plan scope.

## Issues Encountered
None - plan executed smoothly after blocking dependency fix.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Calendar UI complete with grid and list views
- Event detail pages accessible at /events/[eventId]
- Ready for Phase 08-03 (event RSVP and attendance) or 08-04 (calendar enhancements)
- Timezone handling in place for all event time displays

---
*Phase: 08-events-calendar*
*Completed: 2026-01-23*
