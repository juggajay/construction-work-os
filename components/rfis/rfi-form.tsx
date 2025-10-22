/**
 * RFI Create/Edit Form Component
 *
 * Form for creating and editing RFIs with validation
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { createRFISchema, type CreateRFIInput } from '@/lib/schemas'
import { createRFI } from '@/lib/actions/rfis/create-rfi'
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

interface RFIFormProps {
  projectId: string
  orgSlug: string
  onSuccess?: () => void
}

export function RFIForm({ projectId, orgSlug, onSuccess }: RFIFormProps) {
  console.log('🔍 DEBUG: RFIForm rendered')
  console.log('🔍 DEBUG: projectId =', projectId)
  console.log('🔍 DEBUG: orgSlug =', orgSlug)

  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<any>({
    resolver: zodResolver(createRFISchema),
    defaultValues: {
      projectId,
      title: '',
      description: '',
      discipline: '',
      specSection: '',
      drawingReference: '',
      priority: 'medium',
    },
  })

  const onSubmit = async (data: CreateRFIInput) => {
    try {
      setIsSubmitting(true)

      const result = await createRFI(data)

      if (!result.success) {
        toast.error(result.error || 'Failed to create RFI')
        return
      }

      toast.success('RFI created successfully')

      // Redirect to RFI detail page
      if (result.data?.id) {
        router.push(`/${orgSlug}/projects/${projectId}/rfis/${result.data.id}`)
      } else {
        router.push(`/${orgSlug}/projects/${projectId}/rfis`)
      }

      onSuccess?.()
    } catch (error) {
      console.error('Failed to create RFI:', error)
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
                <Input placeholder="Enter RFI title" {...field} />
              </FormControl>
              <FormDescription>
                A concise description of the information request
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
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Provide detailed information about what needs clarification"
                  className="min-h-[120px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Explain what information you need and why
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          {/* Priority */}
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Discipline */}
          <FormField
            control={form.control}
            name="discipline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Discipline</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Structural, MEP" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Spec Section */}
          <FormField
            control={form.control}
            name="specSection"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Spec Section</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., 03 30 00" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>CSI MasterFormat section</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Drawing Reference */}
          <FormField
            control={form.control}
            name="drawingReference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Drawing Reference</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., A-101, S-201" {...field} value={field.value || ''} />
                </FormControl>
                <FormDescription>Sheet numbers</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create RFI
          </Button>
        </div>
      </form>
    </Form>
  )
}
