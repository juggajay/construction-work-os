/**
 * Caching Configuration
 * Centralized configuration for caching strategies across the application
 */

// ============================================================================
// TanStack Query Cache Times
// ============================================================================

/**
 * Default cache times for different data types
 * Adjust based on how often data changes and acceptable staleness
 */
export const CACHE_TIMES = {
  // Static/rarely changing data
  ORGANIZATIONS: 1000 * 60 * 60, // 1 hour
  PROJECT_DETAILS: 1000 * 60 * 30, // 30 minutes
  USER_PROFILE: 1000 * 60 * 30, // 30 minutes
  TEAM_MEMBERS: 1000 * 60 * 15, // 15 minutes

  // Dynamic data with moderate update frequency
  PROJECT_LIST: 1000 * 60 * 5, // 5 minutes
  PROJECT_METRICS: 1000 * 60 * 5, // 5 minutes
  RFIS: 1000 * 60 * 3, // 3 minutes
  CHANGE_ORDERS: 1000 * 60 * 3, // 3 minutes
  SUBMITTALS: 1000 * 60 * 3, // 3 minutes

  // Frequently changing data
  DAILY_REPORTS: 1000 * 60 * 2, // 2 minutes
  NOTIFICATIONS: 1000 * 60 * 1, // 1 minute
  ACTIVITY_FEED: 1000 * 30, // 30 seconds

  // Real-time data (minimal caching)
  CHAT_MESSAGES: 0, // No caching
  LIVE_UPDATES: 0, // No caching
} as const

/**
 * Cache invalidation patterns
 * Define which queries should be invalidated when certain mutations occur
 */
export const CACHE_INVALIDATION = {
  // Project mutations invalidate related queries
  PROJECT_CREATED: ['projects', 'project-list', 'organization-projects'],
  PROJECT_UPDATED: ['project', 'project-metrics'],
  PROJECT_DELETED: ['projects', 'project-list'],

  // RFI mutations
  RFI_CREATED: ['rfis', 'project-rfis', 'rfi-count'],
  RFI_UPDATED: ['rfi', 'rfis', 'rfi-count'],
  RFI_DELETED: ['rfis', 'rfi-count'],

  // Change order mutations
  CHANGE_ORDER_CREATED: ['change-orders', 'project-change-orders', 'project-metrics'],
  CHANGE_ORDER_UPDATED: ['change-order', 'change-orders', 'project-metrics'],
  CHANGE_ORDER_APPROVED: ['change-order', 'change-orders', 'project-metrics', 'project-budget'],

  // Daily report mutations
  DAILY_REPORT_CREATED: ['daily-reports', 'project-daily-reports'],
  DAILY_REPORT_UPDATED: ['daily-report', 'daily-reports'],

  // Cost/budget mutations
  COST_ADDED: ['project-costs', 'project-metrics', 'project-budget'],
  INVOICE_UPLOADED: ['project-invoices', 'project-metrics'],

  // Team mutations
  TEAM_MEMBER_ADDED: ['team-members', 'project-team', 'project-metrics'],
  TEAM_MEMBER_REMOVED: ['team-members', 'project-team', 'project-metrics'],
} as const

// ============================================================================
// Server Component Cache Revalidation
// ============================================================================

/**
 * Revalidation times for Server Components (in seconds)
 * false = cache forever, 0 = no caching, number = revalidate after X seconds
 */
export const REVALIDATE_TIMES = {
  // Static pages
  LANDING_PAGE: false, // Never revalidate (static)
  ABOUT_PAGE: 86400, // 24 hours

  // Dashboard pages
  DASHBOARD: 300, // 5 minutes
  PROJECT_LIST: 180, // 3 minutes
  PROJECT_DETAIL: 300, // 5 minutes

  // Document pages (mostly static)
  RFI_DETAIL: 180, // 3 minutes
  CHANGE_ORDER_DETAIL: 300, // 5 minutes
  SUBMITTAL_DETAIL: 300, // 5 minutes

  // Reports (dynamic)
  DAILY_REPORT: 120, // 2 minutes
  ANALYTICS: 600, // 10 minutes

  // User-specific (no caching)
  PROFILE: 0, // Don't cache
  SETTINGS: 0, // Don't cache
} as const

