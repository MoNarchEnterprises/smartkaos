/*
  # Update calls table schema

  1. Changes
    - Add missing columns with appropriate constraints
    - Add updated_at trigger
    - Create indexes for common queries

  2. Safety
    - Uses IF NOT EXISTS for all operations
    - Wraps operations in DO blocks to prevent errors
    - Checks for existing constraints before adding
*/

-- Add any missing columns with appropriate constraints
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'end_time') THEN
    ALTER TABLE public.calls ADD COLUMN end_time timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'duration') THEN
    ALTER TABLE public.calls ADD COLUMN duration integer;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'recording_url') THEN
    ALTER TABLE public.calls ADD COLUMN recording_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'transcription') THEN
    ALTER TABLE public.calls ADD COLUMN transcription text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'callback_url') THEN
    ALTER TABLE public.calls ADD COLUMN callback_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'metadata') THEN
    ALTER TABLE public.calls ADD COLUMN metadata jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'created_at') THEN
    ALTER TABLE public.calls ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'calls' AND column_name = 'updated_at') THEN
    ALTER TABLE public.calls ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_calls_updated_at') THEN
    CREATE TRIGGER update_calls_updated_at
      BEFORE UPDATE ON public.calls
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create indexes if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_status') THEN
    CREATE INDEX idx_calls_status ON public.calls(status);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_start_time') THEN
    CREATE INDEX idx_calls_start_time ON public.calls(start_time);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calls_voice_agent_id') THEN
    CREATE INDEX idx_calls_voice_agent_id ON public.calls(voice_agent_id);
  END IF;
END $$;