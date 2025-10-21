# Construction Work OS Design System

> **Status**: ✅ shadcn/ui v3.4.2 installed
> **Style**: new-york (professional, dashboard-optimized)
> **Base Color**: neutral (construction-appropriate)
> **Dark Mode**: ✅ Configured

---

## 🎨 Design Philosophy

### Construction-First Principles

1. **Field-First**: Mobile, offline-capable, glove-friendly
2. **High Contrast**: Outdoor visibility in direct sunlight
3. **One-Handed Use**: Workers hold tools/materials
4. **Simple & Powerful**: Mid-market contractors need power without complexity

### Work OS Principles

1. **Multiple Views**: Same data, different perspectives (table, board, timeline)
2. **Real-Time Sync**: Field ↔ Office synchronization
3. **Keyboard-First**: Power users need speed (Cmd+K palette)
4. **Role-Based**: Different interfaces for field workers, PMs, executives

---

## 🎯 Color System

### Current shadcn/ui Configuration

**Base**: Neutral (professional, not overwhelming)

```css
Light Mode:
- Primary: hsl(0 0% 9%)        /* Near black */
- Background: hsl(0 0% 100%)   /* White */
- Destructive: hsl(0 84% 60%)  /* Red */

Dark Mode:
- Primary: hsl(0 0% 98%)       /* Near white */
- Background: hsl(0 0% 4%)     /* Near black */
```

### Recommended Construction Theme Extension

Add to `app/globals.css`:

```css
@layer base {
  .theme-construction {
    /* Construction-specific status colors */
    --success: 142 76% 36%;          /* Safety Green */
    --warning: 45 93% 47%;           /* Caution Yellow */
    --danger: 0 84% 60%;             /* Safety Red */
    --info: 217 91% 60%;             /* Info Blue */

    /* Optional: Construction brand colors */
    --construction-orange: 24 94% 50%;
    --construction-yellow: 45 93% 47%;

    /* Status indicators (RAG - Red/Amber/Green) */
    --status-on-track: 142 76% 36%;  /* Green */
    --status-at-risk: 45 93% 47%;    /* Yellow/Amber */
    --status-critical: 0 84% 60%;    /* Red */
  }
}
```

### Status Color Usage

**Project Status**:
- Not Started: `text-muted-foreground` (gray)
- Planning: `text-blue-600` (info)
- Active: `text-green-600` (success)
- On Hold: `text-yellow-600` (warning)
- Completed: `text-green-700` (success dark)
- Overdue: `text-red-600` (danger)

**Budget Status**:
- Under Budget: Green
- On Budget: Blue
- Over Budget: Yellow
- Critical Over: Red

---

## 📦 Component Installation Plan

### Phase 1: Core Foundation (Week 1) ✅ Start Here

```bash
# Layout & Navigation
npx shadcn@latest add sidebar
npx shadcn@latest add navigation-menu
npx shadcn@latest add breadcrumb

# Forms (Critical for data entry)
npx shadcn@latest add form
npx shadcn@latest add input
npx shadcn@latest add button
npx shadcn@latest add select
npx shadcn@latest add textarea
npx shadcn@latest add checkbox
npx shadcn@latest add radio-group

# Data Display
npx shadcn@latest add table
npx shadcn@latest add card
npx shadcn@latest add badge

# Feedback
npx shadcn@latest add sonner
npx shadcn@latest add dialog
npx shadcn@latest add alert-dialog

# Essential Utilities
npx shadcn@latest add tooltip
npx shadcn@latest add separator
npx shadcn@latest add avatar
```

### Phase 2: Scheduling & Search (Week 2)

```bash
# Date/Time
npx shadcn@latest add calendar
npx shadcn@latest add date-picker

# Search & Commands
npx shadcn@latest add command
npx shadcn@latest add combobox

# Additional UI
npx shadcn@latest add tabs
npx shadcn@latest add popover
npx shadcn@latest add dropdown-menu
npx shadcn@latest add scroll-area
npx shadcn@latest add skeleton
```

### Phase 3: Analytics & Advanced (Week 3-4)

```bash
# Charts & Visualization
npx shadcn@latest add chart

# Advanced UI
npx shadcn@latest add sheet
npx shadcn@latest add accordion
npx shadcn@latest add progress
npx shadcn@latest add slider

# Theme
npx shadcn@latest add theme-provider
```

### Phase 4: Community Extensions (As Needed)

```bash
# File Upload (photos, documents)
npx shadcn@latest add 'https://shadcn-dropzone.vercel.app/dropzone.json'

# Task Board (if building kanban views)
bunx shadcn@latest add https://shadcn-kanban-board.com/r/kanban.json
```

---

## 🏗️ Construction-Specific Patterns

### Field-Friendly Design

**Touch Targets**:
- Minimum: 48px × 48px (standard)
- Construction: 56px × 56px (glove-friendly)
- Critical actions: 64px × 64px

```tsx
<Button size="lg" className="min-h-[56px] min-w-[56px]">
  Clock In
</Button>
```

**High Contrast**:
```tsx
// Use high-contrast variants for outdoor use
<Badge variant="default" className="font-semibold">
  Active
</Badge>

// Avoid light-on-light
<p className="text-foreground not text-muted-foreground">
  Critical info here
</p>
```

