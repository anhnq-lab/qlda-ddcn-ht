import pg from 'pg';

const password = process.env.SUPABASE_DB_PASSWORD || 'Ewrxd0UuYgjwXgVG';
const host = 'db.jkaddjllseephsiaqvds.supabase.co';

const configs = [
  { host, port: 6543, user: 'postgres' },
  { host, port: 6543, user: 'postgres.jkaddjllseephsiaqvds' },
];

async function testConfig(config: any, index: number) {
  console.log(`\nTesting: Host: ${config.host}, Port: ${config.port}, User: ${config.user}`);
  const client = new pg.Client({
    host: config.host,
    port: config.port,
    user: config.user,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 5000
  });

  try {
    await client.connect();
    console.log(`🎉 SUCCESS! Config [${index + 1}] connected successfully!`);
    await client.end();
    return true;
  } catch (err: any) {
    console.log(`❌ Config [${index + 1}] failed:`, err.message || err);
    try { await client.end(); } catch {}
    return false;
  }
}

async function run() {
  for (let i = 0; i < configs.length; i++) {
    const success = await testConfig(configs[i], i);
    if (success) {
      console.log('\nFound working config!');
      process.exit(0);
    }
  }
  console.log('\n❌ None of the configs succeeded.');
}

run();
