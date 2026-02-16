import { redis, cacheKeys, TTL } from '@/lib/redis';

const LIMIT_PER_MINUTE = 60;

export async function checkRateLimit(
  userId: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number }> {
  const key = cacheKeys.rateLimit(userId, endpoint);
  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, TTL.rateLimitWindow);
  const remaining = Math.max(0, LIMIT_PER_MINUTE - count);
  return { allowed: count <= LIMIT_PER_MINUTE, remaining };
}
