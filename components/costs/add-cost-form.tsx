'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createCost } from '@/lib/actions/costs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface AddCostFormProps {
  projectId: string
  orgSlug: string
}

const CATEGORIES = [
  { value: 'labor', label: 'Labor' },
  { value: 'materials', label: 'Materials' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'other', label: 'Other' },
] as const

export function AddCostForm({ projectId, orgSlug }: AddCostFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    costDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category) {
      toast({
        title: 'Error',
        description: 'Please select a category',
        variant: 'destructive',
      })
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: 'Error',
        description: 'Please enter a valid amount greater than 0',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await createCost({
        projectId,
        category: formData.category as any,
        amount: parseFloat(formData.amount),
        description: formData.description,
        costDate: formData.costDate as string,
      })

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Cost added successfully',
        })
        router.push(`/${orgSlug}/projects/${projectId}/costs`)
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add cost',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="category">
          Category <span className="text-red-500">*</span>
        </Label>
        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">
          Amount <span className="text-red-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">$</span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="pl-7"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="costDate">
          Date <span className="text-red-500">*</span>
        </Label>
        <DatePickerInput
          id="costDate"
          name="costDate"
          value={formData.costDate}
          onChange={(value) => setFormData({ ...formData, costDate: value })}
          placeholder="Select date"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="description"
          required
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe what this cost was for..."
          rows={4}
          maxLength={1000}
        />
        <p className="text-xs text-neutral-500">{formData.description.length}/1000 characters</p>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${orgSlug}/projects/${projectId}/costs`)}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? 'Adding Cost...' : 'Add Cost'}
        </Button>
      </div>
    </form>
  )
}
