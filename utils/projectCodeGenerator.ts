import { ProjectGroup, InvestmentType } from '../types';

/**
 * Loại công trình xây dựng theo TT 24/2025/TT-BXD
 * Ký tự thứ 5 trong mã dự án
 */
export enum ConstructionType {
    Civil = '1',        // Công trình dân dụng
    Industrial = '2',   // Công trình công nghiệp
    Infrastructure = '3', // Công trình hạ tầng kỹ thuật
    Transport = '4',    // Công trình giao thông
    Agriculture = '5',  // Công trình nông nghiệp và PTNT
    Defense = '6',      // Công trình quốc phòng, an ninh
}

/**
 * Loại GPXD theo TT 24/2025/TT-BXD
 * Ký tự thứ 6 trong mã dự án
 */
export enum PermitType {
    Exempt = '1',       // Miễn giấy phép xây dựng
    Temporary = '2',    // GPXD có thời hạn
    Standard = '3',     // Được cấp GPXD
}

/**
 * Generates a 13-character Project Code based on TT 24/2025/TT-BXD (Điều 5).
 * 
 * Format: PP YY T S RRRRR MM (13 ký tự số)
 *   PP    = Mã tỉnh/TP (2 ký tự) - theo Phụ lục I TT24
 *   YY    = 2 số cuối năm phê duyệt dự án (2 ký tự)
 *   T     = Loại công trình xây dựng (1 ký tự)
 *   S     = Loại GPXD (1 ký tự)
 *   RRRRR = Số ngẫu nhiên/tuần tự (5 ký tự)
 *   MM    = Số lần điều chỉnh thiết kế (2 ký tự), mặc định "00"
 * 
 * @example "0122118567000" = Hà Nội (01), 2022, Dân dụng (1), Miễn GPXD (1), 85670, Chưa điều chỉnh (00)
 */
export const generateProjectCode = (
    provinceCode: string = '01', // Hà Nội default
    groupCode: ProjectGroup,
    investmentType: InvestmentType,
    year: number = new Date().getFullYear(),
    sequence?: number,
    constructionType: ConstructionType = ConstructionType.Civil,
    permitType: PermitType = PermitType.Exempt,
    modification: string = '00'
): string => {
    // 1. Province Code (2 chars)
    const pCode = provinceCode.padStart(2, '0').substring(0, 2);

    // 2. Year - last 2 digits (2 chars)
    const yCode = year.toString().slice(-2);

    // 3. Construction Type (1 char)
    const tCode = constructionType;

    // 4. Permit Type (1 char)
    const sCode = permitType;

    // 5. Sequence/Random (5 chars)
    const seqNum = sequence || Math.floor(Math.random() * 99999) + 1;
    const rCode = seqNum.toString().padStart(5, '0');

    // 6. Modification (2 chars)
    const mCode = modification.padStart(2, '0').substring(0, 2);

    // Total: 2 + 2 + 1 + 1 + 5 + 2 = 13 chars
    return `${pCode}${yCode}${tCode}${sCode}${rCode}${mCode}`;
};

/**
 * Tự động nhận diện chuyên ngành dự án dựa trên tên dự án (Phụ lục 2 Luật Đầu tư công 58/2024/QH15)
 */
export const detectSpecialtyByName = (name: string): 'transport_urban' | 'civil_industrial' | 'agriculture_rural' | 'mixed' | 'other' | '' => {
    if (!name) return '';
    const lower = name.toLowerCase();
    
    // Giao thông & Đô thị
    if (lower.includes('đường') || lower.includes('cầu') || lower.includes('cao tốc') || 
        lower.includes('cảng') || lower.includes('sân bay') || lower.includes('giao thông') || 
        lower.includes('đại lộ') || lower.includes('hầm') || lower.includes('tuyến') || 
        lower.includes('đô thị') || lower.includes('vỉa hè') || lower.includes('chiếu sáng') ||
        lower.includes('thoát nước')) {
        return 'transport_urban';
    }
    
    // Dân dụng & Công nghiệp
    if (lower.includes('trường') || lower.includes('bệnh viện') || lower.includes('trụ sở') || 
        lower.includes('nhà') || lower.includes('trung tâm') || lower.includes('ký túc xá') || 
        lower.includes('văn phòng') || lower.includes('nhà máy') || lower.includes('xí nghiệp') || 
        lower.includes('công nghiệp') || lower.includes('y tế') || lower.includes('giáo dục') ||
        lower.includes('học viện') || lower.includes('chợ') || lower.includes('bảo tàng') ||
        lower.includes('thư viện')) {
        return 'civil_industrial';
    }
    
    // Nông nghiệp & Phát triển nông thôn
    if (lower.includes('đê') || lower.includes('đập') || lower.includes('hồ chứa') || 
        lower.includes('kênh') || lower.includes('mương') || lower.includes('trạm bơm') || 
        lower.includes('thủy lợi') || lower.includes('nông thôn') || lower.includes('nông nghiệp') || 
        lower.includes('lâm nghiệp') || lower.includes('thủy sản') || lower.includes('tưới tiêu')) {
        return 'agriculture_rural';
    }

    return '';
};
