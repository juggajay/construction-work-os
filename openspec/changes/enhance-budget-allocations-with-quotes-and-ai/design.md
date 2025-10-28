# Design: Enhance Budget Allocations with Quote Uploads and AI-Powered Search

## Change ID
`enhance-budget-allocations-with-quotes-and-ai`

## Architecture Overview

This change extends the existing cost tracking system by adding structured line item storage, quote document management, and intelligent search capabilities. The system reuses existing AI infrastructure (OpenAI Vision API) and follows established patterns from invoice processing.

### High-Level Flow
```
1. PM uploads quote PDF → Supabase Storage (`project-quotes` bucket)
2. AI extracts line items → OpenAI Vision API returns structured JSON
3. PM reviews/edits line items → Frontend confirmation interface
4. Line items saved → `budget_line_items` table (linked to budget allocation)
5. Search query → Full-text search + relevance ranking
6. Results displayed → Highlighted matches + linked quote PDF
```

## Data Model

### New Tables

#### `project_quotes` Table
Stores uploaded quote documents with metadata.

```sql
CREATE TABLE project_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  budget_category project_budget_category NOT NULL, -- labor, materials, equipment, other

  -- File storage
  file_path TEXT NOT NULL, -- Supabase Storage path: project-quotes/{project_id}/{quote_id}/{filename}
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  page_count INTEGER,

  -- Quote metadata
  vendor_name TEXT,
  quote_number TEXT,
  quote_date DATE,
  total_amount DECIMAL(15, 2) CHECK (total_amount >= 0),

  -- AI parsing metadata
  ai_parsed BOOLEAN DEFAULT FALSE,
  ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00 (overall confidence)
  ai_raw_response JSONB, -- Full OpenAI API response for debugging

  -- Audit
  uploaded_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

-- Indexes
CREATE INDEX idx_project_quotes_project ON project_quotes(project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_quotes_category ON project_quotes(budget_category) WHERE deleted_at IS NULL;
CREATE INDEX idx_project_quotes_vendor ON project_quotes(vendor_name) WHERE deleted_at IS NULL;
```

#### `budget_line_items` Table
Stores individual line items extracted from quotes or manually entered.

```sql
CREATE TABLE budget_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_budget_id UUID NOT NULL REFERENCES project_budgets(id) ON DELETE CASCADE,
  project_quote_id UUID REFERENCES project_quotes(id) ON DELETE SET NULL, -- NULL if manual entry

  -- Line item data
  line_number INTEGER, -- Position in source quote
  description TEXT NOT NULL,
  quantity DECIMAL(15, 4),
  unit_of_measure TEXT, -- e.g., "SF", "EA", "LF"
  unit_price DECIMAL(15, 2),
  line_total DECIMAL(15, 2) NOT NULL CHECK (line_total >= 0),

  -- AI metadata (if extracted)
  ai_confidence DECIMAL(3, 2), -- Confidence for this specific line item
  ai_corrections JSONB, -- Track PM edits: {original: {}, edited: {}}

  -- Search optimization
  search_vector tsvector, -- Full-text search index

  -- Audit
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT valid_line_total CHECK (
    (quantity IS NOT NULL AND unit_price IS NOT NULL AND line_total = quantity * unit_price)
    OR (quantity IS NULL AND unit_price IS NULL)
  ),
  CONSTRAINT valid_ai_confidence CHECK (ai_confidence IS NULL OR (ai_confidence >= 0 AND ai_confidence <= 1))
);

-- Indexes
CREATE INDEX idx_line_items_budget ON budget_line_items(project_budget_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_items_quote ON budget_line_items(project_quote_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_line_items_search ON budget_line_items USING GIN(search_vector);
CREATE INDEX idx_line_items_amount ON budget_line_items(line_total DESC) WHERE deleted_at IS NULL;

-- Full-text search trigger
CREATE OR REPLACE FUNCTION update_line_item_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.unit_of_measure, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_line_items_search_vector
BEFORE INSERT OR UPDATE ON budget_line_items
FOR EACH ROW EXECUTE FUNCTION update_line_item_search_vector();
```

### Modified Tables

#### `project_budgets` (no schema changes)
Existing table remains unchanged. Line items roll up to the `allocated_amount` via calculated field.

#### View: `budget_with_line_items`
Materialized view for fast budget breakdown with line item counts.

