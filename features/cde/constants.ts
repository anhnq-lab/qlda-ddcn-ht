import { Clock, Share2, CheckCircle2, Archive } from 'lucide-react';
import type { CDEContainerType, CDEStatusCode, CDEWorkflowStepDef } from './types';

// ═══════════════════════════════════════════════════════════════
// CDE Constants — ISO 19650 + NĐ 175/2024/NĐ-CP
// ═══════════════════════════════════════════════════════════════

// --- Project Phases per NĐ 175/2024/NĐ-CP Điều 4 ---
// 3 giai đoạn: Chuẩn bị dự án → Thực hiện dự án → Kết thúc xây dựng
export const CDE_PROJECT_PHASES = [
    {
        id: 'preparation',
        label: '01. Chuẩn bị dự án',
        description: 'Lập BC NCKT/NCTKT, khảo sát, thẩm định, phê duyệt dự án',
        folders: [
            'Khảo sát xây dựng',
            'Báo cáo nghiên cứu tiền khả thi',
            'Báo cáo nghiên cứu khả thi',
            'Báo cáo kinh tế - kỹ thuật',
            'Đánh giá tác động môi trường',
            'Quy hoạch xây dựng',
            'Hồ sơ pháp lý dự án',
        ],
    },
    {
        id: 'implementation',
        label: '02. Thực hiện dự án',
        description: 'Thiết kế, dự toán, thi công, giám sát, nghiệm thu, thanh toán',
        folders: [
            // Thiết kế & dự toán
            'Thiết kế cơ sở (TKCS)',
            'Thiết kế kỹ thuật (TKKT)',
            'Thiết kế bản vẽ thi công (TKBVTC)',
            'Thẩm tra thiết kế',
            'Dự toán xây dựng',
            'Khảo sát phục vụ thiết kế',
            // Thi công & giám sát
            'Hồ sơ nghiệm thu',
            'Nhật ký thi công',
            'Biên bản hiện trường',
            'Hồ sơ vật liệu & thí nghiệm',
            'Biện pháp thi công',
            'Đề nghị thanh toán',
            'Hồ sơ an toàn PCCC',
            'Báo cáo giám sát',
        ],
    },
    {
        id: 'completion',
        label: '03. Kết thúc xây dựng',
        description: 'Nghiệm thu hoàn thành, quyết toán, bàn giao, bảo hành',
        folders: [
            'Hồ sơ hoàn công',
            'Bản vẽ hoàn công',
            'Quyết toán hợp đồng',
            'Quyết toán dự án',
            'Biên bản bàn giao',
            'Hồ sơ bảo hành',
            'Hồ sơ quản lý vận hành',
        ],
    },
];

// --- Workflow Steps (VN construction approval flow) ---
export const CDE_WORKFLOW_STEPS: CDEWorkflowStepDef[] = [
    {
        id: 'CONTRACTOR_SUBMIT', code: 'SUBMIT',
        name: 'Nhà thầu trình', role: 'contractor', roleLabel: 'Nhà thầu',
        nextStatus: 'S1', containerFrom: 'WIP', containerTo: 'WIP',
    },
    {
        id: 'CONSULTANT_CHECK', code: 'CHECK',
        name: 'Tư vấn kiểm tra', role: 'consultant', roleLabel: 'Tư vấn giám sát',
        nextStatus: 'S2', containerFrom: 'WIP', containerTo: 'SHARED',
    },
    {
        id: 'STAFF_APPRAISE', code: 'APPRAISE',
        name: 'Chuyên viên thẩm định', role: 'staff', roleLabel: 'Chuyên viên Ban QLDA',
        nextStatus: 'S3', containerFrom: 'SHARED', containerTo: 'SHARED',
    },
    {
        id: 'MANAGER_APPROVE', code: 'APPROVE',
        name: 'Trưởng phòng duyệt', role: 'manager', roleLabel: 'Trưởng phòng',
        nextStatus: 'A1', containerFrom: 'SHARED', containerTo: 'SHARED',
    },
    {
        id: 'DIRECTOR_SIGN', code: 'SIGN',
        name: 'Lãnh đạo ký số', role: 'director', roleLabel: 'Lãnh đạo',
        nextStatus: 'A1', containerFrom: 'SHARED', containerTo: 'PUBLISHED',
    },
];

