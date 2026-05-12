import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/excel_dump.json', 'utf-8'));
const sheet = data['Sheet1'];

let markdown = '| TT | Mã Dự án | Tên Dự án | Tổng mức ĐT | Tình hình thực hiện | Đề xuất xử lý |\n';
markdown += '|---|---|---|---|---|---|\n';

for (let i = 3; i < sheet.length; i++) {
    const row = sheet[i];
    if (!row || row.length === 0) continue;
    
    const tt = row[0] ? row[0].toString().trim() : '';
    const tenDuAn = row[1] ? row[1].toString().trim().replace(/\n/g, ' ') : '';
    const maDuAn = row[2] ? row[2].toString().trim() : '';
    const tmdt = row[5] ? row[5].toString().trim() : '';
    const tinhHinh = row[9] ? row[9].toString().trim().replace(/\n/g, ' ') : '';
    const deXuat = row[11] ? row[11].toString().trim().replace(/\n/g, ' ') : '';

    // Only include rows that look like project entries (e.g. have a code or look like a specific project)
    if (tt.match(/^[0-9]+\.[0-9]+$/) || (maDuAn && maDuAn.length > 0)) {
        markdown += `| ${tt} | ${maDuAn} | ${tenDuAn} | ${tmdt} | ${tinhHinh.substring(0, 100)}${tinhHinh.length > 100 ? '...' : ''} | ${deXuat} |\n`;
    }
}

fs.writeFileSync('scratch/project_table.md', markdown);
console.log('Markdown table generated at scratch/project_table.md');
