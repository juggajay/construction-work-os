# Proposal: Add Project Cost Tracking & Forecasting

## Change ID
`add-project-cost-tracking`

## Status
**PROPOSED** (Pending approval)

## Overview
Add comprehensive project cost tracking and forecasting capabilities that allow owners/managers to monitor budget allocation across labor and materials, upload invoices with AI-powered parsing, manually track costs, and receive predictive alerts when projects are trending over budget based on burn rate analysis.

## Problem Statement
Currently, Construction Work OS projects have a single `budget` field but lack:
- **Budget breakdown** by category (labor vs. materials)
- **Real-time cost tracking** as expenses are incurred
- **Invoice management** with automatic allocation deduction
- **Manual cost entry** for expenses without invoices
- **Burn rate analysis** to detect budget overruns early
- **Portfolio-level visibility** for owners/managers tracking multiple projects

This forces project managers to track costs in separate spreadsheets and makes it impossible for owners to get real-time financial visibility across their project portfolio.

## User Impact
### Who Benefits
- **Project Managers**: Track costs in real-time, upload invoices, get early warnings before budget overruns
- **Owners/Executives**: Portfolio-level financial dashboard showing all project costs at a glance
- **Accounting Teams**: Automated invoice parsing reduces manual data entry

### Key Use Cases
1. **Budget Setup**: PM creates $100K project with $50K labor, $50K materials allocation
2. **Invoice Upload**: PM uploads $10K material invoice → AI extracts amount → deducts from materials budget
3. **Manual Entry**: PM adds $2K labor cost for day workers (no invoice) → deducts from labor budget
4. **Burn Rate Alert**: System detects 50% budget spent at 25% timeline → alerts PM of 2x overspend rate
5. **Portfolio View**: Owner sees all active projects, their budget status, and forecasted overruns

## Business Value
### Primary Benefits
- **Prevent Cost Overruns**: Early detection via burn rate analysis (target: ↓30% budget overages)
- **Real-Time Visibility**: Eliminate 2-week lag from spreadsheet-based tracking
- **Reduce Manual Entry**: AI invoice parsing saves 10-15 min per invoice
- **Better Cash Flow**: Accurate forecasts improve funding/payment timing

### Success Metrics
- **Budget accuracy**: >90% of projects finish within ±5% of forecast
- **Early warning rate**: Detect trending overruns ≥2 weeks before critical
- **Invoice processing time**: <2 min from upload to budget update
- **Owner adoption**: >80% of owners use portfolio dashboard weekly

## Scope

### In Scope
1. **Budget Breakdown**
   - Extend projects table with labor/materials budget fields
   - Budget allocation UI in project settings
   - Validation: allocations must not exceed total budget

2. **Invoice Management**
   - Upload PDF/image invoices to Supabase Storage
   - AI-powered parsing (OpenAI Vision API) to extract amount, date, vendor
   - Categorize invoice as labor or materials
   - Automatic budget deduction on approval
   - Invoice history and audit trail

3. **Manual Cost Entry**
   - Quick-add cost form (amount, category, description, date)
   - Optional file attachments (receipts, photos)
   - Immediate budget deduction

4. **Cost Tracking Dashboard** (Project-level)
   - Budget breakdown visualization (labor vs. materials)
   - Spent vs. available for each category
   - Cost timeline chart (cumulative spending over project duration)
   - Recent transactions list (invoices + manual entries)

5. **Cost Forecasting**
   - Calculate burn rate: `(spent / elapsed_days) * remaining_days`
   - Forecast final cost based on current trajectory
   - Visual indicators: on-track (green), warning (yellow), critical (red)
   - Alert thresholds: >110% forecast = warning, >125% forecast = critical

6. **Portfolio Dashboard** (Owner/Manager)
   - All active projects with budget status
   - Sortable/filterable by org, status, overrun risk
   - Summary metrics: total allocated, total spent, total forecasted overrun

### Out of Scope (Future Phases)
- **CSI cost code integration**: Detailed cost breakdown by MasterFormat divisions
- **Purchase orders**: PO workflow before invoice payment
- **Payment schedules**: Multi-draw financing and progress payments
- **Subcontractor billing**: Sub-specific cost tracking and retention
- **Integration with accounting**: QuickBooks/Sage auto-sync
- **Custom budget categories**: User-defined categories beyond labor/materials

