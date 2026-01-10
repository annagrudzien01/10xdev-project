-- Migration: Allow anonymous users to read sequences for demo mode
-- Description: Drops the deny-all anon policy and creates a read-only policy for demo levels (1-3)

-- Drop the existing policy that blocks all anon access
DROP POLICY IF EXISTS sequence_no_access_anon ON public.sequence;

-- Create a new policy allowing anonymous users to SELECT sequences for demo levels (1-3)
CREATE POLICY sequence_select_anon_demo ON public.sequence
  FOR SELECT
  TO anon
  USING (level_id IN (1, 2, 3));

-- Note: Anonymous users can only READ sequences for levels 1-3
-- They cannot INSERT, UPDATE, or DELETE sequences (no policies for those operations)
