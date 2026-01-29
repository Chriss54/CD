# Phase 13: Search UI & Results - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a search interface where users can find posts, members, and courses through a persistent search bar in the header, a results page with type filtering, and appropriate empty/error states. The search infrastructure (FTS, indexing, server actions) was completed in Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Search bar behavior
- Always-visible input in the header (not icon-expand or modal)
- Navigate to /search?q={query} on enter (no instant dropdown results)
- Cmd+K / Ctrl+K keyboard shortcut to focus the search bar
- Placeholder text shows the shortcut: "Search... ⌘K"

### Results page layout
- Single column list layout (full width, easy to scan)
- Compact result cards: title, type badge, and short snippet
- Yellow highlight background on matched words in snippets
- Icon + label type indicator on each result ("Post", "Member", "Course")

### Type filtering tabs
- Horizontal tabs below search bar on results page
- Tabs show counts: "Posts (12)" "Members (3)"
- Fixed order: All, Posts, Members, Courses
- Filter reflected in URL: Claude's discretion (recommend query param for shareability)

### Empty & error states
- Empty search page (no query): just the search input, no tips or suggestions
- No results: text suggestions only ("No results for 'xyz'. Try different keywords or check spelling.")
- Loading state: simple spinner in results area
- Filtered tab with zero results: show type-specific message ("No posts found")

### Claude's Discretion
- URL state for type filter (recommend ?type= query param)
- Exact spinner component/placement
- Spacing and typography details
- Error handling for failed searches

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-search-ui*
*Context gathered: 2026-01-24*
