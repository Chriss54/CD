'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';
import { commentSchema } from '@/lib/validations/comment';
import { awardPoints } from '@/lib/gamification-actions';

export async function createComment(postId: string, content: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const validatedFields = commentSchema.safeParse({ content });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  // Verify post exists
  const post = await db.post.findUnique({
    where: { id: postId },
    select: { id: true },
  });

  if (!post) {
    return { error: 'Post not found' };
  }

  await db.comment.create({
    data: {
      content: validatedFields.data.content,
      authorId: session.user.id,
      postId,
    },
  });

  // Award points for creating a comment
  await awardPoints(session.user.id, 'COMMENT_CREATED');

  revalidatePath(`/feed/${postId}`);

  return { success: true };
}

export async function updateComment(commentId: string, content: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Fetch comment and verify ownership
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });

  if (!comment) {
    return { error: 'Comment not found' };
  }

  if (comment.authorId !== session.user.id) {
    return { error: 'Not authorized' };
  }

  const validatedFields = commentSchema.safeParse({ content });

  if (!validatedFields.success) {
    return { error: validatedFields.error.flatten().fieldErrors };
  }

  await db.comment.update({
    where: { id: commentId },
    data: {
      content: validatedFields.data.content,
    },
  });

  revalidatePath(`/feed/${comment.postId}`);

  return { success: true };
}

export async function deleteComment(commentId: string) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  // Fetch comment and verify ownership
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { authorId: true, postId: true },
  });

  if (!comment) {
    return { error: 'Comment not found' };
  }

  if (comment.authorId !== session.user.id) {
    return { error: 'Not authorized' };
  }

  await db.comment.delete({
    where: { id: commentId },
  });

  revalidatePath(`/feed/${comment.postId}`);

  return { success: true };
}
