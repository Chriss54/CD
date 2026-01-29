# Phase 3: Profiles - Research

**Researched:** 2026-01-23
**Domain:** User Profiles, Avatar Upload, Member Directory
**Confidence:** HIGH

## Summary

Phase 3 implements user profiles with display names, avatars, bios, and a member directory. The research focused on four key areas: (1) avatar file uploads using Supabase Storage, (2) profile data management with existing Prisma/Next.js stack, (3) member directory with pagination, and (4) profile viewing pages.

The primary technical decision is using **Supabase Storage** for avatar uploads since the project already uses Supabase (PostgreSQL) for the database. This provides a unified infrastructure, eliminates need for additional services, and offers built-in RLS security. For pagination, **offset-based pagination** is recommended for the member directory since it allows random page access (jump to page 5) which is better UX for browsing members vs infinite scroll.

The database schema already has the required fields (`name`, `image`, `bio` with 500 char limit) from Phase 1 foundation, minimizing migration work. The main implementation work involves: (1) Supabase client setup for storage, (2) avatar upload server action, (3) profile edit form, (4) member directory with pagination, and (5) public profile pages.

**Primary recommendation:** Use Supabase Storage for avatars with public bucket + user-scoped folders, offset pagination for member directory, and `/members/[id]` route pattern for profile pages.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Supabase client for storage | Official SDK, already using Supabase DB |
| @supabase/ssr | ^0.x | SSR-compatible Supabase client | Required for Next.js App Router |
| next/image | built-in | Avatar image optimization | Automatic WebP/AVIF, responsive sizing |
| Prisma | ^7.3.0 | Database queries | Already in use, skip/take pagination |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zod | ^4.3.6 | Profile validation schemas | Already in use for auth forms |
| react-hook-form | ^7.71.1 | Form state management | Already in use, works with file inputs |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Supabase Storage | Cloudinary | Better transformations, but adds another service |
| Supabase Storage | UploadThing | Simpler API, but another dependency |
| Supabase Storage | S3 Direct | More control, but more setup complexity |
| Offset pagination | Cursor pagination | Better for infinite scroll, worse for random access |

**Installation:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Browser client (singleton)
│   │   └── server.ts        # Server component client
│   ├── validations/
│   │   └── profile.ts       # Zod schemas for profile
│   └── profile-actions.ts   # Server actions for profile updates
├── app/
│   └── (main)/
│       ├── members/
│       │   ├── page.tsx     # Member directory with pagination
│       │   └── [id]/
│       │       └── page.tsx # Public profile view
│       ├── profile/
│       │   └── edit/
│       │       └── page.tsx # Edit own profile
│       └── onboarding/
│           └── page.tsx     # Post-registration profile setup
└── components/
    ├── profile/
    │   ├── avatar-upload.tsx    # Client component for file input
    │   ├── profile-form.tsx     # Edit profile form
    │   ├── profile-card.tsx     # Card for member directory
    │   └── member-grid.tsx      # Grid layout for members
    └── ui/
        ├── avatar.tsx           # Reusable avatar display component
        └── pagination.tsx       # Pagination controls
```

### Pattern 1: Supabase Storage Upload with Server Action
**What:** Upload files directly from client to Supabase Storage via signed URL, then save URL to database via server action
**When to use:** Avatar uploads, any user-uploaded images
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/storage/uploads/standard-uploads
// lib/profile-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import db from '@/lib/db';

export async function uploadAvatar(userId: string, file: File) {
  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/avatar.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  await db.user.update({
    where: { id: userId },
    data: { image: publicUrl },
  });

  return { success: true, url: publicUrl };
}
```

### Pattern 2: Offset Pagination with URL Search Params
**What:** Server-side pagination using URL params for page state
**When to use:** Member directory, any browseable lists
**Example:**
```typescript
// Source: https://www.prisma.io/docs/orm/prisma-client/queries/pagination
// app/(main)/members/page.tsx
import db from '@/lib/db';

const ITEMS_PER_PAGE = 12;

export default async function MembersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const [members, total] = await Promise.all([
    db.user.findMany({
      skip,
      take: ITEMS_PER_PAGE,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, image: true, bio: true },
    }),
    db.user.count(),
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <MemberGrid members={members} />
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  );
}
```

