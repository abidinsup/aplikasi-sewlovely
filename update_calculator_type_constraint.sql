-- Drop existing constraint
ALTER TABLE survey_schedules DROP CONSTRAINT IF EXISTS survey_schedules_calculator_type_check;

-- Add updated constraint including 'sprei'
ALTER TABLE survey_schedules ADD CONSTRAINT survey_schedules_calculator_type_check 
CHECK (calculator_type IN ('gorden', 'kantor', 'rs', 'sprei'));
