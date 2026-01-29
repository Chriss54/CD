# Phase 5: Feed Engagement - Research

**Researched:** 2026-01-23
**Domain:** Comments, Likes, Categories (Social Engagement Features)
**Confidence:** HIGH

## Summary

Phase 5 implements user engagement features on the existing feed: flat comments (newest first), like/unlike toggle on posts and comments, and category-based filtering. The research focused on three key areas: (1) Prisma schema design for Comments, Likes, and Categories with proper relations and unique constraints, (2) optimistic UI patterns using React's `useOptimistic` hook for instant feedback, and (3) horizontal tab navigation for category filtering.

The technical approach builds directly on Phase 4 patterns: server actions with Zod validation, revalidatePath for cache invalidation, and client components only when hooks are needed. For likes, a compound unique constraint on (userId, postId) or (userId, commentId) enables idempotent toggle operations. Comments follow the existing inline confirmation pattern for deletion (no modals). Category tabs use URL search params for shareable filter state.

**Primary recommendation:** Use Prisma compound unique constraints for likes (@@unique([userId, postId])), implement optimistic updates with useOptimistic for instant like/unlike feedback, and use URL search params for category filtering to maintain shareability. Keep comments flat (no threading) per CONTEXT.md decisions.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | ^7.3.0 | ORM for Comment, Like, Category models | Already in project, compound unique support |
| React useOptimistic | 19.x | Optimistic UI for likes/comments | Built-in hook, handles race conditions |
| Zod | ^4.3.6 | Validation schemas for comments/categories | Already in project, consistent patterns |
| next/navigation | 16.x | URL search params for category filter | Server component compatible |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Relative timestamps for comments | Already in project |
| @radix-ui/react-slot | ^1.2.4 | Button composition | Already in project |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| useOptimistic | SWR mutate | SWR adds dependency, useOptimistic is built-in |
| URL params filter | Client state | URL params enable shareable links |
| Compound unique | Separate check | Database enforces constraint, prevents race conditions |

**Installation:**
```bash
# No new dependencies needed - all libraries already in project
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── validations/
│   │   ├── comment.ts       # Comment input validation
│   │   └── category.ts      # Category CRUD validation
│   ├── comment-actions.ts   # Server actions for comments
│   ├── like-actions.ts      # Server actions for likes
│   └── category-actions.ts  # Server actions for categories (admin)
├── app/
│   └── (main)/
│       ├── feed/
│       │   └── page.tsx     # Feed with category tabs
│       └── admin/
│           └── categories/
│               └── page.tsx # Category management
├── components/
│   ├── feed/
│   │   ├── post-card.tsx    # Updated with like button, comment count
│   │   ├── comment-list.tsx # Flat comments display
│   │   ├── comment-form.tsx # Add comment input
│   │   ├── comment-card.tsx # Individual comment with like
│   │   ├── like-button.tsx  # Reusable like toggle (posts + comments)
│   │   └── category-tabs.tsx # Horizontal filter tabs
│   └── ui/
│       └── empty-state.tsx  # Reusable empty state with illustration
└── types/
    ├── comment.ts           # Comment type definitions
    └── category.ts          # Category type definitions
```

### Pattern 1: Prisma Schema for Engagement Features
**What:** Comment, Like, and Category models with proper relations
**When to use:** Database schema for engagement features
**Example:**
```prisma
// prisma/schema.prisma

model Category {
  id        String   @id @default(cuid())
  name      String   @unique
  color     String   // Hex color for badge, e.g., "#6366f1"

  posts     Post[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id         String    @id @default(cuid())
  content    Json
  embeds     Json      @default("[]")
  authorId   String
  categoryId String?   // Required when creating, but nullable for migration

  author     User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  category   Category? @relation(fields: [categoryId], references: [id], onDelete: SetNull)
  comments   Comment[]
  likes      PostLike[]

  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@index([authorId])
  @@index([categoryId])
  @@index([createdAt(sort: Desc)])
}

model Comment {
  id        String   @id @default(cuid())
  content   String   @db.VarChar(2000) // Plain text, no Tiptap needed
  authorId  String
  postId    String

  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  likes     CommentLike[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([postId])
  @@index([authorId])
  @@index([createdAt(sort: Desc)])
}

model PostLike {
  id        String   @id @default(cuid())
  userId    String
  postId    String

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, postId]) // Prevents duplicate likes
  @@index([postId])
  @@index([userId])
}

model CommentLike {
  id        String   @id @default(cuid())
  userId    String
  commentId String

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())

  @@unique([userId, commentId]) // Prevents duplicate likes
  @@index([commentId])
  @@index([userId])
}
```

