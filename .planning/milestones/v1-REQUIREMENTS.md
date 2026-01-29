# Requirements Archive: v1.0 Community Platform MVP

**Archived:** 2026-01-23
**Status:** SHIPPED

This is the archived requirements specification for v1.0.
For current requirements, see `.planning/REQUIREMENTS.md` (created for next milestone).

---

# Requirements: Community Platform

**Defined:** 2026-01-22
**Core Value:** Members can engage with content, learn through courses, attend events, and earn points — the full Skool experience on a self-owned platform.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in with email and password
- [x] **AUTH-03**: User can reset password via email link
- [x] **AUTH-04**: User session persists across browser refresh

### Profiles

- [x] **PROF-01**: User can create profile with display name and avatar
- [x] **PROF-02**: User can write bio (max 500 chars)
- [x] **PROF-03**: User can view other users' profiles
- [x] **PROF-04**: User can browse member directory

### Feed

- [x] **FEED-01**: User can create text post
- [x] **FEED-02**: User can embed YouTube/Vimeo/Loom in post
- [x] **FEED-03**: User can edit own posts
- [x] **FEED-04**: User can delete own posts
- [x] **FEED-05**: User can view chronological feed of posts
- [x] **FEED-06**: User can comment on posts
- [x] **FEED-07**: User can like posts
- [x] **FEED-08**: User can filter posts by category
- [x] **FEED-09**: Admin can create/manage post categories

### Classroom

- [x] **CLRM-01**: Admin can create courses with title and description
- [x] **CLRM-02**: Admin can create modules within courses
- [x] **CLRM-03**: Admin can create lessons within modules
- [x] **CLRM-04**: Lesson can contain text content
- [x] **CLRM-05**: Lesson can contain video embed
- [x] **CLRM-06**: User can view course catalog
- [x] **CLRM-07**: User can enroll in course
- [x] **CLRM-08**: User can mark lesson as complete
- [x] **CLRM-09**: User can see progress percentage per course

### Events

- [x] **EVNT-01**: Admin can create event with title, description, date/time
- [x] **EVNT-02**: Events display in user's timezone
- [x] **EVNT-03**: User can view upcoming events calendar
- [x] ~~**EVNT-04**: User can RSVP to event~~ (skipped per user decision - no RSVP)
- [x] ~~**EVNT-05**: Event shows RSVP count~~ (skipped per user decision - no RSVP)

### Gamification

- [x] **GAME-01**: User earns points for creating posts
- [x] **GAME-02**: User earns points for commenting
- [x] **GAME-03**: User earns points when their content receives likes
- [x] **GAME-04**: User unlocks levels at point thresholds
- [x] **GAME-05**: User can view their current level and points
- [x] **GAME-06**: User can view leaderboard ranked by points

### Admin

- [x] **ADMN-01**: Community has roles: Owner, Admin, Moderator, Member
- [x] **ADMN-02**: Owner/Admin can edit or delete any post
- [x] **ADMN-03**: Owner/Admin can edit or delete any comment
- [x] **ADMN-04**: Owner/Admin can ban or remove members
- [x] **ADMN-05**: Owner can update community settings (name, description)

### Payments

- [x] **PAYM-01**: New user sees mock payment step during registration
- [x] **PAYM-02**: Mock payment grants membership access

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| AUTH-04 | Phase 2 | Complete |
| PROF-01 | Phase 3 | Complete |
| PROF-02 | Phase 3 | Complete |
| PROF-03 | Phase 3 | Complete |
| PROF-04 | Phase 3 | Complete |
| FEED-01 | Phase 4 | Complete |
| FEED-02 | Phase 4 | Complete |
| FEED-03 | Phase 4 | Complete |
| FEED-04 | Phase 4 | Complete |
| FEED-05 | Phase 4 | Complete |
| FEED-06 | Phase 5 | Complete |
| FEED-07 | Phase 5 | Complete |
| FEED-08 | Phase 5 | Complete |
| FEED-09 | Phase 5 | Complete |
| CLRM-01 | Phase 6 | Complete |
| CLRM-02 | Phase 6 | Complete |
| CLRM-03 | Phase 6 | Complete |
| CLRM-04 | Phase 6 | Complete |
| CLRM-05 | Phase 6 | Complete |
| CLRM-06 | Phase 7 | Complete |
| CLRM-07 | Phase 7 | Complete |
| CLRM-08 | Phase 7 | Complete |
| CLRM-09 | Phase 7 | Complete |
| EVNT-01 | Phase 8 | Complete |
| EVNT-02 | Phase 8 | Complete |
| EVNT-03 | Phase 8 | Complete |
| EVNT-04 | Phase 8 | Skipped |
| EVNT-05 | Phase 8 | Skipped |
| GAME-01 | Phase 9 | Complete |
| GAME-02 | Phase 9 | Complete |
| GAME-03 | Phase 9 | Complete |
| GAME-04 | Phase 9 | Complete |
| GAME-05 | Phase 9 | Complete |
| GAME-06 | Phase 9 | Complete |
| ADMN-01 | Phase 10 | Complete |
| ADMN-02 | Phase 10 | Complete |
| ADMN-03 | Phase 10 | Complete |
| ADMN-04 | Phase 10 | Complete |
| ADMN-05 | Phase 10 | Complete |
| PAYM-01 | Phase 11 | Complete |
| PAYM-02 | Phase 11 | Complete |

**Coverage:**
- v1 requirements: 40 total
- Mapped to phases: 40
- Unmapped: 0

---

## Milestone Summary

**Shipped:** 40 of 40 v1 requirements (2 RSVP requirements skipped by design)
**Adjusted:** None
**Dropped:** EVNT-04, EVNT-05 (RSVP functionality) — skipped per user decision to simplify events

---
*Archived: 2026-01-23 as part of v1.0 milestone completion*