// --- Container config ---
export const CDE_CONTAINERS: {
    type: CDEContainerType;
    label: string;
    labelShort: string;
    color: string;
    icon: typeof Clock;
}[] = [
        { type: 'WIP', label: 'WIP - Đang xử lý', labelShort: 'WIP', color: '#f59e0b', icon: Clock },
        { type: 'SHARED', label: 'SHARED - Đang xét duyệt', labelShort: 'SHARED', color: '#3b82f6', icon: Share2 },
        { type: 'PUBLISHED', label: 'PUBLISHED - Đã phê duyệt', labelShort: 'PUBLISHED', color: '#10b981', icon: CheckCircle2 },
        { type: 'ARCHIVED', label: 'ARCHIVED - Lưu trữ', labelShort: 'ARCHIVED', color: '#8b5cf6', icon: Archive },
    ];

// --- Container colors ---
export const CONTAINER_COLORS: Record<CDEContainerType, {
    bg: string; text: string; border: string; dot: string;
    lightBg: string; badge: string; gradient: string;
}> = {
    WIP: {
        bg: 'bg-warning-500', text: 'text-warning-700 dark:text-warning-400',
        border: 'border-warning-200 dark:border-warning-700', dot: 'bg-warning-500',
        lightBg: 'bg-warning-50 dark:bg-warning-900/20',
        badge: 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300',
        gradient: 'linear-gradient(135deg, #4A4535 0%, #3D3A2D 100%)',
    },
    SHARED: {
        bg: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-700', dot: 'bg-blue-500',
        lightBg: 'bg-blue-50 dark:bg-blue-900/20',
        badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        gradient: 'linear-gradient(135deg, #2D3A4A 0%, #253545 100%)',
    },
    PUBLISHED: {
        bg: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500',
        lightBg: 'bg-emerald-50 dark:bg-emerald-900/20',
        badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        gradient: 'linear-gradient(135deg, #2D4A35 0%, #254530 100%)',
    },
    ARCHIVED: {
        bg: 'bg-purple-500', text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-700', dot: 'bg-purple-500',
        lightBg: 'bg-purple-50 dark:bg-purple-900/20',
        badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
        gradient: 'linear-gradient(135deg, #3A2D4A 0%, #352545 100%)',
    },
};

// --- Status config ---
export const CDE_STATUS_CONFIG: Record<CDEStatusCode, {
    label: string; color: string; container: CDEContainerType;
}> = {
    S0: { label: 'WIP - Đang xử lý', color: '#f59e0b', container: 'WIP' },
    S1: { label: 'Tư vấn đang kiểm tra', color: '#3b82f6', container: 'SHARED' },
    S2: { label: 'Đang thẩm định', color: '#6366f1', container: 'SHARED' },
    S3: { label: 'Đang phê duyệt', color: '#8b5cf6', container: 'SHARED' },
    A1: { label: 'Đã ký duyệt', color: '#10b981', container: 'PUBLISHED' },
    A2: { label: 'Đã bàn giao', color: '#059669', container: 'PUBLISHED' },
    A3: { label: 'Quản lý tài sản', color: '#047857', container: 'PUBLISHED' },
    B1: { label: 'Lưu trữ', color: '#8b5cf6', container: 'ARCHIVED' },
};

// --- VN Construction disciplines ---
export const CDE_DISCIPLINES = [
    { value: 'architecture', label: 'Kiến trúc' },
    { value: 'structure', label: 'Kết cấu' },
    { value: 'mep', label: 'Cơ điện (MEP)' },
    { value: 'infrastructure', label: 'Hạ tầng kỹ thuật' },
    { value: 'fire_safety', label: 'PCCC' },
    { value: 'landscape', label: 'Cảnh quan' },
    { value: 'interior', label: 'Nội thất' },
    { value: 'survey', label: 'Khảo sát' },
    { value: 'environmental', label: 'Môi trường' },
    { value: 'geotechnical', label: 'Địa chất công trình' },
    { value: 'cost_estimation', label: 'Dự toán' },
    { value: 'project_management', label: 'Quản lý dự án' },
    { value: 'other', label: 'Khác' },
];

