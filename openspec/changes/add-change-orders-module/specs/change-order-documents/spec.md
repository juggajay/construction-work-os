# Capability: Change Order Documents

## ADDED Requirements

### Requirement: CO-DOC-001 - AIA G701 PDF Generation
Users MUST be able to generate AIA G701 Change Order forms in PDF format.

#### Scenario: Generate AIA G701 for approved change order
- **Given** an approved change order with complete information
- **When** a user clicks "Generate AIA G701"
- **Then** a PDF is generated with AIA standard formatting
- **And** the PDF includes: CO number, project info, description, cost breakdown, signatures
- **And** the PDF is automatically saved to change_order_attachments

### Requirement: CO-DOC-002 - Cost Breakdown Export
Users MUST be able to export detailed cost breakdowns with line items.

#### Scenario: Export cost breakdown PDF
- **Given** a change order with 10 line items
- **When** a user clicks "Export Cost Breakdown"
- **Then** a PDF is generated showing:
  - Line-by-line description, quantity, unit, unit cost, extended cost
  - CSI sections
  - Tax calculations
  - Total cost

### Requirement: CO-DOC-003 - Approval Records Export
Users MUST be able to export approval history for audit compliance.

#### Scenario: Export approval records
- **Given** a change order with complete approval history
- **When** a user clicks "Export Approval Records"
- **Then** a PDF is generated showing:
  - All approval stages with approver names and timestamps
  - Approval notes and rejection reasons
  - Version history with reasons

### Requirement: CO-DOC-004 - Attachment Management
Users MUST be able to upload and manage supporting documents (quotes, drawings, photos).

#### Scenario: Upload quote attachment
- **Given** a change order in "potential" status
- **When** a user uploads a PDF quote from a subcontractor
- **Then** the file is stored in Supabase Storage
- **And** an attachment record is created with category "quote"
- **And** the file appears in the attachments list

#### Scenario: Categorize attachments
- **Given** multiple attachments on a change order
- **When** a user views the attachments list
- **Then** attachments are grouped by category: Quotes, Drawings, Photos, Contracts, Other

### Requirement: CO-DOC-005 - Document Versioning
System MUST preserve documents across change order versions.

#### Scenario: Preserve attachments across versions
- **Given** a change order at version 1 with 3 attachments
- **When** the user creates version 2
- **Then** all 3 attachments remain associated
- **And** new attachments can be added to version 2 without affecting version 1

### Requirement: CO-DOC-006 - Signature Capture
Users MUST be able to capture digital signatures on AIA G701 forms.

#### Scenario: Sign AIA G701 form
- **Given** an approved change order ready for signature
- **When** the contractor signs digitally
- **Then** the signature is embedded in the PDF
- **And** a signature timestamp is recorded
- **And** the signed PDF is saved to attachments
