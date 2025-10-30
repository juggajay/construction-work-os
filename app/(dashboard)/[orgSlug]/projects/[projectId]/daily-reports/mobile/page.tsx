/**
 * Mobile Daily Report Page
 * Mobile-optimized interface for creating daily reports
 */

import { DailyReportMobile } from '@/components/daily-reports/daily-report-mobile';

interface MobileDailyReportPageProps {
  params: {
    orgSlug: string;
    projectId: string;
  };
}

export default function MobileDailyReportPage({
  params,
}: MobileDailyReportPageProps) {
  return (
    <DailyReportMobile
      projectId={params.projectId}
      orgSlug={params.orgSlug}
    />
  );
}
