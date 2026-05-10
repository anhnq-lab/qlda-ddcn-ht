import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_ANON_KEY trong file .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedApril() {
  const month = 4;
  const year = 2026;
  
  // 1. Get all departments
  const deptCodes = ['HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV'];
  console.log(`Đã tìm thấy các phòng ban: ${deptCodes.join(', ')}`);
  
    const deptNames: Record<string, string> = {
      'HCTH': 'Phòng Hành chính - Tổng hợp',
      'KHDT': 'Phòng Kế hoạch - Dự toán',
      'KTTD': 'Phòng Kỹ thuật - Thẩm định',
      'QLDA1': 'Phòng Quản lý dự án 1',
      'QLDA2': 'Phòng Quản lý dự án 2',
      'QLDA3': 'Phòng Quản lý dự án 3',
      'PTDV': 'Phòng Phát triển dịch vụ'
    };
    
  for (const deptCode of deptCodes) {
    console.log(`\n--- Xử lý cho phòng ban: ${deptCode} ---`);
    
    // 2. Kiểm tra hoặc tạo monthly_plans cho tháng 4/2026
    let { data: existingPlan, error: checkError } = await supabase
      .from('monthly_plans')
      .select('id')
      .eq('department_code', deptCode)
      .eq('plan_month', month)
      .eq('plan_year', year)
      .single();
      
    let planId = existingPlan?.id;
    
    if (!planId) {
      console.log(`Chưa có KH tháng ${month}/${year} cho ${deptCode}, đang tạo mới...`);
      const newPlan = {
        id: uuidv4(),
        department_code: deptCode,
        department_name: deptNames[deptCode] || deptCode,
        plan_month: month,
        plan_year: year,
        status: 'draft',
        created_at: new Date().toISOString()
      };
      
      const { data: createdPlan, error: createError } = await supabase
        .from('monthly_plans')
        .insert(newPlan)
        .select()
        .single();
        
      if (createError) {
        console.error(`Lỗi tạo KH tháng cho ${deptCode}:`, createError);
        continue;
      }
      planId = createdPlan.id;
    } else {
      console.log(`Đã tồn tại KH tháng ${month}/${year} cho ${deptCode} (ID: ${planId})`);
    }
    
    // 3. Lấy annual_plan_items cho phòng ban
    const { data: annualItems, error: annualError } = await supabase
        .from('annual_plan_items')
        .select('*')
        .eq('plan_year', year)
        .eq('department_code', deptCode);
        
    if (annualError || !annualItems?.length) {
      console.log(`Không có mục KH khung nào cho ${deptCode} năm ${year}. Tạo một vài mục giả lập...`);
      // Fake items if no annual plan
      const fakeItems = [
          {
            id: uuidv4(),
            monthly_plan_id: planId,
            task_name: `Công việc thường xuyên tháng ${month} - ${deptCode}`,
            group_name: 'Công tác chuyên môn',
            status: 'planned',
            sort_order: 1,
            group_sort_order: 1
          },
          {
            id: uuidv4(),
            monthly_plan_id: planId,
            task_name: `Báo cáo kết quả tháng ${month} - ${deptCode}`,
            group_name: 'Báo cáo',
            status: 'planned',
            sort_order: 2,
            group_sort_order: 2
          }
      ];
      await supabase.from('monthly_plan_items').insert(fakeItems);
      console.log(`Đã tạo ${fakeItems.length} mục KH tháng giả lập cho ${deptCode}`);
    } else {
      // 4. Sinh từ KH khung cho tháng 4
      const { data: existingItems } = await supabase
        .from('monthly_plan_items')
        .select('annual_plan_item_id')
        .eq('monthly_plan_id', planId)
        .not('annual_plan_item_id', 'is', null);
      
      const existingIds = new Set((existingItems ?? []).map((e: any) => e.annual_plan_item_id));
      
      const toInsert = annualItems
        .filter(item => {
            if (existingIds.has(item.id)) return false;
            // quarterly: tháng 1, 4, 7, 10
            if (item.frequency === 'quarterly') {
               // Đơn giản hóa: luôn sinh nếu là tháng 4
               return month === 4;
            }
            if (item.frequency === 'monthly' || item.frequency === 'daily') return true;
            // one_time
            if (item.frequency === 'one_time') {
               const str = (item.start_period || '') + ' ' + (item.end_period || '');
               if (str.toLowerCase().includes(`tháng ${month}`)) return true;
               if (str.toLowerCase().includes(`quý ii`) && month === 4) return true;
               return true; // Fallback
            }
            return false;
        })
        .map(item => ({
            id: uuidv4(),
            monthly_plan_id: planId,
            annual_plan_item_id: item.id,
            task_name: item.task_name,
            group_name: item.group_name,
            status: 'planned',
            deadline_note: item.end_period,
            sort_order: item.sort_order || 0,
            group_sort_order: item.group_sort_order || 0,
            created_at: new Date().toISOString()
        }));
        
        if (toInsert.length > 0) {
            const { error: insertError } = await supabase.from('monthly_plan_items').insert(toInsert);
            if (insertError) {
                console.error(`Lỗi sinh KH tháng từ khung cho ${deptCode}:`, insertError);
            } else {
                console.log(`Đã sinh thành công ${toInsert.length} mục KH tháng từ KH khung cho ${deptCode}`);
            }
        } else {
            console.log(`Không có mục KH khung mới nào cần sinh cho ${deptCode}`);
        }
    }
    
    // 5. Thêm 1-2 Tasks (công việc chi tiết) gắn với KH tháng
    const { data: freshItems } = await supabase
        .from('monthly_plan_items')
        .select('id, task_name')
        .eq('monthly_plan_id', planId)
        .limit(2);
        
    if (freshItems && freshItems.length > 0) {
        console.log(`Tạo công việc (Tasks) cho phòng ${deptCode}...`);
        
        const { data: employees } = await supabase.from('employees').select('employee_id');
        const { data: projects } = await supabase.from('projects').select('project_id');

        for (const item of freshItems) {
            // Check if tasks already exist for this monthly_plan_item_id
            const { data: existingTasks } = await supabase
                .from('tasks')
                .select('id')
                .eq('metadata->>monthly_plan_item_id', item.id);
                
            if (!existingTasks || existingTasks.length === 0) {
                // Select random employee and project
                const assigneeId = employees && employees.length > 0 ? employees[Math.floor(Math.random() * employees.length)].employee_id : null;
                const approverId = employees && employees.length > 0 ? employees[Math.floor(Math.random() * employees.length)].employee_id : null;
                const projectId = projects && projects.length > 0 ? projects[Math.floor(Math.random() * projects.length)].project_id : null;

                const newTask = {
                    id: uuidv4(),
                    title: `[T.4] Thực hiện: ${item.task_name}`,
                    task_type: projectId ? 'project' : 'internal',
                    project_id: projectId,
                    metadata: {
                        monthly_plan_item_id: item.id
                    },
                    status: 'todo',
                    priority: 'medium',
                    assignee_id: assigneeId,
                    approver_id: approverId,
                    start_date: `2026-04-01T00:00:00Z`,
                    due_date: `2026-04-25T00:00:00Z`
                };
                
                const { error: taskError } = await supabase.from('tasks').insert(newTask);
                if (taskError) {
                    console.error(`Lỗi tạo task cho ${item.task_name}:`, taskError);
                } else {
                    console.log(` + Đã tạo task: ${newTask.title}`);
                }
            }
        }
    }
  }
  console.log('\n--- Hoàn tất quá trình seed dữ liệu ---');
}

seedApril().catch(console.error);
