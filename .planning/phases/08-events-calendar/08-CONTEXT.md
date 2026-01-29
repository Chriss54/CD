# Phase 8: Events Calendar - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Admin can create events with title, description, date/time, and optional location link. Users can browse events in a calendar or list view with proper timezone conversion. Events are purely informational — no RSVP or attendance tracking.

**Note:** Original requirements included RSVP (EVNT-03, EVNT-04, EVNT-05) — intentionally skipped per user decision. Users join calls directly via link without pre-registration.

</domain>

<decisions>
## Implementation Decisions

### Calendar Display
- Both calendar grid and list view with toggle
- Month view only (no week view drill-down)
- Show truncated event titles directly on day cells
- Calendar view is the default when landing on events page

### Event Details
- Location: text field + optional URL (for Zoom/Meet links)
- Cover images: optional, admin can upload
- Description: rich text via Tiptap editor (consistent with posts)
- Simple recurrence: weekly/monthly repeat options

### Time Handling
- Display in user's local timezone (auto-detected from browser)
- No all-day events — all events require start/end times
- Time format: auto-detect from browser/locale (12h or 24h)
- Admin creates events in their local timezone (auto-detected)

### No RSVP System
- Events are purely informational
- No Going/Maybe/Not Going responses
- No attendance tracking (before or after)
- Users join calls directly via the event link

### Claude's Discretion
- Calendar component library choice
- Exact cell layout for events on calendar grid
- List view card design
- Mobile responsive behavior for calendar
- Recurrence UI implementation

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for calendar UI.

</specifics>

<deferred>
## Deferred Ideas

- RSVP system — intentionally skipped, could add in future phase if needed
- Attendance tracking — not needed for current use case
- Calendar integrations (Google Calendar, iCal export) — future enhancement
- Event reminders/notifications — separate phase

</deferred>

---

*Phase: 08-events-calendar*
*Context gathered: 2026-01-23*
