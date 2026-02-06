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

// Course image validation schema
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export const courseImageSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_IMAGE_SIZE, 'Image must be less than 5MB')
    .refine(
      (file) => ALLOWED_IMAGE_TYPES.includes(file.type),
      'Only JPEG, PNG, GIF, and WebP images are allowed'
    ),
});