// --- VN Construction document types (NĐ 175/2024 all phases) ---
export const CDE_DOC_TYPES = [
    // Chuẩn bị dự án
    { value: 'prefeasibility', label: 'BC nghiên cứu tiền khả thi', phase: 'preparation' },
    { value: 'feasibility', label: 'BC nghiên cứu khả thi', phase: 'preparation' },
    { value: 'economic_tech', label: 'BC kinh tế - kỹ thuật', phase: 'preparation' },
    { value: 'eia', label: 'Đánh giá tác động môi trường', phase: 'preparation' },
    { value: 'survey_geo', label: 'Khảo sát địa chất', phase: 'preparation' },
    { value: 'survey_topo', label: 'Khảo sát địa hình', phase: 'preparation' },
    { value: 'planning', label: 'Quy hoạch xây dựng', phase: 'preparation' },
    { value: 'legal_doc', label: 'Hồ sơ pháp lý', phase: 'preparation' },
    // Thực hiện dự án — Thiết kế
    { value: 'design_basic', label: 'Thiết kế cơ sở (TKCS)', phase: 'implementation' },
    { value: 'design_detail', label: 'Thiết kế kỹ thuật (TKKT)', phase: 'implementation' },
    { value: 'design_construction', label: 'Thiết kế BVTC', phase: 'implementation' },
    { value: 'design_review', label: 'Báo cáo thẩm tra thiết kế', phase: 'implementation' },
    { value: 'cost_estimate', label: 'Dự toán xây dựng', phase: 'implementation' },
    { value: 'total_investment', label: 'Tổng mức đầu tư', phase: 'implementation' },
    { value: 'design_task', label: 'Nhiệm vụ thiết kế', phase: 'implementation' },
    { value: 'design_survey', label: 'Khảo sát phục vụ thiết kế', phase: 'implementation' },
    // Thực hiện dự án — Thi công & Giám sát
    { value: 'drawing', label: 'Bản vẽ thiết kế', phase: 'implementation' },
    { value: 'spec', label: 'Thuyết minh kỹ thuật', phase: 'implementation' },
    { value: 'acceptance', label: 'Biên bản nghiệm thu', phase: 'implementation' },
    { value: 'site_diary', label: 'Nhật ký thi công', phase: 'implementation' },
    { value: 'site_record', label: 'Biên bản hiện trường', phase: 'implementation' },
    { value: 'material_cert', label: 'Chứng chỉ vật liệu', phase: 'implementation' },
    { value: 'test_report', label: 'Kết quả thí nghiệm', phase: 'implementation' },
    { value: 'method_statement', label: 'Biện pháp thi công', phase: 'implementation' },
    { value: 'progress_report', label: 'Báo cáo tiến độ', phase: 'implementation' },
    { value: 'supervision_report', label: 'Báo cáo giám sát', phase: 'implementation' },
    { value: 'payment_request', label: 'Đề nghị thanh toán', phase: 'implementation' },
    { value: 'volume_confirm', label: 'Xác nhận khối lượng', phase: 'implementation' },
    { value: 'photo', label: 'Hình ảnh hiện trường', phase: 'implementation' },
    { value: 'safety_report', label: 'Báo cáo an toàn lao động', phase: 'implementation' },
    { value: 'fire_cert', label: 'Chứng nhận PCCC', phase: 'implementation' },
    // Kết thúc xây dựng
    { value: 'as_built', label: 'Bản vẽ hoàn công', phase: 'completion' },
    { value: 'settlement', label: 'Quyết toán dự án', phase: 'completion' },
    { value: 'contract_settlement', label: 'Quyết toán hợp đồng', phase: 'completion' },
    { value: 'handover', label: 'Biên bản bàn giao', phase: 'completion' },
    { value: 'warranty', label: 'Hồ sơ bảo hành', phase: 'completion' },
    { value: 'operation_manual', label: 'Hồ sơ quản lý vận hành', phase: 'completion' },
    { value: 'decision', label: 'Quyết định phê duyệt', phase: 'all' },
    { value: 'other', label: 'Khác', phase: 'all' },
];

// ═══════════════════════════════════════════════════════════════
// Internal Workflow Templates — Quy trình nội bộ
// ═══════════════════════════════════════════════════════════════
import type { InternalWorkflowTemplate } from './types';

