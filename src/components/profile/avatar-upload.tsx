'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/avatar';
import { uploadAvatar } from '@/lib/profile-actions';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string | null;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function AvatarUpload({ currentAvatarUrl, userName }: AvatarUploadProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Please upload an image (JPEG, PNG, GIF, or WebP)');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const result = await uploadAvatar(formData);

      if ('error' in result) {
        const errorMsg = typeof result.error === 'string'
          ? result.error
          : 'Upload failed';
        setError(errorMsg);
      } else {
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsUploading(false);
      // Reset input so same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar src={currentAvatarUrl} name={userName} size="lg" />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="avatar-upload"
        disabled={isUploading}
      />

      <label
        htmlFor="avatar-upload"
        className={`text-sm cursor-pointer text-blue-600 hover:text-blue-800 ${
          isUploading ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {isUploading ? 'Uploading...' : 'Change photo'}
      </label>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}
    </div>
  );
}
