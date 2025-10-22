/**
 * OpenWeatherMap API Client
 * Fetches weather data for daily reports with historical lookback support
 */

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

interface OpenWeatherResponse {
  current?: {
    temp: number; // Kelvin
    humidity: number;
    wind_speed: number; // m/s
    weather: Array<{ id: number; main: string; description: string }>;
  };
  daily?: Array<{
    temp: { min: number; max: number }; // Kelvin
    humidity: number;
    wind_speed: number; // m/s
    rain?: number; // mm
    snow?: number; // mm
    weather: Array<{ id: number; main: string; description: string }>;
  }>;
}

export class WeatherAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRateLimit = false
  ) {
    super(message);
    this.name = 'WeatherAPIError';
  }
}

/**
 * Fetch weather data from OpenWeatherMap API
 * @param latitude - Location latitude
 * @param longitude - Location longitude
 * @param date - Date for weather data (supports up to 5 days historical)
 * @returns Weather data or throws WeatherAPIError
 */
export async function fetchWeatherData(
  latitude: number,
  longitude: number,
  date: Date
): Promise<WeatherData> {
  const apiKey = process.env.OPENWEATHER_API_KEY;

  if (!apiKey) {
    throw new WeatherAPIError('OPENWEATHER_API_KEY not configured');
  }

  // Check if date is historical (more than 1 day ago)
  const now = new Date();
  const daysDiff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
  const isHistorical = daysDiff > 1;

  // OpenWeatherMap free tier supports up to 5 days of historical data
  if (isHistorical && daysDiff > 5) {
    throw new WeatherAPIError(
      `Historical weather data only available for past 5 days. Requested date is ${daysDiff} days ago.`
    );
  }

  try {
    let url: string;

    if (isHistorical) {
      // Use Time Machine API for historical data
      const timestamp = Math.floor(date.getTime() / 1000);
      url = `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${latitude}&lon=${longitude}&dt=${timestamp}&appid=${apiKey}`;
    } else {
      // Use current weather + forecast API
      url = `https://api.openweathermap.org/data/3.0/onecall?lat=${latitude}&lon=${longitude}&exclude=minutely,hourly,alerts&appid=${apiKey}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Timeout after 10 seconds
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new WeatherAPIError(
          'Weather API rate limit exceeded',
          429,
          true
        );
      }

      throw new WeatherAPIError(
        `Weather API request failed: ${response.statusText}`,
        response.status
      );
    }

    const data: OpenWeatherResponse = await response.json();

    return transformWeatherData(data, isHistorical);
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
  let lastError: WeatherAPIError | undefined;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchWeatherData(latitude, longitude, date);
    } catch (error) {
      if (error instanceof WeatherAPIError) {
        lastError = error;

        // Don't retry on rate limits or invalid dates
        if (error.isRateLimit || error.message.includes('5 days')) {
          throw error;
        }

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
 * Transform OpenWeatherMap API response to internal format
 */
function transformWeatherData(
  data: OpenWeatherResponse,
  isHistorical: boolean
): WeatherData {
  const weatherData = isHistorical ? data.current : data.daily?.[0];

  if (!weatherData) {
    throw new WeatherAPIError('Invalid weather data received from API');
  }

  // Extract weather condition
  const weatherCode = weatherData.weather[0]?.id || 800;
  const condition = mapWeatherCode(weatherCode);

  // Convert temperatures (Kelvin to Fahrenheit)
  const kelvinToFahrenheit = (k: number) => ((k - 273.15) * 9) / 5 + 32;

  let tempHigh: number;
  let tempLow: number;

  if ('temp' in weatherData && typeof weatherData.temp === 'number') {
    // Historical data has current temp only
    tempHigh = kelvinToFahrenheit(weatherData.temp);
    tempLow = tempHigh; // Use same for high/low
  } else {
    // Forecast data has min/max
    tempHigh = kelvinToFahrenheit((weatherData.temp as { min: number; max: number }).max);
    tempLow = kelvinToFahrenheit((weatherData.temp as { min: number; max: number }).min);
  }

  // Convert wind speed (m/s to mph)
  const windSpeed = weatherData.wind_speed * 2.237;

  // Convert precipitation (mm to inches)
  const precipitationMm = ('rain' in weatherData ? (weatherData.rain || 0) : 0) +
                          ('snow' in weatherData ? (weatherData.snow || 0) : 0);
  const precipitation = precipitationMm / 25.4;

  return {
    condition,
    temperatureHigh: Math.round(tempHigh * 100) / 100,
    temperatureLow: Math.round(tempLow * 100) / 100,
    precipitation: Math.round(precipitation * 100) / 100,
    windSpeed: Math.round(windSpeed * 100) / 100,
    humidity: weatherData.humidity,
    source: 'api',
    fetchedAt: new Date(),
  };
}

/**
 * Map OpenWeatherMap weather code to internal condition enum
 * Reference: https://openweathermap.org/weather-conditions
 */
function mapWeatherCode(
  code: number
): 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'snow' | 'fog' | 'wind' {
  // Thunderstorm (200-232)
  if (code >= 200 && code < 300) return 'rain';

  // Drizzle (300-321)
  if (code >= 300 && code < 400) return 'rain';

  // Rain (500-531)
  if (code >= 500 && code < 600) return 'rain';

  // Snow (600-622)
  if (code >= 600 && code < 700) return 'snow';

  // Atmosphere (fog, mist, haze) (700-781)
  if (code >= 700 && code < 800) return 'fog';

  // Clear (800)
  if (code === 800) return 'clear';

  // Clouds (801-804)
  if (code === 801) return 'partly_cloudy'; // Few clouds
  if (code === 802 || code === 803) return 'partly_cloudy'; // Scattered/broken clouds
  if (code === 804) return 'overcast'; // Overcast clouds

  // Default
  return 'clear';
}
