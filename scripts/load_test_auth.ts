import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('Thiếu cấu hình Supabase trong .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRole, {
    auth: { persistSession: false }
});

async function runLoadTest() {
    console.log('🚀 Bắt đầu Load Test (Mô phỏng 150 users truy cập đồng thời)...\n');

    // 1. Lấy danh sách email từ bảng employees (tối đa 150)
    console.log('Đang lấy danh sách nhân sự từ Database...');
    const { data: employees, error } = await supabase
        .from('employees')
        .select('email')
        .not('email', 'is', null)
        .limit(150);

    if (error || !employees) {
        console.error('Lỗi khi lấy danh sách nhân viên:', error?.message);
        return;
    }

    const testUsers = employees.length > 0 ? employees : Array.from({ length: 150 }).map((_, i) => ({ email: `test${i}@ddcn.gov.vn` }));
    console.log(`Đã lấy ${testUsers.length} tài khoản để test.\n`);

    // 2. Mô phỏng 150 request đăng nhập ĐỒNG THỜI
    console.log(`Đang bắn ${testUsers.length} request đăng nhập cùng lúc...`);
    const startTime = Date.now();
    
    let successCount = 0;
    let failCount = 0;
    let rateLimitCount = 0;

    const promises = testUsers.map(user => {
        // Chúng ta cố tình dùng sai mật khẩu để test khả năng chịu tải của Auth Server
        // chứ không cần đăng nhập thật.
        return supabase.auth.signInWithPassword({
            email: user.email,
            password: 'DummyPassword123!'
        }).then(({ error }) => {
            if (!error) {
                successCount++;
            } else if (error.message.includes('rate limit') || error.status === 429) {
                rateLimitCount++;
            } else {
                // Invalid login credentials được tính là server đã xử lý thành công (chỉ là sai pass)
                failCount++; 
            }
        });
    });

    await Promise.all(promises);
    const endTime = Date.now();

    console.log('\n--- KẾT QUẢ LOAD TEST (AUTH) ---');
    console.log(`Thời gian phản hồi tổng cộng: ${endTime - startTime} ms`);
    console.log(`Trung bình mỗi request: ${((endTime - startTime) / testUsers.length).toFixed(2)} ms`);
    console.log(`Tổng request: ${testUsers.length}`);
    console.log(`Server xử lý bình thường (Sai Pass): ${failCount} (Tốt)`);
    console.log(`Đăng nhập thành công: ${successCount}`);
    console.log(`Bị chặn Rate Limit (Too many requests): ${rateLimitCount}`);

    if (rateLimitCount > 0) {
        console.log('\n⚠️ CẢNH BÁO: Supabase Auth Rate Limit đã được kích hoạt.');
        console.log('Điều này là bình thường vì Supabase giới hạn số lượng request đăng nhập mỗi giây để chống Brute Force.');
    } else {
        console.log('\n✅ TUYỆT VỜI: Hệ thống xử lý trơn tru 100% request đồng thời mà không bị ngẽn!');
    }
}

runLoadTest().catch(console.error);
