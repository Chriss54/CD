# Phase 7: Classroom Experience - Research

**Researched:** 2026-01-23
**Domain:** LMS student experience - course catalog, enrollment, progress tracking, lesson completion
**Confidence:** HIGH

## Summary

Phase 7 implements the student-facing classroom experience: browsing courses, enrolling, consuming lessons, and tracking progress. The existing codebase (Phase 6) has Course, Module, and Lesson models with admin CRUD operations. This phase adds Enrollment and LessonProgress models for user-specific data, plus new student-facing views.

The research confirms that standard LMS patterns apply: Enrollment is a many-to-many join table between User and Course with enrollment date and optional unenroll tracking; LessonProgress tracks completion per user-lesson pair. Progress percentage is computed as (completed lessons / total lessons). The existing `useOptimistic` pattern from the LikeButton component should be reused for the Mark Complete toggle.

UI patterns follow existing codebase conventions: Tailwind CSS grid layouts (like MemberGrid), card components (like MemberCard/CourseCard), and the existing EmptyState component. Progress bars use native HTML `<progress>` with Tailwind styling or a simple div-based bar with appropriate ARIA attributes.

**Primary recommendation:** Add Enrollment and LessonProgress Prisma models with composite unique constraints. Create student-facing routes under `/classroom/courses/[courseId]` with a persistent sidebar layout (matching admin pattern). Use `useOptimistic` for instant Mark Complete feedback. Compute progress percentage server-side in data queries.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 7.3.0 | Enrollment/Progress models | Already used, handles relations well |
| next-auth | 4.24.13 | User session for enrollment | Already used, provides user.id |
| React useOptimistic | 19.x | Mark Complete instant feedback | Already used in LikeButton, proven pattern |
| Tailwind CSS | 4.x | Grid layout, progress bar styling | Already used throughout project |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 4.1.0 | Enrollment date formatting | Already installed, for "enrolled on" display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Computed progress in query | Dedicated Progress table | Pre-computed adds complexity, computed on-read is simpler for this scale |
| Join table enrollment | Array field on User | Array loses relation benefits, harder to query enrollments |
| HTML progress element | Custom div bar | Native progress has limited styling; div-based is more flexible with Tailwind |

**Installation:**
```bash
# No new packages needed - all dependencies already installed
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/(main)/
│   └── classroom/
│       ├── page.tsx                    # Course catalog (CLRM-06)
│       └── courses/
│           └── [courseId]/
│               ├── layout.tsx          # Sidebar with curriculum
│               ├── page.tsx            # Course overview (enrollment landing)
│               └── lessons/
│                   └── [lessonId]/
│                       └── page.tsx    # Lesson viewer (CLRM-08)
├── components/
│   └── classroom/
│       ├── course-catalog-card.tsx     # Card for catalog grid
│       ├── course-catalog-grid.tsx     # Grid container
│       ├── enrolled-course-card.tsx    # Card with progress bar
│       ├── curriculum-sidebar.tsx      # Lesson list with checkmarks
│       ├── lesson-viewer.tsx           # Lesson content display
│       ├── mark-complete-button.tsx    # Toggle with optimistic UI
│       ├── enroll-button.tsx           # One-click enrollment
│       ├── unenroll-button.tsx         # Unenroll with confirmation
│       └── progress-bar.tsx            # Reusable progress bar
├── lib/
│   ├── enrollment-actions.ts           # Server actions for enrollment
│   ├── progress-actions.ts             # Server actions for lesson completion
│   └── validations/
│       └── enrollment.ts               # Validation schemas (if needed)
└── types/
    └── classroom.ts                    # Student-facing types
```

### Pattern 1: Enrollment Join Table
**What:** Many-to-many between User and Course with metadata
**When to use:** Tracking which users enrolled in which courses
**Example:**
```prisma
// Source: Standard LMS database design pattern
model Enrollment {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  enrolledAt DateTime @default(now())

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}
```

### Pattern 2: Lesson Progress Tracking
**What:** Track completion status per user-lesson pair
**When to use:** Recording which lessons a user has completed
**Example:**
```prisma
// Source: Standard LMS progress tracking pattern
model LessonProgress {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  completedAt DateTime @default(now())

  @@unique([userId, lessonId])
  @@index([userId])
  @@index([lessonId])
}
```

