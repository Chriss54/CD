import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api/auth (NextAuth routes)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - login, register, forgot-password, reset-password (auth pages)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|login|register|forgot-password|reset-password).*)',
  ],
};
