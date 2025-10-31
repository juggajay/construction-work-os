import { describe, it, expect } from 'vitest';
import {
  getWeatherIcon,
  getWeatherColor,
  getWeatherLabel,
  formatTemperature,
  formatPrecipitation,
  formatWindSpeed,
  isConstructionWorkable,
} from '../weather-utils';

describe('Weather Utils', () => {
  describe('getWeatherIcon', () => {
    it('should return correct icon for each condition', () => {
      expect(getWeatherIcon('clear')).toBe('☀️');
      expect(getWeatherIcon('partly_cloudy')).toBe('⛅');
      expect(getWeatherIcon('overcast')).toBe('☁️');
      expect(getWeatherIcon('rain')).toBe('🌧️');
      expect(getWeatherIcon('snow')).toBe('❄️');
      expect(getWeatherIcon('fog')).toBe('🌫️');
      expect(getWeatherIcon('wind')).toBe('💨');
    });

    it('should return default icon for unknown condition', () => {
      // @ts-expect-error - Testing invalid weather condition input to verify fallback behavior
      expect(getWeatherIcon('unknown')).toBe('☀️');
    });
  });

  describe('getWeatherColor', () => {
    it('should return correct color for each condition', () => {
      expect(getWeatherColor('clear')).toBe('#FDB813');
      expect(getWeatherColor('rain')).toBe('#4A90E2');
      expect(getWeatherColor('snow')).toBe('#A0D8F1');
    });
  });

  describe('getWeatherLabel', () => {
    it('should return human-readable label', () => {
      expect(getWeatherLabel('clear')).toBe('Clear');
      expect(getWeatherLabel('partly_cloudy')).toBe('Partly Cloudy');
      expect(getWeatherLabel('overcast')).toBe('Overcast');
    });
  });

  describe('formatTemperature', () => {
    it('should format temperature with degree symbol', () => {
      expect(formatTemperature(72)).toBe('72°F');
      expect(formatTemperature(32.5)).toBe('33°F');
      expect(formatTemperature(-5)).toBe('-5°F');
    });

    it('should handle zero', () => {
      expect(formatTemperature(0)).toBe('0°F');
    });
  });

  describe('formatPrecipitation', () => {
    it('should format precipitation in inches', () => {
      expect(formatPrecipitation(0)).toBe('0"');
      expect(formatPrecipitation(0.5)).toBe('0.5"');
      expect(formatPrecipitation(1.25)).toBe('1.25"');
    });

    it('should round to 2 decimal places', () => {
      expect(formatPrecipitation(0.123)).toBe('0.12"');
      expect(formatPrecipitation(1.999)).toBe('2"');
    });
  });

  describe('formatWindSpeed', () => {
    it('should format wind speed in mph', () => {
      expect(formatWindSpeed(0)).toBe('0 mph');
      expect(formatWindSpeed(10)).toBe('10 mph');
      expect(formatWindSpeed(25.5)).toBe('26 mph');
    });
  });

  describe('isConstructionWorkable', () => {
    it('should return true for ideal conditions', () => {
      const result = isConstructionWorkable({
        condition: 'clear',
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 5,
      });
      expect(result.workable).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return false for heavy rain', () => {
      const result = isConstructionWorkable({
        condition: 'rain',
        temperatureHigh: 65,
        temperatureLow: 55,
        precipitation: 1.5,
        windSpeed: 10,
      });
      expect(result.workable).toBe(false);
      expect(result.warnings).toContain('Heavy precipitation (>1")');
    });

    it('should return false for extreme heat', () => {
      const result = isConstructionWorkable({
        condition: 'clear',
        temperatureHigh: 110,
        temperatureLow: 85,
        precipitation: 0,
        windSpeed: 5,
      });
      expect(result.workable).toBe(false);
      expect(result.warnings).toContain('Extreme heat (>105°F)');
    });

    it('should return false for extreme cold', () => {
      const result = isConstructionWorkable({
        condition: 'clear',
        temperatureHigh: 20,
        temperatureLow: 10,
        precipitation: 0,
        windSpeed: 5,
      });
      expect(result.workable).toBe(false);
      expect(result.warnings).toContain('Extreme cold (<15°F)');
    });

    it('should return false for dangerous winds', () => {
      const result = isConstructionWorkable({
        condition: 'wind',
        temperatureHigh: 70,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 40,
      });
      expect(result.workable).toBe(false);
      expect(result.warnings).toContain('Dangerous winds (>35 mph)');
    });

    it('should return true with warnings for moderate conditions', () => {
      const result = isConstructionWorkable({
        condition: 'partly_cloudy',
        temperatureHigh: 95,
        temperatureLow: 75,
        precipitation: 0.3,
        windSpeed: 20,
      });
      expect(result.workable).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings).toContain('High temperatures (>90°F)');
    });
  });
});
