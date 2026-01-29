import { z } from 'zod';

export const courseSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters')
    .trim(),
  description: z
    .string()
    .max(2000, 'Description must be under 2000 characters')
    .trim()
    .optional()
    .nullable(),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
});

export type CourseInput = z.infer<typeof courseSchema>;

export const moduleSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be under 100 characters')
    .trim(),
  courseId: z.string().cuid('Invalid course ID'),
});

export type ModuleInput = z.infer<typeof moduleSchema>;
