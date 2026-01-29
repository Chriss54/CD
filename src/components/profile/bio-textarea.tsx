'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface BioTextareaProps {
  defaultValue?: string;
  maxLength?: number;
  error?: string;
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

export function BioTextarea({
  defaultValue = '',
  maxLength = 500,
  error,
}: BioTextareaProps) {
  const [value, setValue] = useState(defaultValue);
  const charCount = normalizeNewlines(value).length;
  const isOverLimit = charCount > maxLength;

  return (
    <div>
      <label htmlFor="bio" className="block text-sm font-medium mb-1">
        Bio
      </label>
      <textarea
        id="bio"
        name="bio"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={4}
        className={cn(
          'w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none',
          error && 'border-red-500'
        )}
        placeholder="Tell us about yourself..."
      />
      <div className="flex justify-between items-center mt-1">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <span
          className={cn(
            'text-sm ml-auto',
            isOverLimit ? 'text-red-500' : 'text-muted-foreground'
          )}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
