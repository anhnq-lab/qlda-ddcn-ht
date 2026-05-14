const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabaseUrl = 'https://jkaddjllseephsiaqvds.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprYWRkamxsc2VlcGhzaWFxdmRzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODI5ODY3MCwiZXhwIjoyMDkzODc0NjcwfQ.VJzDdr4Fy76SROCXMgjM6MXET9D6Z3Xv34X6fIhrUQU';
const supabase = createClient(supabaseUrl, supabaseKey);

const DEPARTMENT_NAMES = {
    'HCTH':  'Phòng Hành chính - Tổng hợp',
    'KHDT':  'Phòng Kế hoạch - Đấu thầu',
    'KTTD':  'Phòng Kỹ thuật - Thẩm định',
    'QLDA1': 'Phòng Quản lý dự án 1',
    'QLDA2': 'Phòng Quản lý dự án 2',
    'QLDA3': 'Phòng Quản lý dự án 3',
    'PTDV':  'Phòng Phát triển dịch vụ',
};

function getDepartmentCode(name) {
    if (!name) return 'HCTH';
    const lower = name.toLowerCase();
    for (const [code, depName] of Object.entries(DEPARTMENT_NAMES)) {
        if (lower.includes(depName.toLowerCase()) || lower.includes(code.toLowerCase())) {
            return code;
        }
    }
    if (lower.includes('hành chính') || lower.includes('tổng hợp')) return 'HCTH';
    if (lower.includes('kế hoạch') || lower.includes('đấu thầu')) return 'KHDT';
    if (lower.includes('kỹ thuật') || lower.includes('thẩm định')) return 'KTTD';
    if (lower.includes('dự án 1')) return 'QLDA1';
    if (lower.includes('dự án 2')) return 'QLDA2';
    if (lower.includes('dự án 3')) return 'QLDA3';
    if (lower.includes('phát triển') || lower.includes('dịch vụ')) return 'PTDV';
    return 'HCTH';
}

function determineFrequency(start, end) {
    const combined = ((start || '') + ' ' + (end || '')).toLowerCase();
    if (combined.includes('hàng tháng') || combined.includes('hàng tuần')) return 'monthly';
    if (combined.includes('quý')) return 'quarterly';
    if (combined.includes('khi phát sinh')) return 'as_needed';
    if (combined.includes('hàng ngày')) return 'daily';
    return 'one_time';
}

function parseRomanNumeral(str) {
    if (!str) return false;
    const s = str.toString().trim().toUpperCase();
    return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'].includes(s);
}

function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
}

function findEmployeeIds(text, allEmployees) {
    if (!text) return [];
    
    // Split text by standard separators: comma, slash, dash, plus
    const rawTokens = text.split(/[\/\,\-\+]/).map(t => t.trim()).filter(Boolean);
    const tokens = [];
    
    // Sometimes names are space-separated if no comma was used. We will keep them as tokens if they look like names.
    // For simplicity, just use the explicitly separated parts.
    for (const raw of rawTokens) {
        // e.g. "HCTH/ Lộc" -> "HCTH", "Lộc" if split by /
        const words = raw.split(/\s+/).map(w => w.trim()).filter(Boolean);
        if (words.length <= 2 && words.length > 0) {
            // "Lan Anh", "Minh"
            tokens.push(raw);
        } else {
            // "các cá nhân phối hợp" or something long
            tokens.push(raw);
        }
    }
    
    const matchedIds = new Set();
    
    for (const token of tokens) {
        // Skip department names and common noise words
        const upperToken = token.toUpperCase();
        if (['HCTH', 'KHDT', 'KTTD', 'QLDA1', 'QLDA2', 'QLDA3', 'PTDV', 'CÁC PHÒNG', 'CÁC PHÒNG LIÊN QUAN'].includes(upperToken)) continue;
        
        const searchName = removeDiacritics(token.toLowerCase());
        
        // Match logic:
        const matches = allEmployees.filter(e => {
            const eName = removeDiacritics(e.full_name.toLowerCase());
            return eName.includes(searchName) || eName.endsWith(searchName);
        });
        
        if (matches.length > 0) {
            // Prefer exact end match (like "Lộc" matches "Vũ Xuân Lộc")
            const exactEndMatches = matches.filter(e => {
                const eNameParts = removeDiacritics(e.full_name.toLowerCase()).split(' ');
                const tokenParts = searchName.split(' ');
                // Check if the last word(s) match
                const endOfName = eNameParts.slice(-tokenParts.length).join(' ');
                return endOfName === searchName;
            });
            
            if (exactEndMatches.length > 0) {
                matchedIds.add(exactEndMatches[0].employee_id);
            } else {
                matchedIds.add(matches[0].employee_id);
            }
        }
    }
    
    return Array.from(matchedIds);
}

