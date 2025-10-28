# Tasks: Enhance Budget Allocations with Quote Uploads and AI-Powered Search

## Change ID
`enhance-budget-allocations-with-quotes-and-ai`

## Task List

### Phase 1: Database & Storage Setup (Days 1-2)

**1. Create database migration for quote and line item tables**
- [ ] Create `project_quotes` table with file metadata
- [ ] Create `budget_line_items` table with AI tracking
- [ ] Add full-text search trigger function
- [ ] Create `budget_with_line_items` materialized view
- [ ] Add refresh trigger on line item changes
- [ ] Test migration on local Supabase
- **Validation**: All tables created, indexes in place, triggers firing

**2. Create storage bucket and RLS policies**
- [ ] Create `project-quotes` Supabase Storage bucket
- [ ] Add INSERT policy (users can upload to their projects)
- [ ] Add SELECT policy (users can view from their projects)
- [ ] Add DELETE policy (managers only)
- [ ] Test file upload/download with different roles
- **Validation**: Upload succeeds for team members, delete restricted to managers

**3. Generate TypeScript types from schema**
- [ ] Run `supabase gen types typescript --local`
- [ ] Update `lib/types/supabase.ts`
- [ ] Create TypeScript interfaces for line items and quotes
- **Validation**: No TypeScript errors in existing code

### Phase 2: Backend Actions - Quote Upload (Days 3-4)

**4. Implement quote upload action**
- [ ] Create `lib/actions/budgets/upload-quote.ts`
- [ ] Validate file type (PDF, PNG, JPG, HEIC)
- [ ] Validate file size (max 25MB)
- [ ] Upload to Supabase Storage with proper path structure
- [ ] Create `project_quotes` record with metadata
- [ ] Return quote ID and file path
- **Validation**: File uploads to storage, database record created

**5. Implement AI quote parsing action**
- [ ] Create `lib/utils/parse-quote.ts` (similar to parse-invoice.ts)
- [ ] Build OpenAI Vision API prompt for quote parsing
- [ ] Handle multi-page PDFs (extract each page)
- [ ] Parse line items from AI response
- [ ] Calculate confidence scores per line item
- [ ] Store raw AI response in `ai_raw_response` field
- **Validation**: Test with 3 sample quotes, >80% accuracy

**6. Implement line item confirmation action**
- [ ] Create `lib/actions/budgets/confirm-line-items.ts`
- [ ] Accept edited line items from frontend
- [ ] Track changes in `ai_corrections` JSONB
- [ ] Bulk insert line items to `budget_line_items`
- [ ] Update `project_quotes.ai_parsed = true`
- [ ] Refresh materialized view
- **Validation**: Line items saved, rollup calculation correct

### Phase 3: Backend Actions - Line Item Management (Day 5)

**7. Implement line item CRUD actions**
- [ ] Create `lib/actions/budgets/get-line-items.ts`
- [ ] Create `lib/actions/budgets/update-line-item.ts`
- [ ] Create `lib/actions/budgets/delete-line-item.ts`
- [ ] Create `lib/actions/budgets/add-manual-line-item.ts`
- [ ] Add validation (amounts must match quantity × unit price)
- [ ] Add RLS policy checks
- **Validation**: All CRUD operations work, RLS enforced

**8. Implement search functionality**
- [ ] Create `lib/actions/budgets/search-line-items.ts`
- [ ] Use Postgres full-text search function
- [ ] Add filters: category, price range
- [ ] Return relevance-ranked results
- [ ] Add pagination (100 results per page)
- **Validation**: Search returns relevant results, filters work

### Phase 4: Frontend Components - Quote Upload (Days 6-7)

**9. Create quote upload dialog component**
- [ ] Create `components/budgets/quote-upload-dialog.tsx`
- [ ] File dropzone with drag-and-drop
- [ ] Category selector (auto-set from parent budget allocation)
- [ ] Upload progress indicator
- [ ] Error handling (file too large, invalid type)
- [ ] Success state → trigger AI parsing
- **Validation**: Upload works, transitions to parsing state

**10. Create quote review interface**
- [ ] Create `components/budgets/quote-review-interface.tsx`
- [ ] Editable table with line items
- [ ] Highlight low-confidence items (<80%)
- [ ] Inline editing (description, quantity, unit_price)
- [ ] Auto-calculate line_total on edit
- [ ] "Confirm" button to save line items
- **Validation**: Edits tracked, calculations correct

### Phase 5: Frontend Components - Line Items Display (Days 8-9)

**11. Create line items table component**
- [ ] Create `components/budgets/line-items-table.tsx`
- [ ] Expandable rows per budget category
- [ ] Display: description, quantity, unit, price, total
- [ ] Link to source quote (if exists)
- [ ] Edit/delete actions (managers only)
- [ ] "Add manual line item" button
- **Validation**: Table displays correctly, actions work

