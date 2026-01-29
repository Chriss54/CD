---
phase: 10-admin-moderation
plan: 01
subsystem: admin
tags: [roles, permissions, auth, admin-ui]

dependency-graph:
  requires: [02-authentication, 05-feed-engagement]
  provides: [role-hierarchy, permissions-helpers, audit-logging, admin-layout]
  affects: [10-02, 10-03, 10-04]

tech-stack:
  added: []
  patterns:
    - "Role hierarchy with numeric levels for comparison"
    - "Session augmentation for role access"
    - "Centralized permissions module"
    - "Audit logging with typed actions"

file-tracking:
  created:
    - prisma/schema.prisma (Ban, AuditLog, CommunitySettings models)
    - src/lib/permissions.ts
    - src/lib/audit-actions.ts
    - src/components/admin/role-badge.tsx
    - src/components/admin/admin-tabs.tsx
    - src/app/(main)/admin/layout.tsx
    - src/app/(main)/admin/page.tsx
    - src/app/(main)/admin/moderation/page.tsx
  modified:
    - src/lib/auth.ts
    - src/app/(main)/admin/categories/page.tsx
    - src/app/(main)/admin/courses/page.tsx
    - src/app/(main)/admin/courses/[courseId]/layout.tsx
    - src/app/(main)/admin/courses/[courseId]/lessons/[lessonId]/page.tsx
    - src/app/(main)/admin/events/page.tsx
    - src/app/(main)/admin/events/[eventId]/page.tsx

decisions:
  - id: "role-numeric-hierarchy"
    choice: "Numeric levels (owner=4, admin=3, mod=2, member=1) for role comparison"
    rationale: "Simple comparison logic, extensible for future roles"
  - id: "session-role-refresh"
    choice: "Refresh role from DB on session update trigger"
    rationale: "Ensures role changes take effect without requiring re-login"
  - id: "admin-layout-gating"
    choice: "Layout gates moderator+, pages gate admin+ where needed"
    rationale: "Single entry point for auth, granular per-page permissions"
  - id: "role-badge-member-hidden"
    choice: "RoleBadge returns null for member role"
    rationale: "Reduces visual clutter - only elevated roles shown"

metrics:
  duration: "4 min"
  completed: "2026-01-24"
---

# Phase 10 Plan 01: Role System Foundation Summary

**One-liner:** Role hierarchy (Owner > Admin > Moderator > Member) with permissions helpers, session integration, and admin layout.

## What Was Built

### Database Schema
- **Ban model**: Temporary user restrictions with reason, expiry, banned-by tracking
- **AuditLog model**: Action tracking with actor, target, type, and JSON details
- **CommunitySettings model**: Singleton for community configuration (name, welcome message, registration/posting toggles)
- Added User relations: bans, bannedUsers, auditLogs

### Permission System (src/lib/permissions.ts)
- `ROLE_HIERARCHY`: Numeric levels for role comparison
- `canManageRole(actor, target)`: Check if actor can manage target role
- `canModerateContent(role)`: Moderator+ check
- `canManageMembers(role)`: Admin+ check
- `canEditSettings(role)`: Admin+ check
- `hasMinimumRole(userRole, minimumRole)`: Generic role level check
- `getMaxAssignableRole(actorRole)`: Highest role actor can assign
- `compareRoles(roleA, roleB)`: Compare two roles numerically

### Audit System (src/lib/audit-actions.ts)
- `logAuditEvent(userId, action, options)`: Log moderation actions
- `getAuditLogs(options)`: Query audit logs with filtering
- `getAuditLogCount(options)`: Count for pagination
- Typed actions: BAN_USER, UNBAN_USER, DELETE_POST, DELETE_COMMENT, CHANGE_ROLE, UPDATE_SETTINGS, WARN_USER

### Auth Integration (src/lib/auth.ts)
- Extended Session type to include `user.role`
- Extended JWT type to include `role`
- Added role to authorize return object
- Added role refresh on session update trigger (for role changes)

### UI Components
- **RoleBadge**: Visual badge with role-specific colors (amber=owner, purple=admin, blue=mod)
- **AdminTabs**: Navigation tabs that show/hide based on user's role permissions

### Admin Layout
- `/admin/layout.tsx`: Gates moderator+ access, includes AdminTabs
- `/admin/page.tsx`: Redirects to /admin/moderation
- `/admin/moderation/page.tsx`: Placeholder for content moderation

### Updated Admin Pages
- Removed inline `db.user.findUnique` role checks
- Now use `session.user.role` with `canEditSettings()` check
- Redirect to `/admin/moderation` instead of `/feed` when unauthorized

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 38fd387 | feat | Add admin models to schema |
| db87d14 | feat | Create permissions and audit helpers |
| a0f5d53 | feat | Extend auth with role and create admin UI shell |

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

1. Database schema includes Ban, AuditLog, and CommunitySettings models - PASS
2. `npx prisma db push` succeeds - PASS
3. permissions.ts exports all role hierarchy functions - PASS
4. audit-actions.ts exports logAuditEvent and getAuditLogs - PASS
5. Session includes user.role after login - PASS (via type augmentation)
6. /admin route redirects unauthorized users to /feed - PASS (layout redirects non-moderator+)
7. Admin tabs show correct tabs based on user role - PASS
8. RoleBadge renders with correct styling for each role - PASS
9. `npm run build` succeeds - PASS

## Next Phase Readiness

Ready for 10-02 (Content Moderation):
- Permissions helpers available for moderator actions
- AuditLog model ready for tracking moderation actions
- Admin layout and tabs in place for moderation UI
- RoleBadge available for user content display