// --- Quy trình Quyết toán Vốn Đầu tư Dự án Hoàn thành ---
// Mã: QT.04.QTVDTDAHT — Ban QLDA đầu tư XDCT dân dụng và công nghiệp
// Căn cứ: NĐ 99/2021/NĐ-CP, TT 96/2021/TT-BTC
export const WORKFLOW_QUYET_TOAN: InternalWorkflowTemplate = {
    id: 'qt_04_qtvdtdaht',
    code: 'QT.04.QTVDTDAHT',
    name: 'Quyết toán vốn đầu tư dự án hoàn thành',
    description: 'Quy trình quyết toán hợp đồng A-B và quyết toán vốn đầu tư dự án hoàn thành theo quy định',
    legal_basis: [
        'Nghị định 99/2021/NĐ-CP ngày 19/11/2021',
        'Thông tư 79/2019/TT-BTC ngày 14/11/2019',
        'Thông tư 96/2021/TT-BTC ngày 11/11/2021',
        'TCVN ISO 9001:2015',
    ],
    applicable_doc_types: ['settlement', 'contract_settlement', 'handover', 'acceptance'],
    applicable_phases: ['completion'],
    steps: [
        {
            step_no: 1,
            code: 'B1_PREPARE',
            name: 'Chuẩn bị hồ sơ đề nghị quyết toán A-B',
            description: 'Đơn vị đề nghị quyết toán chuẩn bị hồ sơ gồm: Giấy đề nghị quyết toán A-B, Biên bản nghiệm thu, Bảng xác định khối lượng & giá trị, Hóa đơn GTGT, Biên bản bàn giao, Hồ sơ hoàn công, Hồ sơ quản lý chất lượng, Hồ sơ pháp lý khác.',
            department: 'REQUESTOR',
            department_label: 'Đơn vị đề nghị quyết toán',
            action_label: 'Nộp hồ sơ',
            sla_days: 0,
            is_external: true,
            forms: ['BM.01-QT.KHTC.04', 'BM.02-QT.KHTC.04', 'BM.03-QT.KHTC.04'],
        },
        {
            step_no: 2,
            code: 'B2_RECEIVE',
            name: 'Tiếp nhận & kiểm tra hồ sơ',
            description: 'Phòng HC-TH (bộ phận một cửa) kiểm tra, tiếp nhận hồ sơ quyết toán A-B. Nếu đủ điều kiện: chuyển Phòng ĐHDA/PTDV để xác nhận khối lượng.',
            department: 'HC_TH',
            department_label: 'Phòng HC-TH (Bộ phận một cửa)',
            action_label: 'Tiếp nhận & chuyển xử lý',
            sla_days: 1,
            is_external: false,
        },
        {
            step_no: 3,
            code: 'B3_VOLUME_CONFIRM',
            name: 'Xác nhận khối lượng quyết toán A-B',
            description: 'Phòng ĐHDA hoặc Phòng PTDV (đối với chi phí GPMB, RPBM, ĐTM) kiểm tra hồ sơ kỹ thuật, xác nhận khối lượng đề nghị quyết toán A-B, sau đó chuyển hồ sơ về bộ phận một cửa.',
            department: 'DHDA',
            department_label: 'Phòng ĐHDA / Phòng PTDV',
            action_label: 'Xác nhận khối lượng',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 4,
            code: 'B4_VOLUME_REVIEW',
            name: 'Kiểm tra, rà soát khối lượng quyết toán A-B',
            description: 'Phòng KT-TĐ tiếp nhận hồ sơ từ bộ phận một cửa, kiểm tra rà soát sự phù hợp của hồ sơ quyết toán A-B (đơn giá, biện pháp thi công, định mức…), sau đó chuyển về bộ phận một cửa.',
            department: 'KT_TD',
            department_label: 'Phòng KT-TĐ',
            action_label: 'Rà soát & chuyển tiếp',
            sla_days: 2,
            is_external: false,
        },
        {
            step_no: 5,
            code: 'B5_VALUE_CHECK',
            name: 'Kiểm tra giá trị đề nghị quyết toán A-B',
            description: 'Phòng KH-TC tiếp nhận hồ sơ từ bộ phận một cửa, kiểm tra thể thức hồ sơ và giá trị đề nghị quyết toán A-B (thẩm tra tài chính, đối chiếu thanh toán…), sau đó chuyển về bộ phận một cửa.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC',
            action_label: 'Kiểm tra tài chính',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 6,
            code: 'B6_APPROVE',
            name: 'Phê duyệt hồ sơ quyết toán A-B',
            description: 'Bộ phận một cửa trình Giám đốc Ban QLDA xem xét và phê duyệt hồ sơ quyết toán A-B cho đơn vị.',
            department: 'DIRECTOR',
            department_label: 'Giám đốc Ban QLDA',
            action_label: 'Phê duyệt',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 7,
            code: 'B7_ISSUE',
            name: 'Ban hành / Trả hồ sơ quyết toán A-B',
            description: 'Nếu hồ sơ hợp lệ: bộ phận một cửa đóng dấu, ban hành hồ sơ và gửi các phòng liên quan. Nếu chưa hợp lệ: yêu cầu đơn vị bổ sung, sửa đổi.',
            department: 'HC_TH',
            department_label: 'Phòng HC-TH (Bộ phận một cửa)',
            action_label: 'Ban hành hồ sơ',
            sla_days: 1,
            is_external: false,
        },
        {
            step_no: 8,
            code: 'B8_AUDIT_SUBMIT',
            name: 'Trình thẩm tra quyết toán VĐTDAHT',
            description: 'Phòng KH-TC tổng hợp, rà soát toàn bộ hồ sơ chi phí dự án đầu tư; lập tờ trình đề nghị phê duyệt quyết toán của chủ đầu tư và báo cáo quyết toán vốn đầu tư theo TT 96/2021/TT-BTC; phối hợp ĐHDA/PTDV trình Sở Tài chính thẩm tra.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC + ĐHDA + PTDV',
            action_label: 'Trình thẩm tra',
            sla_days: 120, // ≤4 tháng (nhóm C), ≤6 (B), ≤9 (A)
            is_external: false,
            forms: ['BM.04-QT.KHTC.04', 'Mẫu 01-08/QTDA TT96/2021/TT-BTC'],
        },
        {
            step_no: 9,
            code: 'B9_SOC_REVIEW',
            name: 'Sở Tài chính thẩm tra quyết toán',
            description: 'Phòng KH-TC + ĐHDA + PTDV phối hợp Sở Tài chính giải trình vướng mắc. Sở Tài chính và Ban QLDA ký biên bản thống nhất số liệu. Sở Tài chính lập báo cáo thẩm tra và trình UBND tỉnh phê duyệt.',
            department: 'EXTERNAL',
            department_label: 'Sở Tài chính',
            action_label: 'Thẩm tra & trình UBND',
            sla_days: 90, // ≤3 tháng (C), ≤4 (B), ≤8 (A)
            is_external: true,
        },
        {
            step_no: 10,
            code: 'B10_PROVINCE_APPROVE',
            name: 'UBND tỉnh phê duyệt quyết toán VĐTDAHT',
            description: 'UBND tỉnh xem xét hồ sơ và ban hành quyết định phê duyệt quyết toán vốn đầu tư dự án hoàn thành.',
            department: 'EXTERNAL',
            department_label: 'UBND tỉnh',
            action_label: 'Phê duyệt quyết toán',
            sla_days: 20, // ≤15 ngày (C), ≤20 (B), ≤1 tháng (A)
            is_external: true,
            forms: ['Mẫu 11/QTDA TT96/2021/TT-BTC'],
        },
        {
            step_no: 11,
            code: 'B11_ARCHIVE',
            name: 'Lưu kho hồ sơ & xử lý công nợ sau quyết toán',
            description: 'Sau khi có quyết định phê duyệt dự án hoàn thành, Phòng KH-TC thực hiện quy trình lưu kho hồ sơ và xử lý công nợ sau quyết toán.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC',
            action_label: 'Hoàn tất lưu trữ',
            sla_days: 30,
            is_external: false,
        },
    ],
};

