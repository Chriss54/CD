# Phase 10: Admin & Moderation - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

Owners and admins can moderate content and manage community members. Includes role hierarchy (Owner, Admin, Moderator, Member), content moderation (edit/delete any post/comment), member management (ban/remove), and community settings. Does not include notification system (beyond ban messages), appeal workflows, or automated moderation.

</domain>

<decisions>
## Implementation Decisions

### Role Hierarchy
- Strict ladder: each role can only manage roles below them
- Owner > Admin > Moderator > Member
- Moderators can edit/delete posts and comments only — no member management
- Admins can do everything except remove owner
- Role badges (Owner/Admin/Mod) always visible on posts, comments, and profiles
- Owner + Admins can assign roles; Admins can promote to Mod or demote Mods

### Moderation Actions
- Hard delete for moderated content — permanently removed from database
- Full audit log of moderation actions (who, what, when, to what) — admin-visible
- Silent edits when admin edits someone else's content — no "edited by moderator" indicator
- In-app notification to author when their content is moderated

### Member Management
- Ban = temporary with expiry date; Remove = permanent exclusion
- Banned/removed member's content is deleted (all posts and comments)
- Fixed ban duration options: 1 day, 7 days, 30 days
- Ban reason required — banned member sees the reason with their ban message

### Admin Interface
- Separate /admin section (not inline controls on main UI)
- Tab-based organization: Members, Posts, Comments, Settings
- "Admin" link in header (only visible to admins/owners)
- Community settings includes: name, description, logo/icon upload

### Claude's Discretion
- Exact audit log schema and retention
- Notification delivery mechanism (poll vs real-time)
- Admin table pagination and filtering
- Ban expiry checking approach

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-admin-moderation*
*Context gathered: 2026-01-23*
