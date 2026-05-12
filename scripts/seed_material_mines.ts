import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

const MINES_DATA = [
    {
        name: 'Mỏ đá Thạch Ngọc',
        mine_type: 'Đá',
        status: 'Đang khai thác',
        capacity: '5.2 triệu m3',
        address: 'Xã Thạch Ngọc, Huyện Thạch Hà, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.3541, lng: 105.8234 },
        notes: 'Chuyên cung cấp đá xây dựng, đá hộc, đá dăm các loại.'
    },
    {
        name: 'Mỏ đất Lưu Vĩnh Sơn',
        mine_type: 'Đất',
        status: 'Đang khai thác',
        capacity: '1.5 triệu m3',
        address: 'Xã Lưu Vĩnh Sơn, Huyện Thạch Hà, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.3215, lng: 105.8112 },
        notes: 'Mỏ đất san lấp đạt chuẩn K95, K98 phục vụ cao tốc.'
    },
    {
        name: 'Mỏ cát Sông La',
        mine_type: 'Cát',
        status: 'Đang khai thác',
        capacity: '3.0 triệu m3',
        address: 'Huyện Đức Thọ, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.5244, lng: 105.6251 },
        notes: 'Cát xây, cát trát chất lượng cao.'
    },
    {
        name: 'Mỏ đá Cẩm Lạc',
        mine_type: 'Đá',
        status: 'Quy hoạch',
        capacity: '8.0 triệu m3',
        address: 'Xã Cẩm Lạc, Huyện Cẩm Xuyên, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.1882, lng: 106.0125 },
        notes: 'Đang chờ cấp phép mở rộng.'
    },
    {
        name: 'Mỏ đất Cẩm Quan',
        mine_type: 'Đất',
        status: 'Đang khai thác',
        capacity: '2.5 triệu m3',
        address: 'Xã Cẩm Quan, Huyện Cẩm Xuyên, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.2351, lng: 105.9542 },
        notes: 'Đất san lấp phục vụ các dự án ven biển.'
    },
    {
        name: 'Mỏ đá Núi Voi',
        mine_type: 'Đá',
        status: 'Đang khai thác',
        capacity: '10.5 triệu m3',
        address: 'Xã Kỳ Tân, Huyện Kỳ Anh, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.0534, lng: 106.2751 },
        notes: 'Cung cấp đá cho khu kinh tế Vũng Áng.'
    },
    {
        name: 'Mỏ đất Kỳ Trinh',
        mine_type: 'Đất',
        status: 'Đang khai thác',
        capacity: '4.2 triệu m3',
        address: 'Phường Kỳ Trinh, Thị xã Kỳ Anh, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.0211, lng: 106.3122 },
        notes: 'Mỏ đất đồi phục vụ san nền khu công nghiệp.'
    },
    {
        name: 'Mỏ cát Sông Ngàn Sâu',
        mine_type: 'Cát',
        status: 'Đang khai thác',
        capacity: '1.2 triệu m3',
        address: 'Huyện Hương Khê, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.1567, lng: 105.7011 },
        notes: 'Cát xây dựng và san lấp.'
    },
    {
        name: 'Mỏ đá Nam Hồng',
        mine_type: 'Đá',
        status: 'Đóng cửa',
        capacity: '0',
        address: 'Phường Nam Hồng, Thị xã Hồng Lĩnh, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.5322, lng: 105.7111 },
        notes: 'Đã đóng cửa để phục hồi môi trường.'
    },
    {
        name: 'Mỏ đất Cương Gián',
        mine_type: 'Đất',
        status: 'Quy hoạch',
        capacity: '2.0 triệu m3',
        address: 'Xã Cương Gián, Huyện Nghi Xuân, Tỉnh Hà Tĩnh',
        coordinates: { lat: 18.6145, lng: 105.8231 },
        notes: 'Quy hoạch phục vụ đê điều và ven biển.'
    }
];

async function seedMaterialMines() {
    console.log('🌱 Bắt đầu seed dữ liệu mỏ vật liệu...');
    
    // Xóa dữ liệu cũ
    const { error: deleteError } = await supabase.from('material_mines').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (deleteError) {
        console.error('❌ Lỗi khi xóa dữ liệu cũ:', deleteError);
        return;
    }

    // Insert dữ liệu mới
    const { data, error } = await supabase.from('material_mines').insert(MINES_DATA).select();
    
    if (error) {
        console.error('❌ Lỗi khi insert mỏ vật liệu:', error);
    } else {
        console.log(`✅ Đã seed thành công ${data.length} mỏ vật liệu!`);
    }
}

seedMaterialMines();
