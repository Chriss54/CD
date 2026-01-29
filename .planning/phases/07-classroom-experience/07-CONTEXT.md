# Phase 7: Classroom Experience - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can browse courses, enroll, and track their learning progress. This includes the course catalog, enrollment flow, progress tracking, and lesson completion. Course creation and admin editing are covered in Phase 6 (complete).

</domain>

<decisions>
## Implementation Decisions

### Catalog Presentation
- Card grid layout with visual thumbnails, 2-3 per row
- Standard info on cards: title, thumbnail, description preview, lesson count, duration
- No filtering or sorting — simple catalog display
- Published courses only — drafts do not appear in catalog

### Enrollment Flow
- One-click enrollment — click 'Enroll' and you're in immediately
- After enrolling, land on course overview page (not first lesson)
- Users can unenroll anytime — progress is preserved
- Enrolled courses shown within the classroom/course section itself

### Progress Visualization
- Progress bar on enrolled course cards (no percentage label)
- Green checkmarks on completed lessons in sidebar/curriculum
- Progress visible on course cards only (not duplicated in sidebar)
- 'Continue Learning' button to resume at next incomplete lesson

### Lesson Completion UX
- Manual 'Mark Complete' button — no auto-completion
- Button placed in top right of lesson header area
- After marking complete: 'Next Lesson' button appears, user decides when to advance
- Users can toggle complete/incomplete freely

### Claude's Discretion
- Exact card dimensions and spacing
- Progress bar color and styling
- Empty states for catalog and enrolled courses
- Continue button placement on course cards

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

*Phase: 07-classroom-experience*
*Context gathered: 2026-01-23*
