import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import type { DirectCostWithCreator } from '@/lib/actions/project-health'

interface DirectCostsListProps {
  directCosts: DirectCostWithCreator[]
}

export function DirectCostsList({ directCosts }: DirectCostsListProps) {
  const getCategoryBadge = (category: string) => {
    return <Badge variant="outline">{category}</Badge>
  }

  if (directCosts.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        <p>No direct costs added for this project yet.</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Description</TableHead>
            <TableHead>Cost Date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Added By</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {directCosts.map((cost) => (
            <TableRow key={cost.id}>
              <TableCell>
                <span className="font-medium">{cost.description || 'No description'}</span>
              </TableCell>
              <TableCell>
                {cost.cost_date
                  ? new Date(cost.cost_date).toLocaleDateString()
                  : 'N/A'}
              </TableCell>
              <TableCell className="font-semibold">
                ${cost.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell>{getCategoryBadge(cost.budget_category)}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {cost.creator_name || 'Unknown'}
                  </span>
                  {cost.creator_email && (
                    <span className="text-xs text-neutral-500">{cost.creator_email}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-neutral-600">
                {new Date(cost.created_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
