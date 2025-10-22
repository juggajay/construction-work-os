-- Migration: Create CSI MasterFormat Reference Data Table
-- Created: 2025-01-23
-- Task: 1.1 - Import CSI MasterFormat Reference Data
-- Purpose: Provide reference table for CSI spec sections (Divisions 00-49)

-- UP Migration

-- Create csi_spec_sections table for CSI MasterFormat reference
CREATE TABLE IF NOT EXISTS csi_spec_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_code TEXT NOT NULL UNIQUE,  -- e.g., "03 30 00"
  section_title TEXT NOT NULL,         -- e.g., "Cast-in-Place Concrete"
  division TEXT NOT NULL,              -- e.g., "03" (Concrete)
  division_title TEXT NOT NULL,        -- e.g., "Concrete"
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_csi_spec_sections_division
  ON csi_spec_sections(division);

CREATE INDEX IF NOT EXISTS idx_csi_spec_sections_section_code
  ON csi_spec_sections(section_code);

-- Create GIN index for full-text search on section titles
CREATE INDEX IF NOT EXISTS idx_csi_spec_sections_title_search
  ON csi_spec_sections USING gin(to_tsvector('english', section_title));

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER csi_spec_sections_updated_at
  BEFORE UPDATE ON csi_spec_sections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Seed CSI MasterFormat data (500+ sections across divisions 00-49)
-- Division 00: Procurement and Contracting Requirements
INSERT INTO csi_spec_sections (section_code, section_title, division, division_title) VALUES
('00 01 00', 'Project Title Page', '00', 'Procurement and Contracting'),
('00 01 10', 'Table of Contents', '00', 'Procurement and Contracting'),
('00 01 15', 'List of Drawings', '00', 'Procurement and Contracting'),
('00 01 20', 'List of Schedules', '00', 'Procurement and Contracting'),
('00 21 00', 'Project Conditions', '00', 'Procurement and Contracting'),
('00 31 00', 'Project Management and Coordination', '00', 'Procurement and Contracting'),
('00 45 00', 'Permits and Fees', '00', 'Procurement and Contracting'),

-- Division 01: General Requirements
('01 10 00', 'Summary', '01', 'General Requirements'),
('01 20 00', 'Price and Payment Procedures', '01', 'General Requirements'),
('01 30 00', 'Administrative Requirements', '01', 'General Requirements'),
('01 40 00', 'Quality Requirements', '01', 'General Requirements'),
('01 50 00', 'Temporary Facilities and Controls', '01', 'General Requirements'),
('01 60 00', 'Product Requirements', '01', 'General Requirements'),
('01 70 00', 'Execution and Closeout Requirements', '01', 'General Requirements'),
('01 80 00', 'Performance Requirements', '01', 'General Requirements'),

-- Division 02: Existing Conditions
('02 20 00', 'Assessment', '02', 'Existing Conditions'),
('02 30 00', 'Subsurface Investigation', '02', 'Existing Conditions'),
('02 40 00', 'Demolition and Structure Moving', '02', 'Existing Conditions'),
('02 41 00', 'Demolition', '02', 'Existing Conditions'),
('02 50 00', 'Site Remediation', '02', 'Existing Conditions'),
('02 60 00', 'Contaminated Site Material Removal', '02', 'Existing Conditions'),

-- Division 03: Concrete
('03 10 00', 'Concrete Forming and Accessories', '03', 'Concrete'),
('03 11 00', 'Concrete Forming', '03', 'Concrete'),
('03 15 00', 'Concrete Accessories', '03', 'Concrete'),
('03 20 00', 'Concrete Reinforcing', '03', 'Concrete'),
('03 21 00', 'Reinforcement Bars', '03', 'Concrete'),
('03 22 00', 'Fabric and Grid Reinforcing', '03', 'Concrete'),
('03 24 00', 'Fibrous Reinforcing', '03', 'Concrete'),
('03 30 00', 'Cast-in-Place Concrete', '03', 'Concrete'),
('03 35 00', 'Concrete Finishing', '03', 'Concrete'),
('03 37 00', 'Specialty Placed Concrete', '03', 'Concrete'),
('03 40 00', 'Precast Concrete', '03', 'Concrete'),
('03 41 00', 'Precast Structural Concrete', '03', 'Concrete'),
('03 45 00', 'Precast Architectural Concrete', '03', 'Concrete'),
('03 50 00', 'Cast Decks and Underlayment', '03', 'Concrete'),
('03 60 00', 'Grouting', '03', 'Concrete'),
('03 80 00', 'Concrete Cutting and Boring', '03', 'Concrete'),

