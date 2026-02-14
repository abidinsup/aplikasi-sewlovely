-- Add photo columns to survey_schedules table
ALTER TABLE survey_schedules 
ADD COLUMN IF NOT EXISTS kode_gorden_url TEXT,
ADD COLUMN IF NOT EXISTS motif_gorden_url TEXT;

-- Create storage bucket for survey photos (run this in Supabase Storage settings or SQL)
-- Note: You may need to create the bucket manually in Supabase Dashboard > Storage > New Bucket
-- Bucket name: survey-photos
-- Make it public

-- Grant storage access
-- (These policies should be set in Supabase Dashboard > Storage > survey-photos > Policies)
