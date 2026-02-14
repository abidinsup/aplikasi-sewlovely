
-- Update Status Check Constraint for survey_schedules Table

-- First, drop the existing constraint if it exists (using a safer approach to verify first)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_schedules_status_check') THEN
        ALTER TABLE "public"."survey_schedules" DROP CONSTRAINT "survey_schedules_status_check";
    END IF;
END $$;

-- Then add the new constraint with 'installation' status allowed
ALTER TABLE "public"."survey_schedules" 
ADD CONSTRAINT "survey_schedules_status_check" 
CHECK (status IN ('pending', 'confirmed', 'completed', 'installation', 'done', 'cancelled'));

-- Verify the table structure (Optional)
-- SELECT * FROM information_schema.check_constraints WHERE constraint_name = 'survey_schedules_status_check';
