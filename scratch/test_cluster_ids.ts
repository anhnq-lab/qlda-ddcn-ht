import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const projectId = 'jkaddjllseephsiaqvds';

async function testClusterId(clusterId: number) {
  const host = `aws-${clusterId}-ap-southeast-1.pooler.supabase.com`;
  for (const port of [6543, 5432]) {
    console.log(`Testing Host: ${host}:${port}...`);
    const client = new pg.Client({
      host,
      port,
      user: `postgres.${projectId}`,
      password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 3000
    });

    try {
      await client.connect();
      console.log(`🎉 SUCCESS! Connected to cluster ${clusterId} on port ${port}!`);
      await client.end();
      return true;
    } catch (err: any) {
      console.log(`❌ Cluster ${clusterId}:${port} failed:`, err.message || err);
      try { await client.end(); } catch {}
    }
  }
  return false;
}

async function run() {
  for (let c = 0; c <= 5; c++) {
    const success = await testClusterId(c);
    if (success) {
      console.log(`\n🎉 Found working cluster ID: ${c}`);
      process.exit(0);
    }
  }
  console.log('\n❌ None of the clusters succeeded.');
}

run();
