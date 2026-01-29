---
phase: 06-classroom-structure
plan: 03
subsystem: ui
tags: [dnd-kit, drag-drop, tree, sidebar, navigation, course-admin]

# Dependency graph
requires:
  - phase: 06-01
    provides: Course and Module models, CRUD operations
  - phase: 06-02
    provides: Lesson model with position ordering
provides:
  - Sidebar tree navigation for course structure
  - Drag-drop reordering for modules and lessons
  - Two-column layout with persistent sidebar
affects: [07-classroom-delivery, 06-04-lesson-viewer]

# Tech tracking
tech-stack:
  added: [dnd-kit-sortable-tree, "@dnd-kit/core", "@dnd-kit/sortable", "@dnd-kit/utilities"]
  patterns: [tree-component, drag-drop-reorder, sidebar-layout]

key-files:
  created:
    - src/components/admin/course-tree.tsx
    - src/app/(main)/admin/courses/[courseId]/layout.tsx
  modified:
    - src/lib/module-actions.ts
    - src/lib/lesson-actions.ts
    - src/lib/course-actions.ts
    - src/app/(main)/admin/courses/[courseId]/page.tsx

key-decisions:
  - "Local ItemChangedReason type definition - not exported from dnd-kit-sortable-tree"
  - "SimpleTreeItemWrapper for tree items with custom content"
  - "Sidebar in layout component for persistence across lesson pages"

patterns-established:
  - "Tree drag-drop: SortableTree with custom TreeItemComponent and onItemsChanged handler"
  - "Course layout: Fixed sidebar with scrollable main content"
  - "Position updates: Transaction-based batch updates for atomic reordering"

# Metrics
duration: 4min
completed: 2026-01-23
---

# Phase 6 Plan 3: Course Tree Sidebar Summary

**Drag-drop sortable tree sidebar for course structure with dnd-kit-sortable-tree, enabling module/lesson reordering and cross-module lesson moves**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-23T20:07:56Z
- **Completed:** 2026-01-23T20:12:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Installed dnd-kit packages for tree-based drag-drop functionality
- Created CourseTree component with expand/collapse modules and lesson links
- Built two-column layout with persistent sidebar across course pages
- Added server actions for reordering modules and moving lessons between modules

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dnd-kit dependencies** - `edd5c23` (chore)
2. **Task 2: Add reorder server actions** - `c942c82` (feat)
3. **Task 3: Create CourseTree component and layout with sidebar** - `db41dcf` (feat)

## Files Created/Modified

**Created:**
- `src/components/admin/course-tree.tsx` - Drag-drop sortable tree component with module/lesson hierarchy
- `src/app/(main)/admin/courses/[courseId]/layout.tsx` - Two-column layout with sidebar tree

**Modified:**
- `src/lib/module-actions.ts` - Added reorderModules server action
- `src/lib/lesson-actions.ts` - Added reorderLessons and moveLessonToModule server actions
- `src/lib/course-actions.ts` - Added getCourseWithLessons for tree data fetching
- `src/app/(main)/admin/courses/[courseId]/page.tsx` - Simplified to course settings only
- `package.json` - Added dnd-kit packages

## Decisions Made

1. **Local ItemChangedReason type** - The type is not exported from dnd-kit-sortable-tree, so defined locally based on the package's internal types.

2. **SimpleTreeItemWrapper usage** - Used the built-in wrapper with custom content for modules and lessons, keeping visual consistency while enabling custom icons and navigation.

3. **Layout-level sidebar** - Placed CourseTree in the layout component rather than individual pages, ensuring sidebar persists when navigating between course settings and lesson pages.

4. **Transaction-based reordering** - Server actions use Prisma transactions to update positions atomically, preventing race conditions.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Course structure fully navigable via sidebar tree
- Ready for lesson content editing (06-02)
- Ready for student-facing classroom delivery (Phase 07)

---
*Phase: 06-classroom-structure*
*Completed: 2026-01-23*
