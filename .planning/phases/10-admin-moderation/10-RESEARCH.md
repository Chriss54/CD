# Phase 10: Admin & Moderation - Research

**Researched:** 2026-01-23
**Domain:** Role-based access control, content moderation, admin interfaces
**Confidence:** HIGH

## Summary

Phase 10 implements a comprehensive admin and moderation system for community management. The phase covers role hierarchy (Owner > Admin > Moderator > Member), content moderation (edit/delete posts and comments), member management (ban/remove users), and community settings.

The standard approach uses the existing NextAuth session with role extended into JWT tokens, Prisma for data access with optional audit logging extensions, and a dedicated `/admin` route section with tab-based navigation. Key patterns include permission checking at both middleware and server action levels, hard deletes with audit logging, and scheduled ban expiry checks.

**Primary recommendation:** Extend NextAuth session to include user role, implement permission helper functions for role hierarchy checks, create dedicated admin server actions with audit logging, and build a tab-based admin UI at `/admin` route.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| NextAuth | v4 | Authentication with role support | Already in use, supports JWT role extension |
| Prisma | v7 | Database ORM with extensions | Already in use, supports audit logging via extensions |
| Next.js | v16 | App Router with middleware | Already in use, supports role-based route protection |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Supabase Storage | - | Logo/icon uploads | Already configured for avatar uploads |
| Sonner | - | Toast notifications | Already in use for user feedback |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| TanStack Table | Simple HTML tables | TanStack adds complexity; simple tables sufficient for admin lists |
| Prisma Client Extension | PostgreSQL triggers | Extensions keep audit logic in app layer; triggers better for multi-app DBs |
| Vercel Cron | GitHub Actions | Vercel native for deployment; GitHub Actions free but external |

**Installation:**
```bash
# No new dependencies required - using existing stack
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(main)/admin/           # Admin section (requires role check)
│   ├── layout.tsx              # Admin layout with tabs
│   ├── page.tsx                # Redirect to /admin/members
│   ├── members/page.tsx        # Member management tab
│   ├── posts/page.tsx          # Post moderation tab
│   ├── comments/page.tsx       # Comment moderation tab
│   └── settings/page.tsx       # Community settings tab
├── lib/
│   ├── auth.ts                 # Extended with role in session
│   ├── permissions.ts          # NEW: Role hierarchy helpers
│   ├── admin-actions.ts        # NEW: Admin/moderation server actions
│   └── audit-actions.ts        # NEW: Audit log actions
├── components/
│   ├── admin/
│   │   ├── admin-tabs.tsx      # Tab navigation component
│   │   ├── member-table.tsx    # Member list with actions
│   │   ├── post-table.tsx      # Post list with actions
│   │   ├── comment-table.tsx   # Comment list with actions
│   │   ├── settings-form.tsx   # Community settings form
│   │   ├── ban-dialog.tsx      # Ban user modal
│   │   └── role-badge.tsx      # Owner/Admin/Mod badge
│   └── layout/
│       ├── header.tsx          # Add admin link (conditional)
│       └── sidebar.tsx         # Add admin link (conditional)
```

### Pattern 1: Role Extension in NextAuth Session
**What:** Extend NextAuth types and callbacks to include user role in JWT and session
**When to use:** All authenticated requests that need role information
**Example:**
```typescript
// src/lib/auth.ts
// Source: https://authjs.dev/guides/role-based-access-control

// Type augmentation
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;  // Added
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: string;  // Added
  }
}

// In authOptions callbacks:
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      // Fetch role from database
      const dbUser = await db.user.findUnique({
        where: { id: user.id },
        select: { role: true },
      });
      token.role = dbUser?.role ?? 'member';
    }
    // Handle role updates (force refresh)
    if (trigger === 'update') {
      const dbUser = await db.user.findUnique({
        where: { id: token.id },
        select: { role: true },
      });
      token.role = dbUser?.role ?? 'member';
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id;
      session.user.role = token.role;
    }
    return session;
  },
}
```

