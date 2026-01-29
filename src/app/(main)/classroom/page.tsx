import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  getPublishedCourses,
  getEnrolledCoursesWithProgress,
} from '@/lib/enrollment-actions';
import {
  CourseCatalogGrid,
  EnrolledCoursesGrid,
} from '@/components/classroom/course-catalog-grid';
import type { EnrolledCourse } from '@/components/classroom/enrolled-course-card';

async function EnrolledCoursesSection({ userId }: { userId: string }) {
  const enrolledRaw = await getEnrolledCoursesWithProgress(userId);

  // Map to EnrolledCourse type expected by grid
  const enrolledCourses: EnrolledCourse[] = enrolledRaw.map((course) => ({
    id: course.courseId,
    title: course.title,
    description: course.description,
    progressPercent: course.progressPercent,
    completedLessons: course.completedLessons,
    totalLessons: course.totalLessons,
    nextLessonId: course.nextLessonId,
  }));

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">My Courses</h2>
      <EnrolledCoursesGrid courses={enrolledCourses} />
    </section>
  );
}

async function AvailableCoursesSection({
  enrolledCourseIds,
}: {
  enrolledCourseIds: Set<string>;
}) {
  const allCourses = await getPublishedCourses();

  // Filter out already enrolled courses
  const availableCourses = allCourses.filter(
    (course) => !enrolledCourseIds.has(course.id)
  );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Available Courses</h2>
      <CourseCatalogGrid courses={availableCourses} />
    </section>
  );
}

async function AllCoursesSection() {
  const courses = await getPublishedCourses();

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Available Courses</h2>
      <CourseCatalogGrid courses={courses} />
    </section>
  );
}

function LoadingSection() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-32 bg-muted animate-pulse rounded" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-40 bg-muted animate-pulse rounded-lg border border-border"
          />
        ))}
      </div>
    </div>
  );
}

export default async function ClassroomPage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Classroom</h1>
        <p className="text-muted-foreground mt-1">
          Browse courses and track your learning progress.
        </p>
      </div>

      {session?.user?.id ? (
        <LoggedInContent userId={session.user.id} />
      ) : (
        <>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </a>{' '}
              to enroll in courses and track your progress.
            </p>
          </div>
          <Suspense fallback={<LoadingSection />}>
            <AllCoursesSection />
          </Suspense>
        </>
      )}
    </div>
  );
}

async function LoggedInContent({ userId }: { userId: string }) {
  // Fetch enrolled courses to know which to filter from available
  const enrolledRaw = await getEnrolledCoursesWithProgress(userId);
  const enrolledCourseIds = new Set(enrolledRaw.map((c) => c.courseId));

  // Map to EnrolledCourse type
  const enrolledCourses: EnrolledCourse[] = enrolledRaw.map((course) => ({
    id: course.courseId,
    title: course.title,
    description: course.description,
    progressPercent: course.progressPercent,
    completedLessons: course.completedLessons,
    totalLessons: course.totalLessons,
    nextLessonId: course.nextLessonId,
  }));

  // Fetch available courses
  const allCourses = await getPublishedCourses();
  const availableCourses = allCourses.filter(
    (course) => !enrolledCourseIds.has(course.id)
  );

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">My Courses</h2>
        <EnrolledCoursesGrid courses={enrolledCourses} />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Available Courses</h2>
        <CourseCatalogGrid courses={availableCourses} />
      </section>
    </>
  );
}
