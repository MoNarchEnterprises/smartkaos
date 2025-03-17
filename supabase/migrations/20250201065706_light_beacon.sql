/*
  # Add User Profiles Table

  1. New Tables
    - `profiles`
      - `id` (text, primary key)
      - `email` (text)
      - `business_name` (text)
      - `subscription` (text)
      - `total_calls` (integer)
      - `last_active_at` (timestamptz)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `profiles` table
    - Add policies for read/write access
*/

CREATE TABLE IF NOT EXISTS public.profiles (
    id text PRIMARY KEY,
    email text NOT NULL,
    business_name text NOT NULL,
    subscription text NOT NULL DEFAULT 'free',
    total_calls integer DEFAULT 0,
    last_active_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for development (allowing all operations)
CREATE POLICY "Allow all operations for development"
    ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- Create indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription);
CREATE INDEX idx_profiles_last_active ON public.profiles(last_active_at);