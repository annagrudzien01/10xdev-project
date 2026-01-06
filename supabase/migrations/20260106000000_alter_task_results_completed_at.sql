-- =====================================================================================
-- Migration: Alter task_results.completed_at to be nullable without default
-- =====================================================================================
-- Purpose: Allow task_results to track incomplete tasks for game state persistence
-- Tables affected: public.task_results
-- 
-- Description:
--   This migration modifies the task_results table to support incomplete tasks:
--   - Makes completed_at nullable without a default value
--   - Adjusts the unique constraint to allow multiple incomplete tasks per child/level
--   - Adds an index for efficient querying of incomplete tasks
--
-- Rationale:
--   The original schema created tasks as immediately completed (completed_at defaulted to now()).
--   This prevents the ability to:
--   1. Track incomplete/in-progress puzzles
--   2. Resume game state after page refresh
--   3. Prevent duplicate puzzle generation when a puzzle is already in progress
--
-- Note: This is a breaking change if there's existing data with completed_at values.
-- =====================================================================================

-- Step 1: Drop the unique constraint on (child_id, level_id)
-- This constraint prevented multiple task attempts per level
alter table public.task_results 
drop constraint if exists task_results_child_id_level_id_key;

-- Step 2: Alter completed_at to be nullable without default
-- This allows tasks to be created as incomplete (completed_at = NULL)
alter table public.task_results 
alter column completed_at drop not null,
alter column completed_at drop default;

-- Step 3: Update constraints on attempts_used and score to allow NULL values for incomplete tasks
-- When a task is created but not yet completed, these fields should be NULL or have default values
-- attempts_used can be 0 (task created but not attempted yet) or 1-3 (attempts made)
alter table public.task_results 
drop constraint if exists task_results_attempts_used_check,
add constraint task_results_attempts_used_check 
  check (attempts_used is null or (attempts_used between 0 and 3));

alter table public.task_results 
drop constraint if exists task_results_score_check,
add constraint task_results_score_check 
  check (score is null or (score between 0 and 10));

-- Step 4: Make attempts_used and score nullable since they're not known until completion
alter table public.task_results 
alter column attempts_used drop not null,
alter column score drop not null;

-- Step 5: Add index for querying incomplete tasks efficiently
-- This supports the GET /api/profiles/{profileId}/tasks/current endpoint
create index if not exists idx_task_results_incomplete 
on public.task_results(child_id, created_at desc) 
where completed_at is null;

-- Step 6: Add unique constraint to prevent multiple incomplete tasks for same sequence
-- This ensures a child can only have one incomplete task per sequence at a time
create unique index if not exists ux_incomplete_task_per_child_sequence
on public.task_results(child_id, sequence_id)
where completed_at is null;

-- End of migration

