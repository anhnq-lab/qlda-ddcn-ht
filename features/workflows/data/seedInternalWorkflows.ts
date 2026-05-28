import type { WorkflowTemplate } from './seedWorkflows';

// sla '' = thời hạn theo hợp đồng tư vấn hoặc không cố định

export function getInternalWorkflowTemplates(): WorkflowTemplate[] {
    // =========================================================================
    // QT-TK1B — Lập, thẩm định, phê duyệt Báo cáo kinh tế - kỹ thuật (Thiết kế 1 bước)
    // Căn cứ: QT-DAXD-TK-QLDA2-2026; Luật Xây dựng 135/2025/QH15
    // Áp dụng từ: 01/7/2026
    // =========================================================================
    const QT_TK1B: WorkflowTemplate = {
        name: 'BCKTKT — Thiết kế 1 bước',
        code: 'QT-TK1B',
        category: 'other',
        description: 'Quy trình nội bộ QLDA2 — áp dụng cho dự án chỉ lập BCKTKT (thiết kế 1 bước). BCKTKT đã bao gồm TKBVTC và dự toán. Áp dụng từ 01/7/2026 theo Luật Xây dựng số 135/2025/QH15.',
        steps: [
            {
                name: '1. Kích hoạt quy trình TK1B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên Phòng QLDA phụ trách dự án\n- Liên kết vào hồ sơ dự án đã có trên phần mềm (KHÔNG tạo hồ sơ mới). Thông tin dự án điền sẵn từ QĐ chủ trương\n- Gán chuyên viên phụ trách, thiết lập mốc thời hạn theo kế hoạch\n- **Điểm kiểm soát**: chọn đúng mã QT-TK1B; không khởi tạo QT-TK2B/3B cho dự án BCKTKT\n- **Đầu ra**: Hồ sơ điện tử QT-TK1B liên kết dự án\n- **Căn cứ**: QĐ chủ trương đầu tư hoặc văn bản giao nhiệm vụ chuẩn bị dự án`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Liên kết hồ sơ dự án đã có, chọn mã QT-TK1B; xác nhận thông tin điền sẵn từ QĐ chủ trương.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Gán chuyên viên phụ trách, thiết lập mốc thời hạn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Thông báo HCTH/PM để theo dõi trên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện đầu vào tổng thể',
                type: 'input',
                role: 'QLDA',
                sla: '4d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK1B-01',
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA | **Phối hợp**: KTTĐ, KHĐT, địa phương, Sở ngành\n- Lập BM-TK1B-01 bổ sung Phụ lục A: gộp rà soát điều kiện pháp lý (15 mục) + quy hoạch/GPMB/tài sản công vào 1 phiếu\n- Xác định yêu cầu MT/PCCC/chuyên ngành. Kiểm tra phạm vi đất, hiện trạng tài sản công, kết cấu hạ tầng\n- Kết luận: Đủ điều kiện / Chưa đủ điều kiện (lập danh mục bổ sung)\n- **Điểm kiểm soát**: chưa đủ điều kiện → KHÔNG tiến hành giao tư vấn; nếu có tài sản công phải xử lý → mở nhánh xử lý tài sản\n- **Đầu ra**: BM-TK1B-01 + Phụ lục A đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-01 + Phụ lục A — kiểm tra 15 điều kiện pháp lý, quy hoạch, GPMB, tài sản công, MT, PCCC.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng QLDA ký xác nhận kết quả rà soát Đủ/Chưa đủ.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập danh mục bổ sung nếu chưa đủ; khởi động nhánh xử lý tài sản công nếu có.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '3. Giao nhiệm vụ tư vấn',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: 'BM-TK1B-02',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KHĐT\n- Lựa chọn tư vấn theo KHLCNT (đấu thầu cạnh tranh, chỉ định thầu hoặc hợp đồng khung)\n- Phát hành BM-TK1B-02 — Phiếu giao nhiệm vụ tư vấn; nêu rõ nhiệm vụ khảo sát, thiết kế, dự toán\n- **Điểm kiểm soát**: tư vấn phải đủ năng lực theo loại, cấp công trình (chứng chỉ năng lực, hành nghề, bảo hiểm)\n- **Đầu ra**: BM-TK1B-02 đã ký; hợp đồng/nhiệm vụ tư vấn\n- **Thời hạn**: theo KHLCNT`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra năng lực tư vấn: chứng chỉ hành nghề, năng lực hoạt động, bảo hiểm.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập và ký BM-TK1B-02 — Phiếu giao nhiệm vụ tư vấn lập BCKTKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Cập nhật hợp đồng/nhiệm vụ tư vấn lên phần mềm; đặt mốc hạn nộp hồ sơ.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. Tư vấn: Khảo sát + Lập BCKTKT',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn | **Phối hợp**: QLDA giám sát tiến độ\n- Gộp: khảo sát hiện trường (địa hình, địa chất, hạ tầng) + lập BCKTKT (thuyết minh, TKBVTC, dự toán)\n- Tư vấn lập phương án kỹ thuật khảo sát → QLDA nghiệm thu kết quả khảo sát → lập BCKTKT\n- **Điểm kiểm soát**: kết quả khảo sát phải được QLDA chấp thuận trước khi lập BCKTKT; dự toán không vượt vốn chủ trương\n- **Đầu ra**: Bộ hồ sơ BCKTKT lần 1 (thuyết minh + TKBVTC + DT + hồ sơ MT/PCCC)\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập phương án khảo sát, triển khai khảo sát hiện trường; QLDA nghiệm thu kết quả.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BCKTKT: thuyết minh, bản vẽ TKBVTC, dự toán, hồ sơ MT/PCCC.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA theo dõi tiến độ, xử lý vướng mắc kỹ thuật/pháp lý phát sinh.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '5. Tiếp nhận & Kiểm tra toàn diện hồ sơ',
                type: 'input',
                role: 'QLDA',
                sla: '12d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-03',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, KHĐT\n- Gộp: tiếp nhận danh mục + kiểm tra thuyết minh (BM-TK1B-03, 16 mục) + TKBVTC (BM-TK1B-04, 17 mục) + dự toán (BM-TK1B-05, 14 mục) SONG SONG\n- Không tiếp nhận hồ sơ thiếu chữ ký, dấu, file mềm (CAD/Excel/PDF) hoặc thiếu thành phần chính\n- **Điểm kiểm soát**: KHÔNG chuyển bước nếu thiếu hồ sơ MT/PCCC bắt buộc; dự toán không vượt vốn chủ trương\n- **Đầu ra**: BM-TK1B-03 + BM-TK1B-04 + BM-TK1B-05 đã ký; kết luận đạt/chưa đạt`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tiếp nhận hồ sơ, lập phiếu tiếp nhận; kiểm tra danh mục và chữ ký/dấu.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra song song: BM-TK1B-03 (thuyết minh), BM-TK1B-04 (TKBVTC), BM-TK1B-05 (dự toán).', assignee_role: 'Chuyên viên QLDA / KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Tổng hợp kết quả đạt/chưa đạt; chuyển bước 6 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Yêu cầu chỉnh sửa & Tiếp thu giải trình',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-06',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: Tư vấn, KTTĐ\n- Chu trình: phát hành BM-TK1B-06 (yêu cầu chỉnh sửa) → tư vấn tiếp thu → lập BM-TK1B-07 (bảng tiếp thu giải trình) → QLDA xác nhận\n- Nêu rõ: danh mục lỗi/thiếu sót, yêu cầu cụ thể, đầu mối xử lý và hạn hoàn thành\n- **Điểm kiểm soát**: chỉ chuyển bước thẩm tra/thẩm định khi đã tiếp thu đầy đủ hoặc giải trình được QLDA chấp thuận\n- **Đầu ra**: BM-TK1B-06 + BM-TK1B-07 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tổng hợp lỗi từ BM-03/04/05; lập và phát hành BM-TK1B-06 — yêu cầu chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK1B-07 — bảng tiếp thu giải trình; QLDA xem xét, ký xác nhận.', assignee_role: 'Tư vấn / Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra lại hồ sơ sau chỉnh sửa; xác nhận đóng hết ý kiến bắt buộc.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '7. Thẩm tra thiết kế/dự toán',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Conditional**: phần lớn TK1B không bắt buộc thẩm tra; chỉ thực hiện khi công trình thuộc đối tượng bắt buộc hoặc Ban yêu cầu\n- **Chủ trì**: QLDA; tư vấn thẩm tra độc lập thực hiện\n- Tư vấn thẩm tra kiểm tra: an toàn chịu lực, quy chuẩn, khối lượng, chi phí\n- **Điểm kiểm soát**: báo cáo thẩm tra là cơ sở phục vụ thẩm định; không bỏ qua nếu thuộc đối tượng bắt buộc\n- **Đầu ra**: Báo cáo thẩm tra thiết kế/dự toán\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Xác định đối tượng thẩm tra; lựa chọn tư vấn thẩm tra theo KHLCNT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn thẩm tra kiểm tra an toàn, quy chuẩn, khối lượng, chi phí.', assignee_role: 'Tư vấn thẩm tra' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; chuyển tư vấn tiếp thu ý kiến thẩm tra nếu có.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '8. Lập tờ trình thẩm định BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'consolidation',
                    form_code: 'BM-TK1B-08',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ\n- Lập tờ trình thẩm định theo BM-TK1B-08; đính kèm hồ sơ hoàn thiện và báo cáo thẩm tra (nếu có)\n- Trình cơ quan chuyên môn trực thuộc NQĐ, KHÔNG qua Sở XD (Điều 26 K.3 + Điều 27 K.2 Luật 135/2025)\n- **Điểm kiểm soát**: trình đúng thẩm quyền; hồ sơ đầy đủ thành phần trước khi gửi thẩm định\n- **Đầu ra**: BM-TK1B-08 đã ký; hồ sơ gửi thẩm định\n- **Căn cứ**: Điều 26 K.3, Điều 27 K.2 Luật Xây dựng 135/2025/QH15`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Hoàn thiện hồ sơ BCKTKT lần cuối trước khi trình thẩm định.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập tờ trình BM-TK1B-08; trình lãnh đạo ký; gửi cơ quan CM trực thuộc NQĐ.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '9. Tiếp thu kết quả thẩm định & Hoàn thiện',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: Tư vấn\n- Nhận văn bản thẩm định; phân loại ý kiến bắt buộc/khuyến nghị/ghi nhận\n- Tổ chức tư vấn chỉnh sửa hồ sơ theo ý kiến thẩm định bắt buộc; lập bảng tiếp thu\n- **Điểm kiểm soát**: KHÔNG trình phê duyệt khi chưa đóng các ý kiến bắt buộc của cơ quan thẩm định\n- **Đầu ra**: Bảng tiếp thu ý kiến thẩm định; hồ sơ hoàn thiện sau thẩm định`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Nhận văn bản thẩm định; phân loại ý kiến bắt buộc/khuyến nghị/ghi nhận.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tổ chức tư vấn tiếp thu, chỉnh sửa; lập bảng tiếp thu ý kiến thẩm định.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Xác nhận đã đóng hết ý kiến bắt buộc; hoàn thiện hồ sơ lần cuối.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '10. Lập tờ trình + Dự thảo QĐ phê duyệt',
                type: 'approval',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK1B-09',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ\n- Lập BM-TK1B-09 (tờ trình phê duyệt) + BM-TK1B-10 (dự thảo QĐ phê duyệt BCKTKT/quyết định đầu tư). Chuẩn bị song song với Bước 9\n- Phụ lục kèm theo: tổng mức đầu tư, cơ cấu chi phí, danh mục bản vẽ\n- **Điểm kiểm soát**: thẩm quyền phê duyệt theo Luật Đầu tư công và QĐ phân cấp/ủy quyền; không phê duyệt khi chưa đóng ý kiến thẩm định\n- **Đầu ra**: BM-TK1B-09 + BM-TK1B-10 đã trình ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-09 — tờ trình phê duyệt BCKTKT kèm phụ lục TMĐT, cơ cấu chi phí.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Soạn dự thảo BM-TK1B-10 — QĐ phê duyệt BCKTKT; kiểm tra thẩm quyền ký.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình Giám đốc Ban/cấp được ủy quyền ký QĐ phê duyệt BCKTKT.', assignee_role: 'Lãnh đạo Ban QLDA' },
                    ]
                }
            },
            {
                name: '11. Ban hành QĐ phê duyệt & Bàn giao hồ sơ',
                type: 'approval',
                role: 'Ban QLDA',
                sla: '',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK1B-11',
                    guidelines: `- **Chủ trì**: Ban QLDA (QLDA + HCTH thực hiện)\n- Ban hành QĐ phê duyệt BCKTKT; đóng số, đóng dấu, ký số bản điện tử\n- Lập BM-TK1B-11 — Phiếu bàn giao hồ sơ phê duyệt cho Tổ chuyên gia/KHĐT để lập KHLCNT\n- **Điểm kiểm soát**: bàn giao đầy đủ: bản vẽ đóng dấu, dự toán phê duyệt, QĐ phê duyệt\n- **Đầu ra**: QĐ phê duyệt đã ban hành + BM-TK1B-11 bàn giao hồ sơ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'HCTH đóng số, đóng dấu và ban hành QĐ phê duyệt BCKTKT.', assignee_role: 'HCTH' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-11 — bàn giao hồ sơ phê duyệt cho KHĐT/Tổ chuyên gia.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '12. Cập nhật phần mềm & Lưu trữ (Hoàn tất)',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK1B-12',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: HCTH/PM\n- Lập BM-TK1B-12 — checklist cập nhật phần mềm: QĐ phê duyệt (PDF ký số), file gốc CAD/Excel/Word, danh mục bản vẽ\n- Khóa phiên bản phê duyệt; trạng thái quy trình = Hoàn tất\n- Lưu trữ bản giấy tại Văn thư; chuyển sang QT-02/KHLCNT\n- **Điểm kiểm soát**: khóa phiên bản phê duyệt; không cho phép chỉnh sửa sau khi hoàn tất\n- **Đầu ra**: BM-TK1B-12 đã ký; hồ sơ lưu trữ đầy đủ; trạng thái = Hoàn tất`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Cập nhật QĐ phê duyệt lên phần mềm (PDF ký số, file gốc); khóa phiên bản.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-12 — xác nhận cập nhật phần mềm; đặt trạng thái = Hoàn tất.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Chuyển hồ sơ gốc về Văn thư lưu trữ theo quy định.', assignee_role: 'HCTH / Văn thư' },
                    ]
                }
            },
        ]
    };

    // =========================================================================
    // QT-TK2B — Lập, thẩm định, phê duyệt TKBVTC&DT sau khi dự án được phê duyệt (Thiết kế 2 bước)
    // Căn cứ: QT-DAXD-TK-QLDA2-2026; Điều 29 Luật Xây dựng 135/2025/QH15
    // Áp dụng từ: 01/7/2026
    // =========================================================================
    const QT_TK2B: WorkflowTemplate = {
        name: 'TKBVTC & Dự toán — Thiết kế 2 bước',
        code: 'QT-TK2B',
        category: 'other',
        description: 'Quy trình nội bộ QLDA2 — áp dụng cho dự án đã phê duyệt BCNCKT có TKCS; tổ chức lập TKBVTC&DT theo Điều 29 Luật Xây dựng 2025. Áp dụng từ 01/7/2026.',
        steps: [
            {
                name: '1. Kích hoạt QT-TK2B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA\n- Kích hoạt SAU KHI có QĐ phê duyệt BCNCKT (có TKCS). Liên kết hồ sơ dự án đã có trên phần mềm\n- Nhập: tên dự án, gói thầu, QĐ phê duyệt dự án, cấp công trình, TMĐT, nguồn vốn\n- **Điểm kiểm soát**: KHÔNG khởi tạo QT-TK2B nếu chưa có dự án/BCNCKT được phê duyệt\n- **Đầu ra**: Hồ sơ điện tử QT-TK2B liên kết dự án`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Liên kết hồ sơ dự án đã có; nhập thông tin gói thầu và QĐ phê duyệt BCNCKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Gán chuyên viên phụ trách; thiết lập mốc thời hạn theo kế hoạch.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện đầu vào',
                type: 'input',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK2B-01',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, KHĐT\n- Lập BM-TK2B-01 (17 mục): đối chiếu mục tiêu, quy mô, cấp công trình, TKCS, GPMB, quy hoạch, nguồn vốn\n- TKBVTC phải cụ thể hóa TKCS, KHÔNG thay đổi mục tiêu/quy mô/TMĐT nếu chưa điều chỉnh dự án\n- **Điểm kiểm soát**: xác định phạm vi TKBVTC theo từng hạng mục/gói thầu; đối chiếu với TKCS\n- **Đầu ra**: BM-TK2B-01 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-01 — kiểm tra 17 điều kiện; đối chiếu với QĐ phê duyệt dự án và TKCS.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng ký xác nhận đủ/chưa đủ điều kiện.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                    ]
                }
            },
            {
                name: '3. Giao nhiệm vụ tư vấn',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK2B-02',
                    guidelines: `- **Chủ trì**: QLDA\n- Phát hành BM-TK2B-02 — phiếu giao nhiệm vụ tư vấn thiết kế TKBVTC\n- Nêu rõ: mốc nộp bản vẽ, dự toán, định dạng file (CAD/Excel/PDF), yêu cầu kỹ thuật cụ thể\n- **Điểm kiểm soát**: nhiệm vụ thiết kế phải bám sát TKCS và QĐ phê duyệt dự án\n- **Đầu ra**: BM-TK2B-02 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-02 — giao nhiệm vụ TKBVTC; nêu rõ mốc hạn và yêu cầu file.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; cập nhật lên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. Tư vấn lập TKBVTC & Dự toán',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn | **Phối hợp**: QLDA theo dõi tiến độ\n- Tư vấn cụ thể hóa TKCS thành TKBVTC đủ chi tiết để thi công; lập dự toán theo khối lượng thiết kế\n- **Điểm kiểm soát**: KHÔNG để TKBVTC thay đổi mục tiêu/quy mô/TMĐT của dự án đã phê duyệt\n- **Đầu ra**: Hồ sơ TKBVTC&DT lần 1\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKBVTC đủ chi tiết để thi công, nghiệm thu, thanh toán.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập dự toán theo khối lượng TKBVTC, đơn giá hiện hành.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA theo dõi tiến độ; xử lý vướng mắc kỹ thuật/pháp lý phát sinh.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '5. Tiếp nhận & Kiểm tra toàn diện',
                type: 'input',
                role: 'QLDA',
                sla: '10d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK2B-03',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, KHĐT\n- Gộp: tiếp nhận danh mục + kiểm tra TKBVTC (BM-TK2B-03) + kiểm tra dự toán (BM-TK2B-04). 1 chuyên viên TUẦN TỰ (không song song như TK1B)\n- Kiểm tra: phù hợp TKCS, nhiệm vụ thiết kế, khảo sát, quy chuẩn, đơn giá, định mức, không vượt TMĐT\n- **Điểm kiểm soát**: TKBVTC phải cụ thể hóa TKCS; khối lượng dự toán phù hợp bản vẽ; giá tại thời điểm lập\n- **Đầu ra**: BM-TK2B-03 + BM-TK2B-04 đã ký; kết luận đạt/chưa đạt`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tiếp nhận hồ sơ; kiểm tra danh mục, thành phần, chữ ký/dấu, file mềm.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra tuần tự: BM-TK2B-03 (TKBVTC) → BM-TK2B-04 (dự toán); phối hợp KTTĐ.', assignee_role: 'Chuyên viên QLDA / KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Kết luận đạt/chưa đạt; chuyển bước 6 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Yêu cầu chỉnh sửa & Tiếp thu',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK2B-05',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: Tư vấn\n- Phát hành BM-TK2B-05 — yêu cầu chỉnh sửa; tư vấn tiếp thu → lập BM-TK2B-06 bảng tiếp thu giải trình\n- Nêu rõ nội dung cần sửa, hạn hoàn thành, đầu mối xử lý\n- **Điểm kiểm soát**: bảng tiếp thu là hồ sơ bắt buộc trước khi trình thẩm định/phê duyệt\n- **Đầu ra**: BM-TK2B-05 + BM-TK2B-06 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tổng hợp ý kiến từ BM-TK2B-03/04; lập BM-TK2B-05 gửi tư vấn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK2B-06 — tiếp thu giải trình; QLDA đánh giá, ký xác nhận.', assignee_role: 'Tư vấn / Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra lại hồ sơ sau chỉnh sửa; xác nhận đóng hết ý kiến bắt buộc.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '7. Thẩm tra TK/DT',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Conditional**: thực hiện khi thuộc đối tượng thẩm tra bắt buộc hoặc Ban yêu cầu\n- **Chủ trì**: QLDA; tư vấn thẩm tra độc lập\n- Tư vấn thẩm tra kiểm tra: an toàn, quy chuẩn, khối lượng, chi phí\n- **Đầu ra**: Báo cáo thẩm tra thiết kế/dự toán\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lựa chọn tư vấn thẩm tra; giao hồ sơ để thẩm tra.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; tư vấn tiếp thu ý kiến thẩm tra.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '8. Thẩm định/Kiểm soát nội bộ CĐT',
                type: 'input',
                role: 'KTTĐ',
                sla: '7d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Phòng KTTĐ | **Phối hợp**: QLDA, Tư vấn\n- Thực hiện theo Điều 30 Luật Xây dựng 135/2025 — chủ đầu tư thẩm định, kiểm soát thiết kế. KHÔNG qua Sở XD\n- Lập báo cáo/phiếu thẩm định nội bộ\n- **Điểm kiểm soát**: KHÔNG phê duyệt TKBVTC&DT khi chưa có kết quả thẩm định nội bộ\n- **Đầu ra**: Báo cáo/phiếu thẩm định nội bộ\n- **Căn cứ**: Điều 30 Luật Xây dựng 135/2025/QH15`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'KTTĐ thẩm định nội dung kỹ thuật, an toàn, quy chuẩn theo Điều 30 Luật XD 2025.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Lập báo cáo/phiếu thẩm định nội bộ; gửi kết quả về QLDA.', assignee_role: 'KTTĐ' },
                    ]
                }
            },
            {
                name: '9. Trình & Ban hành QĐ phê duyệt',
                type: 'approval',
                role: 'QLDA',
                sla: '3d',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK2B-07',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, HCTH\n- Gộp: lập tờ trình BM-TK2B-07 + dự thảo QĐ BM-TK2B-08 + ký ban hành BM-TK2B-09 = 1 đợt trình ký\n- Phụ lục kèm theo: dự toán phê duyệt, danh mục bản vẽ\n- **Điểm kiểm soát**: trình đúng thẩm quyền theo quy chế Ban; kèm phụ lục dự toán và danh mục bản vẽ\n- **Đầu ra**: QĐ phê duyệt TKBVTC&DT đã ban hành (BM-TK2B-07/08/09)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-07 tờ trình + BM-TK2B-08 dự thảo QĐ phê duyệt kèm phụ lục.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình Giám đốc Ban ký QĐ phê duyệt TKBVTC&DT.', assignee_role: 'Lãnh đạo Ban QLDA' },
                        { id: crypto.randomUUID(), name: 'HCTH đóng số, đóng dấu và ban hành BM-TK2B-09; đóng dấu hồ sơ thiết kế.', assignee_role: 'HCTH' },
                    ]
                }
            },
            {
                name: '10. Bàn giao hồ sơ & Lưu trữ (Hoàn tất)',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK2B-10',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KHĐT, KTTĐ, HCTH/PM\n- Gộp: bàn giao hồ sơ (BM-TK2B-10) + cập nhật phần mềm + lưu trữ = 1 bước hoàn tất\n- Bàn giao: bản vẽ đóng dấu, dự toán phê duyệt, QĐ phê duyệt cho KHĐT/Tổ chuyên gia\n- Cập nhật phần mềm: PDF ký số, file gốc CAD/Excel/Word; khóa phiên bản; trạng thái = Hoàn tất\n- **Điểm kiểm soát**: hồ sơ bàn giao là căn cứ lập giá gói thầu, KHLCNT, HSMT/HSYC\n- **Đầu ra**: BM-TK2B-10 đã ký; hồ sơ lưu trữ đầy đủ; trạng thái = Hoàn tất`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-10 — bàn giao hồ sơ phê duyệt cho KHĐT; ký xác nhận giao/nhận.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Cập nhật QĐ phê duyệt, hồ sơ đóng dấu lên phần mềm; khóa phiên bản; đặt trạng thái Hoàn tất.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Chuyển hồ sơ gốc về Văn thư lưu trữ theo quy định.', assignee_role: 'HCTH / Văn thư' },
                    ]
                }
            },
        ]
    };

    // =========================================================================
    // QT-TK3B — Lập, thẩm định, phê duyệt TKKT&DT và TKBVTC (Thiết kế 3 bước)
    // Căn cứ: QT-DAXD-TK-QLDA2-2026; Điều 30 Luật Xây dựng 135/2025/QH15
    // Áp dụng từ: 01/7/2026
    // =========================================================================
    const QT_TK3B: WorkflowTemplate = {
        name: 'TKKT & TKBVTC — Thiết kế 3 bước',
        code: 'QT-TK3B',
        category: 'other',
        description: 'Quy trình nội bộ QLDA2 — áp dụng cho dự án quy mô lớn/phức tạp; lập TKKT&DT rồi TKBVTC theo TKKT được duyệt. Áp dụng từ 01/7/2026 theo Luật Xây dựng 135/2025/QH15.',
        steps: [
            // ===== GĐ1: Thiết kế kỹ thuật & Dự toán =====
            {
                name: '1. Kích hoạt QT-TK3B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA\n- Kích hoạt sau khi có QĐ phê duyệt BCNCKT có TKCS. Liên kết hồ sơ dự án đã có trên phần mềm\n- **Điểm kiểm soát**: chỉ áp dụng khi dự án được xác định thiết kế 3 bước (quy mô lớn, kỹ thuật phức tạp)\n- Thiết lập mốc TKKT (GĐ1) và TKBVTC (GĐ2) riêng biệt\n- **Đầu ra**: Hồ sơ điện tử QT-TK3B liên kết dự án`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Liên kết hồ sơ dự án; xác nhận dự án đúng thiết kế 3 bước.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Nhập thông tin dự án, gán phụ trách; thiết lập mốc GĐ1 (TKKT) và GĐ2 (TKBVTC) riêng biệt.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện lập TKKT',
                type: 'input',
                role: 'QLDA',
                sla: '3d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK3B-01',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ\n- Lập BM-TK3B-01 (18 mục): xác định phạm vi TKKT, hạng mục, mốc tiến độ; đối chiếu TKCS, khảo sát, tiêu chuẩn\n- **Điểm kiểm soát**: TKKT phải cụ thể hóa TKCS, KHÔNG mở rộng phạm vi nếu chưa điều chỉnh dự án\n- **Đầu ra**: BM-TK3B-01 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-01 — kiểm tra 18 điều kiện lập TKKT; đối chiếu TKCS và QĐ dự án.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng ký xác nhận đủ điều kiện.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                    ]
                }
            },
            {
                name: '3. Giao nhiệm vụ TV lập TKKT',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK3B-02',
                    guidelines: `- **Chủ trì**: QLDA\n- Lập BM-TK3B-02 — giao nhiệm vụ tư vấn TKKT; yêu cầu rõ nội dung tính toán, bản vẽ, thuyết minh, dự toán\n- **Điểm kiểm soát**: nhiệm vụ phải bám sát TKCS; xác định rõ đối tượng thẩm tra bắt buộc\n- **Đầu ra**: BM-TK3B-02 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-02 — giao nhiệm vụ tư vấn TKKT; nêu yêu cầu tính toán, bản vẽ, mốc hạn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; cập nhật lên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. TV lập TKKT & DT theo TKKT',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn | **Phối hợp**: QLDA theo dõi\n- Cụ thể hóa TKCS: tính toán kết cấu, giải pháp kỹ thuật, cấu tạo chính; lập dự toán theo TKKT\n- **Điểm kiểm soát**: kiểm soát an toàn chịu lực, giải pháp kỹ thuật; KHÔNG làm thay đổi mục tiêu/quy mô\n- **Đầu ra**: Hồ sơ TKKT&DT lần 1\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập thuyết minh TKKT, tính toán kết cấu, hệ thống kỹ thuật.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKKT và dự toán theo thiết kế kỹ thuật.', assignee_role: 'Tư vấn' },
                    ]
                }
            },
            {
                name: '5. Tiếp nhận & Kiểm tra toàn diện TKKT&DT',
                type: 'input',
                role: 'QLDA',
                sla: '12d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-03',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, KHĐT\n- Kiểm tra kỹ thuật TRƯỚC (BM-TK3B-03: thuyết minh, tính toán, bản vẽ TKKT), dự toán SAU (BM-TK3B-04). TUẦN TỰ, không đảo\n- TKKT phải đủ cơ sở kỹ thuật để lập TKBVTC; an toàn chịu lực đảm bảo\n- **Điểm kiểm soát**: cơ cấu chi phí TKKT trong TMĐT đã duyệt; không chuyển bước nếu TKKT chưa đủ cơ sở lập TKBVTC\n- **Đầu ra**: BM-TK3B-03 + BM-TK3B-04 đã ký; kết luận đạt/chưa đạt`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tiếp nhận hồ sơ; kiểm tra danh mục, chữ ký/dấu, file mềm.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Kiểm tra tuần tự: BM-TK3B-03 (TKKT) TRƯỚC → BM-TK3B-04 (dự toán) SAU; phối hợp KTTĐ.', assignee_role: 'Chuyên viên QLDA / KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Kết luận đạt/chưa đạt; chuyển bước 6 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Yêu cầu chỉnh sửa & Tiếp thu giải trình',
                type: 'input',
                role: 'QLDA',
                sla: '7d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-05',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: Tư vấn\n- Phát hành BM-TK3B-05 — yêu cầu chỉnh sửa TKKT; tư vấn chỉnh sửa → lập BM-TK3B-06 bảng tiếp thu giải trình\n- **Điểm kiểm soát**: mọi ý kiến phải được đóng bằng tiếp thu hoặc giải trình được chấp thuận trước khi chuyển thẩm tra\n- **Đầu ra**: BM-TK3B-05 + BM-TK3B-06 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-05 — tổng hợp ý kiến yêu cầu chỉnh sửa TKKT từ BM-03/04.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK3B-06 — tiếp thu giải trình từng ý kiến; QLDA xác nhận.', assignee_role: 'Tư vấn / Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '7. Thẩm tra TKKT&DT',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Thường BẮT BUỘC** với TK3B (công trình lớn/phức tạp). An toàn chịu lực là trọng tâm\n- **Chủ trì**: QLDA; tư vấn thẩm tra độc lập\n- Tập trung: an toàn chịu lực, quy chuẩn, khối lượng, giá trị\n- **Điểm kiểm soát**: báo cáo thẩm tra là hồ sơ bắt buộc phục vụ thẩm định nội bộ\n- **Đầu ra**: Báo cáo thẩm tra TKKT&DT\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Giao hồ sơ TKKT&DT hoàn thiện cho tư vấn thẩm tra; trọng tâm an toàn chịu lực.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; tổ chức tư vấn tiếp thu ý kiến.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '8. Thẩm định/Kiểm soát nội bộ CĐT',
                type: 'input',
                role: 'KTTĐ',
                sla: '7d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Phòng KTTĐ | **Phối hợp**: QLDA\n- Thẩm định nội dung theo Điều 30 Luật Xây dựng 135/2025\n- Lập báo cáo/phiếu thẩm định nội bộ TKKT\n- **Điểm kiểm soát**: KHÔNG phê duyệt TKKT khi chưa có kết quả thẩm định nội bộ\n- **Đầu ra**: Báo cáo/phiếu thẩm định nội bộ TKKT\n- **Căn cứ**: Điều 30 Luật Xây dựng 135/2025/QH15`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'KTTĐ thẩm định TKKT: an toàn, quy chuẩn, kỹ thuật, MT, PCCC theo Điều 30.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Lập báo cáo thẩm định nội bộ TKKT; chuyển kết quả về QLDA.', assignee_role: 'KTTĐ' },
                    ]
                }
            },
            {
                name: '9. Phê duyệt TKKT&DT',
                type: 'approval',
                role: 'Ban QLDA',
                sla: '',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK3B-07',
                    guidelines: `- **Chủ trì**: QLDA trình, Ban QLDA phê duyệt\n- Lập BM-TK3B-07 tờ trình + BM-TK3B-08 dự thảo QĐ phê duyệt TKKT&DT + BM-TK3B-09 phụ lục chi phí\n- **Điểm kiểm soát**: BẮT BUỘC phê duyệt TKKT&DT TRƯỚC khi lập TKBVTC (trừ trường hợp được phép song song)\n- **Đầu ra**: QĐ phê duyệt TKKT&DT đã ban hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-07 tờ trình + BM-TK3B-08 dự thảo QĐ + BM-TK3B-09 phụ lục chi phí/bản vẽ.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Giám đốc Ban ký QĐ phê duyệt TKKT&DT; đóng dấu hồ sơ.', assignee_role: 'Lãnh đạo Ban QLDA' },
                        { id: crypto.randomUUID(), name: 'HCTH đóng số, ban hành QĐ; cập nhật lên phần mềm.', assignee_role: 'HCTH' },
                    ]
                }
            },
            // ===== GĐ2: Thiết kế bản vẽ thi công =====
            {
                name: '10. Giao nhiệm vụ lập TKBVTC theo TKKT',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation_gd2',
                    form_code: 'BM-TK3B-10',
                    guidelines: `- **Chủ trì**: QLDA\n- Lập BM-TK3B-10 — giao nhiệm vụ tư vấn lập TKBVTC; dẫn chiếu cụ thể QĐ phê duyệt TKKT&DT\n- Nhiệm vụ phải bám sát TKKT đã phê duyệt; xác định rõ phạm vi TKBVTC\n- **Điểm kiểm soát**: TKBVTC phải chi tiết hóa TKKT; KHÔNG thay đổi giải pháp chính nếu chưa được chấp thuận\n- **Đầu ra**: BM-TK3B-10 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-10 — giao nhiệm vụ TKBVTC; dẫn chiếu QĐ phê duyệt TKKT&DT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; đặt mốc hạn nộp TKBVTC.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '11. TV lập TKBVTC',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant_gd2',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn | **Phối hợp**: QLDA theo dõi\n- Chi tiết hóa TKKT thành bản vẽ thi công đủ để thi công, nghiệm thu, quản lý chất lượng, thanh toán và quyết toán\n- KHÔNG lập dự toán mới — dự toán đã phê duyệt theo TKKT\n- **Điểm kiểm soát**: KHÔNG thay đổi giải pháp chính của TKKT nếu chưa được chấp thuận điều chỉnh\n- **Đầu ra**: Hồ sơ TKBVTC lần 1\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKBVTC chi tiết hóa từ TKKT được duyệt; KHÔNG lập dự toán mới.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA theo dõi, kiểm tra sự phù hợp với TKKT trong quá trình tư vấn lập.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '12. Kiểm tra + Phê duyệt + Bàn giao TKBVTC (Hoàn tất)',
                type: 'end',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK3B-11',
                    guidelines: `- **Chủ trì**: QLDA | **Phối hợp**: KTTĐ, Ban QLDA, HCTH, KHĐT\n- Gộp: kiểm tra TKBVTC (BM-TK3B-11) + phê duyệt/chấp thuận + bàn giao hồ sơ + cập nhật PM = 1 chuỗi liên tục\n- Kiểm tra TKBVTC: đối chiếu TKKT, cấu tạo, biện pháp, chi tiết thi công\n- Phê duyệt: Giám đốc Ban ký phê duyệt/chấp thuận TKBVTC\n- Bàn giao: hồ sơ TKBVTC cho tư vấn giám sát, đơn vị thi công và KHĐT\n- **Điểm kiểm soát**: TKBVTC sai số so với TKKT trong giới hạn; khóa phiên bản; trạng thái = Hoàn tất\n- **Đầu ra**: BM-TK3B-11 + QĐ phê duyệt TKBVTC + phiếu bàn giao; hồ sơ lưu trữ đầy đủ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-11 — kiểm tra TKBVTC theo TKKT; xác nhận đủ chi tiết thi công.', assignee_role: 'Chuyên viên QLDA / KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Giám đốc Ban ký phê duyệt TKBVTC; đóng dấu hồ sơ; ban hành QĐ.', assignee_role: 'Lãnh đạo Ban QLDA' },
                        { id: crypto.randomUUID(), name: 'Bàn giao TKBVTC cho TVGS/đơn vị thi công/KHĐT; cập nhật PM; khóa phiên bản; trạng thái = Hoàn tất.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
        ]
    };

    return [QT_TK1B, QT_TK2B, QT_TK3B];
}