```sql
CREATE MATERIALIZED VIEW budget_with_line_items AS
SELECT
  pb.id AS budget_id,
  pb.project_id,
  pb.category,
  pb.allocated_amount,
  COUNT(DISTINCT bli.id) AS line_item_count,
  COALESCE(SUM(bli.line_total), 0) AS line_items_total,
  COUNT(DISTINCT pq.id) AS quote_count,
  pb.allocated_amount - COALESCE(SUM(bli.line_total), 0) AS unallocated_amount
FROM project_budgets pb
LEFT JOIN budget_line_items bli ON pb.id = bli.project_budget_id AND bli.deleted_at IS NULL
LEFT JOIN project_quotes pq ON pb.project_id = pq.project_id AND pb.category = pq.budget_category AND pq.deleted_at IS NULL
WHERE pb.deleted_at IS NULL
GROUP BY pb.id, pb.project_id, pb.category, pb.allocated_amount;

CREATE UNIQUE INDEX idx_budget_line_items_summary ON budget_with_line_items(budget_id);
CREATE INDEX idx_budget_line_items_project ON budget_with_line_items(project_id);
```

## Storage Architecture

### `project-quotes` Bucket Structure
```
project-quotes/
  {project_id}/
    {quote_id}/
      {original_filename}
```

**Example**:
```
project-quotes/
  550e8400-e29b-41d4-a716-446655440000/
    660e8400-e29b-41d4-a716-446655440001/
      Acme_Electrical_Quote_2025-01-15.pdf
```

### Storage RLS Policies
```sql
-- Users can upload quotes to projects they have access to
CREATE POLICY "Users can upload quotes to accessible projects"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM user_project_ids()
  )
);

-- Users can view quotes from their projects
CREATE POLICY "Users can view quotes from accessible projects"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT project_id::text FROM user_project_ids()
  )
);

-- Managers can delete quotes
CREATE POLICY "Managers can delete quotes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-quotes'
  AND (storage.foldername(name))[1] IN (
    SELECT pa.project_id::text FROM project_access pa
    WHERE pa.user_id = auth.uid()
    AND pa.role IN ('manager')
    AND pa.deleted_at IS NULL
  )
);
```

## AI Integration

### Quote Parsing Workflow

**1. Upload & Preprocessing**
```typescript
// Server action: uploadQuote
async function uploadQuote(projectId: string, file: File, category: BudgetCategory) {
  // 1. Validate file (PDF/image, max 25MB)
  // 2. Upload to Supabase Storage
  // 3. Create project_quotes record (ai_parsed = false)
  // 4. Return quote ID for parsing step
}
```

**2. AI Extraction**
```typescript
// Server action: parseQuoteWithAI
async function parseQuoteWithAI(quoteId: string) {
  // 1. Download quote file from storage
  // 2. Convert to base64 (for image types) or extract pages (for PDF)
  // 3. Call OpenAI Vision API with specialized prompt
  // 4. Parse JSON response into structured line items
  // 5. Calculate confidence scores
  // 6. Return for frontend review
}
```

**OpenAI Prompt Template**:
```
Extract all line items from this construction quote/estimate. Return JSON array with:
- line_number: sequential number
- description: full item description
- quantity: numeric quantity
- unit_of_measure: unit (e.g., SF, EA, LF)
- unit_price: price per unit
- line_total: total for this line
- category_hint: "labor", "materials", "equipment", or "other" based on description

Format:
{
  "vendor": "company name",
  "quote_number": "quote #",
  "quote_date": "YYYY-MM-DD",
  "line_items": [
    {
      "line_number": 1,
      "description": "2x4x8 SPF Lumber",
      "quantity": 250.0,
      "unit_of_measure": "EA",
      "unit_price": 3.50,
      "line_total": 875.00,
      "category_hint": "materials"
    }
  ],
  "total_amount": 875.00
}

If uncertain, mark fields as null. Confidence level 0-100 for overall extraction.
```

**3. Review & Correction**
```typescript
// Client component: QuoteReviewDialog
// - Display AI-extracted line items in editable table
// - Highlight low-confidence items (< 0.8)
// - Allow inline editing (description, quantity, unit_price)
// - Auto-recalculate line_total on edit
// - Track edits in ai_corrections JSONB field
```

**4. Finalization**
```typescript
// Server action: confirmLineItems
async function confirmLineItems(quoteId: string, lineItems: LineItem[], edits: EditLog) {
  // 1. Update project_quotes (ai_parsed = true, ai_corrections = edits)
  // 2. Bulk insert into budget_line_items
  // 3. Refresh budget_with_line_items materialized view
  // 4. Return success + redirect to budget page
}
```

## Search Implementation

### Full-Text Search (Phase 1)
Use Postgres built-in tsvector for keyword search.

