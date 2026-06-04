/**
 * excelAppendixGenerator.ts
 * Xuất báo cáo Excel Phụ lục 1 và Phụ lục 2 theo tình trạng dự án và lĩnh vực chuyên ngành.
 * Sử dụng thư viện exceljs - chạy hoàn toàn trên browser.
 */
import ExcelJS from 'exceljs';
import { Project } from '../types';

// ── Palette Màu Sắc ──────────────────────────────────────────────────────────
const COLOR = {
    headerFill: 'FF1A3C6E',      // Dark Navy sang trọng
    headerFont: 'FFFFFFFF',      // Chữ trắng
    subHeaderFill: 'FFE8F0FE',   // Xanh băng nhạt cho tiêu đề con
    subHeaderFont: 'FF1A3C6E',   // Chữ Navy cho tiêu đề con
    altRow: 'FFF8FAFF',          // Dòng xen kẽ nhạt
    border: 'FFD0D7E5',          // Đường kẻ bảng mỏng
    totalFill: 'FFEFF6FF',       // Nền xanh nhạt cho dòng tổng cộng
    totalFont: 'FF1E40AF',       // Chữ xanh đậm cho dòng tổng
    textDark: 'FF1E293B',        // Màu chữ nội dung chính
};

// ── Định dạng Helper ─────────────────────────────────────────────────────────
function applyHeaderCell(cell: ExcelJS.Cell, isMainHeader: boolean = true) {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isMainHeader ? COLOR.headerFill : COLOR.subHeaderFill }
    };
    cell.font = {
        bold: true,
        color: { argb: isMainHeader ? COLOR.headerFont : COLOR.subHeaderFont },
        size: isMainHeader ? 11 : 9.5,
        name: 'Times New Roman'
    };
    cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true
    };
    cell.border = {
        top: { style: 'thin', color: { argb: COLOR.border } },
        bottom: { style: 'thin', color: { argb: COLOR.border } },
        left: { style: 'thin', color: { argb: COLOR.border } },
        right: { style: 'thin', color: { argb: COLOR.border } },
    };
}

function applyDataCell(cell: ExcelJS.Cell, isAlt: boolean, align: 'left' | 'center' | 'right' = 'left', isBold: boolean = false) {
    cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isAlt ? COLOR.altRow : 'FFFFFFFF' }
    };
    cell.alignment = {
        vertical: 'middle',
        horizontal: align,
        wrapText: true
    };
    cell.border = {
        top: { style: 'thin', color: { argb: COLOR.border } },
        bottom: { style: 'thin', color: { argb: COLOR.border } },
        left: { style: 'thin', color: { argb: COLOR.border } },
        right: { style: 'thin', color: { argb: COLOR.border } },
    };
    cell.font = {
        name: 'Times New Roman',
        size: 11,
        bold: isBold,
        color: { argb: COLOR.textDark }
    };
}

function applyTotalRow(row: ExcelJS.Row, colCount: number, isGrandTotal: boolean = false) {
    for (let i = 1; i <= colCount; i++) {
        const cell = row.getCell(i);
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: COLOR.totalFill }
        };
        cell.font = {
            bold: true,
            name: 'Times New Roman',
            size: 11,
            color: { argb: COLOR.totalFont }
        };
        
        // Đường viền kiểu kế toán chuyên nghiệp (Accounting style)
        cell.border = {
            top: { style: isGrandTotal ? 'medium' : 'thin', color: { argb: COLOR.headerFill } },
            bottom: { style: isGrandTotal ? 'double' : 'thin', color: { argb: COLOR.headerFill } },
            left: { style: 'thin', color: { argb: COLOR.border } },
            right: { style: 'thin', color: { argb: COLOR.border } },
        };
    }
}

// ── Hàm Phân Nhóm Dự Án Theo Phòng QLDA (1, 2, 3) ─────────────────────────────
interface GroupedProjects {
    board1: Project[];
    board2: Project[];
    board3: Project[];
    board4: Project[];
    unassigned: Project[];
}

