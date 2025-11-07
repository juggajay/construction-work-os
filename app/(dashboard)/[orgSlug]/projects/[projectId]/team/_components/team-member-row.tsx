/**
 * Team Member Row Component
 * Displays individual team member with role management
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { Trash2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  type TeamMember,
  type ProjectRole,
  updateTeamMemberRole,
  removeTeamMember,
} from '@/lib/actions/projects/team-management'
import { formatDistanceToNow } from 'date-fns'

interface TeamMemberRowProps {
  member: TeamMember
  canManage: boolean
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }
  return email.slice(0, 2).toUpperCase()
}

function getRoleBadgeColor(role: ProjectRole): string {
  switch (role) {
    case 'manager':
      return 'bg-purple-100 text-purple-800 hover:bg-purple-100'
    case 'supervisor':
      return 'bg-green-100 text-green-800 hover:bg-green-100'
    case 'viewer':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-100'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-100'
  }
}

export function TeamMemberRow({ member, canManage }: TeamMemberRowProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)

  const handleRoleChange = async (newRole: ProjectRole) => {
    if (newRole === member.role) return

    setIsUpdating(true)
    try {
      const result = await updateTeamMemberRole({
        projectAccessId: member.id,
        newRole,
      })

      if (result.success) {
        toast({
          title: 'Role updated',
          description: `${member.user.fullName || member.user.email} is now a ${newRole}`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update role',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    try {
      const result = await removeTeamMember(member.id)

      if (result.success) {
        toast({
          title: 'Member removed',
          description: `${member.user.fullName || member.user.email} has been removed from the project`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to remove member',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      setIsRemoveDialogOpen(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
        {/* Avatar */}
        <Avatar className="h-10 w-10">
          {member.user.avatarUrl && (
            <AvatarImage
              src={member.user.avatarUrl}
              alt={member.user.fullName || member.user.email}
            />
          )}
          <AvatarFallback>
            {getInitials(member.user.fullName, member.user.email)}
          </AvatarFallback>
        </Avatar>

        {/* Member Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">
            {member.user.fullName || member.user.email}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {member.user.email}
          </p>
        </div>

        {/* Role Management or Badge */}
        <div className="flex items-center gap-2">
          {canManage ? (
            <>
              <Select
                value={member.role}
                onValueChange={(value) => handleRoleChange(value as ProjectRole)}
                disabled={isUpdating}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">
                    <div>
                      <p className="font-medium">Manager</p>
                      <p className="text-xs text-muted-foreground">
                        Full project control
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div>
                      <p className="font-medium">Supervisor</p>
                      <p className="text-xs text-muted-foreground">Field operations</p>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div>
                      <p className="font-medium">Viewer</p>
                      <p className="text-xs text-muted-foreground">Read-only access</p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsRemoveDialogOpen(true)}
                disabled={isUpdating}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">Remove {member.user.fullName || member.user.email}</span>
              </Button>
            </>
          ) : (
            <Badge variant="secondary" className={getRoleBadgeColor(member.role)}>
              {member.role}
            </Badge>
          )}
        </div>

        {/* Audit Info */}
        {member.grantedAt && (
          <div className="hidden md:block text-xs text-muted-foreground text-right min-w-[150px]">
            <p>
              Added {formatDistanceToNow(new Date(member.grantedAt), { addSuffix: true })}
            </p>
            {member.grantedByUser?.fullName && (
              <p className="truncate">by {member.grantedByUser.fullName}</p>
            )}
          </div>
        )}
      </div>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              <span className="font-medium">
                {member.user.fullName || member.user.email}
              </span>{' '}
              from this project? They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