### Pattern 3: Progress Calculation Query
**What:** Compute progress percentage in Prisma query
**When to use:** Displaying progress on enrolled course cards
**Example:**
```typescript
// Server action to get enrolled courses with progress
export async function getEnrolledCoursesWithProgress(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: {
                where: { status: 'PUBLISHED' },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  // Get all completed lessons for this user
  const completedLessons = await db.lessonProgress.findMany({
    where: { userId },
    select: { lessonId: true },
  });
  const completedSet = new Set(completedLessons.map(lp => lp.lessonId));

  return enrollments.map(enrollment => {
    const allLessons = enrollment.course.modules.flatMap(m => m.lessons);
    const totalLessons = allLessons.length;
    const completedCount = allLessons.filter(l => completedSet.has(l.id)).length;
    const progressPercent = totalLessons > 0
      ? Math.round((completedCount / totalLessons) * 100)
      : 0;

    return {
      ...enrollment.course,
      enrolledAt: enrollment.enrolledAt,
      progressPercent,
      completedLessons: completedCount,
      totalLessons,
    };
  });
}
```

### Pattern 4: Optimistic Mark Complete (matching existing LikeButton)
**What:** Instant UI feedback for lesson completion toggle
**When to use:** Mark Complete button
**Example:**
```typescript
// Source: Existing src/components/feed/like-button.tsx pattern
'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleLessonComplete } from '@/lib/progress-actions';

interface MarkCompleteButtonProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function MarkCompleteButton({ lessonId, initialCompleted }: MarkCompleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(initialCompleted);

  const handleClick = () => {
    startTransition(async () => {
      setOptimisticCompleted(!optimisticCompleted);
      await toggleLessonComplete(lessonId);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        optimisticCompleted
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {optimisticCompleted ? 'Completed' : 'Mark Complete'}
    </button>
  );
}
```

### Pattern 5: Course Catalog Grid (matching existing MemberGrid)
**What:** Responsive grid of course cards for catalog
**When to use:** Catalog page showing published courses
**Example:**
```typescript
// Source: Existing src/components/profile/member-grid.tsx pattern
export function CourseCatalogGrid({ courses }: { courses: CatalogCourse[] }) {
  if (courses.length === 0) {
    return (
      <EmptyState
        title="No courses available"
        description="Check back soon for new courses."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCatalogCard key={course.id} course={course} />
      ))}
    </div>
  );
}
```

