import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { PostCard } from '@/components/feed/post-card';
import { DeletePostButton } from '@/components/feed/delete-post-button';
import { CommentList } from '@/components/feed/comment-list';

interface PostDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { id } = await params;

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, image: true, level: true, role: true },
      },
      _count: {
        select: { comments: true },
      },
    },
  });

  if (!post) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const isAuthor = currentUserId === post.authorId;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href="/feed"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Feed
      </Link>

      {/* Post card */}
      <PostCard post={post} />

      {/* Author actions */}
      {isAuthor && (
        <div className="flex gap-4 pt-4 border-t">
          <Link
            href={`/feed/${id}/edit`}
            className="text-sm text-blue-600 hover:underline"
          >
            Edit Post
          </Link>
          <DeletePostButton postId={id} />
        </div>
      )}

      {/* Comments section */}
      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold mb-4">
          Comments{post._count.comments > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">
              ({post._count.comments})
            </span>
          )}
        </h2>
        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading comments...</div>}>
          <CommentList
            postId={post.id}
            postAuthorId={post.authorId}
            currentUserId={currentUserId}
          />
        </Suspense>
      </div>
    </div>
  );
}
