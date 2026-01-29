# Architecture Research

**Domain:** Community Platform (Skool-style)
**Researched:** 2026-01-22
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
+-----------------------------------------------------------------------+
|                           CLIENT LAYER                                 |
|  +------------------+  +------------------+  +------------------+      |
|  |   Feed UI        |  |   Classroom UI   |  |   Calendar UI    |      |
|  |   (Posts/Comments|  |   (Courses/      |  |   (Events/       |      |
|  |    Reactions)    |  |    Lessons)      |  |    RSVPs)        |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
+-----------------------------------------------------------------------+
            |                     |                     |
            v                     v                     v
+-----------------------------------------------------------------------+
|                        PRESENTATION LAYER                              |
|  +------------------------------------------------------------------+ |
|  |                    Next.js App Router                             | |
|  |  +------------+  +------------+  +------------+  +------------+   | |
|  |  | Layouts    |  | Pages      |  | Loading    |  | Error      |   | |
|  |  | (Root,     |  | (Route     |  | States     |  | Boundaries |   | |
|  |  |  Nested)   |  |  Segments) |  |            |  |            |   | |
|  |  +------------+  +------------+  +------------+  +------------+   | |
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
            |
            v
+-----------------------------------------------------------------------+
|                         DATA ACCESS LAYER                              |
|  +------------------+  +------------------+  +------------------+      |
|  |  Server Actions  |  |  Route Handlers  |  |  Server         |      |
|  |  (Mutations)     |  |  (Webhooks/      |  |  Components     |      |
|  |                  |  |   External APIs) |  |  (Data Fetch)   |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
|           +----------+----------+----------+----------+                |
|                      |                     |                           |
|              +-------v-------+     +-------v-------+                   |
|              |   Prisma ORM  |     |   NextAuth    |                   |
|              |   (Data Layer)|     |   (Auth)      |                   |
|              +-------+-------+     +-------+-------+                   |
+-----------------------------------------------------------------------+
            |                               |
            v                               v
+-----------------------------------------------------------------------+
|                        PERSISTENCE LAYER                               |
|  +------------------------------------------------------------------+ |
|  |                   Supabase PostgreSQL                             | |
|  |  +----------+  +----------+  +----------+  +----------+           | |
|  |  | Users    |  | Posts    |  | Courses  |  | Events   |           | |
|  |  | Accounts |  | Comments |  | Lessons  |  | RSVPs    |           | |
|  |  | Sessions |  | Reactions|  | Progress |  |          |           | |
|  |  +----------+  +----------+  +----------+  +----------+           | |
|  |  +----------+  +----------+                                       | |
|  |  | Points   |  | Levels   |                                       | |
|  |  | (Gamif.) |  |          |                                       | |
|  |  +----------+  +----------+                                       | |
|  +------------------------------------------------------------------+ |
+-----------------------------------------------------------------------+
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Feed Module** | Discussion posts, comments, reactions, categories | Server Components for list, Client Components for interactions |
| **Classroom Module** | Course structure, lessons, video embeds, progress tracking | Server Components with streaming for content |
| **Calendar Module** | Events, RSVPs, reminders, external calendar sync | Server Actions for mutations, Route Handlers for webhooks |
| **Gamification Module** | Points calculation, levels, leaderboards | Database triggers or Server Actions on engagement events |
| **Auth Module** | Session management, protected routes, user profiles | NextAuth v4 with Prisma adapter |
| **Shared UI** | Common components, layouts, navigation | Atomic design pattern in `/components` |

