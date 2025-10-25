import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, Upload } from 'lucide-react'

interface UploadInvoicePageProps {
  params: Promise<{
    orgSlug: string
    projectId: string
  }>
}

export default async function UploadInvoicePage({ params }: UploadInvoicePageProps) {
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
        <h1 className="text-3xl font-bold">Upload Invoice</h1>
        <p className="mt-2 text-neutral-600">{project.name}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invoice Upload</CardTitle>
          <CardDescription>
            Upload invoices for AI-powered data extraction and automatic cost tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-12 text-center">
            <Upload className="mx-auto h-12 w-12 text-neutral-400" />
            <p className="mt-4 text-neutral-600">
              <strong>Coming Soon:</strong> Invoice upload with AI extraction
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              This feature will use AI to automatically extract vendor name, invoice number, date,
              amount, and line items from uploaded invoices.
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              Supported formats: PDF, JPEG, PNG, HEIC (max 25MB)
            </p>
            <Button variant="outline" asChild className="mt-4">
              <Link href={`/${orgSlug}/projects/${projectId}/costs`}>
                Return to Cost Tracking
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
