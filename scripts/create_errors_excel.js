import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const errorsJsonPath = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/scratch/audit_errors.json';
const outputExcelPath = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/docs/bao_cao_loi_logic_so_lieu.xlsx';

async function createExcelReport() {
  if (!fs.existsSync(errorsJsonPath)) {
    console.error('Audit errors JSON file not found.');
    return;
  }

  const rawData = JSON.parse(fs.readFileSync(errorsJsonPath, 'utf8'));
  
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Danh sách sai lệch số liệu');

  // Configure sheet view (show grid lines)
  worksheet.views = [{ showGridLines: true, state: 'frozen', ySplit: 1 }];

  // Define Columns
  worksheet.columns = [
    { header: 'STT', key: 'stt', width: 6 },
    { header: 'Dòng Excel Gốc', key: 'row', width: 16 },
    { header: 'Phụ lục', key: 'sheet', width: 12 },
    { header: 'Địa bàn (Huyện)', key: 'district', width: 20 },
    { header: 'Tên Dự án', key: 'name', width: 50 },
    { header: 'Phân loại lỗi', key: 'type', width: 28 },
    { header: 'Chi tiết sai lệch số liệu', key: 'detail', width: 65 }
  ];

  let stt = 1;

  // Process PL03 Errors
  if (rawData.PL03) {
    rawData.PL03.forEach(err => {
      // Exclude placeholder index row 8
      if (err.name === '2') return;
      worksheet.addRow({
        stt: stt++,
        row: err.row,
        sheet: 'PL03 (Hoàn thành)',
        district: err.district,
        name: err.name,
        type: err.type,
        detail: err.detail
      });
    });
  }

  // Process PL04 Errors
  if (rawData.PL04) {
    rawData.PL04.forEach(err => {
      // Exclude placeholder index row 9
      if (err.name === '2') return;
      worksheet.addRow({
        stt: stt++,
        row: err.row,
        sheet: 'PL04 (Thi công)',
        district: err.district,
        name: err.name,
        type: err.type,
        detail: err.detail
      });
    });
  }

  // Header Styling (Midnight Navy Theme)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '1F2937' } // Charcoal Dark Gray
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: '4B5563' } },
      bottom: { style: 'medium', color: { argb: '111827' } },
      left: { style: 'thin', color: { argb: '4B5563' } },
      right: { style: 'thin', color: { argb: '4B5563' } }
    };
  });

  // Cell Borders
  const thinBorder = {
    top: { style: 'thin', color: { argb: 'E5E7EB' } },
    bottom: { style: 'thin', color: { argb: 'E5E7EB' } },
    left: { style: 'thin', color: { argb: 'E5E7EB' } },
    right: { style: 'thin', color: { argb: 'E5E7EB' } }
  };

  // Data Styling
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header

    row.height = 24;
    
    // Auto-align and style cells
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 10 };
      cell.border = thinBorder;
      
      // Zebra striping for readability
      if (rowNumber % 2 === 0) {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'F9FAFB' }
        };
      }

      // Column alignments
      if (colNumber === 1 || colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else if (colNumber === 4 || colNumber === 6) {
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }

      // Apply badge colors for Error Types
      if (colNumber === 6) {
        const val = String(cell.value);
        if (val.includes('Giải ngân vượt')) {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'DC2626' } }; // Red
        } else if (val.includes('Vốn vượt')) {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'D97706' } }; // Amber
        } else if (val.includes('Cộng nguồn lệch')) {
          cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '2563EB' } }; // Blue
        }
      }
    });
  });

  // Enable Auto Filter
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: 7 }
  };

  try {
    await workbook.xlsx.writeFile(outputExcelPath);
    console.log(`Successfully generated styled Excel report at ${outputExcelPath}`);
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn(`[WARNING] Không thể lưu file báo cáo lỗi Excel tại: ${outputExcelPath}. Lý do: File đang được mở bởi ứng dụng khác (Excel). Hãy đóng file này và chạy lại script.`);
    } else {
      console.error(`[ERROR] Không thể ghi file tại ${outputExcelPath}:`, err);
    }
  }

  // Write to Brain Artifacts folder if available
  const brainDir = 'C:/Users/Personal/.gemini/antigravity/brain/55c485e0-2d68-4662-a5eb-f6428b745fe6';
  if (fs.existsSync(brainDir)) {
    const brainExcelPath = path.join(brainDir, 'bao_cao_loi_logic_so_lieu.xlsx');
    try {
      await workbook.xlsx.writeFile(brainExcelPath);
      console.log(`Successfully copied Excel report to Brain folder: ${brainExcelPath}`);
    } catch (err) {
      console.error(`[ERROR] Không thể ghi file tại Brain folder ${brainExcelPath}:`, err);
    }
  }
}

createExcelReport();

