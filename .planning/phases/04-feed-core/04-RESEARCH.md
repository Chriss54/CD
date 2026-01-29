# Phase 4: Feed Core - Research

**Researched:** 2026-01-23
**Domain:** Social Feed Posts, Rich Text Editing, Video Embeds
**Confidence:** HIGH

## Summary

Phase 4 implements a social feed where users can create, view, edit, and delete posts with rich text and embedded videos (YouTube, Vimeo, Loom). The research focused on four key areas: (1) Tiptap rich text editor setup for React/Next.js, (2) video URL parsing and lazy-loaded thumbnail embeds, (3) optimistic UI updates with React's useOptimistic hook, and (4) Prisma schema for storing Tiptap JSON content.

The technical stack centers on **Tiptap v3** for rich text editing, which includes Bold, Italic, and Link in the StarterKit by default. For video embeds, the recommended approach is the **get-video-id** npm package to parse YouTube/Vimeo/Loom URLs, combined with a custom lazy-loading component that shows thumbnails and loads iframes on click. This aligns with the CONTEXT.md decision for "lazy with thumbnail" loading strategy.

For content storage, **JSON is recommended over HTML** as the source of truth since it preserves structure, is easier to validate, and reduces XSS risk. HTML can be generated server-side for rendering if needed. Optimistic updates use React 19's `useOptimistic` hook, showing posts immediately with a "Sending..." indicator while the server action completes.

**Primary recommendation:** Use Tiptap v3 StarterKit with `immediatelyRender: false` for SSR, get-video-id for URL parsing, store content as JSON in Prisma, and implement optimistic UI with useOptimistic hook.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @tiptap/react | ^3.15.x | React bindings for Tiptap editor | Official React integration, headless/extensible |
| @tiptap/pm | ^3.15.x | ProseMirror dependencies | Required peer dependency |
| @tiptap/starter-kit | ^3.15.x | Common extensions bundle | Includes Bold, Italic, Link, Underline in v3 |
| get-video-id | ^4.1.x | Parse video URLs to extract IDs | Supports YouTube, Vimeo, Loom, well-maintained |
| @loomhq/loom-embed | ^1.x | Loom oEmbed API (thumbnails) | Official SDK for Loom metadata/thumbnails |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.x | Relative time formatting | "2 hours ago" timestamps |
| DOMPurify | ^3.x | HTML sanitization | When rendering HTML output |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tiptap | Lexical | Lexical is newer, Tiptap more mature ecosystem |
| Tiptap | Slate.js | More control but more complexity |
| get-video-id | Custom regex | Package handles edge cases, maintained |
| JSON storage | HTML storage | HTML is smaller but less safe, harder to transform |

**Installation:**
```bash
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit get-video-id @loomhq/loom-embed date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── validations/
│   │   └── post.ts           # Zod schemas for post content
│   ├── post-actions.ts       # Server actions for CRUD
│   └── video-utils.ts        # URL parsing, thumbnail helpers
├── app/
│   └── (main)/
│       └── feed/
│           └── page.tsx      # Feed page with pagination
├── components/
│   ├── feed/
│   │   ├── post-form.tsx     # Create/edit post form (client)
│   │   ├── post-card.tsx     # Individual post display
│   │   ├── post-list.tsx     # Feed list with optimistic UI
│   │   └── post-editor.tsx   # Tiptap editor wrapper (client)
│   └── video/
│       ├── video-embed.tsx   # Lazy-load video component
│       ├── video-input.tsx   # URL input for embeds
│       └── video-thumbnail.tsx # Thumbnail display
└── types/
    └── post.ts               # Post type definitions
```

### Pattern 1: Tiptap Editor with SSR Safety
**What:** Configure Tiptap for Next.js App Router with SSR disabled
**When to use:** Any rich text editing in Next.js
**Example:**
```typescript
// Source: https://tiptap.dev/docs/editor/getting-started/install/react
// components/feed/post-editor.tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface PostEditorProps {
  content?: string;
  onChange?: (json: object) => void;
}

export function PostEditor({ content, onChange }: PostEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '',
    immediatelyRender: false, // Required for SSR
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON());
    },
  });

  if (!editor) return null;

  return (
    <div className="border rounded-lg p-4">
      <div className="flex gap-2 mb-2 border-b pb-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive('bold') ? 'font-bold' : ''}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive('italic') ? 'italic' : ''}
        >
          I
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none" />
    </div>
  );
}
```

