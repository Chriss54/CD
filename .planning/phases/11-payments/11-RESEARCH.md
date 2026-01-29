# Phase 11: Payments - Research

**Researched:** 2026-01-23
**Domain:** Multi-step registration with mock payment, membership tracking, and access gating
**Confidence:** HIGH

## Summary

This research covers implementing a mock payment flow during user registration in a Next.js 16 application with existing NextAuth v4 authentication. The phase introduces a multi-step registration wizard (Account -> Payment -> Complete), a Membership model for tracking payment status, and a paywall modal for access gating.

The codebase already has a working single-step registration flow using react-hook-form with Zod validation. This phase transforms it into a multi-step wizard with local state management and deferred account creation (account only created after mock payment succeeds). The existing custom dialog pattern using Tailwind CSS provides the foundation for the paywall modal.

**Primary recommendation:** Use react-hook-form with local React state for step management (no Zustand needed for this simple 2-step flow), create a separate Membership model in Prisma, and implement the paywall as a client-side modal that checks membership status on protected page access.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | 7.x | Form handling | Already in project, handles validation per step |
| zod | 4.x | Schema validation | Already in project, validates registration fields |
| NextAuth | 4.x | Authentication | Already configured with JWT sessions |
| Prisma | 7.x | ORM | Already in project, will add Membership model |

### No New Dependencies Required

The multi-step form pattern for 2 steps can be implemented with React's built-in useState hook. Zustand is overkill for this use case since:
- Only 2 steps (Account, Payment)
- No page navigation during registration
- Form data doesn't need to persist across page refreshes
- Account creation is transactional (atomic with payment)

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| React useState | Zustand persist | Overkill for 2 steps, adds bundle size |
| Local step state | URL-based steps | Unnecessary complexity, allows bypassing steps |
| Custom dialog | Radix Dialog | Not installed, existing pattern works well |

**Installation:**
```bash
# No new dependencies needed!
# All required libraries already in package.json
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx             # Existing centered card layout
│   │   └── register/
│   │       └── page.tsx           # Multi-step registration wizard
│   └── (main)/                    # Protected routes
│       └── ...
├── components/
│   ├── auth/
│   │   ├── registration-wizard.tsx    # Multi-step orchestrator
│   │   ├── registration-step-account.tsx  # Step 1: Account form
│   │   ├── registration-step-payment.tsx  # Step 2: Mock payment
│   │   └── registration-success.tsx       # Step 3: Success/redirect
│   └── paywall/
│       └── paywall-modal.tsx      # Membership paywall modal
├── lib/
│   ├── auth-actions.ts            # Modified to accept membership creation
│   └── validations/
│       └── auth.ts                # Existing schemas, add payment step validation
└── middleware.ts                  # May need membership check
```

### Pattern 1: Multi-Step Registration Wizard with Local State

**What:** A parent component that orchestrates multiple form steps using local React state, with react-hook-form handling each step's validation independently.

**When to use:** For simple wizards (2-4 steps) that don't need persistence across page refreshes.

**Example:**
```typescript
// components/auth/registration-wizard.tsx
'use client';

import { useState } from 'react';
import { RegistrationStepAccount, AccountData } from './registration-step-account';
import { RegistrationStepPayment } from './registration-step-payment';
import { RegistrationSuccess } from './registration-success';

type Step = 'account' | 'payment' | 'success';

export function RegistrationWizard() {
  const [step, setStep] = useState<Step>('account');
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAccountComplete = (data: AccountData) => {
    setAccountData(data);
    setStep('payment');
  };

  const handlePaymentComplete = async () => {
    if (!accountData) return;

    setIsProcessing(true);
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Create account + membership atomically
    const result = await registerWithMembership(accountData);

    if (result.success) {
      setStep('success');
    }
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (step === 'payment') setStep('account');
  };

  return (
    <div className="space-y-6">
      <StepIndicator currentStep={step} />

      {step === 'account' && (
        <RegistrationStepAccount
          onComplete={handleAccountComplete}
          defaultValues={accountData}
        />
      )}

      {step === 'payment' && (
        <RegistrationStepPayment
          onComplete={handlePaymentComplete}
          onBack={handleBack}
          isProcessing={isProcessing}
        />
      )}

      {step === 'success' && <RegistrationSuccess />}
    </div>
  );
}
```

