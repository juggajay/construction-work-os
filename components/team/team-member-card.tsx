'use client'

/**
 * Team Member Card Component
 * Industrial Luxury aesthetic
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in team grids
 */

import { memo } from 'react'
import {
  Mail,
  Phone,
  Briefcase,
  Award,
  Building2,
  Calendar,
  Shield,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getInitials,
  isCertificationExpiringSoon,
  isCertificationExpired,
} from '@/lib/utils/team-helpers'

export interface Certification {
  name: string
  issuer: string
  issuedDate: string
  expiryDate?: string
}

export interface TeamMember {
  id: string
  fullName: string | null
  email: string
  phone?: string | null
  avatarUrl?: string | null
  jobTitle?: string | null
  company?: string | null
  role: string
  certifications?: Certification[]
  projectAssignments?: string[]
}

interface TeamMemberCardProps {
  member: TeamMember
  onCardClick?: (member: TeamMember) => void
  className?: string
}

// Role badge config - Industrial Luxury style
const ROLE_CONFIG: Record<string, { bgClass: string; textClass: string }> = {
  owner: { bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  admin: { bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  member: { bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
}

export const TeamMemberCard = memo(function TeamMemberCard({
  member,
  onCardClick,
  className,
}: TeamMemberCardProps) {
  const roleConfig = ROLE_CONFIG[member.role.toLowerCase()] ?? { bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' }

  return (
    <div
      className={cn(
        'group relative rounded-xl overflow-hidden h-full cursor-pointer',
        'bg-white/[0.02] border border-white/[0.06]',
        'hover:border-white/[0.12] hover:bg-white/[0.04]',
        'transition-all duration-300',
        className
      )}
      onClick={() => onCardClick?.(member)}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="p-5 space-y-4">
        {/* Header: Avatar + Name + Role */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold text-lg shrink-0">
            {getInitials(member.fullName, member.email)}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white truncate group-hover:text-amber-400 transition-colors">
              {member.fullName || member.email}
            </h3>

            {member.jobTitle && (
              <p className="text-sm text-white/50 truncate flex items-center gap-1.5 mt-0.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                {member.jobTitle}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-lg capitalize',
                  roleConfig.bgClass,
                  roleConfig.textClass
                )}
              >
                <Shield className="h-3 w-3" />
                {member.role}
              </span>

              {member.projectAssignments && member.projectAssignments.length > 0 && (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-lg bg-blue-500/10 text-blue-400">
                  {member.projectAssignments.length}{' '}
                  {member.projectAssignments.length === 1 ? 'Project' : 'Projects'}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-white/30 shrink-0" />
            <a
              href={`mailto:${member.email}`}
              className="truncate text-white/60 hover:text-amber-400 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {member.email}
            </a>
          </div>

          {member.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-white/30 shrink-0" />
              <a
                href={`tel:${member.phone}`}
                className="text-white/60 hover:text-amber-400 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {member.phone}
              </a>
            </div>
          )}

          {member.company && (
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-white/30 shrink-0" />
              <span className="truncate text-white/60">{member.company}</span>
            </div>
          )}
        </div>

        {/* Certifications */}
        {member.certifications && member.certifications.length > 0 ? (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-white/30" />
              <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                Certifications ({member.certifications.length})
              </span>
            </div>

            <div className="space-y-2">
              {member.certifications.slice(0, 3).map((cert, index) => {
                const expiringSoon = isCertificationExpiringSoon(cert.expiryDate)
                const expired = isCertificationExpired(cert.expiryDate)
                const certKey = `${cert.name}-${cert.issuer}-${index}`

                return (
                  <div
                    key={certKey}
                    className={cn(
                      'rounded-lg p-2.5 text-xs',
                      expired
                        ? 'bg-red-500/10 border border-red-500/20'
                        : expiringSoon
                          ? 'bg-amber-500/10 border border-amber-500/20'
                          : 'bg-white/[0.03] border border-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-medium text-white truncate">{cert.name}</span>
                      {(expired || expiringSoon) && (
                        <span
                          className={cn(
                            'text-[10px] px-1.5 py-0.5 rounded',
                            expired
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-amber-500/20 text-amber-400'
                          )}
                        >
                          {expired ? 'Expired' : 'Expiring'}
                        </span>
                      )}
                    </div>
                    <div className="text-white/40">{cert.issuer}</div>
                    {cert.expiryDate && (
                      <div className="text-white/30 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}

              {member.certifications.length > 3 && (
                <div className="text-xs text-center text-white/40 pt-1">
                  +{member.certifications.length - 3} more certifications
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-white/10 mx-auto mb-2" />
            <p className="text-xs text-white/30">No certifications on file</p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <div className="flex items-center gap-1 text-white/30 group-hover:text-amber-400 transition-colors">
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              View
            </span>
            <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>
    </div>
  )
})