## Recommended Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group (no layout inheritance)
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/                   # Main app route group (shared layout)
│   │   ├── layout.tsx            # Main layout with nav, sidebar
│   │   ├── page.tsx              # Home/Feed page
│   │   ├── feed/
│   │   │   ├── page.tsx          # Discussion feed
│   │   │   └── [postId]/page.tsx # Single post view
│   │   ├── classroom/
│   │   │   ├── page.tsx          # Course list
│   │   │   └── [courseId]/
│   │   │       ├── page.tsx      # Course overview
│   │   │       └── [lessonId]/page.tsx
│   │   ├── calendar/
│   │   │   ├── page.tsx          # Events calendar
│   │   │   └── [eventId]/page.tsx
│   │   ├── leaderboard/page.tsx  # Gamification leaderboard
│   │   └── settings/page.tsx     # User settings
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts  # NextAuth handler
│   │   └── webhooks/                     # External webhooks
│   │       └── calendar/route.ts
│   ├── layout.tsx                # Root layout
│   └── error.tsx                 # Global error boundary
├── components/
│   ├── ui/                       # Primitive UI components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   └── input.tsx
│   ├── feed/                     # Feed-specific components
│   │   ├── post-card.tsx
│   │   ├── post-form.tsx
│   │   ├── comment-list.tsx
│   │   └── reaction-bar.tsx
│   ├── classroom/                # Classroom-specific components
│   │   ├── course-card.tsx
│   │   ├── lesson-player.tsx
│   │   └── progress-bar.tsx
│   ├── calendar/                 # Calendar-specific components
│   │   ├── event-card.tsx
│   │   ├── calendar-grid.tsx
│   │   └── rsvp-button.tsx
│   ├── gamification/             # Gamification components
│   │   ├── points-display.tsx
│   │   ├── level-badge.tsx
│   │   └── leaderboard-row.tsx
│   └── layout/                   # Layout components
│       ├── header.tsx
│       ├── sidebar.tsx
│       └── mobile-nav.tsx
├── lib/
│   ├── db.ts                     # Prisma client instance
│   ├── auth.ts                   # NextAuth configuration
│   ├── utils.ts                  # Shared utilities
│   └── validators/               # Zod schemas
│       ├── post.ts
│       ├── course.ts
│       └── event.ts
├── actions/                      # Server Actions
│   ├── feed.ts                   # Post/comment mutations
│   ├── classroom.ts              # Course/lesson mutations
│   ├── calendar.ts               # Event/RSVP mutations
│   └── gamification.ts           # Points/level updates
├── hooks/                        # Custom React hooks
│   ├── use-posts.ts
│   ├── use-optimistic-reaction.ts
│   └── use-course-progress.ts
├── types/                        # TypeScript types
│   └── index.ts
└── prisma/
    └── schema.prisma             # Database schema
```

### Structure Rationale

- **`app/(auth)/` and `app/(main)/`:** Route groups separate authenticated layouts from auth pages without affecting URLs. The main group shares navigation/sidebar; auth pages have minimal layout.
- **`components/` by feature:** Components organized by domain (feed, classroom, calendar) rather than type (buttons, cards). Easier to find related components.
- **`actions/` separate from `app/`:** Server Actions in dedicated folder for reusability across multiple routes and easier testing.
- **`lib/validators/`:** Zod schemas colocated for consistent validation across Server Actions and forms.
- **`hooks/`:** Client-side hooks for real-time updates, optimistic UI, and complex state.

## Architectural Patterns

### Pattern 1: Server Components for Data, Client Components for Interactivity

**What:** Fetch data in Server Components, pass to Client Components only when interactivity is needed.
**When to use:** Always. This is the default pattern for App Router.
**Trade-offs:** Requires careful planning of component boundaries; some client-side libraries may need wrappers.

**Example:**
```typescript
// app/(main)/feed/page.tsx (Server Component)
import { db } from '@/lib/db'
import { PostList } from '@/components/feed/post-list'

