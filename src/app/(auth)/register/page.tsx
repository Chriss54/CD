import Link from 'next/link';
import { RegistrationWizard } from '@/components/auth/registration-wizard';

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Join the Community</h1>
        <p className="text-gray-600 mt-1">Create your account and get started</p>
      </div>

      <RegistrationWizard />

      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <Link href="/login" className="text-blue-600 hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
