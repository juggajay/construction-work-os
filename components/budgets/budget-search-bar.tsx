'use client'

/**
 * Budget Search Bar Component
 * Full-text search for budget line items with filters
 * OpenSpec Change: enhance-budget-allocations-with-quotes-and-ai
 */

import { useState, useEffect, useCallback, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { searchLineItems, type SearchLineItemResult } from '@/lib/actions/budgets'
import { Search, Loader2, FileText, X, Filter } from 'lucide-react'
import type { Database } from '@/lib/types/supabase'

type BudgetCategory = Database['public']['Enums']['project_budget_category']

interface BudgetSearchBarProps {
  projectId: string
}

const BUDGET_CATEGORIES: BudgetCategory[] = [
  'materials',
  'labor',
  'equipment',
  'other',
]

export function BudgetSearchBar({ projectId }: BudgetSearchBarProps) {
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<BudgetCategory | null>(null)
  const [minAmount, setMinAmount] = useState('')
  const [maxAmount, setMaxAmount] = useState('')
  const [results, setResults] = useState<SearchLineItemResult[]>([])
  const [searchCount, setSearchCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Search function with dependencies
  const performSearch = useCallback(() => {
    if (!query.trim()) return

    setError(null)
    setHasSearched(true)

    startTransition(async () => {
      const result = await searchLineItems({
        projectId,
        query: query.trim(),
        category: category || null,
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxAmount: maxAmount ? parseFloat(maxAmount) : null,
      })

      if (result.success && result.data) {
        setResults(result.data.results)
        setSearchCount(result.data.count)
      } else {
        setError('error' in result ? result.error : 'Failed to search line items')
        setResults([])
        setSearchCount(0)
      }
    })
  }, [projectId, query, category, minAmount, maxAmount, startTransition])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearchCount(0)
      setHasSearched(false)
      return
    }

    const timer = setTimeout(() => {
      performSearch()
    }, 500)

    return () => clearTimeout(timer)
  }, [query, category, minAmount, maxAmount, performSearch])

  const clearSearch = () => {
    setQuery('')
    setCategory(null)
    setMinAmount('')
    setMaxAmount('')
    setResults([])
    setSearchCount(0)
    setError(null)
    setHasSearched(false)
  }

  const clearFilters = () => {
    setCategory(null)
    setMinAmount('')
    setMaxAmount('')
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search line items (descriptions, materials, vendors)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowFilters(!showFilters)}
          className={showFilters ? 'bg-accent' : ''}
        >
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      {showFilters && (
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Filters</Label>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category-filter" className="text-xs">
                Category
              </Label>
              <Select
                value={category || undefined}
                onValueChange={(value) => setCategory(value as BudgetCategory)}
              >
                <SelectTrigger id="category-filter">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {BUDGET_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min-amount" className="text-xs">
                Min Amount
              </Label>
              <Input
                id="min-amount"
                type="number"
                step="0.01"
                placeholder="$0.00"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-amount" className="text-xs">
                Max Amount
              </Label>
              <Input
                id="max-amount"
                type="number"
                step="0.01"
                placeholder="$999,999.99"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
        </div>
      )}

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {hasSearched && !isPending && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm text-muted-foreground">
              {searchCount === 0
                ? 'No results found'
                : `Found ${searchCount} result${searchCount === 1 ? '' : 's'}`}
            </p>
            {searchCount > 0 && (
              <p className="text-xs text-muted-foreground">
                Sorted by relevance
              </p>
            )}
          </div>

          {results.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="w-32">Category</TableHead>
                    <TableHead className="w-24">Quantity</TableHead>
                    <TableHead className="w-20">Unit</TableHead>
                    <TableHead className="w-28">Unit Price</TableHead>
                    <TableHead className="w-28">Total</TableHead>
                    <TableHead className="w-32">Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item, index) => (
                    <TableRow key={item.line_item_id}>
                      <TableCell>
                        <div className="flex items-start gap-2">
                          <span
                            className="text-xs font-mono text-muted-foreground mt-0.5"
                            title="Relevance rank"
                          >
                            #{index + 1}
                          </span>
                          <span className="text-sm">{item.description}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs px-2 py-1 rounded bg-muted">
                          {item.budget_category}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.quantity?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.unit_of_measure || '-'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.unit_price ? `$${item.unit_price.toFixed(2)}` : '-'}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${item.line_total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.quote_file_path ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span className="truncate max-w-[100px]">
                              {item.quote_file_path.split('/').pop()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
