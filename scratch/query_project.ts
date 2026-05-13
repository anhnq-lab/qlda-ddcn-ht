import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
);

async function checkProject() {
    const { data: projects, error } = await supabase
        .from('projects')
        .select('ProjectID, ProjectName, DesignSteps')
        .ilike('ProjectName', '%bảo tàng%');

    if (error) {
        console.error('Error fetching project:', error);
        return;
    }

    console.log(projects);
}

checkProject();
