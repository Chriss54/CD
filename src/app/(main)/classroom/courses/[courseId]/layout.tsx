import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getCourseWithLessons } from '@/lib/course-actions';
import { getEnrollment } from '@/lib/enrollment-actions';
import { getCompletedLessonIds } from '@/lib/progress-actions';
import { CurriculumSidebar } from '@/components/classroom/curriculum-sidebar';

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ courseId: string }>;
}

export default async function StudentCourseLayout({
  children,
  params,
}: LayoutProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  const { courseId } = await params;
  const course = await getCourseWithLessons(courseId);

  // Only show published courses to students
  if (!course || course.status !== 'PUBLISHED') {
    notFound();
  }

  // Check enrollment status
  const enrollment = await getEnrollment(session.user.id, courseId);
  const isEnrolled = !!enrollment;

  // Get completed lesson IDs if enrolled
  const completedLessonIds = isEnrolled
    ? await getCompletedLessonIds(session.user.id, courseId)
    : [];

  // Transform modules for sidebar (filter to published lessons)
  const modulesForSidebar = course.modules.map((module) => ({
    id: module.id,
    title: module.title,
    lessons: module.lessons.map((lesson) => ({
      id: lesson.id,
      title: lesson.title,
      status: lesson.status as 'DRAFT' | 'PUBLISHED',
    })),
  }));

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <CurriculumSidebar
        courseId={courseId}
        courseTitle={course.title}
        modules={modulesForSidebar}
        completedLessonIds={completedLessonIds}
        isEnrolled={isEnrolled}
      />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
