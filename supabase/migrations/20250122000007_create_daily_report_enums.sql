-- Migration: Create Daily Report Enums
-- Created: 2025-01-22
-- Description: Define enum types for daily report status, weather conditions, incident types, severity, and attachment types

-- UP Migration

-- Daily report status enum
CREATE TYPE daily_report_status AS ENUM (
  'draft',
  'submitted',
  'approved',
  'archived'
);

-- Weather condition enum
CREATE TYPE weather_condition AS ENUM (
  'clear',
  'partly_cloudy',
  'overcast',
  'rain',
  'snow',
  'fog',
  'wind'
);

-- Incident type enum
CREATE TYPE incident_type AS ENUM (
  'safety',
  'delay',
  'quality',
  'visitor',
  'inspection',
  'other'
);

-- Incident severity enum
CREATE TYPE incident_severity AS ENUM (
  'low',
  'medium',
  'high',
  'critical'
);

-- Attachment type enum
CREATE TYPE attachment_type AS ENUM (
  'photo',
  'document',
  'other'
);

-- DOWN Migration (Rollback)
-- DROP TYPE IF EXISTS attachment_type;
-- DROP TYPE IF EXISTS incident_severity;
-- DROP TYPE IF EXISTS incident_type;
-- DROP TYPE IF EXISTS weather_condition;
-- DROP TYPE IF EXISTS daily_report_status;
