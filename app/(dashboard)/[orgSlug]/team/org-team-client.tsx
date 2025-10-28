'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Plus, UserMinus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
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

  const getRoleBadgeVariant = (role: OrgRole) => {
    switch (role) {
      case 'owner':
        return 'default'
      case 'admin':
        return 'secondary'
      case 'member':
        return 'outline'
      default:
        return 'outline'
    }
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {isOwnerOrAdmin
                  ? 'Manage who has access to this organization'
                  : 'View team members in this organization'}
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Invite Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No team members yet. Invite members to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-4">
                    <Avatar>
                      <AvatarImage src={member.user.avatarUrl || undefined} />
                      <AvatarFallback>
                        {getInitials(member.user.fullName, member.user.email)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.user.fullName || member.user.email}
                      </p>
                      <p className="text-sm text-neutral-500">{member.user.email}</p>
                      {member.invitedByUser && member.joinedAt && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Joined {new Date(member.joinedAt).toLocaleDateString()}
                        </p>
                      )}
                      {member.invitedByUser && !member.joinedAt && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Invited by {member.invitedByUser.fullName}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwnerOrAdmin ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value as OrgRole)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={getRoleBadgeVariant(member.role)}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </Badge>
                    )}

                    {isOwnerOrAdmin && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setMemberToRemove(member)
                          setIsRemoveDialogOpen(true)
                        }}
                        disabled={isLoading}
                      >
                        <UserMinus className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Enter the email address of the person you want to invite to this organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as OrgRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owner">Owner - Full organization access</SelectItem>
                  <SelectItem value="admin">
                    Admin - Can manage members and settings
                  </SelectItem>
                  <SelectItem value="member">Member - Basic access</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isLoading || !email}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Invite Member
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Member Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <strong>{memberToRemove?.user.fullName || memberToRemove?.user.email}</strong> from
              this organization? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveMember} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