// --- Quy trình Thanh toán Hợp đồng Xây lắp ---
// Mã: QT.05.TTHD — Căn cứ: NĐ 37/2015/NĐ-CP, TT 09/2016/TT-BTC
export const WORKFLOW_THANH_TOAN: InternalWorkflowTemplate = {
    id: 'qt_05_tthd',
    code: 'QT.05.TTHD',
    name: 'Thanh toán hợp đồng xây lắp',
    description: 'Quy trình thanh toán theo tiến độ / khối lượng hoàn thành được nghiệm thu cho nhà thầu xây lắp',
    legal_basis: [
        'Nghị định 37/2015/NĐ-CP ngày 22/4/2015 về hợp đồng xây dựng',
        'Thông tư 09/2016/TT-BTC ngày 18/1/2016 về quyết toán dự án hoàn thành',
        'Nghị định 99/2021/NĐ-CP ngày 19/11/2021',
        'TCVN ISO 9001:2015',
    ],
    applicable_doc_types: ['payment_request', 'volume_confirm', 'acceptance'],
    applicable_phases: ['implementation'],
    steps: [
        {
            step_no: 1,
            code: 'TT_B1_SUBMIT',
            name: 'Nhà thầu nộp đề nghị thanh toán',
            description: 'Nhà thầu nộp hồ sơ đề nghị thanh toán gồm: Giấy đề nghị thanh toán, Biên bản nghiệm thu khối lượng, Bảng xác nhận khối lượng hoàn thành, Hóa đơn GTGT.',
            department: 'REQUESTOR',
            department_label: 'Nhà thầu',
            action_label: 'Nộp hồ sơ',
            sla_days: 0,
            is_external: true,
            forms: ['BM.01-TT.KHTC.05'],
        },
        {
            step_no: 2,
            code: 'TT_B2_RECEIVE',
            name: 'Tiếp nhận & kiểm tra hồ sơ',
            description: 'Phòng HC-TH tiếp nhận, kiểm tra tính đầy đủ của hồ sơ. Nếu đủ điều kiện chuyển Phòng ĐHDA xác nhận khối lượng. Nếu thiếu yêu cầu bổ sung.',
            department: 'HC_TH',
            department_label: 'Phòng HC-TH (Bộ phận một cửa)',
            action_label: 'Tiếp nhận',
            sla_days: 1,
            is_external: false,
        },
        {
            step_no: 3,
            code: 'TT_B3_VOLUME',
            name: 'Xác nhận khối lượng hoàn thành',
            description: 'Phòng ĐHDA phối hợp tư vấn giám sát kiểm tra thực tế, xác nhận khối lượng, chất lượng công việc đề nghị thanh toán.',
            department: 'DHDA',
            department_label: 'Phòng ĐHDA',
            action_label: 'Xác nhận khối lượng',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 4,
            code: 'TT_B4_FINANCE',
            name: 'Kiểm tra tài chính & lập lệnh chi',
            description: 'Phòng KH-TC kiểm tra đơn giá, khối lượng, giá trị đề nghị thanh toán so với hợp đồng; đối chiếu kế hoạch vốn; lập lệnh chi.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC',
            action_label: 'Kiểm tra tài chính',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 5,
            code: 'TT_B5_APPROVE',
            name: 'Giám đốc phê duyệt thanh toán',
            description: 'Giám đốc Ban QLDA xem xét và ký phê duyệt đề nghị thanh toán.',
            department: 'DIRECTOR',
            department_label: 'Giám đốc Ban QLDA',
            action_label: 'Phê duyệt',
            sla_days: 2,
            is_external: false,
        },
        {
            step_no: 6,
            code: 'TT_B6_TREASURY',
            name: 'Gửi Kho bạc Nhà nước thanh toán',
            description: 'Phòng KH-TC gửi lệnh chi đến Kho bạc Nhà nước để thực hiện chi ngân sách.',
            department: 'EXTERNAL',
            department_label: 'Kho bạc Nhà nước',
            action_label: 'Chuyển tiền',
            sla_days: 5,
            is_external: true,
        },
        {
            step_no: 7,
            code: 'TT_B7_ARCHIVE',
            name: 'Lưu hồ sơ thanh toán',
            description: 'Phòng KH-TC cập nhật sổ sách, lưu trữ hồ sơ thanh toán theo quy định.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC',
            action_label: 'Hoàn tất lưu trữ',
            sla_days: 2,
            is_external: false,
        },
    ],
};