### Pattern 2: Step Indicator Component

**What:** Visual representation of progress through registration steps.

**When to use:** Always include for multi-step forms to orient users.

**Example:**
```typescript
// components/auth/step-indicator.tsx
interface StepIndicatorProps {
  currentStep: 'account' | 'payment' | 'success';
}

const STEPS = [
  { id: 'account', label: 'Account' },
  { id: 'payment', label: 'Payment' },
  { id: 'success', label: 'Complete' },
] as const;

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  const currentIndex = STEPS.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-center space-x-4">
      {STEPS.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`
            w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
            ${index <= currentIndex
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-500'}
          `}>
            {index < currentIndex ? '✓' : index + 1}
          </div>
          <span className={`ml-2 text-sm ${
            index === currentIndex ? 'font-medium' : 'text-gray-500'
          }`}>
            {step.label}
          </span>
          {index < STEPS.length - 1 && (
            <div className={`w-8 h-0.5 mx-2 ${
              index < currentIndex ? 'bg-primary' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}
```

### Pattern 3: Membership Model in Prisma

**What:** Separate model for tracking membership/payment status, not a boolean on User.

**When to use:** When you need to track payment history, plan types, or expiration dates.

**Example:**
```prisma
// prisma/schema.prisma

model Membership {
  id        String           @id @default(cuid())
  userId    String           @unique
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  status    MembershipStatus @default(ACTIVE)
  planName  String           @default("Community Membership")
  paidAt    DateTime         @default(now())
  expiresAt DateTime?        // null = lifetime/no expiration

  createdAt DateTime         @default(now())
  updatedAt DateTime         @updatedAt

  @@index([userId])
  @@index([status])
}

enum MembershipStatus {
  ACTIVE
  EXPIRED
  CANCELLED
}
```

### Pattern 4: Paywall Modal with Blurred Background

**What:** Modal that appears when unpaid users try to access protected content.

**When to use:** For soft gating that shows content exists but requires payment.

**Example:**
```typescript
// components/paywall/paywall-modal.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface PaywallModalProps {
  isOpen: boolean;
}

export function PaywallModal({ isOpen }: PaywallModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred backdrop that shows content behind */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Modal content */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center">
        <h2 className="text-2xl font-bold mb-2">
          Become a Member
        </h2>
        <p className="text-gray-600 mb-6">
          Join our community to access all content, courses, and events.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-lg font-semibold">Community Membership</p>
          <p className="text-3xl font-bold text-primary">$29<span className="text-base font-normal text-gray-500">/month</span></p>
        </div>

        <Button
          className="w-full"
          onClick={() => router.push('/register')}
        >
          Get Started
        </Button>
      </div>
    </div>
  );
}
```

### Pattern 5: Atomic Registration with Membership

**What:** Server action that creates User and Membership in a single transaction.

**When to use:** When account creation depends on successful payment.

**Example:**
```typescript
// lib/auth-actions.ts
'use server';

