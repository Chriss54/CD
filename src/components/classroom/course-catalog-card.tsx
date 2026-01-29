import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CatalogCourse {
  id: string;
  title: string;
  description: string | null;
  lessonCount: number;
}

interface CourseCatalogCardProps {
  course: CatalogCourse;
}

export function CourseCatalogCard({ course }: CourseCatalogCardProps) {
  return (
    <Link
      href={`/classroom/courses/${course.id}`}
      className={cn(
        'block border border-border rounded-lg p-4',
        'hover:shadow-md transition-shadow',
        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
      )}
    >
      <div className="space-y-3">
        <h3 className="font-semibold text-foreground truncate">{course.title}</h3>
        {course.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {course.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
            {course.lessonCount} {course.lessonCount === 1 ? 'lesson' : 'lessons'}
          </span>
        </div>
      </div>
    </Link>
  );
}
