'use client'

/**
 * Organization Team Client Component
 * Industrial Luxury aesthetic
 */

import { useState } from 'react'
import { Plus, UserMinus, Loader2, Mail, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  type OrgTeamMember,
  type OrgRole,
  getOrganizationMembers,
} from '@/lib/actions/organization-members'
import {
  inviteMember,
  removeMember,
  updateMemberRole,
} from '@/lib/actions/organization'

interface OrgTeamClientProps {
  orgId: string
  orgSlug: string
  initialTeamMembers: OrgTeamMember[]
  isOwnerOrAdmin: boolean
}

// Role badge config - Industrial Luxury style
const ROLE_CONFIG: Record<OrgRole, { bgClass: string; textClass: string }> = {
  owner: { bgClass: 'bg-amber-500/10', textClass: 'text-amber-400' },
  admin: { bgClass: 'bg-purple-500/10', textClass: 'text-purple-400' },
  member: { bgClass: 'bg-white/[0.05]', textClass: 'text-white/50' },
}

export function OrgTeamClient({
  orgId,
  orgSlug,
  initialTeamMembers,
  isOwnerOrAdmin,
}: OrgTeamClientProps) {
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<OrgTeamMember[]>(initialTeamMembers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<OrgTeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Add member dialog state
  const [email, setEmail] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<OrgRole>('member')

  const refreshTeamMembers = async () => {
    const result = await getOrganizationMembers(orgId)
    if (result.success && result.data) {
      setTeamMembers(result.data)
    }
  }

  const handleAddMember = async () => {
    if (!email || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please enter an email and select a role',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    const result = await inviteMember(
      {
        email,
        role: selectedRole,
      },
      orgId
    )

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member invited successfully',
      })
      setIsAddDialogOpen(false)
      setEmail('')
      setSelectedRole('member')
      await refreshTeamMembers()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to invite team member',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setIsLoading(true)
    const result = await removeMember(
      {
        memberId: memberToRemove.id,
      },
      orgId
    )

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member removed successfully',
      })
      setIsRemoveDialogOpen(false)
      setMemberToRemove(null)
      await refreshTeamMembers()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to remove team member',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleRoleChange = async (memberId: string, newRole: OrgRole) => {
    setIsLoading(true)
    const result = await updateMemberRole(
      {
        memberId,
        role: newRole,
      },
      orgId
    )

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Role updated successfully',
      })
      await refreshTeamMembers()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update role',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      const parts = name.split(' ').filter(p => p.length > 0)
      if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      }
      return name.slice(0, 2).toUpperCase()
    }
    return email.slice(0, 2).toUpperCase()
  }

  return (
    <>
      {/* Header with Add Button */}
      {isOwnerOrAdmin && (
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={() => setIsAddDialogOpen(true)}
            className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all duration-200"
          >
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      )}

      {/* Team Members List */}
      {teamMembers.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          No team members yet. Invite members to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {teamMembers.map((member) => {
            const roleConfig = ROLE_CONFIG[member.role] || ROLE_CONFIG.member

            return (
              <div
                key={member.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-xl",
                  "bg-white/[0.02] border border-white/[0.06]",
                  "hover:border-white/[0.12] transition-all duration-200"
                )}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-black font-bold text-sm">
                    {getInitials(member.user.fullName, member.user.email)}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="font-medium text-white">
                      {member.user.fullName || member.user.email}
                    </p>
                    <p className="text-sm text-white/40 flex items-center gap-1.5">
                      <Mail className="h-3 w-3" />
                      {member.user.email}
                    </p>
                    {member.invitedByUser && member.joinedAt && (
                      <p className="text-xs text-white/30 mt-1">
                        Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    )}
                    {member.invitedByUser && !member.joinedAt && (
                      <p className="text-xs text-white/30 mt-1">
                        Invited by {member.invitedByUser.fullName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isOwnerOrAdmin ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value as OrgRole)}
                      disabled={isLoading}
                      className={cn(
                        "h-9 px-3 rounded-lg text-sm font-medium",
                        "bg-white/[0.03] border border-white/[0.08]",
                        "text-white/80",
                        "focus:outline-none focus:border-amber-500/50",
                        "transition-all duration-200"
                      )}
                    >
                      <option value="owner" className="bg-[#0a0a0a]">Owner</option>
                      <option value="admin" className="bg-[#0a0a0a]">Admin</option>
                      <option value="member" className="bg-[#0a0a0a]">Member</option>
                    </select>
                  ) : (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg capitalize",
                      roleConfig.bgClass,
                      roleConfig.textClass
                    )}>
                      <Shield className="h-3 w-3" />
                      {member.role}
                    </span>
                  )}

                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => {
                        setMemberToRemove(member)
                        setIsRemoveDialogOpen(true)
                      }}
                      disabled={isLoading}
                      className={cn(
                        "flex items-center justify-center w-9 h-9 rounded-lg",
                        "bg-white/[0.03] border border-white/[0.06]",
                        "text-red-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10",
                        "transition-all duration-200"
                      )}
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Member Dialog */}
      {isAddDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsAddDialogOpen(false)}
          />

          {/* Dialog */}
          <div className={cn(
            "relative w-full max-w-md mx-4 p-6 rounded-2xl",
            "bg-[#0a0a0a] border border-white/[0.08]",
            "shadow-2xl"
          )}>
            <h2 className="text-xl font-semibold text-white mb-2">Invite Team Member</h2>
            <p className="text-sm text-white/50 mb-6">
              Enter the email address of the person you want to invite to this organization.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full px-4 h-11 rounded-xl text-sm",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "text-white placeholder:text-white/30",
                    "focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/20",
                    "transition-all duration-200"
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/60 mb-2">
                  Role
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as OrgRole)}
                  className={cn(
                    "w-full px-4 h-11 rounded-xl text-sm",
                    "bg-white/[0.03] border border-white/[0.08]",
                    "text-white/80",
                    "focus:outline-none focus:border-amber-500/50",
                    "transition-all duration-200"
                  )}
                >
                  <option value="owner" className="bg-[#0a0a0a]">Owner - Full organization access</option>
                  <option value="admin" className="bg-[#0a0a0a]">Admin - Can manage members and settings</option>
                  <option value="member" className="bg-[#0a0a0a]">Member - Basic access</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={() => setIsAddDialogOpen(false)}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-11 rounded-xl text-sm font-medium",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/60 hover:text-white hover:border-white/[0.15]",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleAddMember}
                disabled={isLoading || !email}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium",
                  "bg-gradient-to-r from-amber-500 to-amber-600 text-black",
                  "shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Invite Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Member Dialog */}
      {isRemoveDialogOpen && memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsRemoveDialogOpen(false)}
          />

          {/* Dialog */}
          <div className={cn(
            "relative w-full max-w-md mx-4 p-6 rounded-2xl",
            "bg-[#0a0a0a] border border-red-500/20",
            "shadow-2xl"
          )}>
            <h2 className="text-xl font-semibold text-white mb-2">Remove Team Member</h2>
            <p className="text-sm text-white/50 mb-6">
              Are you sure you want to remove{' '}
              <strong className="text-white">{memberToRemove.user.fullName || memberToRemove.user.email}</strong>{' '}
              from this organization? They will lose access immediately.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsRemoveDialogOpen(false)}
                disabled={isLoading}
                className={cn(
                  "flex-1 h-11 rounded-xl text-sm font-medium",
                  "bg-white/[0.03] border border-white/[0.08]",
                  "text-white/60 hover:text-white hover:border-white/[0.15]",
                  "transition-all duration-200"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveMember}
                disabled={isLoading}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-medium",
                  "bg-red-500/10 border border-red-500/30 text-red-400",
                  "hover:bg-red-500/20 hover:border-red-500/50",
                  "transition-all duration-200"
                )}
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
