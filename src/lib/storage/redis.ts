import { Redis } from "@upstash/redis";

let redisClient: Redis | null | undefined;

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function getRedisCredentials() {
  const candidates = [
    {
      url: process.env.DBSTORAGE_UPSTASH_REDIS_REST_URL,
      token: process.env.DBSTORAGE_UPSTASH_REDIS_REST_TOKEN,
    },
    {
      url: process.env.DBSTORAGE_KV_REST_API_URL,
      token: process.env.DBSTORAGE_KV_REST_API_TOKEN,
    },
    {
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
    {
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    },
  ];

  return (
    candidates.find(
      (candidate) => hasValue(candidate.url) && hasValue(candidate.token),
    ) ?? null
  );
}

export function isRedisConfigured() {
  return Boolean(getRedisCredentials());
}

export function getRedis() {
  const credentials = getRedisCredentials();
  if (!isRedisConfigured()) {
    return null;
  }

  if (typeof redisClient === "undefined") {
    redisClient = new Redis({
      url: credentials!.url!,
      token: credentials!.token!,
      enableAutoPipelining: false,
      enableTelemetry: false,
    });
  }

  return redisClient;
}
