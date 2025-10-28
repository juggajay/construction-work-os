# Proposal: Enhance Budget Allocations with Quote Uploads and AI-Powered Search

## Change ID
`enhance-budget-allocations-with-quotes-and-ai`

## Status
**PROPOSED** (Pending approval)

## Overview
Enhance the budget allocation system by allowing project managers to upload job quotes, automatically extract line items using AI, and enable intelligent search/filtering of budget line items across all categories. This transforms budget allocation from simple category-level planning into detailed, searchable, quote-backed financial planning.

## Problem Statement
Currently, budget allocations are entered as simple dollar amounts per category (labor, materials, equipment, other) without:
- **Quote documentation**: No way to attach the job quote that justifies budget amounts
- **Line item detail**: Budget is tracked at category level only, losing granular breakdown
- **Searchability**: Can't search for specific items like "electrical panels" or "HVAC units" within budget
- **Quote accessibility**: PMs have to dig through email/folders to find original quotes
- **AI assistance**: Manual entry of line items from multi-page PDF quotes is tedious

This creates several pain points:
1. **Budget justification gaps**: Owners asking "why $50K materials?" - no quick reference to quote
2. **Change order friction**: Need to find original quote to see if scope creep requires CO
3. **Manual data entry**: Typing 20-50 line items from PDF quotes wastes 30+ minutes per project
4. **Lost context**: 6 months into project, nobody remembers what's in the original budget

## User Impact
### Who Benefits
- **Project Managers**: Quick quote upload → AI extracts line items → instant searchable budget
- **Owners/Executives**: Click any budget allocation to see backing quote document
- **Estimators**: Reuse line item library from past projects for future estimates

### Key Use Cases
1. **Quote Upload & Parse**:
   - PM uploads $100K quote PDF
   - AI extracts 35 line items with descriptions, quantities, unit prices
   - PM reviews/edits AI output, confirms → line items populate budget allocations

2. **Quick Search**:
   - PM searches "electrical panel" in project budget
   - Sees all matching line items across categories (materials, equipment)
   - Filters to "materials only" → finds $4,500 allocation for panel XYZ

3. **Budget Review**:
   - Owner reviewing budget allocations
   - Clicks "View Quote" next to $50K materials allocation
   - PDF opens inline showing highlighted line items that sum to $50K

4. **Change Order Validation**:
   - Client requests scope change "add 2 skylights"
   - PM searches budget for "skylight"
   - Finds $0 allocated → creates change order with confidence

## Business Value
### Primary Benefits
- **Faster budget setup**: AI parsing saves 30-45 min per project (vs. manual line item entry)
- **Budget transparency**: One-click access to quote PDFs builds owner trust
- **Scope clarity**: Search prevents scope creep disputes ("was this in original quote?")
- **Estimating reuse**: Build line item library for future bid prep

### Success Metrics
- **Quote upload rate**: >80% of projects have attached quotes within first week
- **AI parsing accuracy**: >85% of line items extracted without manual correction
- **Search usage**: >50% of project teams search budget at least once per week
- **Time savings**: Average budget setup time ↓ from 60 min → 20 min

## Scope

### In Scope
1. **Quote Document Upload**
   - PDF/image upload to Supabase Storage (`project-quotes` bucket)
   - Associate quotes with specific budget allocations (labor, materials, etc.)
   - Multiple quotes per category (e.g., 3 material vendor quotes)
   - Quote metadata: vendor, date, total amount, page count

2. **AI Quote Parsing**
   - OpenAI Vision API to extract structured line items from PDF/image quotes
   - Extract per line item:
     - Description/specification
     - Quantity
     - Unit price
     - Line total
     - Category hint (labor vs. materials keywords)
   - Confidence scoring (0-100%) per line item
   - Manual review/edit interface before finalizing

3. **Line Item Management**
   - Store extracted line items in `budget_line_items` table
   - Link to parent budget allocation (project_budgets) and source quote
   - CRUD operations: edit descriptions, adjust amounts, delete lines, add manual items
   - Rollup: line items sum to parent budget allocation amount

4. **AI-Powered Search & Filtering**
   - Natural language search: "Find all HVAC equipment" (OpenAI embeddings)
   - Keyword search: Fuzzy match on item descriptions
   - Filters: Category, price range, vendor, date range
   - Highlighting: Show matching keywords in search results
   - Quick stats: "12 items found totaling $45,890"

5. **Quote Viewer Integration**
   - Inline PDF viewer (React-PDF) with quote highlighting
   - Click line item → jump to corresponding page in quote PDF
   - Side-by-side view: line items list + quote PDF
   - Download original quote file

6. **Budget Allocation UI Enhancements**
   - "Attach Quote" button on each budget category
   - Quote indicator badge (e.g., "2 quotes attached, 47 items")
   - Expand/collapse line items under each allocation
   - Search bar at top of budget page

