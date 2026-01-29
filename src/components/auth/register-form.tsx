'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { registerSchema, type RegisterInput } from '@/lib/validations/auth';
import { registerUser } from '@/lib/auth-actions';
import { Button } from '@/components/ui/button';

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);

    const result = await registerUser(formData);

    if (result.error) {
      setIsLoading(false);
      if (typeof result.error === 'object') {
        setFieldErrors(result.error);
      } else {
        setError('Registration failed');
      }
      return;
    }

    // Auto sign in after registration
    const signInResult = await signIn('credentials', {
      email: data.email,
      password: data.password,
      redirect: false,
    });

    setIsLoading(false);

    if (signInResult?.error) {
      setError('Account created but sign in failed. Please try logging in.');
      return;
    }

    router.push('/');
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">
          Name
        </label>
        <input
          {...register('name')}
          type="text"
          id="name"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="John Doe"
        />
        {(errors.name || fieldErrors.name) && (
          <p className="text-red-500 text-sm mt-1">
            {errors.name?.message || fieldErrors.name?.[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email
        </label>
        <input
          {...register('email')}
          type="email"
          id="email"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="you@example.com"
        />
        {(errors.email || fieldErrors.email) && (
          <p className="text-red-500 text-sm mt-1">
            {errors.email?.message || fieldErrors.email?.[0]}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
          Password
        </label>
        <input
          {...register('password')}
          type="password"
          id="password"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        {(errors.password || fieldErrors.password) && (
          <p className="text-red-500 text-sm mt-1">
            {errors.password?.message || fieldErrors.password?.[0]}
          </p>
        )}
        <p className="text-gray-500 text-xs mt-1">At least 8 characters</p>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );
}
