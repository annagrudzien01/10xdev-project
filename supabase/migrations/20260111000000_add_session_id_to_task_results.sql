-- =====================================================================================
-- Migration: Add session_id to task_results table
-- =====================================================================================
-- Purpose: Track which tasks belong to which game session for metrics and analytics
-- Tables affected: public.task_results
-- 
-- Description:
--   This migration adds session tracking to task_results table:
--   - Adds session_id column with foreign key to sessions table
--   - Adds index for efficient session-based queries
--
-- Rationale:
--   To support the success metric: "Average number of completed tasks per session ≥ 10"
--   Without session_id, we cannot calculate per-session statistics.
--
-- Note: 
--   - session_id is initially NULLABLE to support existing data (if any)
--   - Application code should ALWAYS provide session_id for new task_results
--   - After backfilling old data (if needed), this could be changed to NOT NULL
-- =====================================================================================

-- Step 1: Add session_id column as nullable with foreign key
-- This allows existing task_results (if any) to remain valid during migration
alter table public.task_results 
add column session_id uuid references public.sessions(id) on delete cascade;

-- Step 2: Add index for efficient session-based queries
-- This supports queries like: "How many tasks were completed in session X?"
-- Used for analytics dashboard and success metrics
create index if not exists idx_task_results_session 
on public.task_results(session_id, completed_at);

-- Step 3: Add comment explaining the column
comment on column public.task_results.session_id is 
  'Links task to the game session. Should be NOT NULL for all new records. Nullable only for backward compatibility with existing data.';

-- =====================================================================================
-- OPTIONAL: Cleanup old data without session_id
-- =====================================================================================
-- If you want to enforce session_id as NOT NULL, first run:
--   DELETE FROM public.task_results WHERE session_id IS NULL;
-- Then run:
--   ALTER TABLE public.task_results ALTER COLUMN session_id SET NOT NULL;
-- =====================================================================================

-- End of migration
