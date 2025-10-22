/**
 * Weather Data Cache Layer
 * Simple in-memory cache to reduce API calls
 * Cache weather data per location/date for 24 hours
 */

import { WeatherData } from './open-meteo-client';

interface CacheEntry {
  data: WeatherData;
  expiresAt: number; // Unix timestamp
}

// In-memory cache (use Redis in production for multi-instance deployments)
const weatherCache = new Map<string, CacheEntry>();

/**
 * Generate cache key from location and date
 */
export function generateCacheKey(
  latitude: number,
  longitude: number,
  date: Date
): string {
  // Round to 2 decimal places to group nearby locations
  const lat = Math.round(latitude * 100) / 100;
  const lon = Math.round(longitude * 100) / 100;
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

  return `weather:${lat},${lon}:${dateStr}`;
}

/**
 * Get weather data from cache
 * @returns Cached weather data or null if not found/expired
 */
export function getFromCache(
  latitude: number,
  longitude: number,
  date: Date
): WeatherData | null {
  const key = generateCacheKey(latitude, longitude, date);
  const entry = weatherCache.get(key);

  if (!entry) {
    return null;
  }

  // Check if expired
  if (Date.now() > entry.expiresAt) {
    weatherCache.delete(key);
    return null;
  }

  return entry.data;
}

/**
 * Store weather data in cache
 * @param ttl - Time to live in seconds (default: 24 hours)
 */
export function setInCache(
  latitude: number,
  longitude: number,
  date: Date,
  data: WeatherData,
  ttl = 86400 // 24 hours
): void {
  const key = generateCacheKey(latitude, longitude, date);
  const expiresAt = Date.now() + ttl * 1000;

  weatherCache.set(key, {
    data,
    expiresAt,
  });
}

/**
 * Invalidate cache entry (useful when manual weather override occurs)
 */
export function invalidateCache(
  latitude: number,
  longitude: number,
  date: Date
): void {
  const key = generateCacheKey(latitude, longitude, date);
  weatherCache.delete(key);
}

/**
 * Clear all weather cache (useful for testing or memory management)
 */
export function clearCache(): void {
  weatherCache.clear();
}

/**
 * Get cache stats for monitoring
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; expiresAt: Date }>;
} {
  const entries = Array.from(weatherCache.entries()).map(([key, entry]) => ({
    key,
    expiresAt: new Date(entry.expiresAt),
  }));

  return {
    size: weatherCache.size,
    entries,
  };
}

/**
 * Cleanup expired cache entries (run periodically)
 */
export function cleanupExpiredEntries(): number {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of weatherCache.entries()) {
    if (now > entry.expiresAt) {
      weatherCache.delete(key);
      cleaned++;
    }
  }

  return cleaned;
}

// Auto-cleanup every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const cleaned = cleanupExpiredEntries();
    if (cleaned > 0) {
      console.log(`[Weather Cache] Cleaned up ${cleaned} expired entries`);
    }
  }, 60 * 60 * 1000); // 1 hour
}
