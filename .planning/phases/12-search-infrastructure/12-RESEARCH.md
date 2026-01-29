# Phase 12: Search Infrastructure - Research

**Researched:** 2026-01-23
**Domain:** PostgreSQL Full-Text Search with Prisma ORM
**Confidence:** HIGH

## Summary

PostgreSQL Full-Text Search (FTS) is the established solution for this phase, as mandated by the v1.1 decisions (no external search services, use built-in Supabase/PostgreSQL capabilities). The approach uses `tsvector` columns with GIN indexes for sub-100ms query performance.

The key challenge is Prisma's limited FTS support: the preview feature doesn't use indexes properly and has known performance issues. The solution is using `$queryRaw` for all FTS queries while letting Prisma handle schema migrations (with manual SQL additions for generated columns and GIN indexes).

For Tiptap JSON to plain text extraction, use `generateText()` from `@tiptap/core` which works server-side. This extracted text populates the search vector during post creation/update.

**Primary recommendation:** Use GENERATED ALWAYS AS stored columns for tsvector with GIN indexes, query via `$queryRaw` with `websearch_to_tsquery()` and `ts_rank()`, extract Tiptap JSON to plain text server-side with `generateText()`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| PostgreSQL FTS | 15+ | Full-text search engine | Built into Supabase, no external dependency |
| Prisma | 7.3.0 | ORM with raw query support | Already in codebase, `$queryRaw` for FTS |
| @tiptap/core | 3.17.0 | Text extraction from JSON | `generateText()` for server-side extraction |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @tiptap/starter-kit | 3.17.0 | Extensions for generateText | Required to parse Tiptap document structure |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| PostgreSQL FTS | Algolia/Meilisearch | Faster/better relevance but external service, cost, complexity |
| GENERATED column | Trigger-based updates | Triggers are more complex, GENERATED is declarative |
| websearch_to_tsquery | plainto_tsquery | plainto_tsquery doesn't support OR/NOT operators, websearch is more user-friendly |

**Installation:**
```bash
# Already installed - no new packages needed
# @tiptap/core and @tiptap/starter-kit already in package.json
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── search-actions.ts     # Server actions for search queries
│   └── tiptap-utils.ts       # Tiptap JSON to plain text extraction
prisma/
├── schema.prisma             # Add Unsupported tsvector columns
└── migrations/
    └── XXXXXX_add_search_vectors/
        └── migration.sql     # Manual GIN index and GENERATED column
```

### Pattern 1: Stored Generated tsvector Column
**What:** PostgreSQL GENERATED ALWAYS AS column that auto-updates when source columns change
**When to use:** When you need the tsvector to stay in sync with source data automatically
**Example:**
```sql
-- Source: PostgreSQL 18 Documentation - textsearch-tables
ALTER TABLE "Post" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(plain_text, '')), 'B')
  ) STORED;

CREATE INDEX post_search_idx ON "Post" USING GIN (search_vector);
```

### Pattern 2: Multi-field Weighted Search (User/Course)
**What:** Combine title and content with different weights for ranking
**When to use:** For User (name + bio) and Course (title + description)
**Example:**
```sql
-- Source: PostgreSQL 18 Documentation - textsearch-controls
ALTER TABLE "User" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(bio, '')), 'B')
  ) STORED;

CREATE INDEX user_search_idx ON "User" USING GIN (search_vector);
```

