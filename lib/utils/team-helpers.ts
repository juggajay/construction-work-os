/**
 * Team Management Helper Utilities
 * Shared functions for team member display and certification management
 */

/**
 * Generate initials from a user's name or email
 */
export function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ').filter((p) => p.length > 0)
    if (parts.length > 1 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

/**
 * Get Tailwind CSS classes for role badge based on role type
 */
export function getRoleBadgeColor(role: string): string {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('owner') || roleLower.includes('manager')) {
    return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
  }
  if (roleLower.includes('admin') || roleLower.includes('supervisor')) {
    return 'bg-blue-500/10 text-blue-600 border-blue-500/20'
  }
  return 'bg-neutral-500/10 text-neutral-600 border-neutral-500/20'
}

/**
 * Check if a certification is expiring within 30 days
 */
export function isCertificationExpiringSoon(expiryDate?: string): boolean {
  if (!expiryDate) return false
  const expiry = new Date(expiryDate)
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  return expiry <= thirtyDaysFromNow && expiry > now
}

/**
 * Check if a certification has expired
 */
export function isCertificationExpired(expiryDate?: string): boolean {
  if (!expiryDate) return false
  return new Date(expiryDate) < new Date()
}
