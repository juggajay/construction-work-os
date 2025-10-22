/**
 * Weather Utility Functions
 * Helper functions for weather data display and processing
 */

import { WeatherData } from '@/lib/integrations/weather/open-meteo-client';

export type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'wind';

/**
 * Get weather icon emoji for display
 */
export function getWeatherIcon(condition: WeatherCondition): string {
  const icons: Record<WeatherCondition, string> = {
    clear: '☀️',
    partly_cloudy: '⛅',
    overcast: '☁️',
    rain: '🌧️',
    snow: '❄️',
    fog: '🌫️',
    wind: '💨',
  };

  return icons[condition] || '☀️';
}

/**
 * Get weather condition label for display
 */
export function getWeatherLabel(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    clear: 'Clear',
    partly_cloudy: 'Partly Cloudy',
    overcast: 'Overcast',
    rain: 'Rain',
    snow: 'Snow',
    fog: 'Fog',
    wind: 'Windy',
  };

  return labels[condition] || 'Clear';
}

/**
 * Get color for weather condition (hex code)
 */
export function getWeatherColor(condition: WeatherCondition): string {
  const colors: Record<WeatherCondition, string> = {
    clear: '#FDB813',
    partly_cloudy: '#F5A623',
    overcast: '#9B9B9B',
    rain: '#4A90E2',
    snow: '#A0D8F1',
    fog: '#BDBDBD',
    wind: '#7ED321',
  };
  return colors[condition] || '#FDB813';
}

/**
 * Get color code for weather severity (for badges/alerts)
 */
export function getWeatherColorCode(
  condition: WeatherCondition,
  windSpeed?: number
): 'default' | 'warning' | 'destructive' {
  // High wind warning
  if (windSpeed && windSpeed > 25) {
    return 'destructive';
  }

  // Adverse weather conditions
  if (condition === 'rain' || condition === 'snow' || condition === 'fog') {
    return 'warning';
  }

  return 'default';
}

/**
 * Check if historical weather is available via API
 * Most free weather APIs support 5-7 days of historical data
 */
export function isHistoricalWeatherAvailable(date: Date, maxDays = 5): boolean {
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  return daysDiff <= maxDays && daysDiff >= 0;
}

/**
 * Format temperature for display
 */
export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°F`;
}

/**
 * Format temperature range for display
 */
export function formatTemperatureRange(high: number, low: number): string {
  return `${Math.round(low)}°F - ${Math.round(high)}°F`;
}

/**
 * Format precipitation for display
 */
export function formatPrecipitation(inches: number): string {
  if (inches === 0) return 'None';
  if (inches < 0.01) return 'Trace';
  return `${inches.toFixed(2)}"`;
}

/**
 * Format wind speed for display
 */
export function formatWindSpeed(mph: number): string {
  return `${Math.round(mph)} mph`;
}

/**
 * Format humidity for display
 */
export function formatHumidity(percent: number): string {
  return `${Math.round(percent)}%`;
}

/**
 * Get weather summary text
 */
export function getWeatherSummary(weather: WeatherData): string {
  const parts = [
    getWeatherLabel(weather.condition),
    formatTemperatureRange(weather.temperatureHigh, weather.temperatureLow),
  ];

  if (weather.precipitation > 0) {
    parts.push(`${formatPrecipitation(weather.precipitation)} rain`);
  }

  if (weather.windSpeed > 15) {
    parts.push(`winds ${formatWindSpeed(weather.windSpeed)}`);
  }

  return parts.join(', ');
}

/**
 * Determine if weather conditions are suitable for construction work
 * Returns warning message if conditions are poor, null if suitable
 */
export function checkConstructionSuitability(weather: WeatherData): string | null {
  // Heavy rain
  if (weather.condition === 'rain' && weather.precipitation > 0.5) {
    return 'Heavy rain may impact concrete pours and outdoor work';
  }

  // Snow
  if (weather.condition === 'snow') {
    return 'Snow conditions may delay outdoor work';
  }

  // High winds
  if (weather.windSpeed > 25) {
    return 'High winds may restrict crane operations and working at heights';
  }

  // Extreme heat
  if (weather.temperatureHigh > 95) {
    return 'Extreme heat - ensure adequate hydration and rest breaks for crew';
  }

  // Extreme cold
  if (weather.temperatureLow < 32) {
    return 'Freezing temperatures may affect concrete curing and equipment operation';
  }

  return null;
}

/**
 * Get weather icon for map display (returns class name for styling)
 */
export function getWeatherIconClass(condition: WeatherCondition): string {
  const classes: Record<WeatherCondition, string> = {
    clear: 'weather-clear',
    partly_cloudy: 'weather-partly-cloudy',
    overcast: 'weather-overcast',
    rain: 'weather-rain',
    snow: 'weather-snow',
    fog: 'weather-fog',
    wind: 'weather-wind',
  };

  return classes[condition] || 'weather-clear';
}

/**
 * Determine if weather conditions are workable for construction
 * Returns workability status and warning messages
 */
export function isConstructionWorkable(weather: {
  condition?: WeatherCondition;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
}): { workable: boolean; warnings: string[] } {
  const warnings: string[] = [];

  // Critical conditions (unworkable)
  if ((weather.precipitation || 0) > 1.0) {
    warnings.push('Heavy precipitation (>1")');
  }
  if ((weather.temperatureHigh || 0) > 105) {
    warnings.push('Extreme heat (>105°F)');
  }
  if ((weather.temperatureLow || 0) < 15) {
    warnings.push('Extreme cold (<15°F)');
  }
  if ((weather.windSpeed || 0) > 35) {
    warnings.push('Dangerous winds (>35 mph)');
  }

  // Warning conditions (workable with caution)
  if ((weather.precipitation || 0) > 0.5 && (weather.precipitation || 0) <= 1.0) {
    warnings.push('Moderate precipitation (>0.5")');
  }
  if ((weather.temperatureHigh || 0) > 90 && (weather.temperatureHigh || 0) <= 105) {
    warnings.push('High temperatures (>90°F)');
  }
  if ((weather.temperatureLow || 0) >= 15 && (weather.temperatureLow || 0) < 32) {
    warnings.push('Freezing temperatures');
  }
  if ((weather.windSpeed || 0) > 25 && (weather.windSpeed || 0) <= 35) {
    warnings.push('High winds (>25 mph)');
  }

  // Workable if no critical warnings
  const hasCriticalWarnings = warnings.some(
    (w) =>
      w.includes('Heavy') ||
      w.includes('Extreme') ||
      w.includes('Dangerous')
  );

  return {
    workable: !hasCriticalWarnings,
    warnings,
  };
}
