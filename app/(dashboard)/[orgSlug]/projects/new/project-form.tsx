'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DatePickerInput } from '@/components/ui/date-picker-input'
import { createProject } from '@/lib/actions/project'
import { Building2, Hash, MapPin, DollarSign, Calendar, AlertCircle, Loader2 } from 'lucide-react'

type ProjectFormProps = {
  orgId: string
  orgSlug: string
}

export function ProjectForm({ orgId, orgSlug }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)

    const data = {
      name: formData.get('name') as string,
      status: 'planning' as const,
      number: formData.get('number') as string || undefined,
      address: formData.get('address') as string || undefined,
      budget: formData.get('budget') as string || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      orgId,
    }

    startTransition(async () => {
      const result = await createProject(data)

      if (!result.success) {
        setError(result.error || 'Failed to create project')
        return
      }

      if (result.data) {
        router.push(`/${orgSlug}/projects/${result.data.id}`)
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className={cn(
        "rounded-xl p-6",
        "bg-white/[0.02] border border-white/[0.06]"
      )}>
        {/* Form Header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/[0.06]">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Building2 className="h-4 w-4 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Project Details</h2>
            <p className="text-sm text-white/40">Fill in the information about your new project</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className={cn(
            "flex items-center gap-3 rounded-lg p-4 mb-6",
            "bg-red-500/10 border border-red-500/20"
          )}>
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="flex items-center gap-2 text-sm font-medium text-white/70">
              <Building2 className="h-4 w-4 text-white/40" />
              Project Name <span className="text-amber-400">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Downtown Office Renovation"
              required
              disabled={isPending}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                "bg-white/[0.03] border border-white/[0.08]",
                "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            />
          </div>

          {/* Project Number & Budget */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="number" className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Hash className="h-4 w-4 text-white/40" />
                Project Number
              </label>
              <input
                id="number"
                name="number"
                type="text"
                placeholder="P-2025-001"
                disabled={isPending}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="budget" className="flex items-center gap-2 text-sm font-medium text-white/70">
                <DollarSign className="h-4 w-4 text-white/40" />
                Budget ($)
              </label>
              <input
                id="budget"
                name="budget"
                type="number"
                placeholder="1,000,000"
                min="0"
                step="0.01"
                disabled={isPending}
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-white/70">
              <MapPin className="h-4 w-4 text-white/40" />
              Address
            </label>
            <input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St, City, State 12345"
              disabled={isPending}
              className={cn(
                "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                "bg-white/[0.03] border border-white/[0.08]",
                "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all"
              )}
            />
          </div>

          {/* Dates */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <label htmlFor="startDate" className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Calendar className="h-4 w-4 text-white/40" />
                Start Date
              </label>
              <DatePickerInput
                id="startDate"
                name="startDate"
                value={startDate}
                onChange={setStartDate}
                disabled={isPending}
                placeholder="Select start date"
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="endDate" className="flex items-center gap-2 text-sm font-medium text-white/70">
                <Calendar className="h-4 w-4 text-white/40" />
                End Date
              </label>
              <DatePickerInput
                id="endDate"
                name="endDate"
                value={endDate}
                onChange={setEndDate}
                disabled={isPending}
                placeholder="Select end date"
                className={cn(
                  "w-full px-4 py-3 rounded-lg text-white placeholder-white/30",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/30",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-all"
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={isPending}
          className={cn(
            "px-6 py-3 rounded-lg font-medium text-sm transition-all",
            "bg-white/[0.03] text-white/70 border border-white/[0.08]",
            "hover:bg-white/[0.06] hover:text-white hover:border-white/[0.12]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className={cn(
            "px-6 py-3 rounded-lg font-medium text-sm transition-all",
            "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
            "hover:from-amber-400 hover:to-amber-500",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center gap-2"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            'Create Project'
          )}
        </button>
      </div>
    </form>
  )
}
