'use client';

/**
 * Review Action Panel Component
 * Multi-stage review workflow with 5 actions
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reviewSubmittal } from '@/lib/actions/submittals';
import { CheckCircle2, AlertCircle, XCircle, ArrowRight, Loader2 } from 'lucide-react';

interface ReviewActionPanelProps {
  submittalId: string;
  currentStage: string;
  orgSlug: string;
  projectId: string;
  availableReviewers?: Array<{ id: string; full_name: string }>;
}

type ReviewAction = 'approved' | 'approved_as_noted' | 'revise_resubmit' | 'rejected' | 'forwarded';

const actionConfig: Record<
  ReviewAction,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    description: string;
    buttonVariant: 'default' | 'destructive' | 'outline';
  }
> = {
  approved: {
    label: 'Approve',
    icon: CheckCircle2,
    description: 'Approve submittal with no revisions required',
    buttonVariant: 'default',
  },
  approved_as_noted: {
    label: 'Approve as Noted',
    icon: CheckCircle2,
    description: 'Approve with minor notes that do not require resubmission',
    buttonVariant: 'default',
  },
  revise_resubmit: {
    label: 'Revise & Resubmit',
    icon: AlertCircle,
    description: 'Require revisions and resubmission',
    buttonVariant: 'outline',
  },
  rejected: {
    label: 'Reject',
    icon: XCircle,
    description: 'Reject submittal - does not meet requirements',
    buttonVariant: 'destructive',
  },
  forwarded: {
    label: 'Forward',
    icon: ArrowRight,
    description: 'Forward to next reviewer in workflow',
    buttonVariant: 'outline',
  },
};

export function ReviewActionPanel({
  submittalId,
  currentStage,
  orgSlug,
  projectId,
  availableReviewers = [],
}: ReviewActionPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedAction, setSelectedAction] = useState<ReviewAction | null>(null);
  const [comments, setComments] = useState('');
  const [nextReviewerId, setNextReviewerId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedAction) {
      setError('Please select a review action');
      return;
    }

    if (!comments.trim()) {
      setError('Comments are required');
      return;
    }

    if (selectedAction === 'forwarded' && !nextReviewerId) {
      setError('Please select the next reviewer');
      return;
    }

    startTransition(async () => {
      const result = await reviewSubmittal({
        submittalId,
        action: selectedAction,
        comments,
        nextReviewerId: nextReviewerId || undefined,
      });

      if (result.success) {
        // Redirect back to submittal detail page
        router.push(`/${orgSlug}/projects/${projectId}/submittals/${submittalId}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to submit review');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Current Stage Info */}
      <div className="bg-muted p-4 rounded-lg">
        <div className="text-sm font-medium mb-1">Current Review Stage</div>
        <div className="text-lg font-semibold capitalize">
          {currentStage.replace('_', ' ')}
        </div>
      </div>

      {/* Action Selection */}
      <div className="space-y-3">
        <Label className="required">Select Review Action</Label>
        <div className="grid grid-cols-1 gap-3">
          {(Object.entries(actionConfig) as [ReviewAction, typeof actionConfig[ReviewAction]][]).map(
            ([action, config]) => {
              const Icon = config.icon;
              const isSelected = selectedAction === action;

              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => setSelectedAction(action)}
                  className={`
                    p-4 border rounded-lg text-left transition-all
                    ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-2 ring-primary'
                        : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1">
                      <div className="font-medium mb-1">{config.label}</div>
                      <div className="text-sm text-muted-foreground">{config.description}</div>
                    </div>
                  </div>
                </button>
              );
            }
          )}
        </div>
      </div>

      {/* Next Reviewer (only for Forward action) */}
      {selectedAction === 'forwarded' && availableReviewers.length > 0 && (
        <div className="space-y-2">
          <Label htmlFor="nextReviewer" className="required">
            Forward To
          </Label>
          <Select value={nextReviewerId} onValueChange={setNextReviewerId} required>
            <SelectTrigger id="nextReviewer">
              <SelectValue placeholder="Select reviewer" />
            </SelectTrigger>
            <SelectContent>
              {availableReviewers.map((reviewer) => (
                <SelectItem key={reviewer.id} value={reviewer.id}>
                  {reviewer.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Comments */}
      <div className="space-y-2">
        <Label htmlFor="comments" className="required">
          Review Comments
        </Label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          placeholder={
            selectedAction === 'approved'
              ? 'Confirm approval and add any notes...'
              : selectedAction === 'approved_as_noted'
              ? 'List the notes and minor corrections...'
              : selectedAction === 'revise_resubmit'
              ? 'Describe what needs to be revised...'
              : selectedAction === 'rejected'
              ? 'Explain why this submittal is rejected...'
              : 'Add comments about this submittal...'
          }
          rows={6}
          required
          minLength={1}
        />
        <p className="text-xs text-muted-foreground">
          Your comments will be visible in the review history and to all project team members.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t">
        <Button
          type="submit"
          disabled={isPending || !selectedAction}
          variant={selectedAction ? actionConfig[selectedAction].buttonVariant : 'default'}
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {selectedAction ? `Submit ${actionConfig[selectedAction].label}` : 'Submit Review'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
