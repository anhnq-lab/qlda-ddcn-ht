import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkaddjllseephsiaqvds.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryAll() {
  const { data: events, error } = await supabase
    .from('agency_events')
    .select('*');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Total events: ${events.length}`);
  console.log(JSON.stringify(events.map(e => ({ title: e.title, start: e.start_time, end: e.end_time, type: e.event_type })), null, 2));
}

queryAll();
