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
import { tMany, getUserLanguage } from '@/lib/translation/helpers';
import { translateObjects } from '@/lib/translation/ui';

interface ClassroomUI {
  title: string;
  subtitle: string;
  myCourses: string;
  availableCourses: string;
  signIn: string;
  signInPrompt: string;
  lessons: string;
  lesson: string;
  completed: string;
  continueLearning: string;
  startCourse: string;
  noCoursesAvailable: string;
  checkBackSoon: string;
  noEnrolledCourses: string;
  notEnrolledYet: string;
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
  const userLanguage = await getUserLanguage();

  // Translate all UI text dynamically via DeepL
  const uiRaw = await tMany({
    title: 'Classroom',
    subtitle: 'Browse courses and track your learning progress.',
    myCourses: 'My Courses',
    availableCourses: 'Available Courses',
    signIn: 'Sign in',
    signInPrompt: 'to enroll in courses and track your progress.',
    lessons: 'lessons',
    lesson: 'lesson',
    completed: 'Completed',
    continueLearning: 'Continue Learning',
    startCourse: 'Start Course',
    noCoursesAvailable: 'No courses available',
    checkBackSoon: 'Check back soon for new courses.',
    noEnrolledCourses: 'No enrolled courses',
    notEnrolledYet: "You haven't enrolled in any courses yet.",
  }, 'classroom');

  const ui: ClassroomUI = {
    title: uiRaw.title,
    subtitle: uiRaw.subtitle,
    myCourses: uiRaw.myCourses,
    availableCourses: uiRaw.availableCourses,
    signIn: uiRaw.signIn,
    signInPrompt: uiRaw.signInPrompt,
    lessons: uiRaw.lessons,
    lesson: uiRaw.lesson,
    completed: uiRaw.completed,
    continueLearning: uiRaw.continueLearning,
    startCourse: uiRaw.startCourse,
    noCoursesAvailable: uiRaw.noCoursesAvailable,
    checkBackSoon: uiRaw.checkBackSoon,
    noEnrolledCourses: uiRaw.noEnrolledCourses,
    notEnrolledYet: uiRaw.notEnrolledYet,
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{ui.title}</h1>
        <p className="text-muted-foreground mt-1">
          {ui.subtitle}
        </p>
      </div>

      {session?.user?.id ? (
        <Suspense fallback={<LoadingSection />}>
          <LoggedInContent userId={session.user.id} ui={ui} userLanguage={userLanguage} />
        </Suspense>
      ) : (
        <>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <a href="/login" className="text-primary hover:underline font-medium">
                {ui.signIn}
              </a>{' '}
              {ui.signInPrompt}
            </p>
          </div>
          <Suspense fallback={<LoadingSection />}>
            <AllCoursesSection ui={ui} userLanguage={userLanguage} />
          </Suspense>
        </>
      )}
    </div>
  );
}

async function AllCoursesSection({ ui, userLanguage }: { ui: ClassroomUI; userLanguage: string }) {
  const courses = await getPublishedCourses();

  // Translate course titles and descriptions
  const translatedCourses = await translateObjects(
    courses,
    ['title', 'description'],
    'en',
    userLanguage,
    'course'
  );

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{ui.availableCourses}</h2>
      <CourseCatalogGrid
        courses={translatedCourses}
        ui={{
          lessons: ui.lessons,
          lesson: ui.lesson,
          noCoursesAvailable: ui.noCoursesAvailable,
          checkBackSoon: ui.checkBackSoon,
        }}
      />
    </section>
  );
}

async function LoggedInContent({ userId, ui, userLanguage }: { userId: string; ui: ClassroomUI; userLanguage: string }) {
  // Fetch enrolled courses
  const enrolledRaw = await getEnrolledCoursesWithProgress(userId);
  const enrolledCourseIds = new Set(enrolledRaw.map((c) => c.courseId));

  // Map and translate enrolled courses
  const enrolledCoursesRaw: EnrolledCourse[] = enrolledRaw.map((course) => ({
    id: course.courseId,
    title: course.title,
    description: course.description,
    progressPercent: course.progressPercent,
    completedLessons: course.completedLessons,
    totalLessons: course.totalLessons,
    nextLessonId: course.nextLessonId,
  }));

  const enrolledCourses = await translateObjects(
    enrolledCoursesRaw,
    ['title', 'description'],
    'en',
    userLanguage,
    'course'
  );

  // Fetch and translate available courses
  const allCourses = await getPublishedCourses();
  const availableCoursesRaw = allCourses.filter(
    (course) => !enrolledCourseIds.has(course.id)
  );

  const availableCourses = await translateObjects(
    availableCoursesRaw,
    ['title', 'description'],
    'en',
    userLanguage,
    'course'
  );

  return (
    <>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ui.myCourses}</h2>
        <EnrolledCoursesGrid
          courses={enrolledCourses}
          ui={{
            lessons: ui.lessons,
            completed: ui.completed,
            continueLearning: ui.continueLearning,
            startCourse: ui.startCourse,
            noEnrolledCourses: ui.noEnrolledCourses,
            notEnrolledYet: ui.notEnrolledYet,
          }}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">{ui.availableCourses}</h2>
        <CourseCatalogGrid
          courses={availableCourses}
          ui={{
            lessons: ui.lessons,
            lesson: ui.lesson,
            noCoursesAvailable: ui.noCoursesAvailable,
            checkBackSoon: ui.checkBackSoon,
          }}
        />
      </section>
    </>
  );
}
