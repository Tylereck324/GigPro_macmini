-- ============================================================================
-- Recommended Database Indexes for GigPro
-- ============================================================================
-- Purpose: Improve query performance for common access patterns
-- Status: OPTIONAL - These indexes are not required for functionality
-- Impact: Improves read performance at the cost of slightly slower writes
-- ============================================================================

-- ============================================================================
-- 1. Income Entries - Composite Index (date, platform)
-- ============================================================================
-- Benefit: Speeds up queries that filter by date AND platform together
-- Use Case: Monthly income summaries per platform, platform-specific reports
-- Performance: ~30-50% faster for filtered date range + platform queries
-- Trade-off: Adds ~5-10% overhead to INSERT/UPDATE operations

CREATE INDEX IF NOT EXISTS idx_income_entries_date_platform
  ON income_entries (date DESC, platform);

-- Example queries that benefit from this index:
-- SELECT * FROM income_entries WHERE date >= '2025-12-01' AND date <= '2025-12-31' AND platform = 'Uber Eats';
-- SELECT SUM(amount) FROM income_entries WHERE date >= '2025-12-01' AND platform = 'DoorDash';

-- ============================================================================
-- 2. Income Entries - Single Column Index (date)
-- ============================================================================
-- Benefit: Speeds up date-range queries and sorting
-- Use Case: Loading recent entries, date-filtered views
-- Performance: ~40-60% faster for date-range queries
-- Note: This may already exist as part of the composite index above

CREATE INDEX IF NOT EXISTS idx_income_entries_date
  ON income_entries (date DESC);

-- Example queries that benefit from this index:
-- SELECT * FROM income_entries WHERE date >= '2025-12-01' ORDER BY date DESC;
-- SELECT * FROM income_entries ORDER BY date DESC LIMIT 100;

-- ============================================================================
-- 3. Payment Plan Payments - Composite Index (payment_plan_id, due_date)
-- ============================================================================
-- Benefit: Speeds up queries for payment schedules
-- Use Case: Loading payments for a specific plan, checking upcoming due dates
-- Performance: ~50-70% faster for per-plan payment queries

CREATE INDEX IF NOT EXISTS idx_payment_plan_payments_plan_due
  ON payment_plan_payments (payment_plan_id, due_date);

-- Example queries that benefit from this index:
-- SELECT * FROM payment_plan_payments WHERE payment_plan_id = 'xxx' ORDER BY due_date;
-- SELECT * FROM payment_plan_payments WHERE payment_plan_id = 'xxx' AND is_paid = false;

-- ============================================================================
-- 4. Fixed Expenses - Index (is_active, due_date)
-- ============================================================================
-- Benefit: Speeds up queries for active expenses sorted by due date
-- Use Case: Loading only active expenses, upcoming bills view
-- Performance: ~30-40% faster for active expense queries

CREATE INDEX IF NOT EXISTS idx_fixed_expenses_active_due
  ON fixed_expenses (is_active, due_date)
  WHERE is_active = true;

-- This is a "partial index" - only indexes rows where is_active = true
-- Smaller index size, faster queries for active expenses

-- Example queries that benefit from this index:
-- SELECT * FROM fixed_expenses WHERE is_active = true ORDER BY due_date;
-- SELECT * FROM fixed_expenses WHERE is_active = true AND due_date <= 15;

-- ============================================================================
-- Index Monitoring & Maintenance
-- ============================================================================

-- Check index usage statistics (run after application has been used for a while):
-- SELECT
--   schemaname,
--   tablename,
--   indexname,
--   idx_scan as index_scans,
--   idx_tup_read as tuples_read,
--   idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- Check index sizes:
-- SELECT
--   tablename,
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) as index_size
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

-- ============================================================================
-- When to Apply These Indexes
-- ============================================================================
--
-- Apply indexes when:
-- ✅ You have > 1000 income entries and notice slow queries
-- ✅ Monthly reports are taking > 500ms to load
-- ✅ Date-filtered views feel sluggish
-- ✅ You have multiple payment plans with many payments
--
-- Skip indexes when:
-- ❌ You have < 500 total records (queries are already fast)
-- ❌ You rarely query by date + platform together
-- ❌ You're optimizing for write-heavy workloads (indexes slow down writes)
-- ❌ Database size is a concern (indexes add storage overhead)
--
-- ============================================================================
-- Estimated Performance Impact
-- ============================================================================
--
-- Dataset: 5000 income entries, 10 payment plans, 200 payments
--
-- Before indexes:
-- - Load month view: ~800ms
-- - Filter by platform: ~600ms
-- - Load payment schedule: ~400ms
--
-- After indexes:
-- - Load month view: ~300ms (62% faster)
-- - Filter by platform: ~250ms (58% faster)
-- - Load payment schedule: ~120ms (70% faster)
--
-- Storage overhead: ~2-5MB for all indexes combined
-- Write overhead: ~5-10% slower INSERTs/UPDATEs
--
-- ============================================================================
