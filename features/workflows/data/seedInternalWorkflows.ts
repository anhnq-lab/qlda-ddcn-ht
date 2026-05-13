import type { WorkflowTemplate } from './seedWorkflows';

export function getInternalWorkflowTemplates(): WorkflowTemplate[] {
    const QT_TDTK: WorkflowTemplate = {
        name: 'Thẩm định, phê duyệt thiết kế - dự toán xây dựng triển khai sau thiết kế cơ sở',
        code: 'QT-01/TĐTK',
        category: 'other',
        description: 'Quy trình thẩm định, phê duyệt thiết kế - dự toán xây dựng triển khai sau thiết kế cơ sở được chia thành 5 bước cụ thể theo Quy định.',
        steps: [
            {
                name: '1. Khởi tạo và trình hồ sơ',
                type: 'start', 
                role: 'Ban điều hành dự án (BĐH)', 
                sla: '1d',
                metadata: {
                    phase: 'reception',
                    guidelines: `- **Chủ thể phụ trách**: Ban điều hành dự án (BĐH)\n- **Hành động 1.1 (Nhánh Nội bộ)**: BĐH kiểm tra hồ sơ và chuyển toàn bộ hồ sơ thiết kế đến Phòng Kỹ thuật - Chất lượng (P.KTCL) để bắt đầu thẩm định nội bộ.\n- **Hành động 1.2 (Nhánh Nhà nước)**: Đồng thời, BĐH lập Tờ trình (theo biểu mẫu BM04) trình Ban Giám đốc (BGĐ) ký gửi Cơ quan chuyên môn (CQCM) về xây dựng để thẩm định.\n- **Yêu cầu kết quả**: Hồ sơ được chuyển thành công đến P.KTCL và Tờ trình gửi CQCM được BGĐ ký duyệt.\n- **Thời gian**: Thực hiện ngay khi bắt đầu.`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'BĐH kiểm tra điều kiện năng lực, sự đáp ứng yêu cầu thiết kế và khối lượng, chủng loại.', assignee_role: 'BĐH' },
                        { id: crypto.randomUUID(), name: 'BĐH chuyển hồ sơ đến P.KTCL để thẩm định song song cùng CQCM.', assignee_role: 'BĐH' },
                        { id: crypto.randomUUID(), name: 'BĐH lập tờ trình trình Ban Giám đốc (BGĐ) ký gửi CQCM để thẩm định.', assignee_role: 'BĐH' },
                    ]
                }
            },
            {
                name: '2. Tiến hành thẩm định và Phân luồng',
                type: 'input', 
                role: 'Phòng KTCL & CQCM', 
                sla: '40d',
                metadata: {
                    phase: 'review',
                    guidelines: `- **Luồng 2A: Thẩm định Nội bộ (Tại P.KTCL)**\n  - **Hành động**: P.KTCL tiếp nhận hồ sơ từ BĐH và lập báo cáo thẩm định nội nghiệp.\n  - **Quyết định**: Nhận định kết quả lập báo cáo. Nếu "Không đạt", trả lại hồ sơ cho BĐH. Nếu "Đạt", P.KTCL ký Báo cáo thẩm định trình BGĐ.\n  - **Thời gian**: Không quá 40 ngày (Công trình cấp I), 15 ngày (Cấp II, III), 10 ngày (Công trình còn lại).\n- **Luồng 2B: Thẩm định Nhà nước (Tại CQCM)**\n  - **Hành động**: CQCM tiếp nhận tờ trình từ BGĐ và thẩm định.\n  - **Quyết định**: Nếu "Đạt", CQCM phát hành "Thông báo Kết quả thẩm định".`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Luồng 2A: P.KTCL thực hiện thẩm định theo quy định. Sau đó lập báo cáo kết quả trình lên BGĐ.', assignee_role: 'P.KTCL' },
                        { id: crypto.randomUUID(), name: 'Luồng 2B: CQCM nhận hồ sơ, tiến hành thẩm định và gửi thông báo kết quả thẩm định cho BĐH.', assignee_role: 'CQCM' },
                    ]
                }
            },
            {
                name: '3. Hội tụ, tổng hợp và thông báo của CĐT',
                type: 'input', 
                role: 'Ban Giám đốc (BGĐ)', 
                sla: '5d',
                metadata: {
                    phase: 'consolidation',
                    guidelines: `*(Chỉ kích hoạt khi Nhánh 2A và 2B đều ĐẠT)*\n- **Chủ thể phụ trách**: Ban Giám đốc (BGĐ) và P.KTCL\n- **Hành động 3.1 & 3.2**: Căn cứ thông báo của CQCM, xem xét các ý kiến. P.KTCL lập Báo cáo tổng hợp kết quả thẩm định trình Ban Giám đốc (Đối với công trình cấp I do Hội đồng Kỹ thuật quyết định).\n- **Hành động 3.3**: Ban Giám đốc ký ban hành "Thông báo thẩm định của Chủ đầu tư".\n- **Yêu cầu kết quả**: Thông báo kết quả thẩm định được ban hành.`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'P.KTCL căn cứ thông báo của CQCM, xem xét và lập báo cáo tổng hợp để BGĐ ban hành thông báo.', assignee_role: 'P.KTCL' },
                        { id: crypto.randomUUID(), name: 'BGĐ ban hành thông báo tiếp thu, giải trình ý kiến của CQCM (nếu có yêu cầu chỉnh sửa).', assignee_role: 'BGĐ' },
                    ]
                }
            },
            {
                name: '4. Phê duyệt thiết kế - dự toán',
                type: 'approval', 
                role: 'Ban Giám đốc (BGĐ)', 
                sla: '5d',
                metadata: {
                    phase: 'approval',
                    guidelines: `- **Chủ thể phụ trách**: P.KTCL phối hợp BĐH trình Ban Giám đốc.\n- **Hành động**: Ban Giám đốc (Ban DDCN) chính thức ký Quyết định Phê duyệt Thiết kế - Dự toán. Chủ đầu tư sau đó gửi hồ sơ đóng dấu thẩm định đến Sở Xây dựng lưu trữ.\n- **Yêu cầu kết quả**: Quyết định phê duyệt được ban hành (BM 07).`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'BGĐ phê duyệt thiết kế - dự toán.', assignee_role: 'BGĐ' },
                        { id: crypto.randomUUID(), name: 'Phòng ban liên quan đóng dấu thẩm định, phê duyệt và lưu trữ hồ sơ theo quy định.', assignee_role: 'Phòng ban liên quan' },
                    ]
                }
            },
            {
                name: '5. Nghiệm thu',
                type: 'end', 
                role: 'Hội đồng Kỹ thuật / BĐH', 
                sla: '10d',
                metadata: {
                    phase: 'completion',
                    guidelines: `- **Hành động**: Thực hiện việc nghiệm thu hồ sơ thiết kế theo kế hoạch. BĐH chủ trì cùng với các thành phần liên quan.`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Thực hiện việc nghiệm thu hồ sơ thiết kế theo kế hoạch.', assignee_role: 'Hội đồng Kỹ thuật / BĐH' },
                    ]
                }
            },
        ]
    };

    const QT_KHLCNT: WorkflowTemplate = {
        name: 'Lập, thẩm định và phê duyệt Kế hoạch lựa chọn nhà thầu',
        code: 'QT-02/KHLCNT',
        category: 'other', // 'procurement' không có trong enum workflow_category → dùng 'other'
        description: 'Quy trình chuẩn bị, lập, thẩm định và phê duyệt KHLCNT áp dụng trong nội bộ Ban.',
        steps: [
            {
                name: '1. Lập Kế hoạch LCNT',
                type: 'start',
                role: 'Phòng Kế hoạch',
                sla: '3d',
                metadata: {
                    phase: 'reception',
                    guidelines: 'Chuyên viên phòng Kế hoạch căn cứ danh mục dự án, nguồn vốn để lập dự thảo KHLCNT.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tập hợp tài liệu pháp lý, QĐ phê duyệt dự án/dự toán.', assignee_role: 'Phòng Kế hoạch' },
                        { id: crypto.randomUUID(), name: 'Lập tờ trình và biểu mẫu KHLCNT.', assignee_role: 'Phòng Kế hoạch' }
                    ]
                }
            },
            {
                name: '2. Thẩm định nội bộ',
                type: 'input',
                role: 'Lãnh đạo Phòng Kế hoạch',
                sla: '2d',
                metadata: {
                    phase: 'review',
                    guidelines: 'Lãnh đạo phòng Kế hoạch kiểm tra tính hợp lệ, định mức, hình thức LCNT.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra phương thức, hình thức đấu thầu.', assignee_role: 'Lãnh đạo PKH' }
                    ]
                }
            },
            {
                name: '3. Phê duyệt',
                type: 'approval',
                role: 'Ban Giám đốc',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    guidelines: 'Trình Ban Giám đốc phê duyệt KHLCNT.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Ký Quyết định phê duyệt KHLCNT.', assignee_role: 'Ban Giám đốc' }
                    ]
                }
            },
            {
                name: '4. Đăng tải KHLCNT',
                type: 'end',
                role: 'Phòng Kế hoạch',
                sla: '1d',
                metadata: {
                    phase: 'completion',
                    guidelines: 'Đăng tải công khai KHLCNT lên mạng đấu thầu quốc gia theo quy định.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Đăng tải KHLCNT trên hệ thống e-GP.', assignee_role: 'Phòng Kế hoạch' }
                    ]
                }
            }
        ]
    };

    const QT_THANHTOAN: WorkflowTemplate = {
        name: 'Tạm ứng, thanh quyết toán khối lượng',
        code: 'QT-03/TT',
        category: 'finance',
        description: 'Quy trình kiểm soát, đối chiếu và đề nghị thanh toán cho nhà thầu.',
        steps: [
            {
                name: '1. Tiếp nhận hồ sơ TT',
                type: 'start',
                role: 'Ban điều hành dự án',
                sla: '1d',
                metadata: {
                    phase: 'reception',
                    guidelines: 'BĐH tiếp nhận hồ sơ nghiệm thu, thanh toán từ nhà thầu.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra danh mục hồ sơ.', assignee_role: 'BĐH' }
                    ]
                }
            },
            {
                name: '2. Kiểm tra khối lượng',
                type: 'input',
                role: 'Phòng KTCL',
                sla: '3d',
                metadata: {
                    phase: 'review',
                    guidelines: 'Phòng KTCL kiểm tra khối lượng nghiệm thu so với bản vẽ và hợp đồng.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra khối lượng và ký xác nhận.', assignee_role: 'Phòng KTCL' }
                    ]
                }
            },
            {
                name: '3. Kiểm soát tài chính',
                type: 'input',
                role: 'Phòng Tài chính',
                sla: '3d',
                metadata: {
                    phase: 'review',
                    guidelines: 'Kiểm tra giá trị đề nghị thanh toán, số dư tạm ứng, điều khoản hợp đồng.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Soát xét hồ sơ tài chính.', assignee_role: 'Phòng Tài chính' }
                    ]
                }
            },
            {
                name: '4. Phê duyệt Ủy nhiệm chi',
                type: 'approval',
                role: 'Ban Giám đốc',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    guidelines: 'Ký duyệt chứng từ thanh toán gửi Kho bạc/Ngân hàng.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Ký UNC / Giấy đề nghị thanh toán.', assignee_role: 'Ban Giám đốc' }
                    ]
                }
            },
            {
                name: '5. Lưu hồ sơ kế toán',
                type: 'end',
                role: 'Phòng Tài chính',
                sla: '1d',
                metadata: {
                    phase: 'completion',
                    guidelines: 'Lưu trữ chứng từ kế toán theo quy định.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lưu trữ hồ sơ.', assignee_role: 'Phòng Tài chính' }
                    ]
                }
            }
        ]
    };

    const QT_VANBAN: WorkflowTemplate = {
        name: 'Tiếp nhận, xử lý và ban hành văn bản',
        code: 'QT-04/VB',
        category: 'document',
        description: 'Quy trình luân chuyển văn bản đến và đi trong Ban QLDA.',
        steps: [
            {
                name: '1. Tiếp nhận VB đến',
                type: 'start',
                role: 'Văn thư (Phòng HCTH)',
                sla: '4h',
                metadata: {
                    phase: 'reception',
                    guidelines: 'Văn thư nhận văn bản, vào sổ, số hóa và cập nhật lên hệ thống.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Đóng dấu đến, ghi số, ngày tháng.', assignee_role: 'Văn thư' },
                        { id: crypto.randomUUID(), name: 'Scan và nhập hệ thống.', assignee_role: 'Văn thư' }
                    ]
                }
            },
            {
                name: '2. Phân xử lý',
                type: 'input',
                role: 'Ban Giám đốc',
                sla: '4h',
                metadata: {
                    phase: 'review',
                    guidelines: 'BGĐ ghi ý kiến chỉ đạo và phân công phòng ban xử lý.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Chuyển VB cho phòng ban chủ trì.', assignee_role: 'BGĐ' }
                    ]
                }
            },
            {
                name: '3. Thực hiện xử lý',
                type: 'input',
                role: 'Phòng ban chuyên môn',
                sla: '3d',
                metadata: {
                    phase: 'consolidation',
                    guidelines: 'Phòng ban được giao chủ trì xử lý nội dung, soạn thảo văn bản phản hồi.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Nghiên cứu xử lý, dự thảo văn bản đi.', assignee_role: 'Chuyên viên' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo phòng ký nháy.', assignee_role: 'Lãnh đạo Phòng' }
                    ]
                }
            },
            {
                name: '4. Phê duyệt VB đi',
                type: 'approval',
                role: 'Ban Giám đốc',
                sla: '1d',
                metadata: {
                    phase: 'approval',
                    guidelines: 'BGĐ xem xét và ký duyệt văn bản đi.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Ký ban hành.', assignee_role: 'BGĐ' }
                    ]
                }
            },
            {
                name: '5. Phát hành và lưu trữ',
                type: 'end',
                role: 'Văn thư',
                sla: '4h',
                metadata: {
                    phase: 'completion',
                    guidelines: 'Văn thư đóng dấu, phát hành VB và lưu hồ sơ.',
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Phát hành VB đi.', assignee_role: 'Văn thư' }
                    ]
                }
            }
        ]
    };

    // =========================================================================
    // QT.KHTC.04 - Quyết toán vốn đầu tư dự án hoàn thành
    // Nguồn: QT.04.QTVDTDAHT.docx; BM.01-04-QT.KHTC.04.docx
    // Soạn thảo: Phạm Thị Oanh (Phụ trách KT); Soát xét: Nguyễn Thanh Bình (TP KH-TC); Phê duyệt: Bùi Huy Cường (GĐ)
    // Căn cứ pháp lý: NĐ 99/2021/NĐ-CP; TT 96/2021/TT-BTC; TT 79/2019/TT-BTC; QĐ 3024/QĐ-UBND
    // =========================================================================
    const QT_QUYETTOAN: WorkflowTemplate = {
        name: 'Quyết toán vốn đầu tư dự án hoàn thành',
        code: 'QT.KHTC.04',
        category: 'finance',
        description: 'Quy trình đánh giá việc thực hiện các quy định của nhà nước trong quá trình đầu tư thực hiện dự án, xác định rõ trách nhiệm của chủ đầu tư, các nhà thầu, cơ quan cấp vốn, cho vay, kiểm soát thanh toán và các cơ quan quản lý nhà nước có liên quan. Áp dụng cho các dự án sử dụng nguồn vốn nhà nước sau khi hoàn thành hoặc dừng thực hiện vĩnh viễn.',
        steps: [
            {
                name: 'B1. Chuẩn bị hồ sơ đề nghị quyết toán A-B',
                type: 'start',
                role: 'Đơn vị đề nghị quyết toán',
                sla: '3d',
                metadata: {
                    phase: 'reception',
                    guidelines: `**Đơn vị đề nghị quyết toán A-B chuẩn bị hồ sơ nộp về Ban QLDA gồm:**\n- Giấy đề nghị quyết toán A-B (BM.01-QT.KHTC.04)\n- Biên bản nghiệm thu khối lượng hoàn thành toàn bộ hợp đồng kèm theo:\n  - Bảng xác định khối lượng quyết toán A-B (BM.02-QT.KHTC.04)\n  - Bảng xác định giá trị khối lượng quyết toán A-B (BM.03-QT.KHTC.04)\n  - Hóa đơn giá trị gia tăng (nếu có)\n- Biên bản bàn giao công trình đưa vào sử dụng\n- Hồ sơ hoàn công\n- Hồ sơ quản lý chất lượng (nếu có)\n- Các hồ sơ, văn bản pháp lý khác liên quan (nếu có)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập Giấy đề nghị quyết toán A-B (BM.01-QT.KHTC.04).', assignee_role: 'Đơn vị đề nghị quyết toán' },
                        { id: crypto.randomUUID(), name: 'Lập Bảng xác định khối lượng quyết toán A-B (BM.02-QT.KHTC.04).', assignee_role: 'Đơn vị đề nghị quyết toán' },
                        { id: crypto.randomUUID(), name: 'Lập Bảng xác định giá trị khối lượng quyết toán A-B (BM.03-QT.KHTC.04).', assignee_role: 'Đơn vị đề nghị quyết toán' },
                        { id: crypto.randomUUID(), name: 'Tập hợp biên bản nghiệm thu, bàn giao công trình và hồ sơ hoàn công.', assignee_role: 'Đơn vị đề nghị quyết toán' },
                        { id: crypto.randomUUID(), name: 'Đóng gói và nộp hồ sơ về bộ phận một cửa Ban QLDA.', assignee_role: 'Đơn vị đề nghị quyết toán' },
                    ]
                }
            },
            {
                name: 'B2. Tiếp nhận và kiểm tra hồ sơ quyết toán A-B',
                type: 'input',
                role: 'Phòng HC-TH (Bộ phận một cửa)',
                sla: '1d',
                metadata: {
                    phase: 'reception',
                    guidelines: `**Phòng HC-TH (bộ phận một cửa)** kiểm tra, tiếp nhận hồ sơ quyết toán A-B sau đó:\n- Chuyển cho **Phòng ĐHDA** để kiểm tra xác nhận khối lượng\n- Chuyển cho **Phòng PTDV** (đối với chi phí GPMB, RPBM, ĐTM) để xử lý hồ sơ\n\n**Thời hạn:** ≤ 1 ngày làm việc`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra danh mục, tính đầy đủ của hồ sơ nộp vào.', assignee_role: 'Phòng HC-TH' },
                        { id: crypto.randomUUID(), name: 'Cập nhật sổ nhận hồ sơ, đóng dấu đến.', assignee_role: 'Phòng HC-TH' },
                        { id: crypto.randomUUID(), name: 'Phân loại và chuyển hồ sơ đến phòng ĐHDA hoặc PTDV.', assignee_role: 'Phòng HC-TH' },
                    ]
                }
            },
            {
                name: 'B3. Xác nhận khối lượng quyết toán A-B',
                type: 'input',
                role: 'Phòng ĐHDA / Phòng PTDV',
                sla: '3d',
                metadata: {
                    phase: 'review',
                    guidelines: `**Phòng ĐHDA / Phòng PTDV** kiểm tra hồ sơ kỹ thuật, xác nhận khối lượng đề nghị quyết toán A-B:\n- Đối chiếu khối lượng thực tế nghiệm thu với hồ sơ thiết kế và hợp đồng\n- Xác nhận biên bản nghiệm thu hoàn thành toàn bộ hợp đồng\n- Ký xác nhận vào Bảng xác định khối lượng quyết toán A-B\n- Chuyển hồ sơ về bộ phận một cửa\n\n**Thời hạn:** ≤ 3 ngày làm việc`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra hồ sơ kỹ thuật, đối chiếu khối lượng thực tế với hợp đồng.', assignee_role: 'Phòng ĐHDA / PTDV' },
                        { id: crypto.randomUUID(), name: 'Ký xác nhận khối lượng đề nghị quyết toán A-B.', assignee_role: 'Phòng ĐHDA / PTDV' },
                        { id: crypto.randomUUID(), name: 'Chuyển trả hồ sơ về bộ phận một cửa.', assignee_role: 'Phòng ĐHDA / PTDV' },
                    ]
                }
            },
            {
                name: 'B4. Kiểm tra, rà soát khối lượng quyết toán A-B',
                type: 'input',
                role: 'Phòng KT-TĐ',
                sla: '2d',
                metadata: {
                    phase: 'review',
                    guidelines: `**Phòng KT-TĐ** tiếp nhận hồ sơ từ bộ phận một cửa:\n- Kiểm tra, rà soát sự phù hợp của hồ sơ quyết toán A-B với thiết kế kỹ thuật và dự toán được duyệt\n- Đánh giá tính hợp lý, đúng đắn của các khối lượng kê khai\n- Chuyển trả hồ sơ về bộ phận một cửa sau khi hoàn thành\n\n**Thời hạn:** ≤ 2 ngày làm việc`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Rà soát sự phù hợp của hồ sơ quyết toán với thiết kế và dự toán duyệt.', assignee_role: 'Phòng KT-TĐ' },
                        { id: crypto.randomUUID(), name: 'Ký xác nhận và ghi ý kiến (nếu có) vào hồ sơ quyết toán.', assignee_role: 'Phòng KT-TĐ' },
                        { id: crypto.randomUUID(), name: 'Chuyển trả hồ sơ về bộ phận một cửa.', assignee_role: 'Phòng KT-TĐ' },
                    ]
                }
            },
            {
                name: 'B5. Kiểm tra giá trị đề nghị quyết toán A-B',
                type: 'input',
                role: 'Phòng KH-TC',
                sla: '3d',
                metadata: {
                    phase: 'review',
                    guidelines: `**Phòng KH-TC** tiếp nhận hồ sơ từ bộ phận một cửa:\n- Kiểm tra thể thức hồ sơ (mẫu biểu, chữ ký, con dấu)\n- Kiểm tra giá trị đề nghị quyết toán A-B (đơn giá, định mức, tổng giá trị)\n- Đối chiếu với hợp đồng và các phụ lục hợp đồng\n- Kiểm tra điều khoản bảo hành, phạt vi phạm (nếu có)\n- Chuyển trả hồ sơ về bộ phận một cửa\n\n**Thời hạn:** ≤ 3 ngày làm việc`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra thể thức hồ sơ, tính hợp lệ của mẫu biểu.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra giá trị quyết toán A-B theo điều khoản hợp đồng.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Ghi ý kiến vào hồ sơ và chuyển trả bộ phận một cửa.', assignee_role: 'Phòng KH-TC' },
                    ]
                }
            },
            {
                name: 'B6. Phê duyệt hồ sơ quyết toán A-B',
                type: 'approval',
                role: 'Giám đốc QLDA',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    guidelines: `**Bộ phận một cửa** tổng hợp ý kiến các phòng và trình **Giám đốc QLDA** xem xét phê duyệt hồ sơ quyết toán A-B:\n- Giám đốc xem xét toàn bộ hồ sơ và ý kiến các phòng ban\n- Ký duyệt hồ sơ quyết toán A-B nếu hợp lệ\n- Ghi yêu cầu bổ sung nếu hồ sơ chưa đầy đủ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Bộ phận một cửa tổng hợp hồ sơ và trình Giám đốc xem xét.', assignee_role: 'Phòng HC-TH' },
                        { id: crypto.randomUUID(), name: 'Giám đốc QLDA ký phê duyệt hồ sơ quyết toán A-B.', assignee_role: 'Giám đốc QLDA' },
                    ]
                }
            },
            {
                name: 'B7. Ban hành / Trả hồ sơ quyết toán A-B',
                type: 'input',
                role: 'Phòng HC-TH',
                sla: '1d',
                metadata: {
                    phase: 'consolidation',
                    guidelines: `**Phòng HC-TH (bộ phận một cửa)** xử lý theo kết quả phê duyệt:\n\n**Nếu hồ sơ chưa hợp lệ hoặc có sai sót:**\n- Thông báo cho đơn vị yêu cầu bổ sung, sửa đổi hồ sơ quyết toán A-B (quay lại B1)\n\n**Nếu hồ sơ hợp lệ được Giám đốc QLDA phê duyệt:**\n- Đóng dấu, ban hành hồ sơ\n- Gửi cho các phòng ban và đơn vị liên quan theo quy định\n\n**Thời hạn:** ≤ 1 ngày làm việc`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Đóng dấu và ban hành hồ sơ quyết toán A-B đã được phê duyệt.', assignee_role: 'Phòng HC-TH' },
                        { id: crypto.randomUUID(), name: 'Gửi hồ sơ cho đơn vị đề nghị quyết toán và các phòng liên quan.', assignee_role: 'Phòng HC-TH' },
                        { id: crypto.randomUUID(), name: 'Lưu trữ hồ sơ gốc tại bộ phận Văn thư.', assignee_role: 'Phòng HC-TH' },
                    ]
                }
            },
            {
                name: 'B8. Trình thẩm tra quyết toán vốn đầu tư dự án hoàn thành',
                type: 'input',
                role: 'Phòng KH-TC / Phòng ĐHDA / Phòng PTDV',
                sla: '120d',
                metadata: {
                    phase: 'review',
                    guidelines: `**Phòng KH-TC** chủ trì, phối hợp Phòng ĐHDA và Phòng PTDV thực hiện:\n\n**Tổng hợp hồ sơ quyết toán:**\n- Rà soát lại toàn bộ chi phí của dự án đầu tư\n- Phối hợp với Phòng ĐHDA giao hồ sơ công trình cho thanh tra/kiểm toán (nếu có)\n- Tổng hợp quyết toán chi phí GPMB (nếu có) từ các đơn vị thực hiện\n\n**Lập hồ sơ quyết toán:**\n- Lập Tờ trình đề nghị phê duyệt quyết toán của Chủ đầu tư (BM.04-QT.KHTC.04)\n- Lập Báo cáo quyết toán vốn đầu tư dự án hoàn thành theo TT 96/2021/TT-BTC (Mẫu 01-08/QTDA)\n- Trình Giám đốc Ban QLDA phê duyệt\n\n**Trình thẩm tra:**\n- Tập hợp hồ sơ trình Sở Tài chính thẩm tra quyết toán vốn đầu tư dự án hoàn thành\n\n**Thời hạn tối đa nộp hồ sơ thẩm tra:**\n- ≤ 09 tháng (dự án nhóm A)\n- ≤ 06 tháng (dự án nhóm B)\n- ≤ 04 tháng (dự án nhóm C)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tổng hợp, rà soát toàn bộ chi phí dự án (A-B, GPMB, chi phí khác).', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Phối hợp bàn giao hồ sơ công trình cho thanh tra/kiểm toán (nếu có).', assignee_role: 'Phòng ĐHDA' },
                        { id: crypto.randomUUID(), name: 'Lập Tờ trình đề nghị phê duyệt quyết toán (BM.04-QT.KHTC.04).', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Lập Báo cáo quyết toán vốn đầu tư theo Mẫu 01-08/QTDA (TT 96/2021/TT-BTC).', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Trình Giám đốc Ban QLDA phê duyệt báo cáo quyết toán.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Nộp hồ sơ quyết toán lên Sở Tài chính để thẩm tra.', assignee_role: 'Phòng KH-TC / ĐHDA / PTDV' },
                    ]
                }
            },
            {
                name: 'B9. Trình phê duyệt quyết toán vốn đầu tư dự án hoàn thành',
                type: 'input',
                role: 'Phòng KH-TC / Sở Tài chính',
                sla: '90d',
                metadata: {
                    phase: 'consolidation',
                    guidelines: `**Phòng KH-TC phối hợp Sở Tài chính** giải quyết các vướng mắc và hoàn thiện hồ sơ:\n\n**Giải trình và thống nhất:**\n- Phòng KH-TC; Phòng ĐHDA; Phòng PTDV phối hợp với Sở Tài chính giải trình các vấn đề còn vướng mắc (nếu có) về hồ sơ quyết toán\n- Sở Tài chính và Ban QLDA ký **Biên bản thống nhất số liệu quyết toán vốn dự án hoàn thành**\n\n**Trình UBND tỉnh:**\n- Sở Tài chính lập Báo cáo thẩm tra và trình UBND tỉnh phê duyệt quyết toán vốn đầu tư dự án hoàn thành\n\n**Thời hạn tối đa hoàn thành thẩm tra:**\n- ≤ 08 tháng (dự án nhóm A)\n- ≤ 04 tháng (dự án nhóm B)\n- ≤ 03 tháng (dự án nhóm C)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Giải trình các vướng mắc với Sở Tài chính (nếu có).', assignee_role: 'Phòng KH-TC / ĐHDA / PTDV' },
                        { id: crypto.randomUUID(), name: 'Ký Biên bản thống nhất số liệu quyết toán vốn dự án hoàn thành với Sở Tài chính.', assignee_role: 'Giám đốc Ban QLDA' },
                        { id: crypto.randomUUID(), name: 'Sở Tài chính lập Báo cáo thẩm tra quyết toán.', assignee_role: 'Sở Tài chính' },
                        { id: crypto.randomUUID(), name: 'Sở Tài chính trình UBND tỉnh phê duyệt quyết toán.', assignee_role: 'Sở Tài chính' },
                    ]
                }
            },
            {
                name: 'B10. Phê duyệt quyết toán vốn đầu tư dự án hoàn thành',
                type: 'approval',
                role: 'UBND tỉnh',
                sla: '20d',
                metadata: {
                    phase: 'approval',
                    guidelines: `**UBND tỉnh** xem xét hồ sơ và ban hành Quyết định phê duyệt quyết toán vốn đầu tư dự án hoàn thành (Mẫu số 11/QTDA - TT 96/2021/TT-BTC).\n\n**Thời hạn phê duyệt:**\n- ≤ 01 tháng (dự án nhóm A)\n- ≤ 20 ngày (dự án nhóm B)\n- ≤ 15 ngày (dự án nhóm C)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'UBND tỉnh xem xét hồ sơ thẩm tra quyết toán.', assignee_role: 'UBND tỉnh' },
                        { id: crypto.randomUUID(), name: 'UBND tỉnh ký Quyết định phê duyệt quyết toán vốn đầu tư dự án hoàn thành (Mẫu 11/QTDA).', assignee_role: 'UBND tỉnh' },
                    ]
                }
            },
            {
                name: 'B11. Lưu kho hồ sơ và xử lý công nợ sau quyết toán',
                type: 'end',
                role: 'Phòng KH-TC',
                sla: '30d',
                metadata: {
                    phase: 'completion',
                    guidelines: `Sau khi có **Quyết định phê duyệt quyết toán dự án hoàn thành**, Phòng KH-TC thực hiện:\n\n**Lưu trữ hồ sơ:**\n1. Hồ sơ quyết toán A-B cùng các pháp lý kèm theo\n2. Tờ trình thẩm tra phê duyệt quyết toán\n3. Báo cáo quyết toán dự án hoàn thành theo mẫu\n4. Biên bản thống nhất số liệu thẩm tra quyết toán\n5. Báo cáo kết quả thẩm tra quyết toán\n6. Quyết định phê duyệt quyết toán dự án hoàn thành\n\n**Xử lý công nợ:**\n- Xử lý công nợ sau quyết toán với các nhà thầu\n- Hoàn trả bảo lãnh thực hiện hợp đồng (nếu hết thời hạn bảo hành)\n- Chuyển hồ sơ xuống đơn vị lưu trữ của cơ quan theo quy định hiện hành\n\n**Thời hạn:** ≤ 01 tháng`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lưu trữ toàn bộ hồ sơ quyết toán (6 loại hồ sơ theo quy định) tại bộ phận Văn thư.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Xử lý công nợ còn tồn đọng với nhà thầu sau quyết toán.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Hoàn trả bảo lãnh thực hiện hợp đồng khi đủ điều kiện.', assignee_role: 'Phòng KH-TC' },
                        { id: crypto.randomUUID(), name: 'Chuyển hồ sơ vào kho lưu trữ cơ quan theo quy định.', assignee_role: 'Phòng HC-TH / Văn thư' },
                    ]
                }
            },
        ]
    };

    return [QT_TDTK, QT_KHLCNT, QT_THANHTOAN, QT_VANBAN, QT_QUYETTOAN];
}

