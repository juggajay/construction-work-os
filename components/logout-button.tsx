'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { logout } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className }: LogoutButtonProps) {
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
      className={cn(className)}
    >
      {isPending ? 'Logging out...' : 'Log out'}
    </Button>
  )
}
