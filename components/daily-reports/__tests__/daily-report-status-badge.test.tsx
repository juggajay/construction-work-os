import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DailyReportStatusBadge } from '../daily-report-status-badge';

describe('DailyReportStatusBadge', () => {
  it('should render draft status', () => {
    render(<DailyReportStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render submitted status', () => {
    render(<DailyReportStatusBadge status="submitted" />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('should render approved status', () => {
    render(<DailyReportStatusBadge status="approved" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('should render archived status', () => {
    render(<DailyReportStatusBadge status="archived" />);
    expect(screen.getByText('Archived')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DailyReportStatusBadge status="draft" className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });
});
