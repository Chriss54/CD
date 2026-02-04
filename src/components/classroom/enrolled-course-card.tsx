import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ProgressBar } from './progress-bar';

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string | null;
  progressPercent: number;
  completedLessons: number;
  totalLessons: number;
  nextLessonId: string | null;
}

interface EnrolledCardUI {
  lessons: string;
  completed: string;
  continueLearning: string;
  startCourse: string;
}

interface EnrolledCourseCardProps {
  course: EnrolledCourse;
  ui: EnrolledCardUI;
}

export function EnrolledCourseCard({ course, ui }: EnrolledCourseCardProps) {
  const isComplete = course.progressPercent === 100;

  return (
    <div
      className={cn(
        'border border-border rounded-lg p-4',
        'hover:shadow-md transition-shadow'
      )}
    >
      <div className="space-y-3">
        <Link
          href={`/classroom/courses/${course.id}`}
          className="block focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
        >
          <h3 className="font-semibold text-foreground truncate hover:text-primary transition-colors">
            {course.title}
          </h3>
        </Link>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {course.completedLessons}/{course.totalLessons} {ui.lessons}
            </span>
            {isComplete && (
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded font-medium">
                {ui.completed}
              </span>
            )}
          </div>
          <ProgressBar value={course.progressPercent} />
        </div>
        {!isComplete && course.nextLessonId && (
          <Button asChild size="sm" className="w-full">
            <Link href={`/classroom/courses/${course.id}/lessons/${course.nextLessonId}`}>
              {ui.continueLearning}
            </Link>
          </Button>
        )}
        {!isComplete && !course.nextLessonId && course.totalLessons > 0 && (
          <Button asChild size="sm" variant="outline" className="w-full">
            <Link href={`/classroom/courses/${course.id}`}>
              {ui.startCourse}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}
