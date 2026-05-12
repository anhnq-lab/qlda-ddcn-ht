import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL as string,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY as string
);

const locations = [
  { keywords: ['Đức Thọ', 'Đức Lạng', 'Tân Hương', 'Đức Dũng', 'Đức Đồng', 'Đức Lâm', 'Bùi La Nhân'], lat: 18.490, lng: 105.650 },
  { keywords: ['Thạch Hà', 'Thạch Kim', 'Thạch Châu', 'Thạch Mỹ', 'Thạch Bằng'], lat: 18.330, lng: 105.880 }, // Note Thach Kim/Chau are Loc Ha but we'll approximate
  { keywords: ['Lộc Hà', 'Lộc Yên', 'Thạch Kim', 'Thạch Châu'], lat: 18.450, lng: 105.900 },
  { keywords: ['Cẩm Xuyên', 'Cẩm Bình', 'Cẩm Thành', 'Cẩm Quang'], lat: 18.230, lng: 106.010 },
  { keywords: ['Kỳ Anh', 'Kỳ Châu', 'Kỳ Hải', 'Kỳ Hưng', 'Vũng Áng'], lat: 18.060, lng: 106.300 },
  { keywords: ['Vũ Quang', 'Đức Lĩnh', 'Ân Phú'], lat: 18.370, lng: 105.470 },
  { keywords: ['Hương Khê', 'Hòa Hải', 'Hương Thủy', 'Lộc Yên', 'Hương Trà'], lat: 18.210, lng: 105.700 },
  { keywords: ['Hương Sơn', 'Sơn Diệm', 'Sơn Kim', 'Sơn Tây'], lat: 18.470, lng: 105.350 },
  { keywords: ['Nghi Xuân', 'Xuân Thành', 'Xuân An', 'Xuân Hải', 'Tiên Điền'], lat: 18.630, lng: 105.770 },
  { keywords: ['Can Lộc', 'Nghèn', 'Đồng Lộc', 'Thiên Lộc'], lat: 18.400, lng: 105.790 },
  { keywords: ['Hồng Lĩnh', 'Trung Lương', 'Đức Thuận'], lat: 18.520, lng: 105.710 },
  { keywords: ['TP Hà Tĩnh', 'Thành phố Hà Tĩnh', 'Thạch Quý', 'Trần Phú', 'Bắc Hà', 'Nam Hà'], lat: 18.342, lng: 105.904 },
  { keywords: ['Hà Tĩnh'], lat: 18.3333, lng: 105.9000 }, // Fallback for general Ha Tinh
];

// Helper to add slight randomness to coordinates so pins don't overlap completely
function addJitter(val: number) {
  const jitter = (Math.random() - 0.5) * 0.04; // roughly up to ~2-3km
  return val + jitter;
}

async function run() {
  const { data, error } = await supabase
    .from('projects')
    .select('project_id, project_name, coordinates');
    
  if (error) {
    console.error('Error fetching projects:', error);
    return;
  }
  
  let updatedCount = 0;

  for (const p of data) {
    // We only update if coordinates are null or missing
    if (p.coordinates) continue;

    let matchedLoc = null;
    const pName = p.project_name.toLowerCase();

    for (const loc of locations) {
      if (loc.keywords.some(kw => pName.includes(kw.toLowerCase()))) {
        matchedLoc = loc;
        break; // Take the first match
      }
    }

    if (matchedLoc) {
      const coords = {
        lat: Number(addJitter(matchedLoc.lat).toFixed(5)),
        lng: Number(addJitter(matchedLoc.lng).toFixed(5))
      };

      console.log(`Matching [${p.project_id}] ${p.project_name} -> ${matchedLoc.keywords[0]}`, coords);

      const { error: updateError } = await supabase
        .from('projects')
        .update({ coordinates: coords })
        .eq('project_id', p.project_id);

      if (updateError) {
        console.error(`Failed to update ${p.project_id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Successfully updated ${updatedCount} projects.`);
}

run();