export default async function FeedPage() {
  const posts = await db.post.findMany({
    include: { author: true, reactions: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
  })

  return <PostList initialPosts={posts} />
}

// components/feed/post-list.tsx (Client Component)
'use client'
import { useState, useOptimistic } from 'react'
import { PostCard } from './post-card'

export function PostList({ initialPosts }) {
  const [posts, setPosts] = useState(initialPosts)
  // Client-side state for infinite scroll, optimistic updates, etc.

  return (
    <div>
      {posts.map(post => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
```

### Pattern 2: Server Actions for Mutations with Optimistic Updates

**What:** Use Server Actions for all data mutations, with `useOptimistic` for instant UI feedback.
**When to use:** Any create/update/delete operation where user expects immediate response.
**Trade-offs:** Requires careful error handling to revert optimistic state on failure.

**Example:**
```typescript
// actions/feed.ts
'use server'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { postSchema } from '@/lib/validators/post'

export async function createPost(formData: FormData) {
  const validated = postSchema.parse({
    content: formData.get('content'),
    categoryId: formData.get('categoryId'),
  })

  const post = await db.post.create({
    data: {
      ...validated,
      authorId: getCurrentUserId(), // from auth context
    },
  })

  // Award points for posting
  await awardPoints(post.authorId, 'CREATE_POST', 5)

  revalidatePath('/feed')
  return post
}

// components/feed/post-form.tsx
'use client'
import { useOptimistic, useTransition } from 'react'
import { createPost } from '@/actions/feed'

export function PostForm({ onPostCreated }) {
  const [isPending, startTransition] = useTransition()

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPost(formData)
      onPostCreated?.(result)
    })
  }

  return (
    <form action={handleSubmit}>
      <textarea name="content" disabled={isPending} />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Posting...' : 'Post'}
      </button>
    </form>
  )
}
```

### Pattern 3: Parallel Data Fetching with Suspense

**What:** Fetch multiple independent data sources in parallel, wrapped in Suspense boundaries.
**When to use:** Pages that need data from multiple sources (e.g., feed + user stats + events).
**Trade-offs:** More Suspense boundaries mean more loading states to design.

**Example:**
```typescript
// app/(main)/page.tsx
import { Suspense } from 'react'
import { FeedSection } from '@/components/feed/feed-section'
import { UpcomingEvents } from '@/components/calendar/upcoming-events'
import { UserStats } from '@/components/gamification/user-stats'

export default function HomePage() {
  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <Suspense fallback={<FeedSkeleton />}>
          <FeedSection />
        </Suspense>
      </div>
      <aside>
        <Suspense fallback={<StatsSkeleton />}>
          <UserStats />
        </Suspense>
        <Suspense fallback={<EventsSkeleton />}>
          <UpcomingEvents />
        </Suspense>
      </aside>
    </div>
  )
}
```

### Pattern 4: Points-Based Gamification as Side Effect

**What:** Award points as side effects of primary actions, calculated via database triggers or post-action calls.
**When to use:** Any engagement action (post, comment, reaction, course completion).
**Trade-offs:** Must ensure atomicity; consider using database triggers for consistency.

**Example:**
```typescript
// lib/gamification.ts
export const POINT_VALUES = {
  CREATE_POST: 5,
  CREATE_COMMENT: 2,
  RECEIVE_REACTION: 1,
  COMPLETE_LESSON: 10,
  ATTEND_EVENT: 15,
} as const

export const LEVEL_THRESHOLDS = [
  { level: 1, minPoints: 0 },
  { level: 2, minPoints: 50 },
  { level: 3, minPoints: 150 },
  { level: 4, minPoints: 400 },
  { level: 5, minPoints: 800 },
  // ... more levels
]

// actions/gamification.ts
'use server'
export async function awardPoints(
  userId: string,
  action: keyof typeof POINT_VALUES,
  points?: number
) {
  const pointValue = points ?? POINT_VALUES[action]

  const user = await db.user.update({
    where: { id: userId },
    data: {
      points: { increment: pointValue },
    },
  })

  // Check for level up
  const newLevel = calculateLevel(user.points)
  if (newLevel > user.level) {
    await db.user.update({
      where: { id: userId },
      data: { level: newLevel },
    })
    // Could trigger notification here
  }

  return user
}
```

## Data Flow

### Request Flow

```
[User Action] (e.g., creates post)
    |
    v
[Client Component] --form action--> [Server Action]
    |                                     |
    | (optimistic update)                 v
    v                               [Validation] (Zod)
[UI Update]                               |
    |                                     v
    |                               [Prisma Query]
    |                                     |
    |                                     v
    |                               [PostgreSQL]
    |                                     |
    |                                     v
    |                               [Gamification Side Effect]
    |                                     |
    |                                     v
    |                               [revalidatePath]
    |                                     |
    +<------------------------------------+
    |
    v
[Server Re-render] --> [Updated UI]
```

### State Management

```
+------------------+     +-----------------+     +------------------+
|   Server State   |     |  URL State      |     |   Client State   |
|   (Database)     |     |  (searchParams) |     |   (React State)  |
+--------+---------+     +--------+--------+     +--------+---------+
         |                        |                       |
         v                        v                       v
+------------------------------------------------------------------------+
|                         Component Tree                                  |
|   +------------------+  +------------------+  +------------------+      |
|   | Server Component |  | Server Component |  | Client Component |      |
|   | (fetches data)   |  | (reads params)   |  | (local state)    |      |
|   +------------------+  +------------------+  +------------------+      |
+------------------------------------------------------------------------+
```

### Key Data Flows

1. **Feed Loading:** Server Component fetches posts with Prisma -> passes to Client Component for interaction -> Client uses optimistic updates for reactions/comments.

2. **Course Progress:** User completes lesson -> Server Action updates progress + awards points -> revalidates course page -> UI reflects completion + new point total.

3. **Event RSVP:** User RSVPs -> Server Action creates RSVP record -> triggers calendar sync (via webhook if external) -> awards attendance points -> revalidates calendar.

4. **Real-time Leaderboard:** Points updated via Server Action -> React Query/SWR on client polls for fresh data -> or use Supabase Realtime for push updates.

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolith is fine. Single Supabase instance, no caching layer. Focus on getting features right. |
| 1k-10k users | Add Redis for session caching and rate limiting. Implement pagination cursors instead of offset. Add indexes to hot queries. |
| 10k-100k users | Consider read replicas for heavy read operations (feed, leaderboard). Add CDN for static assets. Implement feed caching with invalidation. |
| 100k+ users | Evaluate event-driven architecture for gamification. Consider separate services for real-time features. Fan-out pattern for feed delivery. |

### Scaling Priorities

1. **First bottleneck: Feed queries.** The feed page hits the database hard with joins (posts + authors + reactions + comment counts). Fix with: pagination cursors, strategic indexes, denormalized counts, optional caching.

2. **Second bottleneck: Real-time features.** If adding live updates to feed/leaderboard, WebSockets don't scale well with serverless. Fix with: Supabase Realtime, polling with SWR/React Query, or external service like Pusher.

3. **Third bottleneck: Media handling.** Video content for classroom module. Fix from day one: use external video hosting (Mux, Cloudinary, or YouTube embeds). Don't self-host video.

## Anti-Patterns

### Anti-Pattern 1: Putting Business Logic in Client Components

**What people do:** Calculating points, validating complex rules, or making authorization decisions in Client Components.
**Why it's wrong:** Logic can be bypassed, bundle size increases, inconsistent behavior between server/client.
**Do this instead:** All business logic in Server Actions or Server Components. Client Components only handle UI state and call server functions.

### Anti-Pattern 2: One Giant Prisma Query

**What people do:** Fetching entire object graphs with deep includes for "convenience."
```typescript
// BAD
const posts = await db.post.findMany({
  include: {
    author: { include: { profile: true, settings: true } },
    comments: { include: { author: true, reactions: true } },
    reactions: { include: { user: true } },
    category: true,
  }
})
```
**Why it's wrong:** Over-fetching, slow queries, N+1 problems in disguise, memory pressure.
**Do this instead:** Fetch only what's needed. Use separate queries for different UI sections. Let Suspense handle the waterfall gracefully.

### Anti-Pattern 3: Mixing Auth Concerns with Data Fetching

**What people do:** Checking auth in every Server Action independently, leading to inconsistent protection.
**Why it's wrong:** Easy to forget auth check, inconsistent error handling, duplicated code.
**Do this instead:** Create wrapper functions that handle auth:
```typescript
// lib/auth.ts
export async function withAuth<T>(
  action: (userId: string) => Promise<T>
): Promise<T> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    throw new Error('Unauthorized')
  }
  return action(session.user.id)
}

