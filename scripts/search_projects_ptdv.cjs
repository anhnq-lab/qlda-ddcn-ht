const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function search() {
  const keywords = [
    'lâm', 'liên huyện', 'cây ăn quả', 'lộc yên', 'việt đức', 'tâm thần', 
    '15b', 'trần phú', 'thạch khê', 'cẩm hưng', 'hà huy tập', 'thái mầu', 'rừng ngập mặn', 'iwmc'
  ];
  
  console.log('--- SO KHỚP DỰ ÁN PHÒNG PTDV ---');
  const { data: projects, error } = await supabase
    .from('projects')
    .select('project_id, project_name');
    
  if (error) {
    console.error(error);
    return;
  }
  
  keywords.forEach(kw => {
    console.log(`\n🔍 Tìm dự án chứa từ khóa: "${kw}"`);
    const matched = projects.filter(p => p.project_name.toLowerCase().includes(kw));
    if (matched.length > 0) {
      matched.forEach(p => {
        console.log(`  - [${p.project_id}] ${p.project_name}`);
      });
    } else {
      console.log('  - Không tìm thấy!');
    }
  });
}

search();
