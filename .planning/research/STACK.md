# Stack Research

**Domain:** Community Platform (Skool-clone)
**Researched:** 2026-01-22
**Confidence:** MEDIUM-HIGH

> Stack is LOCKED. This research focuses on best practices, integration patterns, version compatibility, and anti-patterns for the specified technologies.

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended | Confidence |
|------------|---------|---------|-----------------|------------|
| Next.js | 16.x | Full-stack React framework | Turbopack default for 5x faster builds, React 19.2 integration, Cache Components for explicit caching, View Transitions for navigation animations. The 2026 standard for production React apps. | HIGH |
| React | 19.x | UI library | React Compiler (1.0 stable) auto-memoizes components. Server Components for zero-client-JS static parts. useEffectEvent() and Activity component for advanced patterns. | HIGH |
| Prisma | 7.x | Database ORM | 3x faster queries, 90% smaller bundles (1.6MB vs 14MB). Rust-free TypeScript architecture. Requires driver adapters - breaking change from v6. | HIGH |
| Supabase | Latest | PostgreSQL database + realtime | Managed PostgreSQL with connection pooling (Supavisor), realtime subscriptions, row-level security. Pairs well with Prisma for ORM + Supabase for auth/realtime. | HIGH |
| NextAuth | v4 | Authentication | Battle-tested with Prisma adapter. Handles sessions, JWT, and credentials auth. Note: v5 (Auth.js) exists but v4 is more stable with Prisma. | MEDIUM |
| Tailwind CSS | 4.x | Styling | CSS-first configuration (no tailwind.config.js needed). 5x faster full builds, 100x faster incremental. Design tokens as CSS variables. | HIGH |
| Zustand | Latest | Client state management | 30%+ YoY growth, 40% project adoption. Selective subscriptions prevent 40-70% more re-renders than Context. Perfect for UI state alongside TanStack Query for server state. | HIGH |
| TanStack Query | 5.x | Server state management | RSC-compatible with HydrationBoundary. Teams report 40-70% faster initial loads with hybrid RSC + Query pattern. Handles caching, deduping, background sync. | HIGH |
| Resend | Latest | Transactional email | Developer-first API, React Email components, simple domain verification. Clean integration with Next.js server actions. | HIGH |
| bcryptjs | Latest | Password hashing | Pure JavaScript bcrypt implementation. Works in all Node.js environments including serverless. Use for credentials-based auth with NextAuth. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @prisma/adapter-pg | Latest | Prisma PostgreSQL driver | REQUIRED for Prisma 7. Creates database connection with Pool. |
| pg | Latest | PostgreSQL client | REQUIRED for Prisma 7 adapter. Used internally by @prisma/adapter-pg. |
| @supabase/ssr | Latest | Supabase SSR utilities | Cookie-based auth for Server Components. Use for SSR authentication flows. |
| @supabase/supabase-js | Latest | Supabase client | Database operations, realtime subscriptions, storage. Use alongside Prisma. |
| @auth/prisma-adapter | Latest | NextAuth Prisma adapter | Stores auth data (users, sessions, tokens) in Prisma-managed tables. |
| @react-email/components | Latest | Email templates | Build email templates as React components. Use with Resend. |
| @tanstack/react-query-devtools | 5.x | Query debugging | Development only. Inspect cache, queries, mutations. |
| zod | Latest | Schema validation | Form validation, API input validation. Works with React 19 form actions. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Turbopack | Bundler | Default in Next.js 16. No configuration needed. |
| TypeScript | Type safety | Prisma 7 has 70% faster type checks. Use strict mode. |
| ESLint | Linting | Use Next.js ESLint config. Avoid putting Prisma output in src/. |
| Prisma Studio | Database GUI | New visual Studio in Prisma 7. Run with `npx prisma studio`. |

## Installation

