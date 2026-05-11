import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';

const regions = [
    'ap-southeast-1', // Singapore
    'ap-southeast-2', // Sydney
    'ap-northeast-1', // Tokyo
    'ap-northeast-2', // Seoul
    'ap-south-1',     // Mumbai
    'us-east-1',      // N. Virginia
    'us-east-2',      // Ohio
    'us-west-1',      // N. California
    'us-west-2',      // Oregon
    'eu-west-1',      // Ireland
    'eu-central-1',    // Frankfurt
    'sa-east-1'       // São Paulo
];

async function testRegion(region: string): Promise<boolean> {
    const host = `aws-0-${region}.pooler.supabase.com`;
    console.log(`Testing region [${region}] at ${host}...`);
    const client = new pg.Client({
        host: host,
        port: 6543,
        user: `postgres.${projectId}`,
        password: password,
        database: 'postgres',
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000
    });

    try {
        await client.connect();
        console.log(`🎉 SUCCESS: Connected to database in region [${region}]!`);
        await client.end();
        return true;
    } catch (err: any) {
        if (err.message && err.message.includes('Tenant or user not found')) {
            console.log(`❌ Region [${region}] is NOT correct (Tenant or user not found).`);
        } else {
            console.log(`⚠️ Region [${region}] error:`, err.message || err);
        }
        try { await client.end(); } catch {}
        return false;
    }
}

async function run() {
    for (const region of regions) {
        const success = await testRegion(region);
        if (success) {
            console.log(`\nFound correct region: ${region}`);
            process.exit(0);
        }
    }
    console.log('\n❌ None of the tested regions succeeded.');
}

run();
