# Spec: AI Quote Parsing

## Status
**PROPOSED**

## Overview
AI-powered extraction of line items from construction quotes using OpenAI Vision API. Extracts structured data (descriptions, quantities, unit prices) from PDF/image quotes, with human-in-the-loop review before finalizing.

## ADDED Requirements

### Requirement 1: Automated Line Item Extraction
OpenAI Vision API extracts structured line items from uploaded quote documents.

#### Scenario: Extract line items from electrical quote
**Given** quote PDF contains itemized list:
  - Line 1: "200A Panel Board" | Qty: 1 EA | Unit: $2,450 | Total: $2,450
  - Line 2: "1/2" EMT Conduit" | Qty: 500 LF | Unit: $1.85 | Total: $925
  - Line 3: "Labor - Installation" | Qty: 40 HR | Unit: $75 | Total: $3,000
**When** user uploads quote and triggers AI parsing
**Then** system returns structured JSON:
```json
{
  "line_items": [
    {
      "line_number": 1,
      "description": "200A Panel Board",
      "quantity": 1.0,
      "unit_of_measure": "EA",
      "unit_price": 2450.00,
      "line_total": 2450.00,
      "category_hint": "materials"
    },
    {
      "line_number": 2,
      "description": "1/2\" EMT Conduit",
      "quantity": 500.0,
      "unit_of_measure": "LF",
      "unit_price": 1.85,
      "line_total": 925.00,
      "category_hint": "materials"
    },
    {
      "line_number": 3,
      "description": "Labor - Installation",
      "quantity": 40.0,
      "unit_of_measure": "HR",
      "unit_price": 75.00,
      "line_total": 3000.00,
      "category_hint": "labor"
    }
  ],
  "total_amount": 6375.00
}
```

#### Scenario: Handle multi-page quote PDF
**Given** quote PDF has 3 pages with line items on pages 1-2 and terms on page 3
**When** AI parsing triggered
**Then** extracts line items from all pages
**And** combines into single line item list
**And** preserves sequential line numbers across pages

### Requirement 2: Confidence Scoring
AI provides confidence scores for overall extraction and per-line accuracy.

#### Scenario: High confidence extraction
**Given** quote PDF has clearly formatted table with all fields
**When** AI parsing completes
**Then** returns overall confidence ≥ 0.90
**And** each line item has confidence ≥ 0.85
**And** no items flagged for manual review

#### Scenario: Low confidence flagging
**Given** quote PDF has handwritten annotations or blurry text
**When** AI parsing completes
**Then** returns overall confidence ≤ 0.70
**And** flags line items with confidence < 0.80 for review
**And** highlights low-confidence items in review interface (yellow background)

### Requirement 3: Manual Review & Correction
Project managers review AI-extracted line items and correct errors before finalizing.

#### Scenario: Edit extracted line item
**Given** AI extracted description as "2x4 Stud" but should be "2x4x8 PT Stud"
**When** PM edits description in review interface
**Then** updated value saved to `ai_corrections` JSONB field:
```json
{
  "line_2": {
    "original": {"description": "2x4 Stud"},
    "edited": {"description": "2x4x8 PT Stud"}
  }
}
```
**And** corrected value stored in `budget_line_items.description`

#### Scenario: Add missing line item
**Given** AI missed line item at bottom of page
**When** PM clicks "Add Manual Line Item" during review
**And** enters: Description: "Safety Equipment", Qty: 1, Unit: $500
**Then** adds line item with `ai_confidence` = NULL (manual entry flag)
**And** includes in final line item list

### Requirement 4: Category Hint Assignment
AI suggests budget category (labor vs. materials) based on item description.

#### Scenario: Categorize materials items
**Given** line item description contains keywords "lumber", "wire", "panel", "fixture"
**When** AI processes line item
**Then** assigns `category_hint`: "materials"

