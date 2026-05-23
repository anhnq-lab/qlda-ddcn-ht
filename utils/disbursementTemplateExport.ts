/**
 * Xuất biểu mẫu giải ngân theo Thông tư 08/2016/TT-BTC
 * M.25 — Đề nghị thanh toán vốn đầu tư
 * M.26 — Đề nghị rút vốn (tạm ứng)
 * M.27 — Đề nghị thu hồi tạm ứng
 */

import * as XLSX from 'xlsx';
import { Disbursement } from '@/types';
import { formatCurrency } from '@/utils/format';

// ─── Helper: tạo style chung ───────────────────────────────
function makeWb() {
    const wb = XLSX.utils.book_new();
    return wb;
}

function addToBook(wb: XLSX.WorkBook, ws: XLSX.WorkSheet, sheetName: string) {
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
}

function download(wb: XLSX.WorkBook, filename: string) {
    XLSX.writeFile(wb, filename);
}

// ─── Shared header builder ─────────────────────────────────
function buildHeader(ws: XLSX.WorkSheet, title: string, subtitle: string, projectName?: string) {
    const rows: (string | number)[][] = [
        ['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'],
        ['Độc lập – Tự do – Hạnh phúc'],
        [''],
        [title.toUpperCase()],
        [subtitle],
        [''],
        ['Dự án:', projectName || '...................................'],
        [''],
    ];
    XLSX.utils.sheet_add_aoa(ws, rows, { origin: 'A1' });
    return rows.length + 1; // next data row
}