### Pattern 2: Like Toggle with Optimistic UI
**What:** Instant like/unlike toggle with server sync
**When to use:** All like buttons on posts and comments
**Example:**
```typescript
// components/feed/like-button.tsx
'use client';

import { useOptimistic, useTransition } from 'react';
import { togglePostLike } from '@/lib/like-actions';

interface LikeButtonProps {
  targetId: string;
  targetType: 'post' | 'comment';
  initialLiked: boolean;
  initialCount: number;
  onLikersClick?: () => void;
}

export function LikeButton({
  targetId,
  targetType,
  initialLiked,
  initialCount,
  onLikersClick,
}: LikeButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [optimistic, setOptimistic] = useOptimistic(
    { isLiked: initialLiked, count: initialCount },
    (state, action: 'LIKE' | 'UNLIKE') => {
      if (action === 'LIKE') {
        return { isLiked: true, count: state.count + 1 };
      } else {
        return { isLiked: false, count: state.count - 1 };
      }
    }
  );

  const handleClick = () => {
    const action = optimistic.isLiked ? 'UNLIKE' : 'LIKE';

    startTransition(async () => {
      setOptimistic(action);
      await togglePostLike(targetId, targetType);
    });
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="p-1 rounded hover:bg-muted transition-colors"
        aria-label={optimistic.isLiked ? 'Unlike' : 'Like'}
      >
        {optimistic.isLiked ? (
          <ThumbsUpFilledIcon className="w-5 h-5 text-primary" />
        ) : (
          <ThumbsUpOutlineIcon className="w-5 h-5 text-muted-foreground" />
        )}
      </button>
      {optimistic.count > 0 && (
        <button
          type="button"
          onClick={onLikersClick}
          className="text-sm text-muted-foreground hover:underline"
        >
          {optimistic.count}
        </button>
      )}
    </div>
  );
}
```

### Pattern 3: Server Action for Like Toggle (Idempotent)
**What:** Toggle like state with upsert/delete pattern
**When to use:** Post and comment like mutations
**Example:**
```typescript
// lib/like-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function togglePostLike(postId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const userId = session.user.id;

  // Check if like exists
  const existingLike = await db.postLike.findUnique({
    where: {
      userId_postId: { userId, postId },
    },
  });

  if (existingLike) {
    // Unlike: delete the like
    await db.postLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    // Like: create new like
    await db.postLike.create({
      data: { userId, postId },
    });
  }

  revalidatePath('/feed');
  revalidatePath(`/feed/${postId}`);

  return { success: true };
}

export async function toggleCommentLike(commentId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const userId = session.user.id;

  const existingLike = await db.commentLike.findUnique({
    where: {
      userId_commentId: { userId, commentId },
    },
  });

  if (existingLike) {
    await db.commentLike.delete({
      where: { id: existingLike.id },
    });
  } else {
    await db.commentLike.create({
      data: { userId, commentId },
    });
  }

  // Revalidate the post page where comment is shown
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { postId: true },
  });

  if (comment) {
    revalidatePath(`/feed/${comment.postId}`);
  }

  return { success: true };
}
```

### Pattern 4: Category Tabs with URL Search Params
**What:** Horizontal tabs for category filtering with shareable URLs
**When to use:** Feed page category filtering
**Example:**
```typescript
// components/feed/category-tabs.tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategoryTabsProps {
  categories: Category[];
  activeCategory: string | null; // null = "All"
}

export function CategoryTabs({ categories, activeCategory }: CategoryTabsProps) {
  // Don't render if no categories exist
  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {/* "All" tab */}
      <Link
        href="/feed"
        className={cn(
          'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
          activeCategory === null
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted hover:bg-muted/80'
        )}
      >
        All
      </Link>

      {/* Category tabs */}
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/feed?category=${category.id}`}
          className={cn(
            'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
            activeCategory === category.id
              ? 'text-white'
              : 'bg-muted hover:bg-muted/80'
          )}
          style={
            activeCategory === category.id
              ? { backgroundColor: category.color }
              : undefined
          }
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}
```

### Pattern 5: Comment Form with Optimistic Add
**What:** Comment input that shows immediately while syncing
**When to use:** Adding comments to posts
**Example:**
```typescript
// components/feed/comment-form.tsx
'use client';

import { useState, useTransition, FormEvent } from 'react';
import { createComment } from '@/lib/comment-actions';
import { Button } from '@/components/ui/button';

interface CommentFormProps {
  postId: string;
  onOptimisticAdd?: (comment: OptimisticComment) => void;
}

interface OptimisticComment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  createdAt: Date;
  isPending: true;
}

