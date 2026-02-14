require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInvoices() {
    console.log("Checking pending invoices linked to surveys...");

    const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
            id,
            invoice_number,
            payment_status,
            survey_id,
            total_amount
        `)
        .eq('payment_status', 'pending')
        .not('survey_id', 'is', null)
        .limit(5);

    if (error) {
        console.error("Error fetching invoices:", error);
    } else {
        console.log("Pending Invoices with Survey ID:", JSON.stringify(invoices, null, 2));

        if (invoices.length > 0) {
            // Also check the status of the linked survey
            const surveyIds = invoices.map(i => i.survey_id);
            const { data: surveys, error: surveyError } = await supabase
                .from('survey_schedules')
                .select('id, status')
                .in('id', surveyIds);

            if (surveyError) {
                console.error("Error fetching surveys:", surveyError);
            } else {
                console.log("Linked Surveys:", JSON.stringify(surveys, null, 2));
            }
        } else {
            console.log("No pending invoices found with survey_id.");
        }
    }
}

checkInvoices();
