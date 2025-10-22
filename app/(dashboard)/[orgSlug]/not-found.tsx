import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Building2 } from 'lucide-react'

export default function OrgNotFound() {
  return (
    <div className="container flex min-h-[400px] flex-col items-center justify-center gap-4">
      <Building2 className="h-12 w-12 text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Organization not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The organization you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.
        </p>
      </div>
      <Button asChild>
        <Link href="/dashboard">Back to Dashboard</Link>
      </Button>
    </div>
  )
}
