import { getCurrentUser } from '@/lib/actions/auth'
import { getUserOrganizations } from '@/lib/actions/organization-helpers'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organizations
  const orgs = await getUserOrganizations()

  // If user has no orgs, force them to create one
  if (orgs.length === 0) {
    redirect('/orgs/new')
  }

  // If user has orgs, redirect to the first one (or last accessed)
  const defaultOrg = orgs[0]
  if (defaultOrg) {
    redirect(`/${defaultOrg.slug}`)
  }

  // Fallback
  redirect('/orgs/new')
}