### Pattern 3: Raw Query with ts_rank
**What:** Use Prisma $queryRaw for FTS queries with ranking
**When to use:** All FTS queries (Prisma ORM doesn't use indexes for FTS)
**Example:**
```typescript
// Source: Prisma docs + PostgreSQL FTS documentation
const results = await prisma.$queryRaw`
  SELECT id, title,
         ts_rank(search_vector, websearch_to_tsquery('english', ${query})) AS rank
  FROM "Course"
  WHERE search_vector @@ websearch_to_tsquery('english', ${query})
  ORDER BY rank DESC
  LIMIT 20
`;
```

### Anti-Patterns to Avoid
- **Using Prisma's preview FTS feature:** Known performance issues, doesn't use indexes properly
- **Expression indexes without stored column:** Requires exact expression match in queries, error-prone
- **plainto_tsquery for user input:** Doesn't support OR operator, websearch_to_tsquery is more forgiving
- **SELECT * with tsvector:** Prisma can't deserialize tsvector type, select specific columns only

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Text search | LIKE/ILIKE queries | PostgreSQL FTS | LIKE doesn't use indexes well, no ranking, no stemming |
| JSON to text extraction | Manual recursive parser | `generateText()` from @tiptap/core | Handles all node types, block separators, edge cases |
| Search ranking | Custom scoring algorithm | `ts_rank()` / `ts_rank_cd()` | PostgreSQL's ranking considers frequency, position, proximity |
| Query parsing | Manual AND/OR parsing | `websearch_to_tsquery()` | Handles quotes, OR, NOT, never throws syntax errors |

**Key insight:** PostgreSQL's FTS is battle-tested at scale. The lexeme normalization, stemming, stop word removal, and ranking algorithms took years to develop. Don't replicate this logic.

## Common Pitfalls

### Pitfall 1: Prisma Migration Drift with tsvector
**What goes wrong:** Prisma drops custom columns/indexes on subsequent migrations
**Why it happens:** Prisma doesn't understand tsvector type, treats it as foreign
**How to avoid:**
1. Mark column as `Unsupported("tsvector")?` in schema.prisma
2. Add GENERATED column definition via manual migration SQL
3. Never let Prisma regenerate this migration
**Warning signs:** GIN index disappears after `prisma migrate dev`

### Pitfall 2: SELECT * Returns tsvector Deserialization Error
**What goes wrong:** `error deserializing column: cannot convert Postgres type tsvector`
**Why it happens:** Prisma doesn't have a tsvector type mapper
**How to avoid:** Always SELECT specific columns, never SELECT * when table has tsvector
**Warning signs:** Query works in psql but fails in app

### Pitfall 3: Forgetting to Extract Tiptap JSON
**What goes wrong:** Post search_vector is empty or null
**Why it happens:** GENERATED column can't parse JSON, needs plain text input
**How to avoid:** Add `plain_text` column populated by server action during create/update
**Warning signs:** Posts don't appear in search results

### Pitfall 4: Not Using 2-Argument to_tsvector in Indexes
**What goes wrong:** Index isn't used, full table scan occurs
**Why it happens:** Query must match exact expression including language config
**How to avoid:** Always use `to_tsvector('english', ...)` not `to_tsvector(...)`
**Warning signs:** EXPLAIN shows Seq Scan instead of Index Scan

### Pitfall 5: Slow Queries Despite GIN Index
**What goes wrong:** Queries take seconds, not milliseconds
**Why it happens:** Prisma's preview FTS feature or missing index usage
**How to avoid:** Use `$queryRaw` exclusively for FTS queries
**Warning signs:** Performance degradation as data grows

## Code Examples

Verified patterns from official sources:

### Extract Plain Text from Tiptap JSON (Server-Side)
```typescript
// Source: Tiptap GitHub PR #1875
import { generateText } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

export function extractPlainText(content: unknown): string {
  try {
    return generateText(
      content as Parameters<typeof generateText>[0],
      [StarterKit]
    );
  } catch {
    return '';
  }
}
```

### Prisma Schema with Unsupported tsvector
```prisma
// Source: Prisma docs on Unsupported types
model Post {
  id           String    @id @default(cuid())
  content      Json      // Tiptap JSON document
  plainText    String?   @db.Text  // Extracted for FTS
  searchVector Unsupported("tsvector")?

  @@index([searchVector], type: Gin)
}
```

### Migration SQL for GENERATED Column
```sql
-- Source: PostgreSQL 18 docs + Prisma community patterns
-- Run after Prisma migration creates the plainText column

ALTER TABLE "Post" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce("plainText", '')), 'B')
  ) STORED;

CREATE INDEX post_search_idx ON "Post" USING GIN (search_vector);
```

### Multi-Entity Search Query
```typescript
// Source: PostgreSQL FTS docs + Prisma $queryRaw
interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'course';
  title: string;
  snippet: string;
  rank: number;
}

export async function search(query: string): Promise<SearchResult[]> {
  const results = await prisma.$queryRaw<SearchResult[]>`
    SELECT id, 'post' as type,
           ts_headline('english', "plainText", websearch_to_tsquery('english', ${query}),
             'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
           ts_rank(search_vector, websearch_to_tsquery('english', ${query})) as rank
    FROM "Post"
    WHERE search_vector @@ websearch_to_tsquery('english', ${query})

    UNION ALL

    SELECT id, 'user' as type,
           ts_headline('english', coalesce(name, '') || ' ' || coalesce(bio, ''),
             websearch_to_tsquery('english', ${query}),
             'MaxWords=30, MinWords=15') as snippet,
           ts_rank(search_vector, websearch_to_tsquery('english', ${query})) as rank
    FROM "User"
    WHERE search_vector @@ websearch_to_tsquery('english', ${query})

    UNION ALL

    SELECT id, 'course' as type,
           ts_headline('english', coalesce(title, '') || ' ' || coalesce(description, ''),
             websearch_to_tsquery('english', ${query}),
             'MaxWords=30, MinWords=15') as snippet,
           ts_rank(search_vector, websearch_to_tsquery('english', ${query})) as rank
    FROM "Course"
    WHERE search_vector @@ websearch_to_tsquery('english', ${query})

    ORDER BY rank DESC
    LIMIT 50
  `;

  return results;
}
```

### Weighted Search Vector for Course (Title > Description)
```sql
-- Source: PostgreSQL 18 docs - textsearch-controls
ALTER TABLE "Course" ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX course_search_idx ON "Course" USING GIN (search_vector);
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LIKE '%term%' | to_tsvector + @@ | Always FTS | Orders of magnitude faster with index |
| to_tsquery (strict) | websearch_to_tsquery | PostgreSQL 11+ | User-friendly syntax, never throws errors |
| Trigger-based sync | GENERATED ALWAYS AS | PostgreSQL 12+ | Declarative, no trigger maintenance |
| Expression index | Stored column + GIN | PostgreSQL 12+ | Simpler queries, faster reads |

**Deprecated/outdated:**
- Prisma's `fullTextSearchPostgres` preview feature: Known to not use indexes, causes slow queries. Use `$queryRaw` instead.
- `plainto_tsquery`: Use `websearch_to_tsquery` for user input - supports more natural syntax.

## Open Questions

Things that couldn't be fully resolved:

1. **Existing Post Migration**
   - What we know: New posts will have plainText populated on create
   - What's unclear: Best strategy for backfilling existing posts
   - Recommendation: Run a one-time migration script to extract and populate plainText for all existing posts

2. **Event/Lesson Search**
   - What we know: Events and Lessons also have Tiptap content (description field)
   - What's unclear: Whether they should be searchable in v1.1
   - Recommendation: Out of scope for v1.1, but architecture supports adding later

3. **Performance at Scale**
   - What we know: GIN indexes are fast for typical queries, 100ms target achievable
   - What's unclear: Exact performance characteristics with 100k+ posts
   - Recommendation: Add timing measurement to search action, monitor in production

## Sources

### Primary (HIGH confidence)
- [PostgreSQL 18 Documentation - Tables and Indexes](https://www.postgresql.org/docs/current/textsearch-tables.html) - tsvector columns, GIN indexes
- [PostgreSQL 18 Documentation - Controlling Text Search](https://www.postgresql.org/docs/current/textsearch-controls.html) - setweight, ts_rank, websearch_to_tsquery
- [PostgreSQL 18 Documentation - Index Types](https://www.postgresql.org/docs/current/textsearch-indexes.html) - GIN vs GiST comparison
- [Prisma Documentation - Full Text Search](https://www.prisma.io/docs/orm/prisma-client/queries/full-text-search) - Preview status, $queryRaw usage
- [Tiptap GitHub PR #1875](https://github.com/ueberdosis/tiptap/pull/1875) - generateText implementation

### Secondary (MEDIUM confidence)
- [Prisma Discussion #12276](https://github.com/prisma/prisma/discussions/12276) - Index not used with FTS, $queryRaw workaround
- [PostgreSQL FTS with Prisma - svanstrom.nu](https://www.svanstrom.nu/2024/03/05/postgresql-full-text-search-with-prisma/) - Unsupported type pattern
- [PostgreSQL FTS with Prisma - pedroalonso.net](https://www.pedroalonso.net/blog/postgres-full-text-search/) - ts_rank, ts_headline examples
- [Tiptap GitHub Discussion #3114](https://github.com/ueberdosis/tiptap/discussions/3114) - generateText usage

### Tertiary (LOW confidence)
- Community patterns for GENERATED column with Prisma migration drift - multiple blog posts agree on approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - PostgreSQL FTS is well-documented, Prisma $queryRaw is stable
- Architecture: HIGH - GENERATED columns and GIN indexes are PostgreSQL best practices
- Pitfalls: HIGH - Documented in Prisma issues and PostgreSQL docs
- Tiptap extraction: MEDIUM - generateText exists but less documented than generateHTML

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable technology stack)
