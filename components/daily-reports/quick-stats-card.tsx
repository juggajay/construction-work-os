/**
 * Quick Stats Card Component
 * Compact stat display with icon for mobile daily reports
 */

import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface QuickStatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
}

export function QuickStatsCard({ icon: Icon, label, value }: QuickStatsCardProps) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="font-bold">{value}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