// --- Quy trình Nghiệm thu Hoàn thành Công trình ---
// Mã: QT.06.NTHCT — Căn cứ: Nghị định 06/2021/NĐ-CP
export const WORKFLOW_NGHIEM_THU: InternalWorkflowTemplate = {
    id: 'qt_06_nthct',
    code: 'QT.06.NTHCT',
    name: 'Nghiệm thu hoàn thành công trình',
    description: 'Quy trình nghiệm thu hoàn thành công trình / hạng mục công trình đưa vào sử dụng theo quy định',
    legal_basis: [
        'Nghị định 06/2021/NĐ-CP ngày 26/01/2021 về quản lý chất lượng công trình',
        'Thông tư 10/2021/TT-BXD ngày 25/8/2021',
        'TCVN ISO 9001:2015',
    ],
    applicable_doc_types: ['acceptance', 'as_built', 'handover'],
    applicable_phases: ['implementation', 'completion'],
    steps: [
        {
            step_no: 1,
            code: 'NT_B1_REQUEST',
            name: 'Nhà thầu đề nghị nghiệm thu',
            description: 'Nhà thầu thi công gửi thông báo hoàn thành hạng mục/công trình và đề nghị Ban QLDA tổ chức nghiệm thu. Hồ sơ kèm theo: Biên bản nghiệm thu nội bộ, Nhật ký thi công, Kết quả thí nghiệm, Hồ sơ vật liệu.',
            department: 'REQUESTOR',
            department_label: 'Nhà thầu thi công',
            action_label: 'Đề nghị nghiệm thu',
            sla_days: 0,
            is_external: true,
        },
        {
            step_no: 2,
            code: 'NT_B2_DOC_CHECK',
            name: 'Kiểm tra hồ sơ nghiệm thu',
            description: 'Phòng KT-TĐ kiểm tra tính đầy đủ, hợp lệ của hồ sơ nghiệm thu. Xác nhận các thí nghiệm, chứng chỉ vật liệu đã đạt yêu cầu.',
            department: 'KT_TD',
            department_label: 'Phòng KT-TĐ',
            action_label: 'Kiểm tra hồ sơ',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 3,
            code: 'NT_B3_FIELD',
            name: 'Kiểm tra thực địa & lập biên bản',
            description: 'Phòng ĐHDA chủ trì, phối hợp với tư vấn giám sát, tư vấn thiết kế và nhà thầu tổ chức kiểm tra thực địa. Lập biên bản nghiệm thu hoàn thành công trình.',
            department: 'DHDA',
            department_label: 'Phòng ĐHDA',
            action_label: 'Lập biên bản',
            sla_days: 5,
            is_external: false,
            forms: ['BB-NT-HT'],
        },
        {
            step_no: 4,
            code: 'NT_B4_APPROVE',
            name: 'Giám đốc ký biên bản nghiệm thu',
            description: 'Giám đốc Ban QLDA ký biên bản nghiệm thu hoàn thành. Quyết định đưa công trình vào sử dụng.',
            department: 'DIRECTOR',
            department_label: 'Giám đốc Ban QLDA',
            action_label: 'Ký nghiệm thu',
            sla_days: 3,
            is_external: false,
        },
        {
            step_no: 5,
            code: 'NT_B5_HANDOVER',
            name: 'Bàn giao công trình cho đơn vị quản lý',
            description: 'Phòng ĐHDA tổ chức bàn giao công trình, hồ sơ hoàn công cho đơn vị quản lý vận hành. Ký biên bản bàn giao.',
            department: 'DHDA',
            department_label: 'Phòng ĐHDA',
            action_label: 'Bàn giao',
            sla_days: 5,
            is_external: false,
            forms: ['BB-BG-CT'],
        },
        {
            step_no: 6,
            code: 'NT_B6_ARCHIVE',
            name: 'Lưu hồ sơ nghiệm thu, hoàn công',
            description: 'Phòng HC-TH lưu trữ toàn bộ hồ sơ nghiệm thu, hoàn công theo quy định lưu trữ công trình xây dựng.',
            department: 'HC_TH',
            department_label: 'Phòng HC-TH',
            action_label: 'Lưu hồ sơ',
            sla_days: 5,
            is_external: false,
        },
    ],
};