**12. Update budget allocation form**
- [ ] Add "Attach Quote" button to each category
- [ ] Show quote count badge (e.g., "2 quotes, 47 items")
- [ ] Show line items total vs. allocated amount
- [ ] Expand/collapse line items section
- [ ] Add warning if line items don't match allocation
- **Validation**: UI integrates seamlessly with existing form

### Phase 6: Frontend Components - Search & PDF Viewer (Days 10-11)

**13. Create budget search bar component**
- [ ] Create `components/budgets/budget-search-bar.tsx`
- [ ] Search input with debounce (300ms)
- [ ] Category filter dropdown
- [ ] Price range filter (min/max)
- [ ] "Search within: All | Labor | Materials | Equipment | Other"
- [ ] Display result count
- **Validation**: Search executes, filters apply correctly

**14. Create quote PDF viewer component**
- [ ] Create `components/budgets/quote-pdf-viewer.tsx`
- [ ] Use React-PDF for inline rendering
- [ ] Download button for original file
- [ ] Page navigation (prev/next)
- [ ] Lazy loading (render visible pages only)
- [ ] Mobile-responsive (stack on small screens)
- **Validation**: PDF displays, navigation works

**15. Integrate search results display**
- [ ] Display search results in card/table format
- [ ] Highlight matching keywords in descriptions
- [ ] Show category badge and amount
- [ ] Click result → expand parent budget + highlight line item
- [ ] "View Quote" link opens PDF viewer
- **Validation**: Results clickable, highlighting works

### Phase 7: Integration & Polish (Day 12)

**16. Update project costs page**
- [ ] Add search bar at top of page
- [ ] Update budget allocations section with line items
- [ ] Add "Upload Quote" CTAs if no quotes attached
- [ ] Show summary stats (X quotes, Y line items, $Z total)
- **Validation**: Page layout cohesive, all features accessible

**17. Add loading states and error handling**
- [ ] Skeleton loaders for line items table
- [ ] Upload progress indicators
- [ ] AI parsing "Processing..." state
- [ ] Error toasts for failed uploads/parsing
- [ ] Retry mechanisms for transient failures
- **Validation**: User feedback clear for all states

### Phase 8: Testing & QA (Days 13-14)

**18. Write E2E tests**
- [ ] Test: Upload quote → AI parse → confirm line items
- [ ] Test: Search line items across categories
- [ ] Test: Edit line item → verify rollup update
- [ ] Test: Delete quote → verify line items cascade delete
- [ ] Test: Manual line item entry
- **Validation**: All critical paths covered, tests pass

**19. AI parsing validation**
- [ ] Collect 10 diverse construction quotes (electrical, plumbing, HVAC)
- [ ] Run through AI parsing
- [ ] Measure accuracy (% fields correct without edit)
- [ ] Document common failure modes
- [ ] Adjust prompts if accuracy <85%
- **Validation**: >85% accuracy across test set

**20. Performance testing**
- [ ] Test large quote uploads (20MB PDFs)
- [ ] Test search with 500+ line items
- [ ] Measure materialized view refresh time
- [ ] Check page load time with 100+ line items
- [ ] Optimize queries if any >500ms
- **Validation**: All interactions <2s, no blocking operations

**21. Documentation**
- [ ] Add user guide: "How to Upload Quotes"
- [ ] Add technical docs: AI parsing architecture
- [ ] Update API documentation with new actions
- [ ] Add inline code comments for complex logic
- **Validation**: Docs clear enough for next developer

### Phase 9: Deployment (Day 14)

**22. Deploy to production**
- [ ] Review migration SQL (no destructive changes)
- [ ] Run migration on production database
- [ ] Create storage bucket in production Supabase
- [ ] Deploy frontend code
- [ ] Monitor error logs for 24 hours
- [ ] Test with real user on staging first
- **Validation**: Zero downtime, no errors in production logs

---

## Task Dependencies

```
1 → 2 → 3 (Database setup must complete before backend)
4 → 5 → 6 (Upload before parsing before confirmation)
7 → 8 (CRUD before search)
9 → 10 (Upload dialog before review interface)
11 → 12 (Line items table before form integration)
13 → 14 → 15 (Search bar before PDF viewer before results)
16 → 17 (Integration before polish)
18 → 19 → 20 (E2E tests before AI validation before performance)
21 (Documentation can run parallel to testing)
22 (Deployment last, after all validation)
```

## Parallelizable Work

**Backend & Frontend can work in parallel after Day 5:**
- Days 6-9: Frontend components (Tasks 9-12)
- Days 6-9: Additional backend refinements (error handling, logging)

**Testing can start early:**
- Day 10: Begin E2E test writing (Tasks 18)
- Day 11: AI validation with sample quotes (Task 19)

---

**Total Estimated Time**: 14 days (2.8 weeks)
**Critical Path**: Database → Upload → Parsing → Review UI → Search → Testing → Deploy
