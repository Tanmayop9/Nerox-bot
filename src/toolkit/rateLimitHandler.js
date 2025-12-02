/**
 * @nerox v4.0.0
 * @author Tanmay @ NeroX Studios
 * @description Rate limiter for spam protection
 */

import { RateLimitManager } from '@sapphire/ratelimits';

// 5 actions per 10 seconds
const rateLimiter = new RateLimitManager(10000, 5);

export const limited = (userId) => {
    const bucket = rateLimiter.acquire(userId);

    if (bucket.limited) {
        return true;
    }

    bucket.consume();
    return false;
};

export const getRemainingTime = (userId) => {
    const bucket = rateLimiter.acquire(userId);
    return bucket.remainingTime;
};
