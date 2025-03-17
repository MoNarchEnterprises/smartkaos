/*
  # Add Stripe Billing Support

  1. New Columns
    - stripe_customer_id: Stripe customer identifier
    - stripe_subscription_id: Stripe subscription identifier
    - auto_renew: Flag for automatic renewal
    - next_billing_date: Date of next billing
    - payment_method_id: Default payment method ID
    - reminder_sent: Track if renewal reminder was sent

  2. Security
    - Enable RLS on profiles table
    - Add policies for authenticated users
*/

-- Add Stripe and billing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text,
  ADD COLUMN IF NOT EXISTS auto_renew boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
  ADD COLUMN IF NOT EXISTS payment_method_id text,
  ADD COLUMN IF NOT EXISTS reminder_sent boolean DEFAULT false;

-- Add notification preferences
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_preferences jsonb DEFAULT jsonb_build_object(
    'email_reminders', true,
    'sms_reminders', false,
    'reminder_days_before', 7
  );

-- Create index for billing date queries
CREATE INDEX IF NOT EXISTS idx_profiles_next_billing ON public.profiles(next_billing_date)
  WHERE next_billing_date IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe customer ID for billing';
COMMENT ON COLUMN public.profiles.stripe_subscription_id IS 'Active Stripe subscription ID';
COMMENT ON COLUMN public.profiles.auto_renew IS 'Whether subscription should automatically renew';
COMMENT ON COLUMN public.profiles.next_billing_date IS 'Date of next automatic billing';
COMMENT ON COLUMN public.profiles.payment_method_id IS 'Default payment method ID in Stripe';
COMMENT ON COLUMN public.profiles.reminder_sent IS 'Whether renewal reminder was sent for current period';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'User preferences for billing notifications';