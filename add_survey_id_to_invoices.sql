-- Add survey_id column to invoices table if it doesn't exist
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS survey_id UUID REFERENCES survey_schedules(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_survey_id ON invoices(survey_id);
