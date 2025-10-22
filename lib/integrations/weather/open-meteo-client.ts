/**
 * Open-Meteo Weather API Client
 * FREE weather API - No API key required!
 * Supports historical data and current conditions
 * https://open-meteo.com/
 */

import {
  checkWeatherRateLimit,
  WeatherRateLimitError,
} from './rate-limiter';

export interface WeatherData {
  condition: 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'snow' | 'fog' | 'wind';
  temperatureHigh: number; // °F
  temperatureLow: number; // °F
  precipitation: number; // inches
  windSpeed: number; // mph
  humidity: number; // %
  source: 'api' | 'manual';
  fetchedAt: Date;
}

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_max: number[]; // °C
    temperature_2m_min: number[]; // °C
    precipitation_sum: number[]; // mm
    windspeed_10m_max: number[]; // km/h
    relative_humidity_2m_max: number[]; // %
    weathercode: number[]; // WMO Weather code
  };
}

export class WeatherAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

/**
 * Fetch weather data from Open-Meteo API (FREE - no API key needed!)
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param date - Date for weather data (supports historical data)
 * @returns Weather data or throws WeatherAPIError
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherData> {
  try {
    // Check rate limit
    const rateLimit = checkWeatherRateLimit();
    if (!rateLimit.allowed) {
      throw new WeatherRateLimitError(rateLimit.retryAfter || 3600);
    }

    // Format date as YYYY-MM-DD
    const dateStr = date.toISOString().split('T')[0] as string;

    // Open-Meteo API endpoint (no API key required!)
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', latitude.toString());
    url.searchParams.set('longitude', longitude.toString());
    url.searchParams.set('start_date', dateStr);
    url.searchParams.set('end_date', dateStr);
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max,relative_humidity_2m_max,weathercode');
    url.searchParams.set('temperature_unit', 'fahrenheit');
    url.searchParams.set('windspeed_unit', 'mph');
    url.searchParams.set('precipitation_unit', 'inch');
    url.searchParams.set('timezone', 'auto');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new WeatherAPIError(
        `Weather API request failed: ${response.statusText}`,
        response.status
      );
    }

    const data: OpenMeteoResponse = await response.json();

    if (!data.daily || data.daily.time.length === 0) {
      throw new WeatherAPIError('No weather data available for the requested date');
    }

    return transformWeatherData(data);
  } catch (error) {
    if (error instanceof WeatherAPIError) {
      throw error;
    }

    if (error instanceof Error) {
      // Handle timeout
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        throw new WeatherAPIError('Weather API request timed out');
      }

      // Handle network errors
      throw new WeatherAPIError(`Weather API request failed: ${error.message}`);
    }

    throw new WeatherAPIError('Unknown error fetching weather data');
  }
}

/**
 * Fetch weather data with exponential backoff retry logic
 */
export async function fetchWeatherDataWithRetry(
  latitude: number,
  longitude: number,
  date: Date,
  maxRetries = 3
): Promise<WeatherData> {
  let lastError: WeatherAPIError | WeatherRateLimitError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchWeatherData(latitude, longitude, date);
    } catch (error) {
      // Don't retry rate limit errors
      if (error instanceof WeatherRateLimitError) {
        throw error;
      }

      if (error instanceof WeatherAPIError) {
        lastError = error;

        // Exponential backoff: 1s, 2s, 4s
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new WeatherAPIError('Failed to fetch weather data after retries');
}

/**
 * Transform Open-Meteo API response to internal format
 */
function transformWeatherData(data: OpenMeteoResponse): WeatherData {
  const daily = data.daily;

  // Get first (and only) day's data
  const weatherCode = daily.weathercode[0] as number;
  const condition = mapWeatherCode(weatherCode);

  return {
    condition,
    temperatureHigh: Math.round((daily.temperature_2m_max[0] as number) * 100) / 100,
    temperatureLow: Math.round((daily.temperature_2m_min[0] as number) * 100) / 100,
    precipitation: Math.round((daily.precipitation_sum[0] as number) * 100) / 100,
    windSpeed: Math.round((daily.windspeed_10m_max[0] as number) * 100) / 100,
    humidity: Math.round(daily.relative_humidity_2m_max[0] as number),
    source: 'api',
    fetchedAt: new Date(),
  };
}

/**
 * Map WMO Weather code to internal condition enum
 * Reference: https://open-meteo.com/en/docs
 * WMO Weather interpretation codes (WW)
 */
function mapWeatherCode(
  code: number
): 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'snow' | 'fog' | 'wind' {
  // Clear sky (0)
  if (code === 0) return 'clear';

  // Mainly clear, partly cloudy (1-2)
  if (code === 1 || code === 2) return 'partly_cloudy';

  // Overcast (3)
  if (code === 3) return 'overcast';

  // Fog (45, 48)
  if (code === 45 || code === 48) return 'fog';

  // Drizzle (51, 53, 55, 56, 57)
  if (code >= 51 && code <= 57) return 'rain';

  // Rain (61, 63, 65, 66, 67, 80, 81, 82)
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';

  // Snow (71, 73, 75, 77, 85, 86)
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';

  // Thunderstorm (95, 96, 99)
  if (code >= 95) return 'rain';

  // Default
  return 'clear';
}
