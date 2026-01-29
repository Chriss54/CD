'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export interface SearchResult {
  id: string;
  type: 'post' | 'user' | 'course';
  title: string;
  snippet: string;
  rank: number;
}

export async function search(query: string): Promise<{ results: SearchResult[]; duration: number } | { error: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Empty query returns empty results
  if (!query.trim()) {
    return { results: [], duration: 0 };
  }

  const startTime = performance.now();

  try {
    const results = await db.$queryRaw<SearchResult[]>`
      SELECT id, 'post' as type,
             COALESCE(LEFT("plainText", 100), '') as title,
             ts_headline('english', COALESCE("plainText", ''), websearch_to_tsquery('english', ${query}),
               'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
             ts_rank("searchVector", websearch_to_tsquery('english', ${query})) as rank
      FROM "Post"
      WHERE "searchVector" @@ websearch_to_tsquery('english', ${query})

      UNION ALL

      SELECT id, 'user' as type,
             COALESCE(name, 'Unknown') as title,
             ts_headline('english', COALESCE(name, '') || ' ' || COALESCE(bio, ''),
               websearch_to_tsquery('english', ${query}),
               'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
             ts_rank("searchVector", websearch_to_tsquery('english', ${query})) as rank
      FROM "User"
      WHERE "searchVector" @@ websearch_to_tsquery('english', ${query})

      UNION ALL

      SELECT id, 'course' as type,
             COALESCE(title, 'Untitled') as title,
             ts_headline('english', COALESCE(title, '') || ' ' || COALESCE(description, ''),
               websearch_to_tsquery('english', ${query}),
               'MaxWords=30, MinWords=15, StartSel=<mark>, StopSel=</mark>') as snippet,
             ts_rank("searchVector", websearch_to_tsquery('english', ${query})) as rank
      FROM "Course"
      WHERE "searchVector" @@ websearch_to_tsquery('english', ${query})
        AND status = 'PUBLISHED'

      ORDER BY rank DESC
      LIMIT 50
    `;

    const duration = Math.round(performance.now() - startTime);

    return { results, duration };
  } catch (error) {
    console.error('Search error:', error);
    return { error: 'Search failed' };
  }
}
