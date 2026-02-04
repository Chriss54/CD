import { z } from 'zod';

export const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  bio: z
    .string()
    .transform((val) => val.replace(/\r\n/g, '\n')) // Normalize newlines before length check
    .pipe(z.string().max(500, 'Bio must be at most 500 characters'))
    .default(''),
  languageCode: z
    .string()
    .length(2, 'Language code must be 2 characters')
    .optional(),
});

// Input type for forms (bio is optional when submitting)
export type ProfileInput = z.input<typeof profileSchema>;

export const avatarSchema = z.object({
  file: z.instanceof(File).refine(
    (file) => file.size <= 5 * 1024 * 1024,
    'Avatar must be less than 5MB'
  ).refine(
    (file) => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type),
    'Avatar must be an image (JPEG, PNG, GIF, or WebP)'
  ),
});

export type AvatarInput = z.infer<typeof avatarSchema>;
