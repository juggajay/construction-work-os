'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { login } from '@/lib/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const formData = new FormData(event.currentTarget)
    const data = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    }

    startTransition(async () => {
      try {
        const result = await login(data)

        // If we get a result, check if it's an error
        if (result && !result.success) {
          setError(result.error || 'Failed to sign in')
        }
      } catch (error) {
        // Redirect errors are expected and handled by Next.js
        // Only show error if it's not a redirect
        if (error && typeof error === 'object' && 'digest' in error) {
          const digest = (error as { digest?: string }).digest
          if (!digest?.startsWith('NEXT_REDIRECT')) {
            setError('An unexpected error occurred')
          }
        } else {
          setError('An unexpected error occurred')
        }
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
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

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              disabled={isPending}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-500">Or</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/magic-link">Sign in with magic link</Link>
          </Button>
          <p className="text-center text-sm text-neutral-600">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-medium text-neutral-900 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
