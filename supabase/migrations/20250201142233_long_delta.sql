/*
  # Update Pricing Structure and Free Trial

  1. Changes
    - Add trial_used boolean to profiles table
    - Add trial_calls_remaining integer to profiles table
    - Add subscription_status to track trial/active/expired
    - Add subscription_start_date and subscription_end_date
  
  2. Updates
    - Modify default subscription to 'trial'
    - Set default trial calls to 50
*/

-- Add new columns to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_used boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS trial_calls_remaining integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'trial',
  ADD COLUMN IF NOT EXISTS subscription_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_end_date timestamptz;

-- Update existing free subscriptions to trial
UPDATE public.profiles 
SET subscription = 'trial' 
WHERE subscription = 'free';

-- Create index for trial tracking
CREATE INDEX IF NOT EXISTS idx_profiles_trial_status 
ON public.profiles(trial_used, subscription_status);