```bash
# Core framework
npm install next@16 react@19 react-dom@19

# Database (Prisma 7 requires driver adapters)
npm install @prisma/client @prisma/adapter-pg pg
npm install -D prisma

# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Authentication
npm install next-auth@4 @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# Styling
npm install tailwindcss@4 @tailwindcss/postcss postcss

# State management
npm install zustand @tanstack/react-query

# Email
npm install resend @react-email/components

# Validation
npm install zod

# Dev dependencies
npm install -D typescript @types/node @types/react @types/react-dom
npm install -D @tanstack/react-query-devtools
```

## Integration Patterns

### Pattern 1: Prisma 7 + Supabase Connection Pooling

Prisma 7 requires driver adapters. For Supabase, use connection pooling via Supavisor.

**Environment Variables:**
```env
# Pooled connection for runtime (Supavisor on port 6543)
DATABASE_URL="postgres://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Direct connection for migrations (port 5432)
DIRECT_URL="postgres://postgres.[project]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

**prisma.config.mjs:**
```javascript
import { defineConfig, env } from 'prisma/config';
import 'dotenv/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

**prisma/schema.prisma:**
```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  // Connection URL now in prisma.config.mjs
}
```

**lib/prisma.ts (Singleton Pattern):**
```typescript
import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL!;

const prismaClientSingleton = () => {
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') {
  globalThis.prismaGlobal = prisma;
}
```

### Pattern 2: NextAuth v4 + Prisma + Credentials

**app/api/auth/[...nextauth]/route.ts:**
```typescript
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Required for credentials provider
  },
  pages: {
    signIn: '/login',
  },
});

export { handler as GET, handler as POST };
```

### Pattern 3: TanStack Query + Server Components (Hybrid Architecture)

**app/providers.tsx:**
```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 5 * 60 * 1000, // 5 minutes
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

**Server Component with Prefetch (app/feed/page.tsx):**
```typescript
import { dehydrate, HydrationBoundary, QueryClient } from '@tanstack/react-query';
import prisma from '@/lib/prisma';
import { FeedClient } from './feed-client';

