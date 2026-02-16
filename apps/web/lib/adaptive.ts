/**
 * Adaptive difficulty algorithm with ping-pong stabilizer.
 * - Minimum streak required to increase difficulty (e.g. 2).
 * - Hysteresis: one wrong answer decreases difficulty; no flip-flop on correct/wrong alternation.
 * - Bounds: min 1, max 10.
 */

const MIN_DIFFICULTY = 1;
const MAX_DIFFICULTY = 10;
const MIN_STREAK_TO_INCREASE = 2;

export function getNextDifficulty(
  currentDifficulty: number,
  correct: boolean,
  currentStreak: number
): number {
  const d = Math.max(MIN_DIFFICULTY, Math.min(MAX_DIFFICULTY, currentDifficulty));

  if (correct) {
    // Only increase if streak >= MIN_STREAK_TO_INCREASE (stabilizer)
    if (currentStreak >= MIN_STREAK_TO_INCREASE && d < MAX_DIFFICULTY) {
      return d + 1;
    }
    return d;
  }

  // Wrong: then will decrease by 1 (hysteresis: single step down)
  if (d > MIN_DIFFICULTY) {
    return d - 1;
  }
  return MIN_DIFFICULTY;
}

export { MIN_DIFFICULTY, MAX_DIFFICULTY, MIN_STREAK_TO_INCREASE };