// --- Quy trình Thẩm định Thiết kế Kỹ thuật ---
// Mã: QT.07.TDTKKT — Căn cứ: NĐ 15/2021/NĐ-CP
export const WORKFLOW_THAM_DINH_TKKT: InternalWorkflowTemplate = {
    id: 'qt_07_tdtkkt',
    code: 'QT.07.TDTKKT',
    name: 'Thẩm định thiết kế kỹ thuật',
    description: 'Quy trình thẩm định thiết kế kỹ thuật và dự toán xây dựng công trình',
    legal_basis: [
        'Nghị định 15/2021/NĐ-CP ngày 03/3/2021 về quản lý dự án đầu tư xây dựng',
        'Thông tư 12/2021/TT-BXD ngày 31/8/2021',
        'TCVN ISO 9001:2015',
    ],
    applicable_doc_types: ['design_detail', 'cost_estimate', 'design_review'],
    applicable_phases: ['implementation'],
    steps: [
        {
            step_no: 1,
            code: 'TD_B1_SUBMIT',
            name: 'Nhà thầu tư vấn nộp hồ sơ TKKT',
            description: 'Tư vấn thiết kế nộp hồ sơ thiết kế kỹ thuật - dự toán gồm: Thuyết minh thiết kế, Bản vẽ TKKT, Dự toán chi tiết, Báo cáo kết quả khảo sát, Hồ sơ kỹ thuật liên quan.',
            department: 'REQUESTOR',
            department_label: 'Tư vấn thiết kế',
            action_label: 'Nộp hồ sơ TKKT',
            sla_days: 0,
            is_external: true,
        },
        {
            step_no: 2,
            code: 'TD_B2_RECEIVE',
            name: 'Tiếp nhận & phân công thẩm định',
            description: 'Phòng HC-TH tiếp nhận hồ sơ. Phân công cán bộ Phòng KT-TĐ chủ trì thẩm định.',
            department: 'HC_TH',
            department_label: 'Phòng HC-TH',
            action_label: 'Tiếp nhận & phân công',
            sla_days: 1,
            is_external: false,
        },
        {
            step_no: 3,
            code: 'TD_B3_TECH',
            name: 'Thẩm định kỹ thuật',
            description: 'Phòng KT-TĐ chủ trì thẩm định: Kiểm tra sự phù hợp với quy chuẩn, tiêu chuẩn; Kiểm tra giải pháp kỹ thuật, an toàn; Kiểm tra dự toán đơn giá, định mức. Có thể thuê tư vấn thẩm tra độc lập.',
            department: 'KT_TD',
            department_label: 'Phòng KT-TĐ',
            action_label: 'Thẩm định kỹ thuật',
            sla_days: 20,
            is_external: false,
            forms: ['BM-TDTK-01', 'BM-TDTK-02'],
        },
        {
            step_no: 4,
            code: 'TD_B4_COST',
            name: 'Thẩm định dự toán',
            description: 'Phòng KH-TC thẩm định phần tài chính: Kiểm tra tổng mức đầu tư, dự toán gói thầu; Đối chiếu đơn giá với quyết định hiện hành; Kiểm tra khối lượng dự toán.',
            department: 'KH_TC',
            department_label: 'Phòng KH-TC',
            action_label: 'Thẩm định dự toán',
            sla_days: 10,
            is_external: false,
        },
        {
            step_no: 5,
            code: 'TD_B5_APPROVE',
            name: 'Giám đốc phê duyệt TKKT-DT',
            description: 'Giám đốc Ban QLDA ký quyết định phê duyệt thiết kế kỹ thuật và dự toán xây dựng công trình.',
            department: 'DIRECTOR',
            department_label: 'Giám đốc Ban QLDA',
            action_label: 'Phê duyệt TKKT-DT',
            sla_days: 5,
            is_external: false,
            forms: ['QĐ-PDTK'],
        },
    ],
};

