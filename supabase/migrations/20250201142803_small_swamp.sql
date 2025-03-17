/*
  # Add Call Rollover System

  1. Changes
    - Add calls_remaining to track current period's unused calls
    - Add rollover_calls to track calls rolled over from previous periods
    - Add rollover_expiry_date to track when rolled over calls expire
    - Add current_period_start and current_period_end for billing cycle tracking
  
  2. Updates
    - Add function to handle monthly call reset and rollover
*/

-- Add new columns for call tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS calls_remaining integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_calls integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rollover_expiry_date timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS current_period_end timestamptz;

-- Create function to handle monthly call reset and rollover
CREATE OR REPLACE FUNCTION handle_call_rollover()
RETURNS trigger AS $$
DECLARE
  plan_calls integer;
  max_rollover integer;
BEGIN
  -- Determine plan's monthly call limit
  CASE NEW.subscription
    WHEN 'starter' THEN plan_calls := 100;
    WHEN 'pro' THEN plan_calls := 1000;
    WHEN 'enterprise' THEN plan_calls := -1; -- unlimited
    ELSE plan_calls := 0;
  END CASE;

  -- Set max rollover (2 months worth of calls)
  max_rollover := CASE 
    WHEN plan_calls = -1 THEN 0 -- no rollover for unlimited plans
    ELSE plan_calls * 2
  END;

  -- Handle plan upgrade
  IF OLD.subscription != NEW.subscription AND NEW.subscription IN ('starter', 'pro', 'enterprise') THEN
    -- Keep existing rollover calls when upgrading
    NEW.rollover_calls := LEAST(OLD.calls_remaining + OLD.rollover_calls, max_rollover);
    NEW.calls_remaining := plan_calls;
    NEW.current_period_start := CURRENT_TIMESTAMP;
    NEW.current_period_end := CURRENT_TIMESTAMP + INTERVAL '1 month';
    NEW.rollover_expiry_date := CURRENT_TIMESTAMP + INTERVAL '2 months';
  -- Handle plan downgrade
  ELSIF OLD.subscription != NEW.subscription AND OLD.subscription IN ('starter', 'pro', 'enterprise') THEN
    -- Lose all rollover calls on downgrade
    NEW.rollover_calls := 0;
    NEW.calls_remaining := plan_calls;
    NEW.current_period_start := CURRENT_TIMESTAMP;
    NEW.current_period_end := CURRENT_TIMESTAMP + INTERVAL '1 month';
    NEW.rollover_expiry_date := CURRENT_TIMESTAMP + INTERVAL '2 months';
  -- Handle monthly renewal
  ELSIF NEW.current_period_end <= CURRENT_TIMESTAMP THEN
    -- Roll over unused calls
    NEW.rollover_calls := LEAST(NEW.calls_remaining + NEW.rollover_calls, max_rollover);
    NEW.calls_remaining := plan_calls;
    NEW.current_period_start := CURRENT_TIMESTAMP;
    NEW.current_period_end := CURRENT_TIMESTAMP + INTERVAL '1 month';
    NEW.rollover_expiry_date := CURRENT_TIMESTAMP + INTERVAL '2 months';
  END IF;

  -- Clear expired rollover calls
  IF NEW.rollover_expiry_date <= CURRENT_TIMESTAMP THEN
    NEW.rollover_calls := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for call rollover
CREATE TRIGGER handle_call_rollover
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_call_rollover();

-- Create index for period tracking
CREATE INDEX IF NOT EXISTS idx_profiles_period_end 
ON public.profiles(current_period_end);