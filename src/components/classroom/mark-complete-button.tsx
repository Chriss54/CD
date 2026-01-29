'use client';

import { useOptimistic, useTransition } from 'react';
import { toggleLessonComplete } from '@/lib/progress-actions';

interface MarkCompleteButtonProps {
  lessonId: string;
  initialCompleted: boolean;
}

export function MarkCompleteButton({
  lessonId,
  initialCompleted,
}: MarkCompleteButtonProps) {
  const [isPending, startTransition] = useTransition();

  const [optimisticCompleted, setOptimisticCompleted] = useOptimistic(
    initialCompleted,
    (_state: boolean, newCompleted: boolean) => newCompleted
  );

  const handleClick = () => {
    const newCompleted = !optimisticCompleted;

    startTransition(async () => {
      setOptimisticCompleted(newCompleted);
      await toggleLessonComplete(lessonId);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        optimisticCompleted
          ? 'bg-green-100 text-green-800 hover:bg-green-200'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
      aria-label={optimisticCompleted ? 'Mark as incomplete' : 'Mark as complete'}
    >
      {optimisticCompleted ? (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-5 h-5"
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
              clipRule="evenodd"
            />
          </svg>
          Completed
        </>
      ) : (
        <>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="9" />
          </svg>
          Mark Complete
        </>
      )}
    </button>
  );
}
