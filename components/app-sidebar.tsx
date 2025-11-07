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
  HardHat,
  Search,
  ClipboardList,
  DollarSign,
  Calendar,
  Wrench,
  TrendingUp,
  Activity,
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
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/logout-button'
import { ThemeToggle } from '@/components/theme/theme-toggle'

interface AppSidebarProps {
  orgSlug?: string
}

interface NavItem {
  title: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  disabled?: boolean
  badge?: string | null
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
              badge: null,
            },
            {
              title: 'Projects',
              icon: Building2,
              href: `/${orgSlug}/projects`,
              badge: null,
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
              disabled: false,
              badge: null,
            },
            {
              title: 'Submittals',
              icon: ClipboardList,
              href: `/${orgSlug}/submittals`,
              disabled: false,
              badge: null,
            },
            {
              title: 'Change Orders',
              icon: DollarSign,
              href: `/${orgSlug}/change-orders`,
              disabled: false,
              badge: null,
            },
            {
              title: 'Daily Reports',
              icon: Calendar,
              href: `/${orgSlug}/daily-reports`,
              disabled: false,
              badge: null,
            },
            {
              title: 'Snag List',
              icon: Wrench,
              href: `/${orgSlug}/snag-list`,
              disabled: false,
              badge: null,
            },
          ],
        },
        {
          title: 'Insights',
          items: [
            {
              title: 'Project Health',
              icon: Activity,
              href: `/${orgSlug}/project-health`,
              disabled: false,
              badge: null,
            },
            {
              title: 'Analytics',
              icon: TrendingUp,
              href: `/${orgSlug}/analytics`,
              disabled: false,
              badge: null,
            },
            {
              title: 'Reports',
              icon: BarChart3,
              href: `/${orgSlug}/reports`,
              disabled: true,
              badge: null,
            },
          ],
        },
        {
          title: 'Settings',
          items: [
            {
              title: 'Team',
              icon: Users,
              href: `/${orgSlug}/team`,
              badge: null,
            },
            {
              title: 'Organization',
              icon: Building2,
              href: `/${orgSlug}/settings`,
              disabled: true,
              badge: null,
            },
            {
              title: 'Settings',
              icon: Settings,
              href: `/${orgSlug}/settings/general`,
              disabled: true,
              badge: null,
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
              badge: null,
            },
            {
              title: 'Organizations',
              icon: Building2,
              href: '/orgs',
              badge: null,
            },
          ],
        },
      ]

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <Link href="/dashboard" className="flex items-center gap-2 mb-4">
          <HardHat className="h-8 w-8 text-construction-orange" />
          <span className="font-bold text-lg">Construction OS</span>
        </Link>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search (⌘K)</span>
        </button>
      </SidebarHeader>
      <SidebarContent>
        {navigation.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </SidebarGroupLabel>
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
                        <Link href={item.disabled ? '#' : item.href} className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            <span>{item.title}</span>
                          </div>
                          {item.badge && (
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {item.badge}
                            </Badge>
                          )}
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
        <div className="flex items-center justify-between gap-2">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