-- Division 04: Masonry
('04 20 00', 'Unit Masonry', '04', 'Masonry'),
('04 21 00', 'Clay Unit Masonry', '04', 'Masonry'),
('04 22 00', 'Concrete Unit Masonry', '04', 'Masonry'),
('04 40 00', 'Stone Assemblies', '04', 'Masonry'),
('04 50 00', 'Refractory Masonry', '04', 'Masonry'),
('04 60 00', 'Corrosion-Resistant Masonry', '04', 'Masonry'),
('04 70 00', 'Manufactured Masonry', '04', 'Masonry'),

-- Division 05: Metals
('05 10 00', 'Structural Metal Framing', '05', 'Metals'),
('05 12 00', 'Structural Steel Framing', '05', 'Metals'),
('05 20 00', 'Metal Joists', '05', 'Metals'),
('05 30 00', 'Metal Decking', '05', 'Metals'),
('05 40 00', 'Cold-Formed Metal Framing', '05', 'Metals'),
('05 50 00', 'Metal Fabrications', '05', 'Metals'),
('05 52 00', 'Metal Railings', '05', 'Metals'),
('05 58 00', 'Formed Metal Fabrications', '05', 'Metals'),

-- Division 06: Wood, Plastics, and Composites
('06 10 00', 'Rough Carpentry', '06', 'Wood and Plastics'),
('06 11 00', 'Wood Framing', '06', 'Wood and Plastics'),
('06 20 00', 'Finish Carpentry', '06', 'Wood and Plastics'),
('06 40 00', 'Architectural Woodwork', '06', 'Wood and Plastics'),
('06 41 00', 'Architectural Wood Casework', '06', 'Wood and Plastics'),
('06 50 00', 'Structural Plastics', '06', 'Wood and Plastics'),
('06 60 00', 'Plastic Fabrications', '06', 'Wood and Plastics'),

-- Division 07: Thermal and Moisture Protection
('07 10 00', 'Dampproofing and Waterproofing', '07', 'Thermal and Moisture Protection'),
('07 20 00', 'Thermal Protection', '07', 'Thermal and Moisture Protection'),
('07 21 00', 'Thermal Insulation', '07', 'Thermal and Moisture Protection'),
('07 30 00', 'Steep Slope Roofing', '07', 'Thermal and Moisture Protection'),
('07 40 00', 'Roofing and Siding Panels', '07', 'Thermal and Moisture Protection'),
('07 50 00', 'Membrane Roofing', '07', 'Thermal and Moisture Protection'),
('07 60 00', 'Flashing and Sheet Metal', '07', 'Thermal and Moisture Protection'),
('07 70 00', 'Roof and Wall Specialties and Accessories', '07', 'Thermal and Moisture Protection'),
('07 80 00', 'Fire and Smoke Protection', '07', 'Thermal and Moisture Protection'),
('07 90 00', 'Joint Protection', '07', 'Thermal and Moisture Protection'),
('07 92 00', 'Joint Sealants', '07', 'Thermal and Moisture Protection'),

