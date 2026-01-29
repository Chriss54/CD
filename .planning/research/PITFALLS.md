# Pitfalls Research: Global Search

**Domain:** Adding search to existing community platform
**Researched:** 2026-01-23
**Confidence:** HIGH (verified via PostgreSQL docs, Prisma docs, OWASP guidelines)

---

## Critical Pitfalls

High-impact mistakes that cause rewrites or major security issues.

### Pitfall 1: Searching Tiptap JSON Without Text Extraction

**Problem:**
Posts and lessons store content as Tiptap JSON (`content Json` in schema). Attempting to search this JSON directly with PostgreSQL full-text search indexes all JSON keys and values, producing garbage results. Searching for "hello" might match a node type "paragraph" or styling attribute instead of actual content.

**Warning signs:**
- Search returns unexpected results that don't contain the query
- GIN index on JSON column produces huge index sizes
- `to_tsvector` on raw JSON includes markup like "type", "attrs", "marks"

**Prevention:**
1. Extract plain text from Tiptap JSON before indexing using `jsonb_path_query_array(content, 'strict $.**.text')::text`
2. Create a computed/generated column or trigger-maintained column that stores extracted text
3. Build tsvector index on the extracted text, not the raw JSON
4. Use server-side text extraction function that mirrors Tiptap's `editor.getText()` output

**Example approach:**
```sql
-- Extract text from Tiptap JSON for full-text search
CREATE OR REPLACE FUNCTION extract_tiptap_text(content jsonb)
RETURNS text AS $$
  SELECT string_agg(value::text, ' ')
  FROM jsonb_path_query(content, 'strict $.**.text') AS value;
$$ LANGUAGE sql IMMUTABLE;

-- Add computed column for search
ALTER TABLE "Post" ADD COLUMN search_text text
  GENERATED ALWAYS AS (extract_tiptap_text(content)) STORED;
```

**Phase:** Search Infrastructure - Must be solved in the first task before any search queries work correctly.