### Pattern 2: Role Hierarchy Permission Helpers
**What:** Centralized permission checking functions for role hierarchy
**When to use:** Any action that requires role-based authorization
**Example:**
```typescript
// src/lib/permissions.ts

export const ROLE_HIERARCHY = {
  owner: 4,
  admin: 3,
  moderator: 2,
  member: 1,
} as const;

export type Role = keyof typeof ROLE_HIERARCHY;

export function canManageRole(actorRole: Role, targetRole: Role): boolean {
  return ROLE_HIERARCHY[actorRole] > ROLE_HIERARCHY[targetRole];
}

export function canModerateContent(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.moderator;
}

export function canManageMembers(role: Role): boolean {
  return ROLE_HIERARCHY[role] >= ROLE_HIERARCHY.admin;
}

export function canEditSettings(role: Role): boolean {
  return role === 'owner';
}

export function canAssignRole(actorRole: Role, newRole: Role): boolean {
  // Owner can assign any role
  if (actorRole === 'owner') return true;
  // Admin can only assign/remove moderator
  if (actorRole === 'admin' && newRole === 'moderator') return true;
  return false;
}
```

### Pattern 3: Admin Server Actions with Audit Logging
**What:** Server actions that perform admin operations and log to audit table
**When to use:** All moderation and member management operations
**Example:**
```typescript
// src/lib/admin-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { canModerateContent, canManageMembers, Role } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit-actions';

export async function deletePostAsAdmin(postId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const userRole = session.user.role as Role;
  if (!canModerateContent(userRole)) {
    return { error: 'Not authorized' };
  }

  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true, authorId: true, content: true },
  });

  if (!post) return { error: 'Post not found' };

  // Delete post (hard delete per CONTEXT.md)
  await db.post.delete({ where: { id: postId } });

  // Log audit event
  await logAuditEvent({
    actorId: session.user.id,
    action: 'POST_DELETED',
    targetType: 'post',
    targetId: postId,
    targetOwnerId: post.authorId,
    metadata: { reason: 'Admin moderation' },
  });

  // TODO: Notify author (Phase scope includes notification)

  revalidatePath('/feed');
  return { success: true };
}
```

### Pattern 4: Audit Log Table and Actions
**What:** Database table and actions for tracking moderation events
**When to use:** All admin actions that modify content or member status
**Example:**
```typescript
// Prisma schema addition
model AuditLog {
  id           String   @id @default(cuid())
  actorId      String   // Who performed the action
  action       String   // 'POST_DELETED', 'COMMENT_EDITED', 'MEMBER_BANNED', etc.
  targetType   String   // 'post', 'comment', 'user'
  targetId     String   // ID of affected resource
  targetOwnerId String? // User who owned the resource (for notifications)
  metadata     Json?    // Additional context (ban reason, edit details)
  createdAt    DateTime @default(now())

  actor        User     @relation(fields: [actorId], references: [id])

  @@index([actorId])
  @@index([targetType, targetId])
  @@index([createdAt])
}

// src/lib/audit-actions.ts
export async function logAuditEvent(event: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  targetOwnerId?: string;
  metadata?: Record<string, unknown>;
}) {
  return db.auditLog.create({
    data: {
      actorId: event.actorId,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      targetOwnerId: event.targetOwnerId,
      metadata: event.metadata ?? {},
    },
  });
}
```

### Pattern 5: Ban Model with Expiry
**What:** Database model for tracking user bans with expiry dates
**When to use:** Temporary user restrictions
**Example:**
```typescript
// Prisma schema
model Ban {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  reason     String   @db.VarChar(500)
  expiresAt  DateTime @db.Timestamptz(3)
  bannedById String
  bannedBy   User     @relation("BannedBy", fields: [bannedById], references: [id])
  createdAt  DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}

// Checking if user is banned (in auth or middleware)
async function isUserBanned(userId: string): Promise<{ banned: boolean; reason?: string; expiresAt?: Date }> {
  const ban = await db.ban.findFirst({
    where: {
      userId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { expiresAt: 'desc' },
  });

  if (ban) {
    return { banned: true, reason: ban.reason, expiresAt: ban.expiresAt };
  }
  return { banned: false };
}
```

### Anti-Patterns to Avoid
- **Inline permission checks:** Don't scatter `if (role === 'admin')` throughout code; use centralized permission helpers
- **Soft deletes for moderated content:** CONTEXT.md specifies hard delete; don't implement soft delete
- **Client-side only auth:** Always verify permissions server-side in actions, not just in UI
- **Role stored only in session:** Role changes require session refresh; store in DB and sync
- **No audit trail:** Every admin action must be logged for accountability

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session role sync | Custom role refresh | NextAuth `trigger: 'update'` | Built-in session refresh mechanism |
| Pagination | Custom pagination logic | Existing `Pagination` component | Already implemented in codebase |
| File uploads | Custom upload logic | Existing `uploadAvatar` pattern | Already working with Supabase Storage |
| Tab navigation | Custom tab state | URL params with Link components | Server components, shareable URLs |
| Confirmation dialogs | Custom modal system | `useState` pattern from CategoryList | Existing pattern works well |

