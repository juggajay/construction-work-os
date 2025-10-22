/**
 * Weather Widget Component
 * Display weather information with icon and details
 */

import {
  getWeatherIcon,
  getWeatherColor,
  formatTemperature,
  formatPrecipitation,
  formatWindSpeed,
} from '@/lib/utils/weather-utils';

type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'wind';

interface WeatherWidgetProps {
  condition?: WeatherCondition;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
  humidity?: number;
  compact?: boolean;
  className?: string;
}

export function WeatherWidget({
  condition,
  temperatureHigh,
  temperatureLow,
  precipitation,
  windSpeed,
  humidity,
  compact = false,
  className = '',
}: WeatherWidgetProps) {
  if (!condition) {
    return (
      <div className={`text-sm text-muted-foreground ${className}`}>
        No weather data
      </div>
    );
  }

  const icon = getWeatherIcon(condition);
  const color = getWeatherColor(condition);

  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-2xl">{icon}</span>
        <div className="text-sm">
          <div className="font-medium capitalize" style={{ color }}>
            {condition.replace('_', ' ')}
          </div>
          {temperatureHigh !== undefined && temperatureLow !== undefined && (
            <div className="text-muted-foreground">
              {formatTemperature(temperatureHigh)} / {formatTemperature(temperatureLow)}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <span className="text-4xl">{icon}</span>
        <div>
          <div className="text-lg font-semibold capitalize" style={{ color }}>
            {condition.replace('_', ' ')}
          </div>
          {temperatureHigh !== undefined && temperatureLow !== undefined && (
            <div className="text-2xl font-bold">
              {formatTemperature(temperatureHigh)} / {formatTemperature(temperatureLow)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        {precipitation !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Precipitation:</span>
            <span className="font-medium">{formatPrecipitation(precipitation)}</span>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Wind:</span>
            <span className="font-medium">{formatWindSpeed(windSpeed)}</span>
          </div>
        )}
        {humidity !== undefined && (
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Humidity:</span>
            <span className="font-medium">{humidity}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
