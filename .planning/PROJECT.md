# Community Platform

## What This Is

A Skool-clone community platform for hosting a single paid community with discussion feeds, courses, events, and gamification. Built to own the platform rather than pay monthly SaaS fees. Members sign up with email/password, complete mock payment for access, and can then engage with posts, enroll in courses, view events, and compete on leaderboards.

## Core Value

Members can engage with content, learn through courses, attend events, and earn points — the full Skool experience on a self-owned platform.

## Current Milestone: Planning v1.2

**Goal:** TBD — run `/gsd:new-milestone` to define next milestone goals.

**Shipped in v1.1:**
- Global search across posts, members, and courses
- Search results page with type-filtered results
- Cmd+K keyboard shortcut for quick access

## Requirements

### Validated

- ✓ User authentication (email/password, password reset via email) — v1.0
- ✓ Member registration with mock payment flow — v1.0
- ✓ Discussion feed with posts, likes, comments — v1.0
- ✓ Rich content posts with embeds (YouTube, Vimeo, Loom) — v1.0
- ✓ Post categories with admin management — v1.0
- ✓ Classroom with courses, modules, lessons — v1.0
- ✓ Lesson progress tracking and completion — v1.0
- ✓ Calendar with events and timezone support — v1.0
- ✓ Gamification with points and 10 levels — v1.0
- ✓ Member leaderboards with PostgreSQL RANK() — v1.0
- ✓ Member directory with pagination — v1.0
- ✓ Role-based access (Owner, Admin, Moderator, Member) — v1.0
- ✓ Community settings (name, description, logo) — v1.0
- ✓ Global search with PostgreSQL FTS, ranked results, highlighted snippets — v1.1
- ✓ Search results page with type filtering (All/Posts/Members/Courses) — v1.1
- ✓ Cmd+K keyboard shortcut for search access — v1.1

### Active

- [ ] In-app notifications for activity
- [ ] Email notifications for important events
- [ ] Nested/threaded comments
- [ ] Multiple reaction types (beyond like)
- [ ] Real Stripe payment integration

### Out of Scope

- Multi-community support — single community only, simplifies architecture
- OAuth login (Google, GitHub) — email/password sufficient for v1
- Mobile app — web-first approach
- Real-time chat — not core to community value
- Video hosting — use embeds (YouTube, Vimeo, Loom)
- Event RSVPs — skipped per user decision (events are display-only)
- Badges/achievements — gamification bonus, defer to v2+
- Content unlocking by level — gamification bonus, defer to v2+

## Context

**Current state:** Shipped v1.1 with 33,107 LOC TypeScript. Global search fully operational with PostgreSQL FTS.

**Tech stack:** Next.js 16, React 19, TypeScript, Tailwind v4, Prisma 7, Supabase PostgreSQL, NextAuth v4, Tiptap editor, Zustand, TanStack Query, Resend, bcryptjs.

**Target user:** Community owner wanting Skool-like features without monthly SaaS fees.

**Prior art:** Skool.com — this replicates core Skool functionality.

**Blueprint reference:** `PROJECT_BLUEPRINT.md` contains detailed technical specifications including database schema with 20+ models, API endpoints, and route structure.

## Constraints

- **Tech stack**: Next.js 16, React 19, TypeScript, Tailwind v4, Prisma 7, Supabase (PostgreSQL), NextAuth v4, Zustand, TanStack Query, Resend, bcryptjs — locked, no alternatives
- **Single tenant**: One community only, no multi-tenant complexity
- **Payments**: Mock implementation shipped, real Stripe integration deferred to v1.1+

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Single community architecture | Building for own use, not SaaS | ✓ Good — simplified all queries and UI |
| Mock payments first | Get core features working before payment integration | ✓ Good — validated full flow |
| Email/password only auth | Simplest path, OAuth can come later | ✓ Good — works well |
| Embeds over uploads for video | Avoid storage/bandwidth costs | ✓ Good — YouTube/Vimeo/Loom work great |
| CSS-first Tailwind v4 config | Using @theme directive | ✓ Good — clean config |
| Server Components by default | Only add 'use client' when hooks needed | ✓ Good — optimal performance |
| JWT session strategy | Required for NextAuth credentials provider | ✓ Good — works well |
| Tiptap for rich text | Extensible editor with video embed support | ✓ Good — powerful and flexible |
| Points on author (not liker) | Incentivizes content creation | ✓ Good — proper game design |
| No point deduction | Permanent awards, no negative engagement | ✓ Good — prevents gaming |
| PostgreSQL RANK() | Window functions for accurate leaderboard ties | ✓ Good — handles ties properly |
| Inline confirmations | Two-click delete without modals | ✓ Good — faster UX |
| URL-based state | Shareable/bookmarkable filters and tabs | ✓ Good — proper web patterns |
| Skip RSVP for events | Events are display-only per user decision | ✓ Good — reduced scope |
| PostgreSQL FTS over external search | Built into Supabase, no external service needed | ✓ Good — 90ms queries |
| GENERATED ALWAYS AS for tsvector | Vectors auto-update, no trigger maintenance | ✓ Good — automatic sync |
| Extract plainText on write | Compute once, not on every search | ✓ Good — efficient indexing |
| Limit search to 50 results | Prevents over-fetching, keeps response fast | ✓ Good — fast UX |
| URL-based search state | Shareable/bookmarkable search results | ✓ Good — proper web patterns |

---
*Last updated: 2026-01-24 after v1.1 milestone*
