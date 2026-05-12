import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load env from project root
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const getRelativeDate = (dayOffset: number, hour: number, minute: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

async function seed() {
  console.log('Fetching users to assign as attendees...');
  const { data: users, error: userError } = await supabase.from('employees').select('employee_id');
  if (userError || !users || users.length === 0) {
    console.error('Error fetching users or no users found', userError);
    return;
  }
  
  const attendeeId1 = users[0].employee_id;
  const attendeeId2 = users.length > 1 ? users[1].employee_id : users[0].employee_id;
  
  // Get an auth_user_id for created_by
  const { data: accounts, error: accountError } = await supabase.from('user_accounts').select('auth_user_id').not('auth_user_id', 'is', null).limit(1);
  if (accountError || !accounts || accounts.length === 0) {
    console.error('Error fetching user accounts', accountError);
    return;
  }
  const createdBy = accounts[0].auth_user_id;

  const sampleEvents = [
    {
      title: 'Họp giao ban BQL tuần',
      description: 'Cập nhật tiến độ các dự án và kế hoạch giải ngân trong tuần.',
      event_type: 'meeting',
      room: 'Phòng họp 1',
      start_time: getRelativeDate(0, 8, 30),
      end_time: getRelativeDate(0, 11, 0),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Đi công tác kiểm tra dự án',
      description: 'Kiểm tra hiện trường dự án ĐTĐS tại thực địa.',
      event_type: 'business_trip',
      room: null,
      start_time: getRelativeDate(0, 14, 0),
      end_time: getRelativeDate(0, 17, 30),
      location: 'Hiện trường dự án ĐTĐS, xã X',
      created_by: createdBy,
    },
    {
      title: 'Đào tạo nội bộ: Quy trình QLCL mới',
      description: 'Phòng Kế hoạch tổng hợp tổ chức training quy trình mới.',
      event_type: 'internal_event',
      room: 'Phòng họp 2',
      start_time: getRelativeDate(1, 9, 0),
      end_time: getRelativeDate(1, 11, 0),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Họp kiểm điểm tiến độ giải phóng mặt bằng',
      description: 'Thành phần tham gia: Ban GĐ, Phòng QLDA 1.',
      event_type: 'meeting',
      room: 'Phòng họp 1',
      start_time: getRelativeDate(1, 14, 30),
      end_time: getRelativeDate(1, 16, 30),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Công tác UBND tỉnh',
      description: 'Báo cáo kế hoạch giải ngân vốn đầu tư công.',
      event_type: 'business_trip',
      room: null,
      start_time: getRelativeDate(2, 8, 0),
      end_time: getRelativeDate(2, 11, 30),
      location: 'UBND tỉnh Hải Dương',
      created_by: createdBy,
    },
    {
      title: 'Sinh nhật tập thể CBNV tháng',
      description: 'Tổ chức tiệc ngọt chúc mừng sinh nhật cán bộ nhân viên.',
      event_type: 'internal_event',
      room: 'Phòng họp 3',
      start_time: getRelativeDate(2, 16, 0),
      end_time: getRelativeDate(2, 17, 0),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Họp xem xét hồ sơ dự thầu',
      description: 'Gói thầu thiết bị văn phòng.',
      event_type: 'meeting',
      room: 'Phòng họp 2',
      start_time: getRelativeDate(3, 9, 0),
      end_time: getRelativeDate(3, 10, 30),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Công tác Kho bạc Nhà nước',
      description: 'Đối chiếu và chốt số liệu giải ngân tháng.',
      event_type: 'business_trip',
      room: null,
      start_time: getRelativeDate(3, 14, 0),
      end_time: getRelativeDate(3, 16, 0),
      location: 'Kho bạc Nhà nước tỉnh',
      created_by: createdBy,
    },
    {
      title: 'Họp với đơn vị tư vấn thiết kế',
      description: 'Chốt phương án thiết kế bản vẽ thi công.',
      event_type: 'meeting',
      room: 'Phòng họp 1',
      start_time: getRelativeDate(4, 8, 30),
      end_time: getRelativeDate(4, 11, 30),
      location: null,
      created_by: createdBy,
    },
    {
      title: 'Tổng vệ sinh cơ quan',
      description: 'Hoạt động dọn dẹp cuối tuần.',
      event_type: 'other',
      room: null,
      start_time: getRelativeDate(4, 16, 0),
      end_time: getRelativeDate(4, 17, 0),
      location: 'Toàn cơ quan',
      created_by: createdBy,
    }
  ];

  console.log(`Seeding ${sampleEvents.length} events...`);
  
  // Clear old events optionally? No, let's just append
  // But maybe we should clear old sample events? 
  // Let's just insert
  for (const event of sampleEvents) {
    const { data: insertedEvent, error: insertError } = await supabase
      .from('agency_events')
      .insert(event)
      .select()
      .single();
      
    if (insertError) {
      console.error('Error inserting event:', insertError);
      continue;
    }
    
    // Add attendees
    const attendees = [
      { event_id: insertedEvent.id, user_id: attendeeId1 },
      { event_id: insertedEvent.id, user_id: attendeeId2 },
    ];
    
    // Unique attendees
    const uniqueAttendees = Array.from(new Set(attendees.map(a => a.user_id)))
      .map(id => ({ event_id: insertedEvent.id, user_id: id }));

    const { error: attendeeError } = await supabase
      .from('agency_event_attendees')
      .insert(uniqueAttendees);
      
    if (attendeeError) {
      console.error(`Error adding attendees for event ${insertedEvent.id}:`, attendeeError);
    }
  }

  console.log('Seeding completed successfully!');
}

seed();
