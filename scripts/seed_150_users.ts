import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceRole = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRole) {
    console.error('Thiếu cấu hình VITE_SUPABASE_URL hoặc VITE_SUPABASE_SERVICE_ROLE_KEY trong .env');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

const TOTAL_USERS = 150;
const BATCH_SIZE = 10;
const PASSWORD = 'TestUser@2026';

async function delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function seedUsers() {
    console.log(`Bắt đầu tạo ${TOTAL_USERS} tài khoản test...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 1; i <= TOTAL_USERS; i += BATCH_SIZE) {
        const batch = [];
        for (let j = 0; j < BATCH_SIZE && i + j <= TOTAL_USERS; j++) {
            const userIndex = i + j;
            const email = `testuser${userIndex}@ddcn.gov.vn`;
            
            batch.push(
                supabaseAdmin.auth.admin.createUser({
                    email: email,
                    password: PASSWORD,
                    email_confirm: true,
                    user_metadata: {
                        full_name: `Test User ${userIndex}`,
                        is_test_account: true
                    }
                }).then(({ data, error }) => {
                    if (error) {
                        // Bỏ qua lỗi nếu email đã tồn tại
                        if (error.message.includes('already registered')) {
                            successCount++;
                        } else {
                            console.error(`❌ Lỗi tạo user ${email}:`, error.message);
                            failCount++;
                        }
                    } else {
                        successCount++;
                    }
                })
            );
        }

        await Promise.all(batch);
        console.log(`Đã xử lý ${Math.min(i + BATCH_SIZE - 1, TOTAL_USERS)}/${TOTAL_USERS} users...`);
        // Chờ một chút để tránh hit API rate limit của Supabase
        await delay(500);
    }

    console.log('\n--- KẾT QUẢ BATCH IMPORT ---');
    console.log(`Tổng số: ${TOTAL_USERS}`);
    console.log(`Thành công (hoặc đã tồn tại): ${successCount}`);
    console.log(`Thất bại: ${failCount}`);
    console.log(`Mật khẩu chung cho tất cả: ${PASSWORD}`);
}

seedUsers().catch(console.error);