async function run() {
    console.log('Fetching employees...');
    const { data: employees, error: empErr } = await supabase.from('employees').select('employee_id, full_name, department');
    if (empErr) {
        console.error('Failed to fetch employees:', empErr);
        return;
    }
    console.log(`Fetched ${employees.length} employees.`);

    console.log('Clearing existing annual_plan_items...');
    await supabase.from('annual_plan_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    console.log('Reading Excel file...');
    const workbook = XLSX.readFile('d:/QuocAnh/2026/01.Project/qlda-ddcn-ht/Ks/KH khung 2026  13.5.xlsx');
    
    const itemsToInsert = [];

    for (const sheetName of workbook.SheetNames) {
        console.log(`\n--- Processing Sheet: ${sheetName} ---`);
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        let currentDeptCode = null;
        let currentDeptName = null;
        let currentGroupName = null;
        let groupSortOrder = 0;
        let taskSortOrder = 0;

        for (let i = 4; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;

            const col0 = row[0];
            const col1 = row[1];

            if (parseRomanNumeral(col0)) {
                currentDeptName = col1 ? col1.toString().trim() : 'Unknown';
                currentDeptCode = getDepartmentCode(currentDeptName);
                currentGroupName = null; 
                groupSortOrder = 0;
                taskSortOrder = 0;
                console.log(`Found Department: ${currentDeptName} -> ${currentDeptCode}`);
                continue;
            }

            if ((col0 === null || col0 === undefined || col0.toString().trim() === '') && col1 && typeof col1 === 'string') {
                currentGroupName = col1.trim();
                groupSortOrder++;
                taskSortOrder = 0;
                console.log(`  Found Group: ${currentGroupName}`);
                continue;
            }

            if (col0 && col1) {
                const taskName = col1 ? col1.toString().trim() : '';
                if (!taskName) continue;
                if (taskName === 'Nội dung công việc/nhiệm vụ') continue; // header repeated

                taskSortOrder++;
                
                const respText = row[5] ? row[5].toString().trim() : null;
                const collText = row[6] ? row[6].toString().trim() : null;
                
                const responsibleIds = findEmployeeIds(respText, employees);
                const collaboratingIds = findEmployeeIds(collText, employees);

                const item = {
                    plan_year: 2026,
                    department_code: (currentDeptCode || getDepartmentCode(sheetName)).substring(0, 50),
                    department_name: currentDeptName || DEPARTMENT_NAMES[getDepartmentCode(sheetName)] || 'Khác',
                    group_name: currentGroupName,
                    group_sort_order: groupSortOrder,
                    task_name: taskName,
                    deliverable: row[2] ? row[2].toString().trim() : null,
                    start_period: row[3] ? row[3].toString().trim().substring(0, 50) : null,
                    end_period: row[4] ? row[4].toString().trim().substring(0, 50) : null,
                    frequency: determineFrequency(row[3], row[4]),
                    responsible_text: respText,
                    collaborating_text: collText,
                    responsible_ids: responsibleIds,
                    collaborating_ids: collaboratingIds,
                    notes: row[7] ? row[7].toString().trim() : null,
                    sort_order: taskSortOrder,
                    source_type: 'manual'
                };
                
                itemsToInsert.push(item);
            }
        }
    }

    console.log(`\nParsed ${itemsToInsert.length} tasks.`);
    if (itemsToInsert.length > 0) {
        console.log('Inserting into annual_plan_items...');
        let successCount = 0;
        let failCount = 0;
        
        // Insert one by one to see exactly which ones fail and ignore errors for them
        for (const item of itemsToInsert) {
            const { error } = await supabase.from('annual_plan_items').insert(item);
            if (error) {
                console.error('Insert error for task:', item.task_name, error.message);
                failCount++;
            } else {
                successCount++;
            }
        }
        console.log(`Insert completed! Success: ${successCount}, Failed: ${failCount}`);
    } else {
        console.log('No items to insert.');
    }
}

run().catch(err => console.error(err));
