/**
 * boardScope — tiện ích suy số Ban QLDA từ tên phòng/Ban.
 *
 * Tách riêng khỏi useScopedProjects để dùng được ở cả tầng context
 * (PermissionContext) mà không tạo vòng lặp import.
 */

/**
 * Trích số Ban (1..n) từ tên phòng ban.
 * vd: "Ban Điều hành dự án 1" → 1, "Phòng Quản lý dự án 3" → 3
 * Trả về null nếu không phải phòng/Ban QLDA.
 */
export function extractBanNumber(department: string | undefined): number | null {
    if (!department) return null;
    const lowerDept = department.toLowerCase();
    if (lowerDept.includes('phát triển') && lowerDept.includes('dịch vụ')) return 4;
    if (lowerDept.includes('dịch vụ tư vấn')) return 4;
    const match = department.match(/(?:Ban Điều hành dự án|Phòng Quản lý dự án|Ban ĐHDA|Phòng QLDA)\s*(\d+)/i);
    return match ? parseInt(match[1], 10) : null;
}
