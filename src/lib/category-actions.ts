'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { categorySchema } from '@/lib/validations/category';

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

export async function getCategories() {
  const categories = await db.category.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      color: true,
    },
  });

  return categories;
}

export async function createCategory(formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, color } = validatedFields.data;

  // Check for duplicate name
  const existing = await db.category.findUnique({
    where: { name },
  });

  if (existing) {
    return { error: 'A category with this name already exists' };
  }

  await db.category.create({
    data: { name, color },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/feed');

  return { success: true };
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { error: 'Category not found' };
  }

  const validatedFields = categorySchema.safeParse({
    name: formData.get('name'),
    color: formData.get('color'),
  });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  const { name, color } = validatedFields.data;

  // Check for duplicate name (excluding current category)
  if (name !== category.name) {
    const existing = await db.category.findUnique({
      where: { name },
    });

    if (existing) {
      return { error: 'A category with this name already exists' };
    }
  }

  await db.category.update({
    where: { id: categoryId },
    data: { name, color },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/feed');

  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  if (!(await isAdmin())) {
    return { error: 'Not authorized - admin role required' };
  }

  const category = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!category) {
    return { error: 'Category not found' };
  }

  // Posts will have categoryId set to null via onDelete: SetNull
  await db.category.delete({
    where: { id: categoryId },
  });

  revalidatePath('/admin/categories');
  revalidatePath('/feed');

  return { success: true };
}
