const { Client } = require('pg');
const fs = require('fs');

async function run() {
    const client = new Client({
        connectionString: 'postgres://postgres.jkaddjllseephsiaqvds:Ewrxd0UuYgjwXgVG@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres'
    });
    
    try {
        await client.connect();
        console.log('Connected to DB');
        const sql = fs.readFileSync('supabase/migrations/20260518110000_update_contractors_schema.sql', 'utf-8');
        await client.query(sql);
        console.log('Migration executed successfully.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

run();