### Status Visualization (RAG System)

```tsx
const statusConfig = {
  onTrack: {
    color: 'bg-green-500',
    icon: CheckCircle,
    label: 'On Track'
  },
  atRisk: {
    color: 'bg-yellow-500',
    icon: AlertCircle,
    label: 'At Risk'
  },
  critical: {
    color: 'bg-red-500',
    icon: XCircle,
    label: 'Critical'
  },
} as const

// Always include icon + color (never color alone)
<Badge className={statusConfig.onTrack.color}>
  <statusConfig.onTrack.icon className="mr-1 h-3 w-3" />
  {statusConfig.onTrack.label}
</Badge>
```

### Document Management UI

```tsx
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Image } from 'lucide-react'

function DocumentCard({ doc }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          {doc.type === 'pdf' ? (
            <FileText className="h-10 w-10 text-muted-foreground" />
          ) : (
            <Image className="h-10 w-10 text-muted-foreground" />
          )}
          <div>
            <p className="font-medium">{doc.name}</p>
            <p className="text-sm text-muted-foreground">
              {doc.date} • {doc.size}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 🖼️ Layout Patterns

### Dashboard Layout (Desktop)

```tsx
// app/(dashboard)/layout.tsx
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'

export default function DashboardLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-y-auto">
          <div className="container py-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  )
}
```

### Mobile Navigation

```tsx
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        {/* Navigation links */}
      </SheetContent>
    </Sheet>
  )
}
```

### Responsive Grid (Projects, Tasks)

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {projects.map((project) => (
    <Card key={project.id}>
      {/* Project card content */}
    </Card>
  ))}
</div>
```

---

## 📊 Data Visualization

### Project Dashboard

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

export function ProjectOverview({ project }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* KPI Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">
            Budget Used
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatCurrency(project.budgetUsed)}
          </div>
          <Progress
            value={project.budgetPercent}
            className="mt-2"
          />
        </CardContent>
      </Card>

      {/* More KPI cards... */}
    </div>
  )
}
```

### Charts (Recharts via shadcn/ui)

```tsx
'use client'

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig

export function RevenueChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
        <CardDescription>Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart data={data}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="month" />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              dataKey="revenue"
              type="natural"
              fill="var(--color-revenue)"
              stroke="var(--color-revenue)"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
```

---

## 📝 Form Patterns

### React Hook Form + Zod + Server Actions

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { createProjectSchema } from '@/lib/schemas/project'
import { createProject } from '@/lib/actions/project'
import { toast } from 'sonner'

export function CreateProjectForm() {
  const form = useForm({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      address: '',
    },
  })

  async function onSubmit(data) {
    const result = await createProject(data)

    if (result.success) {
      toast.success('Project created successfully!')
      form.reset()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Project Name</FormLabel>
              <FormControl>
                <Input placeholder="Main Street Renovation" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="123 Main St" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit">Create Project</Button>
      </form>
    </Form>
  )
}
```

---

## 🔔 Notifications (Sonner)

```tsx
// app/layout.tsx
import { Toaster } from '@/components/ui/sonner'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}

// Usage in any component
'use client'

import { toast } from 'sonner'

export function DeleteButton({ projectId }) {
  async function handleDelete() {
    toast.promise(
      deleteProject(projectId),
      {
        loading: 'Deleting project...',
        success: 'Project deleted successfully',
        error: 'Failed to delete project',
      }
    )
  }

  return <Button onClick={handleDelete}>Delete</Button>
}
```

---

## ⌨️ Keyboard Shortcuts (Command Palette)

```tsx
'use client'

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function CommandMenu() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search projects, tasks..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Projects">
          <CommandItem
            onSelect={() => {
              router.push('/dashboard/projects')
              setOpen(false)
            }}
          >
            All Projects
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
```

---

## 🌓 Dark Mode

```tsx
// components/theme-provider.tsx
'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

// app/layout.tsx
import { ThemeProvider } from '@/components/theme-provider'

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// components/theme-toggle.tsx
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { setTheme, theme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

---

## 📚 Resources

### Official
- **shadcn/ui Docs**: https://ui.shadcn.com
- **Examples**: https://ui.shadcn.com/examples/dashboard
- **Charts**: https://ui.shadcn.com/charts
- **Themes**: https://ui.shadcn.com/themes

### Templates
- **next-shadcn-dashboard-starter**: https://github.com/Kiranism/next-shadcn-dashboard-starter
- **next-shadcn-admin-dashboard**: https://github.com/arhamkhnz/next-shadcn-admin-dashboard
- **shadcn-admin**: https://github.com/satnaing/shadcn-admin

### Community
- **awesome-shadcn-ui**: https://github.com/birobirobiro/awesome-shadcn-ui
- **shadcn-dropzone**: https://shadcn-dropzone.vercel.app
- **shadcn-kanban-board**: https://shadcn-kanban-board.com

---

## ✅ Next Steps

1. **Install Phase 1 components** (foundation)
2. **Create dashboard layout** with sidebar
3. **Build first form** (create project) with validation
4. **Add dark mode toggle**
5. **Create project cards** with status badges

See full research reports in `/docs/research/` for comprehensive details.
