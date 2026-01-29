# Phase 2: Authentication - Research

**Researched:** 2026-01-22
**Domain:** NextAuth v4 + Credentials Provider + Resend Email + Password Reset
**Confidence:** MEDIUM (NextAuth v4/Next.js 16 peer dependency conflict requires workaround)

## Summary

This research covers authentication implementation using NextAuth v4 with the Credentials provider for email/password login, JWT sessions, Resend for password reset emails, and middleware-based route protection. The tech stack is constrained by prior decisions: email/password only (OAuth deferred), route groups `(auth)` and `(main)` for layout separation, and single community architecture.

**Critical finding:** NextAuth v4 (4.24.x) has a peer dependency conflict with Next.js 16 - it officially supports Next.js 12-15 only. The workaround is to use npm `overrides` in package.json or install with `--legacy-peer-deps`. NextAuth v5 (Auth.js) has better Next.js 16 support but the user specified v4 in PROJECT.md.

The standard approach uses JWT session strategy (required for credentials provider), bcryptjs for password hashing, middleware for route protection, and a custom PasswordResetToken model in Prisma for the password reset flow. NextAuth does NOT include built-in password reset functionality - this must be implemented manually with Resend email service.

**Primary recommendation:** Use NextAuth v4 with npm overrides for Next.js 16 compatibility, JWT sessions, custom sign-in/register pages in the `(auth)` route group, and implement password reset as a separate flow using Resend and a custom Prisma model.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-auth | 4.24.x | Authentication framework | Mature, well-documented, works with credentials provider |
| @auth/prisma-adapter | latest | Store users/sessions in database | Official adapter, maintains schema compatibility |
| bcryptjs | 2.4.x | Password hashing | Industry standard, async-safe for Node.js |
| resend | 4.x | Transactional email | Modern API, React email templates, excellent DX |
| zod | 3.x | Schema validation | TypeScript-first, excellent error messages |
| react-hook-form | 7.x | Form handling | Minimal re-renders, great DX with Zod |
| @hookform/resolvers | 3.x | Zod integration | Bridges zod validation to react-hook-form |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @react-email/components | latest | Email templates | Creating styled password reset emails |
| crypto | built-in | Token generation | Generating secure password reset tokens |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| NextAuth v4 | NextAuth v5 (Auth.js) | v5 has better App Router support but is still beta; user specified v4 |
| bcryptjs | argon2 | Argon2 is newer/stronger but bcryptjs is more widely deployed |
| Resend | SendGrid, Amazon SES | Resend has simpler API and React email support |

**Installation:**
```bash
# Authentication (with override for Next.js 16)
npm install next-auth@4 @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs

# Form validation
npm install zod react-hook-form @hookform/resolvers

# Email
npm install resend @react-email/components
```

**Required package.json override for Next.js 16:**
```json
{
  "overrides": {
    "next-auth": {
      "next": "$next"
    }
  }
}
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── (auth)/                    # Auth route group (no navigation shell)
│   │   ├── layout.tsx             # Centered card layout
│   │   ├── login/
│   │   │   └── page.tsx           # Login form
│   │   ├── register/
│   │   │   └── page.tsx           # Registration form
│   │   ├── forgot-password/
│   │   │   └── page.tsx           # Request password reset
│   │   └── reset-password/
│   │       └── page.tsx           # Reset with token
│   ├── (main)/                    # Main app (protected)
│   │   └── ...                    # Existing structure
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts       # NextAuth API route
├── lib/
│   ├── auth.ts                    # NextAuth configuration
│   ├── auth-actions.ts            # Server actions for auth
│   └── email.ts                   # Resend email functions
├── components/
│   └── auth/
│       ├── login-form.tsx         # Client component
│       ├── register-form.tsx      # Client component
│       ├── forgot-password-form.tsx
│       └── reset-password-form.tsx
├── emails/
│   └── password-reset.tsx         # React email template
└── middleware.ts                  # Route protection (renamed from proxy.ts for Next 16)
```

### Pattern 1: NextAuth Configuration with Credentials Provider

**What:** Central NextAuth configuration file exporting auth options and handlers.
**When to use:** Always - this is the entry point for all auth functionality.