#### Scenario: Categorize labor items
**Given** line item description contains keywords "labor", "installation", "hours", "man-hours"
**When** AI processes line item
**Then** assigns `category_hint`: "labor"

#### Scenario: Categorize equipment rental
**Given** line item description contains keywords "rental", "equipment", "crane", "lift"
**When** AI processes line item
**Then** assigns `category_hint`: "equipment"

#### Scenario: Uncertain category
**Given** line item description is ambiguous ("Miscellaneous Items")
**When** AI processes line item
**Then** assigns `category_hint`: NULL
**And** PM must manually assign category during review

### Requirement 5: Validation & Error Handling
System validates AI output and handles parsing failures gracefully.

#### Scenario: Validate line total calculations
**Given** AI extracts quantity: 100, unit_price: 5.50, line_total: 550.00
**When** validation runs
**Then** line_total matches (quantity × unit_price)
**And** line item accepted

#### Scenario: Reject invalid calculations
**Given** AI extracts quantity: 100, unit_price: 5.50, line_total: 500.00 (incorrect)
**When** validation runs
**Then** flags line item with error "Line total mismatch: expected $550.00, got $500.00"
**And** PM must correct during review

#### Scenario: AI timeout fallback
**Given** AI parsing runs for >60 seconds
**When** timeout threshold exceeded
**Then** cancels AI request
**And** displays error "Parsing timed out. Please try again or enter line items manually."
**And** provides "Manual Entry" fallback option

### Requirement 6: Audit Trail
System logs all AI parsing attempts and corrections for accuracy tracking.

#### Scenario: Log AI parsing attempt
**Given** quote uploaded at 2025-01-28 10:30:00
**When** AI parsing triggered
**Then** creates log entry:
```json
{
  "timestamp": "2025-01-28T10:30:15Z",
  "quote_id": "uuid",
  "ai_model": "gpt-4-vision-preview",
  "overall_confidence": 0.92,
  "line_items_extracted": 23,
  "processing_time_ms": 4250
}
```

#### Scenario: Track correction accuracy
**Given** AI extracted 50 line items with 5 corrections by PM
**When** line items finalized
**Then** calculates accuracy: (50 - 5) / 50 = 90%
**And** stores in analytics for model improvement

---

## AI Prompt Template

```
You are an expert at extracting line items from construction quotes.

Extract all line items from this quote document and return structured JSON.

Required fields per line item:
- line_number: Sequential number (1, 2, 3, ...)
- description: Full item description/specification
- quantity: Numeric quantity (decimal allowed)
- unit_of_measure: Unit abbreviation (EA, LF, SF, HR, etc.)
- unit_price: Price per unit (decimal)
- line_total: Total for this line (quantity × unit_price)
- category_hint: Best guess category ("labor", "materials", "equipment", "other")

Also extract quote-level metadata:
- vendor: Company name
- quote_number: Quote/estimate number
- quote_date: Date in YYYY-MM-DD format
- total_amount: Grand total

Return JSON format:
{
  "vendor": "...",
  "quote_number": "...",
  "quote_date": "YYYY-MM-DD",
  "line_items": [
    {
      "line_number": 1,
      "description": "...",
      "quantity": 0.0,
      "unit_of_measure": "...",
      "unit_price": 0.00,
      "line_total": 0.00,
      "category_hint": "materials"
    }
  ],
  "total_amount": 0.00,
  "confidence": 0.95
}

If uncertain about a field, set to null. Provide overall confidence 0.0-1.0.
```

## Database Schema Addition

```sql
-- Add to project_quotes table
ai_parsed BOOLEAN DEFAULT FALSE,
ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
ai_raw_response JSONB, -- Full OpenAI API response

-- Add to budget_line_items table
ai_confidence DECIMAL(3, 2), -- Confidence for this specific line
ai_corrections JSONB -- Track PM edits: {original: {}, edited: {}}
```

---

**Spec Version**: 1.0
**Last Updated**: 2025-01-28