### Out of Scope (Future Phases)
- **Multi-quote comparison**: Side-by-side vendor quote comparison tool
- **Quote versioning**: Track quote revisions when vendors update pricing
- **Automated category assignment**: ML model to auto-categorize line items
- **Historical price intelligence**: "Similar item cost $X on last 3 projects"
- **Export to estimating software**: Sage Estimating, PlanSwift integration

## Dependencies
### Technical Prerequisites
- **OpenAI Vision API**: Already integrated for invoice parsing (reuse infrastructure)
- **Supabase Storage**: Need new `project-quotes` bucket with RLS policies
- **React-PDF**: Already used for PDF viewing (existing dependency)
- **Vector search**: Consider pgvector extension for semantic search (optional, can start with simple full-text)

### Related Changes
- **Cost tracking system**: Extends `add-project-cost-tracking` (already deployed)
- **Budget allocations**: Builds on existing `project_budgets` table

### Blocking Issues
- None (can be developed independently)

## Risks & Mitigations
### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Quote PDFs poorly formatted → low AI parsing accuracy | High | Medium | Show confidence scores, always require PM review, support manual line item entry |
| Large quote files (>20MB) slow AI processing | Medium | Low | File size limit 25MB, use pagination for multi-page quotes, show progress indicator |
| Search returns too many irrelevant results | Medium | Medium | Implement relevance scoring, add category/price filters, allow "search within category" |

### Product Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| PMs don't trust AI-extracted line items | High | Medium | Make review step mandatory, show before/after diffs, log edits for accuracy tracking |
| Line item management too complex (feature bloat) | Medium | Low | Start with read-only line items (edit only via re-upload), add inline edit only if requested |
| Quote attachments clutter budget interface | Low | Low | Collapse line items by default, use accordions, provide "simplified view" toggle |

## Open Questions
1. **Line item editability**: Should PMs be able to edit AI-extracted line items or only delete/add new ones?
   - **Proposed**: Allow full editing (description, quantity, unit price) to fix AI errors

2. **Quote approval workflow**: Should quotes require owner approval before populating budget?
   - **Proposed**: No approval for Phase 1 (trust PM to upload correct quotes)

3. **Multi-currency support**: If quote is in different currency, how to handle?
   - **Proposed**: Defer to Phase 2 (assume USD for Phase 1)

4. **Duplicate line item detection**: How to prevent accidental duplicate uploads of same quote?
   - **Proposed**: Show warning if uploaded quote has similar filename + vendor + amount to existing quote

5. **Line item categories**: If AI can't confidently categorize a line item (labor vs. materials), what default?
   - **Proposed**: Require PM to manually assign category during review step

## Timeline Estimate
- **Design & Spec**: 2 days
- **Database Schema**: 2 days (`budget_line_items`, `project_quotes` tables, storage bucket)
- **Backend Actions**: 3 days (quote upload, AI parsing, line item CRUD, search logic)
- **Frontend UI**: 4 days (quote upload form, line item review interface, search bar, PDF viewer)
- **Testing & QA**: 2 days (E2E tests, AI parsing validation with sample quotes)
- **Documentation**: 1 day
- **Total**: ~14 days (2.8 weeks)

## Alternatives Considered
### Option 1: Manual Line Item Entry Only (No AI Parsing)
- **Pros**: Simpler, no AI accuracy concerns
- **Cons**: 30-45 min manual entry per quote defeats core value prop
- **Verdict**: Rejected - AI parsing is key differentiator

### Option 2: Use Third-Party Quote Parsing Service (e.g., Rossum)
- **Pros**: Higher accuracy, pre-trained on construction quotes
- **Cons**: Additional vendor cost (~$0.30-1.00/page), data privacy, API dependency
- **Verdict**: Rejected - Reuse existing OpenAI Vision infrastructure

### Option 3: Vector Database (Pinecone/Weaviate) for Semantic Search
- **Pros**: Superior search relevance, handles synonyms/context
- **Cons**: Additional infrastructure, $100+/month cost, migration complexity
- **Verdict**: Deferred - Start with Postgres full-text search (built-in), evaluate if search quality is insufficient

### Option 4: Split into Two Changes (Quotes first, Search later)
- **Pros**: Faster MVP (quote upload only), split testing
- **Cons**: Reduced user value (uploaded quotes not easily searchable), requires two deploy cycles
- **Verdict**: Rejected - Search is critical for making uploaded quotes useful

## Stakeholder Sign-Off
- [ ] **Product Owner**: Feature scope and priorities
- [ ] **Engineering Lead**: Technical feasibility and timeline
- [ ] **Construction SME**: Quote formats and workflow fit
- [ ] **Design Lead**: UX patterns and search interface

---
**Proposal Date**: 2025-01-28
**Author**: AI Assistant (Claude Code)
**Next Review**: Pending stakeholder feedback
