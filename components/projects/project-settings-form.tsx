'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProject } from '@/lib/actions/project'
import { cn } from '@/lib/utils'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { useToast } from '@/hooks/use-toast'

interface ProjectSettingsFormProps {
  orgSlug: string
  project: any
}

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
]

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

  const inputStyles = cn(
    "w-full px-4 py-3 rounded-lg text-sm transition-all",
    "bg-white/[0.03] border border-white/[0.08]",
    "text-white placeholder:text-white/30",
    "focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50"
  )

  const labelStyles = "block text-sm font-medium text-white/70 mb-2"

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className={labelStyles}>
          Project Name <span className="text-red-400">*</span>
        </label>
        <input
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter project name"
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="number" className={labelStyles}>
          Project Number
        </label>
        <input
          id="number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
          placeholder="e.g., 2024-001"
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="address" className={labelStyles}>
          Address
        </label>
        <input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Project location"
          className={inputStyles}
        />
      </div>

      <div>
        <label htmlFor="status" className={labelStyles}>
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          className={cn(inputStyles, "appearance-none cursor-pointer")}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-[#1a1a1a] text-white">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="budget" className={labelStyles}>
          Budget
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">$</span>
          <input
            id="budget"
            type="number"
            step="0.01"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            placeholder="0.00"
            className={cn(inputStyles, "pl-8")}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="startDate" className={labelStyles}>
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            className={cn(inputStyles, "[color-scheme:dark]")}
          />
        </div>

        <div>
          <label htmlFor="endDate" className={labelStyles}>
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            className={cn(inputStyles, "[color-scheme:dark]")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-white/[0.03] border border-white/[0.08] text-white/60",
            "hover:bg-white/[0.06] hover:text-white",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-4 py-2 rounded-lg text-sm font-medium transition-all",
            "bg-amber-500/10 border border-amber-500/20 text-amber-400",
            "hover:bg-amber-500/20",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}
