'use client';

import { useTransition, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createLesson } from '@/lib/lesson-actions';

interface LessonFormProps {
  moduleId: string;
  courseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function LessonForm({ moduleId, courseId, onSuccess, onCancel }: LessonFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);

      const result = await createLesson(formData);

      if ('error' in result) {
        if (typeof result.error === 'string') {
          setError(result.error);
        } else if (result.error && typeof result.error === 'object') {
          const fieldErrors = result.error as Record<string, string[]>;
          const firstError = Object.values(fieldErrors).flat()[0];
          setError(firstError || 'Invalid input');
        }
        return;
      }

      formRef.current?.reset();
      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      {/* Hidden fields */}
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="content" value='{"type":"doc","content":[]}' />
      <input type="hidden" name="status" value="DRAFT" />

      {/* Title input */}
      <div className="flex gap-2">
        <input
          name="title"
          type="text"
          placeholder="Lesson title"
          required
          minLength={3}
          maxLength={200}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          disabled={isPending}
          autoFocus
        />

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? 'Adding...' : 'Add'}
        </Button>

        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            disabled={isPending}
          >
            Cancel
          </Button>
        )}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
