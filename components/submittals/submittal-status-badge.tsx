/**
 * Submittal Status Badge Component
 * Displays submittal status with appropriate styling
 */

import { Badge } from '@/components/ui/badge';

type SubmittalStatus =
  | 'draft'
  | 'submitted'
  | 'gc_review'
  | 'ae_review'
  | 'owner_review'
  | 'approved'
  | 'approved_as_noted'
  | 'revise_resubmit'
  | 'rejected'
  | 'cancelled';

interface SubmittalStatusBadgeProps {
  status: SubmittalStatus;
}

const statusConfig: Record<
  SubmittalStatus,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  submitted: { label: 'Submitted', variant: 'default' },
  gc_review: { label: 'GC Review', variant: 'default' },
  ae_review: { label: 'A/E Review', variant: 'default' },
  owner_review: { label: 'Owner Review', variant: 'default' },
  approved: { label: 'Approved', variant: 'default' },
  approved_as_noted: { label: 'Approved as Noted', variant: 'default' },
  revise_resubmit: { label: 'Revise & Resubmit', variant: 'outline' },
  rejected: { label: 'Rejected', variant: 'destructive' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

export function SubmittalStatusBadge({ status }: SubmittalStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
}
