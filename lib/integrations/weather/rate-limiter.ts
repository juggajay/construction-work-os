/**
 * Simple In-Memory Rate Limiter for Weather API
 * Prevents excessive API calls to Open-Meteo
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 100, windowMs = 60 * 60 * 1000) {
    // Default: 100 requests per hour
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is allowed
   * Returns { allowed: boolean, retryAfter?: number }
   */
  check(identifier: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No entry or window expired - allow request
    if (!entry || now >= entry.resetAt) {
      this.requests.set(identifier, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return { allowed: true };
    }

    // Within window - check limit
    if (entry.count < this.maxRequests) {
      entry.count++;
      return { allowed: true };
    }

    // Rate limit exceeded
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000); // seconds
    return { allowed: false, retryAfter };
  }

  /**
   * Cleanup expired entries (prevent memory leak)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current usage stats
   */
  getStats(identifier: string): {
    requests: number;
    limit: number;
    resetAt: number;
  } | null {
    const entry = this.requests.get(identifier);
    if (!entry) return null;

    return {
      requests: entry.count,
      limit: this.maxRequests,
      resetAt: entry.resetAt,
    };
  }
}

// Global rate limiter instance
// Identifier: 'weather-api' (shared across all weather requests)
const weatherRateLimiter = new RateLimiter(
  100, // 100 requests
  60 * 60 * 1000 // per hour
);

// Cleanup every 5 minutes
setInterval(() => {
  weatherRateLimiter.cleanup();
}, 5 * 60 * 1000);

/**
 * Check if weather API request is allowed
 */
export function checkWeatherRateLimit(): {
  allowed: boolean;
  retryAfter?: number;
} {
  return weatherRateLimiter.check('weather-api');
}

/**
 * Get current rate limit stats
 */
export function getWeatherRateLimitStats(): {
  requests: number;
  limit: number;
  resetAt: number;
} | null {
  return weatherRateLimiter.getStats('weather-api');
}

/**
 * Weather Rate Limit Error
 */
export class WeatherRateLimitError extends Error {
  constructor(
    public retryAfter: number,
    message = `Weather API rate limit exceeded. Retry after ${retryAfter} seconds.`
  ) {
    super(message);
    this.name = 'WeatherRateLimitError';
  }
}
