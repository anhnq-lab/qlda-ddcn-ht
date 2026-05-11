import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const host = 'db.jkaddjllseephsiaqvds.supabase.co';

console.log('Testing direct connection to db.jkaddjllseephsiaqvds.supabase.co on port 5432...');

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
        console.log('✅ Connected successfully directly on port 5432!');
        await client.end();
    } catch (err: any) {
        console.error('❌ Error:', err.message || err);
        try { await client.end(); } catch {}
    }
}

run();
