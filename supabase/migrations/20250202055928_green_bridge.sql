/*
  # Add minimum schedule time to profiles

  1. Changes
    - Add min_schedule_time column to profiles table with default 15 minutes
    - Add check constraint to ensure positive values
*/

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS min_schedule_time integer DEFAULT 15 CHECK (min_schedule_time > 0);

COMMENT ON COLUMN public.profiles.min_schedule_time IS 'Minimum time in minutes required between scheduling and start of a call';