import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDailyReport } from '../create-daily-report';

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// Mock weather API
vi.mock('@/lib/integrations/weather/open-meteo-client', () => ({
  fetchWeatherData: vi.fn(() =>
    Promise.resolve({
      condition: 'clear',
      temperatureHigh: 75,
      temperatureLow: 55,
      precipitation: 0,
      windSpeed: 10,
      humidity: 60,
    })
  ),
}));

// Mock weather cache
vi.mock('@/lib/integrations/weather/weather-cache', () => ({
  getFromCache: vi.fn(() => null),
  setInCache: vi.fn(),
  generateCacheKey: vi.fn(() => 'cache-key'),
}));

// Mock Next.js cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('createDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default auth mock - authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('should create daily report with weather data', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'report-123' },
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
      narrative: 'Foundation work completed',
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('report-123');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-123',
        report_date: '2024-01-15',
        weather_condition: 'clear',
        temperature_high: 75,
        temperature_low: 55,
        narrative: 'Foundation work completed',
      })
    );
  });

  it('should return error when user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Unauthorized');
  });

  it('should validate required fields', async () => {
    const result = await createDailyReport({
      // @ts-expect-error Testing missing required field
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('required');
  });

  it('should handle duplicate report for same date', async () => {
    mockSupabase.from.mockReturnValue({
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505', // PostgreSQL unique violation
              message: 'duplicate key value',
            },
          }),
        }),
      }),
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('already exists');
  });

  it('should use cached weather data when available', async () => {
    const { getFromCache, setInCache } = await import(
      '@/lib/integrations/weather/weather-cache'
    );

    const cachedWeather = {
      condition: 'rain' as const,
      temperatureHigh: 65,
      temperatureLow: 50,
      precipitation: 0.5,
      windSpeed: 15,
      humidity: 80,
    };

    (getFromCache as any).mockReturnValue(cachedWeather);

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'report-123' },
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        weather_condition: 'rain',
        temperature_high: 65,
        precipitation: 0.5,
      })
    );

    // Should not call setInCache since data was from cache
    expect(setInCache).not.toHaveBeenCalled();
  });

  it('should allow manual weather override', async () => {
    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'report-123' },
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
      weatherCondition: 'snow',
      temperatureHigh: 30,
      temperatureLow: 20,
      precipitation: 2.5,
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        weather_condition: 'snow',
        temperature_high: 30,
        temperature_low: 20,
        precipitation: 2.5,
      })
    );
  });

  it('should handle weather API failure gracefully', async () => {
    const { fetchWeatherData } = await import(
      '@/lib/integrations/weather/open-meteo-client'
    );

    (fetchWeatherData as any).mockRejectedValue(new Error('API unavailable'));

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'report-123' },
          error: null,
        }),
      }),
    });

    mockSupabase.from.mockReturnValue({
      insert: mockInsert,
    });

    const result = await createDailyReport({
      projectId: 'project-123',
      reportDate: '2024-01-15',
      latitude: 40.7128,
      longitude: -74.006,
      narrative: 'Work completed',
    });

    // Should still create report without weather data
    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: 'project-123',
        report_date: '2024-01-15',
        weather_condition: undefined,
      })
    );
  });
});
