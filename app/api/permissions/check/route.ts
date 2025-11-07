/**
 * Permission Check API Route
 * Single permission check endpoint
 * GET /api/permissions/check?permission=edit_budget&projectId=abc-123
 */

import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, type Permission } from '@/lib/permissions'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const permission = searchParams.get('permission') as Permission | null
    const projectId = searchParams.get('projectId')
    const resourceId = searchParams.get('resourceId') // Optional, for ownership checks

    // Validate parameters
    if (!permission || !projectId) {
      return NextResponse.json(
        {
          error: 'Missing required parameters',
          required: ['permission', 'projectId'],
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

    // Check permission
    const allowed = await hasPermission({
      permission,
      projectId,
      userId: user.id,
      resourceId: resourceId || undefined,
    })

    return NextResponse.json({
      allowed,
      permission,
      projectId,
      userId: user.id,
    })
  } catch (error) {
    console.error('Permission check API error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