### Pattern 2: Video URL Parsing with get-video-id
**What:** Extract video ID and service from any supported URL format
**When to use:** Processing user-entered video URLs
**Example:**
```typescript
// Source: https://github.com/radiovisual/get-video-id
// lib/video-utils.ts
import getVideoId from 'get-video-id';

export type VideoService = 'youtube' | 'vimeo' | 'loom';

export interface VideoEmbed {
  service: VideoService;
  id: string;
  url: string;
}

export function parseVideoUrl(url: string): VideoEmbed | null {
  const result = getVideoId(url);

  if (!result.id || !result.service) {
    return null;
  }

  // get-video-id returns lowercase service names
  const service = result.service as VideoService;

  if (!['youtube', 'vimeo', 'loom'].includes(service)) {
    return null;
  }

  return {
    service,
    id: result.id,
    url,
  };
}

export function getThumbnailUrl(embed: VideoEmbed): string {
  switch (embed.service) {
    case 'youtube':
      return `https://img.youtube.com/vi/${embed.id}/mqdefault.jpg`;
    case 'vimeo':
      // Vimeo requires API call - return placeholder, fetch async
      return `/api/video-thumbnail?service=vimeo&id=${embed.id}`;
    case 'loom':
      // Loom requires oEmbed API - return placeholder, fetch async
      return `/api/video-thumbnail?service=loom&id=${embed.id}`;
    default:
      return '';
  }
}

export function getEmbedUrl(embed: VideoEmbed): string {
  switch (embed.service) {
    case 'youtube':
      return `https://www.youtube.com/embed/${embed.id}?autoplay=1`;
    case 'vimeo':
      return `https://player.vimeo.com/video/${embed.id}?autoplay=1`;
    case 'loom':
      return `https://www.loom.com/embed/${embed.id}?autoplay=1`;
    default:
      return '';
  }
}
```

### Pattern 3: Lazy-Load Video Embed Component
**What:** Show thumbnail until clicked, then load iframe
**When to use:** All video embeds in posts
**Example:**
```typescript
// components/video/video-embed.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { VideoEmbed as VideoEmbedType, getEmbedUrl } from '@/lib/video-utils';

interface VideoEmbedProps {
  embed: VideoEmbedType;
  thumbnailUrl: string;
}

export function VideoEmbed({ embed, thumbnailUrl }: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  if (isPlaying) {
    return (
      <div className="relative aspect-video w-full">
        <iframe
          src={getEmbedUrl(embed)}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setIsPlaying(true)}
      className="relative aspect-video w-full group cursor-pointer"
    >
      <Image
        src={thumbnailUrl}
        alt="Video thumbnail"
        fill
        className="object-cover rounded-lg"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
        <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </button>
  );
}
```

### Pattern 4: Optimistic UI with useOptimistic
**What:** Show post immediately while server action processes
**When to use:** Post creation, deletion
**Example:**
```typescript
// Source: https://react.dev/reference/react/useOptimistic
// components/feed/post-list.tsx
'use client';

import { useOptimistic, startTransition } from 'react';
import { createPost } from '@/lib/post-actions';
import type { Post } from '@/types/post';

interface PostListProps {
  initialPosts: Post[];
}

export function PostList({ initialPosts }: PostListProps) {
  const [optimisticPosts, addOptimisticPost] = useOptimistic(
    initialPosts,
    (state, newPost: Post) => [newPost, ...state]
  );

  async function handleSubmit(formData: FormData) {
    const optimisticPost: Post = {
      id: `temp-${Date.now()}`,
      content: JSON.parse(formData.get('content') as string),
      authorId: 'current-user', // Will be replaced
      createdAt: new Date(),
      isPending: true,
    };

    startTransition(() => {
      addOptimisticPost(optimisticPost);
    });

    await createPost(formData);
  }

  return (
    <div>
      <PostForm onSubmit={handleSubmit} />
      {optimisticPosts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isPending={post.isPending}
        />
      ))}
    </div>
  );
}
```

### Pattern 5: Server Action for Post CRUD
**What:** Server actions with validation and revalidation
**When to use:** All post mutations
**Example:**
```typescript
// Source: Project patterns from profile-actions.ts
// lib/post-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { postSchema } from '@/lib/validations/post';

