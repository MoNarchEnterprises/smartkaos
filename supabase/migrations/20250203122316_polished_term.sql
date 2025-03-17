-- Fix calls table constraints
ALTER TABLE public.calls
  DROP CONSTRAINT IF EXISTS calls_duration_check;

ALTER TABLE public.calls
  ADD CONSTRAINT calls_duration_check 
  CHECK (duration IS NULL OR duration >= 0);

-- Ensure all required columns exist with correct names
DO $$ 
BEGIN
  -- Rename columns if they exist with old names
  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' 
    AND column_name = 'phonenumber') 
  THEN
    ALTER TABLE public.calls 
    RENAME COLUMN phonenumber TO phone_number;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' 
    AND column_name = 'contactname') 
  THEN
    ALTER TABLE public.calls 
    RENAME COLUMN contactname TO contact_name;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' 
    AND column_name = 'voiceagentid') 
  THEN
    ALTER TABLE public.calls 
    RENAME COLUMN voiceagentid TO voice_agent_id;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' 
    AND column_name = 'starttime') 
  THEN
    ALTER TABLE public.calls 
    RENAME COLUMN starttime TO start_time;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'calls' 
    AND column_name = 'endtime') 
  THEN
    ALTER TABLE public.calls 
    RENAME COLUMN endtime TO end_time;
  END IF;
END $$;