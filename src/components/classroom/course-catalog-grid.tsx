import { EmptyState } from '@/components/ui/empty-state';
import { CourseCatalogCard, type CatalogCourse } from './course-catalog-card';
import { EnrolledCourseCard, type EnrolledCourse } from './enrolled-course-card';

interface CatalogGridUI {
  lessons: string;
  lesson: string;
  noCoursesAvailable: string;
  checkBackSoon: string;
}

interface CourseCatalogGridProps {
  courses: CatalogCourse[];
  ui: CatalogGridUI;
}

export function CourseCatalogGrid({ courses, ui }: CourseCatalogGridProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
          </svg>
        }
        title={ui.noCoursesAvailable}
        description={ui.checkBackSoon}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <CourseCatalogCard
          key={course.id}
          course={course}
          ui={{ lessons: ui.lessons, lesson: ui.lesson }}
        />
      ))}
    </div>
  );
}

interface EnrolledGridUI {
  lessons: string;
  completed: string;
  continueLearning: string;
  startCourse: string;
  noEnrolledCourses: string;
  notEnrolledYet: string;
}

interface EnrolledCoursesGridProps {
  courses: EnrolledCourse[];
  ui: EnrolledGridUI;
}

export function EnrolledCoursesGrid({ courses, ui }: EnrolledCoursesGridProps) {
  if (courses.length === 0) {
    return (
      <EmptyState
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        }
        title={ui.noEnrolledCourses}
        description={ui.notEnrolledYet}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <EnrolledCourseCard
          key={course.id}
          course={course}
          ui={{
            lessons: ui.lessons,
            completed: ui.completed,
            continueLearning: ui.continueLearning,
            startCourse: ui.startCourse,
          }}
        />
      ))}
    </div>
  );
}
