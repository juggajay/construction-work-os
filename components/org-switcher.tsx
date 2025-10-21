'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Building2, ChevronsUpDown, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type Organization = {
  id: string
  name: string
  slug: string
}

type OrgSwitcherProps = {
  organizations: Organization[]
  currentOrgSlug: string
}

export function OrgSwitcher({ organizations, currentOrgSlug }: OrgSwitcherProps) {
  const router = useRouter()
  const currentOrg = organizations.find((org) => org.slug === currentOrgSlug)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-[200px] justify-between">
          <span className="flex items-center truncate">
            <Building2 className="mr-2 h-4 w-4" />
            <span className="truncate">{currentOrg?.name || 'Select organization'}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => {
              router.push(`/${org.slug}`)
              router.refresh()
            }}
          >
            <Check
              className={`mr-2 h-4 w-4 ${
                org.slug === currentOrgSlug ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <span className="truncate">{org.name}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            router.push('/orgs/new')
          }}
        >
          Create new organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
