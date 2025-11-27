/**
 * Weather Widget Component
 * Industrial Luxury aesthetic
 */

import { Sun, CloudSun, Cloud, CloudRain, Snowflake, CloudFog, Wind, Droplets } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatTemperature,
  formatPrecipitation,
  formatWindSpeed,
} from '@/lib/utils/weather-utils'

type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'wind'

// Weather config with icons and colors
const WEATHER_CONFIG: Record<WeatherCondition, { icon: React.ElementType; color: string; bgClass: string }> = {
  clear: { icon: Sun, color: 'text-amber-400', bgClass: 'bg-amber-500/10' },
  partly_cloudy: { icon: CloudSun, color: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  overcast: { icon: Cloud, color: 'text-white/50', bgClass: 'bg-white/[0.05]' },
  rain: { icon: CloudRain, color: 'text-blue-400', bgClass: 'bg-blue-500/10' },
  snow: { icon: Snowflake, color: 'text-cyan-400', bgClass: 'bg-cyan-500/10' },
  fog: { icon: CloudFog, color: 'text-white/40', bgClass: 'bg-white/[0.05]' },
  wind: { icon: Wind, color: 'text-white/50', bgClass: 'bg-white/[0.05]' },
}

interface WeatherWidgetProps {
  condition?: WeatherCondition
  temperatureHigh?: number
  temperatureLow?: number
  precipitation?: number
  windSpeed?: number
  humidity?: number
  compact?: boolean
  className?: string
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
      <div className={cn('text-sm text-white/40', className)}>
        No weather data
      </div>
    )
  }

  const config = WEATHER_CONFIG[condition] || WEATHER_CONFIG.overcast
  const Icon = config.icon

  if (compact) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Icon className={cn('h-6 w-6', config.color)} />
        <div className="text-sm">
          <div className={cn('font-medium capitalize', config.color)}>
            {condition.replace('_', ' ')}
          </div>
          {temperatureHigh !== undefined && temperatureLow !== undefined && (
            <div className="text-white/40">
              {formatTemperature(temperatureHigh)} / {formatTemperature(temperatureLow)}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      'rounded-xl p-6 overflow-hidden',
      'bg-white/[0.02] border border-white/[0.06]',
      className
    )}>
      <div className="flex items-center gap-4 mb-4">
        <div className={cn('p-3 rounded-xl', config.bgClass)}>
          <Icon className={cn('h-6 w-6', config.color)} />
        </div>
        <div>
          <div className={cn('text-lg font-semibold capitalize', config.color)}>
            {condition.replace('_', ' ')}
          </div>
          {temperatureHigh !== undefined && temperatureLow !== undefined && (
            <div className="text-2xl font-bold text-white">
              {formatTemperature(temperatureHigh)} / {formatTemperature(temperatureLow)}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {precipitation !== undefined && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Droplets className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Precipitation</p>
              <p className="font-medium text-white">{formatPrecipitation(precipitation)}</p>
            </div>
          </div>
        )}
        {windSpeed !== undefined && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/[0.05]">
              <Wind className="h-4 w-4 text-white/60" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Wind</p>
              <p className="font-medium text-white">{formatWindSpeed(windSpeed)}</p>
            </div>
          </div>
        )}
        {humidity !== undefined && (
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10">
              <Droplets className="h-4 w-4 text-cyan-400" />
            </div>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Humidity</p>
              <p className="font-medium text-white">{humidity}%</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
