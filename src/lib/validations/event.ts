import { z } from 'zod';

// Basic Tiptap document structure validation (reused from post validation)
const tiptapNodeSchema: z.ZodType<unknown> = z.lazy(() =>
  z.object({
    type: z.string(),
    content: z.array(tiptapNodeSchema).optional(),
    text: z.string().optional(),
    marks: z.array(z.object({ type: z.string() }).passthrough()).optional(),
    attrs: z.record(z.string(), z.unknown()).optional(),
  }).passthrough()
);

const tiptapDocumentSchema = z.object({
  type: z.literal('doc'),
  content: z.array(tiptapNodeSchema).optional(),
}).passthrough();

export const eventSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be under 200 characters')
    .trim(),
  description: z
    .string()
    .min(1, 'Description is required')
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid JSON content');
      }
    })
    .pipe(tiptapDocumentSchema),
  startTime: z
    .string()
    .min(1, 'Start time is required'),
  endTime: z
    .string()
    .min(1, 'End time is required'),
  location: z
    .string()
    .max(200, 'Location must be under 200 characters')
    .trim()
    .optional()
    .nullable(),
  locationUrl: z
    .string()
    .max(500, 'Location URL must be under 500 characters')
    .url('Invalid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  coverImage: z
    .string()
    .url('Invalid cover image URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  recurrence: z.enum(['NONE', 'WEEKLY', 'MONTHLY']).default('NONE'),
  recurrenceEnd: z
    .string()
    .optional()
    .nullable(),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    return end > start;
  },
  {
    message: 'End time must be after start time',
    path: ['endTime'],
  }
);

// Input type for forms (before transforms)
export type EventInput = z.input<typeof eventSchema>;

// Output type (after transforms)
export type EventData = z.output<typeof eventSchema>;
