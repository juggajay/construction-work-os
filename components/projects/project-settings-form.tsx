'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/lib/actions/project'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { useToast } from '@/hooks/use-toast'

interface ProjectSettingsFormProps {
  orgSlug: string
  project: any
}

export function ProjectSettingsForm({ orgSlug, project }: ProjectSettingsFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: project.name || '',
    number: project.number || '',
    address: project.address || '',
    status: project.status || 'planning',
    budget: project.budget || '',
    startDate: project.start_date || '',
    endDate: project.end_date || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await updateProject(
        {
          name: formData.name,
          number: formData.number || null,
          address: formData.address || null,
          status: formData.status as any,
          budget: formData.budget || null,
          startDate: formData.startDate || null,
          endDate: formData.endDate || null,
        },
        project.id
      )

      if (result.success) {
        toast({
          title: 'Success',
          description: 'Project settings updated successfully',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update project',
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
        <Label htmlFor="name">
          Project Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="number">Project Number</Label>
        <Input
          id="number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          placeholder="e.g., 2024-001"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Project location"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value) => setFormData({ ...formData, status: value })}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="planning">Planning</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="budget">Budget</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          value={formData.budget}
          onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
          placeholder="0.00"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="startDate">Start Date</Label>
          <DatePickerInput
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={(value) => setFormData({ ...formData, startDate: value })}
            placeholder="Select start date"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">End Date</Label>
          <DatePickerInput
            id="endDate"
            name="endDate"
            value={formData.endDate}
            onChange={(value) => setFormData({ ...formData, endDate: value })}
            placeholder="Select end date"
          />
        </div>
      </div>

      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  )
}