// Registry tất cả workflow nội bộ
export const CDE_INTERNAL_WORKFLOW_TEMPLATES: InternalWorkflowTemplate[] = [
    WORKFLOW_QUYET_TOAN,
    WORKFLOW_THANH_TOAN,
    WORKFLOW_NGHIEM_THU,
    WORKFLOW_THAM_DINH_TKKT,
];

// Map department → màu badge
export const DEPT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    REQUESTOR: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' },
    HC_TH:     { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
    DHDA:      { bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-warning-700 dark:text-warning-300', border: 'border-warning-300 dark:border-warning-700' },
    PTDV:      { bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-warning-700 dark:text-warning-300', border: 'border-warning-300 dark:border-warning-700' },
    KT_TD:     { bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-300 dark:border-violet-700' },
    KH_TC:     { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-300 dark:border-emerald-700' },
    DIRECTOR:  { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' },
    EXTERNAL:  { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', border: 'border-slate-300 dark:border-slate-600' },
};

// --- Helper functions ---
export function getStatusColor(status: string): string {
    return CDE_STATUS_CONFIG[status as CDEStatusCode]?.color || '#9ca3af';
}

export function getStatusLabel(status: string): string {
    return CDE_STATUS_CONFIG[status as CDEStatusCode]?.label || status;
}

export function getContainerFromStatus(status: string): CDEContainerType {
    return CDE_STATUS_CONFIG[status as CDEStatusCode]?.container || 'WIP';
}

export function formatFileSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${bytes} B`;
}
