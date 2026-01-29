import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null;
}

export function CategoryTabs({ categories, activeCategory }: CategoryTabsProps) {
  // Hide tabs when no categories exist
  if (categories.length === 0) {
    return null;
  }

  const isAllActive = activeCategory === null;

  return (
    <nav
      className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
      aria-label="Category filters"
    >
      {/* All tab */}
      <Link
        href="/feed"
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
          isAllActive
            ? 'bg-primary text-white'
            : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        }`}
      >
        All
      </Link>

      {/* Category tabs */}
      {categories.map((category) => {
        const isActive = activeCategory === category.id;

        return (
          <Link
            key={category.id}
            href={`/feed?category=${category.id}`}
            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            }`}
            style={
              isActive
                ? { backgroundColor: category.color }
                : undefined
            }
          >
            {category.name}
          </Link>
        );
      })}
    </nav>
  );
}
