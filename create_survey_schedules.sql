-- Create survey_schedules table for storing survey bookings
CREATE TABLE IF NOT EXISTS survey_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT NOT NULL,
    survey_date DATE NOT NULL,
    survey_time TEXT NOT NULL,
    calculator_type TEXT NOT NULL CHECK (calculator_type IN ('gorden', 'kantor', 'rs')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_survey_schedules_date ON survey_schedules(survey_date);
CREATE INDEX IF NOT EXISTS idx_survey_schedules_partner ON survey_schedules(partner_id);
CREATE INDEX IF NOT EXISTS idx_survey_schedules_status ON survey_schedules(status);

-- Enable RLS
ALTER TABLE survey_schedules ENABLE ROW LEVEL SECURITY;

-- Policy: Partners can view their own survey schedules
CREATE POLICY "Partners can view own surveys" ON survey_schedules
    FOR SELECT USING (true);

-- Policy: Partners can insert survey schedules
CREATE POLICY "Partners can insert surveys" ON survey_schedules
    FOR INSERT WITH CHECK (true);

-- Policy: Partners can update their own surveys
CREATE POLICY "Partners can update own surveys" ON survey_schedules
    FOR UPDATE USING (true);

-- Grant permissions
GRANT ALL ON survey_schedules TO authenticated;
GRANT ALL ON survey_schedules TO anon;