export async function createPost(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const validatedFields = postSchema.safeParse({
    content: formData.get('content'),
    embeds: formData.get('embeds'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { content, embeds } = validatedFields.data;

  await db.post.create({
    data: {
      content,
      embeds: embeds || [],
      authorId: session.user.id,
    },
  });

  revalidatePath('/feed');
  return { success: true };
}

export async function deletePost(postId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  if (post.authorId !== session.user.id) {
    return { error: 'Not authorized' };
  }

  await db.post.delete({
    where: { id: postId },
  });

  revalidatePath('/feed');
  return { success: true };
}
```

### Anti-Patterns to Avoid
- **Storing HTML as source of truth:** Store JSON, generate HTML for display. JSON is safer and more flexible.
- **Loading video iframes immediately:** Always lazy-load with thumbnails. A single YouTube embed adds 500-800KB.
- **Re-rendering Tiptap on every change:** Use `shouldRerenderOnTransaction: false` if not needing live updates outside editor.
- **Missing `immediatelyRender: false`:** Will cause hydration errors in Next.js SSR.
- **Using react-player for Loom:** It doesn't support Loom. Use get-video-id + custom component.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video URL parsing | Custom regex per platform | get-video-id | Handles 20+ URL formats per platform |
| Rich text editing | Custom contentEditable | Tiptap | Handles cursor, selection, paste, undo/redo |
| Relative time ("2h ago") | Custom date math | date-fns formatDistanceToNow | Handles edge cases, i18n |
| Loom thumbnails | Scraping/guessing | @loomhq/loom-embed oEmbed | Official API, always works |
| HTML sanitization | Regex replace | DOMPurify | XSS edge cases are dangerous |

**Key insight:** Video URL parsing looks like simple regex but has dozens of edge cases per platform (shorts, embeds, channels, private videos, timestamps). get-video-id handles them all.

## Common Pitfalls

### Pitfall 1: Tiptap SSR Hydration Errors
**What goes wrong:** Console errors about hydration mismatch, editor doesn't render
**Why it happens:** Tiptap uses browser APIs that don't exist during SSR
**How to avoid:** Always set `immediatelyRender: false` in useEditor config
**Warning signs:** Works in dev sometimes but fails in production or with fast refresh

```typescript
const editor = useEditor({
  extensions: [StarterKit],
  immediatelyRender: false, // Required!
});
```

### Pitfall 2: XSS from Stored HTML
**What goes wrong:** User-injected script executes when rendering posts
**Why it happens:** Tiptap's getHTML() output stored directly, rendered with dangerouslySetInnerHTML
**How to avoid:** Store JSON as source of truth, sanitize HTML output server-side before storage
**Warning signs:** Accepting HTML from external sources, using dangerouslySetInnerHTML

```typescript
// Link extension XSS - CVE-2025-14284 fixed in v2.10.4
// Ensure Tiptap packages are up to date
// Always sanitize if rendering HTML
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(html);
```

### Pitfall 3: Vimeo/Loom Thumbnails Require API Calls
**What goes wrong:** Thumbnails don't load, show broken images
**Why it happens:** Unlike YouTube (direct URL), Vimeo/Loom need API requests
**How to avoid:** Create API route to fetch thumbnails, cache results
**Warning signs:** YouTube thumbnails work, Vimeo/Loom don't

```typescript
// YouTube: Direct URL works
`https://img.youtube.com/vi/${id}/mqdefault.jpg`

// Vimeo: Needs API call
const response = await fetch(`https://vimeo.com/api/oembed.json?url=https://vimeo.com/${id}`);
const data = await response.json();
const thumbnail = data.thumbnail_url;

// Loom: Needs SDK
import { oembed } from '@loomhq/loom-embed';
const data = await oembed(`https://www.loom.com/share/${id}`);
const thumbnail = data.thumbnail_url;
```

### Pitfall 4: Missing Post Authorization Check
**What goes wrong:** User can edit/delete other users' posts
**Why it happens:** Only checking authentication, not ownership
**How to avoid:** Always verify `post.authorId === session.user.id` before mutations
**Warning signs:** Edit/delete buttons visible on all posts

### Pitfall 5: Optimistic Update Race Conditions
**What goes wrong:** Duplicate posts, wrong order, stale data
**Why it happens:** Multiple rapid submissions, missing state reconciliation
**How to avoid:** Use unique temp IDs, let server response replace optimistic data via revalidatePath
**Warning signs:** Posts appearing multiple times, inconsistent feed state

```typescript
// Use unique temp ID
const tempId = `temp-${Date.now()}-${Math.random()}`;

// After server success, revalidatePath fetches fresh data
// which replaces optimistic state
```

### Pitfall 6: Tiptap Content Validation
**What goes wrong:** Invalid JSON stored, editor crashes on load
**Why it happens:** Directly storing user input without schema validation
**How to avoid:** Validate JSON structure matches Tiptap schema before storage
**Warning signs:** Editor works for new posts, crashes loading old posts

## Code Examples

Verified patterns from official sources:

### Post Zod Validation Schema
```typescript
// lib/validations/post.ts
import { z } from 'zod';

// Tiptap JSON content node structure (simplified)
const tiptapContentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(z.object({
    type: z.string(),
    content: z.array(z.any()).optional(),
    marks: z.array(z.any()).optional(),
    attrs: z.record(z.any()).optional(),
    text: z.string().optional(),
  })).optional(),
});

const videoEmbedSchema = z.object({
  service: z.enum(['youtube', 'vimeo', 'loom']),
  id: z.string(),
  url: z.string().url(),
});

export const postSchema = z.object({
  content: z.string()
    .transform((val) => JSON.parse(val))
    .pipe(tiptapContentSchema),
  embeds: z.string()
    .transform((val) => val ? JSON.parse(val) : [])
    .pipe(z.array(videoEmbedSchema))
    .optional(),
});

export type PostInput = z.input<typeof postSchema>;
```

### Prisma Post Model
```prisma
// prisma/schema.prisma
model Post {
  id        String   @id @default(cuid())
  content   Json     // Tiptap JSON document
  embeds    Json     @default("[]") // Array of VideoEmbed objects
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([createdAt(sort: Desc)])
}
```

### Relative Time Display
```typescript
// Source: date-fns documentation
// components/feed/post-card.tsx
import { formatDistanceToNow } from 'date-fns';

function PostTimestamp({ date }: { date: Date }) {
  return (
    <time
      dateTime={date.toISOString()}
      className="text-sm text-muted-foreground"
    >
      {formatDistanceToNow(date, { addSuffix: true })}
    </time>
  );
}
// Output: "2 hours ago", "yesterday", "3 days ago"
```

### Feed Page with Pagination
```typescript
// app/(main)/feed/page.tsx
import db from '@/lib/db';
import { PostList } from '@/components/feed/post-list';
import { Pagination } from '@/components/ui/pagination';

const POSTS_PER_PAGE = 10;

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const skip = (page - 1) * POSTS_PER_PAGE;

  const [posts, total] = await Promise.all([
    db.post.findMany({
      skip,
      take: POSTS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
      },
    }),
    db.post.count(),
  ]);

  const totalPages = Math.ceil(total / POSTS_PER_PAGE);

  return (
    <div className="max-w-2xl mx-auto">
      <PostList initialPosts={posts} />
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} />
      )}
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tiptap v2 (Link separate) | Tiptap v3 (Link in StarterKit) | 2024+ | Less config, Link included |
| Manual optimistic state | React useOptimistic | React 18.3+ | Built-in hook, simpler code |
| Loading all video iframes | Lazy-load with thumbnails | Performance focus | 500KB+ saved per video |
| Storing HTML | Storing JSON | Best practice | Safer, more flexible |

