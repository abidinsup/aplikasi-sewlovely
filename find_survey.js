
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findSurvey() {
    const { data, error } = await supabase
        .from('survey_schedules')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error("Error fetching survey:", error);
        return;
    }

    if (data && data.length > 0) {
        console.log("Found Surveys:", data);
    } else {
        console.log("No survey found for this customer.");
    }
}

findSurvey();
