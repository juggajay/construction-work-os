'use client';

/**
 * Submittal Form Component
 * Create or edit submittal with CSI spec section and deadline tracking
 */

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createSubmittal } from '@/lib/actions/submittals';
import { Loader2 } from 'lucide-react';

interface SubmittalFormProps {
  projectId: string;
  orgSlug: string;
}

export function SubmittalForm({ projectId, orgSlug }: SubmittalFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submittalType, setSubmittalType] = useState<string>('');
  const [specSection, setSpecSection] = useState('');
  const [specSectionTitle, setSpecSectionTitle] = useState('');
  const [requiredOnSite, setRequiredOnSite] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createSubmittal({
        projectId,
        title,
        description: description || undefined,
        submittalType,
        specSection,
        specSectionTitle: specSectionTitle || undefined,
        requiredOnSite: requiredOnSite || undefined,
        leadTimeDays: leadTimeDays ? parseInt(leadTimeDays, 10) : undefined,
      });

      if (result.success && result.data) {
        // Redirect to the new submittal detail page
        router.push(`/${orgSlug}/projects/${projectId}/submittals/${result.data.id}`);
      } else {
        setError(result.error || 'Failed to create submittal');
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

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title" className="required">
          Submittal Title
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Cast-in-Place Concrete Mix Design"
          required
          maxLength={500}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Additional details about this submittal..."
          rows={4}
        />
      </div>

      {/* Submittal Type */}
      <div className="space-y-2">
        <Label htmlFor="submittalType" className="required">
          Submittal Type
        </Label>
        <Select value={submittalType} onValueChange={setSubmittalType} required>
          <SelectTrigger id="submittalType">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="product_data">Product Data</SelectItem>
            <SelectItem value="shop_drawings">Shop Drawings</SelectItem>
            <SelectItem value="samples">Samples</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* CSI Spec Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specSection" className="required">
            CSI Spec Section
          </Label>
          <Input
            id="specSection"
            value={specSection}
            onChange={(e) => setSpecSection(e.target.value)}
            placeholder="03 30 00"
            pattern="[0-9]{2}\s[0-9]{2}\s[0-9]{2}"
            title="Format: 03 30 00"
            required
          />
          <p className="text-xs text-muted-foreground">
            Format: XX XX XX (e.g., 03 30 00)
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="specSectionTitle">Spec Section Title</Label>
          <Input
            id="specSectionTitle"
            value={specSectionTitle}
            onChange={(e) => setSpecSectionTitle(e.target.value)}
            placeholder="e.g., Cast-in-Place Concrete"
          />
        </div>
      </div>

      {/* Schedule Information */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-semibold">Schedule Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="requiredOnSite">Required On Site Date</Label>
            <Input
              id="requiredOnSite"
              type="date"
              value={requiredOnSite}
              onChange={(e) => setRequiredOnSite(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              When material/equipment is needed on site
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="leadTimeDays">Lead Time (days)</Label>
            <Input
              id="leadTimeDays"
              type="number"
              min="0"
              value={leadTimeDays}
              onChange={(e) => setLeadTimeDays(e.target.value)}
              placeholder="e.g., 30"
            />
            <p className="text-xs text-muted-foreground">
              Procurement lead time before delivery
            </p>
          </div>
        </div>

        {requiredOnSite && leadTimeDays && (
          <div className="bg-muted p-3 rounded text-sm">
            <span className="font-medium">Calculated Procurement Deadline: </span>
            <span>
              {new Date(
                new Date(requiredOnSite).getTime() -
                  parseInt(leadTimeDays) * 24 * 60 * 60 * 1000
              ).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Submittal
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
