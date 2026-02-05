'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { courseSchema, courseImageSchema } from '@/lib/validations/course';
import { createClient } from '@/lib/supabase/server';

async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return false;
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return user?.role === 'admin' || user?.role === 'owner';
}

export async function getCourses() {
  const courses = await db.course.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { modules: true },
      },
    },
  });

  return courses;
}

export async function getCourse(id: string) {
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { position: 'asc' },
      },
    },
  });

  return course;
}

export async function getCourseWithLessons(id: string) {
  const course = await db.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            orderBy: { position: 'asc' },
          },
        },
      },
    },
  });

  return course;
}

export async function createCourse(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const validatedFields = courseSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    status: formData.get('status') || 'DRAFT',
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { title, description, status } = validatedFields.data;

  const course = await db.course.create({
    data: {
      title,
      description,
      status,
    },
  });

  revalidatePath('/admin/courses');

  return { success: true, courseId: course.id };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { error: 'Course not found' };
  }

  const validatedFields = courseSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description') || null,
    status: formData.get('status') || course.status,
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { title, description, status } = validatedFields.data;

  await db.course.update({
    where: { id: courseId },
    data: {
      title,
      description,
      status,
    },
  });

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${courseId}`);

  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { error: 'Course not found' };
  }

  // Cascade deletes modules automatically via schema relation
  await db.course.delete({
    where: { id: courseId },
  });

  revalidatePath('/admin/courses');

  return { success: true };
}

export async function uploadCourseImage(courseId: string, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const course = await db.course.findUnique({
    where: { id: courseId },
  });

  if (!course) {
    return { error: 'Course not found' };
  }

  const file = formData.get('image');

  if (!(file instanceof File)) {
    return { error: 'No file provided' };
  }

  const validatedFields = courseImageSchema.safeParse({ file });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  // Generate unique filename
  const ext = file.name.split('.').pop() || 'jpg';
  const filename = `courses/${courseId}/cover-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('course-images')
    .upload(filename, file, {
      upsert: true,
      contentType: file.type,
    });

  if (uploadError) {
    return { error: `Upload failed: ${uploadError.message}` };
  }

  const { data: urlData } = supabase.storage
    .from('course-images')
    .getPublicUrl(filename);

  const publicUrl = urlData.publicUrl;

  await db.course.update({
    where: { id: courseId },
    data: { coverImage: publicUrl },
  });

  revalidatePath('/admin/courses');
  revalidatePath(`/admin/courses/${courseId}`);
  revalidatePath('/classroom');

  return { success: true, url: publicUrl };
}
