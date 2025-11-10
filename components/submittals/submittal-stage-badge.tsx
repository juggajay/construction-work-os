/**
 * Submittal Review Stage Badge Component
 * Displays current review stage with appropriate styling
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in pipelines
 */

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';

type ReviewStage = 'draft' | 'gc_review' | 'ae_review' | 'owner_review' | 'complete';

interface SubmittalStageBadgeProps {
  stage: ReviewStage;
}

const stageConfig: Record<
  ReviewStage,
  { label: string; variant: 'default' | 'secondary' | 'outline' }
> = {
  draft: { label: 'Draft', variant: 'secondary' },
  gc_review: { label: 'With GC', variant: 'default' },
  ae_review: { label: 'With A/E', variant: 'default' },
  owner_review: { label: 'With Owner', variant: 'default' },
  complete: { label: 'Complete', variant: 'outline' },
};

export const SubmittalStageBadge = memo(function SubmittalStageBadge({ stage }: SubmittalStageBadgeProps) {
  const config = stageConfig[stage];

  return (
    <Badge variant={config.variant} className="font-medium">
      {config.label}
    </Badge>
  );
});
