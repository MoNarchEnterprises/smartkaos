/*
  # Add Payment History Table

  1. New Table
    - payment_history: Track all payment transactions
      - id: Unique identifier
      - user_id: Reference to profiles
      - amount: Payment amount
      - status: Payment status
      - stripe_payment_id: Stripe payment identifier
      - created_at: Payment timestamp

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS public.payment_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text REFERENCES public.profiles(id),
  amount decimal NOT NULL,
  status text NOT NULL CHECK (status IN ('succeeded', 'failed', 'pending', 'refunded')),
  stripe_payment_id text,
  payment_method_details jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own payments"
  ON public.payment_history
  FOR SELECT
  USING (user_id = current_user);

-- Create updated_at trigger
CREATE TRIGGER update_payment_history_updated_at
  BEFORE UPDATE ON public.payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes
CREATE INDEX idx_payment_history_user_id ON public.payment_history(user_id);
CREATE INDEX idx_payment_history_status ON public.payment_history(status);
CREATE INDEX idx_payment_history_created_at ON public.payment_history(created_at);