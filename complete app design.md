# Construction OS - Complete Application Design System
## Comprehensive Design for Every Feature

---

## 🏗️ Application Architecture & Navigation

### Primary Navigation Structure
```tsx
// components/layout/app-sidebar.tsx
import { 
  Building2, 
  FileText, 
  ClipboardList, 
  DollarSign, 
  Users, 
  Calendar,
  TrendingUp,
  Settings,
  HardHat,
  Wrench,
  Home,
  Bell,
  Search,
  Plus
} from 'lucide-react'

const navigationItems = [
  {
    section: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', href: '/dashboard', badge: null },
      { icon: Building2, label: 'Projects', href: '/projects', badge: '12 active' }
    ]
  },
  {
    section: 'Work',
    items: [
      { icon: FileText, label: 'RFIs', href: '/rfis', badge: '8 pending' },
      { icon: ClipboardList, label: 'Submittals', href: '/submittals', badge: '3 review' },
      { icon: DollarSign, label: 'Change Orders', href: '/change-orders', badge: null },
      { icon: Calendar, label: 'Daily Reports', href: '/daily-reports', badge: 'Today' },
      { icon: Wrench, label: 'Punch List', href: '/punch-list', badge: '24' }
    ]
  },
  {
    section: 'Insights',
    items: [
      { icon: TrendingUp, label: 'Analytics', href: '/analytics' },
      { icon: FileText, label: 'Reports', href: '/reports' }
    ]
  },
  {
    section: 'Settings',
    items: [
      { icon: Users, label: 'Team', href: '/team' },
      { icon: Building2, label: 'Organization', href: '/organization' },
      { icon: Settings, label: 'Settings', href: '/settings' }
    ]
  }
]

export function AppSidebar() {
  return (
    <aside className="w-64 min-h-screen bg-card border-r elevation-1">
      {/* Logo Header */}
      <div className="h-16 px-4 flex items-center border-b">
        <HardHat className="h-8 w-8 text-construction-orange mr-2" />
        <span className="font-bold text-lg">Construction OS</span>
      </div>
      
      {/* Search */}
      <div className="p-4">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Search (⌘K)</span>
        </button>
      </div>
      
      {/* Navigation Sections */}
      <nav className="px-2 pb-4 space-y-6">
        {navigationItems.map(section => (
          <div key={section.section}>
            <h3 className="px-2 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.section}
            </h3>
            <div className="space-y-1">
              {section.items.map(item => (
                <NavItem key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      
      {/* User Profile */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card">
        <button className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
          <img src="/avatar.jpg" className="h-8 w-8 rounded-full" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">Mike Rodriguez</p>
            <p className="text-xs text-muted-foreground">Project Manager</p>
          </div>
        </button>
      </div>
    </aside>
  )
}
```

---

## 📊 1. Dashboard Design

### Main Dashboard Layout
```tsx
// app/(dashboard)/dashboard/page.tsx
export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Mike</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Oct 29, 2025
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Quick Add
          </Button>
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Active Projects"
          value="12"
          change={+2}
          icon={Building2}
          color="primary"
        />
        <MetricCard
          title="Open RFIs"
          value="47"
          change={-5}
          icon={FileText}
          color="warning"
        />
        <MetricCard
          title="Pending Submittals"
          value="8"
          change={0}
          icon={ClipboardList}
          color="info"
        />
        <MetricCard
          title="Budget at Risk"
          value="$247K"
          change={+12}
          icon={DollarSign}
          color="danger"
        />
      </div>
      
      {/* Project Health Overview */}
      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Project Health</CardTitle>
            <CardDescription>Real-time status across all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <ProjectHealthChart />
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Urgent Actions</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent>
            <UrgentActionsList />
          </CardContent>
        </Card>
      </div>
      
      {/* Activity Feed & Schedule */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityFeed />
        <UpcomingSchedule />
      </div>
    </div>
  )
}
```

