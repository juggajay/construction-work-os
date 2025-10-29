'use client'

/**
 * Line Item Search Component
 * Search through uploaded quote line items
 */

import { useState, useTransition, useEffect } from 'react'
import { searchLineItems } from '@/lib/actions/budgets'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Loader2 } from 'lucide-react'
import { useDebounce } from '@/hooks/use-debounce'

interface LineItemSearchProps {
  projectId: string
}

interface LineItemResult {
  line_item_id: string
  budget_category: string
  description: string
  quantity: number
  unit_of_measure: string | null
  unit_price: number
  line_total: number
  quote_file_path: string | null
  relevance_rank: number
}

export function LineItemSearch({ projectId }: LineItemSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<LineItemResult[]>([])
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const debouncedQuery = useDebounce(searchQuery, 500)

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      startTransition(async () => {
        setError(null)
        const result = await searchLineItems({
          projectId,
          query: debouncedQuery,
        })

        if (result.success && result.data) {
          setResults(result.data.results as LineItemResult[])
        } else {
          setError(!result.success ? result.error : 'Failed to search line items')
          setResults([])
        }
      })
    } else {
      setResults([])
    }
  }, [debouncedQuery, projectId])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Quote Line Items</CardTitle>
        <CardDescription>
          Search through uploaded project quote to find specific line items and their allocated amounts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="line-item-search">Search</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="line-item-search"
              type="text"
              placeholder="Search for materials, labor, equipment..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isPending && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 && (
            <p className="text-xs text-muted-foreground">Type at least 2 characters to search</p>
          )}
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Found {results.length} {results.length === 1 ? 'item' : 'items'}
            </p>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Description</th>
                    <th className="text-left px-4 py-2 font-medium">Category</th>
                    <th className="text-right px-4 py-2 font-medium">Qty</th>
                    <th className="text-right px-4 py-2 font-medium">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((item) => (
                    <tr key={item.line_item_id} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3">{item.description}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 capitalize">
                          {item.budget_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {item.quantity ? `${item.quantity}${item.unit_of_measure ? ` ${item.unit_of_measure}` : ''}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        ${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${Number(item.line_total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {searchQuery.trim().length >= 2 && results.length === 0 && !isPending && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No line items found matching &quot;{searchQuery}&quot;</p>
            <p className="text-xs mt-1">Try a different search term or upload a project quote first</p>
          </div>
        )}

        {searchQuery.trim().length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Search className="mx-auto h-12 w-12 mb-3 opacity-20" />
            <p>Start typing to search through quote line items</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
