/**
 * Utility functions
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ============================================================================
// CLASS NAME UTILITIES
// ============================================================================

/**
 * Merges Tailwind CSS classes with proper precedence
 * Used extensively with shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================================================
// STRING UTILITIES
// ============================================================================

/**
 * Generates a URL-friendly slug from a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\-]+/g, '') // Remove non-word chars
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start
    .replace(/-+$/, '') // Trim - from end
}

/**
 * Truncates text to a specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text
  return text.slice(0, length) + '...'
}

/**
 * Capitalizes the first letter of a string
 */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/**
 * Formats a name for display (e.g., "john doe" -> "John Doe")
 */
export function formatName(name: string): string {
  return name
    .split(' ')
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ')
}

// ============================================================================
// DATE UTILITIES
// ============================================================================

/**
 * Formats a date string to a readable format
 */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', options)
}

/**
 * Formats a date to YYYY-MM-DD (for input[type="date"])
 */
export function formatDateForInput(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toISOString().split('T')[0] ?? ''
}

/**
 * Gets relative time string (e.g., "2 days ago")
 */
export function getRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`
  return `${Math.floor(diffInSeconds / 31536000)} years ago`
}

// ============================================================================
// NUMBER UTILITIES
// ============================================================================

/**
 * Formats a number as currency
 */
export function formatCurrency(amount: number | string, currency: string = 'USD'): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(numAmount)
}

/**
 * Formats a number with commas (e.g., 1000 -> "1,000")
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Parses a decimal string to a number (handles null/undefined)
 */
export function parseDecimal(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = parseFloat(value)
  return isNaN(parsed) ? null : parsed
}

// ============================================================================
// ARRAY UTILITIES
// ============================================================================

/**
 * Groups an array of objects by a key
 */
export function groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
  return array.reduce(
    (result, item) => {
      const groupKey = String(item[key])
      if (!result[groupKey]) {
        result[groupKey] = []
      }
      result[groupKey]?.push(item)
      return result
    },
    {} as Record<string, T[]>
  )
}

/**
 * Returns unique values from an array
 */
export function unique<T>(array: T[]): T[] {
  return Array.from(new Set(array))
}

// ============================================================================
// OBJECT UTILITIES
// ============================================================================

/**
 * Removes undefined and null values from an object
 */
export function removeEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined && value !== null)
  ) as Partial<T>
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Checks if a string is a valid UUID
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Checks if a string is a valid email
 */
export function isValidEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(str)
}

// ============================================================================
// ASYNC UTILITIES
// ============================================================================

/**
 * Delays execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Retries an async function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    retries?: number
    delay?: number
    backoff?: number
  } = {}
): Promise<T> {
  const { retries = 3, delay: initialDelay = 1000, backoff = 2 } = options
  let lastError: Error | undefined

  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (i < retries - 1) {
        await delay(initialDelay * Math.pow(backoff, i))
      }
    }
  }

  throw lastError
}

// Re-export error utilities
export * from './errors'

// Re-export server action utilities (explicit exports for webpack)
export { withAction, success, error as actionError, formDataToObject, parseFormData, revalidateOrganization, revalidateProject, revalidateProfile } from './server-actions'
