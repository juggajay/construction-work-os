'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { sendMagicLink } from '@/lib/actions/auth'

export default function MagicLinkPage() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
    }

    startTransition(async () => {
      const result = await sendMagicLink(data)

      if (!result.success) {
        setError(result.error || 'Failed to send magic link')
        return
      }

      setSuccess(true)
    })
  }

  if (success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We&apos;ve sent you a magic link. Click the link in your email to sign in.
            The link will expire in 15 minutes.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/login">Back to login</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with magic link</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to sign in
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Sending...' : 'Send magic link'}
          </Button>
          <p className="text-center text-sm text-neutral-600">
            <Link href="/login" className="font-medium text-neutral-900 hover:underline">
              Back to login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
