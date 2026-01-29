import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${clampedValue}%`}
      className={cn('h-2 w-full rounded-full bg-gray-200', className)}
    >
      <div
        className="h-full rounded-full bg-green-500 transition-all duration-300"
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}
