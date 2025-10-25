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
  type TeamMember,
  type ProjectRole,
  type OrgMember,
  addTeamMember,
  removeTeamMember,
  updateTeamMemberRole,
  getAvailableOrgMembers,
  getProjectTeam,
} from '@/lib/actions/projects/team-management'

interface TeamManagementClientProps {
  projectId: string
  orgId: string
  orgSlug: string
  initialTeamMembers: TeamMember[]
  isOwnerOrAdmin: boolean
}

export function TeamManagementClient({
  projectId,
  orgId,
  orgSlug,
  initialTeamMembers,
  isOwnerOrAdmin,
}: TeamManagementClientProps) {
  const { toast } = useToast()
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Add member dialog state
  const [availableMembers, setAvailableMembers] = useState<OrgMember[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('viewer')
  const [trade, setTrade] = useState<string>('')

  const refreshTeamMembers = async () => {
    const result = await getProjectTeam(projectId)
    if (result.success && result.data) {
      setTeamMembers(result.data)
    }
  }

  const handleOpenAddDialog = async () => {
    setIsLoading(true)
    setIsAddDialogOpen(true)
    const result = await getAvailableOrgMembers({ orgId, projectId })
    if (result.success && result.data) {
      setAvailableMembers(result.data)
    }
    setIsLoading(false)
  }

  const handleAddMember = async () => {
    if (!selectedUserId || !selectedRole) {
      toast({
        title: 'Error',
        description: 'Please select a user and role',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    const result = await addTeamMember({
      projectId,
      userId: selectedUserId,
      role: selectedRole,
      trade: trade || undefined,
    })

    if (result.success) {
      toast({
        title: 'Success',
        description: 'Team member added successfully',
      })
      setIsAddDialogOpen(false)
      setSelectedUserId('')
      setSelectedRole('viewer')
      setTrade('')
      await refreshTeamMembers()
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to add team member',
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove) return

    setIsLoading(true)
    const result = await removeTeamMember(memberToRemove.id)

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

  const handleRoleChange = async (memberId: string, newRole: ProjectRole) => {
    setIsLoading(true)
    const result = await updateTeamMemberRole({
      projectAccessId: memberId,
      newRole,
    })

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

  const getRoleBadgeVariant = (role: ProjectRole) => {
    switch (role) {
      case 'manager':
        return 'default'
      case 'supervisor':
        return 'secondary'
      case 'viewer':
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
                  ? 'Manage who has access to this project'
                  : 'View team members on this project'}
              </CardDescription>
            </div>
            {isOwnerOrAdmin && (
              <Button onClick={handleOpenAddDialog}>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">
              No team members yet. Add members to get started.
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
                      {member.trade && (
                        <p className="text-xs text-neutral-400 mt-1">Trade: {member.trade}</p>
                      )}
                      {member.grantedByUser && member.grantedAt && (
                        <p className="text-xs text-neutral-400 mt-1">
                          Added by {member.grantedByUser.fullName} on{' '}
                          {new Date(member.grantedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isOwnerOrAdmin ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleRoleChange(member.id, value as ProjectRole)
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
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
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Select a user from your organization and assign them a role on this project.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                <SelectTrigger id="user">
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {availableMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.fullName || member.email} ({member.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as ProjectRole)}>
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager - Full project access</SelectItem>
                  <SelectItem value="supervisor">
                    Supervisor - Can manage daily operations
                  </SelectItem>
                  <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trade">Trade (Optional)</Label>
              <Input
                id="trade"
                placeholder="e.g., Electrical, Plumbing"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={isLoading || !selectedUserId}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
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
              this project? They will lose access immediately.
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
