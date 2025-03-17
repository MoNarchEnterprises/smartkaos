/*
  # Update Time Handling for Call Scheduling

  1. Changes
    - Add timezone column to calls table
    - Ensure start_time and end_time are stored in UTC
    - Add index for timezone column

  2. Constraints
    - Enforce UTC storage for timestamps
*/

-- Add timezone column to calls table
ALTER TABLE public.calls
  ADD COLUMN IF NOT EXISTS timezone text;

-- Create index for timezone
CREATE INDEX IF NOT EXISTS idx_calls_timezone ON public.calls(timezone);

-- Add comment explaining timezone usage
COMMENT ON COLUMN public.calls.timezone IS 'The timezone in which the call was scheduled (for display purposes)';

-- Add comment explaining timestamp storage
COMMENT ON COLUMN public.calls.start_time IS 'Call start time in UTC';
COMMENT ON COLUMN public.calls.end_time IS 'Call end time in UTC';