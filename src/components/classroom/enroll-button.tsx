'use client';

import { useTransition, useState } from 'react';
import { enrollInCourse, unenrollFromCourse } from '@/lib/enrollment-actions';
import { Button } from '@/components/ui/button';

interface EnrollButtonProps {
  courseId: string;
  isEnrolled: boolean;
}

export function EnrollButton({ courseId, isEnrolled }: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmUnenroll, setConfirmUnenroll] = useState(false);

  const handleEnroll = () => {
    startTransition(async () => {
      await enrollInCourse(courseId);
    });
  };

  const handleUnenroll = () => {
    if (!confirmUnenroll) {
      setConfirmUnenroll(true);
      return;
    }

    startTransition(async () => {
      await unenrollFromCourse(courseId);
      setConfirmUnenroll(false);
    });
  };

  if (isEnrolled) {
    return (
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          Enrolled
        </span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnenroll}
          disabled={isPending}
          className={`text-muted-foreground hover:text-destructive ${
            isPending ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {confirmUnenroll ? 'Confirm?' : 'Unenroll'}
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleEnroll}
      disabled={isPending}
      className={isPending ? 'opacity-50 cursor-not-allowed' : ''}
    >
      {isPending ? 'Enrolling...' : 'Enroll'}
    </Button>
  );
}
