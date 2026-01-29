import { EmptyState } from '@/components/ui/empty-state';
import { CourseCatalogCard, type CatalogCourse } from './course-catalog-card';
import { EnrolledCourseCard, type EnrolledCourse } from './enrolled-course-card';

interface CourseCatalogGridProps {
  courses: CatalogCourse[];
  emptyMessage?: string;
}

export function CourseCatalogGrid({
  courses,
  emptyMessage = 'Check back soon for new courses.',
}: CourseCatalogGridProps) {
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
        title="No courses available"
        description={emptyMessage}
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

interface EnrolledCoursesGridProps {
  courses: EnrolledCourse[];
}

export function EnrolledCoursesGrid({ courses }: EnrolledCoursesGridProps) {
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
        title="No enrolled courses"
        description="You haven't enrolled in any courses yet."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => (
        <EnrolledCourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}
