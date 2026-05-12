import fs from 'fs';

const data = JSON.parse(fs.readFileSync('scratch/excel_dump.json', 'utf-8'));
const sheet = data['Sheet1'];

let markdown = '# Bảng Tổng Hợp Thông Tin Cập Nhật Dự Án\n';
markdown += 'Dưới đây là các thông tin được trích xuất theo các cột bạn đã khoanh đỏ. Tổng mức đầu tư và Lũy kế nguồn vốn đã được chuyển đổi từ triệu đồng sang đồng (x 1,000,000).\n\n';
markdown += '| TT | Mã Dự án | Số QĐ ban hành | Tổng mức đầu tư (VNĐ) | Quy mô | Thời gian thực hiện | Lũy kế nguồn vốn đến 31/12/2025 (VNĐ) |\n';
markdown += '|---|---|---|---|---|---|---|\n';

for (let i = 3; i < sheet.length; i++) {
    const row = sheet[i];
    if (!row || row.length === 0) continue;
    
    const tt = row[0] ? row[0].toString().trim() : '';
    const maDuAn = row[2] ? row[2].toString().trim() : '';
    
    let soQD = row[4] ? row[4].toString().trim().replace(/\n/g, ' ') : '';
    let tmdtStr = row[5] ? row[5].toString().trim() : '';
    let quyMo = row[6] ? row[6].toString().trim().replace(/\n/g, ' ') : '';
    let thoiGian = row[7] ? row[7].toString().trim().replace(/\n/g, ' ') : '';
    let luyKeStr = row[8] ? row[8].toString().trim() : '';

    if (quyMo.length > 100) {
        quyMo = quyMo.substring(0, 100) + '...';
    }

    // Process numbers (remove commas, multiply by 1000000)
    let tmdt = '';
    if (tmdtStr) {
        const val = parseFloat(tmdtStr.replace(/,/g, ''));
        if (!isNaN(val)) {
            tmdt = new Intl.NumberFormat('vi-VN').format(val * 1000000);
        } else {
            tmdt = tmdtStr;
        }
    }

    let luyKe = '';
    if (luyKeStr) {
        const val = parseFloat(luyKeStr.replace(/,/g, ''));
        if (!isNaN(val)) {
            luyKe = new Intl.NumberFormat('vi-VN').format(val * 1000000);
        } else {
            luyKe = luyKeStr;
        }
    }

    // Only include rows that have a Tabmis project code
    if (maDuAn && maDuAn.length > 0) {
        markdown += `| ${tt} | ${maDuAn} | ${soQD} | ${tmdt} | ${quyMo} | ${thoiGian} | ${luyKe} |\n`;
    }
}

markdown += '\n> [!NOTE]\n> Các số tiền đã được nhân thêm 1,000,000 để chuyển đổi từ đơn vị Triệu đồng sang Đồng (VNĐ). Bạn xem qua thông tin đã chính xác chưa nhé.\n';

fs.writeFileSync('C:/Users/Personal/.gemini/antigravity/brain/6772bc2e-a9e5-4d65-b617-0bbfe6d05ec9/project_update_preview.md', markdown);
console.log('Markdown table generated.');