// actions/feed.ts
export async function createPost(formData: FormData) {
  return withAuth(async (userId) => {
    // Now guaranteed to have userId
    return db.post.create({ data: { authorId: userId, ... } })
  })
}
```

### Anti-Pattern 4: Distributed Monolith Syndrome

**What people do:** Creating separate "microservices" for feed, classroom, calendar, gamification that share a database and call each other synchronously.
**Why it's wrong:** All the complexity of distributed systems with none of the benefits. Deployment coupling, network overhead, debugging nightmare.
**Do this instead:** Keep it a monolith until there's a clear, compelling reason to split. Modular monolith with clear boundaries is the right choice for this scale.

### Anti-Pattern 5: Over-Engineering Gamification

**What people do:** Building a generic "gamification engine" with configurable rules, badges, achievements, quests before launching.
**Why it's wrong:** Premature abstraction. You don't know what engagement patterns will work until you have users.
**Do this instead:** Start simple: points for actions, levels based on thresholds. Add badges/achievements only when you have data on what users actually do.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Supabase** | Direct via Prisma | Use Supabase PostgreSQL as data store; optionally use Supabase Realtime for live features |
| **Video Hosting (Mux/Cloudinary)** | Embed URLs stored in DB | Don't self-host video. Store embed URLs, use their players |
| **Calendar Sync (Google/Outlook)** | OAuth + Webhook route handlers | Use Route Handlers for webhook callbacks; store tokens encrypted |
| **Email (Resend/Sendgrid)** | Server Action side effects | Trigger emails after key events (welcome, event reminder, level up) |
| **Analytics (Posthog/Mixpanel)** | Client-side SDK + Server events | Track engagement on client, conversions on server |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Feed <-> Gamification | Function call in Server Action | Award points after post/comment/reaction created |
| Classroom <-> Gamification | Function call in Server Action | Award points after lesson/course completion |
| Calendar <-> Gamification | Function call in Server Action | Award points for event attendance |
| Auth <-> All modules | Middleware + Server Session | Middleware protects routes; Server Actions verify session |

## Build Order Implications

Based on component dependencies, suggested build order:

1. **Phase 1: Foundation**
   - Auth (NextAuth + Prisma adapter)
   - Database schema (all tables)
   - Root layout + navigation shell
   - User profile basics

   *Rationale: Everything depends on auth and data models. Build this first.*

2. **Phase 2: Core Engagement - Feed**
   - Posts (create, list, view)
   - Comments
   - Reactions
   - Categories

   *Rationale: Feed is the primary engagement loop. Classroom and Calendar can exist without feed, but feed drives daily engagement.*

3. **Phase 3: Learning - Classroom**
   - Courses (list, view)
   - Lessons with video embeds
   - Progress tracking

   *Rationale: Classroom depends on users existing. Can be built parallel to feed if team capacity allows.*

4. **Phase 4: Events - Calendar**
   - Events (create, list, view)
   - RSVPs
   - Calendar view
   - Optional: external sync

   *Rationale: Events are valuable but lower priority than feed/classroom for community launch.*

5. **Phase 5: Gamification Polish**
   - Points display throughout app
   - Levels with visual badges
   - Leaderboard page
   - Level-gated content unlocks

   *Rationale: Gamification enhances engagement but should layer on top of working core features. Start awarding points in Phase 2-4, but polish the gamification UI last.*

## Data Model Overview

```prisma
// Core tables for community platform

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  points        Int       @default(0)
  level         Int       @default(1)

  // Relations
  posts         Post[]
  comments      Comment[]
  reactions     Reaction[]
  courseProgress CourseProgress[]
  eventRSVPs    EventRSVP[]

  // Auth (NextAuth)
  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Post {
  id          String     @id @default(cuid())
  content     String
  authorId    String
  categoryId  String?

  author      User       @relation(fields: [authorId], references: [id])
  category    Category?  @relation(fields: [categoryId], references: [id])
  comments    Comment[]
  reactions   Reaction[]

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
}

