import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addCrewEntry } from '../add-crew-entry';

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

describe('addCrewEntry', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
  });

  it('should add crew entry to draft report', async () => {
    const mockReport = {
      status: 'draft',
      project_id: 'project-123',
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'entry-123' },
          error: null,
        }),
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
        };
      } else if (table === 'daily_report_crew_entries') {
        return {
          insert: mockInsert,
        };
      }
      return {};
    });

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: 'Carpenter',
      classification: 'Journeyman',
      headcount: 5,
      hoursWorked: 40,
    });

    expect(result.success).toBe(true);
    expect(result.data?.id).toBe('entry-123');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        daily_report_id: 'report-123',
        trade: 'Carpenter',
        classification: 'Journeyman',
        headcount: 5,
        hours_worked: 40,
      })
    );
  });

  it('should reject adding entry to non-draft report', async () => {
    const mockReport = {
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

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: 'Carpenter',
      headcount: 5,
      hoursWorked: 40,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot add entries to non-draft reports');
  });

  it('should validate trade is required', async () => {
    const mockReport = {
      status: 'draft',
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

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: '',
      headcount: 5,
      hoursWorked: 40,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Trade is required');
  });

  it('should validate headcount is greater than 0', async () => {
    const mockReport = {
      status: 'draft',
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

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: 'Carpenter',
      headcount: 0,
      hoursWorked: 40,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Headcount must be greater than 0');
  });

  it('should validate hours worked is not negative', async () => {
    const mockReport = {
      status: 'draft',
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

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: 'Carpenter',
      headcount: 5,
      hoursWorked: -10,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Hours worked cannot be negative');
  });

  it('should handle optional fields', async () => {
    const mockReport = {
      status: 'draft',
      project_id: 'project-123',
    };

    const mockInsert = vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: { id: 'entry-123' },
          error: null,
        }),
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
        };
      } else if (table === 'daily_report_crew_entries') {
        return {
          insert: mockInsert,
        };
      }
      return {};
    });

    const result = await addCrewEntry({
      dailyReportId: 'report-123',
      trade: 'Laborer',
      headcount: 3,
      hoursWorked: 24,
      notes: 'Concrete pour',
    });

    expect(result.success).toBe(true);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        notes: 'Concrete pour',
      })
    );
  });
});
