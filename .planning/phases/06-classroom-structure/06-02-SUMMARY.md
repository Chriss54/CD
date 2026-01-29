---
phase: 06-classroom-structure
plan: 02
subsystem: ui
tags: [tiptap, prisma, supabase-storage, rich-text, file-upload]

# Dependency graph
requires:
  - phase: 06-01
    provides: Course and Module models, admin course management
  - phase: 04-02
    provides: Tiptap setup with SSR compatibility pattern
provides:
  - Lesson model with rich text content (Tiptap JSON)
  - Attachment model with Supabase Storage integration
  - Enhanced Tiptap editor with code blocks, tables, links
  - Lesson edit page with video embed preview
  - File attachment upload/download functionality
affects: [06-03, 06-04, 07-classroom-student]

# Tech tracking
tech-stack:
  added: [@tiptap/extension-table]
  patterns: [Tiptap Table extension from single package, supabase storage file upload pattern]

key-files:
  created:
    - src/lib/validations/lesson.ts
    - src/lib/attachment-actions.ts
    - src/components/admin/lesson-editor.tsx
    - src/components/admin/attachment-list.tsx
    - src/app/(main)/admin/courses/[courseId]/lessons/[lessonId]/page.tsx
    - src/app/(main)/admin/courses/[courseId]/lessons/[lessonId]/lesson-edit-form.tsx
  modified:
    - prisma/schema.prisma
    - src/types/course.ts
    - src/lib/lesson-actions.ts
    - next.config.ts

key-decisions:
  - "Table extension exports (Table, TableRow, TableCell, TableHeader) all from @tiptap/extension-table"
  - "10MB serverActions.bodySizeLimit for attachment uploads"
  - "Sanitize filenames with timestamp prefix for unique storage paths"
  - "Extract storage paths from public URL for deletion"

patterns-established:
  - "Pattern: Supabase Storage upload via server actions with FormData"
  - "Pattern: Enhanced Tiptap editor with configurable extensions"

# Metrics
duration: 6min
completed: 2026-01-23
---

# Phase 6 Plan 02: Lesson Model and Editor Summary

**Lesson model with enhanced Tiptap editor (code blocks, tables, links), video embed preview, and Supabase Storage file attachments**

## Performance

- **Duration:** 6 min
- **Started:** 2026-01-23T20:07:53Z
- **Completed:** 2026-01-23T20:14:08Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments
- Lesson and Attachment Prisma models with cascade delete
- Enhanced LessonEditor with headings, lists, code blocks, tables, and links
- File attachment upload to Supabase Storage with type validation
- Lesson edit page with video URL preview using VideoEmbedPlayer
- Inline delete confirmation for lessons and attachments

## Task Commits

Each task was committed atomically:

1. **Task 1: Add Lesson and Attachment models, install editor extensions** - `2eecda4` (feat)
2. **Task 2: Create lesson and attachment server actions** - `14e7f94` (feat)
3. **Task 3: Create enhanced lesson editor and edit page** - `36ea470` (feat)

## Files Created/Modified
- `prisma/schema.prisma` - LessonStatus enum, Lesson and Attachment models
- `src/types/course.ts` - LessonStatus, LessonWithAttachments, LessonWithModule types
- `src/lib/validations/lesson.ts` - Lesson validation schema with Tiptap JSON validation
- `src/lib/lesson-actions.ts` - CRUD server actions with storage cleanup
- `src/lib/attachment-actions.ts` - Upload/delete with Supabase Storage
- `src/components/admin/lesson-editor.tsx` - Enhanced Tiptap with 260 lines
- `src/components/admin/attachment-list.tsx` - File list with upload/download
- `src/app/(main)/admin/courses/[courseId]/lessons/[lessonId]/page.tsx` - Server component
- `src/app/(main)/admin/courses/[courseId]/lessons/[lessonId]/lesson-edit-form.tsx` - Form client component
- `next.config.ts` - Increased bodySizeLimit to 10mb

## Decisions Made
- Table extension exports (Table, TableRow, TableCell, TableHeader) all come from single @tiptap/extension-table package
- Increased serverActions.bodySizeLimit to 10MB (was 5MB) to support larger attachments
- Sanitize filenames and add timestamp prefix for unique storage paths
- Storage path extraction from public URL via regex for deletion
- Configure StarterKit with codeBlock: false to use dedicated CodeBlock extension

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Initial imports for table extensions incorrect (tried separate packages) - fixed by importing all from @tiptap/extension-table

## User Setup Required

**Supabase Storage bucket setup required.** The "attachments" bucket must exist in Supabase Storage:
1. Go to Supabase Studio (localhost:54323 for local dev)
2. Navigate to Storage
3. Create bucket named "attachments"
4. Set bucket to public (or configure RLS policies for signed URLs)

## Next Phase Readiness
- Lesson CRUD complete, ready for drag-drop reordering in 06-03
- Module-lesson hierarchy established for course tree navigation
- Video embed and attachments working for content authoring

---
*Phase: 06-classroom-structure*
*Completed: 2026-01-23*
