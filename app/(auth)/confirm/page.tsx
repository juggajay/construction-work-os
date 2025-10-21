import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function ConfirmPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  if (searchParams.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirmation failed</CardTitle>
          <CardDescription className="text-red-600">
            {searchParams.error === 'expired'
              ? 'This confirmation link has expired. Please request a new one.'
              : 'There was an error confirming your email. Please try again.'}
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button variant="outline" className="w-full" asChild>
            <Link href="/signup">Back to sign up</Link>
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email confirmed</CardTitle>
        <CardDescription>
          Your email has been confirmed successfully. You can now sign in to your account.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button className="w-full" asChild>
          <Link href="/login">Continue to sign in</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
