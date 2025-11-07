/**
 * Batch Permission Check API Route
 * Get all permissions for a user on a project
 * GET /api/permissions?projectId=abc-123
 */

import { NextRequest, NextResponse } from 'next/server'
import { getUserPermissions } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const projectId = searchParams.get('projectId')

    // Validate parameters
    if (!projectId) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: projectId',
        },
        { status: 400 }
      )
    }

    // Get current user
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all permissions for this user on this project
    const permissions = await getUserPermissions(projectId, user.id)

    return NextResponse.json({
      permissions: Array.from(permissions),
      projectId,
      userId: user.id,
    })
  } catch (error) {
    console.error('Batch permission check API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
