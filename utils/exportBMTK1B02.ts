/**
 * Tiện ích xuất file Word (DOCX) cho biểu mẫu BM-TK1B-02
 * Phiếu giao nhiệm vụ tư vấn lập Báo cáo Kinh tế - Kỹ thuật
 */

import { Table, TableRow, WidthType, AlignmentType, Paragraph, TextRun } from 'docx';
import { exportDocx, p, pEmpty, pHeading, headerCell, dataCell, layoutCell, SZ, FONT, NO_BORDER, formatDateVN } from './docxHelpers';
import { Project, MANAGEMENT_BOARDS } from '../types/project.types';

export interface BMTK1B02FormData {
    canBoPhuTrach: string;
    donViTuVan: string;
    soHopDong: string;
    thoiHanHoanThanh: string;
    ngayLap: string;
    hangMuc: string;
}

/**
 * Hàm hỗ trợ tạo dòng thông tin có đường chấm chấm (dotted leader)
 * Thay vì dùng tab leader phức tạp, chúng ta sẽ render dạng TextRun đơn giản hoặc dùng Tab.
 * Ở đây dùng chuỗi chấm cố định (padEnd) để đảm bảo độ dài, hoặc dùng Tab leader của docx.
 */
function createDottedLine(label: string, value: string): Paragraph {
    // Để đẹp và chuẩn, dùng cách nối chuỗi đơn giản trước
    const MAX_LENGTH = 120; // Ký tự
    const content = `${label}: ${value || ''}`;
    const dotsCount = Math.max(0, MAX_LENGTH - content.length);
    const dots = '.'.repeat(dotsCount);
    
    return p(`${content} ${dots}`, { size: SZ.NOI_DUNG, after: 120 });
}