async function getPosts() {
  return prisma.post.findMany({
    include: { author: true, likes: true, comments: true },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}

export default async function FeedPage() {
  const queryClient = new QueryClient();

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FeedClient />
    </HydrationBoundary>
  );
}
```

**Client Component (app/feed/feed-client.tsx):**
```typescript
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function FeedClient() {
  const queryClient = useQueryClient();

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: () => fetch('/api/posts').then(res => res.json()),
  });

  const likeMutation = useMutation({
    mutationFn: (postId: string) =>
      fetch(`/api/posts/${postId}/like`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  // Render posts with optimistic updates...
}
```

### Pattern 4: Zustand for UI State (Not Server State)

**stores/ui-store.ts:**
```typescript
import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeTab: 'feed' | 'classroom' | 'calendar';
  toggleSidebar: () => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeTab: 'feed',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
```

**Important:** Do NOT use Zustand in Server Components. It causes hydration issues and potential data leakage between users.

### Pattern 5: Resend Email with React Components

**emails/welcome.tsx:**
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';

interface WelcomeEmailProps {
  name: string;
}

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the community!</Preview>
      <Body style={{ fontFamily: 'sans-serif' }}>
        <Container>
          <Heading>Welcome, {name}!</Heading>
          <Text>
            You have successfully joined our community. Start exploring!
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
```

**lib/email.ts:**
```typescript
import { Resend } from 'resend';
import { WelcomeEmail } from '@/emails/welcome';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(email: string, name: string) {
  await resend.emails.send({
    from: 'Community <noreply@yourdomain.com>',
    to: email,
    subject: 'Welcome to the Community!',
    react: WelcomeEmail({ name }),
  });
}
```

### Pattern 6: Tailwind v4 Setup

**app/globals.css:**
```css
@import "tailwindcss";

/* Custom theme tokens (replaces tailwind.config.js) */
@theme {
  --color-primary: #6366f1;
  --color-secondary: #8b5cf6;
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  @theme {
    --color-background: #0a0a0a;
    --color-foreground: #fafafa;
  }
}
```

**postcss.config.mjs:**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

## What NOT to Do

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Prisma output in `src/` folder | Causes ESLint errors, clutters source | Use `output = "../generated/prisma"` |
| Prisma without singleton pattern | Creates connection pool exhaustion on hot reload | Use globalThis singleton pattern |
| `prisma-client` generator provider | Breaks Turbopack in Next.js 16 | Use `prisma-client-js` (works with Prisma 7) |
| Direct database URL for migrations | Migrations fail with connection pooling | Use DIRECT_URL (port 5432) for migrations |
| Zustand in Server Components | Causes hydration errors, data leakage | Use only in Client Components |
| Manual bcrypt in production | Security vulnerabilities if done wrong | Use bcryptjs with NextAuth Credentials |
| Customizing Prisma output path to node_modules | v7 changes this behavior | Always specify custom output path |
| Using prepared statements with Supavisor | Not supported in transaction mode | Add `?pgbouncer=true` to disable |
| Large connection_limit with serverless | Exhausts database connections | Start with `connection_limit=1` |
| MongoDB with Prisma 7 | Not supported yet | Use PostgreSQL or stay on Prisma 6 |
| Rolling your own auth | Security vulnerabilities, time waste | Use NextAuth with proven patterns |
| TanStack Query for ALL data fetching | Unnecessary for static/SSR data | Use Server Components for initial fetch, Query for client updates |

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| Next.js 16 | React 19.2 | Built-in React Compiler support |
| Prisma 7 | @prisma/adapter-pg + pg | Driver adapter REQUIRED |
| Prisma 7 | Node.js ESM only | Set `"type": "module"` in package.json |
| NextAuth v4 | @auth/prisma-adapter | Use JWT strategy with credentials |
| TanStack Query 5 | React 19 | Full RSC + Suspense support |
| Tailwind 4 | PostCSS | Use @tailwindcss/postcss plugin |
| Zustand | React 19 | Compatible, avoid in RSC |

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Prisma 7 | Drizzle ORM | If you need even lighter bundle or prefer SQL-first approach |
| NextAuth v4 | Auth.js v5 | If you need newer features and can handle migration complexity |
| NextAuth v4 | Supabase Auth | If you want tighter Supabase integration and don't need Prisma adapter |
| Zustand | Jotai | If you prefer atomic state model |
| TanStack Query | SWR | If you want simpler API for basic fetching |
| Resend | SendGrid/Postmark | If you need higher volume or enterprise features |
| bcryptjs | argon2 | If you need higher security (requires native bindings) |

## Sources

- [Next.js 16 Blog](https://nextjs.org/blog/next-16) - Official announcement (HIGH confidence)
- [Prisma 7 Release](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) - Official announcement (HIGH confidence)
- [Prisma 7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-7) - Official docs (HIGH confidence)
- [Prisma Next.js Help](https://www.prisma.io/docs/orm/more/help-and-troubleshooting/nextjs-help) - Official troubleshooting (HIGH confidence)
- [Supabase Prisma Integration](https://supabase.com/partners/integrations/prisma) - Official partner docs (HIGH confidence)
- [Supabase Connection Docs](https://supabase.com/docs/guides/database/connecting-to-postgres) - Official docs (HIGH confidence)
- [TanStack Query RSC Guide](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr) - Official docs (HIGH confidence)
- [Tailwind CSS v4 Blog](https://tailwindcss.com/blog/tailwindcss-v4) - Official announcement (HIGH confidence)
- [Resend Next.js Docs](https://resend.com/docs/send-with-nextjs) - Official docs (HIGH confidence)
- [Zustand GitHub](https://github.com/pmndrs/zustand) - Official repo (HIGH confidence)
- [Prisma 7 + Next.js 16 Turbopack Fix](https://www.buildwithmatija.com/blog/migrate-prisma-v7-nextjs-16-turbopack-fix) - Community guide (MEDIUM confidence)
- [State Management 2026 Patterns](https://www.nucamp.co/blog/state-management-in-2026-redux-context-api-and-modern-patterns) - Community analysis (MEDIUM confidence)

---
*Stack research for: Community Platform (Skool-clone)*
*Researched: 2026-01-22*
