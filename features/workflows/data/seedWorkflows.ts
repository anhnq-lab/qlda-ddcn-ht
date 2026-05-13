export interface WorkflowTemplate {
    name: string;
    code: string;
    category: string;
    description: string;
    steps: Array<{
        id?: string;
        name: string;
        type: string;
        role: string;
        sla: string;
        metadata?: any;
    }>;
    edges?: Array<{
        source: string;
        target: string;
        label?: string;
        condition?: string;
    }>;
}

export function getStandardWorkflowTemplates(): WorkflowTemplate[] {
    // ---------------------------------------------------------
    // QUY TRÌNH 1: THIẾT KẾ 1 BƯỚC (QT-TK1B)
    // ---------------------------------------------------------
    const WF_1STEP: WorkflowTemplate = {
        name: 'Quy trình DAXD - Thiết kế 1 bước',
        code: 'QT-TK1B',
        category: 'project',
        description: 'Áp dụng cho dự án quy mô nhỏ, công trình có tính chất kỹ thuật đơn giản, lập Báo cáo Kinh tế - Kỹ thuật (TKBVTC tích hợp).',
        steps: [
            // Giai đoạn 1: Chuẩn bị dự án
            { name: '1.1 Lập, thẩm định, phê duyệt chủ trương đầu tư (nếu có)', type: 'start', role: 'CĐT / Cấp thẩm quyền', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.2 Giao nhiệm vụ lập BCKTKT', type: 'input', role: 'Cơ quan có thẩm quyền', sla: '5d', metadata: { phase: 'preparation' } },
            { name: '1.3 Lựa chọn nhà thầu Tư vấn khảo sát, lập BCKTKT', type: 'input', role: 'CĐT / BQLDA', sla: '20d', metadata: { phase: 'preparation' } },
            { name: '1.4 Khảo sát xây dựng, lập BCKTKT (bao gồm TKBVTC & Dự toán)', type: 'input', role: 'Đơn vị tư vấn', sla: '45d', metadata: { phase: 'preparation' } },
            { name: '1.5 Thẩm tra thiết kế bản vẽ thi công và dự toán', type: 'input', role: 'Tư vấn thẩm tra', sla: '15d', metadata: { phase: 'preparation' } },
            { name: '1.6 Thẩm định BCKTKT', type: 'input', role: 'CQCM / CĐT', sla: '15d', metadata: { phase: 'preparation' } },
            { name: '1.7 Phê duyệt BCKTKT (Phê duyệt dự án)', type: 'approval', role: 'Người quyết định ĐT', sla: '5d', metadata: { phase: 'preparation' } },
            
            // Giai đoạn 2: Thực hiện dự án
            { name: '2.1 Lập, thẩm định, phê duyệt Kế hoạch LCNT', type: 'input', role: 'CĐT / Người quyết định ĐT', sla: '20d', metadata: { phase: 'execution' } },
            { name: '2.2 Bồi thường, Hỗ trợ và Tái định cư (GPMB - nếu có)', type: 'input', role: 'Hội đồng GPMB / CĐT', sla: '90d', metadata: { phase: 'execution' } },
            { name: '2.3 Tổ chức LCNT (Thi công xây lắp & TVGS) và Ký kết hợp đồng', type: 'input', role: 'BQLDA / Tổ chuyên gia', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.4 Thông báo khởi công, tiến hành thi công', type: 'input', role: 'CĐT / Nhà thầu', sla: '365d', metadata: { phase: 'execution' } },
            { name: '2.5 Quản lý thi công, nghiệm thu giai đoạn, thanh toán', type: 'input', role: 'TVGS / CĐT / Nhà thầu', sla: '30d', metadata: { phase: 'execution' } },

            // Giai đoạn 3: Kết thúc xây dựng
            { name: '3.1 Nghiệm thu hoàn thành, bàn giao đưa vào sử dụng', type: 'input', role: 'CĐT / CQCM / Nhà thầu', sla: '20d', metadata: { phase: 'completion' } },
            { name: '3.2 Lập, thẩm tra và phê duyệt Quyết toán dự án hoàn thành', type: 'approval', role: 'CĐT / Cơ quan tài chính', sla: '60d', metadata: { phase: 'completion' } },
            { name: '3.3 Bảo hành công trình, tất toán tài khoản dự án', type: 'end', role: 'CĐT / Nhà thầu / KBNN', sla: '365d', metadata: { phase: 'completion' } },
        ]
    };

    // ---------------------------------------------------------
    // QUY TRÌNH 2: THIẾT KẾ 2 BƯỚC (QT-TK2B)
    // ---------------------------------------------------------
    const WF_2STEP: WorkflowTemplate = {
        name: 'Quy trình DAXD - Thiết kế 2 bước',
        code: 'QT-TK2B',
        category: 'project',
        description: 'Áp dụng cho dự án lập Báo cáo nghiên cứu khả thi (BCNCKT), yêu cầu bước Thiết kế cơ sở (TKCS) trước khi tiến hành Thiết kế bản vẽ thi công.',
        steps: [
            // Giai đoạn 1: Chuẩn bị dự án
            { name: '1.1 Lập, thẩm định, phê duyệt chủ trương đầu tư', type: 'start', role: 'CĐT / Cấp thẩm quyền', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.2 Lựa chọn nhà thầu Tư vấn khảo sát, lập BCNCKT', type: 'input', role: 'CĐT / BQLDA', sla: '20d', metadata: { phase: 'preparation' } },
            { name: '1.3 Lập BCNCKT (bao gồm Thiết kế cơ sở)', type: 'input', role: 'Đơn vị tư vấn', sla: '60d', metadata: { phase: 'preparation' } },
            { name: '1.4 Xin ý kiến thỏa thuận chuyên ngành (PCCC, Môi trường, Quy hoạch)', type: 'input', role: 'CĐT / Cơ quan chức năng', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.5 Thẩm định BCNCKT và Thiết kế cơ sở', type: 'input', role: 'CQCM / CĐT', sla: '20d', metadata: { phase: 'preparation' } },
            { name: '1.6 Phê duyệt Dự án đầu tư xây dựng', type: 'approval', role: 'Người quyết định ĐT', sla: '5d', metadata: { phase: 'preparation' } },

            // Giai đoạn 2: Thực hiện dự án
            { name: '2.1 Lựa chọn nhà thầu Tư vấn TKBVTC', type: 'input', role: 'CĐT / BQLDA', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.2 Lập Thiết kế bản vẽ thi công và Dự toán', type: 'input', role: 'Đơn vị tư vấn', sla: '60d', metadata: { phase: 'execution' } },
            { name: '2.3 Thẩm tra Thiết kế bản vẽ thi công và Dự toán', type: 'input', role: 'Tư vấn thẩm tra', sla: '20d', metadata: { phase: 'execution' } },
            { name: '2.4 Thẩm định và Phê duyệt Thiết kế bản vẽ thi công & Dự toán', type: 'approval', role: 'CĐT / CQCM', sla: '20d', metadata: { phase: 'execution' } },
            { name: '2.5 Lập, thẩm định, phê duyệt Kế hoạch LCNT', type: 'input', role: 'CĐT / Người quyết định ĐT', sla: '20d', metadata: { phase: 'execution' } },
            { name: '2.6 Bồi thường, Hỗ trợ và Tái định cư (GPMB)', type: 'input', role: 'Hội đồng GPMB / CĐT', sla: '90d', metadata: { phase: 'execution' } },
            { name: '2.7 Tổ chức LCNT (Thi công xây lắp & TVGS) và Ký kết hợp đồng', type: 'input', role: 'BQLDA / Tổ chuyên gia', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.8 Thi công xây dựng, Quản lý thi công, thanh toán định kỳ', type: 'input', role: 'TVGS / CĐT / Nhà thầu', sla: '500d', metadata: { phase: 'execution' } },

            // Giai đoạn 3: Kết thúc xây dựng
            { name: '3.1 Nghiệm thu hoàn thành, bàn giao đưa vào sử dụng', type: 'input', role: 'CĐT / CQCM / Nhà thầu', sla: '30d', metadata: { phase: 'completion' } },
            { name: '3.2 Lập, thẩm tra và phê duyệt Quyết toán dự án hoàn thành', type: 'approval', role: 'CĐT / Cơ quan tài chính', sla: '90d', metadata: { phase: 'completion' } },
            { name: '3.3 Bảo hành công trình, tất toán tài khoản dự án', type: 'end', role: 'CĐT / Nhà thầu / KBNN', sla: '365d', metadata: { phase: 'completion' } },
        ]
    };

    // ---------------------------------------------------------
    // QUY TRÌNH 3: THIẾT KẾ 3 BƯỚC (QT-TK3B)
    // ---------------------------------------------------------
    const WF_3STEP: WorkflowTemplate = {
        name: 'Quy trình DAXD - Thiết kế 3 bước',
        code: 'QT-TK3B',
        category: 'project',
        description: 'Áp dụng cho dự án quy mô lớn, phức tạp yêu cầu 3 bước: Thiết kế cơ sở -> Thiết kế kỹ thuật -> Thiết kế bản vẽ thi công.',
        steps: [
            // Giai đoạn 1: Chuẩn bị dự án
            { name: '1.1 Lập, thẩm định, phê duyệt chủ trương đầu tư', type: 'start', role: 'CĐT / Cấp thẩm quyền', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.2 Lựa chọn nhà thầu Tư vấn khảo sát, lập BCNCKT', type: 'input', role: 'CĐT / BQLDA', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.3 Lập BCNCKT (bao gồm Thiết kế cơ sở)', type: 'input', role: 'Đơn vị tư vấn', sla: '90d', metadata: { phase: 'preparation' } },
            { name: '1.4 Xin ý kiến thỏa thuận chuyên ngành', type: 'input', role: 'CĐT / Cơ quan chức năng', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.5 Thẩm định BCNCKT và Thiết kế cơ sở', type: 'input', role: 'CQCM / CĐT', sla: '30d', metadata: { phase: 'preparation' } },
            { name: '1.6 Phê duyệt Dự án đầu tư xây dựng', type: 'approval', role: 'Người quyết định ĐT', sla: '10d', metadata: { phase: 'preparation' } },

            // Giai đoạn 2: Thực hiện dự án
            { name: '2.1 Lựa chọn nhà thầu Tư vấn thiết kế kỹ thuật (TKKT)', type: 'input', role: 'CĐT / BQLDA', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.2 Lập Thiết kế kỹ thuật và Tổng dự toán chi tiết', type: 'input', role: 'Đơn vị tư vấn', sla: '80d', metadata: { phase: 'execution' } },
            { name: '2.3 Thẩm tra Thiết kế kỹ thuật', type: 'input', role: 'Tư vấn thẩm tra', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.4 Thẩm định và Phê duyệt Thiết kế kỹ thuật', type: 'approval', role: 'CQCM / CĐT', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.5 Lập Thiết kế bản vẽ thi công và Dự toán hạng mục', type: 'input', role: 'Đơn vị tư vấn', sla: '60d', metadata: { phase: 'execution' } },
            { name: '2.6 Thẩm tra, Thẩm định Thiết kế bản vẽ thi công', type: 'input', role: 'CQCM / Tư vấn thẩm tra', sla: '30d', metadata: { phase: 'execution' } },
            { name: '2.7 Phê duyệt Thiết kế bản vẽ thi công', type: 'approval', role: 'CĐT', sla: '10d', metadata: { phase: 'execution' } },
            { name: '2.8 Lập, thẩm định, phê duyệt Kế hoạch LCNT', type: 'input', role: 'CĐT / Người quyết định ĐT', sla: '20d', metadata: { phase: 'execution' } },
            { name: '2.9 Bồi thường, Hỗ trợ và Tái định cư (GPMB)', type: 'input', role: 'Hội đồng GPMB / CĐT', sla: '120d', metadata: { phase: 'execution' } },
            { name: '2.10 Tổ chức LCNT (Xây lắp & TVGS) và Ký kết hợp đồng', type: 'input', role: 'BQLDA / Tổ chuyên gia', sla: '45d', metadata: { phase: 'execution' } },
            { name: '2.11 Thi công xây dựng, Quản lý thi công, thanh toán định kỳ', type: 'input', role: 'TVGS / CĐT / Nhà thầu', sla: '700d', metadata: { phase: 'execution' } },

            // Giai đoạn 3: Kết thúc xây dựng
            { name: '3.1 Nghiệm thu hoàn thành, bàn giao đưa vào sử dụng', type: 'input', role: 'CĐT / CQCM / Nhà thầu', sla: '30d', metadata: { phase: 'completion' } },
            { name: '3.2 Lập, thẩm tra và phê duyệt Quyết toán dự án hoàn thành', type: 'approval', role: 'CĐT / Cơ quan tài chính', sla: '120d', metadata: { phase: 'completion' } },
            { name: '3.3 Bảo hành công trình, tất toán tài khoản dự án', type: 'end', role: 'CĐT / Nhà thầu / KBNN', sla: '730d', metadata: { phase: 'completion' } },
        ]
    };

    return [WF_1STEP, WF_2STEP, WF_3STEP];
}