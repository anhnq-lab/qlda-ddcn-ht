import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';
const host = 'aws-0-ap-northeast-2.pooler.supabase.com';

console.log('Testing connection to Seoul pooler on port 5432...');

const client = new pg.Client({
    host: host,
    port: 5432,
    user: `postgres.${projectId}`,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('✅ Connected successfully to port 5432!');
        await client.end();
    } catch (err: any) {
        console.error('❌ Error:', err.message || err);
        try { await client.end(); } catch {}
    }
}

run();
