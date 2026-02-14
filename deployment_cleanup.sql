-- CLEANUP SCRIPT FOR DEPLOYMENT
-- This script clears all test data while keeping the schema intact.

-- 1. Clear Invoices (Sales/Omset)
TRUNCATE TABLE invoices CASCADE;

-- 2. Clear Transactions (Commissions/Withdrawals)
TRUNCATE TABLE transactions CASCADE;

-- 3. Clear Survey Schedules (Visits)
TRUNCATE TABLE survey_schedules CASCADE;

-- 4. Clear Partner Requests (Data changes)
TRUNCATE TABLE partner_requests CASCADE;

-- 5. Clear Partner Profiles
-- Using DELETE instead of TRUNCATE for partners if there are Auth dependencies 
-- or if we want to be more granular. TRUNCATE CASCADE will handle references.
TRUNCATE TABLE partners CASCADE;

-- Note: CASCADE ensures that any dependent data or foreign keys are also cleared.
