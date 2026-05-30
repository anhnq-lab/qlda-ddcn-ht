// scripts/seed_one_week_logs.cjs
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const projectId = '8173865'; // Dự án Sơn Kim 1
const contractId = 'HD-SVK1-04.1'; // Hợp đồng xây dựng chính

const weekLogs = [
  {
    date: '2026-05-24', // Chủ nhật
    log: {
      weather_temp: 32,
      weather_desc: 'Nắng ráo, trời ít mây',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Ngày Chủ nhật công trường nghỉ tuần, chỉ bố trí bộ phận bảo vệ trực gác và vệ sinh công nghiệp khuôn viên.'
    },
    details: [],
    manpower: [
      { role_title: 'Bảo vệ trực ca', quantity: 3, notes: 'Trực 24/24 bảo vệ tài sản công trường' },
      { role_title: 'Nhân viên vệ sinh', quantity: 2, notes: 'Thu gom rác thải sinh hoạt' }
    ],
    equipment: []
  },
  {
    date: '2026-05-25', // Thứ hai
    log: {
      weather_temp: 33,
      weather_desc: 'Nắng đẹp, trời quang đãng',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Thi công nhộn nhịp đầu tuần, tiến độ các hạng mục chính đảm bảo kế hoạch đề ra.'
    },
    details: [
      { work_item: 'Lắp dựng cốp pha cột tầng 3 trục A-C', location: 'Tầng 3, phân khu A', work_volume: 'Lắp đặt 18 cột ván khuôn gỗ', status: 'in_progress', safety_status: 'safe' },
      { work_item: 'Gia công cốt thép dầm sàn tầng 3', location: 'Bãi gia công hiện trường', work_volume: 'Gia công 3.5 tấn thép dầm sàn', status: 'in_progress', safety_status: 'safe' },
      { work_item: 'Xây tường bao gạch không nung tầng trệt', location: 'Tầng trệt (Tầng 1)', work_volume: 'Xây 45m2 tường bao gạch ống', status: 'in_progress', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 3, notes: 'Giám sát kỹ thuật toàn diện hiện trường' },
      { role_title: 'Tổ thợ xây tô tường', quantity: 12, notes: 'Thi công xây tường tầng trệt' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 15, notes: 'Gia công lắp ráp thép dầm sàn' },
      { role_title: 'Tổ thợ ván khuôn cốp pha', quantity: 18, notes: 'Lắp dựng cột vách cốp pha tầng 3' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 8, status: 'active' },
      { equipment_name: 'Xe lu rung Hamm', quantity: 1, operating_hours: 4, status: 'active' },
      { equipment_name: 'Máy trộn bê tông 250L', quantity: 2, operating_hours: 6, status: 'active' }
    ]
  },
  {
    date: '2026-05-26', // Thứ ba
    log: {
      weather_temp: 32,
      weather_desc: 'Nhiều mây, mây rải rác',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Tập trung thi công cao độ dầm sàn tầng 3 để chuẩn bị nghiệm thu đổ bê tông.'
    },
    details: [
      { work_item: 'Lắp dựng cốt thép dầm sàn tầng 3 trục A-D', location: 'Tầng 3 dầm sàn chính', work_volume: 'Lắp ráp xong 85% cốt thép sàn', status: 'in_progress', safety_status: 'warning', safety_notes: 'Nhắc nhở 2 công nhân tổ thợ thép không cài dây đai an toàn khi thao tác mép sàn biên.' },
      { work_item: 'Xây dựng hộp gen kỹ thuật và xây tường bao tầng trệt', location: 'Tầng trệt', work_volume: 'Xây 30m2 tường gạch bao quanh', status: 'in_progress', safety_status: 'safe' },
      { work_item: 'Thi công đi ống luồn dây điện M&E âm sàn dầm tầng 3', location: 'Mặt sàn dầm tầng 3', work_volume: 'Lắp đặt 120m ống gen luồn dây điện', status: 'in_progress', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 3, notes: '' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 16, notes: 'Tập trung làm thép sàn tầng 3' },
      { role_title: 'Tổ thợ ván khuôn', quantity: 14, notes: 'Gia cố cốp pha đà giáo sàn tầng 3' },
      { role_title: 'Tổ thợ xây tô', quantity: 10, notes: 'Xây tường bao tầng trệt' },
      { role_title: 'Tổ thợ điện nước M&E', quantity: 6, notes: 'Đi ống gen âm sàn dầm' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 8, status: 'active' },
      { equipment_name: 'Máy trộn bê tông 250L', quantity: 1, operating_hours: 4, status: 'active' }
    ]
  },
  {
    date: '2026-05-27', // Thứ tư
    log: {
      weather_temp: 28,
      weather_desc: 'Mưa dông lớn vào buổi chiều',
      weather_wind: 'Gió to, lốc giật nhẹ',
      construction_status: 'delayed',
      notes: 'Buổi sáng thi công bình thường. Từ 14h00 xảy ra mưa giông rất lớn kèm sấm sét nguy hiểm, Giám sát yêu cầu toàn bộ công nhân ngừng thi công trên cao và rút về khu nhà tạm để đảm bảo an toàn.'
    },
    details: [
      { work_item: 'Hoàn thiện cốt thép dầm sàn tầng 3 chuẩn bị nghiệm thu', location: 'Mặt sàn tầng 3', work_volume: 'Lắp dựng cốt thép dầm chính sàn phụ', status: 'delayed', safety_status: 'safe', issues: 'Mưa giông lớn cản trở tiến độ đổ bê tông lùi sang ngày hôm sau.' },
      { work_item: 'Xây tường ngăn chia phòng chức năng bên trong nhà', location: 'Tầng trệt trong nhà', work_volume: 'Xây 25m2 tường ngăn trong nhà râm mát', status: 'completed', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 3, notes: 'Kiểm tra hiện trường giông sét' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 15, notes: 'Nghỉ làm việc trên cao từ 14h00' },
      { role_title: 'Tổ thợ ván khuôn', quantity: 12, notes: 'Nghỉ làm việc trên cao từ 14h00' },
      { role_title: 'Tổ thợ xây tô', quantity: 10, notes: 'Thi công trong nhà mát không bị ảnh hưởng mưa lớn' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 4, status: 'idle', notes: 'Tạm dừng hoạt động từ chiều do giông sét' }
    ]
  },
  {
    date: '2026-05-28', // Thứ năm
    log: {
      weather_temp: 31,
      weather_desc: 'Nắng nhẹ, gió mát, trời mát mẻ',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Tập trung dọn dẹp vệ sinh mặt sàn sau mưa giông hôm qua, tiến hành nghiệm thu liên ngành cốt thép cốp pha và đổ bê tông sàn tầng 3 đạt kỹ thuật.'
    },
    details: [
      { work_item: 'Đổ bê tông sàn dầm dầm sàn tầng 3 mác 350', location: 'Mặt sàn tầng 3 toàn phân khu', work_volume: 'Đổ 145m3 bê tông thương phẩm thành công', status: 'completed', safety_status: 'safe' },
      { work_item: 'Vệ sinh cốt thép, hút nước đọng cốp pha sàn tầng 3', location: 'Tầng 3 dầm sàn', work_volume: 'Dọn dẹp làm sạch toàn bộ cốp pha trước khi đổ', status: 'completed', safety_status: 'safe' },
      { work_item: 'Tưới nước bảo dưỡng tường gạch mới xây tầng trệt', location: 'Tầng trệt', work_volume: 'Bảo dưỡng 120m2 tường xây', status: 'completed', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 4, notes: 'Tăng cường 1 kỹ sư nghiệm thu đổ bê tông' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 10, notes: 'Vệ sinh căn chỉnh cốt thép lần cuối' },
      { role_title: 'Tổ đổ bê tông chuyên dụng', quantity: 22, notes: 'Đổ bê tông và đầm dùi hoàn thiện sàn' },
      { role_title: 'Tổ thợ ván khuôn', quantity: 12, notes: 'Trực xem chấn động giáo chống khi đổ bê tông' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 8, status: 'active' },
      { equipment_name: 'Xe bơm cần bê tông tự hành', quantity: 2, operating_hours: 6, status: 'active' },
      { equipment_name: 'Xe bồn bê tông tươi 10m3', quantity: 8, operating_hours: 8, status: 'active' },
      { equipment_name: 'Máy đầm dùi bê tông', quantity: 4, operating_hours: 5, status: 'active' }
    ]
  },
  {
    date: '2026-05-29', // Thứ sáu (Ghi đè/bổ sung hoàn thiện)
    log: {
      weather_temp: 33,
      weather_desc: 'Nắng nóng nhẹ, trời quang mây',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Bảo dưỡng ẩm bê tông sàn tầng 3 vừa đổ hôm qua, tiến hành định vị tim cốt cột tầng 3 để lắp dựng cốp pha thép cột tầng 3.'
    },
    details: [
      { work_item: 'Bảo dưỡng ẩm bê tông sàn tầng 3 (Tưới nước bảo dưỡng)', location: 'Bề mặt sàn tầng 3', work_volume: 'Tưới nước bảo dưỡng tuần hoàn bề mặt sàn', status: 'completed', safety_status: 'safe' },
      { work_item: 'Gia công định vị thép chờ cột tầng 3 trục A-D', location: 'Tầng 3', work_volume: 'Định vị tim cốt cột chờ 18 cột chính', status: 'in_progress', safety_status: 'safe' },
      { work_item: 'Trát tường bao trong và tường ngoài tầng trệt', location: 'Tầng trệt', work_volume: 'Tô trát hoàn thiện 65m2 tường gạch xây', status: 'in_progress', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 3, notes: 'Giám sát bảo dưỡng sàn và đo đạc trắc địa cột' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 12, notes: 'Gia công cốt sắt cột chờ' },
      { role_title: 'Tổ thợ xây tô trát', quantity: 14, notes: 'Tô trát tường tầng trệt' },
      { role_title: 'Tổ thợ ván khuôn', quantity: 8, notes: 'Tập kết cốp pha định vị chân cột' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 6, status: 'active' },
      { equipment_name: 'Máy bơm nước cao áp bảo dưỡng', quantity: 2, operating_hours: 8, status: 'active' },
      { equipment_name: 'Máy toàn đạc trắc địa Leica', quantity: 1, operating_hours: 4, status: 'active' }
    ]
  },
  {
    date: '2026-05-30', // Thứ bảy (Hôm nay)
    log: {
      weather_temp: 31,
      weather_desc: 'Nhiều mây, có mưa rào nhẹ lúc 15h00',
      weather_wind: 'Gió nhẹ',
      construction_status: 'normal',
      notes: 'Bảo dưỡng ẩm bê tông dầm sàn tầng 3 định kỳ, triển khai lắp dựng cốp pha cột tầng 3.'
    },
    details: [
      { work_item: 'Bảo dưỡng dầm sàn bê tông tầng 3 định kỳ ngày 2', location: 'Mặt dầm sàn tầng 3', work_volume: 'Tưới nước dưỡng ẩm mặt sàn', status: 'completed', safety_status: 'safe' },
      { work_item: 'Gia công lắp dựng giàn giáo, cốp pha cột tầng 3', location: 'Tầng 3 lên tầng mái', work_volume: 'Lắp dựng giàn giáo bao che ngoài tầng 3', status: 'in_progress', safety_status: 'warning', safety_notes: 'Cảnh báo tổ ván khuôn lắp giáo bao che biên ngoài cần gá thanh giằng cẩn thận.' },
      { work_item: 'Thi công xây tường ngăn bên trong tầng trệt', location: 'Tầng trệt', work_volume: 'Xây dựng 35m2 tường ngăn vệ sinh', status: 'in_progress', safety_status: 'safe' }
    ],
    manpower: [
      { role_title: 'Kỹ sư giám sát', quantity: 3, notes: '' },
      { role_title: 'Tổ thợ ván khuôn cốp pha cột', quantity: 18, notes: 'Lắp dựng giàn giáo cột vách tầng 3' },
      { role_title: 'Tổ thợ sắt cốt thép', quantity: 10, notes: 'Làm thép đai cột đứng' },
      { role_title: 'Tổ thợ xây tô', quantity: 12, notes: 'Xây tường ngăn tầng trệt' }
    ],
    equipment: [
      { equipment_name: 'Cẩu tháp trục đứng', quantity: 1, operating_hours: 8, status: 'active' },
      { equipment_name: 'Máy bơm nước cao áp bảo dưỡng', quantity: 1, operating_hours: 8, status: 'active' }
    ]
  }
];

