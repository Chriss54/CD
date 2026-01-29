'use client';

import { useTransition, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { createModule, updateModule } from '@/lib/module-actions';

interface ModuleFormProps {
  courseId: string;
  module?: {
    id: string;
    title: string;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ModuleForm({ courseId, module, onSuccess, onCancel }: ModuleFormProps) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!module;

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null);

      const result = isEdit
        ? await updateModule(module.id, formData)
        : await createModule(formData);

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

      if (!isEdit) {
        formRef.current?.reset();
      }

      router.refresh();
      onSuccess?.();
    });
  };

  return (
    <form ref={formRef} action={handleSubmit} className="space-y-3">
      {/* Hidden courseId for create */}
      {!isEdit && <input type="hidden" name="courseId" value={courseId} />}

      {/* Title */}
      <div className="flex gap-2">
        <input
          name="title"
          type="text"
          placeholder="Module title"
          required
          minLength={3}
          maxLength={100}
          defaultValue={module?.title || ''}
          className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isPending}
          autoFocus
        />

        <Button type="submit" disabled={isPending} size="sm">
          {isPending ? (isEdit ? 'Saving...' : 'Adding...') : isEdit ? 'Save' : 'Add'}
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
