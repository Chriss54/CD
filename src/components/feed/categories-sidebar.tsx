'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Category {
    id: string;
    name: string;
    color: string;
}

interface CategoriesSidebarProps {
    categories: Category[];
    activeCategory: string | null;
}

export function CategoriesSidebar({ categories, activeCategory }: CategoriesSidebarProps) {
    const searchParams = useSearchParams();

    // Build URL with category filter
    const buildCategoryUrl = (categoryId: string | null) => {
        const params = new URLSearchParams(searchParams.toString());
        if (categoryId) {
            params.set('category', categoryId);
        } else {
            params.delete('category');
        }
        params.delete('page'); // Reset to page 1 when changing category
        return `/feed?${params.toString()}`;
    };

    return (
        <aside className="w-64 shrink-0">
            <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Categories</h2>

                <nav className="space-y-1">
                    {/* All Posts */}
                    <Link
                        href={buildCategoryUrl(null)}
                        className={`
              block px-3 py-2 rounded-lg text-sm font-medium transition-colors
              ${!activeCategory
                                ? 'bg-gray-100 text-gray-900'
                                : 'text-gray-600 hover:bg-gray-50'
                            }
            `}
                    >
                        All Posts
                    </Link>

                    {/* Category list */}
                    {categories.map((category) => (
                        <Link
                            key={category.id}
                            href={buildCategoryUrl(category.id)}
                            className={`
                flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${activeCategory === category.id
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }
              `}
                        >
                            <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: category.color || '#6b7280' }}
                            />
                            <span>{category.name}</span>
                        </Link>
                    ))}
                </nav>
            </div>
        </aside>
    );
}
