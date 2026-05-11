const url = 'https://jkaddjllseephsiaqvds.supabase.co';

async function run() {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log('Status:', res.status);
    console.log('Headers:');
    res.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });
  } catch (e: any) {
    console.error('Error:', e.message || e);
  }
}

run();
