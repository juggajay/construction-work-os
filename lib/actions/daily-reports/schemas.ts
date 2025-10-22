/**
 * Zod Validation Schemas for Daily Reports
 * Central location for all input validation
 */

import { z } from 'zod';

/**
 * Weather condition enum
 */
export const WeatherConditionSchema = z.enum([
  'clear',
  'partly_cloudy',
  'overcast',
  'rain',
  'snow',
  'fog',
  'wind',
]);

/**
 * Attachment category enum
 */
export const AttachmentCategorySchema = z.enum([
  'progress',
  'safety',
  'quality',
  'site_conditions',
  'other',
]);

/**
 * Incident type enum
 */
export const IncidentTypeSchema = z.enum([
  'safety',
  'delay',
  'quality',
  'visitor',
  'inspection',
  'other',
]);

/**
 * Incident severity enum
 */
export const IncidentSeveritySchema = z.enum([
  'low',
  'medium',
  'high',
  'critical',
]);

/**
 * Create Daily Report Schema
 */
export const CreateDailyReportSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  weatherCondition: WeatherConditionSchema.optional(),
  temperatureHigh: z.number().optional(),
  temperatureLow: z.number().optional(),
  precipitation: z.number().min(0).optional(),
  windSpeed: z.number().min(0).optional(),
  humidity: z.number().min(0).max(100).optional(),
  narrative: z.string().max(10000).optional(),
  delaysChallenges: z.string().max(5000).optional(),
  safetyNotes: z.string().max(5000).optional(),
  visitorsInspections: z.string().max(5000).optional(),
});

/**
 * Update Daily Report Schema
 */
export const UpdateDailyReportSchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  weatherCondition: WeatherConditionSchema.optional(),
  temperatureHigh: z.number().optional(),
  temperatureLow: z.number().optional(),
  precipitation: z.number().min(0).optional(),
  windSpeed: z.number().min(0).optional(),
  humidity: z.number().min(0).max(100).optional(),
  narrative: z.string().max(10000).optional(),
  delaysChallenges: z.string().max(5000).optional(),
  safetyNotes: z.string().max(5000).optional(),
  visitorsInspections: z.string().max(5000).optional(),
});

/**
 * Submit Daily Report Schema
 */
export const SubmitDailyReportSchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
});

/**
 * Approve Daily Report Schema
 */
export const ApproveDailyReportSchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  comments: z.string().max(2000).optional(),
});

/**
 * Add Crew Entry Schema
 */
export const AddCrewEntrySchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  trade: z.string().min(1, 'Trade is required').max(100),
  classification: z.string().max(100).optional(),
  headcount: z.number().int().positive('Headcount must be greater than 0'),
  hoursWorked: z.number().min(0, 'Hours worked cannot be negative'),
  notes: z.string().max(500).optional(),
});

/**
 * Add Equipment Entry Schema
 */
export const AddEquipmentEntrySchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  equipmentDescription: z.string().min(1, 'Equipment description is required').max(200),
  equipmentId: z.string().max(50).optional(),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  hoursUsed: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Add Material Entry Schema
 */
export const AddMaterialEntrySchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  materialDescription: z.string().min(1, 'Material description is required').max(200),
  supplier: z.string().max(100).optional(),
  quantity: z.number().positive('Quantity must be greater than 0'),
  unit: z.string().min(1, 'Unit is required').max(50),
  deliveryTime: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  deliveryTicket: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Add Incident Schema
 */
export const AddIncidentSchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  incidentType: IncidentTypeSchema,
  severity: IncidentSeveritySchema.optional(),
  timeOccurred: z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:MM format').optional(),
  description: z.string().min(1, 'Description is required').max(2000),
  involvedParties: z.string().max(500).optional(),
  correctiveAction: z.string().max(1000).optional(),
  reportedTo: z.string().max(200).optional(),
  followUpRequired: z.boolean().optional(),
  oshaRecordable: z.boolean().optional(),
  notes: z.string().max(1000).optional(),
});

/**
 * Delete Entry Schema
 */
export const DeleteEntrySchema = z.object({
  entryId: z.string().uuid('Invalid entry ID'),
  entryType: z.enum(['crew', 'equipment', 'material', 'incident']),
  dailyReportId: z.string().uuid('Invalid report ID'),
});

/**
 * Upload Photo Schema
 */
export const UploadPhotoSchema = z.object({
  dailyReportId: z.string().uuid('Invalid report ID'),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive().max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
  contentType: z.enum(['image/jpeg', 'image/png', 'image/webp'], {
    errorMap: () => ({ message: 'Only JPEG, PNG, and WebP images are allowed' }),
  }),
  caption: z.string().max(500).optional(),
  category: AttachmentCategorySchema.optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  dateTaken: z.string().datetime().optional(),
  cameraMake: z.string().max(100).optional(),
  cameraModel: z.string().max(100).optional(),
});

/**
 * Delete Attachment Schema
 */
export const DeleteAttachmentSchema = z.object({
  attachmentId: z.string().uuid('Invalid attachment ID'),
  dailyReportId: z.string().uuid('Invalid report ID'),
});

/**
 * Copy From Previous Schema
 */
export const CopyFromPreviousSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});
