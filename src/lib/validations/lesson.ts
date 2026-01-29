import { z } from 'zod';

// Basic Tiptap document structure validation (same as post.ts)
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

// Lesson validation schema
export const lessonSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be under 200 characters'),
  content: z
    .string()
    .transform((val) => {
      try {
        return JSON.parse(val);
      } catch {
        throw new Error('Invalid JSON content');
      }
    })
    .pipe(tiptapDocumentSchema),
  videoUrl: z
    .string()
    .url('Invalid video URL')
    .optional()
    .or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED']),
  moduleId: z.string().cuid('Invalid module ID'),
});

// Schema for creating a new lesson (moduleId is in the data)
export const createLessonSchema = lessonSchema;

// Schema for updating a lesson (moduleId not needed, but can be passed)
export const updateLessonSchema = lessonSchema.partial({ moduleId: true });

// Input type for forms (before transforms)
export type LessonInput = z.input<typeof lessonSchema>;

// Output type (after transforms)
export type LessonData = z.output<typeof lessonSchema>;
