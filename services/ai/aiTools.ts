import { FunctionDeclaration, SchemaType as Type } from '@google/generative-ai';

/**
 * Tool definitions in Gemini format for function calling
 */
export const AI_TOOLS_GEMINI: FunctionDeclaration[] = [
    {
        name: 'get_all_projects',
        description: 'Lấy danh sách tất cả dự án đầu tư công. Dùng khi user hỏi về danh sách dự án, tổng số dự án, dự án theo trạng thái, hoặc lọc theo phòng quản lý dự án (Ban QLDA/Phòng QLDA).',
        parameters: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, description: 'Lọc theo trạng thái: 1=Chuẩn bị, 2=Thực hiện, 3=Hoàn thành' },
                search: { type: Type.STRING, description: 'Từ khóa tìm kiếm tên dự án' },
                board: { type: Type.NUMBER, description: 'Lọc theo mã phòng ban (ManagementBoard): 1=Phòng QLDA 1, 2=Phòng QLDA 2, 3=Phòng QLDA 3, 4=Phòng Phát triển dịch vụ' },
            },
        },
    },
    {
        name: 'get_project_by_id',
        description: 'Lấy thông tin chi tiết một dự án theo ProjectID. Dùng khi user hỏi chi tiết về một dự án cụ thể.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: 'Mã dự án (ProjectID)' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_project_statistics',
        description: 'Lấy thống kê tổng hợp về dự án: tổng số, phân bổ theo trạng thái, tổng vốn đầu tư. Dùng khi user hỏi tổng quan, thống kê.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'get_all_contracts',
        description: 'Lấy danh sách tất cả hợp đồng. Dùng khi user hỏi về hợp đồng, tổng giá trị HĐ, HĐ theo trạng thái.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                status: { type: Type.STRING, description: 'Lọc theo trạng thái: 1=Đang thực hiện, 2=Tạm dừng, 3=Đã thanh lý' },
            },
        },
    },
    {
        name: 'get_all_payments',
        description: 'Lấy danh sách thanh toán. Dùng khi user hỏi về tiến độ thanh toán, số tiền đã giải ngân.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                contractId: { type: Type.STRING, description: 'Lọc theo mã hợp đồng' },
            },
        },
    },
    {
        name: 'get_dashboard_metrics',
        description: 'Lấy chỉ số tổng hợp dashboard: tổng vốn đầu tư, tổng giải ngân, tỷ lệ giải ngân. Dùng khi user hỏi tổng quan tình hình.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'get_capital_info',
        description: 'Lấy thông tin vốn và giải ngân của một dự án. Dùng khi user hỏi về vốn, giải ngân của dự án cụ thể.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: 'Mã dự án' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_dashboard_risks',
        description: 'Lấy danh sách cảnh báo rủi ro hiện tại. Dùng khi user hỏi về rủi ro, cảnh báo, vấn đề cần xử lý.',
        parameters: { type: Type.OBJECT, properties: {} },
    },
    {
        name: 'get_upcoming_deadlines',
        description: 'Lấy danh sách công việc sắp đến hạn trong N ngày tới. Dùng khi user hỏi về deadline, việc cần làm.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                days: { type: Type.NUMBER, description: 'Số ngày tới cần kiểm tra (mặc định 30)' },
            },
        },
    },
    {
        name: 'get_project_tasks',
        description: 'Lấy danh sách công việc của một dự án: tiêu đề, trạng thái, tiến độ, deadline. Dùng khi user hỏi kế hoạch, tiến độ công việc của dự án.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: 'Mã dự án (ProjectID)' },
            },
            required: ['projectId'],
        },
    },
    {
        name: 'get_contract_expiry',
        description: 'Lấy danh sách hợp đồng sắp hết hạn trong N ngày tới. Dùng khi user hỏi về HĐ sắp hết hạn, cần gia hạn.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                days: { type: Type.NUMBER, description: 'Số ngày tới cần kiểm tra (mặc định 60)' },
            },
        },
    },
    {
        name: 'get_bidding_packages',
        description: 'Lấy danh sách gói thầu của một dự án hoặc tất cả gói thầu. Dùng khi user hỏi về đấu thầu, gói thầu, KHLCNT.',
        parameters: {
            type: Type.OBJECT,
            properties: {
                projectId: { type: Type.STRING, description: 'Mã dự án (để trống = lấy tất cả)' },
            },
        },
    },
];

// Provide backward compatibility export names if needed
export const AI_TOOLS = AI_TOOLS_GEMINI;
export const AI_TOOLS_OAI = AI_TOOLS_GEMINI; // exported just so imports don't break immediately

/**
 * Quick suggestion buttons cho chatbot UI
 */
export const QUICK_SUGGESTIONS = [
    { label: '📊 Tổng quan', prompt: 'Cho tôi tổng quan tình hình dự án và giải ngân hiện tại' },
    { label: '⚠️ Rủi ro', prompt: 'Có cảnh báo rủi ro nào cần xử lý không?' },
    { label: '💰 Giải ngân', prompt: 'Tiến độ giải ngân hiện tại như thế nào so với kế hoạch năm?' },
    { label: '📅 Deadline', prompt: 'Những công việc nào sắp đến hạn trong 30 ngày tới?' },
    { label: '📝 HĐ hết hạn', prompt: 'Hợp đồng nào sắp hết hạn trong 60 ngày tới?' },
    { label: '🏗️ Dự án lớn', prompt: 'Liệt kê 5 dự án có tổng mức đầu tư lớn nhất' },
];
