import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';

const regions = [
    'ap-southeast-1', // Singapore
    'ap-southeast-2', // Sydney
    'ap-southeast-3', // Jakarta
    'ap-southeast-4', // Melbourne
    'ap-southeast-5', // Malaysia
    'ap-southeast-6', // Thailand
    'ap-northeast-1', // Tokyo
    'ap-northeast-2', // Seoul
    'ap-northeast-3', // Osaka
    'ap-east-1',      // Hong Kong
    'ap-south-1',     // Mumbai
    'ap-south-2',     // Hyderabad
    'us-east-1',      // N. Virginia
    'us-east-2',      // Ohio
    'us-west-1',      // N. California
    'us-west-2',      // Oregon
    'eu-west-1',      // Ireland
    'eu-west-2',      // London
    'eu-west-3',      // Paris
    'eu-central-1',    // Frankfurt
    'eu-central-2',    // Zurich
    'eu-south-1',     // Milan
    'eu-south-2',     // Spain
    'eu-north-1',     // Stockholm
    'ca-central-1',   // Canada (Central)
    'ca-west-1',      // Canada (West)
    'me-south-1',     // Bahrain
    'me-central-1',   // UAE
    'af-south-1',     // Cape Town
    'sa-east-1'       // São Paulo
];

async function testRegion(region: string): Promise<boolean> {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const client = new pg.Client({
        host: host,
        port: 6543,
        user: `postgres.${projectId}`,
        password: password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 4000
    });

    try {
        await client.connect();
        console.log(`🎉 SUCCESS: Connected to database in region [${region}]!`);
        await client.end();
        return true;
    } catch (err: any) {
        const msg = err.message || '';
        if (msg.includes('Tenant or user not found') || msg.includes('tenant/user') && msg.includes('not found')) {
            // These mean the region is wrong, but the pooler responded.
            // Let's print a quiet log.
            console.log(`❌ [${region}] is not correct (${msg.trim()})`);
        } else {
            console.log(`⚠️ [${region}] other error: ${msg.trim()}`);
        }
        try { await client.end(); } catch {}
        return false;
    }
}

async function run() {
    console.log(`Scanning ${regions.length} regions for project ${projectId}...`);
    for (const region of regions) {
        try {
            const success = await testRegion(region);
            if (success) {
                console.log(`\nFound correct region: ${region}`);
                process.exit(0);
            }
        } catch (e: any) {
            console.log(`Error testing ${region}:`, e.message);
        }
    }
    console.log('\n❌ None of the regions succeeded.');
}

run();
