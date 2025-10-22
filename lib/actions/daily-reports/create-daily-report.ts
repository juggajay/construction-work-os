'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  fetchWeatherDataWithRetry,
  WeatherAPIError,
} from '@/lib/integrations/weather/open-meteo-client';
import {
  getFromCache,
  setInCache,
} from '@/lib/integrations/weather/weather-cache';
import { CreateDailyReportSchema } from './schemas';
import { z } from 'zod';

export type CreateDailyReportInput = z.infer<typeof CreateDailyReportSchema>;

interface CreateDailyReportResult {
  success: boolean;
  data?: {
    id: string;
    weatherFetched: boolean;
    weatherSource: 'api' | 'manual' | 'cache';
  };
  error?: string;
}

/**
 * Create a new daily report (draft status)
 * Automatically fetches weather data if location provided
 */
export async function createDailyReport(
  input: unknown
): Promise<CreateDailyReportResult> {
  try {
    // Validate input
    const validated = CreateDailyReportSchema.parse(input);

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' };
    }

    // Validate project access
    const { data: projects, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('id', validated.projectId)
      .single();

    if (projectError || !projects) {
      return { success: false, error: 'Project not found or access denied' };
    }

    // Check if report already exists for this date
    const { data: existingReport } = await supabase
      .from('daily_reports')
      .select('id, status')
      .eq('project_id', validated.projectId)
      .eq('report_date', validated.reportDate)
      .in('status', ['submitted', 'approved', 'archived'])
      .maybeSingle();

    if (existingReport) {
      return {
        success: false,
        error: `A ${existingReport.status} report already exists for this date`,
      };
    }

    // Fetch weather data if location provided
    let weatherData: any = {};
    let weatherFetched = false;
    let weatherSource: 'api' | 'manual' | 'cache' = 'manual';

    if (validated.latitude && validated.longitude) {
      try {
        const reportDate = new Date(validated.reportDate);

        // Check cache first
        const cachedWeather = getFromCache(
          validated.latitude,
          validated.longitude,
          reportDate
        );

        if (cachedWeather) {
          weatherData = {
            weather_condition: cachedWeather.condition,
            temperature_high: cachedWeather.temperatureHigh,
            temperature_low: cachedWeather.temperatureLow,
            precipitation: cachedWeather.precipitation,
            wind_speed: cachedWeather.windSpeed,
            humidity: cachedWeather.humidity,
          };
          weatherFetched = true;
          weatherSource = 'cache';
        } else {
          // Fetch from API with retry
          const weather = await fetchWeatherDataWithRetry(
            validated.latitude,
            validated.longitude,
            reportDate
          );

          weatherData = {
            weather_condition: weather.condition,
            temperature_high: weather.temperatureHigh,
            temperature_low: weather.temperatureLow,
            precipitation: weather.precipitation,
            wind_speed: weather.windSpeed,
            humidity: weather.humidity,
          };
          weatherFetched = true;
          weatherSource = 'api';

          // Cache the result
          setInCache(validated.latitude, validated.longitude, reportDate, weather);
        }
      } catch (error) {
        // Log weather fetch failure but continue with manual entry
        console.warn('Failed to fetch weather data:', error);
        weatherFetched = false;
      }
    }

    // Create daily report
    const { data: report, error: createError } = await supabase
      .from('daily_reports')
      .insert({
        project_id: validated.projectId,
        report_date: validated.reportDate,
        status: 'draft',
        created_by: user.id,
        narrative: validated.narrative,
        delays_challenges: validated.delaysChallenges,
        safety_notes: validated.safetyNotes,
        visitors_inspections: validated.visitorsInspections,
        ...weatherData,
      })
      .select('id')
      .single();

    if (createError) {
      return { success: false, error: createError.message };
    }

    // Revalidate project page
    revalidatePath(`/[orgSlug]/projects/${validated.projectId}`);

    return {
      success: true,
      data: {
        id: report.id,
        weatherFetched,
        weatherSource,
      },
    };
  } catch (error) {
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => e.message).join(', '),
      };
    }

    console.error('Error creating daily report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
