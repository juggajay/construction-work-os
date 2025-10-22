/**
 * PDF Generator for Daily Reports
 * Generate professional PDF documents from daily reports
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDistanceToNow } from 'date-fns';

interface DailyReportPDFData {
  // Report basic info
  reportDate: string;
  projectName: string;
  status: string;

  // Weather
  weatherCondition?: string;
  temperatureHigh?: number;
  temperatureLow?: number;
  precipitation?: number;
  windSpeed?: number;
  humidity?: number;

  // Narrative
  narrative?: string;
  delaysChallenges?: string;
  safetyNotes?: string;
  visitorsInspections?: string;

  // Entries
  crewEntries?: Array<{
    trade: string;
    classification?: string;
    headcount: number;
    hoursWorked: number;
  }>;
  equipmentEntries?: Array<{
    equipmentDescription: string;
    equipmentId?: string;
    quantity: number;
    hoursUsed?: number;
  }>;
  materialEntries?: Array<{
    materialDescription: string;
    supplier?: string;
    quantity: number;
    unit: string;
  }>;
  incidents?: Array<{
    incidentType: string;
    severity?: string;
    description: string;
    correctiveAction?: string;
  }>;

  // Metadata
  totalCrewCount?: number;
  createdBy?: string;
  submittedBy?: string;
  approvedBy?: string;
}

export async function generateDailyReportPDF(
  data: DailyReportPDFData
): Promise<Blob> {
  const doc = new jsPDF();

  let yPosition = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Daily Construction Report', margin, yPosition);

  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(
    new Date(data.reportDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    margin,
    yPosition
  );

  yPosition += 6;
  doc.setFontSize(10);
  doc.text(data.projectName, margin, yPosition);

  // Status badge
  yPosition += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Status: ${data.status.toUpperCase()}`, margin, yPosition);

  yPosition += 10;

  // Weather Section
  if (data.weatherCondition) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Weather Conditions', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const weatherLines: string[] = [];
    weatherLines.push(`Condition: ${data.weatherCondition.replace('_', ' ')}`);
    if (data.temperatureHigh !== undefined && data.temperatureLow !== undefined) {
      weatherLines.push(
        `Temperature: ${data.temperatureHigh}°F / ${data.temperatureLow}°F`
      );
    }
    if (data.precipitation !== undefined) {
      weatherLines.push(`Precipitation: ${data.precipitation}"`);
    }
    if (data.windSpeed !== undefined) {
      weatherLines.push(`Wind Speed: ${data.windSpeed} mph`);
    }
    if (data.humidity !== undefined) {
      weatherLines.push(`Humidity: ${data.humidity}%`);
    }

    weatherLines.forEach((line) => {
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    yPosition += 5;
  }

  // Narrative Section
  if (data.narrative) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Work Performed', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const narrativeLines = doc.splitTextToSize(
      data.narrative,
      pageWidth - margin * 2
    );
    narrativeLines.forEach((line: string) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 5;
  }

  // Crew Entries Table
  if (data.crewEntries && data.crewEntries.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Crew (Total: ${data.totalCrewCount || 0})`, margin, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Trade', 'Classification', 'Headcount', 'Hours']],
      body: data.crewEntries.map((entry) => [
        entry.trade,
        entry.classification || '-',
        entry.headcount.toString(),
        entry.hoursWorked.toString(),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Equipment Entries Table
  if (data.equipmentEntries && data.equipmentEntries.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Equipment', margin, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Description', 'Equipment ID', 'Quantity', 'Hours']],
      body: data.equipmentEntries.map((entry) => [
        entry.equipmentDescription,
        entry.equipmentId || '-',
        entry.quantity.toString(),
        entry.hoursUsed?.toString() || '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Material Deliveries Table
  if (data.materialEntries && data.materialEntries.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Material Deliveries', margin, yPosition);
    yPosition += 5;

    autoTable(doc, {
      startY: yPosition,
      head: [['Material', 'Supplier', 'Quantity', 'Unit']],
      body: data.materialEntries.map((entry) => [
        entry.materialDescription,
        entry.supplier || '-',
        entry.quantity.toString(),
        entry.unit,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: margin, right: margin },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 10;
  }

  // Incidents Section
  if (data.incidents && data.incidents.length > 0) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Incidents & Notes', margin, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    data.incidents.forEach((incident, index) => {
      if (yPosition > 260) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.text(
        `${index + 1}. ${incident.incidentType.replace('_', ' ').toUpperCase()}${
          incident.severity ? ` (${incident.severity})` : ''
        }`,
        margin,
        yPosition
      );
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      const descLines = doc.splitTextToSize(
        incident.description,
        pageWidth - margin * 2
      );
      descLines.forEach((line: string) => {
        doc.text(line, margin + 3, yPosition);
        yPosition += 5;
      });

      if (incident.correctiveAction) {
        doc.setFont('helvetica', 'italic');
        doc.text('Action: ', margin + 3, yPosition);
        doc.setFont('helvetica', 'normal');
        const actionLines = doc.splitTextToSize(
          incident.correctiveAction,
          pageWidth - margin * 2 - 20
        );
        actionLines.forEach((line: string, i: number) => {
          doc.text(line, margin + (i === 0 ? 18 : 3), yPosition);
          if (i < actionLines.length - 1) yPosition += 5;
        });
        yPosition += 5;
      }

      yPosition += 3;
    });
  }

  // Other Sections
  if (data.delaysChallenges || data.safetyNotes || data.visitorsInspections) {
    if (yPosition > 240) {
      doc.addPage();
      yPosition = 20;
    }

    if (data.delaysChallenges) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Delays & Challenges', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(
        data.delaysChallenges,
        pageWidth - margin * 2
      );
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (data.safetyNotes) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Safety Notes', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(data.safetyNotes, pageWidth - margin * 2);
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 5;
    }

    if (data.visitorsInspections) {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Visitors & Inspections', margin, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(
        data.visitorsInspections,
        pageWidth - margin * 2
      );
      lines.forEach((line: string) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(line, margin, yPosition);
        yPosition += 5;
      });
    }
  }

  // Footer with metadata
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);

    const footerText = `Generated ${new Date().toLocaleDateString()}`;
    doc.text(footerText, margin, doc.internal.pageSize.getHeight() - 10);

    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin - 20,
      doc.internal.pageSize.getHeight() - 10
    );
  }

  // Return as Blob
  return doc.output('blob');
}
