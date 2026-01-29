# Research Summary: Global Search (v1.1)

**Project:** Community Platform v1.1 - Global Search
**Researched:** 2026-01-23
**Confidence:** HIGH

## Executive Summary

Global search enables users to find posts, members, and courses from a unified search interface. Research recommends using PostgreSQL Full-Text Search (already available in Supabase) rather than external services like Algolia or Meilisearch. This eliminates infrastructure overhead and data synchronization complexity while providing sufficient performance for this scale.

The implementation follows established patterns: a SearchBar Client Component in the header, a `/search` page with URL-based state for shareability, and Server Actions for search queries. Key challenges are extracting searchable text from Tiptap JSON content and ensuring proper access control in search results.

## Key Findings

### Stack: PostgreSQL FTS + cmdk

**Recommendation:** Use PostgreSQL Full-Text Search with Supabase — zero new infrastructure.

| Aspect | Recommendation |
|--------|----------------|
| Search engine | PostgreSQL FTS (built into Supabase) |
| Client UI | `cmdk` (^1.0.0) for command palette |
| Debouncing | `use-debounce` (^10.1.0) |
| Indexing | tsvector columns with GIN indexes |
| Query safety | `websearch_to_tsquery()` for user input |

**Why not external services:**
- $0 additional cost (already included in Supabase)
- No data synchronization needed
- Sufficient for community platform scale
- Upgrade path to Meilisearch exists if needed later

### Features: MVP Scope

**Table stakes (must have):**
- Search bar in header (always visible)
- Cross-content search (posts, members, courses)
- Results page with content type tabs
- Basic relevance (title match > body match)
- No results state with helpful guidance

**Phase 2 additions:**
- Autocomplete dropdown with previews
- Recent searches (localStorage)
- Cmd+K keyboard shortcut
- Sort by date/relevance

**Deferred:**
- Typo tolerance / fuzzy matching (pg_trgm later)
- Complex faceted filters
- Saved searches
- AI-powered search

### Architecture: Integration Points

**New components:**
1. `SearchBar` (Client Component) — header integration, debounced input
2. `SearchResults` (Server Component) — displays grouped results
3. `/search` page — URL-based state (`?q={query}&type={type}`)

**API approach:** Server Actions (matches existing pattern) with parallel Prisma queries.

**Tiptap JSON challenge:** Posts store content as JSON. Two options:
1. **MVP:** Extract text at query time via raw SQL (`content::text ILIKE`)
2. **Optimization:** Pre-compute searchText column with trigger

**Reusable components:** PostCard, MemberCard, CourseCard, Pagination, EmptyState

### Critical Pitfalls

| Pitfall | Prevention | Phase |
|---------|------------|-------|
| Tiptap JSON not searchable | Extract plain text from JSON before indexing | Infrastructure |
| Access control bypass | Filter results in query, not after | Search API |
| Prisma FTS not using indexes | Use `$queryRaw` for search queries | Infrastructure |
| No debouncing | 300ms debounce on input | Search UI |
| Empty state dead end | Show helpful suggestions, category links | Results page |
| Search input hidden | Place in header, add Cmd+K shortcut | Search UI |

## Roadmap Implications

### Phase Structure

Based on research, global search requires **2 phases**:

**Phase 12: Search Infrastructure**
- Add tsvector columns to Post, User, Course models
- Create GIN indexes for fast search
- Create search-actions.ts with parallel queries
- Handle Tiptap JSON text extraction

**Phase 13: Search UI**
- SearchBar component in header
- /search page with results
- Content type tabs (All, Posts, Members, Courses)
- Empty state handling
- Cmd+K keyboard shortcut

### Build Order

1. Database: tsvector columns + GIN indexes
2. API: search-actions.ts with parallel queries
3. UI: SearchBar + Header integration
4. Page: /search with SearchResults
5. Polish: Tabs, pagination, empty states

## Installation

```bash
npm install use-debounce cmdk
```

That's it. PostgreSQL FTS is already available via Supabase.

## Sources

### PostgreSQL Full-Text Search
- [Supabase FTS Docs](https://supabase.com/docs/guides/database/full-text-search)
- [Prisma FTS Docs](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search)
- [PostgreSQL Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)

### Search UX
- [Baymard Autocomplete UX](https://baymard.com/blog/autocomplete-design)
- [Nielsen Norman Group Site Search](https://www.nngroup.com/articles/site-search-suggestions/)

### Client Libraries
- [cmdk](https://cmdk.paco.me/)
- [use-debounce](https://www.npmjs.com/package/use-debounce)

### Integration
- [Next.js Search and Pagination](https://nextjs.org/learn/dashboard-app/adding-search-and-pagination)

---
*Research completed: 2026-01-23*
*Ready for roadmap: Yes*