```typescript
// lib/auth.ts
// Source: NextAuth.js Official Docs
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt', // REQUIRED for credentials provider
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login', // Redirect errors to login page
  },
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

        const user = await db.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.hashedPassword) {
          return null; // Generic null - don't reveal if email exists
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};
```

### Pattern 2: API Route Handler for NextAuth

**What:** App Router API route that exports GET and POST handlers.
**When to use:** Required - NextAuth needs this endpoint.

```typescript
// app/api/auth/[...nextauth]/route.ts
// Source: NextAuth.js App Router Docs
import NextAuth from 'next-auth';
import { authOptions } from '@/lib/auth';

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### Pattern 3: Middleware for Route Protection

**What:** Next.js middleware that redirects unauthenticated users.
**When to use:** For protecting entire route groups efficiently.

```typescript
// middleware.ts (Next.js 16 - may need to be proxy.ts)
// Source: NextAuth.js Middleware Docs
import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    // Protect all (main) routes
    '/(main)/:path*',
    // But NOT (auth) routes or API
    // Exclude: /login, /register, /api, /_next, /static
  ],
};
```

**Note:** For Next.js 16, middleware.ts may need renaming to proxy.ts per Phase 1 research. Test and verify.

### Pattern 4: Server-Side Session Access

**What:** Getting session in Server Components and Server Actions.
**When to use:** Whenever you need user info on the server.

```typescript
// In a Server Component
// Source: NextAuth.js App Router Docs
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ProtectedPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return <div>Welcome, {session.user?.name}</div>;
}
```

### Pattern 5: Client-Side Session with SessionProvider

**What:** Wrap app in SessionProvider for client-side session access.
**When to use:** When client components need session state.

```typescript
// app/providers.tsx
'use client';
import { SessionProvider } from 'next-auth/react';

export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

// In a client component
'use client';
import { useSession, signIn, signOut } from 'next-auth/react';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div>Loading...</div>;

  if (session) {
    return <button onClick={() => signOut()}>Sign out</button>;
  }

  return <button onClick={() => signIn()}>Sign in</button>;
}
```

### Anti-Patterns to Avoid

- **Using database sessions with credentials provider:** JWT is required - database sessions don't work with credentials
- **Revealing which credential is wrong:** Never say "wrong password" or "email not found" - just "Invalid credentials"
- **Storing plain text passwords:** Always hash with bcryptjs before storing
- **Trusting client-side session checks only:** Always verify session server-side for sensitive operations
- **Using middleware as sole protection:** Verify authorization at data access points too (CVE-2025-29927 lesson)

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Password hashing | Custom hash function | bcryptjs | Cryptographically secure, handles salt automatically |
| JWT handling | Manual JWT encode/decode | NextAuth JWT callbacks | Secure defaults, handles rotation |
| Session cookies | Manual cookie management | NextAuth session handling | HttpOnly, Secure, SameSite configured correctly |
| Form validation | Manual validation logic | Zod + react-hook-form | Type inference, error messages, reusable schemas |
| Email sending | Direct SMTP | Resend SDK | Handles deliverability, templates, error handling |
| CSRF protection | Manual tokens | NextAuth built-in | Automatic CSRF protection on forms |

**Key insight:** Authentication is security-critical. Hand-rolled solutions almost always have vulnerabilities that established libraries have already fixed.

## Common Pitfalls

### Pitfall 1: NextAuth v4 + Next.js 16 Peer Dependency Error

**What goes wrong:** `npm install next-auth` fails with "Could not resolve dependency: peer next@'^12.2.5 || ^13 || ^14 || ^15'"
**Why it happens:** NextAuth v4 peer dependencies don't include Next.js 16 yet.
**How to avoid:** Add overrides to package.json:
```json
{
  "overrides": {
    "next-auth": {
      "next": "$next"
    }
  }
}
```
Or install with `npm install --legacy-peer-deps`.
**Warning signs:** npm ERR! peer dependency issues during install.

### Pitfall 2: Missing NEXTAUTH_SECRET in Production

**What goes wrong:** Sessions don't persist, "JWE decryption failed" errors.
**Why it happens:** NextAuth requires a secret for JWT encryption; development auto-generates one.
**How to avoid:** Set `NEXTAUTH_SECRET` environment variable:
```bash
# Generate a secure secret
openssl rand -base64 32
```
**Warning signs:** Auth works in dev but fails in production, sessions disappear on refresh.

### Pitfall 3: Middleware Not Protecting Routes

**What goes wrong:** Unauthenticated users can access protected pages.
**Why it happens:** Matcher configuration doesn't cover all protected routes.
**How to avoid:** Use inclusive matcher patterns:
```typescript
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password).*)',
  ],
};
```
**Warning signs:** Direct URL access bypasses login.

### Pitfall 4: Password Reset Token Not Expiring

**What goes wrong:** Old tokens remain valid, security vulnerability.
**Why it happens:** Forgot to set/check expiration time.
**How to avoid:** Always set 1-hour expiry, delete token after use:
```typescript
// Check expiry before allowing reset
if (token.expires < new Date()) {
  return { error: 'Token has expired' };
}
// Delete token after successful reset
await db.passwordResetToken.delete({ where: { id: token.id } });
```
**Warning signs:** Password reset links work days later.

### Pitfall 5: Exposing User Existence in Error Messages

**What goes wrong:** Attacker can enumerate valid emails.
**Why it happens:** Different error messages for "email not found" vs "wrong password".
**How to avoid:** Always return generic "Invalid credentials" message:
```typescript
// GOOD
if (!user || !passwordMatch) {
  return null; // Generic failure
}

