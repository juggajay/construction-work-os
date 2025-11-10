'use client'

/**
 * ✅ PHASE 3 OPTIMIZATION: Memoized to prevent unnecessary re-renders in team grids
 */

import { memo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Mail,
  Phone,
  Briefcase,
  Award,
  Building2,
  Calendar,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getInitials,
  getRoleBadgeColor,
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

export const TeamMemberCard = memo(function TeamMemberCard({ member, onCardClick, className }: TeamMemberCardProps) {

  return (
    <Card
      className={cn(
        'group hover:shadow-lg transition-all duration-200 cursor-pointer border-neutral-200 bg-white',
        className
      )}
      onClick={() => onCardClick?.(member)}
    >
      <CardContent className="p-6">
        {/* Header: Avatar + Name + Role */}
        <div className="flex items-start gap-4 mb-4">
          <Avatar className="h-16 w-16 border-2 border-neutral-200">
            <AvatarImage src={member.avatarUrl || undefined} />
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-lg font-semibold">
              {getInitials(member.fullName, member.email)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-neutral-900 truncate group-hover:text-amber-600 transition-colors">
              {member.fullName || member.email}
            </h3>

            {member.jobTitle && (
              <p className="text-sm text-neutral-600 truncate flex items-center gap-1.5 mt-0.5">
                <Briefcase className="h-3.5 w-3.5 shrink-0" />
                {member.jobTitle}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-2">
              <Badge
                variant="outline"
                className={cn('text-xs font-medium', getRoleBadgeColor(member.role))}
              >
                <Shield className="h-3 w-3 mr-1" />
                {member.role}
              </Badge>

              {member.projectAssignments && member.projectAssignments.length > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/20">
                  {member.projectAssignments.length} {member.projectAssignments.length === 1 ? 'Project' : 'Projects'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="space-y-2 mb-4 pb-4 border-b border-neutral-100">
          <div className="flex items-center gap-2 text-sm text-neutral-600">
            <Mail className="h-4 w-4 text-neutral-400 shrink-0" />
            <a
              href={`mailto:${member.email}`}
              className="truncate hover:text-amber-600 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {member.email}
            </a>
          </div>

          {member.phone && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Phone className="h-4 w-4 text-neutral-400 shrink-0" />
              <a
                href={`tel:${member.phone}`}
                className="hover:text-amber-600 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                {member.phone}
              </a>
            </div>
          )}

          {member.company && (
            <div className="flex items-center gap-2 text-sm text-neutral-600">
              <Building2 className="h-4 w-4 text-neutral-400 shrink-0" />
              <span className="truncate">{member.company}</span>
            </div>
          )}
        </div>

        {/* Certifications */}
        {member.certifications && member.certifications.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-4 w-4 text-neutral-400" />
              <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
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
                        ? 'bg-red-50 border border-red-200'
                        : expiringSoon
                        ? 'bg-amber-50 border border-amber-200'
                        : 'bg-neutral-50 border border-neutral-200'
                    )}
                  >
                    <div className="font-medium text-neutral-900 mb-0.5 flex items-center justify-between">
                      <span className="truncate">{cert.name}</span>
                      {(expired || expiringSoon) && (
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] h-4 px-1.5',
                            expired
                              ? 'bg-red-100 text-red-700 border-red-300'
                              : 'bg-amber-100 text-amber-700 border-amber-300'
                          )}
                        >
                          {expired ? 'Expired' : 'Expiring Soon'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-neutral-500">{cert.issuer}</div>
                    {cert.expiryDate && (
                      <div className="text-neutral-400 mt-1 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )
              })}

              {member.certifications.length > 3 && (
                <div className="text-xs text-center text-neutral-500 pt-1">
                  +{member.certifications.length - 3} more certifications
                </div>
              )}
            </div>
          </div>
        )}

        {/* No certifications message */}
        {(!member.certifications || member.certifications.length === 0) && (
          <div className="text-center py-4">
            <Award className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
            <p className="text-xs text-neutral-400">No certifications on file</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
});
