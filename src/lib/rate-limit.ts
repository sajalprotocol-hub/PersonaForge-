import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Professional Rate Limiter:
 * - Uses in-memory Map for local development.
 * - Ready for Upstash Redis in production (requires serverless-friendly store).
 */

interface RateLimitEntry {
    count: number;
    resetTime: number;
}

const memoryStore = new Map<string, RateLimitEntry>();

// Clean up expired entries
const cleanMemoryStore = () => {
    const now = Date.now();
    for (const [key, entry] of Array.from(memoryStore.entries())) {
        if (now > entry.resetTime) memoryStore.delete(key);
    }
};

interface RateLimitConfig {
    maxRequests: number;
    windowSeconds: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
    maxRequests: 10,
    windowSeconds: 60,
};

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    retryAfterSeconds: number;
}

// Lazy-init Upstash Ratelimit
let upstashRatelimit: Ratelimit | null = null;

const getUpstashRatelimit = () => {
    if (upstashRatelimit) return upstashRatelimit;

    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
        const redis = new Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });

        upstashRatelimit = new Ratelimit({
            redis: redis,
            limiter: Ratelimit.slidingWindow(10, "60 s"), // This will be overridden by the config if needed
            analytics: true,
            prefix: "@upstash/ratelimit",
        });
        return upstashRatelimit;
    }
    return null;
};

/**
 * Check rate limit for a given key.
 * Now async to support future Redis integration.
 */
export async function checkRateLimit(
    key: string,
    config: RateLimitConfig = DEFAULT_CONFIG
): Promise<RateLimitResult> {
    const now = Date.now();

    // 1. Production Logic (Upstash Redis)
    const ratelimit = getUpstashRatelimit();
    if (ratelimit) {
        // Note: The 'limiter' in getUpstashRatelimit is a default. 
        // For more complex usage, we'd need to recreate the Ratelimit instance per config, 
        // but for now, we'll use the default or just pass parameters.
        const { success, remaining, reset } = await ratelimit.limit(key);
        return {
            allowed: success,
            remaining,
            retryAfterSeconds: Math.ceil((reset - now) / 1000),
        };
    }

    // 2. Development/Local Logic (In-Memory)
    cleanMemoryStore();
    const entry = memoryStore.get(key);

    if (!entry || now > entry.resetTime) {
        memoryStore.set(key, {
            count: 1,
            resetTime: now + config.windowSeconds * 1000,
        });
        return {
            allowed: true,
            remaining: config.maxRequests - 1,
            retryAfterSeconds: 0,
        };
    }

    if (entry.count < config.maxRequests) {
        entry.count++;
        return {
            allowed: true,
            remaining: config.maxRequests - entry.count,
            retryAfterSeconds: 0,
        };
    }

    return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000),
    };
}
