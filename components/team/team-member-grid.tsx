'use client'

/**
 * Team Member Grid Component
 * Industrial Luxury aesthetic
 */

import { useState } from 'react'
import { TeamMemberCard, type TeamMember } from './team-member-card'
import {
  Mail,
  Phone,
  Building2,
  Award,
  Calendar,
  FolderKanban,
  Shield,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getInitials,
  isCertificationExpiringSoon,
  isCertificationExpired,
} from '@/lib/utils/team-helpers'

interface TeamMemberGridProps {
  members: TeamMember[]
  className?: string
}

// Role badge config - Industrial Luxury style
const ROLE_CONFIG: Record<string, { bgClass: string; textClass: string }> = {
  owner: { bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  admin: { bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  member: { bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
}

export function TeamMemberGrid({ members, className }: TeamMemberGridProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'certifications' | 'projects'>('overview')

  const handleCardClick = (member: TeamMember) => {
    setSelectedMember(member)
    setActiveTab('overview')
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setSelectedMember(null)
  }

  return (
    <>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} onCardClick={handleCardClick} />
        ))}
      </div>

      {/* Member Detail Dialog */}
      {isDialogOpen && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeDialog}
          />

          {/* Dialog */}
          <div
            className={cn(
              'relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto rounded-2xl',
              'bg-[#0a0a0a] border border-white/[0.08]',
              'shadow-2xl'
            )}
          >
            {/* Close Button */}
            <button
              onClick={closeDialog}
              className={cn(
                'absolute top-4 right-4 z-10 flex items-center justify-center w-8 h-8 rounded-lg',
                'bg-white/[0.03] border border-white/[0.06]',
                'text-white/60 hover:text-white hover:border-white/[0.12]',
                'transition-all duration-200'
              )}
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="p-6 pb-0">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold text-xl">
                  {getInitials(selectedMember.fullName, selectedMember.email)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold text-white">
                    {selectedMember.fullName || selectedMember.email}
                  </h2>
                  {selectedMember.jobTitle && (
                    <p className="text-white/50 mt-1">{selectedMember.jobTitle}</p>
                  )}
                </div>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 mt-6 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    activeTab === 'overview'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('certifications')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
                    activeTab === 'certifications'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Certifications
                  {selectedMember.certifications && selectedMember.certifications.length > 0 && (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 text-xs rounded',
                        activeTab === 'certifications'
                          ? 'bg-black/20 text-black'
                          : 'bg-white/[0.05] text-white/50'
                      )}
                    >
                      {selectedMember.certifications.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('projects')}
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2',
                    activeTab === 'projects'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                      : 'text-white/50 hover:text-white'
                  )}
                >
                  Projects
                  {selectedMember.projectAssignments &&
                    selectedMember.projectAssignments.length > 0 && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 text-xs rounded',
                          activeTab === 'projects'
                            ? 'bg-black/20 text-black'
                            : 'bg-white/[0.05] text-white/50'
                        )}
                      >
                        {selectedMember.projectAssignments.length}
                      </span>
                    )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Role */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-white/30" />
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Role
                      </span>
                    </div>
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg capitalize',
                        ROLE_CONFIG[selectedMember.role.toLowerCase()]?.bgClass ||
                          ROLE_CONFIG.member.bgClass,
                        ROLE_CONFIG[selectedMember.role.toLowerCase()]?.textClass ||
                          ROLE_CONFIG.member.textClass
                      )}
                    >
                      <Shield className="h-4 w-4" />
                      {selectedMember.role}
                    </span>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-white/30" />
                      <span className="text-xs font-medium text-white/40 uppercase tracking-wider">
                        Contact Information
                      </span>
                    </div>
                    <div
                      className={cn(
                        'space-y-3 p-4 rounded-xl',
                        'bg-white/[0.02] border border-white/[0.06]'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-white/30" />
                        <div>
                          <div className="text-xs text-white/40">Email</div>
                          <a
                            href={`mailto:${selectedMember.email}`}
                            className="text-sm text-amber-400 hover:text-amber-300 font-medium"
                          >
                            {selectedMember.email}
                          </a>
                        </div>
                      </div>

                      {selectedMember.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-white/30" />
                          <div>
                            <div className="text-xs text-white/40">Phone</div>
                            <a
                              href={`tel:${selectedMember.phone}`}
                              className="text-sm text-amber-400 hover:text-amber-300 font-medium"
                            >
                              {selectedMember.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedMember.company && (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-white/30" />
                          <div>
                            <div className="text-xs text-white/40">Company</div>
                            <div className="text-sm text-white font-medium">
                              {selectedMember.company}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Certifications Tab */}
              {activeTab === 'certifications' && (
                <>
                  {selectedMember.certifications && selectedMember.certifications.length > 0 ? (
                    <div className="space-y-4">
                      {selectedMember.certifications.map((cert, index) => {
                        const expiringSoon = isCertificationExpiringSoon(cert.expiryDate)
                        const expired = isCertificationExpired(cert.expiryDate)
                        const certKey = `${cert.name}-${cert.issuer}-${index}`

                        return (
                          <div
                            key={certKey}
                            className={cn(
                              'rounded-xl p-4 border',
                              expired
                                ? 'bg-red-500/5 border-red-500/20'
                                : expiringSoon
                                  ? 'bg-amber-500/5 border-amber-500/20'
                                  : 'bg-white/[0.02] border-white/[0.06]'
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Award
                                  className={cn(
                                    'h-5 w-5',
                                    expired
                                      ? 'text-red-400'
                                      : expiringSoon
                                        ? 'text-amber-400'
                                        : 'text-white/30'
                                  )}
                                />
                                <h4 className="font-semibold text-white">{cert.name}</h4>
                              </div>
                              {(expired || expiringSoon) && (
                                <span
                                  className={cn(
                                    'text-xs px-2 py-1 rounded-lg',
                                    expired
                                      ? 'bg-red-500/10 text-red-400'
                                      : 'bg-amber-500/10 text-amber-400'
                                  )}
                                >
                                  {expired ? 'Expired' : 'Expiring Soon'}
                                </span>
                              )}
                            </div>

                            <p className="text-sm text-white/50 mb-3">Issued by {cert.issuer}</p>

                            <div className="flex items-center gap-4 text-xs text-white/40">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Issued: {new Date(cert.issuedDate).toLocaleDateString()}</span>
                              </div>

                              {cert.expiryDate && (
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>
                                    Expires: {new Date(cert.expiryDate).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Award className="h-16 w-16 text-white/10 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Certifications</h3>
                      <p className="text-sm text-white/40">
                        This team member has no certifications on file.
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <>
                  {selectedMember.projectAssignments &&
                  selectedMember.projectAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedMember.projectAssignments.map((project, index) => (
                        <div
                          key={`${project}-${index}`}
                          className={cn(
                            'flex items-center gap-3 p-4 rounded-xl',
                            'bg-white/[0.02] border border-white/[0.06]',
                            'hover:border-amber-500/30 hover:bg-amber-500/5 transition-colors cursor-pointer'
                          )}
                        >
                          <FolderKanban className="h-5 w-5 text-white/30" />
                          <span className="font-medium text-white">{project}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FolderKanban className="h-16 w-16 text-white/10 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">No Projects</h3>
                      <p className="text-sm text-white/40">
                        This team member is not assigned to any projects yet.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
