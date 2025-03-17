/*
  # Calls Schema

  1. Tables
    - `calls`
      - `id` (uuid, primary key) - Unique call identifier
      - `phone_number` (text) - Contact phone number
      - `contact_name` (text) - Contact name
      - `property_address` (text) - Property address for real estate calls
      - `status` (text) - Call status (scheduled, in-progress, completed, missed)
      - `start_time` (timestamptz) - Scheduled/actual start time
      - `end_time` (timestamptz) - Call end time
      - `duration` (integer) - Call duration in seconds
      - `voice_agent_id` (text) - Reference to voice agent
      - `notes` (text) - Call notes
      - `recording_url` (text) - URL to call recording
      - `transcription` (text) - Call transcription
      - `callback_url` (text) - Webhook callback URL
      - `metadata` (jsonb) - Additional call metadata
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS
    - Open policies for development/demo environment
    - Indexes for performance optimization

  3. Triggers
    - Automatic updated_at timestamp management
*/

-- Create calls table
CREATE TABLE IF NOT EXISTS public.calls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number text NOT NULL,
    contact_name text,
    property_address text,
    status text NOT NULL,
    start_time timestamptz NOT NULL,
    end_time timestamptz,
    duration integer,
    voice_agent_id text NOT NULL,
    notes text,
    recording_url text,
    transcription text,
    callback_url text,
    metadata jsonb,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;
    DROP POLICY IF EXISTS "Users can create calls" ON public.calls;
    DROP POLICY IF EXISTS "Users can update their own calls" ON public.calls;
EXCEPTION
    WHEN undefined_object THEN 
        NULL;
END $$;

-- Create policies
CREATE POLICY "Users can view their own calls"
    ON public.calls FOR SELECT
    USING (true);  -- Allow read access for development

CREATE POLICY "Users can create calls"
    ON public.calls FOR INSERT
    WITH CHECK (true);  -- Allow insert access for development

CREATE POLICY "Users can update their own calls"
    ON public.calls FOR UPDATE
    USING (true)  -- Allow update access for development
    WITH CHECK (true);

-- Create or replace updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS update_calls_updated_at ON public.calls;
CREATE TRIGGER update_calls_updated_at
    BEFORE UPDATE ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Drop existing indexes if they exist
DROP INDEX IF EXISTS idx_calls_phone_number;
DROP INDEX IF EXISTS idx_calls_status;
DROP INDEX IF EXISTS idx_calls_start_time;

-- Create indexes
CREATE INDEX idx_calls_phone_number ON public.calls(phone_number);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_calls_start_time ON public.calls(start_time);