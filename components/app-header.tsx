import { getCurrentUser } from '@/lib/actions/auth'
import { getUserOrganizations } from '@/lib/actions/organization-helpers'
import { OrgSwitcher } from '@/components/org-switcher'
import { LogoutButton } from '@/components/logout-button'

type AppHeaderProps = {
  currentOrgSlug?: string
}

export async function AppHeader({ currentOrgSlug }: AppHeaderProps) {
  const userResult = await getCurrentUser()
  const orgs = await getUserOrganizations()

  const user = userResult.success ? userResult.data : null

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-200 bg-white">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Construction Work OS</h1>
          {currentOrgSlug && orgs.length > 0 && (
            <OrgSwitcher organizations={orgs} currentOrgSlug={currentOrgSlug} />
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-neutral-600">{user?.email}</span>
          <LogoutButton />
        </div>
      </div>
    </header>
  )
}