// BAD
if (!user) throw new Error('Email not found');
if (!passwordMatch) throw new Error('Wrong password');
```
**Warning signs:** Different error messages for email vs password errors.

### Pitfall 6: CVE-2025-29927 Middleware Bypass

**What goes wrong:** Attackers bypass authentication by sending crafted headers.
**Why it happens:** Vulnerability in Next.js middleware processing.
**How to avoid:**
1. Update Next.js to 16.x (patched versions)
2. Never rely solely on middleware for auth - verify at data access points
3. Block `x-middleware-subrequest` header at edge/proxy if using older versions
**Warning signs:** Self-hosted deployments with Next.js < 15.2.3.

## Code Examples

Verified patterns from official sources:

### User Registration Server Action

```typescript
// lib/auth-actions.ts
'use server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import db from '@/lib/db';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function registerUser(formData: FormData) {
  const validatedFields = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, email, password } = validatedFields.data;

  // Check if user exists
  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: { email: ['Email already in use'] } };
  }

  // Hash password with salt rounds of 10
  const hashedPassword = await bcrypt.hash(password, 10);

  await db.user.create({
    data: {
      name,
      email,
      hashedPassword,
    },
  });

  return { success: true };
}
```

### Login Form with Error Handling

```typescript
// components/auth/login-form.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);

    const result = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false, // Handle redirect manually
    });

    setIsLoading(false);

    if (result?.error) {
      setError('Invalid credentials'); // Generic message
      return;
    }

    router.push('/'); // Redirect to home on success
    router.refresh(); // Refresh to update session
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email">Email</label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full p-2 border rounded"
        />
        {errors.email && (
          <p className="text-red-500 text-sm">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full p-2 border rounded"
        />
        {errors.password && (
          <p className="text-red-500 text-sm">{errors.password.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full p-2 bg-primary text-white rounded disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
```

### Password Reset Token Schema (Prisma)

```prisma
// prisma/schema.prisma - Add to existing schema
model PasswordResetToken {
  id        String   @id @default(cuid())
  email     String
  token     String   @unique
  expires   DateTime

  @@unique([email, token])
  @@index([email])
  @@index([token])
}
```

### Password Reset Email with Resend

```typescript
// lib/email.ts
import { Resend } from 'resend';
import crypto from 'crypto';
import db from '@/lib/db';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(email: string) {
  // Check if user exists (but don't reveal this to caller)
  const user = await db.user.findUnique({ where: { email } });

  if (!user) {
    // Return success even if user doesn't exist (security)
    return { success: true };
  }

  // Delete any existing tokens for this email
  await db.passwordResetToken.deleteMany({ where: { email } });

  // Generate secure token
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: {
      email,
      token,
      expires,
    },
  });

  const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  await resend.emails.send({
    from: 'noreply@yourdomain.com',
    to: email,
    subject: 'Reset your password',
    html: `
      <p>You requested a password reset.</p>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, ignore this email.</p>
    `,
  });

  return { success: true };
}
```

### Reset Password Action

```typescript
// lib/auth-actions.ts (continued)
export async function resetPassword(token: string, newPassword: string) {
  const resetToken = await db.passwordResetToken.findUnique({
    where: { token },
  });

  if (!resetToken) {
    return { error: 'Invalid or expired reset link' };
  }

  if (resetToken.expires < new Date()) {
    await db.passwordResetToken.delete({ where: { id: resetToken.id } });
    return { error: 'Reset link has expired' };
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await db.user.update({
    where: { email: resetToken.email },
    data: { hashedPassword },
  });

  // Delete used token
  await db.passwordResetToken.delete({ where: { id: resetToken.id } });

  return { success: true };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `next-auth/react` for everything | Server-side `getServerSession` + client `useSession` | NextAuth 4.x | Better RSC support |
| `pages/api/auth/[...nextauth].js` | `app/api/auth/[...nextauth]/route.ts` | Next.js 13+ | App Router support |
| `NEXTAUTH_URL` required | Auto-detected in many cases | NextAuth 4.x | Simpler local dev |
| `@next-auth/prisma-adapter` | `@auth/prisma-adapter` | 2024 | Package renamed |
| Database sessions for all | JWT for credentials, DB optional for OAuth | Always | Credentials requires JWT |

**Deprecated/outdated:**
- `@next-auth/prisma-adapter`: Use `@auth/prisma-adapter` instead
- `next-auth/middleware` default export: May need adjustment for Next.js 16's proxy.ts
- `NEXTAUTH_` prefix: Still works in v4, but v5 uses `AUTH_` prefix

## Open Questions

Things that couldn't be fully resolved:

1. **Middleware file naming in Next.js 16**
   - What we know: Phase 1 research mentioned `middleware.ts` may be renamed to `proxy.ts`
   - What's unclear: Whether NextAuth middleware export pattern needs adjustment
   - Recommendation: Test with `middleware.ts` first, rename if issues occur

2. **NextAuth v4 long-term support**
   - What we know: v4 is stable, v5 is in beta but production-ready
   - What's unclear: Timeline for v4 deprecation, future updates
   - Recommendation: Use v4 per PROJECT.md spec, monitor v5 for future migration

3. **Resend email verification in local development**
   - What we know: Resend requires API key and verified domain for sending
   - What's unclear: Best practice for local dev without real email sending
   - Recommendation: Log emails to console in development, use test mode in Resend

## Sources

### Primary (HIGH confidence)
- [NextAuth.js Credentials Provider](https://next-auth.js.org/providers/credentials) - Official docs
- [NextAuth.js Options](https://next-auth.js.org/configuration/options) - Session, JWT, callbacks
- [NextAuth.js Middleware](https://next-auth.js.org/configuration/nextjs) - Route protection
- [Auth.js Prisma Adapter](https://authjs.dev/getting-started/adapters/prisma) - Schema models
- [Resend Next.js Guide](https://resend.com/docs/send-with-nextjs) - Email setup

### Secondary (MEDIUM confidence)
- [NextAuth + Next.js 16 Compatibility Issue](https://github.com/nextauthjs/next-auth/issues/13302) - Peer dependency workaround
- [NextAuth Error Handling Discussion](https://dev.to/peterlidee/error-handling-in-our-form-component-for-the-nextauth-credentialsprovider-1ll2) - Form error patterns
- [Zod + React Hook Form Guide](https://www.freecodecamp.org/news/react-form-validation-zod-react-hook-form/) - Validation patterns

### Tertiary (LOW confidence)
- [CVE-2025-29927 Analysis](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/) - Security vulnerability context

## Metadata

**Confidence breakdown:**
- Standard stack: MEDIUM - NextAuth v4/Next.js 16 peer dependency requires workaround
- Architecture: HIGH - Patterns from official NextAuth and Next.js docs
- Pitfalls: HIGH - Well-documented in official sources and security advisories

**Research date:** 2026-01-22
**Valid until:** 2026-02-22 (30 days - auth patterns are stable, monitor NextAuth v5 status)
