-- =====================================================================================
-- Migration: Seed levels table with initial 20 levels
-- =====================================================================================
-- Purpose: Populate the levels table with 20 progressive difficulty levels
-- Tables affected: public.levels
-- 
-- Description:
--   This migration seeds the levels table with 20 levels of increasing difficulty.
--   Each level has specific characteristics:
--   - seq_length: starts at 2 for level 1, increases by 1 for each subsequent level
--   - tempo: increases every 5 levels (levels 1-5: tempo 1, levels 6-10: tempo 2, etc.)
--   - use_black_keys: false for levels 1-8, true for levels 9-20
--   - description: provides context about each level's characteristics
-- =====================================================================================

-- Insert all 20 levels with their respective configurations
-- Each level is designed to progressively challenge the player
insert into public.levels (
  id,
  seq_length,
  tempo,
  use_black_keys,
  description
) values
  -- Levels 1-5: Tempo 1, White keys only, Sequence length 2-6
  (1, 2, 1, false, 'Beginner level - Short sequences, slow tempo, white keys only'),
  (2, 3, 1, false, 'Easy level - Growing sequences, slow tempo, white keys only'),
  (3, 4, 1, false, 'Easy level - Medium sequences, slow tempo, white keys only'),
  (4, 5, 1, false, 'Easy level - Longer sequences, slow tempo, white keys only'),
  (5, 6, 1, false, 'Easy level - Extended sequences, slow tempo, white keys only'),
  
  -- Levels 6-8: Tempo 2, White keys only, Sequence length 7-9
  (6, 7, 2, false, 'Intermediate level - Longer sequences, faster tempo, white keys only'),
  (7, 8, 2, false, 'Intermediate level - Extended sequences, faster tempo, white keys only'),
  (8, 9, 2, false, 'Intermediate level - Long sequences, faster tempo, white keys only'),
  
  -- Levels 9-10: Tempo 2, Black keys introduced, Sequence length 10-11
  (9, 10, 2, true, 'Advanced level - Long sequences, faster tempo, all keys available'),
  (10, 11, 2, true, 'Advanced level - Very long sequences, faster tempo, all keys available'),
  
  -- Levels 11-15: Tempo 3, Black keys enabled, Sequence length 12-16
  (11, 12, 3, true, 'Expert level - Very long sequences, fast tempo, all keys available'),
  (12, 13, 3, true, 'Expert level - Extended sequences, fast tempo, all keys available'),
  (13, 14, 3, true, 'Expert level - Extensive sequences, fast tempo, all keys available'),
  (14, 15, 3, true, 'Expert level - Massive sequences, fast tempo, all keys available'),
  (15, 16, 3, true, 'Expert level - Huge sequences, fast tempo, all keys available'),
  
  -- Levels 16-20: Tempo 4, Black keys enabled, Sequence length 17-21
  (16, 17, 4, true, 'Master level - Huge sequences, very fast tempo, all keys available'),
  (17, 18, 4, true, 'Master level - Enormous sequences, very fast tempo, all keys available'),
  (18, 19, 4, true, 'Master level - Extreme sequences, very fast tempo, all keys available'),
  (19, 20, 4, true, 'Master level - Ultimate sequences, very fast tempo, all keys available'),
  (20, 21, 4, true, 'Grandmaster level - Maximum difficulty, longest sequences, fastest tempo, all keys available')
on conflict (id) do nothing;

-- Note: Using 'on conflict do nothing' to make this migration idempotent
-- This allows the migration to be run multiple times without errors
-- If levels already exist, they will not be modified

