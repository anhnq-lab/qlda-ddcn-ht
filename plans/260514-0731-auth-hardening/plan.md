# Plan: Auth Hardening & 150-User Readiness
Created: 2026-05-14T07:31
Status: 🟡 In Progress

## Overview
Vá toàn bộ lỗ hổng bảo mật và hiệu năng trong hệ thống đăng nhập / phân quyền
của SmartPM QLDA ĐDCN Hà Tĩnh trước khi mở rộng quy mô 150 người dùng.

## Tech Stack
- Frontend: React + TypeScript (AuthContext, PermissionContext, Login.tsx)
- Backend: Supabase (Auth, RLS, PostgreSQL functions, RPC)
- Infrastructure: Supabase PgBouncer, Supabase Rate Limiting

## Phases

| Phase | Name | Priority | Status | Est. Time |
|-------|------|----------|--------|-----------|
| 01 | Credential Cleanup & Login Rate Limiting | 🔴 Critical | ✅ Done | 1-2 giờ |
| 02 | Audit Log & RLS Hardening | 🔴 Critical | ✅ Done | 1 giờ |
| 03 | Permission Cache (sessionStorage) | ⚠️ High | ✅ Done | 2-3 giờ |
| 04 | Forgot Password & Session Config | ⚠️ High | ⬜ Pending | 2 giờ |
| 05 | Load Test & Monitoring | ⚠️ High | ⬜ Pending | 2 giờ |

**Tổng:** ~8-10 giờ | 5 phiên làm việc

## Quick Commands
- Bắt đầu Phase 1: `/code phase-01`
- Xem tiến độ: `/next`
- Lưu context: `/save-brain`
