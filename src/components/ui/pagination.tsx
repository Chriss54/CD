'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createPageURL = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const isFirstPage = currentPage <= 1;
  const isLastPage = currentPage >= totalPages;

  return (
    <div className="flex items-center justify-center gap-4">
      {isFirstPage ? (
        <Button variant="outline" disabled>
          Previous
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <Link href={createPageURL(currentPage - 1)}>Previous</Link>
        </Button>
      )}

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      {isLastPage ? (
        <Button variant="outline" disabled>
          Next
        </Button>
      ) : (
        <Button variant="outline" asChild>
          <Link href={createPageURL(currentPage + 1)}>Next</Link>
        </Button>
      )}
    </div>
  );
}
