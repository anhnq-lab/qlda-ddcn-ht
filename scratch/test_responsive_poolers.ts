import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';

const activeRegions = [
  'ap-southeast-1', // Singapore
  'us-east-1',      // Virginia
  'us-east-2',      // Ohio
  'us-west-1',      // California
  'eu-central-1',   // Frankfurt
  'sa-east-1',      // Sao Paulo
  'ap-east-1'       // Hong Kong
];

async function testRegion(region: string) {
  const host = `aws-0-${region}.pooler.supabase.com`;
  for (const port of [6543, 5432]) {
    console.log(`\nTesting: ${host}:${port} with user: postgres.${projectId}`);
    const client = new pg.Client({
      host,
      port,
      user: `postgres.${projectId}`,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 4000
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected to ${host}:${port}`);
      await client.end();
      return true;
    } catch (err: any) {
      console.log(`❌ Failed:`, err.message || err);
      try { await client.end(); } catch {}
    }
  }
  return false;
}

async function run() {
  for (const region of activeRegions) {
    const success = await testRegion(region);
    if (success) {
      console.log(`\n🎉 Found working region: ${region}`);
      process.exit(0);
    }
  }
  console.log('\n❌ None of the active regions succeeded.');
}

run();
