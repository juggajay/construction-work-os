'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { useBreakpoint } from '@/lib/hooks/use-mobile'
import { Card } from '@/components/ui/card'
import { ChevronRight } from 'lucide-react'

// Column priority determines visibility on smaller screens
// 1 = always visible, 2 = hidden on mobile, 3 = hidden on tablet and below
export type ColumnPriority = 1 | 2 | 3

export interface Column<T> {
  /** Unique key for the column */
  key: string
  /** Display header text */
  header: string
  /** Priority for responsive hiding (1=always, 2=hide mobile, 3=hide tablet) */
  priority?: ColumnPriority
  /** Custom cell renderer */
  cell?: (row: T) => React.ReactNode
  /** Accessor function or key path */
  accessor?: keyof T | ((row: T) => React.ReactNode)
  /** Column width (desktop only) */
  width?: string
  /** Alignment */
  align?: 'left' | 'center' | 'right'
  /** Show this column as the primary label on mobile cards */
  isPrimary?: boolean
  /** Show this column as secondary info on mobile cards */
  isSecondary?: boolean
}

export interface ResponsiveTableProps<T> {
  /** Data array to display */
  data: T[]
  /** Column definitions */
  columns: Column<T>[]
  /** Unique key accessor for each row */
  rowKey: keyof T | ((row: T) => string | number)
  /** Click handler for rows */
  onRowClick?: (row: T) => void
  /** Loading state */
  loading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Additional class names */
  className?: string
  /** Show chevron on mobile cards (indicates clickable) */
  showMobileChevron?: boolean
  /** Custom mobile card renderer (overrides default) */
  renderMobileCard?: (row: T, columns: Column<T>[]) => React.ReactNode
}

// Get cell value from column definition
function getCellValue<T>(row: T, column: Column<T>): React.ReactNode {
  if (column.cell) {
    return column.cell(row)
  }
  if (column.accessor) {
    if (typeof column.accessor === 'function') {
      return column.accessor(row)
    }
    return row[column.accessor] as React.ReactNode
  }
  return null
}

// Get row key
function getRowKey<T>(row: T, rowKey: keyof T | ((row: T) => string | number)): string | number {
  if (typeof rowKey === 'function') {
    return rowKey(row)
  }
  return row[rowKey] as string | number
}

// Filter columns based on breakpoint and priority
function getVisibleColumns<T>(columns: Column<T>[], breakpoint: 'mobile' | 'tablet' | 'desktop' | undefined): Column<T>[] {
  if (!breakpoint || breakpoint === 'desktop') {
    return columns
  }

  return columns.filter(col => {
    const priority = col.priority ?? 1
    if (breakpoint === 'mobile') {
      return priority === 1
    }
    if (breakpoint === 'tablet') {
      return priority <= 2
    }
    return true
  })
}

// Desktop table view
function DesktopTable<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  loading,
  emptyMessage,
}: ResponsiveTableProps<T>) {
  return (
    <div className="overflow-x-auto rounded-lg border dark:border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 dark:bg-[hsl(var(--depth-2))]">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 font-semibold text-muted-foreground',
                  'border-b dark:border-white/10',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  !col.align && 'text-left'
                )}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-white/10">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-construction-500 border-t-transparent" />
                  Loading...
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted-foreground">
                {emptyMessage || 'No data available'}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={getRowKey(row, rowKey)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  'transition-colors duration-fast',
                  'bg-background dark:bg-[hsl(var(--depth-1))]',
                  onRowClick && 'cursor-pointer hover:bg-muted/50 dark:hover:bg-[hsl(var(--depth-2))]'
                )}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-3',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {getCellValue(row, col)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

// Mobile card view
function MobileCards<T>({
  data,
  columns,
  rowKey,
  onRowClick,
  loading,
  emptyMessage,
  showMobileChevron = true,
  renderMobileCard,
}: ResponsiveTableProps<T>) {
  // Find primary and secondary columns for card display
  const primaryCol = columns.find(col => col.isPrimary) ?? columns[0]
  const secondaryCol = columns.find(col => col.isSecondary)
  const detailCols = primaryCol
    ? columns.filter(
        col => col !== primaryCol && col !== secondaryCol && (col.priority ?? 1) === 1
      )
    : []

  // Handle case where there are no columns
  if (!primaryCol) {
    return loading ? (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-construction-500 border-t-transparent mr-2" />
        Loading...
      </div>
    ) : (
      <div className="py-8 text-center text-muted-foreground">
        No columns defined
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-construction-500 border-t-transparent mr-2" />
        Loading...
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-muted-foreground">
        {emptyMessage || 'No data available'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {data.map(row => {
        if (renderMobileCard) {
          return (
            <div key={getRowKey(row, rowKey)} onClick={() => onRowClick?.(row)}>
              {renderMobileCard(row, columns)}
            </div>
          )
        }

        return (
          <Card
            key={getRowKey(row, rowKey)}
            depth={1}
            hoverable={!!onRowClick}
            onClick={() => onRowClick?.(row)}
            className="p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {/* Primary info */}
                <div className="font-semibold text-base truncate">
                  {getCellValue(row, primaryCol)}
                </div>

                {/* Secondary info */}
                {secondaryCol && (
                  <div className="text-sm text-muted-foreground mt-0.5 truncate">
                    {getCellValue(row, secondaryCol)}
                  </div>
                )}

                {/* Additional details */}
                {detailCols.length > 0 && (
                  <div className="mt-3 pt-3 border-t dark:border-white/10 grid grid-cols-2 gap-x-4 gap-y-2">
                    {detailCols.slice(0, 4).map(col => (
                      <div key={col.key}>
                        <div className="text-xs text-muted-foreground">{col.header}</div>
                        <div className="text-sm font-medium truncate">
                          {getCellValue(row, col)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chevron indicator */}
              {onRowClick && showMobileChevron && (
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-1" />
              )}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

// Main responsive table component
export function ResponsiveTable<T>(props: ResponsiveTableProps<T>) {
  const breakpoint = useBreakpoint()
  const visibleColumns = getVisibleColumns(props.columns, breakpoint)
  const isMobile = breakpoint === 'mobile'

  return (
    <div className={cn('w-full', props.className)}>
      {isMobile ? (
        <MobileCards {...props} columns={visibleColumns} />
      ) : (
        <DesktopTable {...props} columns={visibleColumns} />
      )}
    </div>
  )
}

// Re-export for convenience
export type { Column as ResponsiveTableColumn }