import db from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function registerWithMembership(data: {
  name: string;
  email: string;
  password: string;
}) {
  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    return { error: { email: ['Email already in use'] } };
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);

  // Create user and membership atomically
  const user = await db.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
      membership: {
        create: {
          status: 'ACTIVE',
          planName: 'Community Membership',
        },
      },
    },
    include: {
      membership: true,
    },
  });

  return { success: true, userId: user.id };
}
```

### Anti-Patterns to Avoid

- **Creating user before payment completes:** This leaves orphan accounts if payment fails. Always create atomically.
- **Using URL query params for step state:** Allows users to skip directly to later steps.
- **Blocking navigation with browser beforeunload:** Poor UX for a 2-step form.
- **Storing membership as boolean on User:** Makes it hard to track payment history or plan types.
- **Server-side only paywall checks:** Users see flash of content before redirect. Use client-side modal.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state per step | Custom form handlers | react-hook-form per step | Already in project, handles validation |
| Step navigation | URL-based router steps | Local useState | Simpler, prevents step skipping |
| Loading spinners | Custom CSS animations | Tailwind animate-spin | Consistent, accessible |
| Modal backdrop | Custom overlay | Existing dialog pattern (ban-dialog.tsx) | Already proven in codebase |

**Key insight:** The existing codebase has all the patterns needed. The main work is restructuring the registration flow and adding the Membership model.

## Common Pitfalls

### Pitfall 1: Race Condition in Account Creation

**What goes wrong:** User rapidly clicks "Complete Payment", creating duplicate accounts.
**Why it happens:** No client-side debouncing or server-side duplicate check under concurrent requests.
**How to avoid:**
1. Disable button immediately on click with `disabled={isProcessing}`
2. Use database unique constraint on email
3. Server action checks for existing user before creation
**Warning signs:** Seeing duplicate users with same email, or constraint violation errors.

### Pitfall 2: Session Not Updated After Registration

**What goes wrong:** User completes registration but session doesn't include membership status.
**Why it happens:** JWT token was issued before membership was created, or callbacks don't include membership.
**How to avoid:**
1. Call `signIn()` AFTER registration completes
2. Extend JWT callback to fetch membership status
3. Use `router.refresh()` after sign-in to update session
**Warning signs:** User sees paywall immediately after registering.

### Pitfall 3: Middleware Checking Membership on Every Request

**What goes wrong:** Database query for membership on every route, causing latency.
**Why it happens:** Checking membership in middleware for all protected routes.
**How to avoid:**
1. Include membership status in JWT token (updated on login)
2. Only check database for sensitive operations
3. Use client-side paywall modal, not middleware redirect
**Warning signs:** Slow page loads, high database query count.

### Pitfall 4: Lost Form Data on Navigation Back

**What goes wrong:** User goes back from payment step and their account data is gone.
**Why it happens:** Form state not preserved when switching steps.
**How to avoid:**
1. Store account data in parent component state
2. Pass `defaultValues` to form when navigating back
3. Use `reset()` from react-hook-form with stored values
**Warning signs:** Users complaining about having to re-enter information.

### Pitfall 5: Paywall Modal Not Showing for Direct URL Access

**What goes wrong:** Users access /feed directly and see content without paywall.
**Why it happens:** Paywall check only happens on client navigation, not initial page load.
**How to avoid:**
1. Check membership in Server Component and pass to client
2. Show paywall on initial render if no membership
3. Consider middleware redirect for truly protected routes
**Warning signs:** Unpaid users able to view content by bookmarking URLs.

## Code Examples

Verified patterns based on existing codebase patterns:

### Mock Payment Button with Loading State

```typescript
// components/auth/registration-step-payment.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PaymentStepProps {
  onComplete: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function RegistrationStepPayment({
  onComplete,
  onBack,
  isProcessing
}: PaymentStepProps) {
  return (
    <div className="space-y-6">
      {/* Plan display */}
      <div className="border rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold">Community Membership</h3>
        <p className="text-3xl font-bold mt-2">
          $29<span className="text-base font-normal text-gray-500">/month</span>
        </p>
        <p className="text-sm text-gray-500 mt-2">
          Full access to all community features
        </p>
      </div>

      {/* Mock payment notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
        This is a mock payment. No real charges will be made.
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          onClick={onComplete}
          disabled={isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <span className="animate-spin mr-2">⟳</span>
              Processing...
            </>
          ) : (
            'Complete Payment'
          )}
        </Button>
      </div>
    </div>
  );
}
```

### Success Page with Auto-Redirect

```typescript
// components/auth/registration-success.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

interface SuccessProps {
  email: string;
  password: string;
}

export function RegistrationSuccess({ email, password }: SuccessProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Auto sign-in and redirect
    const signInAndRedirect = async () => {
      await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            router.refresh();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    };

    signInAndRedirect();
  }, [email, password, router]);

  return (
    <div className="text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <span className="text-3xl">✓</span>
      </div>
      <h2 className="text-2xl font-bold">Welcome to the Community!</h2>
      <p className="text-gray-600">
        Your account has been created successfully.
      </p>
      <p className="text-sm text-gray-500">
        Redirecting in {countdown} seconds...
      </p>
    </div>
  );
}
```

### Extending Session with Membership Status

```typescript
// lib/auth.ts - Extended callbacks
callbacks: {
  async jwt({ token, user, trigger }) {
    if (user) {
      token.id = user.id;
      token.role = (user as { role?: Role }).role ?? 'member';

      // Fetch membership status on login
      const membership = await db.membership.findUnique({
        where: { userId: user.id },
        select: { status: true },
      });
      token.hasMembership = membership?.status === 'ACTIVE';
    }

    if (trigger === 'update') {
      // Refresh membership status on session update
      const membership = await db.membership.findUnique({
        where: { userId: token.id as string },
        select: { status: true },
      });
      token.hasMembership = membership?.status === 'ACTIVE';
    }

    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      session.user.id = token.id as string;
      session.user.role = token.role;
      session.user.hasMembership = token.hasMembership as boolean;
    }
    return session;
  },
},
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Zustand for all multi-step forms | Local state for simple wizards | 2024 | Less bundle size, simpler code for <4 steps |
| URL-based wizard steps | Local state steps | Always | Prevents step skipping, better UX |
| Boolean isPaid on User | Separate Membership model | Best practice | Enables plan types, expiration tracking |
| Server-side paywall redirects | Client-side modal with blur | 2023 | Better UX, shows content exists |

**Current best practice:**
- For 2-4 step wizards: Use local React state with react-hook-form per step
- For 5+ step wizards or cross-page navigation: Use Zustand with persist middleware
- For membership tracking: Separate model with status enum, not boolean

## Open Questions

Things that couldn't be fully resolved:

1. **Redirect destination after payment**
   - What we know: CONTEXT.md says Claude's discretion for feed vs onboarding
   - Recommendation: Redirect to `/` (feed) since user already provided name during registration. Onboarding could be shown later.

2. **Membership expiration handling**
   - What we know: Mock payment has no real billing cycle
   - What's unclear: Should we track expiration for future Stripe integration?
   - Recommendation: Include `expiresAt` field as nullable, leave null for now

3. **Public pages definition**
   - What we know: Landing + about/pricing accessible without account
   - What's unclear: Current routes are all protected, need to create public routes
   - Recommendation: Add `/about` and `/pricing` pages outside `(main)` route group, or create `(public)` group

## Sources

### Primary (HIGH confidence)
- Project codebase: `/src/components/auth/register-form.tsx` - Existing registration pattern
- Project codebase: `/src/lib/auth-actions.ts` - Server action pattern
- Project codebase: `/src/components/admin/ban-dialog.tsx` - Modal/dialog pattern
- Project codebase: `/prisma/schema.prisma` - Existing User model
- Project codebase: `/src/lib/auth.ts` - NextAuth configuration with JWT callbacks
- [react-hook-form Advanced Usage](https://react-hook-form.com/advanced-usage) - Official docs

### Secondary (MEDIUM confidence)
- [Building Multi-Step Forms with React Hook Form](https://www.ignek.com/blog/building-multi-step-forms-in-react/) - Pattern guidance
- [Multi-step Form Example using Zustand](https://github.com/orgs/react-hook-form/discussions/6382) - GitHub discussion
- [React Paywall with HOCs](https://medium.com/riipen-engineering/react-paywall-with-higher-order-components-4fd7c5de6d80) - Paywall pattern

### Tertiary (LOW confidence)
- WebSearch results on step indicators and progress bars - UI pattern guidance

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing libraries, no new dependencies
- Architecture: HIGH - Following established patterns in codebase
- Pitfalls: MEDIUM - Some edge cases may emerge during implementation

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - patterns are stable)