## Dependencies
### Technical Prerequisites
- **Supabase Storage**: File uploads for invoices (already configured)
- **OpenAI Vision API**: Invoice OCR and data extraction
- **React Query**: Client-side caching for cost data
- **Chart.js or Recharts**: Visualization library for dashboards

### Related Changes
- **Projects module**: Extends existing `projects` table (from `add-project-foundation`)
- **File uploads**: Leverages existing Uppy/TUS infrastructure

### Blocking Issues
- None (can be developed independently)

## Risks & Mitigations
### Technical Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| AI invoice parsing accuracy <80% | High | Medium | Implement manual review/edit step, allow PM to correct parsed values |
| Large invoice files (>10MB) slow uploads | Medium | Low | Use existing TUS resumable uploads, add file size validation (max 25MB) |
| Burn rate calculation inaccurate for non-linear projects | Medium | High | Add "expected progress %" override field, allow PM to adjust forecast basis |

### Product Risks
| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|-----------|
| Users resist AI-parsed invoices (trust issues) | High | Medium | Show confidence scores, always allow manual edit, log AI suggestions vs. final values |
| Two-category limit (labor/materials) too simplistic | Medium | High | Design extensible schema from start (JSONB `budget_categories`), document migration path to custom categories |

## Open Questions
1. **Budget change tracking**: Should we track history when PM adjusts budget allocations mid-project?
   - **Decision needed**: Yes/No, and if yes, should old forecasts recalculate?

2. **Invoice approval workflow**: Should invoices require approval before deducting budget?
   - **Proposed**: Optional approval step (org setting), default = auto-deduct

3. **Negative budgets**: Can a category go negative (materials overspent, labor underspent)?
   - **Proposed**: Allow negative per-category, but show warning if total project exceeds budget

4. **Cost entry permissions**: Can subcontractors add manual costs or only PMs?
   - **Proposed**: PM/Manager roles only for Phase 1

## Timeline Estimate
- **Design & Spec**: 3 days
- **Database Schema**: 2 days (migrations, types, RLS policies)
- **Backend (Actions/APIs)**: 4 days (invoice upload, AI parsing, cost calculations)
- **Frontend (Dashboards)**: 5 days (project dashboard, portfolio dashboard, forms)
- **Testing & QA**: 3 days (E2E tests, AI parsing validation, forecast accuracy)
- **Documentation**: 1 day
- **Total**: ~18 days (3.5 weeks)

## Alternatives Considered
### Option 1: Integrate with QuickBooks Immediately
- **Pros**: Leverage existing accounting data, avoid duplicate entry
- **Cons**: High integration complexity, delays MVP by 4+ weeks, not all customers use QuickBooks
- **Verdict**: Rejected for Phase 1, defer to Phase 2 integrations

### Option 2: Use Third-Party Invoice OCR Service (e.g., Rossum, Taggun)
- **Pros**: Higher accuracy than DIY OpenAI, pre-trained on construction invoices
- **Cons**: Additional vendor cost (~$0.10-0.50/invoice), API dependency, data privacy concerns
- **Verdict**: Rejected - OpenAI Vision cheaper and already approved vendor

### Option 3: Manual-Only (No AI Parsing)
- **Pros**: Simpler implementation, no AI accuracy concerns
- **Cons**: High manual entry burden (10-20 invoices/week typical project), defeats value prop
- **Verdict**: Rejected - AI parsing is core differentiator vs. spreadsheet tracking

## Stakeholder Sign-Off
- [ ] **Product Owner**: _[Name]_ - Feature scope and priorities
- [ ] **Engineering Lead**: _[Name]_ - Technical feasibility and timeline
- [ ] **Construction SME**: _[Name]_ - Domain accuracy and workflow fit
- [ ] **Design Lead**: _[Name]_ - UX patterns and component consistency

---
**Proposal Date**: 2025-10-25
**Author**: AI Assistant (Claude Code)
**Next Review**: Pending stakeholder feedback