function groupProjectsByBoard(projects: Project[]): GroupedProjects {
    const groups: GroupedProjects = {
        board1: [],
        board2: [],
        board3: [],
        board4: [],
        unassigned: []
    };

    projects.forEach(p => {
        const board = p.ManagementBoard;
        if (board === 1) {
            groups.board1.push(p);
        } else if (board === 2) {
            groups.board2.push(p);
        } else if (board === 3) {
            groups.board3.push(p);
        } else if (board === 4) {
            groups.board4.push(p);
        } else {
            groups.unassigned.push(p);
        }
    });

    return groups;
}

// ── BUILD SHEET PHỤ LỤC 1 ─────────────────────────────────────────────────────
function buildAppendixSheet1(ws: ExcelJS.Worksheet, projects: Project[]) {
    // 1. Cấu hình độ rộng cột cơ bản
    ws.getColumn(1).width = 8;   // TT
    ws.getColumn(2).width = 70;  // Tên dự án
    ws.getColumn(3).width = 26;  // Hoàn thành & quyết toán
    ws.getColumn(4).width = 26;  // Đang triển khai
    ws.getColumn(5).width = 26;  // Có chủ trương chưa thực hiện
    ws.getColumn(6).width = 26;  // Xúc tiến đầu tư

    // 2. Thêm Tiêu đề báo cáo
    const p1Row = ws.addRow(['PHỤ LỤC 1']);
    p1Row.getCell(1).font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
    
    const titleRow = ws.addRow(['TỔNG HỢP DANH MỤC CÁC DỰ ÁN (THEO TÌNH TRẠNG DỰ ÁN)']);
    titleRow.height = 32;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: COLOR.headerFill } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(2, 1, 2, 6);

    ws.addRow([]); // Dòng trống cách biệt

    // 3. Thiết kế Tiêu đề Cột Phức Hợp (Dòng 4 & Dòng 5)
    // Dòng 4
    const r4 = ws.addRow([
        'TT',
        'Dự án',
        'TÌNH TRẠNG CÁC DỰ ÁN',
        '', // Merged
        '', // Merged
        ''  // Merged
    ]);
    r4.height = 24;
    
    // Dòng 5
    const r5 = ws.addRow([
        '',
        '',
        'Đã hoàn thành và đang trong giai đoạn quyết toán dự án (bao gồm dự án đã hoàn thành bàn giao đang chờ quyết toán, thanh toán hết công nợ)',
        'Dự án đang trong giai đoạn triển khai',
        'Dự án đã có chủ trương đầu tư nhưng chưa tổ chức thực hiện',
        'Dự án đang trong giai đoạn xúc tiến đầu tư'
    ]);
    r5.height = 60; // Chiều cao lớn để hiển thị đủ chữ dài

    // Thực hiện merge cells
    ws.mergeCells(4, 1, 5, 1); // TT
    ws.mergeCells(4, 2, 5, 2); // Dự án
    ws.mergeCells(4, 3, 4, 6); // Nhóm TÌNH TRẠNG

    // Apply Style cho Header
    [1, 2].forEach(colIdx => {
        applyHeaderCell(ws.getCell(4, colIdx), true);
        applyHeaderCell(ws.getCell(5, colIdx), true);
    });
    for (let c = 3; c <= 6; c++) {
        applyHeaderCell(ws.getCell(4, c), true);
        applyHeaderCell(ws.getCell(5, c), false);
    }

    // 4. Thêm Dòng TỔNG SỐ (Dòng 6)
    const grandTotalRow = ws.addRow([
        '',
        'TỔNG SỐ',
        '', // Công thức C
        '', // Công thức D
        '', // Công thức E
        ''  // Công thức F
    ]);
    grandTotalRow.height = 26;
    applyTotalRow(grandTotalRow, 6, true);
    grandTotalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    // 5. Gom nhóm dự án theo phòng ban
    const grouped = groupProjectsByBoard(projects);
    const boards = [
        { key: 'board1', label: 'Phòng QLDA 1', indexStr: 'A', data: grouped.board1 },
        { key: 'board2', label: 'Phòng QLDA 2', indexStr: 'B', data: grouped.board2 },
        { key: 'board3', label: 'Phòng QLDA 3', indexStr: 'C', data: grouped.board3 },
        { key: 'board4', label: 'Phòng Phát triển dịch vụ', indexStr: 'D', data: grouped.board4 },
        { key: 'unassigned', label: 'Chưa phân phối', indexStr: 'E', data: grouped.unassigned },
    ];

    const boardRowNumbers: number[] = [];

    // Duyệt qua từng phòng ban
    boards.forEach(board => {
        const boardRow = ws.addRow([
            board.indexStr,
            board.label.toUpperCase(),
            '', // Công thức C
            '', // Công thức D
            '', // Công thức E
            ''  // Công thức F
        ]);
        boardRow.height = 24;
        const currentBoardRowNum = ws.rowCount;
        boardRowNumbers.push(currentBoardRowNum);

        applyTotalRow(boardRow, 6, false);
        boardRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

        // Lưu lại vị trí dòng dự án để lập công thức SUM
        const startProjRow = currentBoardRowNum + 1;
        
        // Vẽ danh sách dự án con
        board.data.forEach((p, pIdx) => {
            const isAlt = pIdx % 2 === 1;
            
            // Xác định trạng thái của dự án
            const statusCode = p.CurrentStatusCode || 0;
            const col3Val = [4, 5, 6, 7, 8, 9].includes(statusCode) ? 1 : '';
            const col4Val = statusCode === 3 ? 1 : '';
            const col5Val = [1, 2].includes(statusCode) ? 1 : '';
            const col6Val = statusCode === 10 ? 1 : '';

            const row = ws.addRow([
                pIdx + 1,
                p.ProjectName,
                col3Val,
                col4Val,
                col5Val,
                col6Val
            ]);

            applyDataCell(row.getCell(1), isAlt, 'center');
            applyDataCell(row.getCell(2), isAlt, 'left');
            for (let c = 3; c <= 6; c++) {
                applyDataCell(row.getCell(c), isAlt, 'center');
            }
        });

        const endProjRow = ws.rowCount;

        // Cập nhật công thức SUM cho dòng phòng ban (chỉ thiết lập nếu có dự án con)
        if (endProjRow >= startProjRow) {
            for (let c = 3; c <= 6; c++) {
                const colLetter = ws.getColumn(c).letter;
                boardRow.getCell(c).value = { formula: `SUM(${colLetter}${startProjRow}:${colLetter}${endProjRow})` };
            }
        } else {
            // Không có dự án con, gán giá trị 0
            for (let c = 3; c <= 6; c++) {
                boardRow.getCell(c).value = 0;
            }
        }
    });

    // 6. Cập nhật công thức SUM cho dòng TỔNG SỐ (Dòng 6)
    // Công thức cộng tổng các dòng phòng ban: vd =C7+C32+C55+C80
    for (let c = 3; c <= 6; c++) {
        const colLetter = ws.getColumn(c).letter;
        const formulaSum = boardRowNumbers.map(rowNum => `${colLetter}${rowNum}`).join('+');
        grandTotalRow.getCell(c).value = { formula: formulaSum };
    }

    // 7. Cấu hình Auto Filter & Frozen Rows
    ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: ws.rowCount, column: 6 } };
    ws.views = [{ state: 'frozen', ySplit: 5 }];
}

