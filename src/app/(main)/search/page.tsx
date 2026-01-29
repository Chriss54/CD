import { Suspense } from 'react';
import { search } from '@/lib/search-actions';
import { SearchTabs } from '@/components/search/search-tabs';
import { SearchResultCard } from '@/components/search/search-result-card';
import { EmptyState } from '@/components/ui/empty-state';

interface SearchPageProps {
  searchParams: Promise<{ q?: string; type?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const query = params.q || '';
  const typeFilter = params.type as 'post' | 'user' | 'course' | undefined;

  // Empty query state
  if (!query) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <div className="text-center py-12 text-muted-foreground">
          Enter a search term to find posts, members, and courses.
        </div>
      </div>
    );
  }

  const result = await search(query);

  // Error state
  if ('error' in result) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Search</h1>
        <EmptyState title="Search failed" description={result.error} />
      </div>
    );
  }

  const { results } = result;

  // Calculate counts per type
  const counts = {
    all: results.length,
    post: results.filter((r) => r.type === 'post').length,
    user: results.filter((r) => r.type === 'user').length,
    course: results.filter((r) => r.type === 'course').length,
  };

  // Filter results by type if type param is present
  const filteredResults = typeFilter
    ? results.filter((r) => r.type === typeFilter)
    : results;

  // Determine empty state message
  const getEmptyMessage = () => {
    if (typeFilter) {
      const typeLabel =
        typeFilter === 'post'
          ? 'posts'
          : typeFilter === 'user'
            ? 'members'
            : 'courses';
      return `No ${typeLabel} found`;
    }
    return `No results for "${query}". Try different keywords or check spelling.`;
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Search</h1>

      {/* Type filter tabs */}
      <Suspense fallback={<div className="h-10 bg-muted rounded-lg animate-pulse" />}>
        <SearchTabs counts={counts} />
      </Suspense>

      {/* Results */}
      <div className="mt-6 space-y-3">
        {filteredResults.length === 0 ? (
          <EmptyState
            title={typeFilter ? getEmptyMessage() : 'No results'}
            description={!typeFilter ? getEmptyMessage() : undefined}
          />
        ) : (
          filteredResults.map((r) => <SearchResultCard key={`${r.type}-${r.id}`} result={r} />)
        )}
      </div>
    </div>
  );
}
