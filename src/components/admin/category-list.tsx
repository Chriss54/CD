'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { deleteCategory } from '@/lib/category-actions';

interface Category {
  id: string;
  name: string;
  color: string;
  _count?: {
    posts: number;
  };
}

interface CategoryListProps {
  categories: Category[];
}

export function CategoryList({ categories }: CategoryListProps) {
  const router = useRouter();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleDelete = (categoryId: string) => {
    startTransition(async () => {
      setError(null);
      const result = await deleteCategory(categoryId);

      if ('error' in result) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to delete category');
        setConfirmingId(null);
        return;
      }

      setConfirmingId(null);
      router.refresh();
    });
  };

  if (categories.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-8">
        No categories yet. Create your first category above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 mb-4">{error}</p>
      )}

      {categories.map((category) => (
        <div
          key={category.id}
          className="flex items-center justify-between p-3 border rounded-lg"
        >
          {/* Color swatch and name */}
          <div className="flex items-center gap-3">
            <div
              className="w-6 h-6 rounded-md border"
              style={{ backgroundColor: category.color }}
              aria-label={`Color: ${category.color}`}
            />
            <span className="font-medium">{category.name}</span>
            {category._count && (
              <span className="text-sm text-muted-foreground">
                ({category._count.posts} {category._count.posts === 1 ? 'post' : 'posts'})
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {confirmingId === category.id ? (
              <>
                <span className="text-sm text-muted-foreground mr-2">
                  Are you sure? Posts will become uncategorized.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingId(null)}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  disabled={isPending}
                >
                  {isPending ? 'Deleting...' : 'Confirm'}
                </Button>
              </>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmingId(category.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
