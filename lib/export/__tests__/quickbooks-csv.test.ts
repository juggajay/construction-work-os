import { describe, it, expect } from 'vitest';
import {
  generateQuickBooksTimeTrackingCSV,
  generateQuickBooksLaborSummaryCSV,
  generateQuickBooksEquipmentSummaryCSV,
} from '../quickbooks-csv';

describe('QuickBooks CSV Export', () => {
  describe('generateQuickBooksTimeTrackingCSV', () => {
    it('should generate CSV with correct headers', () => {
      const data = {
        reportDate: '2024-01-15',
        projectName: 'Test Project',
        crewEntries: [],
        equipmentEntries: [],
      };

      const csv = generateQuickBooksTimeTrackingCSV(data);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        '"Date","Resource Name","Service Item","Hours","Rate","Amount","Description","Customer/Project"'
      );
    });

    it('should export crew entries', () => {
      const data = {
        reportDate: '2024-01-15',
        projectName: 'Test Project',
        projectCode: 'TP-001',
        crewEntries: [
          {
            trade: 'Carpenter',
            classification: 'Journeyman',
            headcount: 5,
            hoursWorked: 40,
            hourlyRate: 45,
          },
          {
            trade: 'Electrician',
            classification: 'Apprentice',
            headcount: 2,
            hoursWorked: 16,
            hourlyRate: 35,
          },
        ],
      };

      const csv = generateQuickBooksTimeTrackingCSV(data);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // Header + 2 entries

      // Check carpenter entry
      expect(lines[1]).toContain('"1/15/2024"');
      expect(lines[1]).toContain('"Carpenter"');
      expect(lines[1]).toContain('"Journeyman"');
      expect(lines[1]).toContain('"40.00"');
      expect(lines[1]).toContain('"45.00"');
      expect(lines[1]).toContain('"1800.00"'); // 40 * 45

      // Check electrician entry
      expect(lines[2]).toContain('"Electrician"');
      expect(lines[2]).toContain('"16.00"');
      expect(lines[2]).toContain('"560.00"'); // 16 * 35
    });

    it('should export equipment entries', () => {
      const data = {
        reportDate: '2024-01-15',
        projectName: 'Test Project',
        equipmentEntries: [
          {
            equipmentDescription: 'Excavator',
            equipmentId: 'EXC-001',
            quantity: 1,
            hoursUsed: 8,
            hourlyRate: 150,
          },
        ],
      };

      const csv = generateQuickBooksTimeTrackingCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"Excavator"');
      expect(lines[1]).toContain('"Equipment Rental"');
      expect(lines[1]).toContain('"8.00"');
      expect(lines[1]).toContain('"150.00"');
      expect(lines[1]).toContain('"1200.00"'); // 8 * 150
      expect(lines[1]).toContain('"Excavator (EXC-001)"');
    });

    it('should handle missing hourly rates', () => {
      const data = {
        reportDate: '2024-01-15',
        projectName: 'Test Project',
        crewEntries: [
          {
            trade: 'Laborer',
            headcount: 3,
            hoursWorked: 24,
            // No hourlyRate
          },
        ],
      };

      const csv = generateQuickBooksTimeTrackingCSV(data);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"0.00"'); // Rate defaults to 0
      expect(lines[1]).toContain('"0.00"'); // Amount is 0
    });
  });

  describe('generateQuickBooksLaborSummaryCSV', () => {
    it('should generate labor summary with correct headers', () => {
      const reports = [
        {
          reportDate: '2024-01-15',
          projectName: 'Test Project',
          crewEntries: [
            {
              trade: 'Carpenter',
              classification: 'Journeyman',
              headcount: 5,
              hoursWorked: 40,
            },
          ],
        },
      ];

      const csv = generateQuickBooksLaborSummaryCSV(reports);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        '"Date","Project","Trade","Classification","Headcount","Total Hours","Avg Hours per Worker"'
      );
    });

    it('should calculate average hours per worker', () => {
      const reports = [
        {
          reportDate: '2024-01-15',
          projectName: 'Test Project',
          crewEntries: [
            {
              trade: 'Carpenter',
              classification: 'Journeyman',
              headcount: 5,
              hoursWorked: 40,
            },
          ],
        },
      ];

      const csv = generateQuickBooksLaborSummaryCSV(reports);
      const lines = csv.split('\n');

      expect(lines[1]).toContain('"5"'); // Headcount
      expect(lines[1]).toContain('"40.00"'); // Total hours
      expect(lines[1]).toContain('"8.00"'); // Avg hours per worker (40/5)
    });

    it('should handle multiple reports', () => {
      const reports = [
        {
          reportDate: '2024-01-15',
          projectName: 'Project A',
          crewEntries: [{ trade: 'Carpenter', headcount: 5, hoursWorked: 40 }],
        },
        {
          reportDate: '2024-01-16',
          projectName: 'Project A',
          crewEntries: [{ trade: 'Electrician', headcount: 3, hoursWorked: 24 }],
        },
      ];

      const csv = generateQuickBooksLaborSummaryCSV(reports);
      const lines = csv.split('\n');

      expect(lines).toHaveLength(3); // Header + 2 entries
    });
  });

  describe('generateQuickBooksEquipmentSummaryCSV', () => {
    it('should generate equipment summary', () => {
      const reports = [
        {
          reportDate: '2024-01-15',
          projectName: 'Test Project',
          equipmentEntries: [
            {
              equipmentDescription: 'Excavator',
              equipmentId: 'EXC-001',
              quantity: 1,
              hoursUsed: 8,
            },
            {
              equipmentDescription: 'Crane',
              quantity: 1,
              hoursUsed: 6,
            },
          ],
        },
      ];

      const csv = generateQuickBooksEquipmentSummaryCSV(reports);
      const lines = csv.split('\n');

      expect(lines[0]).toBe(
        '"Date","Project","Equipment","Equipment ID","Quantity","Hours Used"'
      );
      expect(lines).toHaveLength(3); // Header + 2 entries

      expect(lines[1]).toContain('"Excavator"');
      expect(lines[1]).toContain('"EXC-001"');
      expect(lines[1]).toContain('"1"');
      expect(lines[1]).toContain('"8.00"');

      expect(lines[2]).toContain('"Crane"');
      expect(lines[2]).toContain('"-"'); // No equipment ID
      expect(lines[2]).toContain('"6.00"');
    });
  });
});
