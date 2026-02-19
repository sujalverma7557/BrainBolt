import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
}


function getRedis(): Redis {
  if (global.__redis) return global.__redis;

  const client = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    tls: process.env.NODE_ENV === 'production' ? {} : undefined,
  });

  global.__redis = client;
  return client;
}

export const redis = getRedis();


export const TTL = {
  userState: 3600, // 1 hour
  questionPool: 86400, // 24h
  idempotency: 86400, // 24h
  rateLimitWindow: 60, // 1 min
  sessionAsked: 7200, // 2h
} as const;
