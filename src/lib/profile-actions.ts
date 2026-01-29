'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { profileSchema, avatarSchema } from '@/lib/validations/profile';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const validatedFields = profileSchema.safeParse({
    name: formData.get('name'),
    bio: formData.get('bio'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, bio } = validatedFields.data;

  await db.user.update({
    where: { id: session.user.id },
    data: { name, bio },
  });

  revalidatePath('/profile/edit');
  revalidatePath(`/members/${session.user.id}`);

  return { success: true };
}

export async function uploadAvatar(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const file = formData.get('avatar');

  if (!(file instanceof File)) {
    return { error: 'No file provided' };
  }

  const validatedFields = avatarSchema.safeParse({ file });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `${session.user.id}/avatar-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
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

  await db.user.update({
    where: { id: session.user.id },
    data: { image: publicUrl },
  });

  revalidatePath('/profile/edit');
  revalidatePath(`/members/${session.user.id}`);

  return { success: true, url: publicUrl };
}
