/**
 * Loại bỏ dấu tiếng Việt và ký tự đặc biệt khỏi chuỗi, dùng để tự sinh username hoặc mã hóa.
 */
export function removeVietnamese(str: string): string {
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^a-zA-Z0-9.]/g, '');
}

/**
 * Sinh mật khẩu ngẫu nhiên dài 8 ký tự, dễ đọc (tránh các ký tự gây nhầm lẫn).
 */
export function generatePassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}
