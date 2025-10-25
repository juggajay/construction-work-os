import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AddCostForm } from '@/components/costs/add-cost-form'

interface AddCostPageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
  }>
}

export default async function AddCostPage({ params }: AddCostPageProps) {
  const { orgSlug, projectId } = await params

  const projectResult = await getProjectById(projectId)

  if (!projectResult) {
    redirect(`/${orgSlug}/projects`)
  }

  const project = projectResult as any

  return (
    <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8 max-w-4xl">
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4">
          <Link href={`/${orgSlug}/projects/${projectId}/costs`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Costs
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Cost</h1>
        <p className="mt-2 text-neutral-600">{project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Cost Entry</CardTitle>
          <CardDescription>
            Record a cost that was not invoiced (e.g., petty cash, reimbursements, internal labor)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AddCostForm projectId={projectId} orgSlug={orgSlug} />
        </CardContent>
      </Card>
    </div>
  )
}
