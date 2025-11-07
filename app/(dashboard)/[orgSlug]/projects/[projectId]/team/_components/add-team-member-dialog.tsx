/**
 * Add Team Member Dialog Component
 * Dialog for adding organization members to project
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { UserPlus, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  addTeamMember,
  type ProjectRole,
  type OrgMember,
} from '@/lib/actions/projects/team-management'

interface AddTeamMemberDialogProps {
  projectId: string
  availableMembers: OrgMember[]
}

export function AddTeamMemberDialog({
  projectId,
  availableMembers,
}: AddTeamMemberDialogProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [role, setRole] = useState<ProjectRole>('viewer')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedUserId) {
      toast({
        title: 'Error',
        description: 'Please select a member to add',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await addTeamMember({
        projectId,
        userId: selectedUserId,
        role,
      })

      if (result.success) {
        const selectedMember = availableMembers.find((m) => m.id === selectedUserId)
        toast({
          title: 'Member added',
          description: `${selectedMember?.fullName || selectedMember?.email} has been added as ${role}`,
        })
        setOpen(false)
        setSelectedUserId('')
        setRole('viewer')
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to add team member',
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
      setIsSubmitting(false)
    }
  }

  // Reset form when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      setSelectedUserId('')
      setRole('viewer')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add an organization member to this project and assign them a role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Member Selection */}
            <div className="space-y-2">
              <Label htmlFor="member">Member</Label>
              {availableMembers.length > 0 ? (
                <Select
                  value={selectedUserId}
                  onValueChange={setSelectedUserId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="member">
                    <SelectValue placeholder="Select a member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMembers.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {member.fullName || member.email}
                          </span>
                          {member.fullName && (
                            <span className="text-xs text-muted-foreground">
                              {member.email}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-muted-foreground">
                  All organization members are already on this project.
                </p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as ProjectRole)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">
                    <div className="py-2">
                      <p className="font-medium">Manager</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Full project control including budgets, approvals, and team management
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="supervisor">
                    <div className="py-2">
                      <p className="font-medium">Supervisor</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Field operations including costs, daily reports, and submittals
                      </p>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="py-2">
                      <p className="font-medium">Viewer</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Read-only access to project data and reports
                      </p>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Help Text */}
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Role Permissions</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• <strong>Managers</strong>: Can edit budgets, approve change orders, and manage the project</li>
                <li>• <strong>Supervisors</strong>: Can create costs, daily reports, and submit RFIs</li>
                <li>• <strong>Viewers</strong>: Can view all project data but cannot make changes</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedUserId || isSubmitting || availableMembers.length === 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
