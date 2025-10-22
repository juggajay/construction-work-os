/**
 * Daily Report Status Badge Component
 * Color-coded badge for report status
 */

import { Badge } from '@/components/ui/badge';

type DailyReportStatus = 'draft' | 'submitted' | 'approved' | 'archived';

interface DailyReportStatusBadgeProps {
  status: DailyReportStatus;
  className?: string;
}

const statusConfig: Record<
  DailyReportStatus,
  { label: string; variant: 'default' | 'secondary' | 'success' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  approved: { label: 'Approved', variant: 'success' },
  archived: { label: 'Archived', variant: 'outline' },
};

export function DailyReportStatusBadge({
  status,
  className,
}: DailyReportStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
