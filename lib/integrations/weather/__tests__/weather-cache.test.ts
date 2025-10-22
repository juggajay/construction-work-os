import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getFromCache,
  setInCache,
  clearCache,
  generateCacheKey,
} from '../weather-cache';

describe('Weather Cache', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearCache();
    // Reset timers
    vi.useFakeTimers();
  });

  describe('generateCacheKey', () => {
    it('should generate consistent keys for same coordinates', () => {
      const date = new Date('2024-01-15');
      const key1 = generateCacheKey(40.7128, -74.006, date);
      const key2 = generateCacheKey(40.7128, -74.006, date);
      expect(key1).toBe(key2);
    });

    it('should round coordinates to 2 decimal places', () => {
      const date = new Date('2024-01-15');
      const key1 = generateCacheKey(40.712834, -74.005941, date);
      const key2 = generateCacheKey(40.71, -74.01, date);
      expect(key1).toBe(key2);
    });

    it('should use date in key', () => {
      const date1 = new Date('2024-01-15');
      const date2 = new Date('2024-01-16');
      const key1 = generateCacheKey(40.71, -74.01, date1);
      const key2 = generateCacheKey(40.71, -74.01, date2);
      expect(key1).not.toBe(key2);
    });
  });

  describe('setInCache and getFromCache', () => {
    it('should store and retrieve weather data', () => {
      const date = new Date('2024-01-15');
      const weatherData = {
        condition: 'clear' as const,
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 10,
        humidity: 60,
      };

      setInCache(40.71, -74.01, date, weatherData);
      const cached = getFromCache(40.71, -74.01, date);

      expect(cached).toEqual(weatherData);
    });

    it('should return null for non-existent cache entry', () => {
      const date = new Date('2024-01-15');
      const cached = getFromCache(40.71, -74.01, date);
      expect(cached).toBeNull();
    });

    it('should expire cache after 24 hours', () => {
      const date = new Date('2024-01-15');
      const weatherData = {
        condition: 'clear' as const,
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 10,
        humidity: 60,
      };

      setInCache(40.71, -74.01, date, weatherData);

      // Cache should be valid immediately
      expect(getFromCache(40.71, -74.01, date)).toEqual(weatherData);

      // Fast forward 23 hours - should still be cached
      vi.advanceTimersByTime(23 * 60 * 60 * 1000);
      expect(getFromCache(40.71, -74.01, date)).toEqual(weatherData);

      // Fast forward 2 more hours (total 25 hours) - should be expired
      vi.advanceTimersByTime(2 * 60 * 60 * 1000);
      expect(getFromCache(40.71, -74.01, date)).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('should remove all cache entries', () => {
      const date = new Date('2024-01-15');
      const weatherData = {
        condition: 'clear' as const,
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 10,
        humidity: 60,
      };

      setInCache(40.71, -74.01, date, weatherData);
      setInCache(34.05, -118.24, date, weatherData);

      clearCache();

      expect(getFromCache(40.71, -74.01, date)).toBeNull();
      expect(getFromCache(34.05, -118.24, date)).toBeNull();
    });
  });
});
