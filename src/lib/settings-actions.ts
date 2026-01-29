'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { canEditSettings } from '@/lib/permissions';
import { logAuditEvent } from '@/lib/audit-actions';
import { settingsSchema, logoSchema } from '@/lib/validations/settings';
import { createClient } from '@/lib/supabase/server';

/**
 * Community settings type returned by getCommunitySettings.
 */
export type CommunitySettings = {
  id: string;
  communityName: string;
  communityDescription: string | null;
  communityLogo: string | null;
};

/**
 * Get community settings, creating defaults if they don't exist.
 */
export async function getCommunitySettings(): Promise<CommunitySettings> {
  // Upsert singleton settings - creates if missing
  const settings = await db.communitySettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      communityName: 'Community',
    },
    select: {
      id: true,
      communityName: true,
      communityDescription: true,
      communityLogo: true,
    },
  });

  return settings;
}

/**
 * Update community name and description.
 * Only callable by admin+ roles.
 */
export async function updateCommunitySettings(
  formData: FormData
): Promise<{ success?: boolean; error?: string | Record<string, string[]> }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!canEditSettings(session.user.role)) {
    return { error: 'Permission denied' };
  }

  const validatedFields = settingsSchema.safeParse({
    communityName: formData.get('communityName'),
    communityDescription: formData.get('communityDescription'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { communityName, communityDescription } = validatedFields.data;

  // Get current settings for audit log
  const currentSettings = await getCommunitySettings();

  await db.communitySettings.upsert({
    where: { id: 'singleton' },
    update: {
      communityName,
      communityDescription,
    },
    create: {
      id: 'singleton',
      communityName,
      communityDescription,
    },
  });

  // Log audit event
  await logAuditEvent(session.user.id, 'UPDATE_SETTINGS', {
    targetId: 'singleton',
    targetType: 'SETTINGS',
    details: {
      previousName: currentSettings.communityName,
      newName: communityName,
      previousDescription: currentSettings.communityDescription,
      newDescription: communityDescription,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout'); // Revalidate layout for sidebar/header

  return { success: true };
}

/**
 * Upload community logo.
 * Only callable by admin+ roles.
 */
export async function uploadCommunityLogo(
  formData: FormData
): Promise<{ success?: boolean; url?: string; error?: string | Record<string, string[]> }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!canEditSettings(session.user.role)) {
    return { error: 'Permission denied' };
  }

  const file = formData.get('logo');

  if (!(file instanceof File)) {
    return { error: 'No file provided' };
  }

  const validatedFields = logoSchema.safeParse({ file });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'png';
  const filename = `community/logo-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars') // Reuse avatars bucket for community logo
    .upload(filename, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filename);

  const publicUrl = urlData.publicUrl;

  // Get current settings for audit log
  const currentSettings = await getCommunitySettings();

  await db.communitySettings.upsert({
    where: { id: 'singleton' },
    update: {
      communityLogo: publicUrl,
    },
    create: {
      id: 'singleton',
      communityName: 'Community',
      communityLogo: publicUrl,
    },
  });

  // Log audit event
  await logAuditEvent(session.user.id, 'UPDATE_SETTINGS', {
    targetId: 'singleton',
    targetType: 'SETTINGS',
    details: {
      action: 'logo_upload',
      previousLogo: currentSettings.communityLogo,
      newLogo: publicUrl,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout'); // Revalidate layout for sidebar/header

  return { success: true, url: publicUrl };
}

/**
 * Remove community logo.
 * Only callable by admin+ roles.
 */
export async function removeCommunityLogo(): Promise<{ success?: boolean; error?: string }> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!canEditSettings(session.user.role)) {
    return { error: 'Permission denied' };
  }

  // Get current settings for audit log
  const currentSettings = await getCommunitySettings();

  if (!currentSettings.communityLogo) {
    return { success: true }; // Already no logo
  }

  await db.communitySettings.update({
    where: { id: 'singleton' },
    data: {
      communityLogo: null,
    },
  });

  // Log audit event
  await logAuditEvent(session.user.id, 'UPDATE_SETTINGS', {
    targetId: 'singleton',
    targetType: 'SETTINGS',
    details: {
      action: 'logo_remove',
      previousLogo: currentSettings.communityLogo,
    },
  });

  revalidatePath('/admin/settings');
  revalidatePath('/', 'layout'); // Revalidate layout for sidebar/header

  return { success: true };
}
