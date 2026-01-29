# Phase 6: Classroom Structure - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can create the full course hierarchy (courses, modules, lessons). This is admin-facing content authoring — creating and organizing educational content structure. User-facing catalog, enrollment, and progress tracking are Phase 7.

</domain>

<decisions>
## Implementation Decisions

### Course hierarchy navigation
- Sidebar tree showing full course structure (modules and lessons)
- Tree scoped to current course only — not all courses
- Separate `/admin/courses` page to list and select courses
- Clicking module expands/collapses to show lessons — no separate module detail page

### Lesson content editing
- Enhanced Tiptap editor: headings, bold, italic, lists, links, plus code blocks and tables
- Video embed always at top of lesson, text content below
- Preview button opens student view in new tab or modal
- File attachments supported — admins can attach downloadable files (PDFs, etc.)

### Module/lesson ordering
- Drag and drop in sidebar tree for reordering
- Lessons can be dragged across modules (move between modules)
- New modules/lessons added at the end of their list
- Modal warning when deleting a module that contains lessons — shows count of affected lessons

### Publishing workflow
- Courses have draft and published states — start as draft
- Per-lesson draft states — individual lessons can be draft even if course is published
- Published courses can be unpublished (toggled back to draft)
- Unpublished courses are inaccessible to ALL users — enrolled students lose access until republished

### Claude's Discretion
- Exact sidebar tree component implementation
- Table and code block styling in editor
- File upload size limits and allowed types
- Draft badge/indicator styling

</decisions>

<specifics>
## Specific Ideas

No specific product references mentioned — open to standard approaches for LMS admin interfaces.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-classroom-structure*
*Context gathered: 2026-01-23*