export function CommentForm({ postId, onOptimisticAdd }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!content.trim()) return;

    setError(null);
    const commentContent = content;
    setContent(''); // Clear immediately for UX

    startTransition(async () => {
      const result = await createComment(postId, commentContent);

      if ('error' in result) {
        setError(typeof result.error === 'string' ? result.error : 'Failed to add comment');
        setContent(commentContent); // Restore on error
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment..."
        className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        disabled={isPending}
        maxLength={2000}
      />
      <Button type="submit" disabled={isPending || !content.trim()}>
        {isPending ? 'Posting...' : 'Post'}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
```

### Pattern 6: Admin Category Management
**What:** CRUD interface for categories (admin only)
**When to use:** Admin area for managing post categories
**Example:**
```typescript
// lib/category-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { categorySchema } from '@/lib/validations/category';

export async function createCategory(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Check admin role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return { error: 'Not authorized' };
  }

  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, color } = validatedFields.data;

  // Check for duplicate name
  const existing = await db.category.findUnique({
    where: { name },
  });

  if (existing) {
    return { error: 'Category name already exists' };
  }

  await db.category.create({
    data: { name, color },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/feed');

  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return { error: 'Not authorized' };
  }

  // Posts with this category will have categoryId set to null (onDelete: SetNull)
  await db.category.delete({
    where: { id: categoryId },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/feed');

  return { success: true };
}
```

### Anti-Patterns to Avoid
- **Storing like status in component state alone:** Always derive from server data, use optimistic only for immediate feedback
- **Multiple database queries for like count:** Use _count in Prisma include, not separate queries
- **Client-side category filtering:** Use server-side filtering with search params for SEO and performance
- **Modal dialogs for comment delete:** Per CONTEXT.md, use inline confirmation pattern
- **Nested comments:** Per CONTEXT.md, comments are flat (newest first) - threading is v2

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Like race conditions | Custom locking | Prisma @@unique constraint | Database enforces, handles concurrency |
| Optimistic state management | Manual state reconciliation | useOptimistic hook | Built-in React, handles rollback |
| Category filter URLs | Client state + history.pushState | URL search params | SSR compatible, shareable links |
| Comment timestamp | Manual date math | date-fns formatDistanceToNow | Already in project, handles edge cases |
| Hex color validation | Custom regex | Zod regex pattern | Consistent with existing validation |

**Key insight:** The compound unique constraint (@@unique([userId, postId])) makes like toggling naturally idempotent - even if the request is retried, the database prevents duplicates.

## Common Pitfalls

### Pitfall 1: Like Button Double-Click Creates Duplicates
**What goes wrong:** Rapid clicks create multiple like records
**Why it happens:** No database constraint, server actions race
**How to avoid:** Use @@unique([userId, postId]) constraint; use useTransition to disable button during pending
**Warning signs:** Like counts incrementing by more than 1, console errors about unique constraint

### Pitfall 2: Optimistic Unlike Shows Wrong State
**What goes wrong:** UI shows liked but server shows unliked
**Why it happens:** useOptimistic not properly coordinating with server state
**How to avoid:** Pass current server state as first arg to useOptimistic, let revalidatePath sync final state
**Warning signs:** Like state toggles unexpectedly after page interactions

### Pitfall 3: Category Filter Loses Pagination
**What goes wrong:** Clicking category resets to page 1, or pagination forgets category
**Why it happens:** Search params not preserved across interactions
**How to avoid:** Build pagination links that preserve category param, and vice versa
**Warning signs:** URL loses params during navigation

```typescript
// Preserve both category and page params
function buildFeedUrl(category: string | null, page: number) {
  const params = new URLSearchParams();
  if (category) params.set('category', category);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/feed?${query}` : '/feed';
}
```

### Pitfall 4: Comment Count Not Updating Optimistically
**What goes wrong:** Post card shows old comment count until full page refresh
**Why it happens:** revalidatePath only revalidates server components, client state stale
**How to avoid:** Either use optimistic count update, or ensure PostCard re-renders from server
**Warning signs:** Comment added successfully but post card count unchanged

### Pitfall 5: Admin Role Check Only on Client
**What goes wrong:** Non-admins can access admin category page
**Why it happens:** Role check in client component but not server action
**How to avoid:** Always check role in server action AND optionally hide UI for non-admins
**Warning signs:** Network tab shows successful requests from non-admin users

```typescript
// Always verify in server action
const user = await db.user.findUnique({
  where: { id: session.user.id },
  select: { role: true },
});

if (!['admin', 'owner'].includes(user?.role ?? '')) {
  return { error: 'Not authorized' };
}
```

### Pitfall 6: Empty State Illustrations Bloat Bundle
**What goes wrong:** Large SVG files increase page load time
**Why it happens:** Embedding full illustration SVGs as components
**How to avoid:** Use inline simple SVGs or lazy-load illustrations; keep empty states lightweight
**Warning signs:** Large bundle size, slow initial paint on empty pages

## Code Examples

Verified patterns from official sources and project conventions:

### Comment Validation Schema
```typescript
// lib/validations/comment.ts
import { z } from 'zod';

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be under 2000 characters')
    .trim(),
});

export type CommentInput = z.infer<typeof commentSchema>;
```

### Category Validation Schema
```typescript
// lib/validations/category.ts
import { z } from 'zod';

const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(50, 'Category name must be under 50 characters')
    .trim(),
  color: z
    .string()
    .regex(hexColorRegex, 'Color must be a valid hex color (e.g., #6366f1)'),
});

export type CategoryInput = z.infer<typeof categorySchema>;
```

### Fetching Posts with Like Status and Count
```typescript
// Example query in feed page
const posts = await db.post.findMany({
  where: categoryId ? { categoryId } : undefined,
  orderBy: { createdAt: 'desc' },
  take: POSTS_PER_PAGE,
  skip,
  include: {
    author: {
      select: { id: true, name: true, image: true },
    },
    category: {
      select: { id: true, name: true, color: true },
    },
    _count: {
      select: { comments: true, likes: true },
    },
    // Check if current user liked this post
    likes: currentUserId
      ? { where: { userId: currentUserId }, take: 1 }
      : false,
  },
});

// Transform to check if user liked
const postsWithLikeStatus = posts.map((post) => ({
  ...post,
  isLiked: post.likes && post.likes.length > 0,
  likeCount: post._count.likes,
  commentCount: post._count.comments,
}));
```

### Empty State Component
```typescript
// components/ui/empty-state.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
```

### Likers List Modal/Popover
```typescript
// Server action to get likers
export async function getPostLikers(postId: string) {
  const likers = await db.postLike.findMany({
    where: { postId },
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { id: true, name: true, image: true },
      },
    },
  });

  return likers.map((like) => like.user);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SWR/React Query for mutations | Server Actions + useOptimistic | Next.js 14+ | Less boilerplate, RSC integration |
| Separate API routes for CRUD | Server Actions with 'use server' | Next.js 13.4+ | Co-located mutations, type safety |
| Client-side filtering | URL search params + server filter | RSC best practice | SEO friendly, no hydration flash |
| Manual optimistic rollback | useOptimistic auto-rollback | React 19 | Built-in error handling |

**Deprecated/outdated:**
- API routes for simple mutations: Use server actions instead
- useMutation from React Query: useOptimistic + server actions cover most cases
- Client-side only filtering: Server-side is more performant with RSC

## Open Questions

Things that couldn't be fully resolved:

1. **Like Animation/Transition**
   - What we know: Filled/outline icon toggle works
   - What's unclear: Best approach for subtle animation (scale, color transition)
   - Recommendation: Use CSS transition on opacity/transform, avoid complex libraries

2. **Likers List Pagination**
   - What we know: Need to show who liked a post when count is clicked
   - What's unclear: Modal vs popover vs full page for large like counts
   - Recommendation: Start with popover (lightweight), add "see all" if needed

3. **Category Color Picker**
   - What we know: Need hex color input for admin
   - What's unclear: Use native color input or custom palette
   - Recommendation: Native `<input type="color">` is simplest, works everywhere

## Sources

### Primary (HIGH confidence)
- [React useOptimistic Hook](https://react.dev/reference/react/useOptimistic) - Official React documentation
- [Next.js revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) - Official Next.js documentation
- [Prisma Compound Unique Constraints](https://www.prisma.io/docs/orm/prisma-client/special-fields-and-types/working-with-composite-ids-and-constraints) - Official Prisma documentation
- [Prisma Many-to-Many Relations](https://www.prisma.io/docs/orm/prisma-schema/data-model/relations/many-to-many-relations) - Official Prisma documentation

### Secondary (MEDIUM confidence)
- [FreeCodeCamp: useOptimistic Pattern](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) - Like button toggle pattern
- [Type of Web: Implementing Optimistic Updates](https://typeofweb.com/implementing-optimistic-updates-in-nextjs-using-react-18s-useoptimistic-hook) - Next.js integration
- [Tailwind CSS Tabs](https://flowbite.com/docs/components/tabs/) - Tab component patterns
- [Medium: Prisma Social Media Schema](https://medium.com/@ChukwuebukaN/database-schema-design-for-a-basic-social-media-software-using-prisma-04abc8ccc20b) - Schema design patterns

### Tertiary (LOW confidence)
- Empty state illustrations: Multiple sources (Flaticon, SVG Repo, UXWing) - free for commercial use

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project libraries, official React/Next.js/Prisma docs
- Architecture: HIGH - Follows Phase 4 patterns, verified with official documentation
- Optimistic UI: HIGH - React official documentation, tested patterns
- Schema design: HIGH - Prisma official docs for compound unique constraints
- Pitfalls: MEDIUM - Based on documented issues and best practices

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
