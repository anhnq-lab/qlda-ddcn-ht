const { Client } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const client = new Client({
  host: 'db.jkaddjllseephsiaqvds.supabase.co',
  port: 5432,
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('Connected!');

  await client.query(`
    ALTER TABLE public.bidding_packages 
    ADD COLUMN IF NOT EXISTS plan_id character varying(50) REFERENCES public.procurement_plans(plan_id) ON DELETE SET NULL;
  `);
  console.log('Added plan_id column');

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_bidding_packages_plan_id ON public.bidding_packages(plan_id);
  `);
  console.log('Added index');

  await client.end();
}
run().catch(console.error);