**Key insight:** The codebase already has patterns for admin pages (categories, events), pagination, file uploads, and confirmation dialogs. Reuse these patterns rather than introducing new approaches.

## Common Pitfalls

### Pitfall 1: Role Changes Not Reflected in Session
**What goes wrong:** User's role is updated in database but JWT session still has old role
**Why it happens:** JWT is only created at login; role changes don't automatically sync
**How to avoid:** Use NextAuth's `update()` function to trigger session refresh after role changes
**Warning signs:** Admin demotes user but they still have admin access until logout

### Pitfall 2: Missing Server-Side Permission Checks
**What goes wrong:** Malicious user bypasses UI and calls server actions directly
**Why it happens:** Permission check only in React component, not in server action
**How to avoid:** Always check permissions at the start of every server action
**Warning signs:** Actions work when manually calling fetch even without proper role

### Pitfall 3: Cascade Deletes Not Handled
**What goes wrong:** Deleting a banned user's content fails due to foreign key constraints
**Why it happens:** Posts/comments have relations to user, need proper cascade setup
**How to avoid:** Ensure Prisma schema has `onDelete: Cascade` on relevant relations
**Warning signs:** "Foreign key constraint failed" errors during moderation

### Pitfall 4: Ban Expiry Not Checked
**What goes wrong:** Expired bans still prevent user access
**Why it happens:** Ban check doesn't compare against current time
**How to avoid:** Always include `expiresAt: { gt: new Date() }` in ban queries
**Warning signs:** Users report being banned after ban should have expired

### Pitfall 5: Audit Log Bloat
**What goes wrong:** Audit log table grows unbounded, slowing queries
**Why it happens:** No retention policy, logging too much detail
**How to avoid:** Set reasonable retention (90 days), index on createdAt, prune old records
**Warning signs:** Admin audit log page loads slowly after months of use

## Code Examples

Verified patterns from official sources and existing codebase:

### Admin Layout with Tabs
```typescript
// src/app/(main)/admin/layout.tsx
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { AdminTabs } from '@/components/admin/admin-tabs';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  // Only owner, admin, moderator can access /admin
  if (!user?.role || user.role === 'member') {
    redirect('/feed?error=unauthorized');
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Manage community content and members
        </p>
      </div>

      <AdminTabs userRole={user.role} />

      {children}
    </div>
  );
}
```

### Admin Tabs Component
```typescript
// src/components/admin/admin-tabs.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'members', label: 'Members', href: '/admin/members', minRole: 'admin' },
  { id: 'posts', label: 'Posts', href: '/admin/posts', minRole: 'moderator' },
  { id: 'comments', label: 'Comments', href: '/admin/comments', minRole: 'moderator' },
  { id: 'settings', label: 'Settings', href: '/admin/settings', minRole: 'owner' },
] as const;

const ROLE_LEVEL = { owner: 4, admin: 3, moderator: 2, member: 1 };

export function AdminTabs({ userRole }: { userRole: string }) {
  const pathname = usePathname();

  const visibleTabs = TABS.filter(
    (tab) => ROLE_LEVEL[userRole as keyof typeof ROLE_LEVEL] >= ROLE_LEVEL[tab.minRole]
  );

  return (
    <div className="flex gap-1 p-1 bg-muted rounded-lg">
      {visibleTabs.map((tab) => (
        <Link
          key={tab.id}
          href={tab.href}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-md transition-colors',
            pathname.startsWith(tab.href)
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
```

