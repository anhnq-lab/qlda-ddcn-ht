import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';

const filePath = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/Ks/28.5.26 BC  dự án các huyện chuyển về.xlsx';
const backupPath = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/Ks/28.5.26 BC  dự án các huyện chuyển về_backup.xlsx';
const errorsJsonPath = 'd:/QuocAnh/2026/01.Project/qlda-ddcn-ht/scratch/audit_errors.json';

const getStr = (val) => (val !== null && val !== undefined) ? String(val).trim() : '';

// Fixed parseNum function that supports ExcelJS formula/sharedFormula objects
function parseNum(val, limit = null) {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') return val;
  if (typeof val === 'object') {
    if (val.result !== undefined && val.result !== null) {
      return parseNum(val.result, limit);
    }
    return 0;
  }
  let str = String(val).trim().replace(/\s+/g, '');
  if (str === '-' || str === '') return 0;
  
  if (str.includes(',') && str.includes('.')) {
    const firstComma = str.indexOf(',');
    const firstDot = str.indexOf('.');
    if (firstComma < firstDot) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    }
    return parseFloat(str) || 0;
  }
  
  if (str.includes(',') && !str.includes('.')) {
    const parts = str.split(',');
    if (parts.length === 2) {
      const valWithDot = parseFloat(str.replace(/,/g, '.'));
      const valStrip = parseFloat(str.replace(/,/g, ''));
      if (limit !== null && valStrip > limit * 1.5) {
        return valWithDot;
      }
      return valWithDot;
    }
  }
  
  return parseFloat(str) || 0;
}