### Metric Cards with Sparklines
```tsx
const MetricCard = ({ title, value, change, icon: Icon, color }) => {
  const colors = {
    primary: 'text-primary bg-primary/10',
    warning: 'text-warning bg-warning/10',
    info: 'text-info bg-info/10',
    danger: 'text-danger bg-danger/10',
  }
  
  return (
    <Card className="hover:shadow-lg transition-shadow hover:-translate-y-0.5">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {change !== 0 && (
              <p className={cn(
                'text-sm mt-2 flex items-center gap-1',
                change > 0 ? 'text-danger' : 'text-success'
              )}>
                {change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(change)}% from last week
              </p>
            )}
          </div>
          <div className={cn('h-12 w-12 rounded-lg flex items-center justify-center', colors[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="mt-4 h-12">
          <Sparkline data={[3, 5, 2, 8, 4, 9, 7]} />
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🏢 2. Projects Module

### Projects List View
```tsx
// app/(dashboard)/projects/page.tsx
export function ProjectsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">12 active, 3 on hold, 28 completed</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <ArrowUpDown className="mr-2 h-4 w-4" />
            Sort
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>
      </div>
      
      {/* View Toggle */}
      <Tabs defaultValue="grid" className="w-full">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="grid">
              <Grid className="h-4 w-4 mr-2" />
              Grid
            </TabsTrigger>
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="kanban">
              <Columns className="h-4 w-4 mr-2" />
              Kanban
            </TabsTrigger>
            <TabsTrigger value="timeline">
              <Calendar className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline">12 projects</Badge>
            <Badge variant="outline">$24.7M total</Badge>
          </div>
        </div>
        
        <TabsContent value="grid" className="mt-6">
          <ProjectGrid />
        </TabsContent>
        <TabsContent value="list" className="mt-6">
          <ProjectTable />
        </TabsContent>
        <TabsContent value="kanban" className="mt-6">
          <ProjectKanban />
        </TabsContent>
        <TabsContent value="timeline" className="mt-6">
          <ProjectTimeline />
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### Enhanced Project Card
```tsx
const ProjectCard = ({ project }) => {
  const statusColors = {
    active: 'border-l-success',
    'on-hold': 'border-l-warning',
    delayed: 'border-l-danger',
    completed: 'border-l-info'
  }
  
  return (
    <Card className={cn(
      'hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer',
      'border-l-4',
      statusColors[project.status]
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl">{project.name}</CardTitle>
            <CardDescription>
              {project.number} • {project.client}
            </CardDescription>
          </div>
          <ConstructionBadge status={project.health}>
            {project.health}
          </ConstructionBadge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Location */}
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span>{project.address}</span>
        </div>
        
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.completion}%</span>
          </div>
          <Progress value={project.completion} className="h-2" />
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Budget</p>
            <p className="font-bold">${project.budget}M</p>
            <p className={cn(
              'text-xs',
              project.budgetStatus === 'over' ? 'text-danger' : 'text-success'
            )}>
              {project.budgetStatus === 'over' ? '↑' : '↓'} {project.budgetVariance}%
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Schedule</p>
            <p className="font-bold">{project.daysRemaining}d</p>
            <p className={cn(
              'text-xs',
              project.scheduleStatus === 'behind' ? 'text-danger' : 'text-success'
            )}>
              {project.scheduleStatus}
            </p>
          </div>
        </div>
        
        {/* Team Avatars */}
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.team.slice(0, 4).map((member, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={member.avatar} />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            ))}
            {project.team.length > 4 && (
              <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                +{project.team.length - 4}
              </div>
            )}
          </div>
          <Button size="sm" variant="ghost">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### Project Detail View
```tsx
// app/(dashboard)/projects/[id]/page.tsx
export function ProjectDetail({ project }) {
  return (
    <div className="min-h-screen">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-primary/10 to-transparent p-6 border-b">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Badge>{project.status}</Badge>
              <ConstructionBadge status={project.health}>
                {project.health}
              </ConstructionBadge>
            </div>
            <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
            <p className="text-muted-foreground">
              {project.number} • {project.type} • {project.client}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </div>
      
      {/* Key Metrics Bar */}
      <div className="bg-card border-b p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <MetricItem label="Budget" value={`$${project.budget}M`} status={project.budgetStatus} />
          <MetricItem label="Spent" value={`$${project.spent}M`} />
          <MetricItem label="Timeline" value={`${project.duration} months`} />
          <MetricItem label="Complete" value={`${project.completion}%`} />
          <MetricItem label="RFIs" value={project.rfiCount} badge="3 open" />
          <MetricItem label="Team" value={`${project.teamSize} members`} />
        </div>
      </div>
      
      {/* Tabbed Content */}
      <Tabs defaultValue="overview" className="flex-1">
        <TabsList className="px-6 py-0 h-12 bg-transparent border-b rounded-none">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="rfis">RFIs</TabsTrigger>
          <TabsTrigger value="submittals">Submittals</TabsTrigger>
          <TabsTrigger value="changes">Changes</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="team">Team</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-6">
          <ProjectOverview project={project} />
        </TabsContent>
        {/* Other tab contents */}
      </Tabs>
    </div>
  )
}
```

---

## 📋 3. RFIs Management

### RFI Dashboard
```tsx
// app/(dashboard)/rfis/page.tsx
export function RFIsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* RFI Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total RFIs</p>
                <p className="text-2xl font-bold">847</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Response</p>
                <p className="text-2xl font-bold text-warning">23</p>
              </div>
              <Clock className="h-8 w-8 text-warning/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-danger/50 bg-danger/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-danger">8</p>
              </div>
              <AlertCircle className="h-8 w-8 text-danger/20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">2.4 days</p>
              </div>
              <TrendingDown className="h-8 w-8 text-success/20" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* RFI List with Ball-in-Court Tracking */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>RFI Log</CardTitle>
              <CardDescription>Track all requests for information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New RFI
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <RFITable />
        </CardContent>
      </Card>
    </div>
  )
}
```

### RFI Ball-in-Court Tracker
```tsx
const RFITable = () => {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-24">RFI #</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Project</TableHead>
          <TableHead>Ball in Court</TableHead>
          <TableHead>Days Open</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rfis.map(rfi => (
          <TableRow key={rfi.id} className="cursor-pointer hover:bg-muted/50">
            <TableCell className="font-medium">{rfi.number}</TableCell>
            <TableCell>
              <div>
                <p className="font-medium line-clamp-1">{rfi.subject}</p>
                <p className="text-xs text-muted-foreground">{rfi.category}</p>
              </div>
            </TableCell>
            <TableCell>{rfi.project}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={rfi.assignee.avatar} />
                  <AvatarFallback>{rfi.assignee.initials}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{rfi.assignee.name}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={rfi.daysOpen > 5 ? 'destructive' : 'secondary'}>
                {rfi.daysOpen} days
              </Badge>
            </TableCell>
            <TableCell>
              <span className={cn(
                'text-sm',
                rfi.isOverdue && 'text-danger font-medium'
              )}>
                {rfi.dueDate}
              </span>
            </TableCell>
            <TableCell>
              <RFIStatusBadge status={rfi.status} isOverdue={rfi.isOverdue} />
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### RFI Detail View
```tsx
// app/(dashboard)/rfis/[id]/page.tsx
export function RFIDetail({ rfi }) {
  return (
    <div className="min-h-screen flex">
      {/* Main Content */}
      <div className="flex-1 p-6 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">RFI #{rfi.number}</h1>
              <RFIStatusBadge status={rfi.status} />
              {rfi.priority === 'high' && (
                <Badge variant="destructive">High Priority</Badge>
              )}
            </div>
            <p className="text-muted-foreground">{rfi.subject}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Forward className="h-4 w-4 mr-2" />
              Forward
            </Button>
            <Button size="sm">
              <Reply className="h-4 w-4 mr-2" />
              Respond
            </Button>
          </div>
        </div>
        
        {/* RFI Thread */}
        <Card>
          <CardContent className="p-6 space-y-6">
            {rfi.thread.map((message, i) => (
              <RFIMessage key={i} message={message} />
            ))}
          </CardContent>
        </Card>
        
        {/* Response Form */}
        <Card>
          <CardHeader>
            <CardTitle>Add Response</CardTitle>
          </CardHeader>
          <CardContent>
            <RFIResponseForm />
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <aside className="w-80 border-l p-6 space-y-6 bg-muted/10">
        <RFISidebar rfi={rfi} />
      </aside>
    </div>
  )
}
```

---

## 📄 4. Submittals Workflow

### Submittals Pipeline View
```tsx
// app/(dashboard)/submittals/page.tsx
export function SubmittalsPage() {
  const stages = [
    { id: 'draft', title: 'Draft', count: 3 },
    { id: 'submitted', title: 'Submitted', count: 8 },
    { id: 'under-review', title: 'Under Review', count: 5 },
    { id: 'approved-with-comments', title: 'Approved w/ Comments', count: 2 },
    { id: 'approved', title: 'Approved', count: 12 },
    { id: 'rejected', title: 'Rejected', count: 1 }
  ]
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Submittals</h1>
          <p className="text-muted-foreground">Track and manage all project submittals</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Submittal
        </Button>
      </div>
      
      {/* Pipeline View */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max">
          {stages.map(stage => (
            <div key={stage.id} className="w-80">
              <div className="bg-muted/30 rounded-t-lg p-3 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.title}</h3>
                  <Badge variant="secondary">{stage.count}</Badge>
                </div>
              </div>
              <div className="bg-card rounded-b-lg border border-t-0 min-h-[600px] p-2 space-y-2">
                <SubmittalCards stage={stage.id} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### Submittal Card
```tsx
const SubmittalCard = ({ submittal }) => {
  const priorityColors = {
    high: 'border-danger',
    medium: 'border-warning',
    low: 'border-muted'
  }
  
  return (
    <Card className={cn(
      'cursor-pointer hover:shadow-md transition-all',
      'border-l-4',
      priorityColors[submittal.priority]
    )}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-sm">{submittal.number}</p>
              <p className="text-xs text-muted-foreground">{submittal.project}</p>
            </div>
            {submittal.isUrgent && (
              <Badge variant="destructive" className="text-xs">
                Urgent
              </Badge>
            )}
          </div>
          
          {/* Title */}
          <p className="text-sm line-clamp-2">{submittal.title}</p>
          
          {/* Spec Section */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {submittal.specSection}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {submittal.type}
            </Badge>
          </div>
          
          {/* Timeline */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              Due: {submittal.dueDate}
            </span>
            <span className={cn(
              submittal.daysRemaining < 3 ? 'text-danger' : 'text-muted-foreground'
            )}>
              {submittal.daysRemaining}d left
            </span>
          </div>
          
          {/* Assignee */}
          <div className="flex items-center gap-2 pt-2 border-t">
            <Avatar className="h-6 w-6">
              <AvatarImage src={submittal.assignee.avatar} />
              <AvatarFallback>{submittal.assignee.initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs">{submittal.assignee.name}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 💵 5. Change Orders

### Change Orders Dashboard
```tsx
// app/(dashboard)/change-orders/page.tsx
export function ChangeOrdersPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Financial Impact Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Original Contract</p>
            <p className="text-2xl font-bold">$24.5M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Approved Changes</p>
            <p className="text-2xl font-bold text-success">+$1.2M</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Pending Changes</p>
            <p className="text-2xl font-bold text-warning">+$450K</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Contract</p>
            <p className="text-2xl font-bold">$25.7M</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Change Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Change Orders</CardTitle>
              <CardDescription>Manage contract modifications</CardDescription>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Change Order
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ChangeOrderTable />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Change Order Impact Visualization
```tsx
const ChangeOrderImpact = ({ changeOrder }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Impact Analysis</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cost Impact */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Cost Impact</span>
            <span className={cn(
              'font-bold',
              changeOrder.costImpact > 0 ? 'text-danger' : 'text-success'
            )}>
              {changeOrder.costImpact > 0 ? '+' : ''} ${Math.abs(changeOrder.costImpact).toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.abs(changeOrder.costImpact) / changeOrder.originalBudget * 100}
            className="h-2"
          />
        </div>
        
        {/* Schedule Impact */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Schedule Impact</span>
            <span className={cn(
              'font-bold',
              changeOrder.scheduleImpact > 0 ? 'text-danger' : 'text-success'
            )}>
              {changeOrder.scheduleImpact > 0 ? '+' : ''} {changeOrder.scheduleImpact} days
            </span>
          </div>
          <Progress 
            value={Math.abs(changeOrder.scheduleImpact) / 30 * 100}
            className="h-2"
          />
        </div>
        
        {/* Approval Chain */}
        <div>
          <p className="text-sm font-medium mb-3">Approval Chain</p>
          <div className="space-y-2">
            {changeOrder.approvals.map((approval, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center',
                  approval.status === 'approved' ? 'bg-success/10 text-success' :
                  approval.status === 'pending' ? 'bg-warning/10 text-warning' :
                  'bg-muted text-muted-foreground'
                )}>
                  {approval.status === 'approved' ? <Check className="h-4 w-4" /> :
                   approval.status === 'pending' ? <Clock className="h-4 w-4" /> :
                   <Circle className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{approval.role}</p>
                  <p className="text-xs text-muted-foreground">{approval.name}</p>
                </div>
                {approval.date && (
                  <span className="text-xs text-muted-foreground">{approval.date}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 📅 6. Daily Reports

### Daily Report Mobile View
```tsx
// app/(dashboard)/daily-reports/mobile.tsx
export function DailyReportMobile() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card border-b p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Daily Report</h1>
          <Badge>{format(new Date(), 'MMM d, yyyy')}</Badge>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="p-4 grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Crew</p>
                <p className="font-bold">24</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Weather</p>
                <p className="font-bold">72°F Clear</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Report Sections */}
      <div className="p-4 space-y-4">
        {/* Work Performed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Work Performed</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Describe today's work..."
              className="min-h-[100px] text-base"
            />
          </CardContent>
        </Card>
        
        {/* Safety */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Safety</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Incidents</span>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">None</Button>
                  <Button variant="destructive" size="sm">Report</Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Toolbox Talk</span>
                <Switch />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Photos */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Photos</CardTitle>
              <Button size="sm" variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2">
              {/* Photo thumbnails */}
            </div>
          </CardContent>
        </Card>
        
        {/* Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Equipment</CardTitle>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Excavator CAT 320</span>
                <Badge variant="outline">8 hrs</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Crane 50T</span>
                <Badge variant="outline">4 hrs</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Submit Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t">
        <Button className="w-full h-12 text-lg font-semibold">
          Submit Daily Report
        </Button>
      </div>
    </div>
  )
}
```

---

## 👥 7. Team Management

### Team Dashboard
```tsx
// app/(dashboard)/team/page.tsx
export function TeamPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Team Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Total Members</p>
            <p className="text-2xl font-bold">87</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">On Site Today</p>
            <p className="text-2xl font-bold">42</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Active Projects</p>
            <p className="text-2xl font-bold">12</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Certifications</p>
            <p className="text-2xl font-bold">234</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Team Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>Manage your construction team</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeamGrid />
        </CardContent>
      </Card>
    </div>
  )
}
```

### Team Member Card
```tsx
const TeamMemberCard = ({ member }) => {
  return (
    <Card className="hover:shadow-lg transition-all">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar} />
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold">{member.name}</h3>
            <p className="text-sm text-muted-foreground">{member.role}</p>
            
            {/* Contact Info */}
            <div className="mt-3 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3 w-3 text-muted-foreground" />
                <span>{member.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{member.email}</span>
              </div>
            </div>
            
            {/* Projects */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Active Projects</p>
              <div className="flex gap-1">
                {member.projects.map((project, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {project}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Certifications */}
            {member.certifications.length > 0 && (
              <div className="mt-3 flex gap-2">
                {member.certifications.map((cert, i) => (
                  <div key={i} className="h-6 w-6 rounded bg-success/10 flex items-center justify-center">
                    <Shield className="h-3 w-3 text-success" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 📊 8. Analytics & Reports

### Analytics Dashboard
```tsx
// app/(dashboard)/analytics/page.tsx
export function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analytics</h1>
        <DateRangePicker />
      </div>
      
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPICard 
          title="Revenue"
          value="$24.7M"
          change={12}
          chart="revenue"
        />
        <KPICard 
          title="Profit Margin"
          value="18.4%"
          change={-2}
          chart="margin"
        />
        <KPICard 
          title="On-Time Delivery"
          value="87%"
          change={5}
          chart="delivery"
        />
        <KPICard 
          title="Safety Score"
          value="94"
          change={3}
          chart="safety"
        />
      </div>
      
      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ProjectPerformanceChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceUtilizationChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <CostAnalysisChart />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>RFI Response Times</CardTitle>
          </CardHeader>
          <CardContent>
            <RFIResponseChart />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

---

## 🌓 Dark Mode Enhancements

### Dark Mode Specific Styles
```css
/* Dark mode elevation and depth */
.dark .elevation-0 { background: #0A0A0A; }
.dark .elevation-1 { background: #121212; }
.dark .elevation-2 { background: #171717; }
.dark .elevation-3 { background: #1C1C1C; }
.dark .elevation-4 { background: #232323; }

/* Dark mode glass effect */
.dark .glass {
  background: rgba(10, 10, 10, 0.8);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Dark mode gradients */
.dark .gradient-primary {
  background: linear-gradient(135deg, 
    hsl(24 94% 55% / 0.2) 0%, 
    hsl(24 94% 55% / 0.05) 100%
  );
}

/* High contrast text for dark mode */
.dark .high-contrast {
  color: hsl(0 0% 98%);
  font-weight: 600;
}

/* Dark mode shadows */
.dark .shadow-glow {
  box-shadow: 
    0 0 20px rgba(255, 107, 53, 0.1),
    0 0 40px rgba(255, 107, 53, 0.05);
}
```

---

## 📱 Mobile Responsive Design

### Mobile Navigation
```tsx
const MobileBottomNav = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t">
      <div className="grid grid-cols-5 p-2">
        {[
          { icon: Home, label: 'Home', href: '/dashboard' },
          { icon: Building2, label: 'Projects', href: '/projects' },
          { icon: Plus, label: 'Add', primary: true, href: '/quick-add' },
          { icon: FileText, label: 'RFIs', href: '/rfis' },
          { icon: Menu, label: 'More', href: '/menu' }
        ].map(item => (
          <Link key={item.href} href={item.href}>
            <button className={cn(
              'flex flex-col items-center justify-center py-2',
              'text-xs font-medium transition-colors',
              item.primary 
                ? 'text-primary' 
                : 'text-muted-foreground hover:text-foreground'
            )}>
              <item.icon className={cn(
                'mb-1',
                item.primary ? 'h-7 w-7' : 'h-5 w-5'
              )} />
              <span>{item.label}</span>
            </button>
          </Link>
        ))}
      </div>
    </nav>
  )
}
```

---

## 🎯 Performance Optimizations

### Lazy Loading Components
```tsx
// Lazy load heavy components
const ProjectChart = dynamic(
  () => import('@/components/charts/project-chart'),
  { 
    loading: () => <Skeleton className="h-[400px]" />,
    ssr: false 
  }
)

// Virtual scrolling for large lists
const VirtualRFIList = dynamic(
  () => import('@/components/rfis/virtual-list'),
  { ssr: false }
)
```

### Skeleton Loaders
```tsx
const ProjectCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </CardHeader>
    <CardContent className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-20 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </CardContent>
  </Card>
)
```

---

This comprehensive design system covers your entire Construction OS application with:

1. **Complete feature coverage** - Dashboard, Projects, RFIs, Submittals, Change Orders, Daily Reports, Team, Analytics
2. **Construction-specific workflows** - Ball-in-court tracking, CSI codes, AIA compatibility
3. **Field-optimized design** - Large touch targets, offline indicators, high contrast
4. **Professional dark mode** - Crisp blacks, proper elevation, reduced eye strain
5. **Mobile-first approach** - Bottom navigation, swipe actions, thumb-friendly
6. **Psychological optimization** - Social proof, urgency indicators, progress tracking
7. **Performance focused** - Lazy loading, virtual scrolling, skeleton states

Each component is designed to work together as a cohesive system that helps contractors manage projects efficiently while looking professional and modern.