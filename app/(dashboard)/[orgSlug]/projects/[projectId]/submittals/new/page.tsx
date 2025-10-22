/**
 * Create New Submittal Page
 * Form for creating a new submittal
 */

import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import { SubmittalForm } from '@/components/submittals/submittal-form';

interface PageProps {
  params: Promise<{
    orgSlug: string;
    projectId: string;
  }>;
}

export default async function NewSubmittalPage({ params }: PageProps) {
  const { orgSlug, projectId } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get project details
  const { data: project, error: projectError } = (await supabase
    .from('projects')
    .select('id, name, org_id')
    .eq('id', projectId)
    .single()) as any;

  if (projectError || !project) {
    notFound();
  }

  // Type assertion for project data
  const projectData = project as any;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Submittal</h1>
        <p className="text-muted-foreground">{projectData.name}</p>
      </div>

      <SubmittalForm projectId={projectData.id} orgSlug={orgSlug} />
    </div>
  );
}
