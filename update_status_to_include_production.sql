-- Update Status Check Constraint for survey_schedules Table to include 'production'

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'survey_schedules_status_check') THEN
        ALTER TABLE "public"."survey_schedules" DROP CONSTRAINT "survey_schedules_status_check";
    END IF;
END $$;

ALTER TABLE "public"."survey_schedules" 
ADD CONSTRAINT "survey_schedules_status_check" 
CHECK (status IN ('pending', 'confirmed', 'completed', 'production', 'installation', 'done', 'cancelled'));