### Pattern 3: Supabase Client Setup for Next.js App Router
**What:** Separate client and server Supabase instances
**When to use:** Any Supabase operations (storage, auth, realtime)
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/auth/server-side/creating-a-client
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Pattern 4: Avatar Display with Fallback
**What:** Reusable avatar component with image or initials fallback
**When to use:** Anywhere user avatars are displayed
**Example:**
```typescript
// components/ui/avatar.tsx
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = { sm: 32, md: 48, lg: 96 };

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const dimension = sizes[size];
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';

  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'Avatar'}
        width={dimension}
        height={dimension}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-muted flex items-center justify-center text-muted-foreground font-medium',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {initials.toUpperCase()}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing avatars in database:** Never store binary image data in PostgreSQL. Use object storage (Supabase Storage).
- **Client-side pagination state:** Use URL search params for pagination so pages are shareable and bookmarkable.
- **Unlimited file uploads:** Always validate file size and type both client-side (UX) and server-side (security).
- **N+1 queries in member directory:** Use single query with pagination, not individual queries per member.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization | Manual resize/compress | next/image | Automatic WebP, AVIF, responsive srcset |
| File upload to cloud | Custom S3 integration | Supabase Storage | Integrated with existing DB, simpler auth |
| Avatar initials fallback | Custom color algorithm | Simple hash to bg-color | Consistency, accessibility |
| Pagination UI | Custom prev/next logic | URL search params | Shareable, works with back button |
| Form validation | Custom checks | Zod schemas | Type safety, consistent with auth forms |

**Key insight:** Avatar uploads seem simple but involve: file type validation, size limits, unique naming, old file cleanup, CDN URLs, and responsive display. Supabase Storage handles most of this.

## Common Pitfalls

### Pitfall 1: Server Action File Size Limits
**What goes wrong:** Large avatar uploads fail silently or with cryptic errors
**Why it happens:** Next.js server actions have 1MB default body limit
**How to avoid:** Either increase limit in next.config.js OR upload directly to Supabase from client
**Warning signs:** Uploads work for small files, fail for larger ones

```typescript
// next.config.ts - if using server action upload
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};
```

### Pitfall 2: Missing next/image Remote Patterns
**What goes wrong:** Avatar images don't load, console shows "Invalid src prop" error
**Why it happens:** Next.js blocks external images by default for security
**How to avoid:** Configure remotePatterns in next.config.ts for Supabase URLs
**Warning signs:** Local images work, Supabase URLs broken

```typescript
// next.config.ts
export default {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};
```

### Pitfall 3: Bio Character Count Mismatch
**What goes wrong:** Users type 500 characters but server rejects as too long
**Why it happens:** Newlines are `\n` in browser but `\r\n` when form is submitted
**How to avoid:** Normalize newlines in Zod schema before length check
**Warning signs:** Bio validation fails inconsistently, especially with line breaks

```typescript
// lib/validations/profile.ts
const normalize = (text: string) => text.replace(/\r\n/g, '\n');

export const bioSchema = z.string()
  .transform(normalize)
  .pipe(z.string().max(500, 'Bio must be 500 characters or less'));
```

### Pitfall 4: Avatar URL Cache Busting
**What goes wrong:** User updates avatar but old image still shows
**Why it happens:** Browser/CDN caches the image URL
**How to avoid:** Include timestamp or version in filename OR use upsert with cache headers
**Warning signs:** Avatar updates "don't work" until hard refresh

```typescript
// Append timestamp to force fresh URL
const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
```

### Pitfall 5: Missing RLS Policies on Storage
**What goes wrong:** Uploads fail with 403 or no error but file doesn't appear
**Why it happens:** Supabase Storage requires RLS policies, empty by default
**How to avoid:** Create storage bucket with appropriate RLS policies in Supabase dashboard or migration
**Warning signs:** Database operations work, storage operations silently fail

## Code Examples

Verified patterns from official sources:

### Profile Validation Schema
```typescript
// Source: Zod documentation + project patterns
// lib/validations/profile.ts
import { z } from 'zod';

const normalize = (text: string) => text.replace(/\r\n/g, '\n');

export const profileSchema = z.object({
  name: z.string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be 50 characters or less'),
  bio: z.string()
    .transform(normalize)
    .pipe(z.string().max(500, 'Bio must be 500 characters or less'))
    .optional()
    .or(z.literal('')),
});

export type ProfileInput = z.infer<typeof profileSchema>;

// Avatar file validation (client-side)
export const avatarSchema = z.object({
  file: z.instanceof(File)
    .refine(file => file.size <= 5 * 1024 * 1024, 'Avatar must be less than 5MB')
    .refine(
      file => ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
      'Avatar must be a JPEG, PNG, WebP, or GIF'
    ),
});
```

### Update Profile Server Action
```typescript
// Source: Project patterns from auth-actions.ts
// lib/profile-actions.ts
'use server';

