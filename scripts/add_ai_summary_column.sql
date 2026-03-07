-- Run this in Supabase SQL Editor to add the ai_summary column
-- Navigate to: Supabase Dashboard > SQL Editor > New Query

ALTER TABLE court_notices 
ADD COLUMN IF NOT EXISTS ai_summary TEXT DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'court_notices' AND column_name = 'ai_summary';
