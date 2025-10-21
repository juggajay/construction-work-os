'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'

export function LogoutButton() {
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <Button
      variant="outline"
      onClick={handleLogout}
      disabled={isPending}
    >
      {isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
