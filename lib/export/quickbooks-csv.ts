/**
 * QuickBooks CSV Export
 * Export daily reports crew/equipment data to QuickBooks-compatible CSV format
 */

interface CrewEntry {
  trade: string;
  classification?: string;
  headcount: number;
  hoursWorked: number;
  hourlyRate?: number;
}

interface EquipmentEntry {
  equipmentDescription: string;
  equipmentId?: string;
  quantity: number;
  hoursUsed?: number;
  hourlyRate?: number;
}

interface QuickBooksExportData {
  reportDate: string;
  projectName: string;
  projectCode?: string;
  crewEntries?: CrewEntry[];
  equipmentEntries?: EquipmentEntry[];
}

/**
 * Generate QuickBooks Time Tracking CSV
 * Format: Date, Employee/Resource, Service Item, Hours, Rate, Amount, Description
 */
export function generateQuickBooksTimeTrackingCSV(
  data: QuickBooksExportData
): string {
  const rows: string[][] = [];

  // CSV Header
  rows.push([
    'Date',
    'Resource Name',
    'Service Item',
    'Hours',
    'Rate',
    'Amount',
    'Description',
    'Customer/Project',
  ]);

  const formattedDate = new Date(data.reportDate).toLocaleDateString('en-US');

  // Crew Entries
  if (data.crewEntries) {
    data.crewEntries.forEach((entry) => {
      const hours = entry.hoursWorked;
      const rate = entry.hourlyRate || 0;
      const amount = hours * rate;

      rows.push([
        formattedDate,
        entry.trade,
        entry.classification || 'Labor',
        hours.toFixed(2),
        rate.toFixed(2),
        amount.toFixed(2),
        `${entry.headcount} workers - ${entry.trade}`,
        data.projectCode || data.projectName,
      ]);
    });
  }

  // Equipment Entries
  if (data.equipmentEntries) {
    data.equipmentEntries.forEach((entry) => {
      const hours = entry.hoursUsed || 0;
      const rate = entry.hourlyRate || 0;
      const amount = hours * rate;

      rows.push([
        formattedDate,
        entry.equipmentDescription,
        'Equipment Rental',
        hours.toFixed(2),
        rate.toFixed(2),
        amount.toFixed(2),
        entry.equipmentId
          ? `${entry.equipmentDescription} (${entry.equipmentId})`
          : entry.equipmentDescription,
        data.projectCode || data.projectName,
      ]);
    });
  }

  // Convert to CSV string
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Generate QuickBooks Labor Summary CSV
 * Format: Date, Trade, Classification, Total Headcount, Total Hours, Avg Hours per Worker
 */
export function generateQuickBooksLaborSummaryCSV(
  reports: QuickBooksExportData[]
): string {
  const rows: string[][] = [];

  // CSV Header
  rows.push([
    'Date',
    'Project',
    'Trade',
    'Classification',
    'Headcount',
    'Total Hours',
    'Avg Hours per Worker',
  ]);

  reports.forEach((report) => {
    const formattedDate = new Date(report.reportDate).toLocaleDateString('en-US');

    if (report.crewEntries) {
      report.crewEntries.forEach((entry) => {
        const avgHours = entry.headcount > 0 ? entry.hoursWorked / entry.headcount : 0;

        rows.push([
          formattedDate,
          report.projectName,
          entry.trade,
          entry.classification || '-',
          entry.headcount.toString(),
          entry.hoursWorked.toFixed(2),
          avgHours.toFixed(2),
        ]);
      });
    }
  });

  // Convert to CSV string
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Generate QuickBooks Equipment Summary CSV
 * Format: Date, Equipment, Equipment ID, Quantity, Hours Used
 */
export function generateQuickBooksEquipmentSummaryCSV(
  reports: QuickBooksExportData[]
): string {
  const rows: string[][] = [];

  // CSV Header
  rows.push(['Date', 'Project', 'Equipment', 'Equipment ID', 'Quantity', 'Hours Used']);

  reports.forEach((report) => {
    const formattedDate = new Date(report.reportDate).toLocaleDateString('en-US');

    if (report.equipmentEntries) {
      report.equipmentEntries.forEach((entry) => {
        rows.push([
          formattedDate,
          report.projectName,
          entry.equipmentDescription,
          entry.equipmentId || '-',
          entry.quantity.toString(),
          entry.hoursUsed?.toFixed(2) || '0.00',
        ]);
      });
    }
  });

  // Convert to CSV string
  return rows.map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
}

/**
 * Download CSV file in browser
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
