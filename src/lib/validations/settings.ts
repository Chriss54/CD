import { z } from 'zod';

export const settingsSchema = z.object({
  communityName: z
    .string()
    .min(1, 'Community name is required')
    .max(100, 'Community name must be at most 100 characters'),
  communityDescription: z
    .string()
    .max(1000, 'Description must be at most 1000 characters')
    .optional()
    .nullable()
    .transform((val) => val || null),
});

export type SettingsInput = z.input<typeof settingsSchema>;

export const logoSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 2 * 1024 * 1024, 'Logo must be less than 2MB')
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'].includes(
          file.type
        ),
      'Logo must be an image (JPEG, PNG, WebP, or SVG)'
    ),
});

export type LogoInput = z.infer<typeof logoSchema>;
