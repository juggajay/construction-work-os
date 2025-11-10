/**
 * SubmittalCard Component
 * Compact card for pipeline/kanban view with priority indication
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in kanban pipeline
 */

'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

type SubmittalType = 'product_data' | 'shop_drawings' | 'samples' | 'mixed';

interface SubmittalCardProps {
  submittal: {
    id: string;
    number: string;
    title: string;
    project_id: string;
    org_slug: string;
    project_name: string;
    spec_section: string;
    spec_section_title?: string | null;
    submittal_type: SubmittalType;
    procurement_deadline?: string | null;
    current_reviewer?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  };
}

// Type labels for badges
const typeLabels: Record<SubmittalType, string> = {
  product_data: 'Product Data',
  shop_drawings: 'Shop Drawings',
  samples: 'Samples',
  mixed: 'Mixed',
};

// Calculate priority based on days remaining
function calculatePriority(deadline?: string | null): 'high' | 'medium' | 'low' {
  if (!deadline) return 'low';

  const daysRemaining = differenceInDays(new Date(deadline), new Date());

  if (daysRemaining < 3) return 'high';
  if (daysRemaining < 7) return 'medium';
  return 'low';
}

// Priority border colors (using construction palette)
const priorityBorderColors = {
  high: 'border-l-orange-600',
  medium: 'border-l-yellow-600',
  low: 'border-l-muted',
};

export const SubmittalCard = memo(function SubmittalCard({ submittal }: SubmittalCardProps) {
  const router = useRouter();
  const priority = calculatePriority(submittal.procurement_deadline);
  const isUrgent = priority === 'high';

  // Calculate days remaining
  const daysRemaining = submittal.procurement_deadline
    ? differenceInDays(new Date(submittal.procurement_deadline), new Date())
    : null;

  // Format due date
  const dueDate = submittal.procurement_deadline
    ? new Date(submittal.procurement_deadline).toLocaleDateString()
    : null;

  // Get assignee initials
  const assigneeInitials = submittal.current_reviewer?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase() || '?';

  const handleClick = () => {
    router.push(`/${submittal.org_slug}/projects/${submittal.project_id}/submittals/${submittal.id}`);
  };

  return (
    <Card
      className={cn(
        'cursor-pointer hover:shadow-md transition-all',
        'border-l-4',
        priorityBorderColors[priority]
      )}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header: Number, Project, Urgent Badge */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm font-mono">{submittal.number}</p>
              <p className="text-xs text-muted-foreground">{submittal.project_name}</p>
            </div>
            {isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>

          {/* Title */}
          <p className="text-sm line-clamp-2 font-medium">{submittal.title}</p>

          {/* Spec Section and Type */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs font-mono">
              {submittal.spec_section}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {typeLabels[submittal.submittal_type]}
            </Badge>
          </div>

          {/* Timeline: Due Date and Days Remaining */}
          {dueDate && daysRemaining !== null && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Due: {dueDate}</span>
              <span
                className={cn(
                  daysRemaining < 3 ? 'text-orange-600 font-semibold' : 'text-muted-foreground'
                )}
              >
                {daysRemaining >= 0 ? `${daysRemaining}d left` : `${Math.abs(daysRemaining)}d overdue`}
              </span>
            </div>
          )}

          {/* Assignee */}
          {submittal.current_reviewer && (
            <div className="flex items-center gap-2 pt-2 border-t">
              <Avatar className="h-6 w-6">
                {submittal.current_reviewer.avatar_url && (
                  <AvatarImage src={submittal.current_reviewer.avatar_url} />
                )}
                <AvatarFallback className="text-xs">{assigneeInitials}</AvatarFallback>
              </Avatar>
              <span className="text-xs">
                {submittal.current_reviewer.full_name || 'Unknown'}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