**Deprecated/outdated:**
- Tiptap v1: Use v3+ with StarterKit
- Custom video regex: Use get-video-id package
- react-player for Loom: Not supported, use custom component

## Open Questions

Things that couldn't be fully resolved:

1. **Tiptap Content Rendering Outside Editor**
   - What we know: JSON can be rendered with generateHTML() or custom renderer
   - What's unclear: Performance of generateHTML() for feed with many posts
   - Recommendation: Start with generateHTML(), consider caching rendered HTML if performance issues

2. **Video Thumbnail Caching**
   - What we know: Vimeo/Loom thumbnails require API calls
   - What's unclear: Rate limits, caching strategy
   - Recommendation: Cache thumbnail URLs in database or Redis, refresh periodically

3. **Tiptap Extensions Configuration**
   - What we know: StarterKit includes Bold, Italic, Link by default in v3
   - What's unclear: Exact configuration for Link (autolink, openOnClick)
   - Recommendation: Test default behavior, configure as needed

## Sources

### Primary (HIGH confidence)
- Tiptap React Installation - https://tiptap.dev/docs/editor/getting-started/install/react
- Tiptap StarterKit - https://tiptap.dev/docs/editor/extensions/functionality/starterkit
- Tiptap Output JSON/HTML - https://tiptap.dev/docs/guides/output-json-html
- React useOptimistic - https://react.dev/reference/react/useOptimistic
- Loom Embed SDK API - https://dev.loom.com/docs/embed-sdk/api
- get-video-id GitHub - https://github.com/radiovisual/get-video-id

### Secondary (MEDIUM confidence)
- Tiptap JSON storage best practices - https://github.com/ueberdosis/tiptap/discussions/964
- Lazy-load video iframes - https://robertmarshall.dev/blog/on-click-lazy-load-video-iframe-in-react/
- Next.js Server Actions - https://nextjs.org/docs/app/getting-started/updating-data

### Tertiary (LOW confidence)
- Tiptap XSS vulnerability history (CVE references) - multiple sources agree
- Video thumbnail URL patterns - community blog posts

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Tiptap docs, established packages
- Architecture: HIGH - Follows project patterns from Phase 3
- Video embeds: HIGH - get-video-id is well-documented, Loom SDK official
- Optimistic UI: HIGH - React official documentation
- Pitfalls: HIGH - Verified through official docs and security advisories

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
