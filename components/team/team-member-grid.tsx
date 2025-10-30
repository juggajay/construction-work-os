'use client'

import { useState } from 'react'
import { TeamMemberCard, type TeamMember, type Certification } from './team-member-card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Mail,
  Phone,
  Briefcase,
  Building2,
  Award,
  Calendar,
  FolderKanban,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  getInitials,
  getRoleBadgeColor,
  isCertificationExpiringSoon,
  isCertificationExpired,
} from '@/lib/utils/team-helpers'

interface TeamMemberGridProps {
  members: TeamMember[]
  className?: string
}

export function TeamMemberGrid({ members, className }: TeamMemberGridProps) {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCardClick = (member: TeamMember) => {
    setSelectedMember(member)
    setIsDialogOpen(true)
  }

  return (
    <>
      <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
        {members.map((member) => (
          <TeamMemberCard
            key={member.id}
            member={member}
            onCardClick={handleCardClick}
          />
        ))}
      </div>

      {/* Member Detail Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedMember && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white text-xl font-bold">
                    {getInitials(selectedMember.fullName, selectedMember.email)}
                  </div>
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">
                      {selectedMember.fullName || selectedMember.email}
                    </DialogTitle>
                    {selectedMember.jobTitle && (
                      <DialogDescription className="text-base mt-1">
                        {selectedMember.jobTitle}
                      </DialogDescription>
                    )}
                  </div>
                </div>
              </DialogHeader>

              <Tabs defaultValue="overview" className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="certifications">
                    Certifications
                    {selectedMember.certifications && selectedMember.certifications.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedMember.certifications.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="projects">
                    Projects
                    {selectedMember.projectAssignments && selectedMember.projectAssignments.length > 0 && (
                      <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                        {selectedMember.projectAssignments.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Role */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                        Role
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn('text-sm font-medium px-3 py-1', getRoleBadgeColor(selectedMember.role))}
                    >
                      {selectedMember.role}
                    </Badge>
                  </div>

                  {/* Contact Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="h-4 w-4 text-neutral-400" />
                      <span className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
                        Contact Information
                      </span>
                    </div>
                    <div className="space-y-3 bg-neutral-50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-neutral-400" />
                        <div>
                          <div className="text-xs text-neutral-500">Email</div>
                          <a
                            href={`mailto:${selectedMember.email}`}
                            className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                          >
                            {selectedMember.email}
                          </a>
                        </div>
                      </div>

                      {selectedMember.phone && (
                        <div className="flex items-center gap-3">
                          <Phone className="h-5 w-5 text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500">Phone</div>
                            <a
                              href={`tel:${selectedMember.phone}`}
                              className="text-sm text-amber-600 hover:text-amber-700 font-medium"
                            >
                              {selectedMember.phone}
                            </a>
                          </div>
                        </div>
                      )}

                      {selectedMember.company && (
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 text-neutral-400" />
                          <div>
                            <div className="text-xs text-neutral-500">Company</div>
                            <div className="text-sm text-neutral-900 font-medium">
                              {selectedMember.company}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* Certifications Tab */}
                <TabsContent value="certifications" className="mt-6">
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
                              'rounded-lg p-4 border-2',
                              expired
                                ? 'bg-red-50 border-red-200'
                                : expiringSoon
                                ? 'bg-amber-50 border-amber-200'
                                : 'bg-white border-neutral-200'
                            )}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Award className={cn(
                                  'h-5 w-5',
                                  expired
                                    ? 'text-red-500'
                                    : expiringSoon
                                    ? 'text-amber-500'
                                    : 'text-neutral-400'
                                )} />
                                <h4 className="font-semibold text-neutral-900">{cert.name}</h4>
                              </div>
                              {(expired || expiringSoon) && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'text-xs',
                                    expired
                                      ? 'bg-red-100 text-red-700 border-red-300'
                                      : 'bg-amber-100 text-amber-700 border-amber-300'
                                  )}
                                >
                                  {expired ? 'Expired' : 'Expiring Soon'}
                                </Badge>
                              )}
                            </div>

                            <p className="text-sm text-neutral-600 mb-3">
                              Issued by {cert.issuer}
                            </p>

                            <div className="flex items-center gap-4 text-xs text-neutral-500">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  Issued: {new Date(cert.issuedDate).toLocaleDateString()}
                                </span>
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
                      <Award className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        No Certifications
                      </h3>
                      <p className="text-sm text-neutral-500">
                        This team member has no certifications on file.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Projects Tab */}
                <TabsContent value="projects" className="mt-6">
                  {selectedMember.projectAssignments && selectedMember.projectAssignments.length > 0 ? (
                    <div className="space-y-3">
                      {selectedMember.projectAssignments.map((project, index) => (
                        <div
                          key={`${project}-${index}`}
                          className="flex items-center gap-3 p-4 rounded-lg border border-neutral-200 bg-white hover:border-amber-300 hover:bg-amber-50/50 transition-colors"
                        >
                          <FolderKanban className="h-5 w-5 text-neutral-400" />
                          <span className="font-medium text-neutral-900">{project}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FolderKanban className="h-16 w-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        No Projects
                      </h3>
                      <p className="text-sm text-neutral-500">
                        This team member is not assigned to any projects yet.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
