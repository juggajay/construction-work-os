# Spec: Line Item Search

## Status
**PROPOSED**

## Overview
AI-powered search across all budget line items within a project. Enables project managers to quickly find specific items, materials, or services across multiple quotes and budget categories using natural language or keyword search.

## ADDED Requirements

### Requirement 1: Full-Text Keyword Search
Users can search line item descriptions using keywords with fuzzy matching.

#### Scenario: Search by material name
**Given** project has 150 line items across all budget categories
**And** line item #42: "2x4x8 SPF Lumber" (materials, $875)
**And** line item #87: "2x6x10 PT Lumber" (materials, $1,240)
**When** user searches "lumber"
**Then** returns both line items ranked by relevance
**And** highlights "lumber" in descriptions
**And** shows category badges (materials)
**And** displays line totals

#### Scenario: Search with typos (fuzzy match)
**Given** line item: "HVAC Compressor Unit"
**When** user searches "hvac compresser" (typo)
**Then** returns "HVAC Compressor Unit" in results
**And** shows "Did you mean: compressor?" suggestion

#### Scenario: Multi-word search
**Given** line items:
  - "Electrical Panel 200A"
  - "Electrical Wire 12/2"
  - "Solar Panel 300W"
**When** user searches "electrical panel"
**Then** returns "Electrical Panel 200A" first (exact phrase match)
**And** returns "Electrical Wire 12/2" second (partial match)
**And** excludes "Solar Panel 300W" (different context)

### Requirement 2: Category Filtering
Users can filter search results by budget category.

#### Scenario: Search within materials only
**Given** search query "panel" returns 10 results:
  - 6 in materials (electrical panels, wall panels)
  - 3 in labor (panel installation)
  - 1 in equipment (panel lifts)
**When** user selects "Materials" category filter
**Then** displays only 6 materials results
**And** hides labor and equipment results
**And** updates result count "6 results in Materials"

#### Scenario: Search across all categories
**Given** user has not selected category filter
**When** search executes
**Then** returns results from all categories (labor, materials, equipment, other)
**And** groups results by category
**And** shows category breakdown "Labor: 12 | Materials: 45 | Equipment: 8 | Other: 3"

### Requirement 3: Price Range Filtering
Users can filter line items by price range to focus on high-cost or low-cost items.

#### Scenario: Filter by minimum amount
**Given** search "wire" returns 20 results ($5 - $3,500 range)
**When** user sets filter "Min: $500"
**Then** displays only line items ≥ $500
**And** excludes items < $500
**And** updates count "8 results ($500+)"

#### Scenario: Filter by price range
**Given** search query returns 50 results
**When** user sets filter "Min: $1,000" and "Max: $5,000"
**Then** displays only line items between $1,000 and $5,000
**And** sorts by amount descending (highest first)

### Requirement 4: Search Result Ranking
Results ranked by relevance using full-text search scoring.

#### Scenario: Exact match ranks highest
**Given** line items:
  - "Electrical Panel" (exact match)
  - "Electrical Panel Board 200A" (contains match)
  - "Panel - Electrical Distribution" (contains match, different order)
**When** user searches "electrical panel"
**Then** ranks in order:
  1. "Electrical Panel" (exact phrase, shortest)
  2. "Electrical Panel Board 200A" (exact phrase, longer)
  3. "Panel - Electrical Distribution" (words present, different order)

#### Scenario: Rank by term frequency
**Given** line items:
  - "HVAC unit" (1 occurrence of "hvac")
  - "HVAC compressor for HVAC system" (2 occurrences)
**When** user searches "hvac"
**Then** ranks "HVAC compressor for HVAC system" higher
**And** shows relevance score indicators (e.g., 3 stars vs. 2 stars)

### Requirement 5: Search with Highlighting
Matching keywords highlighted in search results for quick scanning.

#### Scenario: Highlight single keyword
**Given** search query "conduit"
**When** results display
**Then** highlights "conduit" in descriptions:
  - "1/2\" EMT **Conduit**" (bold/highlighted)
  - "PVC **Conduit** - 3/4\" Schedule 40"

#### Scenario: Highlight multiple keywords
**Given** search query "electrical panel board"
**When** results display
**Then** highlights all matching words:
  - "**Electrical** **Panel** **Board** 200A"
  - "**Board** - **Electrical** Distribution"

### Requirement 6: Quick Navigation to Source
Click search result to navigate to parent budget allocation and highlight line item.

#### Scenario: Navigate from search result to budget
**Given** search result "200A Panel Board" from materials budget
**When** user clicks result
**Then** scrolls to materials budget section on costs page
**And** expands line items table
**And** highlights "200A Panel Board" row (yellow background, 2 sec fade)
**And** optionally opens source quote PDF viewer

### Requirement 7: Search Analytics & Suggestions
System tracks common searches to improve future query suggestions.

#### Scenario: Show recent searches
**Given** user previously searched "electrical", "hvac", "lumber"
**When** user focuses on search bar
**Then** dropdown shows "Recent Searches: electrical, hvac, lumber"
**And** clicking suggestion re-runs that search

#### Scenario: No results suggestion
**Given** search query "scaffolding" returns 0 results
**When** results empty
**Then** displays "No results for 'scaffolding'"
**And** suggests "Try: equipment, lift, temporary structures"
**And** provides "Search all categories" if currently filtered

---

## Search Implementation

### Full-Text Search Query (Postgres)

```sql
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
  quantity DECIMAL(15, 4),
  unit_of_measure TEXT,
  unit_price DECIMAL(15, 2),
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
    bli.quantity,
    bli.unit_of_measure,
    bli.unit_price,
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

### Search Vector Index

```sql
-- Full-text search trigger (from design.md)
CREATE INDEX idx_line_items_search ON budget_line_items USING GIN(search_vector);

-- Update trigger on insert/update
CREATE TRIGGER update_line_items_search_vector
BEFORE INSERT OR UPDATE ON budget_line_items
FOR EACH ROW EXECUTE FUNCTION update_line_item_search_vector();
```

## UI Components

### Search Bar Component
```typescript
interface SearchBarProps {
  projectId: string
  onResultsUpdate: (results: LineItem[], count: number) => void
}

// Debounced search (300ms)
// Category filter dropdown
// Price range inputs
// Result count display
```

### Search Results Component
```typescript
interface SearchResultProps {
  results: LineItem[]
  query: string
  onSelectResult: (lineItem: LineItem) => void
}

// Highlight matching keywords
// Display category badges
// Show line totals
// Click to navigate
```

---

**Spec Version**: 1.0
**Last Updated**: 2025-01-28
