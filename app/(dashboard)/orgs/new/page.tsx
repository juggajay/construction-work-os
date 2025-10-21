'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createOrganization } from '@/lib/actions/organization'

export default function NewOrganizationPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [slug, setSlug] = useState('')

  function handleNameChange(name: string) {
    // Auto-generate slug from name
    const generatedSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    setSlug(generatedSlug)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
    }

    startTransition(async () => {
      const result = await createOrganization(data)

      if (!result.success) {
        setError(result.error || 'Failed to create organization')
        return
      }

      // Redirect to the new organization
      if (result.data) {
        router.push(`/${result.data.slug}`)
        router.refresh()
      }
    })
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Create your organization</CardTitle>
            <CardDescription>
              Set up your construction company or team workspace
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
                <Label htmlFor="name">Organization Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="ACME Construction"
                  required
                  minLength={3}
                  maxLength={50}
                  disabled={isPending}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-neutral-500">app.example.com/</span>
                  <Input
                    id="slug"
                    name="slug"
                    type="text"
                    placeholder="acme-construction"
                    required
                    minLength={3}
                    maxLength={30}
                    pattern="[a-z0-9\-]+"
                    disabled={isPending}
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <p className="text-xs text-neutral-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating...' : 'Create organization'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