// ============================================================================
// CDN Cache Headers
// ============================================================================

/**
 * Cache control headers for different asset types
 */
export const CACHE_HEADERS = {
  // Immutable assets (versioned filenames)
  STATIC_ASSETS: {
    'Cache-Control': 'public, max-age=31536000, immutable',
  },

  // Images (optimized by Next.js)
  IMAGES: {
    'Cache-Control': 'public, max-age=86400, s-maxage=2592000', // 1 day browser, 30 days CDN
  },

  // API responses (short cache for dynamic data)
  API_DYNAMIC: {
    'Cache-Control': 'private, max-age=60', // 1 minute
  },

  // API responses (no cache for real-time data)
  API_REALTIME: {
    'Cache-Control': 'private, no-cache, no-store, must-revalidate',
  },
} as const

// ============================================================================
// Query Keys
// ============================================================================

/**
 * Standardized query keys for TanStack Query
 * Use these to ensure consistent cache keys across the application
 */
export const QUERY_KEYS = {
  // Organizations
  organizations: () => ['organizations'] as const,
  organization: (id: string) => ['organization', id] as const,
  organizationProjects: (orgId: string) => ['organization-projects', orgId] as const,

  // Projects
  projects: () => ['projects'] as const,
  project: (id: string) => ['project', id] as const,
  projectMetrics: (id: string) => ['project-metrics', id] as const,
  projectTeam: (id: string) => ['project-team', id] as const,

  // RFIs
  rfis: () => ['rfis'] as const,
  rfi: (id: string) => ['rfi', id] as const,
  projectRfis: (projectId: string) => ['project-rfis', projectId] as const,
  rfiCount: (projectId: string) => ['rfi-count', projectId] as const,

  // Change Orders
  changeOrders: () => ['change-orders'] as const,
  changeOrder: (id: string) => ['change-order', id] as const,
  projectChangeOrders: (projectId: string) => ['project-change-orders', projectId] as const,

  // Daily Reports
  dailyReports: () => ['daily-reports'] as const,
  dailyReport: (id: string) => ['daily-report', id] as const,
  projectDailyReports: (projectId: string) => ['project-daily-reports', projectId] as const,

  // Submittals
  submittals: () => ['submittals'] as const,
  submittal: (id: string) => ['submittal', id] as const,
  projectSubmittals: (projectId: string) => ['project-submittals', projectId] as const,

  // Costs & Budget
  projectCosts: (projectId: string) => ['project-costs', projectId] as const,
  projectBudget: (projectId: string) => ['project-budget', projectId] as const,
  projectInvoices: (projectId: string) => ['project-invoices', projectId] as const,

  // Team
  teamMembers: (orgId: string) => ['team-members', orgId] as const,

  // User
  userProfile: () => ['user-profile'] as const,
  userOrganizations: () => ['user-organizations'] as const,
} as const

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get cache time for a specific data type
 */
export function getCacheTime(type: keyof typeof CACHE_TIMES): number {
  return CACHE_TIMES[type]
}

/**
 * Get queries to invalidate for a mutation
 */
export function getInvalidationKeys(mutation: keyof typeof CACHE_INVALIDATION): readonly string[] {
  return CACHE_INVALIDATION[mutation]
}

/**
 * Check if data is stale based on last fetch time
 */
export function isStale(lastFetchTime: number, staleTime: number): boolean {
  return Date.now() - lastFetchTime > staleTime
}

/**
 * Format cache control header
 */
export function formatCacheControl(
  visibility: 'public' | 'private',
  maxAge: number,
  sMaxAge?: number
): string {
  const parts = [visibility, `max-age=${maxAge}`]
  if (sMaxAge) parts.push(`s-maxage=${sMaxAge}`)
  return parts.join(', ')
}
