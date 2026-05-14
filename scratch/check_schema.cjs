const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').resolve('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht/.env') });

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '');

async function run() {
    console.log("Checking user_accounts columns...");
    const { data: uaData } = await supabase.from('user_accounts').select('*').limit(1);
    if (uaData && uaData.length > 0) {
        console.log("Columns:", Object.keys(uaData[0]));
    } else {
        console.log("user_accounts is empty. Querying employees...");
        const { data: emps } = await supabase.from('employees').select('id, full_name, position').limit(1);
        console.log("Employees:", emps);
    }
}
run();