// ── BUILD SHEET PHỤ LỤC 2 ─────────────────────────────────────────────────────
function buildAppendixSheet2(ws: ExcelJS.Worksheet, projects: Project[]) {
    // 1. Cấu hình độ rộng cột cơ bản
    ws.getColumn(1).width = 8;   // TT
    ws.getColumn(2).width = 70;  // Tên dự án
    ws.getColumn(3).width = 26;  // Giao thông đô thị
    ws.getColumn(4).width = 26;  // Dân dụng công nghiệp
    ws.getColumn(5).width = 26;  // Nông nghiệp nông thôn
    ws.getColumn(6).width = 26;  // Hỗn hợp
    ws.getColumn(7).width = 26;  // Chuyên ngành khác

    // 2. Thêm Tiêu đề báo cáo
    const p2Row = ws.addRow(['PHỤ LỤC 2']);
    p2Row.getCell(1).font = { name: 'Times New Roman', size: 12, bold: true, italic: true };
    
    const titleRow = ws.addRow(['TỔNG HỢP DANH MỤC CÁC DỰ ÁN (THEO LĨNH VỰC CHUYÊN NGÀNH DỰ ÁN)']);
    titleRow.height = 32;
    const titleCell = titleRow.getCell(1);
    titleCell.font = { name: 'Times New Roman', size: 15, bold: true, color: { argb: COLOR.headerFill } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    ws.mergeCells(2, 1, 2, 7);

    ws.addRow([]); // Dòng trống cách biệt

    // 3. Thiết kế Tiêu đề Cột Phức Hợp (Dòng 4 & Dòng 5)
    // Dòng 4
    const r4 = ws.addRow([
        'TT',
        'Dự án',
        'LĨNH VỰC CHUYÊN NGÀNH CỦA CÁC DỰ ÁN',
        '', // Merged
        '', // Merged
        '', // Merged
        ''  // Merged
    ]);
    r4.height = 24;
    
    // Dòng 5
    const r5 = ws.addRow([
        '',
        '',
        'Chuyên ngành giao thông và phát triển đô thị',
        'Chuyên ngành dân dụng và công nghiệp',
        'Chuyên ngành nông nghiệp và phát triển nông thôn',
        'Chuyên ngành hỗn hợp (nhiều lĩnh vực khác nhau)',
        'Chuyên ngành khác (nếu có)'
    ]);
    r5.height = 48; // Chiều cao lớn để hiển thị đủ chữ dài

    // Thực hiện merge cells
    ws.mergeCells(4, 1, 5, 1); // TT
    ws.mergeCells(4, 2, 5, 2); // Dự án
    ws.mergeCells(4, 3, 4, 7); // Nhóm LĨNH VỰC CHUYÊN NGÀNH

    // Apply Style cho Header
    [1, 2].forEach(colIdx => {
        applyHeaderCell(ws.getCell(4, colIdx), true);
        applyHeaderCell(ws.getCell(5, colIdx), true);
    });
    for (let c = 3; c <= 7; c++) {
        applyHeaderCell(ws.getCell(4, c), true);
        applyHeaderCell(ws.getCell(5, c), false);
    }

    // 4. Thêm Dòng TỔNG SỐ (Dòng 6)
    const grandTotalRow = ws.addRow([
        '',
        'TỔNG SỐ',
        '', // Công thức C
        '', // Công thức D
        '', // Công thức E
        '', // Công thức F
        ''  // Công thức G
    ]);
    grandTotalRow.height = 26;
    applyTotalRow(grandTotalRow, 7, true);
    grandTotalRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

    // 5. Gom nhóm dự án theo phòng ban
    const grouped = groupProjectsByBoard(projects);
    const boards = [
        { key: 'board1', label: 'Phòng QLDA 1', indexStr: 'A', data: grouped.board1 },
        { key: 'board2', label: 'Phòng QLDA 2', indexStr: 'B', data: grouped.board2 },
        { key: 'board3', label: 'Phòng QLDA 3', indexStr: 'C', data: grouped.board3 },
        { key: 'board4', label: 'Phòng Phát triển dịch vụ', indexStr: 'D', data: grouped.board4 },
        { key: 'unassigned', label: 'Chưa phân phối', indexStr: 'E', data: grouped.unassigned },
    ];

    const boardRowNumbers: number[] = [];

    // Duyệt qua từng phòng ban
    boards.forEach(board => {
        const boardRow = ws.addRow([
            board.indexStr,
            board.label.toUpperCase(),
            '', // Công thức C
            '', // Công thức D
            '', // Công thức E
            '', // Công thức F
            ''  // Công thức G
        ]);
        boardRow.height = 24;
        const currentBoardRowNum = ws.rowCount;
        boardRowNumbers.push(currentBoardRowNum);

        applyTotalRow(boardRow, 7, false);
        boardRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };

        // Lưu lại vị trí dòng dự án để lập công thức SUM
        const startProjRow = currentBoardRowNum + 1;
        
        // Vẽ danh sách dự án con
        board.data.forEach((p, pIdx) => {
            const isAlt = pIdx % 2 === 1;
            
            // Xác định chuyên ngành của dự án
            const specType = p.SpecialtyType || '';
            const col3Val = specType === 'transport_urban' ? 1 : '';
            const col4Val = (specType === 'civil_industrial' || (specType as string) === 'civil') ? 1 : '';
            const col5Val = specType === 'agriculture_rural' ? 1 : '';
            const col6Val = specType === 'mixed' ? 1 : '';
            // Nhóm khác: các dự án có SpecialtyType là 'other' hoặc rỗng/chưa có
            const col7Val = (specType === 'other' || !specType) ? 1 : '';

            const row = ws.addRow([
                pIdx + 1,
                p.ProjectName,
                col3Val,
                col4Val,
                col5Val,
                col6Val,
                col7Val
            ]);

            applyDataCell(row.getCell(1), isAlt, 'center');
            applyDataCell(row.getCell(2), isAlt, 'left');
            for (let c = 3; c <= 7; c++) {
                applyDataCell(row.getCell(c), isAlt, 'center');
            }
        });

        const endProjRow = ws.rowCount;

        // Cập nhật công thức SUM cho dòng phòng ban (chỉ thiết lập nếu có dự án con)
        if (endProjRow >= startProjRow) {
            for (let c = 3; c <= 7; c++) {
                const colLetter = ws.getColumn(c).letter;
                boardRow.getCell(c).value = { formula: `SUM(${colLetter}${startProjRow}:${colLetter}${endProjRow})` };
            }
        } else {
            for (let c = 3; c <= 7; c++) {
                boardRow.getCell(c).value = 0;
            }
        }
    });

    // 6. Cập nhật công thức SUM cho dòng TỔNG SỐ (Dòng 6)
    for (let c = 3; c <= 7; c++) {
        const colLetter = ws.getColumn(c).letter;
        const formulaSum = boardRowNumbers.map(rowNum => `${colLetter}${rowNum}`).join('+');
        grandTotalRow.getCell(c).value = { formula: formulaSum };
    }

    // 7. Cấu hình Auto Filter & Frozen Rows
    ws.autoFilter = { from: { row: 5, column: 1 }, to: { row: ws.rowCount, column: 7 } };
    ws.views = [{ state: 'frozen', ySplit: 5 }];
}

// ── HÀM XUẤT EXCEL CHÍNH ──────────────────────────────────────────────────────
export async function generateAppendixReport(
    type: 'appendix1' | 'appendix2' | 'all',
    projects: Project[]
): Promise<void> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'Hệ thống Quản lý Dự án Đầu tư';
    wb.created = new Date();
    wb.modified = new Date();
    wb.properties.date1904 = false;

    const dateStr = new Date().toISOString().split('T')[0];

    if (type === 'appendix1' || type === 'all') {
        const ws1 = wb.addWorksheet('Phu luc 1');
        buildAppendixSheet1(ws1, projects);
    }
    
    if (type === 'appendix2' || type === 'all') {
        const ws2 = wb.addWorksheet('Phu luc 2');
        buildAppendixSheet2(ws2, projects);
    }

    // Thiết lập tên file tải về
    let fileName = `BC_PhuLuc_TongHop_${dateStr}.xlsx`;
    if (type === 'appendix1') fileName = `BC_PhuLuc01_TinhTrangDuAn_${dateStr}.xlsx`;
    if (type === 'appendix2') fileName = `BC_PhuLuc02_ChuyenNganhDuAn_${dateStr}.xlsx`;

    // Xuất file sang Client dạng Blob download
    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
