'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Building2,
  FolderKanban,
  Home,
  Settings,
  FileText,
  Users,
  BarChart3,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { LogoutButton } from '@/components/logout-button'

interface AppSidebarProps {
  orgSlug?: string
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  disabled?: boolean
}

interface NavSection {
  title: string
  items: NavItem[]
}

export function AppSidebar({ orgSlug }: AppSidebarProps) {
  const pathname = usePathname()

  const navigation: NavSection[] = orgSlug
    ? [
        {
          title: 'Overview',
          items: [
            {
              title: 'Dashboard',
              icon: Home,
              href: `/${orgSlug}`,
            },
            {
              title: 'Projects',
              icon: FolderKanban,
              href: `/${orgSlug}/projects`,
            },
          ],
        },
        {
          title: 'Work',
          items: [
            {
              title: 'RFIs',
              icon: FileText,
              href: `/${orgSlug}/rfis`,
              disabled: true,
            },
            {
              title: 'Submittals',
              icon: FileText,
              href: `/${orgSlug}/submittals`,
              disabled: true,
            },
          ],
        },
        {
          title: 'Settings',
          items: [
            {
              title: 'Organization',
              icon: Building2,
              href: `/${orgSlug}/settings`,
              disabled: true,
            },
            {
              title: 'Team',
              icon: Users,
              href: `/${orgSlug}/team`,
            },
            {
              title: 'Reports',
              icon: BarChart3,
              href: `/${orgSlug}/reports`,
              disabled: true,
            },
          ],
        },
      ]
    : [
        {
          title: 'Overview',
          items: [
            {
              title: 'Dashboard',
              icon: Home,
              href: '/dashboard',
            },
            {
              title: 'Organizations',
              icon: Building2,
              href: '/orgs',
            },
          ],
        },
      ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <span className="font-semibold">Construction OS</span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        disabled={item.disabled}
                        tooltip={item.disabled ? 'Coming soon' : undefined}
                      >
                        <Link href={item.disabled ? '#' : item.href}>
                          <Icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <LogoutButton />
      </SidebarFooter>
    </Sidebar>
  )
}