model Course {
  id          String    @id @default(cuid())
  title       String
  description String?
  thumbnail   String?
  published   Boolean   @default(false)
  order       Int       @default(0)

  lessons     Lesson[]
  progress    CourseProgress[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Lesson {
  id          String    @id @default(cuid())
  title       String
  content     String?
  videoUrl    String?
  courseId    String
  order       Int       @default(0)

  course      Course    @relation(fields: [courseId], references: [id])

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Event {
  id          String    @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime?
  location    String?

  rsvps       EventRSVP[]

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

// Supporting tables: Category, Comment, Reaction,
// CourseProgress, EventRSVP, Account, Session, etc.
```

## Sources

**Official Documentation (HIGH confidence):**
- [Next.js App Router Project Structure](https://nextjs.org/docs/app/getting-started/project-structure)
- [Next.js Data Fetching Patterns](https://nextjs.org/docs/14/app/building-your-application/data-fetching/patterns)
- [Prisma Schema Overview](https://www.prisma.io/docs/orm/prisma-schema/overview)
- [NextAuth Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma)

**Industry Research (MEDIUM confidence):**
- [Next.js Folder Structure Best Practices 2026](https://www.codebydeep.com/blog/next-js-folder-structure-best-practices-for-scalable-applications-2026-guide)
- [Advanced Next.js Patterns for 2026](https://medium.com/@beenakumawat002/next-js-app-router-advanced-patterns-for-2026-server-actions-ppr-streaming-edge-first-b76b1b3dcac7)
- [Design Patterns for Scalable Next.js Applications](https://dev.to/nithya_iyer/5-design-patterns-for-building-scalable-nextjs-applications-1c80)
- [Designing a Scalable Gamification Engine](https://jasonzissman.medium.com/designing-a-scalable-gamification-engine-part-2-data-schema-fb2abfc4feb9)
- [Skool Platform Reviews](https://linodash.com/skool-review/) - Feature analysis
- [Software Architecture Anti-Patterns 2026](https://medium.com/@Adem_Korkmaz/software-architecture-anti-patterns-10-big-mistakes-we-somehow-still-make-in-2026-aeac8e0841f5)

---
*Architecture research for: Community Platform (Skool-style)*
*Researched: 2026-01-22*
