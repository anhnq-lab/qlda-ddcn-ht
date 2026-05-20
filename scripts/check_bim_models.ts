import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!);

async function checkBimModels() {
  console.log('--- BIM MODELS DATABASE RECORDS ---');
  const { data: models, error: dbError } = await supabase.from('bim_models').select('*');
  if (dbError) {
    console.error('Error fetching bim_models:', dbError);
    return;
  }
  
  if (!models || models.length === 0) {
    console.log('No BIM models found in the database.');
  } else {
    console.table(models.map(m => ({
      id: m.id,
      project_id: m.project_id,
      file_name: m.file_name,
      file_size_MB: m.file_size ? (m.file_size / 1024 / 1024).toFixed(2) : 'N/A',
      discipline: m.discipline,
      status: m.status,
      has_ifc_path: !!m.ifc_path,
      has_frag_path: !!m.frag_path,
      has_properties_path: !!m.properties_path,
      error_message: m.error_message || ''
    })));
  }

  console.log('\n--- BUCKETS LIST ---');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  if (bucketsError) {
    console.error('Error listing buckets:', bucketsError);
  } else {
    console.log('Available buckets:', buckets.map(b => b.name));
  }

  console.log('\n--- FILES IN bim-models BUCKET ---');
  // List files recursively in bim-models bucket
  const { data: files, error: filesError } = await supabase.storage.from('bim-models').list('', { limit: 100 });
  if (filesError) {
    console.error('Error listing files in bim-models bucket:', filesError);
  } else {
    console.log('Root folder contents:');
    console.table(files.map(f => ({
      name: f.name,
      id: f.id,
      size_MB: (f.metadata?.size / 1024 / 1024).toFixed(2),
      created_at: f.created_at
    })));

    // Try to list folders (projects) and files inside
    for (const folder of files.filter(f => !f.metadata)) {
      console.log(`\nContents of folder: ${folder.name}`);
      const { data: subFiles, error: subFilesError } = await supabase.storage.from('bim-models').list(folder.name);
      if (subFilesError) {
        console.error(`Error listing folder ${folder.name}:`, subFilesError);
      } else if (subFiles) {
        console.table(subFiles.map(f => ({
          name: f.name,
          size_MB: (f.metadata?.size / 1024 / 1024).toFixed(2),
          created_at: f.created_at
        })));
      }
    }
  }
}

checkBimModels();
