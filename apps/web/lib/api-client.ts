const BASE = '/api/v1';

function getHeaders(): HeadersInit {
  const userId = typeof window !== 'undefined' ? localStorage.getItem('brainbolt-user-id') : null;
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (userId) (h as Record<string, string>)['x-user-id'] = userId;
  return h;
}

export async function fetchNextQuestion(sessionId?: string): Promise<{
  questionId: number;
  difficulty: number;
  prompt: string;
  choices: string[];
  sessionId: string | null;
  stateVersion: number;
  currentScore: number;
  currentStreak: number;
}> {
  const url = sessionId ? `${BASE}/quiz/next?sessionId=${encodeURIComponent(sessionId)}` : `${BASE}/quiz/next`;
  const r = await fetch(url, { headers: getHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function submitAnswer(params: {
  sessionId: string;
  questionId: number;
  answer: string;
  stateVersion: number;
  answerIdempotencyKey: string;
}): Promise<{
  correct: boolean;
  newDifficulty: number;
  newStreak: number;
  scoreDelta: number;
  totalScore: number;
  stateVersion: number;
  leaderboardRankScore: number;
  leaderboardRankStreak: number;
}> {
  const r = await fetch(`${BASE}/quiz/answer`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchMetrics(): Promise<{
  currentDifficulty: number;
  streak: number;
  maxStreak: number;
  totalScore: number;
  accuracy: number;
  difficultyHistogram: Array<{ difficulty: number; count: number }>;
  recentPerformance: Array<{ difficulty: number; correct: boolean }>;
}> {
  const r = await fetch(`${BASE}/quiz/metrics`, { headers: getHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchLeaderboardScore(limit?: number): Promise<
  Array<{ rank: number; userId: string; totalScore: number; updatedAt: string | null }>
> {
  const url = limit ? `${BASE}/leaderboard/score?limit=${limit}` : `${BASE}/leaderboard/score`;
  const r = await fetch(url, { headers: getHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export async function fetchLeaderboardStreak(limit?: number): Promise<
  Array<{ rank: number; userId: string; maxStreak: number; updatedAt: string | null }>
> {
  const url = limit ? `${BASE}/leaderboard/streak?limit=${limit}` : `${BASE}/leaderboard/streak`;
  const r = await fetch(url, { headers: getHeaders() });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export function ensureUserId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem('brainbolt-user-id');
  if (!id) {
    id = 'user-' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem('brainbolt-user-id', id);
  }
  return id;
}

/**  Start as a new user: will generate new id, store it, and then navigate to quiz so backend creates fresh user . */
export function startNewGame(): void {
  if (typeof window === 'undefined') return;
  const id = 'user-' + Math.random().toString(36).slice(2, 12);
  localStorage.setItem('brainbolt-user-id', id);
  window.location.href = '/quiz';
}
