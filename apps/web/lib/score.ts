/**
 * Score calculation: basePoints(difficulty) * streakMultiplier(streak).
 * Streak multiplier capped at 3.
 */

const BASE_POINTS_PER_LEVEL = 100;
const STREAK_MULTIPLIER_PER_STREAK = 0.1;
const STREAK_CAP = 3;

export function basePoints(difficulty: number): number {
  return BASE_POINTS_PER_LEVEL * Math.max(1, difficulty);
}

export function streakMultiplier(streak: number): number {
  const mult = 1 + streak * STREAK_MULTIPLIER_PER_STREAK;
  return Math.min(mult, STREAK_CAP);
}

export function scoreDelta(difficulty: number, streak: number, correct: boolean): number {
  if (!correct) return 0;
  return Math.round(basePoints(difficulty) * streakMultiplier(streak));
}

export { STREAK_CAP };