import db from '@/lib/db';
import { profileSchema } from '@/lib/validations/profile';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const validatedFields = profileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, bio } = validatedFields.data;

  await db.user.update({
    where: { id: session.user.id },
    data: { name, bio: bio || null },
  });

  revalidatePath('/profile/edit');
  revalidatePath(`/members/${session.user.id}`);

  return { success: true };
}
```

### Pagination Component
```typescript
// Source: Next.js patterns
// components/ui/pagination.tsx
'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
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

  return (
    <nav className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage <= 1}
      >
        <Link href={createPageURL(currentPage - 1)}>
          Previous
        </Link>
      </Button>

      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>

      <Button
        variant="outline"
        size="sm"
        asChild
        disabled={currentPage >= totalPages}
      >
        <Link href={createPageURL(currentPage + 1)}>
          Next
        </Link>
      </Button>
    </nav>
  );
}
```

### Character Counter for Bio
```typescript
// components/profile/bio-textarea.tsx
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BioTextareaProps {
  defaultValue?: string;
  maxLength?: number;
  error?: string;
}

export function BioTextarea({
  defaultValue = '',
  maxLength = 500,
  error
}: BioTextareaProps) {
  const [value, setValue] = useState(defaultValue);
  // Normalize for accurate count
  const charCount = value.replace(/\r\n/g, '\n').length;
  const isOverLimit = charCount > maxLength;

  return (
    <div>
      <textarea
        name="bio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className={cn(
          'w-full p-2 border rounded focus:ring-2 focus:ring-primary',
          error && 'border-red-500'
        )}
        placeholder="Tell the community about yourself..."
      />
      <div className="flex justify-between mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <span className={cn(
          'text-sm ml-auto',
          isOverLimit ? 'text-red-500' : 'text-muted-foreground'
        )}>
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Base64 data URLs | Supabase Storage URLs | 2023+ | Better performance, proper CDN |
| Client-side pagination state | URL search params | Next.js 13+ | Shareable URLs, SSR-friendly |
| API routes for uploads | Server actions | Next.js 14+ | Simpler code, better DX |
| Manual image optimization | next/image | Always | Automatic optimization |

**Deprecated/outdated:**
- `getInitialProps` for pagination - use searchParams in App Router
- `next/legacy/image` - use `next/image` with new API
- Custom fetch for forms - use server actions with FormData

## Open Questions

Things that couldn't be fully resolved:

1. **Onboarding flow placement**
   - What we know: New users need to set display name and avatar
   - What's unclear: Should this be a separate `/onboarding` page or inline on first dashboard visit?
   - Recommendation: Use dedicated `/onboarding` page that redirects to dashboard after completion, check `hasCompletedOnboarding` field

2. **Avatar file upload approach**
   - What we know: Two options - server action upload (simpler) vs direct client upload (handles larger files)
   - What's unclear: Expected avatar file sizes, Vercel deployment constraints
   - Recommendation: Start with server action + 5MB limit, switch to direct upload if needed

3. **Profile URL scheme**
   - What we know: `/members/[id]` is simpler, `/members/[username]` is more SEO-friendly
   - What's unclear: Will usernames be added to the schema?
   - Recommendation: Use `/members/[id]` for now since username field doesn't exist, can add username redirect later

## Sources

### Primary (HIGH confidence)
- Supabase Storage Docs - https://supabase.com/docs/guides/storage/uploads/standard-uploads
- Supabase SSR Client - https://supabase.com/docs/guides/auth/server-side/creating-a-client
- Prisma Pagination - https://www.prisma.io/docs/orm/prisma-client/queries/pagination
- Next.js Image Component - https://nextjs.org/docs/app/api-reference/components/image

### Secondary (MEDIUM confidence)
- Supabase Storage RLS - https://supabase.com/docs/guides/storage/security/access-control
- Next.js URL Structure SEO - https://nextjs.org/learn/seo/url-structure
- Zod GitHub issue on textarea newlines - https://github.com/colinhacks/zod/issues/2684

### Tertiary (LOW confidence)
- Community blog posts on file upload patterns (multiple sources agree)
- Onboarding flow patterns from various SaaS starters

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project patterns + official Supabase docs
- Architecture: HIGH - Follows established Next.js App Router patterns
- Pitfalls: HIGH - Verified through official docs and GitHub issues
- File upload specifics: MEDIUM - May need adjustment based on Vercel limits

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
