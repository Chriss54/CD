import Link from 'next/link';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

interface ResetPasswordPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-bold">Invalid reset link</h1>
        <p className="text-gray-600">
          This password reset link is invalid or has expired.
        </p>
        <Link href="/forgot-password" className="text-blue-600 hover:underline">
          Request a new reset link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-gray-600 mt-1">Enter your new password below</p>
      </div>

      <ResetPasswordForm token={token} />
    </div>
  );
}
