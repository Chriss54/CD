import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { PostCard } from '@/components/feed/post-card';
import { Pagination } from '@/components/ui/pagination';
import { CategoriesSidebar } from '@/components/feed/categories-sidebar';
import { RightSidebar } from '@/components/feed/right-sidebar';
import { CreatePostModal } from '@/components/feed/create-post-modal';

const POSTS_PER_PAGE = 10;

interface FeedPageProps {
  searchParams: Promise<{ page?: string; category?: string }>;
}

async function FeedContent({ searchParams }: FeedPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const category = params.category || null;
  const skip = (page - 1) * POSTS_PER_PAGE;

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;

  // Build where clause for category filter
  const whereClause = category ? { categoryId: category } : {};

  const [posts, total, categories] = await Promise.all([
    db.post.findMany({
      where: whereClause,
      skip,
      take: POSTS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, image: true, level: true, role: true },
        },
        category: {
          select: { id: true, name: true, color: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
        ...(currentUserId
          ? {
            likes: {
              where: { userId: currentUserId },
              take: 1,
            },
          }
          : {}),
      },
    }),
    db.post.count({ where: whereClause }),
    db.category.findMany({
      orderBy: { name: 'asc' },
    }),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  // Transform posts to add isLiked boolean
  const postsWithLikeStatus = posts.map((post) => ({
    ...post,
    isLiked: 'likes' in post && Array.isArray(post.likes) && post.likes.length > 0,
    likeCount: post._count.likes,
    commentCount: post._count.comments,
  }));

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      {/* Left sidebar - Categories */}
      <CategoriesSidebar categories={categories} activeCategory={category} />

      {/* Center - Posts feed */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Create post trigger */}
        <CreatePostModal
          categories={categories}
          userImage={session?.user?.image}
          userName={session?.user?.name}
        />

        {/* Posts list */}
        {postsWithLikeStatus.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-gray-500 shadow-sm border border-gray-100">
            <p>Noch keine Posts. Sei der Erste, der etwas teilt!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {postsWithLikeStatus.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                showActions
                currentUserId={currentUserId}
                likeCount={post.likeCount}
                commentCount={post.commentCount}
                isLiked={post.isLiked}
                category={post.category}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination currentPage={page} totalPages={totalPages} />
          </div>
        )}
      </div>

      {/* Right sidebar - Members & Leaderboard */}
      <RightSidebar />
    </div>
  );
}

export default function FeedPage(props: FeedPageProps) {
  return (
    <Suspense fallback={
      <div className="flex gap-6 max-w-7xl mx-auto">
        <div className="w-64 shrink-0">
          <div className="bg-white rounded-xl p-5 animate-pulse h-48" />
        </div>
        <div className="flex-1">
          <div className="bg-white rounded-xl p-12 animate-pulse h-32" />
        </div>
        <div className="w-72 shrink-0 space-y-4">
          <div className="bg-white rounded-xl p-5 animate-pulse h-24" />
          <div className="bg-white rounded-xl p-5 animate-pulse h-48" />
        </div>
      </div>
    }>
      <FeedContent {...props} />
    </Suspense>
  );
}

