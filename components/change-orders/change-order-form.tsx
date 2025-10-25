/**
 * Change Order Create/Edit Form Component
 *
 * Form for creating and editing change orders with validation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  createChangeOrderSchema,
  type CreateChangeOrderInput,
} from '@/lib/schemas'
import { createChangeOrder } from '@/lib/actions/change-orders'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ChangeOrderFormProps {
  projectId: string
  orgSlug: string
  onSuccess?: () => void
}

export function ChangeOrderForm({
  projectId,
  orgSlug,
  onSuccess,
}: ChangeOrderFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(createChangeOrderSchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      type: 'scope_change',
      costImpact: 0,
      scheduleImpactDays: 0,
    },
  })

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true)

      const result = await createChangeOrder(data as any)

      if (!result.success) {
        toast.error(result.error || 'Failed to create change order')
        return
      }

      toast.success('Change order created successfully')

      // Redirect to change order detail page
      if (result.data?.id) {
        router.push(
          `/${orgSlug}/projects/${projectId}/change-orders/${result.data.id}`
        )
      } else {
        router.push(`/${orgSlug}/projects/${projectId}/change-orders`)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Failed to create change order:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Title */}
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title *</FormLabel>
              <FormControl>
                <Input placeholder="Enter change order title" {...field} />
              </FormControl>
              <FormDescription>
                A concise description of the change order
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide detailed information about the change"
                  className="min-h-[120px]"
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Type */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type *</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select change order type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="scope_change">Scope Change</SelectItem>
                  <SelectItem value="design_change">Design Change</SelectItem>
                  <SelectItem value="site_condition">
                    Site Condition
                  </SelectItem>
                  <SelectItem value="owner_requested">
                    Owner Requested
                  </SelectItem>
                  <SelectItem value="time_extension">
                    Time Extension
                  </SelectItem>
                  <SelectItem value="cost_only">Cost Only</SelectItem>
                  <SelectItem value="schedule_only">Schedule Only</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Category of the change order
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cost Impact */}
        <FormField
          control={form.control}
          name="costImpact"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estimated Cost Impact</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Estimated cost impact in dollars (can be refined with line
                items later)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Schedule Impact */}
        <FormField
          control={form.control}
          name="scheduleImpactDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Schedule Impact (Days)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder="0"
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Number of days this change impacts the schedule
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Submit Button */}
        <div className="flex gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Change Order'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              router.push(`/${orgSlug}/projects/${projectId}/change-orders`)
            }
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
