import { describe, it, expect } from 'vitest';
import {
  analyzeWeatherPatterns,
  getWeatherImpactSeverity,
  getMonthlyWeatherSummary,
} from '../weather-analytics';

describe('Weather Analytics', () => {
  describe('analyzeWeatherPatterns', () => {
    it('should handle empty reports array', () => {
      const result = analyzeWeatherPatterns([]);
      expect(result.totalDays).toBe(0);
      expect(result.workableDays).toBe(0);
      expect(result.impactedDays).toBe(0);
    });

    it('should calculate basic statistics', () => {
      const reports = [
        {
          date: '2024-01-15',
          condition: 'clear' as const,
          temperatureHigh: 75,
          temperatureLow: 55,
          precipitation: 0,
          windSpeed: 10,
          humidity: 60,
          totalCrewCount: 20,
        },
        {
          date: '2024-01-16',
          condition: 'rain' as const,
          temperatureHigh: 65,
          temperatureLow: 50,
          precipitation: 0.3,
          windSpeed: 15,
          humidity: 80,
          totalCrewCount: 15,
        },
        {
          date: '2024-01-17',
          condition: 'partly_cloudy' as const,
          temperatureHigh: 70,
          temperatureLow: 52,
          precipitation: 0,
          windSpeed: 8,
          humidity: 65,
          totalCrewCount: 22,
        },
      ];

      const result = analyzeWeatherPatterns(reports);

      expect(result.totalDays).toBe(3);
      expect(result.conditionBreakdown.clear).toBe(1);
      expect(result.conditionBreakdown.rain).toBe(1);
      expect(result.conditionBreakdown.partly_cloudy).toBe(1);
      expect(result.averageTemperatureHigh).toBe(70);
      expect(result.averageTemperatureLow).toBe(52.333333333333336);
      expect(result.totalPrecipitation).toBe(0.3);
      expect(result.daysWithPrecipitation).toBe(1);
    });

    it('should identify workable vs impacted days', () => {
      const reports = [
        {
          date: '2024-01-15',
          condition: 'clear' as const,
          temperatureHigh: 75,
          temperatureLow: 55,
          precipitation: 0,
          windSpeed: 10,
        },
        {
          date: '2024-01-16',
          condition: 'rain' as const,
          temperatureHigh: 65,
          temperatureLow: 50,
          precipitation: 1.5, // Heavy rain - unworkable
          windSpeed: 15,
        },
        {
          date: '2024-01-17',
          condition: 'clear' as const,
          temperatureHigh: 110, // Extreme heat - unworkable
          temperatureLow: 85,
          precipitation: 0,
          windSpeed: 5,
        },
      ];

      const result = analyzeWeatherPatterns(reports);

      expect(result.totalDays).toBe(3);
      expect(result.workableDays).toBe(1);
      expect(result.impactedDays).toBe(2);
      expect(result.workableDaysPercentage).toBeCloseTo(33.33, 1);
    });

    it('should calculate productivity impact', () => {
      const reports = [
        {
          date: '2024-01-15',
          condition: 'clear' as const,
          temperatureHigh: 75,
          temperatureLow: 55,
          totalCrewCount: 20,
        },
        {
          date: '2024-01-16',
          condition: 'clear' as const,
          temperatureHigh: 72,
          temperatureLow: 52,
          totalCrewCount: 22,
        },
        {
          date: '2024-01-17',
          condition: 'rain' as const,
          temperatureHigh: 65,
          temperatureLow: 50,
          totalCrewCount: 10,
        },
        {
          date: '2024-01-18',
          condition: 'rain' as const,
          temperatureHigh: 60,
          temperatureLow: 48,
          totalCrewCount: 8,
        },
      ];

      const result = analyzeWeatherPatterns(reports);

      expect(result.averageCrewOnClearDays).toBe(21);
      expect(result.averageCrewOnRainyDays).toBe(9);
      expect(result.productivityImpactPercentage).toBeCloseTo(57.14, 1);
    });

    it('should count extreme weather days', () => {
      const reports = [
        {
          date: '2024-01-15',
          condition: 'clear' as const,
          temperatureHigh: 110, // Extreme heat
          temperatureLow: 85,
          precipitation: 0,
          windSpeed: 5,
        },
        {
          date: '2024-01-16',
          condition: 'snow' as const,
          temperatureHigh: 25,
          temperatureLow: 10, // Extreme cold
          precipitation: 0.5,
          windSpeed: 30, // High wind
        },
        {
          date: '2024-01-17',
          condition: 'rain' as const,
          temperatureHigh: 65,
          temperatureLow: 50,
          precipitation: 0.8, // Heavy rain
          windSpeed: 15,
        },
      ];

      const result = analyzeWeatherPatterns(reports);

      expect(result.extremeHeatDays).toBe(1);
      expect(result.extremeColdDays).toBe(1);
      expect(result.highWindDays).toBe(1);
      expect(result.heavyRainDays).toBe(1);
    });
  });

  describe('getWeatherImpactSeverity', () => {
    it('should return none for ideal conditions', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'clear',
        temperatureHigh: 75,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 5,
      });

      expect(result.severity).toBe('none');
      expect(result.reasons).toHaveLength(0);
    });

    it('should return critical for heavy rain', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'rain',
        temperatureHigh: 65,
        temperatureLow: 50,
        precipitation: 1.5,
        windSpeed: 10,
      });

      expect(result.severity).toBe('critical');
      expect(result.reasons).toContain('Heavy precipitation (>1")');
    });

    it('should return critical for extreme heat', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'clear',
        temperatureHigh: 110,
        temperatureLow: 85,
        precipitation: 0,
        windSpeed: 5,
      });

      expect(result.severity).toBe('critical');
      expect(result.reasons).toContain('Extreme heat (>105°F)');
    });

    it('should return critical for extreme cold', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'snow',
        temperatureHigh: 20,
        temperatureLow: 5,
        precipitation: 0,
        windSpeed: 10,
      });

      expect(result.severity).toBe('critical');
      expect(result.reasons).toContain('Extreme cold (<15°F)');
    });

    it('should return critical for dangerous winds', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'wind',
        temperatureHigh: 70,
        temperatureLow: 55,
        precipitation: 0,
        windSpeed: 40,
      });

      expect(result.severity).toBe('critical');
      expect(result.reasons).toContain('Dangerous winds (>35 mph)');
    });

    it('should accumulate multiple severity factors', () => {
      const result = getWeatherImpactSeverity({
        date: '2024-01-15',
        condition: 'rain',
        temperatureHigh: 100,
        temperatureLow: 30,
        precipitation: 0.8,
        windSpeed: 28,
      });

      expect(result.severity).toBe('critical');
      expect(result.reasons.length).toBeGreaterThan(1);
    });
  });

  describe('getMonthlyWeatherSummary', () => {
    it('should group reports by month', () => {
      const reports = [
        {
          date: '2024-01-15',
          condition: 'clear' as const,
          temperatureHigh: 75,
          temperatureLow: 55,
        },
        {
          date: '2024-01-20',
          condition: 'rain' as const,
          temperatureHigh: 65,
          temperatureLow: 50,
        },
        {
          date: '2024-02-10',
          condition: 'clear' as const,
          temperatureHigh: 70,
          temperatureLow: 52,
        },
      ];

      const result = getMonthlyWeatherSummary(reports);

      expect(result).toHaveLength(2);
      expect(result[0].month).toBe('2024-01');
      expect(result[0].analytics.totalDays).toBe(2);
      expect(result[1].month).toBe('2024-02');
      expect(result[1].analytics.totalDays).toBe(1);
    });

    it('should sort months chronologically', () => {
      const reports = [
        { date: '2024-03-15', condition: 'clear' as const },
        { date: '2024-01-20', condition: 'rain' as const },
        { date: '2024-02-10', condition: 'clear' as const },
      ];

      const result = getMonthlyWeatherSummary(reports);

      expect(result[0].month).toBe('2024-01');
      expect(result[1].month).toBe('2024-02');
      expect(result[2].month).toBe('2024-03');
    });
  });
});
