// Point values for each action
export const POINTS = {
  POST_CREATED: 5,
  COMMENT_CREATED: 2,
  LIKE_RECEIVED: 1,
  LESSON_COMPLETED: 10,
} as const;

// Exponential-ish curve for 10 levels
export const LEVEL_THRESHOLDS = [
  0, // Level 1
  50, // Level 2
  120, // Level 3
  210, // Level 4
  320, // Level 5
  450, // Level 6
  600, // Level 7
  770, // Level 8
  960, // Level 9
  1170, // Level 10
] as const;

export function calculateLevel(points: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (points >= LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
}

export function getPointsToNextLevel(
  points: number,
  currentLevel: number
): {
  current: number;
  required: number;
  progress: number;
} | null {
  if (currentLevel >= 10) return null; // Max level

  const currentThreshold = LEVEL_THRESHOLDS[currentLevel - 1];
  const nextThreshold = LEVEL_THRESHOLDS[currentLevel];
  const pointsInLevel = points - currentThreshold;
  const pointsNeeded = nextThreshold - currentThreshold;

  return {
    current: pointsInLevel,
    required: pointsNeeded,
    progress: (pointsInLevel / pointsNeeded) * 100,
  };
}
