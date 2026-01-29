'use client';

import { useTransition, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  updateCommunitySettings,
  uploadCommunityLogo,
  removeCommunityLogo,
  type CommunitySettings,
} from '@/lib/settings-actions';

interface SettingsFormProps {
  settings: CommunitySettings;
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isRemovePending, startRemoveTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    settings.communityLogo
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);
      const result = await updateCommunitySettings(formData);

      if ('error' in result && result.error) {
        if (typeof result.error === 'string') {
          setError(result.error);
          toast.error(result.error);
        } else if (typeof result.error === 'object') {
          const fieldErrors = result.error as Record<string, string[]>;
          const firstError = Object.values(fieldErrors).flat()[0];
          setError(firstError || 'Invalid input');
          toast.error(firstError || 'Invalid input');
        }
        return;
      }

      toast.success('Settings saved successfully');
      router.refresh();
    });
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Preview immediately
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);

    const formData = new FormData();
    formData.append('logo', file);

    startUploadTransition(async () => {
      const result = await uploadCommunityLogo(formData);

      if ('error' in result && result.error) {
        // Revert preview on error
        setLogoPreview(settings.communityLogo);
        const errorMsg =
          typeof result.error === 'string'
            ? result.error
            : Object.values(result.error as Record<string, string[]>).flat()[0] ||
              'Upload failed';
        toast.error(errorMsg);
        return;
      }

      toast.success('Logo uploaded successfully');
      if (result.url) {
        setLogoPreview(result.url);
      }
      router.refresh();
    });
  };

  const handleLogoRemove = () => {
    startRemoveTransition(async () => {
      const result = await removeCommunityLogo();

      if ('error' in result && result.error) {
        toast.error(result.error);
        return;
      }

      setLogoPreview(null);
      toast.success('Logo removed');
      router.refresh();
    });
  };

  const anyPending = isPending || isUploadPending || isRemovePending;

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Community Logo</h2>
        <div className="flex items-start gap-6">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <Image
                src={logoPreview}
                alt="Community logo"
                width={96}
                height={96}
                className="w-24 h-24 rounded-lg object-cover border"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center border">
                <span className="text-muted-foreground text-sm">No logo</span>
              </div>
            )}
          </div>

          {/* Upload/Remove Buttons */}
          <div className="flex-1 space-y-3">
            <p className="text-sm text-muted-foreground">
              Upload a logo for your community. Recommended size: 96x96 pixels.
              Max file size: 2MB. Supports JPEG, PNG, WebP, and SVG.
            </p>
            <div className="flex gap-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
                disabled={anyPending}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={anyPending}
              >
                {isUploadPending ? 'Uploading...' : 'Upload Logo'}
              </Button>
              {logoPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLogoRemove}
                  disabled={anyPending}
                  className="text-destructive hover:text-destructive"
                >
                  {isRemovePending ? 'Removing...' : 'Remove'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Form */}
      <form action={handleSubmit}>
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <h2 className="text-lg font-medium">Community Details</h2>

          {/* Community Name */}
          <div className="space-y-2">
            <label
              htmlFor="communityName"
              className="text-sm font-medium text-foreground"
            >
              Community Name <span className="text-destructive">*</span>
            </label>
            <input
              id="communityName"
              name="communityName"
              type="text"
              required
              maxLength={100}
              defaultValue={settings.communityName}
              placeholder="Enter community name"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              1-100 characters. This name appears in the sidebar and header.
            </p>
          </div>

          {/* Community Description */}
          <div className="space-y-2">
            <label
              htmlFor="communityDescription"
              className="text-sm font-medium text-foreground"
            >
              Description
            </label>
            <textarea
              id="communityDescription"
              name="communityDescription"
              rows={4}
              maxLength={1000}
              defaultValue={settings.communityDescription || ''}
              placeholder="Describe your community (optional)"
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              Up to 1000 characters.
            </p>
          </div>

          {/* Error Message */}
          {error && <p className="text-sm text-destructive">{error}</p>}

          {/* Submit Button */}
          <div className="pt-2">
            <Button type="submit" disabled={anyPending}>
              {isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