// ─── M.25: Đề nghị thanh toán vốn đầu tư ─────────────────
export function exportM25(
    disbursements: Disbursement[],
    projectName: string,
    projectCode?: string,
) {
    const thanhToan = disbursements.filter(d =>
        d.Type === 'ThanhToanKLHT' && d.Status === 'Approved'
    );

    const wb = makeWb();
    const wsData: (string | number | undefined)[][] = [];

    // Header
    wsData.push(['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
    wsData.push(['Độc lập – Tự do – Hạnh phúc']);
    wsData.push(['']);
    wsData.push(['GIẤY ĐỀ NGHỊ THANH TOÁN VỐN ĐẦU TƯ']);
    wsData.push(['(Mẫu số 25 – Ban hành kèm theo TT 08/2016/TT-BTC)']);
    wsData.push(['']);
    wsData.push(['Tên dự án:', projectName]);
    wsData.push(['Mã dự án:', projectCode || '']);
    wsData.push(['']);

    // Table header
    wsData.push([
        'STT', 'Số hợp đồng', 'Ngày', 'Nội dung',
        'Mã kho bạc', 'Biểu mẫu', 'Số tiền (đồng)', 'Ghi chú'
    ]);

    let total = 0;
    thanhToan.forEach((d, i) => {
        wsData.push([
            i + 1,
            d.ContractNumber || '',
            d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '',
            d.Description || '',
            d.TreasuryCode || '',
            d.FormType || 'M.25',
            d.Amount,
            '',
        ]);
        total += d.Amount;
    });

    wsData.push(['', '', '', '', '', 'Tổng cộng:', total, '']);
    wsData.push(['']);
    wsData.push(['', '', '', '', '', '', `Ngày ___/___/${new Date().getFullYear()}`]);
    wsData.push(['', '', '', '', 'CHỦ ĐẦU TƯ', '', 'KHO BẠC NHÀ NƯỚC']);
    wsData.push(['', '', '', '', '(Ký tên, đóng dấu)', '', '(Ký tên, đóng dấu)']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Column widths
    ws['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 40 },
        { wch: 14 }, { wch: 10 }, { wch: 18 }, { wch: 20 },
    ];

    addToBook(wb, ws, 'M.25 TT Vốn ĐT');
    download(wb, `M25_ThanhToan_${projectCode || 'DuAn'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── M.26: Đề nghị rút vốn (tạm ứng) ─────────────────────
export function exportM26(
    disbursements: Disbursement[],
    projectName: string,
    projectCode?: string,
) {
    const tamUng = disbursements.filter(d =>
        d.Type === 'TamUng' && d.Status === 'Approved'
    );

    const wb = makeWb();
    const wsData: (string | number | undefined)[][] = [];

    wsData.push(['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
    wsData.push(['Độc lập – Tự do – Hạnh phúc']);
    wsData.push(['']);
    wsData.push(['GIẤY ĐỀ NGHỊ RÚT VỐN TẠM ỨNG']);
    wsData.push(['(Mẫu số 26 – Ban hành kèm theo TT 08/2016/TT-BTC)']);
    wsData.push(['']);
    wsData.push(['Tên dự án:', projectName]);
    wsData.push(['Mã dự án:', projectCode || '']);
    wsData.push(['']);

    wsData.push([
        'STT', 'Số hợp đồng', 'Ngày', 'Nội dung',
        'Mã kho bạc', 'Số tiền tạm ứng (đồng)', 'Đã thu hồi (đồng)', 'Còn lại (đồng)'
    ]);

    let totalTU = 0;
    let totalTH = 0;

    // Map thu hồi theo hợp đồng
    const thuHoiByContract = new Map<string, number>();
    disbursements
        .filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved')
        .forEach(d => {
            const key = d.ContractNumber || '';
            thuHoiByContract.set(key, (thuHoiByContract.get(key) || 0) + d.Amount);
        });

    tamUng.forEach((d, i) => {
        const thuHoi = thuHoiByContract.get(d.ContractNumber || '') || 0;
        const conLai = d.Amount - thuHoi;
        wsData.push([
            i + 1,
            d.ContractNumber || '',
            d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '',
            d.Description || '',
            d.TreasuryCode || '',
            d.Amount,
            thuHoi,
            conLai,
        ]);
        totalTU += d.Amount;
        totalTH += thuHoi;
    });

    wsData.push(['', '', '', '', 'Tổng cộng:', totalTU, totalTH, totalTU - totalTH]);
    wsData.push(['']);
    wsData.push(['', '', '', '', '', '', `Ngày ___/___/${new Date().getFullYear()}`]);
    wsData.push(['', '', '', 'CHỦ ĐẦU TƯ', '', 'KHO BẠC NHÀ NƯỚC', '']);
    wsData.push(['', '', '', '(Ký tên, đóng dấu)', '', '(Ký tên, đóng dấu)', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 35 },
        { wch: 14 }, { wch: 20 }, { wch: 20 }, { wch: 18 },
    ];

    addToBook(wb, ws, 'M.26 Rút Vốn TU');
    download(wb, `M26_TamUng_${projectCode || 'DuAn'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── M.27: Thu hồi tạm ứng ────────────────────────────────
export function exportM27(
    disbursements: Disbursement[],
    projectName: string,
    projectCode?: string,
) {
    const thuHoi = disbursements.filter(d =>
        d.Type === 'ThuHoiTamUng' && d.Status === 'Approved'
    );

    const wb = makeWb();
    const wsData: (string | number | undefined)[][] = [];

    wsData.push(['CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM']);
    wsData.push(['Độc lập – Tự do – Hạnh phúc']);
    wsData.push(['']);
    wsData.push(['BẢNG TỔNG HỢP THU HỒI TẠM ỨNG']);
    wsData.push(['(Mẫu số 27 – Ban hành kèm theo TT 08/2016/TT-BTC)']);
    wsData.push(['']);
    wsData.push(['Tên dự án:', projectName]);
    wsData.push(['Mã dự án:', projectCode || '']);
    wsData.push(['']);

    wsData.push([
        'STT', 'Số hợp đồng', 'Ngày thu hồi', 'Nội dung',
        'Mã kho bạc', 'Số tiền thu hồi (đồng)', 'Ghi chú'
    ]);

    let total = 0;
    thuHoi.forEach((d, i) => {
        wsData.push([
            i + 1,
            d.ContractNumber || '',
            d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '',
            d.Description || '',
            d.TreasuryCode || '',
            d.Amount,
            '',
        ]);
        total += d.Amount;
    });

    wsData.push(['', '', '', '', 'Tổng thu hồi:', total, '']);
    wsData.push(['']);
    wsData.push(['', '', '', '', '', `Ngày ___/___/${new Date().getFullYear()}`]);
    wsData.push(['', '', 'CHỦ ĐẦU TƯ', '', 'KHO BẠC NHÀ NƯỚC', '', '']);
    wsData.push(['', '', '(Ký tên, đóng dấu)', '', '(Ký tên, đóng dấu)', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 14 }, { wch: 40 },
        { wch: 14 }, { wch: 22 }, { wch: 20 },
    ];

    addToBook(wb, ws, 'M.27 Thu Hồi TU');
    download(wb, `M27_ThuHoi_${projectCode || 'DuAn'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ─── Convenience: xuất tất cả 3 mẫu vào 1 workbook ────────
export function exportAllTemplates(
    disbursements: Disbursement[],
    projectName: string,
    projectCode?: string,
) {
    const wb = makeWb();

    // Sheet 1: M.25
    const m25Data: (string | number | undefined)[][] = [
        ['GIẤY ĐỀ NGHỊ THANH TOÁN VỐN ĐẦU TƯ (M.25)'],
        ['Dự án:', projectName],
        [''],
        ['STT', 'Số HĐ', 'Ngày', 'Nội dung', 'Mã KB', 'Số tiền'],
    ];
    disbursements.filter(d => d.Type === 'ThanhToanKLHT' && d.Status === 'Approved').forEach((d, i) => {
        m25Data.push([i + 1, d.ContractNumber || '', d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '', d.Description || '', d.TreasuryCode || '', d.Amount]);
    });
    addToBook(wb, XLSX.utils.aoa_to_sheet(m25Data), 'M.25');

    // Sheet 2: M.26
    const m26Data: (string | number | undefined)[][] = [
        ['GIẤY ĐỀ NGHỊ RÚT VỐN TẠM ỨNG (M.26)'],
        ['Dự án:', projectName],
        [''],
        ['STT', 'Số HĐ', 'Ngày', 'Nội dung', 'Mã KB', 'Tạm ứng'],
    ];
    disbursements.filter(d => d.Type === 'TamUng' && d.Status === 'Approved').forEach((d, i) => {
        m26Data.push([i + 1, d.ContractNumber || '', d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '', d.Description || '', d.TreasuryCode || '', d.Amount]);
    });
    addToBook(wb, XLSX.utils.aoa_to_sheet(m26Data), 'M.26');

    // Sheet 3: M.27
    const m27Data: (string | number | undefined)[][] = [
        ['BẢNG TỔNG HỢP THU HỒI TẠM ỨNG (M.27)'],
        ['Dự án:', projectName],
        [''],
        ['STT', 'Số HĐ', 'Ngày', 'Nội dung', 'Mã KB', 'Thu hồi'],
    ];
    disbursements.filter(d => d.Type === 'ThuHoiTamUng' && d.Status === 'Approved').forEach((d, i) => {
        m27Data.push([i + 1, d.ContractNumber || '', d.Date ? new Date(d.Date).toLocaleDateString('vi-VN') : '', d.Description || '', d.TreasuryCode || '', d.Amount]);
    });
    addToBook(wb, XLSX.utils.aoa_to_sheet(m27Data), 'M.27');

    download(wb, `BaoCaoGiaiNgan_${projectCode || 'DuAn'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
