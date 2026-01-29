import type { Course, Module, Lesson, Attachment } from '@/generated/prisma/client';

// Re-export CourseStatus enum for use in client code
export type CourseStatus = 'DRAFT' | 'PUBLISHED';

// Re-export LessonStatus enum for use in client code
export type LessonStatus = 'DRAFT' | 'PUBLISHED';

// Re-export Lesson and Attachment types
export type { Lesson, Attachment };

// Course with its modules
export type CourseWithModules = Course & {
  modules: Module[];
};

// Course with module count (for list views)
export type CourseWithModuleCount = Course & {
  _count: {
    modules: number;
  };
};

// Module with lessons
export type ModuleWithLessons = Module & {
  lessons: Lesson[];
};

// Lesson with attachments
export type LessonWithAttachments = Lesson & {
  attachments: Attachment[];
};

// Lesson with attachments and module (for breadcrumbs)
export type LessonWithModule = Lesson & {
  attachments: Attachment[];
  module: Module & {
    course: Course;
  };
};
