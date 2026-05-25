/**
 * Employee Zod Schemas (Zod v4+)
 */
import { z } from 'zod';

import { Role, Gender, EmployeeStatus } from '../types';

export const GenderSchema = z.nativeEnum(Gender, {
    error: 'Giới tính không hợp lệ',
});

export const RoleSchema = z.nativeEnum(Role, {
    error: 'Vai trò không hợp lệ',
});

export const EmployeeCreateSchema = z.object({
    FullName: z.string()
        .min(2, 'Họ tên phải có ít nhất 2 ký tự')
        .max(100, 'Họ tên không quá 100 ký tự'),

    Department: z.string()
        .min(1, 'Vui lòng chọn phòng ban'),

    Position: z.string()
        .min(1, 'Vui lòng nhập chức vụ'),

    Email: z.string()
        .email('Email không hợp lệ'),

    Phone: z.string()
        .min(10, 'Số điện thoại phải có ít nhất 10 số')
        .max(15, 'Số điện thoại không quá 15 số')
        .regex(/^[0-9+\-\s]+$/, 'Số điện thoại không hợp lệ'),

    Username: z.string()
        .min(3, 'Tên đăng nhập phải có ít nhất 3 ký tự')
        .max(50, 'Tên đăng nhập không quá 50 ký tự'),

    Password: z.string()
        .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
        .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất 1 chữ hoa')
        .regex(/[a-z]/, 'Mật khẩu phải chứa ít nhất 1 chữ thường')
        .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất 1 chữ số')
        .regex(/[\W_]/, 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt')
        .optional()
        .or(z.literal('')),

    Role: RoleSchema.default(Role.Staff),
    Gender: GenderSchema.optional(),
    Status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.Active),
    JoinDate: z.string().min(1, 'Vui lòng nhập ngày vào làm'),
    AvatarUrl: z.string().url().optional().or(z.literal('')),
    AllowedProjectIDs: z.array(z.string().uuid()).optional(),
    JobContent: z.string().optional(),
    CompletionCriteria: z.string().optional(),
    DateOfBirth: z.string().optional().or(z.literal('')),
    PermanentAddress: z.string().optional(),
    Specialty: z.string().optional(),
    PoliticalTheory: z.string().optional(),
    TenureInfo: z.string().optional(),
});

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
    EmployeeID: z.string().uuid('ID nhân viên không hợp lệ'),
});

export type EmployeeCreateInput = z.infer<typeof EmployeeCreateSchema>;
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateSchema>;
