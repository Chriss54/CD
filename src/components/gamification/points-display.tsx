import { getPointsToNextLevel } from '@/lib/gamification-config';

interface PointsDisplayProps {
  points: number;
  level: number;
}

export function PointsDisplay({ points, level }: PointsDisplayProps) {
  const progress = getPointsToNextLevel(points, level);

  return (
    <div className="space-y-2">
      {/* Current stats */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Level {level}</span>
        <span className="text-sm font-medium">{points} points</span>
      </div>

      {/* Progress bar (if not max level) */}
      {progress && (
        <div className="space-y-1">
          <div
            className="h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress.current}
            aria-valuemin={0}
            aria-valuemax={progress.required}
            aria-label={`${progress.current} of ${progress.required} points to Level ${level + 1}`}
          >
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${Math.min(progress.progress, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {progress.current}/{progress.required} pts to Level {level + 1}
          </p>
        </div>
      )}

      {/* Max level message */}
      {!progress && (
        <p className="text-xs text-muted-foreground text-center">
          Max level reached!
        </p>
      )}
    </div>
  );
}
