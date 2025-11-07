/**
 * Team Statistics Component
 * Displays team composition statistics
 */

'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Users, Shield, Eye, Briefcase } from 'lucide-react'
import type { TeamMember } from '@/lib/actions/projects/team-management'

interface TeamStatsProps {
  members: TeamMember[]
}

export function TeamStats({ members }: TeamStatsProps) {
  // Calculate role distribution
  const managers = members.filter((m) => m.role === 'manager').length
  const supervisors = members.filter((m) => m.role === 'supervisor').length
  const viewers = members.filter((m) => m.role === 'viewer').length
  const total = members.length

  const stats = [
    {
      label: 'Total Members',
      value: total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Managers',
      value: managers,
      icon: Briefcase,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      label: 'Supervisors',
      value: supervisors,
      icon: Shield,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      label: 'Viewers',
      value: viewers,
      icon: Eye,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
