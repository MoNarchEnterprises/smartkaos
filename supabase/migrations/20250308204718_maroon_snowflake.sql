/*
  # Initial Schema Setup

  1. New Tables
    - `profiles`: Stores user profile information
      - Text-based ID to match auth.uid
      - Basic user information and subscription details
      - Automatic timestamp tracking
    - `user_voices`: Stores voice configurations
      - UUID primary key
      - References profiles table
      - JSON storage for voice settings

  2. Security
    - RLS enabled on all tables
    - Policies for user-specific access
    - Cascading deletes for related data

  3. Performance
    - Indexes on frequently queried columns
    - Automatic updated_at timestamp maintenance
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id text PRIMARY KEY,
    email text UNIQUE NOT NULL,
    business_name text NOT NULL,
    subscription text NOT NULL DEFAULT 'trial',
    trial_used boolean NOT NULL DEFAULT false,
    trial_calls_remaining integer NOT NULL DEFAULT 50,
    subscription_status text NOT NULL DEFAULT 'trial',
    language text NOT NULL DEFAULT 'en',
    timezone text NOT NULL DEFAULT 'UTC',
    last_active_at timestamptz DEFAULT now(),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create user_voices table
CREATE TABLE IF NOT EXISTS public.user_voices (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id text NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    voices jsonb NOT NULL DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_voices ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own voice profiles" ON public.user_voices;
DROP POLICY IF EXISTS "Users can create their own voice profiles" ON public.user_voices;
DROP POLICY IF EXISTS "Users can update their own voice profiles" ON public.user_voices;
DROP POLICY IF EXISTS "Users can delete their own voice profiles" ON public.user_voices;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile"
    ON public.profiles
    FOR SELECT
    USING (id = auth.uid()::text);

CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    USING (id = auth.uid()::text);

-- Create policies for user_voices
CREATE POLICY "Users can view their own voice profiles"
    ON public.user_voices
    FOR SELECT
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can create their own voice profiles"
    ON public.user_voices
    FOR INSERT
    WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "Users can update their own voice profiles"
    ON public.user_voices
    FOR UPDATE
    USING (user_id = auth.uid()::text);

CREATE POLICY "Users can delete their own voice profiles"
    ON public.user_voices
    FOR DELETE
    USING (user_id = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription ON public.profiles(subscription);
CREATE INDEX IF NOT EXISTS idx_user_voices_user_id ON public.user_voices(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_user_voices_updated_at ON public.user_voices;
CREATE TRIGGER set_user_voices_updated_at
    BEFORE UPDATE ON public.user_voices
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();