### Ban User Action
```typescript
// src/lib/admin-actions.ts
export async function banUser(
  userId: string,
  data: { reason: string; durationDays: 1 | 7 | 30 }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: 'Not authenticated' };

  const actorRole = session.user.role as Role;
  if (!canManageMembers(actorRole)) {
    return { error: 'Not authorized' };
  }

  const targetUser = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!targetUser) return { error: 'User not found' };

  // Cannot ban users at same or higher level
  if (!canManageRole(actorRole, targetUser.role as Role)) {
    return { error: 'Cannot ban user with equal or higher role' };
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + data.durationDays);

  await db.$transaction(async (tx) => {
    // Create ban record
    await tx.ban.create({
      data: {
        userId,
        reason: data.reason,
        expiresAt,
        bannedById: session.user.id,
      },
    });

    // Delete user's content (hard delete per CONTEXT.md)
    await tx.comment.deleteMany({ where: { authorId: userId } });
    await tx.post.deleteMany({ where: { authorId: userId } });

    // Log audit event
    await tx.auditLog.create({
      data: {
        actorId: session.user.id,
        action: 'MEMBER_BANNED',
        targetType: 'user',
        targetId: userId,
        targetOwnerId: userId,
        metadata: {
          reason: data.reason,
          durationDays: data.durationDays,
          expiresAt: expiresAt.toISOString(),
        },
      },
    });
  });

  revalidatePath('/admin/members');
  return { success: true };
}
```

### Role Badge Component
```typescript
// src/components/admin/role-badge.tsx
import { cn } from '@/lib/utils';

const ROLE_STYLES = {
  owner: 'bg-amber-100 text-amber-800 border-amber-200',
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  moderator: 'bg-blue-100 text-blue-800 border-blue-200',
  member: 'bg-gray-100 text-gray-800 border-gray-200',
} as const;

const ROLE_LABELS = {
  owner: 'Owner',
  admin: 'Admin',
  moderator: 'Mod',
  member: 'Member',
} as const;

export function RoleBadge({
  role,
  showMember = false
}: {
  role: string;
  showMember?: boolean;
}) {
  // Don't show member badge unless explicitly requested
  if (role === 'member' && !showMember) return null;

  const style = ROLE_STYLES[role as keyof typeof ROLE_STYLES] ?? ROLE_STYLES.member;
  const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? 'Member';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border',
        style
      )}
    >
      {label}
    </span>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Middleware-only auth | Middleware + server action checks | 2024 | Defense in depth required |
| Prisma middleware | Prisma Client Extensions | Prisma 4.16+ | Type-safe, chainable |
| Custom cron for bans | Check on access + optional cleanup cron | Current | Simpler, real-time checking |

**Deprecated/outdated:**
- Prisma middleware (deprecated in favor of Client Extensions)
- Using `unstable_cache` for session data (use proper session management)

## Open Questions

Things that couldn't be fully resolved:

1. **Notification Delivery Mechanism**
   - What we know: CONTEXT.md requires in-app notification when content is moderated
   - What's unclear: Whether to poll or use real-time (WebSocket/SSE)
   - Recommendation: Start with polling (simpler), upgrade to real-time if needed later. Create `Notification` table, poll on page load.

2. **Audit Log Retention**
   - What we know: Need audit log for accountability
   - What's unclear: Exact retention period, whether to archive or delete
   - Recommendation: 90-day retention with periodic cleanup cron. Store enough detail to reconstruct what happened.

3. **Ban Expiry Processing**
   - What we know: Bans have expiry dates (1, 7, 30 days)
   - What's unclear: Whether to actively process expirations or check on access
   - Recommendation: Check on access (query includes `expiresAt: { gt: new Date() }`). Optional: daily cleanup cron to delete expired ban records.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns (auth.ts, post-actions.ts, category-list.tsx, members page)
- [Auth.js RBAC Guide](https://authjs.dev/guides/role-based-access-control) - Role in JWT/session
- [Prisma Client Extensions](https://www.prisma.io/docs/orm/prisma-client/client-extensions) - Query interception

### Secondary (MEDIUM confidence)
- [Next.js Role-Based Routing Discussion](https://github.com/vercel/next.js/discussions/81357) - Middleware patterns
- [NextAuth Role in Session FAQ](https://next-auth.js.org/faq) - Session strategy considerations
- [Prisma Audit Trail Guide](https://medium.com/@arjunlall/prisma-audit-trail-guide-for-postgres-5b09aaa9f75a) - Audit log patterns

### Tertiary (LOW confidence)
- [TanStack Table Pagination](https://tanstack.com/table/latest/docs/guide/pagination) - Could not fetch, but codebase already has simpler pagination
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs) - For optional ban cleanup

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing stack, well-documented patterns
- Architecture: HIGH - Based on existing codebase patterns and official docs
- Pitfalls: MEDIUM - Based on common patterns, some specific to this use case
- Code examples: HIGH - Based on existing codebase and official documentation

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain)
