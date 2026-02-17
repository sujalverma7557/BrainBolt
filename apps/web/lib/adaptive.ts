/**
 * Adaptive difficulty algorithm.
 * - If corect: increase the level by 1  (but when not at max).
 * - Wrong: decrease the level by 1 (hysteresis).
 * - Bounds: min 1, max 10.
 */

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STREAK_TO_INCREASE = 1;

export function getNextDifficulty(
  currentDifficulty: number,
  correct: boolean,
  _currentStreak: number
): number {
  const d = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, currentDifficulty));

  if (correct) {
    if (d < MAX_DIFFICULTY) return d + 1;
    return d;
  }

  // Wrong: then will decrease by 1 (hysteresis: single step down)
  if (d > MIN_DIFFICULTY) {
    return d - 1;
  }
  return MIN_DIFFICULTY;
}

export { MIN_DIFFICULTY, MAX_DIFFICULTY, MIN_STREAK_TO_INCREASE };
