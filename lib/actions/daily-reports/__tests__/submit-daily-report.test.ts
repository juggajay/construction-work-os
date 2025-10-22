import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitDailyReport } from '../submit-daily-report';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('submitDailyReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('should submit valid draft report', async () => {
    const mockReport = {
      id: 'report-123',
      status: 'draft',
      project_id: 'project-123',
      weather_condition: 'clear',
      narrative: 'Foundation work completed',
      crew_count: [{ count: 5 }],
    };

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'daily_reports') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReport,
                error: null,
              }),
            }),
          }),
          update: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({
              data: { ...mockReport, status: 'submitted' },
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const result = await submitDailyReport({
      dailyReportId: 'report-123',
    });

    expect(result.success).toBe(true);
  });

  it('should reject submission without weather condition', async () => {
    const mockReport = {
      id: 'report-123',
      status: 'draft',
      project_id: 'project-123',
      weather_condition: null,
      narrative: 'Foundation work completed',
      crew_count: [{ count: 5 }],
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockReport,
            error: null,
          }),
        }),
      }),
    });

    const result = await submitDailyReport({
      dailyReportId: 'report-123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Weather condition is required');
  });

  it('should reject submission without entries or narrative', async () => {
    const mockReport = {
      id: 'report-123',
      status: 'draft',
      project_id: 'project-123',
      weather_condition: 'clear',
      narrative: '',
      crew_count: [{ count: 0 }],
      equipment_count: [{ count: 0 }],
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockReport,
            error: null,
          }),
        }),
      }),
    });

    const result = await submitDailyReport({
      dailyReportId: 'report-123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Report must have entries or narrative');
  });

  it('should reject submission of non-draft report', async () => {
    const mockReport = {
      id: 'report-123',
      status: 'submitted',
      project_id: 'project-123',
    };

    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: mockReport,
            error: null,
          }),
        }),
      }),
    });

    const result = await submitDailyReport({
      dailyReportId: 'report-123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Only draft reports can be submitted');
  });

  it('should handle database errors', async () => {
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    const result = await submitDailyReport({
      dailyReportId: 'report-123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBe('Daily report not found');
  });

  it('should set submitted_at and submitted_by fields', async () => {
    const mockReport = {
      id: 'report-123',
      status: 'draft',
      project_id: 'project-123',
      weather_condition: 'clear',
      narrative: 'Work completed',
      crew_count: [{ count: 5 }],
    };

    const mockUpdate = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: { ...mockReport, status: 'submitted' },
        error: null,
      }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'daily_reports') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockReport,
                error: null,
              }),
            }),
          }),
          update: mockUpdate,
        };
      }
      return {};
    });

    await submitDailyReport({ dailyReportId: 'report-123' });

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'submitted',
        submitted_at: expect.any(String),
        submitted_by: 'user-123',
      })
    );
  });
});
