import * as XLSX from 'xlsx';
import { Disbursement } from '@/types';

export interface ParsedDisbursement extends Omit<Disbursement, 'DisbursementID' | 'ProjectID' | 'CreatedAt' | 'UpdatedAt'> {
    // We omit ID fields because they will be generated or provided by context
}

export interface ParseResult {
    data: ParsedDisbursement[];
    errors: string[];
    warnings: string[];
}

export function parseDisbursementExcel(file: File): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target?.result, { type: 'binary' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet);

                const data: ParsedDisbursement[] = [];
                const errors: string[] = [];
                const warnings: string[] = [];

                rawData.forEach((row, idx) => {
                    try {
                        const mapped = mapRow(row, idx);
                        if (mapped) data.push(mapped);
                    } catch (err: any) {
                        errors.push(`Dòng ${idx + 2}: ${err.message}`);
                    }
                });

                resolve({ data, errors, warnings });
            } catch (err) {
                reject(err);
            }
        };
        reader.readAsBinaryString(file);
    });
}

function parseExcelDate(excelDate: any): string {
    if (!excelDate) throw new Error('Ngày tháng trống');
    if (typeof excelDate === 'number') {
        const date = new Date((excelDate - (25567 + 2)) * 86400 * 1000); // Excel serial date
        if (isNaN(date.getTime())) throw new Error('Ngày tháng không hợp lệ');
        return date.toISOString().split('T')[0];
    }
    
    // Fallback for strings DD/MM/YYYY or YYYY-MM-DD
    const dateStr = String(excelDate).trim();
    if (dateStr.includes('/')) {
        const [day, month, year] = dateStr.split('/');
        const date = new Date(`${year}-${month}-${day}`);
        if (isNaN(date.getTime())) throw new Error('Ngày tháng không hợp lệ (cần định dạng DD/MM/YYYY)');
        return date.toISOString().split('T')[0];
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) throw new Error('Ngày tháng không hợp lệ');
    return date.toISOString().split('T')[0];
}

function parseAmount(amount: any): number {
    if (amount === undefined || amount === null) return 0;
    if (typeof amount === 'number') return amount;
    const cleanStr = String(amount).replace(/[,.]/g, ''); // Loại bỏ dấu phẩy, chấm
    const num = parseFloat(cleanStr);
    if (isNaN(num)) throw new Error('Số tiền không hợp lệ');
    return num;
}

function mapRow(row: Record<string, any>, index: number): ParsedDisbursement | null {
    // Normalize keys to lowercase for robust matching
    const normalizedRow: Record<string, any> = {};
    for (const key in row) {
        normalizedRow[key.toLowerCase().trim()] = row[key];
    }

    // Check empty row
    if (Object.keys(normalizedRow).length === 0) return null;

    // Mapping columns based on expected accounting software export headers
    // Ngày duyệt, Loại, Số tiền, Nguồn vốn, Diễn giải, Số chứng từ, Trạng thái, Ghi chú
    
    const dateKey = Object.keys(normalizedRow).find(k => k.includes('ngày') || k.includes('date'));
    const typeKey = Object.keys(normalizedRow).find(k => k.includes('loại') || k.includes('type'));
    const amountKey = Object.keys(normalizedRow).find(k => k.includes('số tiền') || k.includes('giá trị') || k.includes('amount'));
    const sourceKey = Object.keys(normalizedRow).find(k => k.includes('nguồn') || k.includes('source'));
    const descKey = Object.keys(normalizedRow).find(k => k.includes('diễn giải') || k.includes('nội dung') || k.includes('desc'));
    const invoiceKey = Object.keys(normalizedRow).find(k => k.includes('số ct') || k.includes('chứng từ') || k.includes('invoice'));
    const notesKey = Object.keys(normalizedRow).find(k => k.includes('ghi chú') || k.includes('note'));

    if (!dateKey) throw new Error('Không tìm thấy cột Ngày duyệt');
    if (!amountKey) throw new Error('Không tìm thấy cột Số tiền');

    const rawDate = normalizedRow[dateKey];
    const rawAmount = normalizedRow[amountKey];
    const rawType = typeKey ? normalizedRow[typeKey] : '';
    const rawSource = sourceKey ? normalizedRow[sourceKey] : '';
    const rawDesc = descKey ? normalizedRow[descKey] : '';
    
    const date = parseExcelDate(rawDate);
    const amount = parseAmount(rawAmount);
    
    // Map Type
    let type: 'TamUng' | 'ThanhToanKLHT' | 'ThuHoiTamUng' = 'ThanhToanKLHT'; // Default
    const typeStr = String(rawType).toLowerCase();
    if (typeStr.includes('tạm ứng') && !typeStr.includes('thu hồi')) type = 'TamUng';
    if (typeStr.includes('thu hồi')) type = 'ThuHoiTamUng';
    
    // Map Source
    let source: 'NSTW' | 'NSĐP' | 'ODA' | 'Khác' = 'Khác';
    const sourceStr = String(rawSource).toLowerCase();
    if (sourceStr.includes('tw') || sourceStr.includes('trung ương')) source = 'NSTW';
    else if (sourceStr.includes('đp') || sourceStr.includes('địa phương')) source = 'NSĐP';
    else if (sourceStr.includes('oda')) source = 'ODA';

    return {
        Date: date,
        Type: type,
        Amount: amount,
        Source: source,
        Description: String(rawDesc),
        InvoiceNumber: invoiceKey ? String(normalizedRow[invoiceKey]) : '',
        Status: 'Approved', // Auto-approve if imported from accounting
        Notes: notesKey ? String(normalizedRow[notesKey]) : ''
    };
}
