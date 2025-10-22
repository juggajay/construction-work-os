'use client';

/**
 * Create Resubmittal Dialog Component
 * Create a new version after revision request
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createResubmittal } from '@/lib/actions/submittals';
import { RefreshCw, Loader2 } from 'lucide-react';

interface CreateResubmittalDialogProps {
  submittalId: string;
  currentVersion: string;
  orgSlug: string;
  projectId: string;
}

export function CreateResubmittalDialog({
  submittalId,
  currentVersion,
  orgSlug,
  projectId,
}: CreateResubmittalDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!notes.trim()) {
      setError('Please describe what changed in this revision');
      return;
    }

    startTransition(async () => {
      const result = await createResubmittal({
        parentSubmittalId: submittalId,
        notes,
      });

      if (result.success && result.data) {
        setOpen(false);
        router.push(`/${orgSlug}/projects/${projectId}/submittals/${result.data.id}`);
        router.refresh();
      } else {
        setError(result.error || 'Failed to create resubmittal');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Create Resubmittal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Resubmittal</DialogTitle>
          <DialogDescription>
            Create a new version of this submittal to address review comments.
            <br />
            Current version: <strong>{currentVersion}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes" className="required">
              What Changed?
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe the revisions made in this version..."
              rows={4}
              required
              minLength={1}
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Resubmittal
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
