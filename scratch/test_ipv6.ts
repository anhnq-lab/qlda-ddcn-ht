import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const host = '2406:da12:557:f803:a29f:f219:189a:5d12'; // Direct IPv6 address for db.jkaddjllseephsiaqvds.supabase.co

console.log('Connecting to PostgreSQL directly via IPv6 address...');
console.log('Host:', host);

const client = new pg.Client({
    host: host,
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected directly to database via IPv6!');

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

    } catch (err: any) {
        console.error('❌ Connection or query error:', err.message || err);
    } finally {
        await client.end();
    }
}

run();
