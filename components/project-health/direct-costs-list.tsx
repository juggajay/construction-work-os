/**
 * Direct Costs List - Industrial Luxury Dark Theme
 */

import { cn } from '@/lib/utils'
import { Receipt } from 'lucide-react'
import type { DirectCostWithCreator } from '@/lib/actions/project-health'

interface DirectCostsListProps {
  directCosts: DirectCostWithCreator[]
}

export function DirectCostsList({ directCosts }: DirectCostsListProps) {
  if (directCosts.length === 0) {
    return (
      <div className={cn(
        "flex flex-col items-center justify-center py-12 rounded-lg",
        "border border-dashed border-white/[0.08]"
      )}>
        <Receipt className="h-8 w-8 text-white/20 mb-3" />
        <p className="text-sm text-white/40">No direct costs added for this project yet.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-white/[0.06] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Cost Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Category</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Added By</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-white/50 uppercase tracking-wider">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06]">
            {directCosts.map((cost) => (
              <tr key={cost.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <span className="font-medium text-white">{cost.description || 'No description'}</span>
                </td>
                <td className="px-4 py-3 text-sm text-white/70">
                  {cost.cost_date
                    ? new Date(cost.cost_date).toLocaleDateString()
                    : 'N/A'}
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  ${cost.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 rounded text-[10px] font-medium uppercase border",
                    "bg-white/[0.05] text-white/60 border-white/[0.1]"
                  )}>
                    {cost.budget_category}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-white">
                      {cost.creator_name || 'Unknown'}
                    </span>
                    {cost.creator_email && (
                      <span className="text-xs text-white/40">{cost.creator_email}</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-white/50">
                  {new Date(cost.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