### Pattern 6: Student Course Layout with Sidebar
**What:** Persistent sidebar showing curriculum with completion status
**When to use:** All pages under /classroom/courses/[courseId]
**Example:**
```typescript
// Source: Existing src/app/(main)/admin/courses/[courseId]/layout.tsx pattern
export default async function CourseLayout({ children, params }: LayoutProps) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect('/login');

  const { courseId } = await params;
  const course = await getCourseWithLessonsForStudent(courseId);

  // Check enrollment
  const enrollment = await getEnrollment(session.user.id, courseId);

  // Get user's progress
  const completedLessonIds = enrollment
    ? await getCompletedLessonIds(session.user.id, courseId)
    : [];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-72 flex-shrink-0 border-r bg-gray-50/50 overflow-y-auto">
        <CurriculumSidebar
          course={course}
          completedLessonIds={completedLessonIds}
          isEnrolled={!!enrollment}
        />
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Showing draft courses/lessons to students:** Always filter by `status: 'PUBLISHED'` in student-facing queries.
- **Re-computing progress client-side:** Compute on server to avoid data inconsistency; pass as prop.
- **Missing enrollment check on lesson pages:** Verify enrollment before showing content; redirect to course overview if not enrolled.
- **Blocking UI during completion toggle:** Use `useOptimistic` for instant feedback, not loading spinners.
- **Storing progress percentage:** Computed values should not be stored; calculate from LessonProgress records.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Optimistic toggle state | Custom useState + server sync | useOptimistic + useTransition | React handles rollback, concurrent updates |
| Grid layout responsiveness | Custom media queries | Tailwind grid-cols-{1,2,3} | Already used in MemberGrid, consistent |
| Empty states | Custom per-component | EmptyState component | Already exists, consistent styling |
| User session access | Custom auth check | getServerSession(authOptions) | Already configured, returns user.id |
| Date formatting | Manual date strings | date-fns format() | Already installed, handles locales |

**Key insight:** This phase is mostly CRUD and display logic using patterns already established in the codebase. Follow existing conventions (MemberGrid, LikeButton, admin layout) rather than inventing new patterns.

## Common Pitfalls

### Pitfall 1: Draft Content Leaking to Students
**What goes wrong:** Unpublished lessons visible via direct URL
**Why it happens:** Missing status filter in queries
**How to avoid:** Always add `where: { status: 'PUBLISHED' }` to student-facing lesson queries; add middleware check in layout
**Warning signs:** Students reporting seeing incomplete content

### Pitfall 2: Enrollment Required but Not Checked
**What goes wrong:** Non-enrolled users can view lesson content
**Why it happens:** Forgot to verify enrollment in lesson page
**How to avoid:** Check enrollment in layout; redirect to course overview with enrollment CTA if not enrolled
**Warning signs:** Lesson content accessible without enrolling

### Pitfall 3: Progress Not Updating After Completion
**What goes wrong:** Sidebar/card shows old progress after marking complete
**Why it happens:** Missing revalidatePath after progress update
**How to avoid:** Call `revalidatePath('/classroom/courses/${courseId}')` in toggleLessonComplete action
**Warning signs:** User needs to refresh to see updated progress

### Pitfall 4: Race Condition in Continue Learning
**What goes wrong:** "Continue Learning" navigates to wrong lesson
**Why it happens:** Client cache out of sync with server after completion
**How to avoid:** Compute "next lesson" server-side; don't rely on stale client state
**Warning signs:** Button shows completed lesson as "next"

### Pitfall 5: Missing Empty States
**What goes wrong:** Blank page when no courses/enrollments exist
**Why it happens:** Forgot to handle zero-length arrays
**How to avoid:** Always use EmptyState component with appropriate messaging
**Warning signs:** Blank white space where content should be

### Pitfall 6: Progress Bar ARIA Attributes Missing
**What goes wrong:** Screen readers can't announce progress
**Why it happens:** Using div without role/aria attributes
**How to avoid:** Add `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`
**Warning signs:** Accessibility audit failures

## Code Examples

Verified patterns from official sources and existing codebase:

### Toggle Lesson Complete Server Action
```typescript
// Source: Pattern from existing like-actions.ts
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function toggleLessonComplete(lessonId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const userId = session.user.id;

  // Check if already completed
  const existing = await db.lessonProgress.findUnique({
    where: {
      userId_lessonId: { userId, lessonId },
    },
  });

  // Get lesson for revalidation path
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: { module: { select: { courseId: true } } },
  });

  if (!lesson) {
    return { error: 'Lesson not found' };
  }

  if (existing) {
    // Uncomplete
    await db.lessonProgress.delete({
      where: { id: existing.id },
    });
  } else {
    // Complete
    await db.lessonProgress.create({
      data: { userId, lessonId },
    });
  }

  revalidatePath(`/classroom/courses/${lesson.module.courseId}`);
  return { success: true };
}
```

### One-Click Enrollment Server Action
```typescript
'use server';

import { getServerSession } from 'next-auth';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth';
import db from '@/lib/db';

export async function enrollInCourse(courseId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: 'Not authenticated' };
  }

  const userId = session.user.id;

  // Check course exists and is published
  const course = await db.course.findUnique({
    where: { id: courseId, status: 'PUBLISHED' },
  });

  if (!course) {
    return { error: 'Course not found' };
  }

  // Check not already enrolled
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (existing) {
    return { error: 'Already enrolled' };
  }

  await db.enrollment.create({
    data: { userId, courseId },
  });

  revalidatePath('/classroom');
  revalidatePath(`/classroom/courses/${courseId}`);
  return { success: true };
}
```

### Get Published Courses for Catalog
```typescript
'use server';

export async function getPublishedCourses() {
  const courses = await db.course.findMany({
    where: { status: 'PUBLISHED' },
    orderBy: { createdAt: 'desc' },
    include: {
      modules: {
        where: { lessons: { some: { status: 'PUBLISHED' } } },
        include: {
          _count: {
            select: {
              lessons: {
                where: { status: 'PUBLISHED' },
              },
            },
          },
        },
      },
    },
  });

  return courses.map(course => ({
    id: course.id,
    title: course.title,
    description: course.description,
    lessonCount: course.modules.reduce((sum, m) => sum + m._count.lessons, 0),
  }));
}
```

### Accessible Progress Bar Component
```typescript
// Source: ARIA Progressbar pattern
interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clampedValue}% complete`}
      className={cn('h-2 w-full bg-gray-200 rounded-full overflow-hidden', className)}
    >
      <div
        className="h-full bg-green-500 transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
```