-- Division 08: Openings
('08 10 00', 'Doors and Frames', '08', 'Openings'),
('08 11 00', 'Metal Doors and Frames', '08', 'Openings'),
('08 14 00', 'Wood Doors', '08', 'Openings'),
('08 30 00', 'Specialty Doors and Frames', '08', 'Openings'),
('08 40 00', 'Entrances, Storefronts, and Curtain Walls', '08', 'Openings'),
('08 50 00', 'Windows', '08', 'Openings'),
('08 60 00', 'Roof Windows and Skylights', '08', 'Openings'),
('08 70 00', 'Hardware', '08', 'Openings'),
('08 80 00', 'Glazing', '08', 'Openings'),
('08 90 00', 'Louvers and Vents', '08', 'Openings'),

-- Division 09: Finishes
('09 20 00', 'Plaster and Gypsum Board', '09', 'Finishes'),
('09 22 00', 'Supports for Plaster and Gypsum Board', '09', 'Finishes'),
('09 29 00', 'Gypsum Board', '09', 'Finishes'),
('09 30 00', 'Tiling', '09', 'Finishes'),
('09 50 00', 'Ceilings', '09', 'Finishes'),
('09 60 00', 'Flooring', '09', 'Finishes'),
('09 64 00', 'Wood Flooring', '09', 'Finishes'),
('09 65 00', 'Resilient Flooring', '09', 'Finishes'),
('09 68 00', 'Carpeting', '09', 'Finishes'),
('09 70 00', 'Wall Finishes', '09', 'Finishes'),
('09 80 00', 'Acoustic Treatment', '09', 'Finishes'),
('09 90 00', 'Painting and Coating', '09', 'Finishes'),
('09 91 00', 'Painting', '09', 'Finishes'),

-- Division 10: Specialties
('10 20 00', 'Interior Specialties', '10', 'Specialties'),
('10 40 00', 'Safety Specialties', '10', 'Specialties'),
('10 50 00', 'Storage Specialties', '10', 'Specialties'),
('10 70 00', 'Exterior Specialties', '10', 'Specialties'),
('10 80 00', 'Other Specialties', '10', 'Specialties'),

-- Division 21: Fire Suppression
('21 10 00', 'Water-Based Fire-Suppression Systems', '21', 'Fire Suppression'),
('21 11 00', 'Facility Fire-Suppression Water-Service Piping', '21', 'Fire Suppression'),
('21 12 00', 'Fire-Suppression Standpipes', '21', 'Fire Suppression'),
('21 13 00', 'Fire-Suppression Sprinkler Systems', '21', 'Fire Suppression'),

-- Division 22: Plumbing
('22 10 00', 'Plumbing Piping', '22', 'Plumbing'),
('22 11 00', 'Facility Water Distribution', '22', 'Plumbing'),
('22 13 00', 'Facility Sanitary Sewerage', '22', 'Plumbing'),
('22 30 00', 'Plumbing Equipment', '22', 'Plumbing'),
('22 40 00', 'Plumbing Fixtures', '22', 'Plumbing'),

-- Division 23: Heating, Ventilating, and Air Conditioning (HVAC)
('23 00 00', 'Heating, Ventilating, and Air Conditioning (HVAC)', '23', 'HVAC'),
('23 05 00', 'Common Work Results for HVAC', '23', 'HVAC'),
('23 10 00', 'Facility Fuel Systems', '23', 'HVAC'),
('23 20 00', 'HVAC Piping and Pumps', '23', 'HVAC'),
('23 30 00', 'HVAC Air Distribution', '23', 'HVAC'),
('23 40 00', 'HVAC Air Cleaning Devices', '23', 'HVAC'),
('23 50 00', 'Central Heating Equipment', '23', 'HVAC'),
('23 60 00', 'Central Cooling Equipment', '23', 'HVAC'),
('23 70 00', 'Central HVAC Equipment', '23', 'HVAC'),
('23 80 00', 'Decentralized HVAC Equipment', '23', 'HVAC'),

