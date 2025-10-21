'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createProject } from '@/lib/actions/project'

type ProjectFormProps = {
  orgId: string
  orgSlug: string
}

export function ProjectForm({ orgId, orgSlug }: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

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
      startDate: formData.get('startDate') as string || undefined,
      endDate: formData.get('endDate') as string || undefined,
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
    <Card>
      <CardHeader>
        <CardTitle>Create new project</CardTitle>
        <CardDescription>
          Set up a new construction project in your organization
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Downtown Office Renovation"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="number">Project Number</Label>
              <Input
                id="number"
                name="number"
                type="text"
                placeholder="P-2025-001"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="budget">Budget ($)</Label>
              <Input
                id="budget"
                name="budget"
                type="number"
                placeholder="1000000"
                min="0"
                step="0.01"
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              name="address"
              type="text"
              placeholder="123 Main St, City, State 12345"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                disabled={isPending}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating...' : 'Create project'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
