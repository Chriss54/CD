import { z } from 'zod';

export const commentSchema = z.object({
  content: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(2000, 'Comment must be under 2000 characters')
    .trim(),
});

export type CommentInput = z.infer<typeof commentSchema>;
