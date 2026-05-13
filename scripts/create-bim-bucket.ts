import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createBucket() {
  console.log('Creating bucket bim-models...');
  
  // Create bucket
  const { data, error } = await supabaseAdmin.storage.createBucket('bim-models', {
    public: true
    // omitted fileSizeLimit to avoid 413 error
  });
  
  if (error) {
    if (error.message.includes('already exists') || error.message.includes('duplicate key value')) {
      console.log('Bucket already exists or duplicate. Attempting to update it to be public...');
      const { data: updateData, error: updateError } = await supabaseAdmin.storage.updateBucket('bim-models', {
        public: true
      });
      if (updateError) console.error('Error updating bucket:', updateError);
      else console.log('Bucket updated successfully:', updateData);
    } else {
      console.error('Error creating bucket:', error);
    }
  } else {
    console.log('Bucket created successfully:', data);
  }
}

createBucket();
