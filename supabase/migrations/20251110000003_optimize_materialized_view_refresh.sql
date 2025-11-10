-- ============================================================================
-- PHASE 2 PERFORMANCE OPTIMIZATION: Debounce Materialized View Refresh
-- Created: 2025-11-10
-- Protector Status: ⚠️ CONDITIONAL APPROVAL (MEDIUM RISK)
-- ============================================================================
-- PURPOSE: Eliminate lock contention from instant materialized view refresh
--
-- PROBLEM:
--   Current implementation refreshes materialized views on EVERY transaction:
--   - project_cost_summary: Refreshes on every invoice/cost insert/update/delete
--   - budget_with_line_items: Refreshes on every budget line item change
--
--   With high transaction volume, this causes:
--   - Lock contention (REFRESH blocks concurrent queries)
--   - Unnecessary refreshes (100 inserts = 100 refreshes instead of 1)
--   - Performance degradation at scale
--
-- SOLUTION:
--   Remove instant refresh triggers and use periodic refresh instead
--   Trade-off: Data may be up to 5 minutes stale, but eliminates blocking
--
-- EXPECTED IMPACT:
--   - No more lock contention on writes
--   - 95% reduction in refresh operations
--   - Better write performance
-- ============================================================================

-- ============================================================================
-- STEP 1: Remove Instant Refresh Triggers
-- ============================================================================

-- Drop triggers for project_cost_summary
DROP TRIGGER IF EXISTS refresh_cost_summary_on_invoice ON project_invoices;
DROP TRIGGER IF EXISTS refresh_cost_summary_on_cost ON project_costs;

COMMENT ON MATERIALIZED VIEW project_cost_summary IS
  'Materialized view of project cost summaries. Refreshed every 5 minutes via scheduled job (not on every transaction). May be up to 5 minutes stale.';

-- Drop triggers for budget_with_line_items (if they exist)
DROP TRIGGER IF EXISTS refresh_budget_line_items_on_change ON budget_line_items;

COMMENT ON MATERIALIZED VIEW budget_with_line_items IS
  'Materialized view of budgets with line items. Refreshed every 5 minutes via scheduled job. May be up to 5 minutes stale.';

-- ============================================================================
-- STEP 2: Create Manual Refresh Function (for immediate refresh if needed)
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Refresh both materialized views
  REFRESH MATERIALIZED VIEW CONCURRENTLY project_cost_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY budget_with_line_items;

  -- Log refresh
  RAISE NOTICE 'Materialized views refreshed at %', now();
END;
$$;

GRANT EXECUTE ON FUNCTION refresh_all_materialized_views() TO authenticated;

COMMENT ON FUNCTION refresh_all_materialized_views() IS
  'Manually refresh all materialized views. Can be called via API if immediate refresh is needed.';

-- ============================================================================
-- STEP 3: Setup for Scheduled Refresh (Manual Implementation Required)
-- ============================================================================

-- NOTE: pg_cron extension is not available in Supabase free tier
-- Instead, implement refresh via:
-- 1. Supabase Edge Function called by cron-job.org or GitHub Actions
-- 2. Next.js API route called periodically
-- 3. External cron service hitting RPC endpoint

-- Example Edge Function (deploy separately):
-- ```typescript
-- import { createClient } from '@supabase/supabase-js'
--
-- export default async function refreshMaterializedViews() {
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL'),
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
--   )
--
--   await supabase.rpc('refresh_all_materialized_views')
--   return new Response('Views refreshed', { status: 200 })
-- }
-- ```

-- Example Next.js API Route:
-- ```typescript
-- // app/api/cron/refresh-views/route.ts
-- import { createClient } from '@/lib/supabase/server'
--
-- export async function GET(request: Request) {
--   // Verify cron secret
--   const authHeader = request.headers.get('authorization')
--   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
--     return new Response('Unauthorized', { status: 401 })
--   }
--
--   const supabase = await createClient()
--   await supabase.rpc('refresh_all_materialized_views')
--
--   return Response.json({ success: true, refreshed_at: new Date().toISOString() })
-- }
-- ```

-- Configure external cron to call:
-- curl -X GET https://your-app.com/api/cron/refresh-views \
--   -H "Authorization: Bearer YOUR_CRON_SECRET"

-- Recommended schedule: Every 5 minutes
-- cron-job.org schedule: */5 * * * *

-- ============================================================================
-- ROLLBACK PROCEDURE
-- ============================================================================
-- If issues occur, recreate instant refresh triggers:
--
-- CREATE TRIGGER refresh_cost_summary_on_invoice
-- AFTER INSERT OR UPDATE OR DELETE ON project_invoices
-- FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();
--
-- CREATE TRIGGER refresh_cost_summary_on_cost
-- AFTER INSERT OR UPDATE OR DELETE ON project_costs
-- FOR EACH STATEMENT EXECUTE FUNCTION refresh_cost_summary();

-- ============================================================================
-- TRADE-OFFS
-- ============================================================================
-- BEFORE (Instant Refresh):
--   ✅ Data always up-to-date (0 seconds stale)
--   ❌ Lock contention on high write volume
--   ❌ 100 writes = 100 refreshes
--   ❌ Blocks concurrent reads during refresh
--
-- AFTER (Periodic Refresh):
--   ✅ No lock contention
--   ✅ 100 writes = 1 refresh (every 5 min)
--   ✅ Better write performance
--   ⚠️ Data up to 5 minutes stale (acceptable for cost summaries)

-- ============================================================================
-- MANUAL REFRESH (if needed immediately)
-- ============================================================================
-- Can be called via SQL:
-- SELECT refresh_all_materialized_views();
--
-- Or via Supabase RPC:
-- await supabase.rpc('refresh_all_materialized_views')

-- ============================================================================
-- PROTECTOR AGENT VALIDATION
-- ============================================================================
-- ✅ GATE 1: Pre-implementation - CONDITIONAL APPROVAL
-- ✅ GATE 2: Code review - SQL validated, manual refresh available
-- ⏳ GATE 3: Testing - Pending
-- ⏳ GATE 4: Deployment - Pending
-- ⏳ GATE 5: Post-deployment - Monitor for staleness issues
--
-- CONDITIONS MET:
-- [x] Manual refresh function available
-- [x] Rollback procedure documented
-- [x] Trade-offs clearly documented
-- [ ] External cron job set up (post-deployment)
-- [ ] Monitor data staleness (5 min acceptable?)
