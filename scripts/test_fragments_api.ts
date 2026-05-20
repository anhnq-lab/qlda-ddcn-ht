import * as OBC from '@thatopen/components';

async function test() {
  const components = new OBC.Components();
  const fragments = components.get(OBC.FragmentsManager);
  
  // We can just call init with a mock worker url or actual worker url
  // to avoid initialization error, or check if fragments has a load property.
  console.log('Does fragments have load?', 'load' in fragments);
  console.log('Type of fragments.load:', typeof (fragments as any).load);
  
  try {
    const workerUrl = 'http://localhost/mock-worker.js';
    await fragments.init(workerUrl);
    console.log('After init, core is initialized:', !!fragments.core);
    console.log('Does fragments have load after init?', 'load' in fragments);
    console.log('Type of fragments.load after init:', typeof (fragments as any).load);
    
    // Check if we can load using fragments.load or fragments.core.load
    console.log('Does core have load?', 'load' in fragments.core);
    console.log('Type of core.load:', typeof (fragments.core as any).load);
  } catch (err: any) {
    console.log('Init error:', err.message);
  }
}

test();
