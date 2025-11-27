'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid3x3, List, Columns, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ProjectCard, ProjectCardData } from './project-card'
import { ProjectTable } from './project-table'
import { ProjectKanban } from './project-kanban'
import { ProjectTimeline } from './project-timeline'

interface ProjectsViewSwitcherProps {
  projectsData: ProjectCardData[]
  orgSlug: string
  totalValue: number
}

type ViewType = 'grid' | 'list' | 'kanban' | 'timeline'

const views = [
  { id: 'grid' as ViewType, label: 'Grid', icon: Grid3x3 },
  { id: 'list' as ViewType, label: 'List', icon: List },
  { id: 'kanban' as ViewType, label: 'Kanban', icon: Columns },
  { id: 'timeline' as ViewType, label: 'Timeline', icon: Calendar },
]

export function ProjectsViewSwitcher({ projectsData, orgSlug, totalValue }: ProjectsViewSwitcherProps) {
  const [activeView, setActiveView] = useState<ViewType>('grid')

  return (
    <div className="space-y-4">
      {/* View Toggle & Stats */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
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
                    layoutId="activeView"
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

        {/* Stats Badges */}
        <div className="flex items-center gap-2">
          <span className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-white/[0.03] border border-white/[0.06]",
            "text-white/60"
          )}>
            {projectsData.length} projects
          </span>
          <span className={cn(
            "px-3 py-1.5 rounded-lg text-sm font-medium",
            "bg-amber-500/10 border border-amber-500/20",
            "text-amber-400"
          )}>
            ${totalValue.toFixed(1)}M total
          </span>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeView === 'grid' && (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projectsData.map((project) => (
                <ProjectCard key={project.id} project={project} orgSlug={orgSlug} />
              ))}
            </div>
          )}

          {activeView === 'list' && (
            <ProjectTable projects={projectsData} orgSlug={orgSlug} />
          )}

          {activeView === 'kanban' && (
            <ProjectKanban projects={projectsData} orgSlug={orgSlug} />
          )}

          {activeView === 'timeline' && (
            <ProjectTimeline projects={projectsData} orgSlug={orgSlug} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