```sql
-- Search function
CREATE OR REPLACE FUNCTION search_budget_line_items(
  p_project_id UUID,
  p_search_query TEXT,
  p_category project_budget_category DEFAULT NULL,
  p_min_amount DECIMAL DEFAULT NULL,
  p_max_amount DECIMAL DEFAULT NULL
)
RETURNS TABLE (
  line_item_id UUID,
  budget_category project_budget_category,
  description TEXT,
  line_total DECIMAL(15, 2),
  quote_file_path TEXT,
  relevance_rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bli.id,
    pb.category,
    bli.description,
    bli.line_total,
    pq.file_path,
    ts_rank(bli.search_vector, plainto_tsquery('english', p_search_query)) AS relevance_rank
  FROM budget_line_items bli
  JOIN project_budgets pb ON bli.project_budget_id = pb.id
  LEFT JOIN project_quotes pq ON bli.project_quote_id = pq.id
  WHERE pb.project_id = p_project_id
    AND bli.deleted_at IS NULL
    AND bli.search_vector @@ plainto_tsquery('english', p_search_query)
    AND (p_category IS NULL OR pb.category = p_category)
    AND (p_min_amount IS NULL OR bli.line_total >= p_min_amount)
    AND (p_max_amount IS NULL OR bli.line_total <= p_max_amount)
  ORDER BY relevance_rank DESC, bli.line_total DESC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;
```

### Semantic Search (Future Phase 2)
If full-text search proves insufficient, add pgvector extension:

```sql
-- Add embedding column
ALTER TABLE budget_line_items ADD COLUMN description_embedding vector(1536);

-- Generate embeddings via OpenAI Embeddings API
-- Create HNSW index for fast similarity search
CREATE INDEX idx_line_items_embedding ON budget_line_items
USING hnsw (description_embedding vector_cosine_ops);
```

## Frontend Components

### New Components
1. **`QuoteUploadDialog`**: Modal for uploading quote files
2. **`QuoteReviewInterface`**: Editable table for AI-extracted line items
3. **`LineItemsTable`**: Display line items with expand/collapse
4. **`BudgetSearchBar`**: Global search with filters
5. **`QuotePDFViewer`**: Inline PDF viewer with line item highlighting

### Updated Components
1. **`BudgetAllocationForm`**: Add "Attach Quote" button per category
2. **`ProjectCostsPage`**: Integrate search bar and line items display

## API Endpoints (Server Actions)

### Quote Management
- `uploadQuote(projectId, file, category)` → {quoteId, uploadPath}
- `parseQuoteWithAI(quoteId)` → {vendor, lineItems[], confidence}
- `confirmLineItems(quoteId, lineItems, edits)` → {success, budgetId}
- `getProjectQuotes(projectId)` → Quote[]
- `deleteQuote(quoteId)` → {success}

### Line Items
- `getLineItemsByBudget(budgetId)` → LineItem[]
- `searchLineItems(projectId, query, filters)` → SearchResult[]
- `updateLineItem(lineItemId, updates)` → {success}
- `deleteLineItem(lineItemId)` → {success}
- `addManualLineItem(budgetId, lineItem)` → {success, lineItemId}

## Security Considerations

### RLS Policies
- Managers/supervisors can upload quotes and edit line items
- All project team members can view quotes and line items
- Only managers can delete quotes

### Data Validation
- File type validation (PDF, PNG, JPG, HEIC only)
- File size limit: 25MB
- Amount validation: line_total must equal quantity × unit_price
- Category validation: Must match enum values

### AI Safety
- Store full AI raw response for audit trail
- Log all PM corrections to ai_corrections JSONB
- Display confidence scores to user
- Never auto-finalize without PM review

## Performance Considerations

### Query Optimization
- Materialized view `budget_with_line_items` for fast dashboard rendering
- Full-text search index on `search_vector` column
- Separate indexes for filtering (category, amount ranges)

### File Handling
- Lazy-load PDF pages (only render visible pages)
- Compress images before AI processing (max 2048px width)
- Use Supabase CDN for quote file delivery

### Caching Strategy
- React Query cache line items per budget (5 min stale time)
- Cache search results per query (30 sec stale time)
- Invalidate on quote upload or line item edit

## Monitoring & Analytics

### Metrics to Track
- Quote upload success rate
- AI parsing accuracy (manual corrections %)
- Average line items per quote
- Search query latency (p50, p95, p99)
- Quote viewer usage (opens per project)

### Error Handling
- Failed uploads → retry with exponential backoff
- AI parsing timeout (>60s) → fallback to manual entry
- Search errors → graceful degradation to category filter only

---

**Design Review Date**: 2025-01-28
**Architect**: AI Assistant (Claude Code)
