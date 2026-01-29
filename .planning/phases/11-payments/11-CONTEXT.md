# Phase 11: Payments - Context

**Gathered:** 2026-01-23
**Status:** Ready for planning

<domain>
## Phase Boundary

New users complete a mock payment step during registration to gain full membership access. This phase implements the payment UI in registration, membership status tracking, and access gating. Real payment processing (Stripe integration) is deferred.

</domain>

<decisions>
## Implementation Decisions

### Payment UI placement
- Payment step embedded during multi-step registration (not after account creation)
- Visual step indicators showing Account → Payment → Complete
- Price + plan name displayed (e.g., "Community Membership - $29/month")
- User can navigate back from payment step to edit account info
- Account only created after successful payment completion

### Mock payment UX
- Simple "Complete Payment" button, no card form fields
- Brief loading delay (1-2s) to simulate processing
- Dedicated success page with checkmark after payment
- Auto-redirect to community after 3 seconds on success page
- Button disabled with spinner while processing

### Access gating
- Paywall modal for unpaid users reaching protected pages
- Blurred background showing content behind the modal
- Public pages: landing page + about/pricing pages accessible without account
- Separate Membership model to track status (not just boolean on User)

### Failure handling
- Mock payment always succeeds (no simulated failures)
- Detailed error messages for actual errors (network, server issues)
- Account not created until payment step completes successfully

### Claude's Discretion
- Exact step indicator styling
- Membership model field structure
- Specific error message wording
- Redirect destination after payment (feed vs onboarding)

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

*Phase: 11-payments*
*Context gathered: 2026-01-23*
