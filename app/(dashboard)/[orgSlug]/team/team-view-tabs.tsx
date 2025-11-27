'use client'

/**
 * Team View Tabs Component
 * Industrial Luxury aesthetic
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TeamMemberGrid } from '@/components/team/team-member-grid'
import { OrgTeamClient } from './org-team-client'
import type { OrgTeamMember } from '@/lib/actions/organization-members'

interface TeamViewTabsProps {
  orgId: string
  orgSlug: string
  teamMembers: OrgTeamMember[]
  enhancedMembers: any[]
  isOwnerOrAdmin: boolean
}

type ViewType = 'grid' | 'list'

const views = [
  { id: 'grid' as ViewType, label: 'Grid View', icon: LayoutGrid },
  { id: 'list' as ViewType, label: 'List View', icon: List },
]

export function TeamViewTabs({
  orgId,
  orgSlug,
  teamMembers,
  enhancedMembers,
  isOwnerOrAdmin,
}: TeamViewTabsProps) {
  const [activeView, setActiveView] = useState<ViewType>('grid')

  return (
    <>
      {/* Header with View Toggle */}
      <div className="p-5 border-b border-white/[0.06]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-white">Team Members</h2>
            <p className="text-sm text-white/40 mt-0.5">
              {teamMembers.length} members in your organization
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            {views.map((view) => {
              const Icon = view.icon
              const isActive = activeView === view.id
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-black"
                      : "text-white/50 hover:text-white/80"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTeamView"
                      className="absolute inset-0 bg-gradient-to-r from-amber-500 to-amber-600 rounded-lg"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon className={cn("h-4 w-4 relative z-10", isActive && "text-black")} />
                  <span className="relative z-10 hidden sm:inline">{view.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'grid' && (
              <TeamMemberGrid members={enhancedMembers} />
            )}

            {activeView === 'list' && (
              <OrgTeamClient
                orgId={orgId}
                orgSlug={orgSlug}
                initialTeamMembers={teamMembers}
                isOwnerOrAdmin={isOwnerOrAdmin}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  )
}
