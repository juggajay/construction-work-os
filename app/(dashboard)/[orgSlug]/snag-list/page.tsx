/**
 * Organization-Level Snag List Page
 *
 * Displays all snag list items across all projects in the organization
 */

'use client'

import { useState, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, ListChecks, AlertCircle, CheckCircle2, Building2, Clock, Upload, Plus } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { cn } from '@/lib/utils'

export default function OrganizationSnagListPage() {
  const params = useParams()
  const router = useRouter()
  const orgSlug = params.orgSlug as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch organization ID
  const { data: org } = useQuery({
    queryKey: ['organization', orgSlug],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name')
        .eq('slug', orgSlug)
        .single()

      if (error) throw error
      return data
    },
  })

  // Fetch all projects for organization
  const { data: projects } = useQuery({
    queryKey: ['projects', org?.id],
    queryFn: async () => {
      if (!org?.id) return []
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, number')
        .eq('org_id', org.id)
        .is('deleted_at', null)
        .order('name')

      if (error) throw error
      return data || []
    },
    enabled: !!org?.id,
  })

  // Placeholder data - will be replaced with actual database query once snag_items table is created
  const { data: snagItems, isLoading } = useQuery({
    queryKey: ['org-snag-items', org?.id, statusFilter, projectFilter],
    queryFn: async () => {
      // TODO: Implement once snag_items table is created
      return []
    },
    enabled: !!org?.id && !!projects,
  })

  // Calculate metrics
  const metrics = useMemo(() => {
    return {
      total: 0,
      open: 0,
      completed: 0,
      overdue: 0,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Client-side search filtering
  const filteredItems = snagItems?.filter((item: any) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      item.description?.toLowerCase().includes(query) ||
      item.location?.toLowerCase().includes(query) ||
      item.project?.name?.toLowerCase().includes(query)
    )
  })

  const handleRowClick = (itemId: string, projectId: string) => {
    router.push(`/${orgSlug}/projects/${projectId}/snag-list/${itemId}`)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    try {
      // TODO: Implement actual upload logic when snag_items table is created
      // This would typically involve:
      // 1. Uploading the file to Supabase Storage
      // 2. Parsing the file (CSV, Excel, etc.)
      // 3. Creating snag items in the database

      await new Promise(resolve => setTimeout(resolve, 1500)) // Simulated delay

      // Reset state
      setSelectedFile(null)
      setUploadDialogOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Snag List</h1>
          <p className="text-muted-foreground">Track deficiencies and completion items across projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Building2 className="h-4 w-4 mr-2" />
            {projects?.length || 0} Projects
          </Button>
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="h-4 w-4 mr-2" />
                Upload Snag List
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Snag List</DialogTitle>
                <DialogDescription>
                  Upload a CSV or Excel file containing snag list items. The file should include columns for
                  description, location, priority, and due date.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Project</label>
                  <Select defaultValue="all">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">File</label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="cursor-pointer"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                  {isUploading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold">{metrics.total}</p>
              </div>
              <ListChecks className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-warning">{metrics.open}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-danger/50 bg-danger/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-danger">{metrics.overdue}</p>
              </div>
              <Clock className="h-8 w-8 text-danger/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-success/50 bg-success/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{metrics.completed}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Snag List Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Snag List Items</CardTitle>
              <CardDescription>All deficiencies and completion items across all projects</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search snag items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="All Projects" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects?.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item #</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-full bg-muted p-4">
                        <ListChecks className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-lg font-medium">Snag List Coming Soon</p>
                        <p className="text-sm text-muted-foreground max-w-md">
                          The snag list feature is currently under development. You&apos;ll be able to track
                          deficiencies and completion items across all your projects here.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