async function seedLogs() {
  console.log('Bắt đầu chèn dữ liệu nhật ký thi công 1 tuần cho dự án Sơn Kim 1...');

  for (const item of weekLogs) {
    console.log(`\n=================== Xử lý ngày: ${item.date} ===================`);

    // 1. Check or Insert Log
    const { data: existingLog, error: fetchError } = await supabase
      .from('construction_logs')
      .select('log_id')
      .eq('project_id', projectId)
      .eq('log_date', item.date)
      .maybeSingle();

    if (fetchError) {
      console.error(`Lỗi tìm nhật ký ngày ${item.date}:`, fetchError);
      continue;
    }

    let logId;
    if (existingLog) {
      logId = existingLog.log_id;
      console.log(`Đã tồn tại nhật ký cho ngày ${item.date} (ID: ${logId}). Tiến hành cập nhật/ghi đè...`);
      
      // Update log main
      const { error: updateError } = await supabase
        .from('construction_logs')
        .update({
          weather_temp: item.log.weather_temp,
          weather_desc: item.log.weather_desc,
          weather_wind: item.log.weather_wind,
          construction_status: item.log.construction_status,
          notes: item.log.notes
        })
        .eq('log_id', logId);

      if (updateError) {
        console.error(`Lỗi cập nhật nhật ký chính ngày ${item.date}:`, updateError);
        continue;
      }
    } else {
      // Insert new log
      const { data: newLog, error: insertError } = await supabase
        .from('construction_logs')
        .insert({
          project_id: projectId,
          log_date: item.date,
          weather_temp: item.log.weather_temp,
          weather_desc: item.log.weather_desc,
          weather_wind: item.log.weather_wind,
          construction_status: item.log.construction_status,
          notes: item.log.notes
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Lỗi thêm nhật ký chính ngày ${item.date}:`, insertError);
        continue;
      }
      logId = newLog.log_id;
      console.log(`Đã thêm mới nhật ký chính ngày ${item.date} (ID: ${logId})`);
    }

    // Clear existing detail rows for this day to perform clean upserts
    await Promise.all([
      supabase.from('construction_log_details').delete().eq('log_id', logId),
      supabase.from('construction_manpower').delete().eq('log_id', logId),
      supabase.from('construction_equipment').delete().eq('log_id', logId)
    ]);

    // 2. Insert Details
    if (item.details.length > 0) {
      const detailsRows = item.details.map(d => ({
        log_id: logId,
        contract_id: contractId,
        work_item: d.work_item,
        location: d.location,
        work_volume: d.work_volume,
        status: d.status,
        safety_status: d.safety_status,
        safety_notes: d.safety_notes || null,
        issues: d.issues || null
      }));

      const { error: detErr } = await supabase.from('construction_log_details').insert(detailsRows);
      if (detErr) console.error(`Lỗi chèn chi tiết thi công ngày ${item.date}:`, detErr);
      else console.log(`Đã chèn ${item.details.length} chi tiết thi công.`);
    }

    // 3. Insert Manpower
    if (item.manpower.length > 0) {
      const manpowerRows = item.manpower.map(m => ({
        log_id: logId,
        role_title: m.role_title,
        quantity: m.quantity,
        notes: m.notes || null
      }));

      const { error: manErr } = await supabase.from('construction_manpower').insert(manpowerRows);
      if (manErr) console.error(`Lỗi chèn nhân lực ngày ${item.date}:`, manErr);
      else console.log(`Đã chèn ${item.manpower.length} tổ đội nhân lực.`);
    }

    // 4. Insert Equipment
    if (item.equipment.length > 0) {
      const equipRows = item.equipment.map(e => ({
        log_id: logId,
        equipment_name: e.equipment_name,
        quantity: e.quantity,
        operating_hours: e.operating_hours,
        status: e.status,
        notes: e.notes || null
      }));

      const { error: eqErr } = await supabase.from('construction_equipment').insert(equipRows);
      if (eqErr) console.error(`Lỗi chèn máy móc ngày ${item.date}:`, eqErr);
      else console.log(`Đã chèn ${item.equipment.length} máy móc thiết bị.`);
    }
  }

  console.log('\n=================== HOÀN THÀNH ===================');
  console.log('Chúc mừng! Đã bổ sung thành công dữ liệu nhật ký thi công 1 tuần liên tục (từ 24/05 đến 30/05/2026) cho dự án Sơn Kim 1.');
}

seedLogs();