async function colorErrors() {
  // 1. Restore clean state from backup copy first, to clear any leftover yellow cells
  if (!fs.existsSync(backupPath)) {
    throw new Error(`Backup file not found at: ${backupPath}`);
  }
  fs.copyFileSync(backupPath, filePath);
  console.log(`Restored clean workbook from backup: ${filePath}`);

  // 2. Read the workbook
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);

  // Color styling: premium soft pastel yellow fill
  const yellowFill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FEF08A' } // Tailwind yellow-200 (soft light yellow)
  };

  // Sheet PL03
  const sheet03 = workbook.getWorksheet('PL03');
  if (sheet03) {
    console.log('Auditing and coloring PL03...');
    let currentDistrict = 'Chưa phân loại';
    let coloredCount = 0;

    sheet03.eachRow((row, rowNumber) => {
      if (rowNumber <= 7) return; // Skip headers

      const col0 = getStr(row.getCell(1).value);
      const col1 = getStr(row.getCell(2).value);
      const col2 = getStr(row.getCell(3).value); // Mã dự án
      const col4 = getStr(row.getCell(5).value); // Quyết định đầu tư

      if (col0 && /^[IVXLCDM]+$/.test(col0) && col1 && !row.getCell(3).value) {
        currentDistrict = col1;
        return;
      }

      const isProjectRow = col0 && (
        /^\d+$/.test(col0) || 
        /^\d+\.\d+$/.test(col0) || 
        /^[I|V|X]+\.\d+$/.test(col0) || 
        (col1 && !col0 && row.getCell(3).value)
      );

      if (isProjectRow && !/Tổng/i.test(col1) && !/Cộng/i.test(col1)) {
        if (col1 === '2') return; // Skip placeholder row index
        
        let hasError = false;

        const tmdt = parseNum(row.getCell(6).value); // Col F (TMDT)
        const allocated = parseNum(row.getCell(7).value, tmdt); // Col G (Allocated)
        const nsTW = parseNum(row.getCell(8).value, tmdt);
        const nsTinh = parseNum(row.getCell(9).value, tmdt);
        const nsHuyen = parseNum(row.getCell(10).value, tmdt);
        const nsKhac = parseNum(row.getCell(11).value, tmdt);
        
        const nghiệmThu = parseNum(row.getCell(12).value, tmdt); // Col L (Nghệm thu)
        const giảiNgân = parseNum(row.getCell(14).value, tmdt); // Col N (Giải ngân)
        const côngNợ = parseNum(row.getCell(16).value, tmdt); // Col P (Công nợ)

        // Rule Checks
        if (allocated > tmdt && tmdt > 0) hasError = true;
        
        const sumSources = nsTW + nsTinh + nsHuyen + nsKhac;
        if (Math.abs(sumSources - allocated) > 1.0 && allocated > 0) hasError = true;
        
        if (giảiNgân > allocated && allocated > 0) hasError = true;
        if (giảiNgân > tmdt && tmdt > 0) hasError = true;
        if (giảiNgân > nghiệmThu && nghiệmThu > 0 && (giảiNgân - nghiệmThu) > 1.0) hasError = true;

        const calcCongNo = nghiệmThu - giảiNgân;
        if (côngNợ > 0 && Math.abs(côngNợ - calcCongNo) > 10.0) hasError = true;

        // Also check if missing project code or decision
        if (!col2 || !col4) hasError = true;

        if (hasError) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            // Apply style cloning workaround to prevent side-effects on shared styles
            cell.style = Object.assign({}, cell.style, { fill: yellowFill });
          });
          coloredCount++;
        }
      }
    });
    console.log(`PL03: Colored ${coloredCount} erroneous rows.`);
  }

  // Sheet PL04
  const sheet04 = workbook.getWorksheet('PL04');
  if (sheet04) {
    console.log('Auditing and coloring PL04...');
    let currentDistrict = 'Chưa phân loại';
    let coloredCount = 0;

    sheet04.eachRow((row, rowNumber) => {
      if (rowNumber <= 7) return; // Skip headers

      const col0 = getStr(row.getCell(1).value);
      const col1 = getStr(row.getCell(2).value);
      const col2 = getStr(row.getCell(3).value); // Mã dự án
      const col4 = getStr(row.getCell(5).value); // Quyết định đầu tư

      if (col0 && /^[IVXLCDM]+$/.test(col0) && col1 && !row.getCell(3).value) {
        currentDistrict = col1;
        return;
      }

      const isProjectRow = col0 && (
        /^\d+$/.test(col0) || 
        /^\d+\.\d+$/.test(col0) || 
        /^[I|V|X]+\.\d+$/.test(col0) || 
        (col1 && !col0 && row.getCell(3).value)
      );

      if (isProjectRow && !/Tổng/i.test(col1) && !/Cộng/i.test(col1)) {
        if (col1 === '2') return; // Skip placeholder row index
        
        let hasError = false;

        const tmdt = parseNum(row.getCell(6).value); // Col F (TMDT)
        const allocated = parseNum(row.getCell(7).value, tmdt); // Col G (Allocated)
        const nsTW = parseNum(row.getCell(8).value, tmdt);
        const nsTinh = parseNum(row.getCell(9).value, tmdt);
        const nsHuyen = parseNum(row.getCell(10).value, tmdt);
        const nsKhac = parseNum(row.getCell(11).value, tmdt);
        
        const nghiệmThu = parseNum(row.getCell(12).value, tmdt); // Col L (Nghệm thu)
        const giảiNgân = parseNum(row.getCell(15).value, tmdt); // Col O (Giải ngân is col 15 in PL04)

        // Rule Checks
        if (allocated > tmdt && tmdt > 0) hasError = true;
        
        const sumSources = nsTW + nsTinh + nsHuyen + nsKhac;
        if (Math.abs(sumSources - allocated) > 1.0 && allocated > 0) hasError = true;
        
        if (giảiNgân > allocated && allocated > 0) hasError = true;
        if (giảiNgân > tmdt && tmdt > 0) hasError = true;
        if (giảiNgân > nghiệmThu && nghiệmThu > 0 && (giảiNgân - nghiệmThu) > 1.0) hasError = true;

        // Also check if missing project code or decision
        if (!col2 || !col4) hasError = true;

        if (hasError) {
          row.eachCell({ includeEmpty: true }, (cell) => {
            // Apply style cloning workaround
            cell.style = Object.assign({}, cell.style, { fill: yellowFill });
          });
          coloredCount++;
        }
      }
    });
    console.log(`PL04: Colored ${coloredCount} erroneous rows.`);
  }

  // Save changes
  await workbook.xlsx.writeFile(filePath);
  console.log(`Workbook saved successfully at: ${filePath}`);
}

colorErrors().catch(console.error);