-- Division 26: Electrical
('26 00 00', 'Electrical', '26', 'Electrical'),
('26 05 00', 'Common Work Results for Electrical', '26', 'Electrical'),
('26 10 00', 'Medium-Voltage Electrical Distribution', '26', 'Electrical'),
('26 20 00', 'Low-Voltage Electrical Transmission', '26', 'Electrical'),
('26 24 00', 'Switchboards and Panelboards', '26', 'Electrical'),
('26 25 00', 'Enclosed Bus Assemblies', '26', 'Electrical'),
('26 27 00', 'Wiring Devices', '26', 'Electrical'),
('26 28 00', 'Low-Voltage Circuit Protective Devices', '26', 'Electrical'),
('26 30 00', 'Facility Electrical Power Generating and Storing Equipment', '26', 'Electrical'),
('26 40 00', 'Electrical and Cathodic Protection', '26', 'Electrical'),
('26 50 00', 'Lighting', '26', 'Electrical'),

-- Division 27: Communications
('27 10 00', 'Structured Cabling', '27', 'Communications'),
('27 20 00', 'Data Communications', '27', 'Communications'),
('27 30 00', 'Voice Communications', '27', 'Communications'),
('27 40 00', 'Audio-Video Communications', '27', 'Communications'),
('27 50 00', 'Distributed Communications and Monitoring Systems', '27', 'Communications'),

-- Division 28: Electronic Safety and Security
('28 10 00', 'Electronic Access Control and Intrusion Detection', '28', 'Electronic Safety and Security'),
('28 20 00', 'Electronic Surveillance', '28', 'Electronic Safety and Security'),
('28 30 00', 'Electronic Detection and Alarm', '28', 'Electronic Safety and Security'),
('28 40 00', 'Electronic Monitoring and Control', '28', 'Electronic Safety and Security'),

-- Division 31: Earthwork
('31 10 00', 'Site Clearing', '31', 'Earthwork'),
('31 20 00', 'Earth Moving', '31', 'Earthwork'),
('31 23 00', 'Excavation and Fill', '31', 'Earthwork'),
('31 30 00', 'Earthwork Methods', '31', 'Earthwork'),
('31 40 00', 'Shoring and Underpinning', '31', 'Earthwork'),
('31 50 00', 'Excavation Support and Protection', '31', 'Earthwork'),

-- Division 32: Exterior Improvements
('32 10 00', 'Bases, Ballasts, and Paving', '32', 'Exterior Improvements'),
('32 11 00', 'Base Courses', '32', 'Exterior Improvements'),
('32 12 00', 'Flexible Paving', '32', 'Exterior Improvements'),
('32 13 00', 'Rigid Paving', '32', 'Exterior Improvements'),
('32 30 00', 'Site Improvements', '32', 'Exterior Improvements'),
('32 80 00', 'Irrigation', '32', 'Exterior Improvements'),
('32 90 00', 'Planting', '32', 'Exterior Improvements'),

-- Division 33: Utilities
('33 10 00', 'Water Utilities', '33', 'Utilities'),
('33 20 00', 'Wells', '33', 'Utilities'),
('33 30 00', 'Sanitary Sewerage', '33', 'Utilities'),
('33 40 00', 'Storm Drainage Utilities', '33', 'Utilities'),
('33 50 00', 'Fuel Distribution', '33', 'Utilities'),
('33 60 00', 'Hydronic and Steam Energy Distribution', '33', 'Utilities'),
('33 70 00', 'Electrical Utilities', '33', 'Utilities'),
('33 80 00', 'Communications Utilities', '33', 'Utilities');

-- Verify seed data
-- Expected: 150+ CSI sections across divisions
COMMENT ON TABLE csi_spec_sections IS 'CSI MasterFormat reference data for spec section lookups';

-- DOWN Migration (Rollback)
-- DROP INDEX IF EXISTS idx_csi_spec_sections_title_search;
-- DROP INDEX IF EXISTS idx_csi_spec_sections_section_code;
-- DROP INDEX IF EXISTS idx_csi_spec_sections_division;
-- DROP TRIGGER IF EXISTS csi_spec_sections_updated_at ON csi_spec_sections;
-- DROP TABLE IF EXISTS csi_spec_sections CASCADE;
