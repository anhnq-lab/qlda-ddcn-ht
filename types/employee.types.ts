// Employee & Auth types

// 7.1. Employees (Nhân viên) & AUTH
export enum EmployeeStatus {
    Active = 1,
    Inactive = 0
}

export enum Role {
    Admin = 'Admin',
    Manager = 'Manager',
    Staff = 'Staff'
}

export enum Gender {
    Male = 'Male',
    Female = 'Female',
    Other = 'Other'
}

export interface Employee {
    EmployeeID: string;
    FullName: string;
    Department: string;
    Position: string;
    Email: string;
    Phone: string;
    AvatarUrl: string;
    Status: EmployeeStatus;
    JoinDate: string;
    Username: string;
    Password?: string;
    Role: Role;
    Gender?: Gender;
    AllowedProjectIDs?: string[];
    JobContent?: string;
    CompletionCriteria?: string;
    SystemRole?: string; // Tùy chọn, ghi đè vai trò mặc định
    DateOfBirth?: string;
    PermanentAddress?: string;
    Specialty?: string;
    PoliticalTheory?: string;
    TenureInfo?: string;
}

// 9.1 Audit Logs (Lưu vết hệ thống)
export interface AuditLog {
    LogID: string;
    Action: 'Create' | 'Update' | 'Delete' | 'Login';
    TargetEntity: string;
    TargetID: string;
    ChangedBy: string;
    Timestamp: string;
    Details: string;
}