### Get Next Incomplete Lesson (for Continue Learning)
```typescript
export async function getNextIncompleteLesson(userId: string, courseId: string) {
  // Get all published lessons in order
  const course = await db.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        orderBy: { position: 'asc' },
        include: {
          lessons: {
            where: { status: 'PUBLISHED' },
            orderBy: { position: 'asc' },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!course) return null;

  const allLessonIds = course.modules.flatMap(m => m.lessons.map(l => l.id));

  // Get completed lesson IDs
  const completed = await db.lessonProgress.findMany({
    where: { userId, lessonId: { in: allLessonIds } },
    select: { lessonId: true },
  });
  const completedSet = new Set(completed.map(c => c.lessonId));

  // Find first incomplete
  return allLessonIds.find(id => !completedSet.has(id)) || null;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useState for optimistic | useOptimistic hook | React 19 (stable) | Cleaner rollback handling |
| Loading spinners for toggles | Optimistic UI | 2023+ standard | Better perceived performance |
| Client-side progress calc | Server-side in query | Best practice | Consistency, security |
| Custom grid breakpoints | Tailwind responsive | Standard | Less CSS, consistent |

**Deprecated/outdated:**
- Manual optimistic state management with useState + error rollback: Use useOptimistic hook
- Storing computed progress percentage: Always compute from LessonProgress records

## Open Questions

Things that couldn't be fully resolved:

1. **Thumbnail images for course cards**
   - What we know: CONTEXT.md mentions "visual thumbnails" on cards
   - What's unclear: Course model doesn't have thumbnail field; where do images come from?
   - Recommendation: Add optional `thumbnailUrl: String?` to Course model, or use placeholder image. Decision needed before 07-01.

2. **Duration display on course cards**
   - What we know: CONTEXT.md mentions "duration" on cards
   - What's unclear: How is duration calculated/stored? Video duration sum? Estimated reading time?
   - Recommendation: Skip duration for MVP, or add optional `estimatedMinutes: Int?` to Course model.

3. **Unenroll behavior edge cases**
   - What we know: "Users can unenroll anytime - progress is preserved"
   - What's unclear: Should deleted Enrollment record be soft-deleted? What happens if they re-enroll?
   - Recommendation: Hard delete Enrollment; LessonProgress records remain. Re-enrollment creates new Enrollment, existing progress still counts.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `src/components/feed/like-button.tsx` - useOptimistic pattern
- Existing codebase: `src/components/profile/member-grid.tsx` - grid layout pattern
- Existing codebase: `src/app/(main)/admin/courses/[courseId]/layout.tsx` - sidebar layout pattern
- Existing codebase: `src/lib/course-actions.ts` - server action patterns
- React docs: https://react.dev/reference/react/useOptimistic - optimistic updates
- Prisma docs: composite unique constraints for join tables

### Secondary (MEDIUM confidence)
- [GeeksforGeeks LMS Database Design](https://www.geeksforgeeks.org/sql/how-to-design-a-database-for-learning-management-system-lms/) - enrollment/progress schema patterns
- [Flowbite Progress Bar](https://flowbite.com/docs/components/progress/) - accessible progress bar patterns
- [FreeCodeCamp useOptimistic](https://www.freecodecamp.org/news/how-to-use-the-optimistic-ui-pattern-with-the-useoptimistic-hook-in-react/) - toggle button patterns

### Tertiary (LOW confidence)
- General LMS UI patterns from various course platforms - inspiration only

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing project stack, no new dependencies
- Architecture: HIGH - Following established patterns from Phase 6 and existing components
- Data models: HIGH - Standard LMS enrollment/progress patterns, well-documented
- Pitfalls: HIGH - Common issues from existing codebase patterns and LMS best practices
- Open questions: MEDIUM - Thumbnail/duration fields need decision, not blocking

**Research date:** 2026-01-23
**Valid until:** 2026-02-23 (30 days - stable domain, existing patterns)

---

*Phase: 07-classroom-experience*
*Researched by: gsd-phase-researcher*