export async function generateBMTK1B02(project: Project, formData: BMTK1B02FormData) {
    const fileName = `BM_TK1B_02_${project.ProjectNumber || 'NhiemVu'}.docx`;

    // Ban QLDA
    const board = MANAGEMENT_BOARDS.find(b => b.value === project.ManagementBoard)?.label || 'Ban Quản lý dự án...';

    // Xây dựng bảng "I. Nội dung nhiệm vụ giao"
    const taskTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: [
                    headerCell('TT', 600),
                    headerCell('Nội dung công việc', 4000),
                    headerCell('Sản phẩm phải nộp', 3500),
                    headerCell('Thời hạn/yêu cầu', 1900),
                ]
            }),
            new TableRow({
                children: [
                    dataCell('1', AlignmentType.CENTER),
                    dataCell('Khảo sát hiện trạng, địa hình, địa chất, hạ tầng kỹ thuật'),
                    dataCell('Báo cáo khảo sát, bản vẽ khảo sát, ảnh hiện trạng'),
                    dataCell('Theo hợp đồng'),
                ]
            }),
            new TableRow({
                children: [
                    dataCell('2', AlignmentType.CENTER),
                    dataCell('Lập thuyết minh BCKTKT'),
                    dataCell('Thuyết minh BCKTKT đầy đủ các nội dung theo Luật Xây dựng'),
                    dataCell('Bản Word/PDF'),
                ]
            }),
            new TableRow({
                children: [
                    dataCell('3', AlignmentType.CENTER),
                    dataCell('Lập TKBVTC trong BCKTKT'),
                    dataCell('Bộ bản vẽ TKBVTC'),
                    dataCell('Bản giấy, PDF, CAD'),
                ]
            }),
            new TableRow({
                children: [
                    dataCell('4', AlignmentType.CENTER),
                    dataCell('Lập dự toán/tổng mức đầu tư'),
                    dataCell('Bảng tổng hợp kinh phí, dự toán chi tiết, file Excel'),
                    dataCell('Căn cứ giá, định mức kèm theo'),
                ]
            }),
            new TableRow({
                children: [
                    dataCell('5', AlignmentType.CENTER),
                    dataCell('Rà soát môi trường, PCCC, GPMB, tài sản công'),
                    dataCell('Phụ lục rà soát, đề xuất thủ tục phải thực hiện'),
                    dataCell('Nộp kèm hồ sơ'),
                ]
            })
        ]
    });

    // Bảng chữ ký
    const signatureTable = new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: NO_BORDER,
        rows: [
            new TableRow({
                children: [
                    layoutCell([
                        p('CÁN BỘ PHỤ TRÁCH', { bold: true, alignment: AlignmentType.CENTER }),
                        p('(Ký, ghi rõ họ tên)', { italics: true, alignment: AlignmentType.CENTER, after: 1200 }),
                        p(formData.canBoPhuTrach, { bold: true, alignment: AlignmentType.CENTER })
                    ], 5000),
                    layoutCell([
                        p('LÃNH ĐẠO PHÒNG QLDA', { bold: true, alignment: AlignmentType.CENTER }),
                        p('(Ký, ghi rõ họ tên)', { italics: true, alignment: AlignmentType.CENTER, after: 1200 })
                    ], 5000)
                ]
            })
        ]
    });

    const sections = [{
        children: [
            p('BM-TK1B-02', { bold: true, alignment: AlignmentType.CENTER, after: 60 }),
            p('PHIẾU GIAO NHIỆM VỤ TƯ VẤN LẬP BÁO CÁO KINH TẾ - KỸ THUẬT', { 
                bold: true, alignment: AlignmentType.CENTER, after: 240 
            }),
            
            // Các trường thông tin
            createDottedLine('Dự án', project.ProjectName),
            createDottedLine('Hạng mục/Gói thầu', formData.hangMuc || ''),
            createDottedLine('Địa điểm xây dựng', project.LocationCode || '...................................................'),
            createDottedLine('Chủ đầu tư/Ban quản lý dự án', board),
            createDottedLine('Cán bộ phụ trách', formData.canBoPhuTrach),
            createDottedLine('Ngày lập/kiểm tra', formData.ngayLap),
            createDottedLine('Đơn vị tư vấn', formData.donViTuVan),
            createDottedLine('Số hợp đồng/văn bản giao nhiệm vụ', formData.soHopDong),
            createDottedLine('Thời hạn hoàn thành', formData.thoiHanHoanThanh),
            
            pEmpty(120),
            pHeading('I. Nội dung nhiệm vụ giao', { before: 120, after: 120 }),
            taskTable,
            
            pEmpty(120),
            pHeading('II. Yêu cầu chung', { before: 120, after: 120 }),
            p('- Hồ sơ phải tuân thủ đúng nhiệm vụ thiết kế, quy chuẩn, tiêu chuẩn áp dụng, quy hoạch, chỉ tiêu sử dụng đất, yêu cầu môi trường, PCCC, an toàn công trình và yêu cầu chuyên ngành.', { indent: 0 }),
            p('- Tư vấn chịu trách nhiệm về tính chính xác của số liệu khảo sát, khối lượng, bản vẽ, dự toán, báo giá, định mức, đơn giá và sự phù hợp giữa hồ sơ bản giấy với file điện tử.', { indent: 0 }),
            p('- Hồ sơ nộp gồm bản giấy có ký, đóng dấu và bản điện tử định dạng Word, Excel, PDF, CAD/BIM nếu có; mọi bản chỉnh sửa phải ghi rõ phiên bản và ngày cập nhật.', { indent: 0 }),
            p('- Trường hợp phát hiện nội dung vượt chủ trương đầu tư, vượt tổng mức đầu tư, vướng quy hoạch, đất đai, môi trường, PCCC, tài sản công hoặc GPMB, tư vấn phải báo cáo ngay bằng văn bản để Phòng QLDA xử lý.', { indent: 0 }),
            
            pEmpty(240),
            signatureTable
        ]
    }];

    await exportDocx(fileName, sections);
}