**Sources:**
- [Full Rich Text Search with Slate and PostgreSQL 12](https://bonaroo.nl/2020/02/01/rich-text-search-with-slate-and-postgresql.html)
- [Tiptap JSON to Plain Text Discussion](https://github.com/ueberdosis/tiptap/discussions/3114)
- [PostgreSQL JSON Path Query](https://www.postgresql.org/docs/current/functions-json.html)

---

### Pitfall 2: Exposing Member-Only Content in Search Results

**Problem:**
Search returns posts, courses, or lessons that the current user should not have access to. Non-members see snippets of paid content. Banned users can search content they should be blocked from. This is a broken access control vulnerability (OWASP A01).

**Warning signs:**
- Search results showing content user cannot view when they click through
- Logged-out users seeing any results beyond public content (if any exists)
- Non-enrolled users seeing course/lesson content in search results

**Prevention:**
1. Apply access control filters in the search query itself, not just on result display
2. Use the same authorization logic for search that exists for direct content access
3. Filter search results server-side before returning to client
4. Never rely on client-side filtering to hide unauthorized content
5. Test search as different user roles: guest, member, banned, admin

**Implementation pattern:**
```typescript
// BAD: Filter after search (leaks data in response)
const results = await searchAll(query);
return results.filter(r => userCanAccess(r));

// GOOD: Filter in query (never returns unauthorized data)
const results = await prisma.post.findMany({
  where: {
    AND: [
      { search_vector: { search: query } },
      { author: { membership: { status: 'ACTIVE' } } }, // Only active members' posts
      // Or whatever access rules apply
    ]
  }
});
```

**Phase:** Search Results Page - Access control must be built into search queries from the start, not added later.

**Sources:**
- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Access Control Vulnerabilities - PortSwigger](https://portswigger.net/web-security/access-control)

---

### Pitfall 3: Prisma Full-Text Search Not Using Indexes

**Problem:**
Prisma's built-in PostgreSQL full-text search (Preview feature) does not use GIN indexes effectively. Queries that should be fast become slow table scans. The documentation even acknowledges this limitation with a note about using raw SQL for performance.

**Warning signs:**
- Search queries take >100ms even with indexes defined
- `EXPLAIN ANALYZE` shows "Seq Scan" instead of "Index Scan"
- Performance degrades linearly with table size
- Prisma migrations removing or altering your custom GIN indexes

**Prevention:**
1. Use `prisma.$queryRaw` for search queries that need index performance
2. Create tsvector columns with triggers or generated columns outside of Prisma migrations
3. Mark tsvector columns as `Unsupported("tsvector")` in schema to prevent Prisma from touching them
4. Maintain GIN indexes via raw SQL migrations, not Prisma schema
5. Test with realistic data volumes (1000+ posts) during development

**Example pattern:**
```typescript
// Use raw SQL to leverage GIN index
const results = await prisma.$queryRaw`
  SELECT id, content, ts_rank(search_vector, query) as rank
  FROM "Post", to_tsquery('english', ${searchTerm}) query
  WHERE search_vector @@ query
  ORDER BY rank DESC
  LIMIT 20
`;
```

**Phase:** Search Infrastructure - Must use raw SQL approach from the beginning, not migrate to it later.

**Sources:**
- [Prisma Full-Text Search Docs](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search)
- [Prisma GitHub Issue #8950 - Index not used](https://github.com/prisma/prisma/issues/8950)
- [PostgreSQL FTS Index Types](https://www.postgresql.org/docs/current/textsearch-indexes.html)

---

### Pitfall 4: On-the-Fly tsvector Calculation Killing Performance

**Problem:**
Calling `to_tsvector('english', content)` in the WHERE clause forces PostgreSQL to calculate the tsvector for every row on every search. Even with a GIN index defined, it won't be used because the expression doesn't match. Searches that should take 5ms take 5+ seconds.

**Warning signs:**
- Search performance ~50x slower than expected
- GIN index exists but `EXPLAIN` shows it's not being used
- CPU spikes during search queries
- Search times scale linearly with table size

**Prevention:**
1. Store tsvector in a dedicated column, either as a generated column or trigger-maintained
2. Create GIN index on the stored tsvector column, not on an expression
3. Ensure the search query references the stored column exactly as indexed
4. Use `GENERATED ALWAYS AS` for columns that should auto-update, or triggers for complex cases
5. Consider setting `fastupdate = off` on GIN index for more consistent query times

**Correct approach:**
```sql
-- Add stored tsvector column
ALTER TABLE "Post" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(extract_tiptap_text(content), ''))
  ) STORED;

-- Create GIN index on stored column
CREATE INDEX post_search_idx ON "Post" USING gin(search_vector);

-- Query matches the indexed column exactly
SELECT * FROM "Post"
WHERE search_vector @@ to_tsquery('english', 'search terms');
```

**Phase:** Search Infrastructure - Database schema must include tsvector columns from the start.

**Sources:**
- [PostgreSQL FTS Tables and Indexes](https://www.postgresql.org/docs/current/textsearch-tables.html)
- [Optimizing PostgreSQL Full-Text Search](https://leapcell.io/blog/optimizing-postgresql-full-text-search-performance)
- [PostgreSQL BM25 Performance Tips](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth)

---

## Performance Pitfalls

Search-specific performance issues that emerge as data grows.

### Pitfall 5: No Debouncing on Search Input

**Problem:**
Each keystroke triggers a search API call. A user typing "community platform" sends 18 requests in rapid succession. This overwhelms the server, wastes bandwidth, and creates race conditions where results for "communi" overwrite results for "community platform".

**Warning signs:**
- Network tab showing many canceled/overlapping search requests
- Results flickering as user types
- API rate limits being hit
- Server load spikes during active searching

**Prevention:**
1. Debounce search input with 200-300ms delay
2. Cancel in-flight requests when new search starts (AbortController)
3. Set minimum query length (3+ characters) before searching
4. Use React Query or similar with proper debouncing built in
5. Show loading state during debounce period, not on every keystroke

**Implementation:**
```typescript
// Use debounced value with minimum length
const debouncedQuery = useDebounce(query, 300);
const { data, isLoading } = useQuery({
  queryKey: ['search', debouncedQuery],
  queryFn: () => searchAPI(debouncedQuery),
  enabled: debouncedQuery.length >= 3,
});
```

**Phase:** Search UI Component - Implement debouncing from the first search input component.

**Sources:**
- [Debouncing in React - freeCodeCamp](https://www.freecodecamp.org/news/deboucing-in-react-autocomplete-example/)
- [How to Debounce User Search Input - Bugcrowd](https://bugcrowd.engineering/blogs/debouncing-user-search-input-properly-in-react)
- [Autocomplete System Design](https://www.greatfrontend.com/questions/system-design/autocomplete)

---

### Pitfall 6: ts_rank on Large Result Sets

**Problem:**
PostgreSQL's `ts_rank` function must access and score every matching row before sorting. A broad query matching 10,000 posts requires scoring all 10,000 rows, even if you only want 10 results. This causes timeouts on popular search terms.

**Warning signs:**
- Common/broad searches much slower than specific searches
- `EXPLAIN ANALYZE` showing large row counts before LIMIT
- Query times of 80ms+ for generic terms, 5ms for specific terms
- Timeout errors on searches like "the" or common words

**Prevention:**
1. Apply additional filters (category, date range) to reduce result set before ranking
2. Use LIMIT with materialized CTE for large result sets
3. Consider two-phase search: fast filter first, then rank top N candidates
4. Add stop words to text search configuration to filter common terms
5. Set query timeout at database level to prevent runaway queries

**Pattern:**
```sql
-- Two-phase approach: filter then rank
WITH candidates AS (
  SELECT id, search_vector
  FROM "Post"
  WHERE search_vector @@ to_tsquery('english', 'search terms')
  LIMIT 1000  -- Cap candidates
)
SELECT p.*, ts_rank(c.search_vector, to_tsquery('english', 'search terms')) as rank
FROM candidates c
JOIN "Post" p ON p.id = c.id
ORDER BY rank DESC
LIMIT 20;
```

**Phase:** Search API - Design for this from the start; hard to retrofit.

**Sources:**
- [Crunchy Data - Postgres Full-Text Search](https://www.crunchydata.com/blog/postgres-full-text-search-a-search-engine-in-a-database)
- [Meilisearch - Postgres FTS Limitations](https://www.meilisearch.com/blog/postgres-full-text-search-limitations)

---

### Pitfall 7: Indexing All Content Types Identically

**Problem:**
Posts, members, and courses have different search relevance needs. A member's name should weight higher than their bio. A course title matters more than lesson content. Treating all text fields equally produces poor relevance ranking.

**Warning signs:**
- Member search returns members where query only appears in bio, not name
- Course search returns lessons instead of courses with matching titles
- Users complaining "I can't find X" when X clearly exists

**Prevention:**
1. Use PostgreSQL's setweight() to assign weights: A (highest) through D (lowest)
2. Weight titles/names as 'A', descriptions as 'B', content as 'C'
3. Create separate tsvector columns for different content types with appropriate weighting
4. Test search relevance with real queries users would make

**Example:**
```sql
-- Weighted tsvector for Post
setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
setweight(to_tsvector('english', coalesce(excerpt, '')), 'B') ||
setweight(to_tsvector('english', coalesce(body_text, '')), 'C')

-- Weighted tsvector for User
setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
setweight(to_tsvector('english', coalesce(bio, '')), 'C')
```

**Phase:** Search Infrastructure - Design weight strategy when creating tsvector columns.

**Sources:**
- [PostgreSQL FTS Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)
- [Optimizations with Full-Text Search](https://www.alibabacloud.com/blog/optimizations-with-full-text-search-in-postgresql_595339)

---

## Security Pitfalls

Access control and data exposure risks specific to search.

### Pitfall 8: Search Results Leaking Content Snippets

**Problem:**
Even when access control prevents clicking through to full content, the search result snippets themselves may contain sensitive information. A non-member searching for "strategy" sees snippets from paid course content describing business strategies.

**Warning signs:**
- Search results showing meaningful content excerpts for restricted content
- Users able to piece together information from multiple snippet searches
- Screenshots of search results being shared outside community

**Prevention:**
1. Don't include snippets for content user cannot access - show title only
2. Generate snippets server-side with access control, not client-side
3. Consider showing restricted content in results but with "[Member-only content]" placeholder
4. Never expose more in snippet than user could see on the actual page
5. Audit what information leaks through search result metadata (author, date, category)

**Pattern:**
```typescript
// Generate snippet only for accessible content
const getSearchResult = (result, user) => ({
  id: result.id,
  title: result.title,
  type: result.type,
  // Only include snippet if user has access
  snippet: canAccess(result, user) ? generateSnippet(result.content) : null,
  url: result.url,
});
```

**Phase:** Search Results Page - Implement snippet generation with access control.

**Sources:**
- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)

---

### Pitfall 9: Search Query Injection

**Problem:**
User search input passed directly to `to_tsquery()` can cause SQL errors or unexpected behavior. Certain characters like `:`, `&`, `|`, `!` have special meaning in tsquery syntax. A search for "C++ programming" fails because `++` is invalid tsquery syntax.

**Warning signs:**
- Searches with special characters returning errors
- Certain common searches failing unexpectedly
- Error logs showing tsquery syntax errors
- Searches with `:*` prefix doing wildcard when not intended

**Prevention:**
1. Use `websearch_to_tsquery()` (PostgreSQL 11+) which handles natural language input
2. Or use `plainto_tsquery()` which ignores tsquery operators
3. Never pass user input directly to `to_tsquery()` without sanitization
4. Parameterize all search queries to prevent SQL injection

**Safe approach:**
```sql
-- websearch_to_tsquery handles natural language safely
SELECT * FROM "Post"
WHERE search_vector @@ websearch_to_tsquery('english', $1);

-- Handles: "C++ programming", "cats & dogs", "error: 404"
```

**Phase:** Search API - Use safe query function from the first implementation.

**Sources:**
- [PostgreSQL Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html)

---

## UX Pitfalls

Common search user experience mistakes.

### Pitfall 10: No Results Without Guidance

**Problem:**
Search returns "No results found" with no help for the user. They're left wondering if they spelled something wrong, used wrong terms, or if the content simply doesn't exist. They give up rather than try alternative searches.

**Warning signs:**
- High bounce rate on search results page
- Users asking "where is X" for content that exists
- Support requests about "broken search"
- Low engagement with search feature

**Prevention:**
1. Show "Did you mean...?" suggestions for potential typos
2. Suggest related searches or popular searches in the community
3. Show categories/filters that might help narrow down
4. For empty results, show recent/popular content as fallback
5. Explain what was searched: "No posts matching 'strategry' - try 'strategy'?"

**Phase:** Search Results Page - Build empty state handling into initial design.

**Sources:**
- [Search UX Best Practices - Design Monks](https://www.designmonks.co/blog/search-ux-best-practices)
- [Fixing Poor Site Search - Be Wonderful](https://www.bewonderful.co.uk/insight/fixing-poor-site-search-for-better-ux/)

---

### Pitfall 11: Hidden or Unclear Search Interface

**Problem:**
Search is hidden behind an icon, placed in an unexpected location, or the input field is too small. Users don't realize search exists or can't figure out how to use it effectively.

**Warning signs:**
- Low search usage despite content volume
- Users scrolling through feeds instead of searching
- Search queries that are incomplete because input felt cramped
- Users asking "is there a search feature?"

**Prevention:**
1. Make search box visible and contrasting in the header
2. Use an input field, not just a search icon (icon can reveal field)
3. Make input wide enough for typical queries (27+ characters)
4. Show placeholder text indicating what can be searched: "Search posts, members, courses..."
5. Use Cmd/Ctrl+K keyboard shortcut for power users

**Phase:** Search UI Component - Design search prominence in initial UI.

**Sources:**
- [Mobile Search UX & Design - Evinent](https://evinent.com/blog/mobile-search-ux-ui)
- [Best UX Practices for Search Interface - Qubstudio](https://qubstudio.com/blog/best-ux-practices-for-search-interface/)

---

### Pitfall 12: No Typo Tolerance

**Problem:**
Users frequently misspell search terms. Searching for "comunity" returns nothing even though "community" has thousands of results. Users assume the content doesn't exist rather than that they made a typo.

**Warning signs:**
- Search logs showing many zero-result queries that are near-matches
- Same content searched with different spellings
- User frustration reports about "search not working"

**Prevention:**
1. Use `pg_trgm` extension for fuzzy matching as fallback
2. Implement "Did you mean...?" suggestions based on edit distance
3. Show partial matches when exact matches fail
4. Log zero-result queries to identify common misspellings
5. Consider adding common misspellings to a synonyms dictionary

**PostgreSQL approach:**
```sql
-- Enable trigram extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Use similarity for fuzzy matching fallback
SELECT * FROM "Post"
WHERE similarity(title, 'comunity') > 0.3
ORDER BY similarity(title, 'comunity') DESC
LIMIT 10;
```

**Phase:** Search Enhancements - Can be added after basic search works, but plan for it.

**Sources:**
- [Search Relevance Guide - Meilisearch](https://www.meilisearch.com/blog/search-relevance)
- [Search Relevance - Elastic](https://www.elastic.co/what-is/search-relevance)

---

## Data Synchronization Pitfalls

Issues with keeping search data in sync with source data.

### Pitfall 13: Search Index Out of Sync with Content

**Problem:**
Content is updated but search index still shows old version. Posts are deleted but still appear in search. New posts aren't searchable until some background job runs. Users lose trust in search accuracy.

**Warning signs:**
- Searching finds content that was deleted
- Edits to posts not reflected in search results
- New posts don't appear in search for minutes/hours
- Search results showing stale titles/excerpts

**Prevention:**
1. Use PostgreSQL generated columns (auto-update on any row change)
2. Or use triggers that fire AFTER INSERT/UPDATE/DELETE
3. Avoid background jobs for index updates - too much lag
4. Test the full lifecycle: create, search, edit, search, delete, search
5. If using separate search service (Elasticsearch), implement proper sync

**With generated columns (preferred):**
```sql
-- Generated column auto-updates when content changes
ALTER TABLE "Post" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', extract_tiptap_text(content))
  ) STORED;
-- No sync needed - it's automatic!
```

**With triggers (for complex cases):**
```sql
CREATE TRIGGER post_search_update
  BEFORE INSERT OR UPDATE ON "Post"
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', title, body);
```

**Phase:** Search Infrastructure - Use generated columns or triggers from day one.

**Sources:**
- [PostgreSQL FTS Additional Features](https://www.postgresql.org/docs/current/textsearch-features.html)
- [Thoughtbot - Optimizing FTS with tsvector Triggers](https://thoughtbot.com/blog/optimizing-full-text-search-with-postgres-tsvector-columns-and-triggers)

---

### Pitfall 14: Prisma Migrations Destroying Custom Indexes

**Problem:**
Prisma schema migrations don't understand tsvector columns or GIN indexes. Running `prisma migrate dev` drops your custom indexes or tries to alter generated columns, causing migration errors or lost functionality.

**Warning signs:**
- GIN indexes disappearing after migrations
- "Column search_vector cannot be cast" errors
- Migration drift warnings about unsupported column types
- Search suddenly stops working after schema changes

**Prevention:**
1. Mark tsvector columns as `Unsupported("tsvector")` in Prisma schema
2. Create and manage search indexes in separate SQL migration files
3. Use `prisma migrate diff` to catch unintended changes
4. Add post-migration scripts to recreate indexes if needed
5. Document all manual SQL migrations for search infrastructure

**Prisma schema approach:**
```prisma
model Post {
  id           String @id @default(cuid())
  content      Json
  // Mark as unsupported so Prisma doesn't touch it
  search_vector Unsupported("tsvector")?

  @@index([search_vector], type: Gin)
}
```

**Phase:** Search Infrastructure - Plan for Prisma limitations in initial architecture.

**Sources:**
- [Prisma FTS with PostgreSQL tsvector](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3)
- [Prisma GitHub Discussion #12276](https://github.com/prisma/prisma/discussions/12276)

---

## Pitfall-to-Phase Mapping

How each search phase should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Tiptap JSON text extraction | Search Infrastructure | Search finds content by its actual text |
| Access control in search | Search Results | Non-member can't see member content in results |
| Prisma index usage | Search Infrastructure | EXPLAIN shows Index Scan, not Seq Scan |
| tsvector stored columns | Search Infrastructure | Queries under 20ms with 1000+ posts |
| Input debouncing | Search UI | Network tab shows single request per search |
| ts_rank performance | Search API | Broad searches complete in <200ms |
| Content type weighting | Search Infrastructure | Names rank higher than bios |
| Snippet access control | Search Results | Restricted content shows no snippet |
| Query injection safety | Search API | Special characters don't cause errors |
| Empty state guidance | Search Results | Zero-results page offers alternatives |
| Search visibility | Search UI | User testing confirms discoverability |
| Typo tolerance | Search Enhancements | Misspelled queries return relevant results |
| Index synchronization | Search Infrastructure | Edits/deletes reflected immediately |
| Prisma migration conflicts | Search Infrastructure | Migrations don't drop search columns |

---

## "Search Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Access control:** Search tested as non-member, banned user, logged-out user
- [ ] **Tiptap content:** Search finds text inside rich content, not JSON artifacts
- [ ] **Performance:** Tested with 1000+ posts, queries under 100ms
- [ ] **Special characters:** Searches like "C++", "Q&A", "email@example.com" work
- [ ] **Empty state:** Zero results shows helpful guidance, not dead end
- [ ] **Mobile:** Search works on mobile, keyboard doesn't cover results
- [ ] **Keyboard nav:** Can navigate results with arrow keys, enter to select
- [ ] **Recent searches:** History persists across sessions (localStorage)
- [ ] **Result highlighting:** Query terms highlighted in results
- [ ] **URL state:** Search query in URL for shareability/bookmarking

---

## Sources

### PostgreSQL Full-Text Search
- [PostgreSQL FTS Documentation](https://www.postgresql.org/docs/current/textsearch.html)
- [PostgreSQL FTS Tables and Indexes](https://www.postgresql.org/docs/current/textsearch-tables.html)
- [PostgreSQL FTS Index Types](https://www.postgresql.org/docs/current/textsearch-indexes.html)
- [Crunchy Data - Postgres FTS Guide](https://www.crunchydata.com/blog/postgres-full-text-search-a-search-engine-in-a-database)
- [Meilisearch - Postgres FTS Limitations](https://www.meilisearch.com/blog/postgres-full-text-search-limitations)

### Prisma Integration
- [Prisma Full-Text Search Docs](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search)
- [Prisma GitHub Issue #8950](https://github.com/prisma/prisma/issues/8950)
- [Bulletproof FTS in Prisma](https://medium.com/@chauhananubhav16/bulletproof-full-text-search-fts-in-prisma-with-postgresql-tsvector-without-migration-drift-c421f63aaab3)

### Rich Text Search
- [Full Rich Text Search with Slate and PostgreSQL 12](https://bonaroo.nl/2020/02/01/rich-text-search-with-slate-and-postgresql.html)
- [Tiptap JSON to Plain Text Discussion](https://github.com/ueberdosis/tiptap/discussions/3114)

### Security
- [OWASP Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/)
- [Access Control Vulnerabilities - PortSwigger](https://portswigger.net/web-security/access-control)

### UX Best Practices
- [Search UX Best Practices - Design Monks](https://www.designmonks.co/blog/search-ux-best-practices)
- [Best UX Practices for Search Interface - Qubstudio](https://qubstudio.com/blog/best-ux-practices-for-search-interface/)
- [Fixing Poor Site Search - Be Wonderful](https://www.bewonderful.co.uk/insight/fixing-poor-site-search-for-better-ux/)

### Performance
- [Debouncing in React - freeCodeCamp](https://www.freecodecamp.org/news/deboucing-in-react-autocomplete-example/)
- [Autocomplete System Design - GreatFrontend](https://www.greatfrontend.com/questions/system-design/autocomplete)
- [Search Relevance Guide - Elastic](https://www.elastic.co/what-is/search-relevance)

---
*Pitfalls research for: Global Search (v1.1 milestone)*
*Researched: 2026-01-23*
