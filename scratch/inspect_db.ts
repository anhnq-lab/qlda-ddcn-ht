import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';
const host = 'aws-0-ap-southeast-1.pooler.supabase.com';

console.log('Connecting to PostgreSQL Pooler (Singapore) using individual parameters...');
console.log('Host:', host);
console.log('User:', `postgres.${projectId}`);

const client = new pg.Client({
    host: host,
    port: 6543,
    user: `postgres.${projectId}`,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false } // Bypass certificate checks
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected to database successfully!');

        console.log('\n--- Listing all schemas ---');
        const schemaRes = await client.query(`
            SELECT schema_name 
            FROM information_schema.schemata 
            WHERE schema_name NOT LIKE 'pg_%' AND schema_name != 'information_schema';
        `);
        console.log(schemaRes.rows.map(r => r.schema_name));

        console.log('\n--- Listing all tables in public schema ---');
        const tableRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
        `);
        if (tableRes.rows.length === 0) {
            console.log('No tables found in public schema. Database is EMPTY!');
        } else {
            console.log('Found tables:', tableRes.rows.map(r => r.table_name));
        }

    } catch (err) {
        console.error('❌ Connection or query error:', err);
    } finally {
        await client.end();
    }
}

run();
