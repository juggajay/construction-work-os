'use client';

/**
 * Daily Report Form Component
 * Form for creating and editing daily reports
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import { createDailyReport } from '@/lib/actions/daily-reports';
import { WeatherWidget } from './weather-widget';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface DailyReportFormProps {
  projectId: string;
  orgSlug: string;
  defaultDate: string;
  latitude?: number;
  longitude?: number;
  previousReport?: any;
}

type WeatherCondition =
  | 'clear'
  | 'partly_cloudy'
  | 'overcast'
  | 'rain'
  | 'snow'
  | 'fog'
  | 'wind';

export function DailyReportForm({
  projectId,
  orgSlug,
  defaultDate,
  latitude,
  longitude,
  previousReport,
}: DailyReportFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);

  const [formData, setFormData] = useState({
    reportDate: defaultDate,
    weatherCondition: '' as WeatherCondition | '',
    temperatureHigh: '',
    temperatureLow: '',
    precipitation: '',
    windSpeed: '',
    humidity: '',
    narrative: '',
    delaysChallenges: '',
    safetyNotes: '',
    visitorsInspections: '',
  });

  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!latitude || !longitude) {
      setError('Project location is required. Please add coordinates to the project.');
      return;
    }

    startTransition(async () => {
      setIsLoadingWeather(true);
      const result = await createDailyReport({
        projectId,
        reportDate: formData.reportDate,
        latitude,
        longitude,
        weatherCondition: formData.weatherCondition as WeatherCondition | undefined,
        temperatureHigh: formData.temperatureHigh
          ? parseFloat(formData.temperatureHigh)
          : undefined,
        temperatureLow: formData.temperatureLow
          ? parseFloat(formData.temperatureLow)
          : undefined,
        precipitation: formData.precipitation
          ? parseFloat(formData.precipitation)
          : undefined,
        windSpeed: formData.windSpeed ? parseFloat(formData.windSpeed) : undefined,
        humidity: formData.humidity ? parseInt(formData.humidity) : undefined,
        narrative: formData.narrative,
        delaysChallenges: formData.delaysChallenges,
        safetyNotes: formData.safetyNotes,
        visitorsInspections: formData.visitorsInspections,
      });

      setIsLoadingWeather(false);

      if (result.success && result.data) {
        router.push(`/${orgSlug}/projects/${projectId}/daily-reports/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create daily report');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Back Button */}
      <Link href={`/${orgSlug}/projects/${projectId}/daily-reports`}>
        <Button type="button" variant="ghost" size="sm">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Daily Reports
        </Button>
      </Link>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Information */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Basic Information</h2>

        <div>
          <Label htmlFor="reportDate">Report Date</Label>
          <DatePickerInput
            id="reportDate"
            name="reportDate"
            value={formData.reportDate}
            onChange={(value) =>
              setFormData({ ...formData, reportDate: value })
            }
            placeholder="Select date"
          />
        </div>
      </div>

      {/* Weather Information */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Weather Conditions</h2>
        <p className="text-sm text-muted-foreground">
          {isLoadingWeather ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Fetching weather data...
            </span>
          ) : (
            'Weather data will be automatically fetched when you create the report. You can override it here if needed.'
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="weatherCondition">Condition</Label>
            <Select
              value={formData.weatherCondition}
              onValueChange={(value: WeatherCondition) =>
                setFormData({ ...formData, weatherCondition: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select condition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clear">Clear</SelectItem>
                <SelectItem value="partly_cloudy">Partly Cloudy</SelectItem>
                <SelectItem value="overcast">Overcast</SelectItem>
                <SelectItem value="rain">Rain</SelectItem>
                <SelectItem value="snow">Snow</SelectItem>
                <SelectItem value="fog">Fog</SelectItem>
                <SelectItem value="wind">Windy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="temperatureHigh">High Temperature (°F)</Label>
            <Input
              id="temperatureHigh"
              type="number"
              step="0.1"
              value={formData.temperatureHigh}
              onChange={(e) =>
                setFormData({ ...formData, temperatureHigh: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="temperatureLow">Low Temperature (°F)</Label>
            <Input
              id="temperatureLow"
              type="number"
              step="0.1"
              value={formData.temperatureLow}
              onChange={(e) =>
                setFormData({ ...formData, temperatureLow: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="precipitation">Precipitation (inches)</Label>
            <Input
              id="precipitation"
              type="number"
              step="0.01"
              value={formData.precipitation}
              onChange={(e) =>
                setFormData({ ...formData, precipitation: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="windSpeed">Wind Speed (mph)</Label>
            <Input
              id="windSpeed"
              type="number"
              step="0.1"
              value={formData.windSpeed}
              onChange={(e) =>
                setFormData({ ...formData, windSpeed: e.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="humidity">Humidity (%)</Label>
            <Input
              id="humidity"
              type="number"
              min="0"
              max="100"
              value={formData.humidity}
              onChange={(e) =>
                setFormData({ ...formData, humidity: e.target.value })
              }
            />
          </div>
        </div>

        {/* Weather Preview */}
        {formData.weatherCondition && (
          <div className="mt-4">
            <Label>Preview</Label>
            <WeatherWidget
              condition={formData.weatherCondition as WeatherCondition}
              temperatureHigh={
                formData.temperatureHigh
                  ? parseFloat(formData.temperatureHigh)
                  : undefined
              }
              temperatureLow={
                formData.temperatureLow
                  ? parseFloat(formData.temperatureLow)
                  : undefined
              }
              precipitation={
                formData.precipitation
                  ? parseFloat(formData.precipitation)
                  : undefined
              }
              windSpeed={
                formData.windSpeed ? parseFloat(formData.windSpeed) : undefined
              }
              humidity={
                formData.humidity ? parseInt(formData.humidity) : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Daily Summary */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-lg font-semibold">Daily Summary</h2>

        <div>
          <Label htmlFor="narrative">Work Performed Today</Label>
          <Textarea
            id="narrative"
            rows={5}
            value={formData.narrative}
            onChange={(e) =>
              setFormData({ ...formData, narrative: e.target.value })
            }
            placeholder="Describe the work performed today..."
          />
        </div>

        <div>
          <Label htmlFor="delaysChallenges">Delays & Challenges</Label>
          <Textarea
            id="delaysChallenges"
            rows={3}
            value={formData.delaysChallenges}
            onChange={(e) =>
              setFormData({ ...formData, delaysChallenges: e.target.value })
            }
            placeholder="Any delays or challenges encountered..."
          />
        </div>

        <div>
          <Label htmlFor="safetyNotes">Safety Notes</Label>
          <Textarea
            id="safetyNotes"
            rows={3}
            value={formData.safetyNotes}
            onChange={(e) =>
              setFormData({ ...formData, safetyNotes: e.target.value })
            }
            placeholder="Safety observations, incidents, or concerns..."
          />
        </div>

        <div>
          <Label htmlFor="visitorsInspections">Visitors & Inspections</Label>
          <Textarea
            id="visitorsInspections"
            rows={3}
            value={formData.visitorsInspections}
            onChange={(e) =>
              setFormData({
                ...formData,
                visitorsInspections: e.target.value,
              })
            }
            placeholder="Any visitors or inspections today..."
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 border-t pt-6">
        <Link href={`/${orgSlug}/projects/${projectId}/daily-reports`}>
          <Button type="button" variant="outline" disabled={isPending}>
            Cancel
          </Button>
        </Link>
        <Button type="submit" disabled={isPending || isLoadingWeather}>
          {(isPending || isLoadingWeather) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoadingWeather ? 'Fetching Weather...' : isPending ? 'Creating...' : 'Create Report'}
        </Button>
      </div>
    </form>
  );
}
