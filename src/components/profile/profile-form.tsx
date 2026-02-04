'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { profileSchema } from '@/lib/validations/profile';
import { updateProfile } from '@/lib/profile-actions';
import { Button } from '@/components/ui/button';
import { AvatarUpload } from '@/components/profile/avatar-upload';
import { BioTextarea } from '@/components/profile/bio-textarea';
import { SUPPORTED_LANGUAGES, LANGUAGE_NAMES } from '@/lib/translation';

// Use input type for form fields (before transform/default)
type ProfileFormValues = z.input<typeof profileSchema>;

interface ProfileFormProps {
  user: {
    id: string;
    name: string | null;
    bio: string | null;
    image: string | null;
    languageCode: string | null;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name || '',
      bio: user.bio || '',
      languageCode: user.languageCode || 'en',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('bio', data.bio || '');
      if (data.languageCode) {
        formData.append('languageCode', data.languageCode);
      }

      const result = await updateProfile(formData);

      if ('error' in result) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : 'Failed to update profile';
        setError(errorMsg);
      } else {
        setSuccess(true);
        router.refresh();
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <AvatarUpload currentAvatarUrl={user.image} userName={user.name} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded text-sm">
            Profile updated successfully!
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
            placeholder="Your name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <BioTextarea
          defaultValue={user.bio || ''}
          error={errors.bio?.message}
        />

        <div>
          <label htmlFor="languageCode" className="block text-sm font-medium mb-1">
            Preferred Language
          </label>
          <select
            {...register('languageCode')}
            id="languageCode"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {SUPPORTED_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code]}
              </option>
            ))}
          </select>
          <p className="text-gray-500 text-xs mt-1">
            Content will be automatically translated to your preferred language
          </p>
          {errors.languageCode && (
            <p className="text-red-500 text-sm mt-1">{errors.languageCode.message}</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save changes'}
        </Button>
      </form>
    </div>
  );
}
