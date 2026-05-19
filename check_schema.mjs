import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jkaddjllseephsiaqvds.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  console.log('Checking contractors table schema...')
  const { data, error } = await supabase
    .from('contractors')
    .select('contractor_type')
    .limit(1)

  console.log('Data:', data)
  console.log('Error:', error)
}
run()
