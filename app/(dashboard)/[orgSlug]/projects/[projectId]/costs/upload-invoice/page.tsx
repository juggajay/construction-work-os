/**
 * ✅ PHASE 3B OPTIMIZATION: Dynamic import for UploadInvoiceForm
 * Heavy component (763 lines + PDF.js) only loaded when needed
 * Expected: ~80-100KB bundle reduction, 40-50% faster initial page load
 */

import dynamic from 'next/dynamic'
import { getProjectById } from '@/lib/actions/project-helpers'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const UploadInvoiceForm = dynamic(
  () => import('@/components/costs/upload-invoice-form').then((mod) => ({ default: mod.UploadInvoiceForm })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading upload form...</p>
        </div>
      </div>
    ),
  }
)

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
          <CardTitle>Invoice Upload with AI Extraction</CardTitle>
          <CardDescription>
            Upload an invoice and let AI automatically extract vendor name, invoice number, date, and amount.
            Review and edit the data before submitting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UploadInvoiceForm projectId={projectId} orgSlug={orgSlug} />
        </CardContent>
      </Card>
    </div>
  )
}
