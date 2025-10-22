/**
 * RFI Response Form Component
 *
 * Form for adding responses to an RFI
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addResponseSchema, type AddResponseInput } from '@/lib/schemas'
import { addResponse } from '@/lib/actions/rfis/add-response'
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
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface ResponseFormProps {
  rfiId: string
  onSuccess?: () => void
  onCancel?: () => void
}

export function ResponseForm({ rfiId, onSuccess, onCancel }: ResponseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(addResponseSchema),
    defaultValues: {
      rfiId,
      content: '',
      isOfficialAnswer: false,
    },
  })

  const onSubmit = async (data: AddResponseInput) => {
    try {
      setIsSubmitting(true)

      const result = await addResponse(data)

      if (!result.success) {
        toast.error(result.error || 'Failed to add response')
        return
      }

      toast.success(
        data.isOfficialAnswer
          ? 'Official answer submitted successfully'
          : 'Response added successfully'
      )

      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to add response:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Response Content */}
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Response *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter your response to this RFI"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide clarification or answer the question raised in this RFI
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Official Answer Checkbox */}
        <FormField
          control={form.control}
          name="isOfficialAnswer"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Mark as Official Answer
                </FormLabel>
                <FormDescription>
                  Check this box if this response is the final answer to the RFI.
                  This will update the RFI status to &quot;Answered&quot;.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Actions */}
        <div className="flex justify-end gap-4">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Response
          </Button>
        </div>
      </form>
    </Form>
  )
}
