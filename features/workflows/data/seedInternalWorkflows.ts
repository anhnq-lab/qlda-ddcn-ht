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
                name: '1. Khởi tạo quy trình QT-TK1B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên Phòng QLDA phụ trách dự án\n- Khởi tạo hồ sơ điện tử trên phần mềm, chọn đúng mã quy trình QT-TK1B\n- Nhập thông tin dự án: tên dự án, hạng mục, địa điểm, nguồn vốn, thẩm quyền quyết định đầu tư\n- Gán chuyên viên phụ trách, thiết lập các mốc thời hạn\n- **Điểm kiểm soát**: chọn đúng loại quy trình — BCKTKT/thiết kế 1 bước; không khởi tạo QT-TK2B/3B\n- **Căn cứ**: Chủ trương đầu tư hoặc văn bản giao nhiệm vụ chuẩn bị dự án`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tạo hồ sơ điện tử trên phần mềm, chọn mã QT-TK1B.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Nhập thông tin dự án, gán người phụ trách, thiết lập mốc thời hạn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Thông báo cho HCTH/PM để theo dõi trên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện lập BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '3d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK1B-01',
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA phối hợp KTTĐ, KHĐT\n- Lập phiếu rà soát điều kiện đầu vào theo BM-TK1B-01 (15 mục)\n- Kiểm tra: văn bản pháp lý, quy hoạch, đất đai, GPMB, môi trường, PCCC, nguồn vốn, tư vấn\n- Lãnh đạo Phòng QLDA xác nhận đủ/chưa đủ điều kiện\n- **Điểm kiểm soát**: chưa đủ điều kiện phải lập danh mục bổ sung; không tiến hành giao tư vấn khi chưa đủ điều kiện\n- **Đầu ra**: BM-TK1B-01 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-01 — kiểm tra 15 điều kiện pháp lý, quy hoạch, GPMB, môi trường, vốn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng QLDA ký xác nhận kết quả rà soát.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập danh mục việc cần bổ sung nếu chưa đủ điều kiện.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '3. Rà soát quy hoạch, đất đai, GPMB và tài sản công',
                type: 'input',
                role: 'QLDA',
                sla: '3d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Thực hiện song song** với bước 2\n- **Chủ trì**: QLDA phối hợp địa phương, Sở ngành, đơn vị quản lý tài sản\n- Xác định: phạm vi đất, hiện trạng tài sản công/kết cấu hạ tầng, phạm vi thu hồi đất\n- Nếu có tài sản công phải xử lý: mở nhánh xử lý tài sản (điều chuyển/thanh lý/đấu giá)\n- Đảm bảo phương án GPMB và tài sản công được tích hợp vào BCKTKT và dự toán\n- **Đầu ra**: Phụ lục rà soát quy hoạch/GPMB/tài sản`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Rà soát thông tin quy hoạch, phạm vi đất, hiện trạng mặt bằng.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Xác định tài sản công/kết cấu hạ tầng phải di dời, thanh lý, bàn giao.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập phụ lục rà soát GPMB/tài sản; khởi động nhánh xử lý tài sản nếu có.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. Lựa chọn/giao tư vấn khảo sát, lập BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: 'BM-TK1B-02',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KHĐT\n- Lựa chọn tư vấn theo KHLCNT (đấu thầu cạnh tranh, chỉ định thầu hoặc ký hợp đồng khung)\n- Phát hành BM-TK1B-02 — Phiếu giao nhiệm vụ tư vấn; nêu rõ nhiệm vụ khảo sát, thiết kế, dự toán\n- **Điểm kiểm soát**: tư vấn phải đủ năng lực theo loại, cấp công trình (chứng chỉ năng lực, hành nghề, bảo hiểm)\n- **Đầu ra**: BM-TK1B-02 đã ký; hợp đồng/nhiệm vụ tư vấn\n- **Thời hạn**: theo KHLCNT`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra năng lực tư vấn: chứng chỉ hành nghề, năng lực hoạt động, bảo hiểm.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập và ký BM-TK1B-02 — Phiếu giao nhiệm vụ tư vấn lập BCKTKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Cập nhật hợp đồng/nhiệm vụ tư vấn lên phần mềm; đặt mốc hạn nộp hồ sơ.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '5. Tổ chức khảo sát, lập nhiệm vụ khảo sát, nhiệm vụ thiết kế',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn (QLDA giám sát)\n- Tư vấn lập phương án kỹ thuật khảo sát, triển khai khảo sát hiện trường\n- Lập nhiệm vụ khảo sát và nhiệm vụ thiết kế trình QLDA xem xét, phê duyệt\n- **Điểm kiểm soát**: kết quả khảo sát phải được QLDA nghiệm thu/chấp thuận trước khi tư vấn lập BCKTKT\n- **Đầu ra**: Báo cáo khảo sát, nhiệm vụ khảo sát/thiết kế đã phê duyệt\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập và trình phương án kỹ thuật khảo sát.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Triển khai khảo sát hiện trường (địa hình, địa chất, hạ tầng liên quan).', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA nghiệm thu kết quả khảo sát, phê duyệt nhiệm vụ khảo sát/thiết kế.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Tư vấn lập BCKTKT, TKBVTC và dự toán',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn (QLDA theo dõi, hỗ trợ)\n- Tư vấn lập BCKTKT bao gồm: thuyết minh, TKBVTC (bản vẽ kỹ thuật), dự toán/TMĐT, phương án GPMB, nội dung môi trường, PCCC\n- QLDA theo dõi tiến độ, xử lý vướng mắc trong quá trình tư vấn thực hiện\n- **Điểm kiểm soát**: thuyết minh phải có phương án GPMB, nội dung môi trường, PCCC; dự toán không vượt vốn chủ trương\n- **Đầu ra**: Hồ sơ BCKTKT lần 1\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập thuyết minh BCKTKT (phương án kiến trúc, kết cấu, hạ tầng, GPMB, MT, PCCC).', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn hoàn thiện bản vẽ TKBVTC và dự toán xây dựng.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA nhắc hạn, xử lý vướng mắc kỹ thuật, pháp lý phát sinh.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '7. Tiếp nhận và kiểm tra danh mục hồ sơ',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'reception',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA phối hợp HCTH\n- Kiểm tra danh mục hồ sơ tư vấn nộp: thuyết minh, bản vẽ, dự toán, hồ sơ pháp lý kèm theo\n- Lập phiếu tiếp nhận/danh mục hồ sơ\n- **Điểm kiểm soát**: không tiếp nhận hồ sơ thiếu chữ ký, dấu, file mềm (CAD/Excel/PDF) hoặc thiếu thành phần chính\n- **Đầu ra**: Phiếu tiếp nhận hồ sơ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra danh mục và số lượng hồ sơ theo yêu cầu hợp đồng.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập phiếu tiếp nhận, ghi ngày tiếp nhận; thông báo ngay nếu thiếu thành phần.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '8. Kiểm tra nội dung BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-03',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập bảng kiểm tra BM-TK1B-03 (16 mục): thuyết minh, cơ sở pháp lý, quy hoạch, phương án thiết kế, GPMB, môi trường, PCCC\n- Kết luận: đạt/chưa đạt; nếu chưa đạt — chuyển sang bước 11 (yêu cầu chỉnh sửa)\n- **Điểm kiểm soát**: kiểm tra sự phù hợp quy hoạch, cấp công trình, phương án GPMB/môi trường/PCCC\n- **Đầu ra**: BM-TK1B-03 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-03 — kiểm tra 16 nội dung thuyết minh BCKTKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phối hợp KTTĐ rà soát cơ sở pháp lý, quy hoạch, năng lực tư vấn.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Ghi kết luận đạt/chưa đạt; chuyển bước 11 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '9. Kiểm tra TKBVTC trong BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-04',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập bảng kiểm tra BM-TK1B-04 (17 mục): an toàn chịu lực, quy chuẩn, tiêu chuẩn, sự phù hợp với khảo sát\n- Kiểm tra bản vẽ TKBVTC: mặt bằng, mặt cắt, chi tiết cấu tạo, hệ thống kỹ thuật\n- **Điểm kiểm soát**: đảm bảo an toàn chịu lực, phù hợp kết quả khảo sát, đúng quy chuẩn PCCC, môi trường\n- **Đầu ra**: BM-TK1B-04 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-04 — kiểm tra 17 nội dung bản vẽ TKBVTC.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Đối chiếu bản vẽ với kết quả khảo sát, quy chuẩn kỹ thuật quốc gia.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Ghi kết luận và yêu cầu chỉnh sửa nếu cần.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '10. Kiểm tra dự toán/tổng mức đầu tư trong BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-05',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ, KHĐT\n- Lập bảng kiểm tra BM-TK1B-05 (14 mục) + bảng tổng hợp chi phí\n- Kiểm tra: đơn giá, định mức, công bố giá, báo giá vật liệu, chi phí tư vấn, chi phí quản lý\n- **Điểm kiểm soát**: dự toán không vượt chủ trương/nguồn vốn nếu chưa có thủ tục điều chỉnh; cơ cấu chi phí hợp lý\n- **Đầu ra**: BM-TK1B-05 đã ký kèm bảng tổng hợp chi phí`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-05 — kiểm tra 14 nội dung dự toán và bảng tổng hợp chi phí.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Đối chiếu đơn giá, định mức với công bố giá, báo giá thị trường hiện hành.', assignee_role: 'KTTĐ / KHĐT' },
                        { id: crypto.randomUUID(), name: 'Xác nhận không vượt vốn chủ trương; ghi chú chênh lệch nếu có.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '11. Yêu cầu tư vấn chỉnh sửa nếu chưa đạt',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK1B-06',
                    guidelines: `- **Thực hiện khi**: bước 8, 9 hoặc 10 có kết quả "chưa đạt"\n- Phát hành BM-TK1B-06 — văn bản yêu cầu tư vấn chỉnh sửa\n- Nêu rõ: danh mục lỗi/thiếu sót, yêu cầu cụ thể, đầu mối xử lý và hạn hoàn thành\n- Khóa bước trình thẩm định cho đến khi tư vấn hoàn thành bảng tiếp thu giải trình\n- **Điểm kiểm soát**: mọi ý kiến yêu cầu phải có đầu mối QLDA chịu trách nhiệm và hạn hoàn thành rõ ràng\n- **Đầu ra**: BM-TK1B-06 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tổng hợp các lỗi/thiếu sót từ BM-TK1B-03/04/05.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập và phát hành BM-TK1B-06 — yêu cầu chỉnh sửa; đặt hạn hoàn thành cho tư vấn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Theo dõi tư vấn chỉnh sửa; kiểm tra lại hồ sơ sau khi nhận bản chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '12. Tổng hợp tiếp thu, giải trình',
                type: 'input',
                role: 'Tư vấn / QLDA',
                sla: '3d',
                metadata: {
                    phase: 'consolidation',
                    form_code: 'BM-TK1B-07',
                    guidelines: `- **Chủ trì**: Tư vấn lập, QLDA xác nhận (phối hợp KTTĐ)\n- Tư vấn lập bảng tiếp thu giải trình theo BM-TK1B-07 (12 dòng tiêu chuẩn)\n- QLDA kiểm tra mức độ tiếp thu: đã tiếp thu đầy đủ / có giải trình hợp lý / chưa tiếp thu\n- **Điểm kiểm soát**: chỉ chuyển bước thẩm tra/thẩm định khi đã tiếp thu đầy đủ hoặc có giải trình được QLDA chấp thuận\n- **Đầu ra**: BM-TK1B-07 đã ký (tư vấn + QLDA)`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK1B-07 — bảng tiếp thu giải trình từng ý kiến yêu cầu chỉnh sửa.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA xem xét, đánh dấu tiếp thu/chưa tiếp thu từng mục; ký xác nhận.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '13. Tổ chức thẩm tra thiết kế/dự toán',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Thực hiện khi**: công trình thuộc đối tượng phải thẩm tra hoặc Ban yêu cầu thẩm tra để kiểm soát rủi ro\n- **Chủ trì**: QLDA; tư vấn thẩm tra độc lập\n- Tư vấn thẩm tra thực hiện: kiểm tra an toàn chịu lực, quy chuẩn, khối lượng, chi phí\n- **Điểm kiểm soát**: báo cáo thẩm tra là cơ sở phục vụ thẩm định; không bỏ qua thẩm tra nếu công trình thuộc đối tượng bắt buộc\n- **Đầu ra**: Báo cáo thẩm tra thiết kế/dự toán\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Xác định đối tượng thẩm tra; lựa chọn tư vấn thẩm tra theo KHLCNT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn thẩm tra thực hiện kiểm tra an toàn, quy chuẩn, khối lượng, chi phí.', assignee_role: 'Tư vấn thẩm tra' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; chuyển tư vấn tiếp thu ý kiến thẩm tra nếu có.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '14. Lập tờ trình thẩm định BCKTKT',
                type: 'input',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'consolidation',
                    form_code: 'BM-TK1B-08',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập tờ trình thẩm định theo BM-TK1B-08; đính kèm hồ sơ hoàn thiện và báo cáo thẩm tra (nếu có)\n- Gửi đúng cơ quan/bộ phận được người quyết định đầu tư giao thẩm định (theo Điều 26 Luật Xây dựng 2025)\n- **Điểm kiểm soát**: trình đúng thẩm quyền; hồ sơ đầy đủ thành phần trước khi gửi thẩm định\n- **Đầu ra**: BM-TK1B-08 đã ký; hồ sơ gửi thẩm định`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Hoàn thiện hồ sơ BCKTKT lần cuối trước khi trình thẩm định.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập tờ trình thẩm định BM-TK1B-08; trình lãnh đạo ký.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Gửi hồ sơ đến cơ quan/bộ phận thẩm định đúng theo phân cấp.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '15. Tiếp thu kết quả thẩm định',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: QLDA phối hợp Tư vấn\n- Nhận văn bản thẩm định; tổ chức họp với tư vấn để tiếp thu, phân loại ý kiến\n- Tư vấn chỉnh sửa hồ sơ theo ý kiến thẩm định bắt buộc\n- Lập bảng tiếp thu ý kiến thẩm định\n- **Điểm kiểm soát**: không trình phê duyệt khi chưa đóng các ý kiến bắt buộc của cơ quan thẩm định\n- **Đầu ra**: Bảng tiếp thu ý kiến thẩm định; hồ sơ hoàn thiện sau thẩm định`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Nhận văn bản thẩm định; phân loại ý kiến bắt buộc/khuyến nghị/ghi nhận.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tổ chức tư vấn tiếp thu, chỉnh sửa hồ sơ theo ý kiến bắt buộc.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập bảng tiếp thu ý kiến thẩm định; xác nhận đã đóng hết ý kiến bắt buộc.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '16. Lập tờ trình và dự thảo quyết định phê duyệt BCKTKT',
                type: 'approval',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK1B-09',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập tờ trình phê duyệt (BM-TK1B-08 hoặc BM-TK1B-09) và dự thảo Quyết định phê duyệt BCKTKT/quyết định đầu tư (BM-TK1B-10)\n- Phụ lục kèm theo: tổng mức đầu tư, cơ cấu chi phí, danh mục bản vẽ\n- **Điểm kiểm soát**: thẩm quyền phê duyệt theo Luật Đầu tư công và quyết định phân cấp/ủy quyền; không phê duyệt khi chưa đóng ý kiến thẩm định\n- **Đầu ra**: BM-TK1B-09 + BM-TK1B-10 đã trình ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-09 — tờ trình phê duyệt BCKTKT kèm phụ lục TMĐT, cơ cấu chi phí.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Soạn dự thảo Quyết định phê duyệt BM-TK1B-10; kiểm tra thẩm quyền ký.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình Giám đốc Ban/cấp được ủy quyền ký Quyết định phê duyệt BCKTKT.', assignee_role: 'Lãnh đạo Ban QLDA' },
                    ]
                }
            },
            {
                name: '17. Cập nhật quyết định phê duyệt và bàn giao hồ sơ',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK1B-11',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KHĐT, HCTH\n- Cập nhật Quyết định phê duyệt lên phần mềm: file PDF ký số, file gốc Word/Excel/CAD\n- Lập BM-TK1B-11 — Phiếu bàn giao hồ sơ cho Tổ chuyên gia/KHĐT để lập KHLCNT\n- Lập BM-TK1B-12 — Phiếu cập nhật phần mềm; khóa phiên bản phê duyệt\n- **Điểm kiểm soát**: chuyển sang quy trình QT-02/KHLCNT sau khi bàn giao hồ sơ\n- **Đầu ra**: BM-TK1B-11 + BM-TK1B-12; hồ sơ lưu trữ đầy đủ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Cập nhật Quyết định phê duyệt lên phần mềm (PDF ký số, file gốc, danh mục bản vẽ).', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-11 — bàn giao hồ sơ cho KHĐT để lập KHLCNT/lựa chọn nhà thầu.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK1B-12 — cập nhật phần mềm; khóa phiên bản; lưu trữ hồ sơ gốc.', assignee_role: 'Chuyên viên QLDA' },
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
                name: '1. Khởi tạo quy trình QT-TK2B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA\n- Khởi tạo sau khi có Quyết định phê duyệt dự án/BCNCKT\n- Nhập: tên dự án, gói thầu, quyết định phê duyệt dự án, cấp công trình, tổng mức đầu tư, nguồn vốn\n- **Điểm kiểm soát**: không khởi tạo QT-TK2B nếu chưa có dự án được phê duyệt\n- **Đầu ra**: Hồ sơ điện tử QT-TK2B được khởi tạo`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Khởi tạo hồ sơ điện tử QT-TK2B; nhập thông tin dự án và gói thầu.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Gán chuyên viên phụ trách; thiết lập mốc thời hạn theo kế hoạch.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện lập TKBVTC&DT',
                type: 'input',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK2B-01',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ, KHĐT\n- Lập BM-TK2B-01 (17 mục): đối chiếu mục tiêu, quy mô, cấp công trình, TKCS, GPMB, quy hoạch, nguồn vốn\n- Xác định phạm vi TKBVTC theo từng hạng mục/gói thầu\n- **Điểm kiểm soát**: TKBVTC không được làm thay đổi mục tiêu/quy mô nếu chưa điều chỉnh dự án\n- **Đầu ra**: BM-TK2B-01 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-01 — kiểm tra 17 điều kiện; đối chiếu với QĐ phê duyệt dự án và TKCS.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng ký xác nhận đủ/chưa đủ điều kiện.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                    ]
                }
            },
            {
                name: '3. Giao nhiệm vụ tư vấn thiết kế TKBVTC',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK2B-02',
                    guidelines: `- **Chủ trì**: QLDA\n- Phát hành BM-TK2B-02 — phiếu giao nhiệm vụ tư vấn thiết kế TKBVTC\n- Nêu rõ: mốc nộp bản vẽ, dự toán, định dạng file (CAD/Excel/PDF), yêu cầu kỹ thuật cụ thể\n- **Điểm kiểm soát**: nhiệm vụ thiết kế phải bám sát TKCS và quyết định phê duyệt dự án\n- **Đầu ra**: BM-TK2B-02 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-02 — giao nhiệm vụ thiết kế TKBVTC; nêu rõ mốc hạn và yêu cầu file.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; cập nhật lên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. Tư vấn lập TKBVTC và dự toán',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn (QLDA theo dõi tiến độ)\n- Tư vấn cụ thể hóa TKCS thành TKBVTC đủ chi tiết để thi công; lập dự toán theo khối lượng thiết kế\n- **Điểm kiểm soát**: không để TKBVTC thay đổi mục tiêu/quy mô/TMĐT của dự án đã phê duyệt\n- **Đầu ra**: Hồ sơ TKBVTC&DT lần 1\n- **Thời hạn**: theo hợp đồng tư vấn`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKBVTC đủ chi tiết để thi công, nghiệm thu, thanh toán.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập dự toán theo khối lượng TKBVTC, đơn giá hiện hành.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA theo dõi tiến độ; xử lý vướng mắc kỹ thuật/pháp lý phát sinh.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '5. Tiếp nhận và kiểm tra hình thức hồ sơ',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: QLDA phối hợp HCTH\n- Kiểm tra đủ thành phần: bản vẽ thiết kế, thuyết minh, dự toán, file CAD/Excel/PDF, chữ ký, dấu\n- Lập phiếu tiếp nhận; thông báo ngay nếu thiếu thành phần\n- **Điểm kiểm soát**: không tiếp nhận hồ sơ thiếu file mềm, thiếu chữ ký/dấu hoặc thiếu danh mục bản vẽ\n- **Đầu ra**: Phiếu tiếp nhận hồ sơ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Kiểm tra danh mục, thành phần, định dạng file và chữ ký/dấu trên hồ sơ.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập phiếu tiếp nhận; ghi ngày tiếp nhận chính thức.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Kiểm tra TKBVTC',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'consultant',
                    form_code: 'BM-TK2B-03',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập BM-TK2B-03 — kiểm tra TKBVTC: phù hợp TKCS, nhiệm vụ thiết kế, khảo sát, quy chuẩn\n- **Điểm kiểm soát**: TKBVTC phải cụ thể hóa TKCS; đúng quy chuẩn PCCC, môi trường, chuyên ngành\n- **Đầu ra**: BM-TK2B-03 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-03 — kiểm tra bản vẽ TKBVTC theo danh mục tiêu chí.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phối hợp KTTĐ rà soát an toàn chịu lực, quy chuẩn kỹ thuật.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Kết luận đạt/chưa đạt; chuyển bước 8 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '7. Kiểm tra dự toán TKBVTC',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'reception',
                    form_code: 'BM-TK2B-04',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ, KHĐT\n- Lập BM-TK2B-04 — kiểm tra dự toán: đơn giá, định mức, công bố giá, báo giá, không vượt TMĐT\n- **Điểm kiểm soát**: khối lượng dự toán phù hợp bản vẽ; giá tại thời điểm lập; không vượt TMĐT đã duyệt\n- **Đầu ra**: BM-TK2B-04 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-04 — kiểm tra khối lượng, đơn giá, định mức dự toán.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Đối chiếu tổng giá trị dự toán với TMĐT; xác nhận không vượt cơ cấu chi phí duyệt.', assignee_role: 'KTTĐ / KHĐT' },
                    ]
                }
            },
            {
                name: '8. Yêu cầu chỉnh sửa/bổ sung',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK2B-05',
                    guidelines: `- **Thực hiện khi**: bước 6 hoặc 7 có kết quả "chưa đạt"\n- Phát hành BM-TK2B-05 — văn bản yêu cầu chỉnh sửa/bổ sung\n- Nêu rõ nội dung cần sửa, hạn hoàn thành, đầu mối xử lý\n- **Điểm kiểm soát**: chỉ chuyển bước thẩm định khi lỗi đã xử lý hoặc có giải trình được chấp thuận\n- **Đầu ra**: BM-TK2B-05 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tổng hợp ý kiến từ BM-TK2B-03/04; lập BM-TK2B-05 gửi tư vấn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Theo dõi tư vấn chỉnh sửa; kiểm tra lại sau khi nhận bản sửa đổi.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '9. Tổng hợp tiếp thu, giải trình',
                type: 'input',
                role: 'Tư vấn / QLDA',
                sla: '3d',
                metadata: {
                    phase: 'consolidation',
                    form_code: 'BM-TK2B-06',
                    guidelines: `- **Chủ trì**: Tư vấn lập, QLDA xác nhận\n- Lập BM-TK2B-06 — bảng tiếp thu giải trình các ý kiến kiểm tra/thẩm tra\n- **Điểm kiểm soát**: bảng tiếp thu là hồ sơ bắt buộc trước khi trình thẩm định/phê duyệt\n- **Đầu ra**: BM-TK2B-06 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK2B-06 — tiếp thu từng ý kiến yêu cầu.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA đánh giá mức độ tiếp thu; ký xác nhận.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '10. Tổ chức thẩm tra thiết kế/dự toán',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Thực hiện khi**: thuộc đối tượng thẩm tra bắt buộc hoặc Ban yêu cầu\n- Tư vấn thẩm tra kiểm tra: an toàn, quy chuẩn, khối lượng, chi phí\n- **Đầu ra**: Báo cáo thẩm tra thiết kế/dự toán\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lựa chọn tư vấn thẩm tra; giao hồ sơ để thẩm tra.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; tư vấn tiếp thu ý kiến thẩm tra.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '11. Thẩm định/kiểm soát nội bộ của chủ đầu tư',
                type: 'input',
                role: 'KTTĐ',
                sla: '7d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: KTTĐ phối hợp QLDA2, Tư vấn\n- Thực hiện theo nội dung Điều 30 Luật Xây dựng 2025 — chủ đầu tư thẩm định, kiểm soát thiết kế\n- Lập báo cáo/phiếu thẩm định nội bộ\n- **Điểm kiểm soát**: không phê duyệt khi chưa có kết quả thẩm định nội bộ\n- **Đầu ra**: Báo cáo/phiếu thẩm định nội bộ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'KTTĐ thẩm định nội dung kỹ thuật, an toàn, quy chuẩn theo Điều 30 Luật XD 2025.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Lập báo cáo/phiếu thẩm định nội bộ; gửi kết quả về QLDA.', assignee_role: 'KTTĐ' },
                    ]
                }
            },
            {
                name: '12. Lập tờ trình phê duyệt TKBVTC&DT',
                type: 'approval',
                role: 'QLDA',
                sla: '2d',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK2B-07',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập BM-TK2B-07 tờ trình phê duyệt và BM-TK2B-08 dự thảo Quyết định phê duyệt\n- **Điểm kiểm soát**: trình đúng thẩm quyền theo quy chế Ban; kèm phụ lục dự toán và danh mục bản vẽ\n- **Đầu ra**: BM-TK2B-07/BM-TK2B-08 đã trình ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-07 — tờ trình phê duyệt TKBVTC&DT kèm phụ lục.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Soạn BM-TK2B-08 — dự thảo Quyết định phê duyệt TKBVTC&DT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình Giám đốc Ban/cấp được ủy quyền ký Quyết định phê duyệt.', assignee_role: 'Lãnh đạo Ban QLDA' },
                    ]
                }
            },
            {
                name: '13. Ban hành Quyết định phê duyệt TKBVTC&DT',
                type: 'approval',
                role: 'Ban QLDA',
                sla: '',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK2B-09',
                    guidelines: `- **Chủ trì**: Ban QLDA (QLDA2 + HCTH thực hiện)\n- Ban hành Quyết định phê duyệt TKBVTC&DT (BM-TK2B-09)\n- Quyết định kèm phụ lục: dự toán phê duyệt, danh mục bản vẽ\n- Đóng dấu hồ sơ thiết kế\n- **Đầu ra**: Quyết định phê duyệt BM-TK2B-09 đã ban hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'HCTH đóng số, đóng dấu và ban hành Quyết định phê duyệt TKBVTC&DT.', assignee_role: 'HCTH' },
                        { id: crypto.randomUUID(), name: 'Đóng dấu thẩm định/phê duyệt lên hồ sơ thiết kế (bản giấy và ký số bản điện tử).', assignee_role: 'HCTH / Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '14. Bàn giao hồ sơ cho Tổ chuyên gia và các đơn vị liên quan',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK2B-10',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KHĐT, KTTĐ\n- Lập BM-TK2B-10 — Phiếu bàn giao hồ sơ phê duyệt cho Tổ chuyên gia/KHĐT\n- Hồ sơ bàn giao là căn cứ lập giá gói thầu, KHLCNT, HSMT/HSYC\n- **Điểm kiểm soát**: bàn giao đầy đủ: bản vẽ đóng dấu, dự toán phê duyệt, QĐ phê duyệt\n- **Đầu ra**: BM-TK2B-10 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-10 — danh mục hồ sơ bàn giao, ký xác nhận giao/nhận.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Bàn giao hồ sơ phê duyệt cho KHĐT làm cơ sở lập KHLCNT.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '15. Cập nhật phần mềm và lưu trữ',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK2B-11',
                    guidelines: `- **Chủ trì**: QLDA phối hợp HCTH/PM\n- Cập nhật phần mềm: QĐ phê duyệt (PDF ký số), file gốc CAD/Excel/Word, phiên bản phê duyệt\n- Lập BM-TK2B-11 — phiếu cập nhật phần mềm; khóa phiên bản\n- Lưu trữ bản giấy tại Văn thư\n- **Điểm kiểm soát**: khóa phiên bản phê duyệt; phục vụ thi công, giám sát, thanh toán, kiểm toán\n- **Đầu ra**: BM-TK2B-11; hồ sơ lưu trữ đầy đủ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Cập nhật QĐ phê duyệt, hồ sơ đóng dấu lên phần mềm; khóa phiên bản.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK2B-11 — xác nhận cập nhật phần mềm và lưu trữ hồ sơ.', assignee_role: 'Chuyên viên QLDA' },
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
            {
                name: '1. Khởi tạo quy trình QT-TK3B',
                type: 'start',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Chuyên viên QLDA\n- Khởi tạo sau khi có Quyết định phê duyệt BCNCKT có TKCS\n- **Điểm kiểm soát**: chỉ áp dụng khi dự án được xác định thiết kế 3 bước (quy mô lớn, kỹ thuật phức tạp)\n- **Đầu ra**: Hồ sơ điện tử QT-TK3B được khởi tạo`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Khởi tạo hồ sơ điện tử QT-TK3B; xác nhận dự án đúng thiết kế 3 bước.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Nhập thông tin dự án, gán phụ trách, thiết lập mốc TKKT và TKBVTC riêng biệt.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '2. Rà soát điều kiện lập Thiết kế kỹ thuật',
                type: 'input',
                role: 'QLDA',
                sla: '3d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK3B-01',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập BM-TK3B-01 (18 mục): xác định phạm vi TKKT, hạng mục, mốc tiến độ; đối chiếu TKCS, khảo sát, tiêu chuẩn\n- **Điểm kiểm soát**: TKKT phải cụ thể hóa TKCS, không mở rộng phạm vi nếu chưa điều chỉnh dự án\n- **Đầu ra**: BM-TK3B-01 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-01 — kiểm tra 18 điều kiện lập TKKT; đối chiếu TKCS và QĐ dự án.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Trình lãnh đạo Phòng ký xác nhận đủ điều kiện.', assignee_role: 'Lãnh đạo Phòng QLDA' },
                    ]
                }
            },
            {
                name: '3. Giao nhiệm vụ tư vấn lập Thiết kế kỹ thuật',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'initiation',
                    form_code: 'BM-TK3B-02',
                    guidelines: `- **Chủ trì**: QLDA\n- Lập BM-TK3B-02 — giao nhiệm vụ thiết kế TKKT; yêu cầu rõ nội dung tính toán, bản vẽ, thuyết minh, dự toán\n- **Điểm kiểm soát**: nhiệm vụ phải bám sát TKCS; xác định rõ đối tượng thẩm tra bắt buộc\n- **Đầu ra**: BM-TK3B-02 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-02 — giao nhiệm vụ tư vấn TKKT; nêu yêu cầu tính toán, bản vẽ, mốc hạn.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; cập nhật lên phần mềm.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '4. Tư vấn lập TKKT và dự toán theo TKKT',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'consultant',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn (QLDA theo dõi)\n- Cụ thể hóa TKCS: tính toán kết cấu, giải pháp kỹ thuật, cấu tạo chính; lập dự toán theo TKKT\n- **Điểm kiểm soát**: kiểm soát an toàn chịu lực, giải pháp kỹ thuật; không làm thay đổi mục tiêu/quy mô\n- **Đầu ra**: Hồ sơ TKKT&DT lần 1`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập thuyết minh TKKT, tính toán kết cấu, hệ thống kỹ thuật.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKKT và dự toán theo thiết kế kỹ thuật.', assignee_role: 'Tư vấn' },
                    ]
                }
            },
            {
                name: '5. Kiểm tra hồ sơ Thiết kế kỹ thuật',
                type: 'input',
                role: 'QLDA',
                sla: '7d',
                metadata: {
                    phase: 'consultant',
                    form_code: 'BM-TK3B-03',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập BM-TK3B-03 — kiểm tra thuyết minh, tính toán, bản vẽ TKKT, quy chuẩn, tiêu chuẩn\n- **Điểm kiểm soát**: TKKT phải đủ cơ sở kỹ thuật để lập TKBVTC; an toàn chịu lực đảm bảo\n- **Đầu ra**: BM-TK3B-03 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-03 — kiểm tra thuyết minh, tính toán, bản vẽ TKKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'KTTĐ rà soát an toàn chịu lực, giải pháp kỹ thuật, quy chuẩn.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Kết luận đạt/chưa đạt; chuyển bước 7 nếu cần chỉnh sửa.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '6. Kiểm tra dự toán theo Thiết kế kỹ thuật',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-04',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ, KHĐT\n- Lập BM-TK3B-04 — kiểm tra dự toán TKKT: đơn giá, định mức, đối chiếu TMĐT\n- **Điểm kiểm soát**: cơ cấu chi phí TKKT trong tổng mức đầu tư đã duyệt\n- **Đầu ra**: BM-TK3B-04 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-04 — kiểm tra dự toán TKKT theo khối lượng và đơn giá.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Đối chiếu cơ cấu chi phí TKKT với TMĐT phê duyệt.', assignee_role: 'KTTĐ / KHĐT' },
                    ]
                }
            },
            {
                name: '7. Yêu cầu chỉnh sửa TKKT và tổng hợp tiếp thu',
                type: 'input',
                role: 'QLDA / Tư vấn',
                sla: '',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-05',
                    guidelines: `- **Thực hiện khi**: bước 5 hoặc 6 có kết quả "chưa đạt"\n- Phát hành BM-TK3B-05 — yêu cầu chỉnh sửa TKKT\n- Tư vấn chỉnh sửa, lập BM-TK3B-06 — bảng tiếp thu giải trình\n- **Điểm kiểm soát**: mọi ý kiến phải được đóng bằng tiếp thu hoặc giải trình được chấp thuận\n- **Đầu ra**: BM-TK3B-05 + BM-TK3B-06 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-05 — tổng hợp ý kiến yêu cầu chỉnh sửa TKKT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tư vấn lập BM-TK3B-06 — tiếp thu, giải trình từng ý kiến; QLDA xác nhận.', assignee_role: 'Tư vấn / Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '8. Thẩm tra TKKT&DT',
                type: 'input',
                role: 'QLDA',
                sla: '',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Thực hiện khi**: thuộc đối tượng thẩm tra bắt buộc hoặc Ban yêu cầu\n- Tập trung: an toàn chịu lực, quy chuẩn, khối lượng, giá trị\n- **Đầu ra**: Báo cáo thẩm tra TKKT&DT\n- **Thời hạn**: theo hợp đồng thẩm tra`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Giao hồ sơ TKKT&DT hoàn thiện cho tư vấn thẩm tra.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Tiếp nhận báo cáo thẩm tra; tổ chức tư vấn tiếp thu ý kiến.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '9. Thẩm định/kiểm soát nội bộ TKKT&DT',
                type: 'input',
                role: 'KTTĐ',
                sla: '7d',
                metadata: {
                    phase: 'consolidation',
                    form_code: null,
                    guidelines: `- **Chủ trì**: KTTĐ phối hợp QLDA\n- Thẩm định nội dung theo Điều 30 Luật Xây dựng 2025\n- Lập báo cáo/phiếu thẩm định nội bộ TKKT\n- **Điểm kiểm soát**: không phê duyệt TKKT khi chưa có kết quả thẩm định nội bộ\n- **Đầu ra**: Báo cáo/phiếu thẩm định nội bộ TKKT`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'KTTĐ thẩm định TKKT: an toàn, quy chuẩn, kỹ thuật, môi trường, PCCC.', assignee_role: 'KTTĐ' },
                        { id: crypto.randomUUID(), name: 'Lập báo cáo thẩm định nội bộ TKKT; chuyển kết quả về QLDA.', assignee_role: 'KTTĐ' },
                    ]
                }
            },
            {
                name: '10. Trình và phê duyệt TKKT&DT',
                type: 'approval',
                role: 'QLDA / Ban QLDA',
                sla: '',
                metadata: {
                    phase: 'approval',
                    form_code: 'BM-TK3B-07',
                    guidelines: `- **Chủ trì**: QLDA trình, Ban QLDA phê duyệt\n- Lập BM-TK3B-07 tờ trình, BM-TK3B-08 dự thảo QĐ phê duyệt TKKT&DT, BM-TK3B-09 phụ lục chi phí\n- **Điểm kiểm soát**: phê duyệt TKKT&DT trước khi lập TKBVTC (trừ trường hợp được phép song song)\n- **Đầu ra**: Quyết định phê duyệt TKKT&DT đã ban hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-07 — tờ trình phê duyệt TKKT&DT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Soạn BM-TK3B-08 dự thảo QĐ + BM-TK3B-09 phụ lục chi phí/bản vẽ.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Giám đốc Ban ký Quyết định phê duyệt TKKT&DT; đóng dấu hồ sơ.', assignee_role: 'Lãnh đạo Ban QLDA' },
                    ]
                }
            },
            {
                name: '11. Giao nhiệm vụ lập TKBVTC theo TKKT đã phê duyệt',
                type: 'input',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-10',
                    guidelines: `- **Chủ trì**: QLDA\n- Lập BM-TK3B-10 — giao nhiệm vụ tư vấn lập TKBVTC; nhiệm vụ phải bám sát TKKT đã phê duyệt\n- **Điểm kiểm soát**: TKBVTC phải chi tiết hóa TKKT; không thay đổi giải pháp chính nếu chưa được chấp thuận\n- **Đầu ra**: BM-TK3B-10 đã phát hành`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-10 — giao nhiệm vụ TKBVTC theo TKKT đã duyệt.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Phát hành cho tư vấn; đặt mốc hạn nộp TKBVTC.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '12. Tư vấn lập TKBVTC theo TKKT',
                type: 'input',
                role: 'Tư vấn',
                sla: '',
                metadata: {
                    phase: 'review',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Tư vấn (QLDA theo dõi)\n- Chi tiết hóa TKKT thành bản vẽ thi công đủ để thi công, nghiệm thu, quản lý chất lượng, thanh toán và quyết toán\n- **Điểm kiểm soát**: không thay đổi giải pháp chính của TKKT nếu chưa được chấp thuận điều chỉnh\n- **Đầu ra**: Hồ sơ TKBVTC lần 1`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Tư vấn lập bản vẽ TKBVTC chi tiết hóa từ TKKT được duyệt.', assignee_role: 'Tư vấn' },
                        { id: crypto.randomUUID(), name: 'QLDA theo dõi, kiểm tra sự phù hợp với TKKT trong quá trình tư vấn lập.', assignee_role: 'Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '13. Kiểm tra TKBVTC theo TKKT',
                type: 'input',
                role: 'QLDA',
                sla: '5d',
                metadata: {
                    phase: 'review',
                    form_code: 'BM-TK3B-11',
                    guidelines: `- **Chủ trì**: QLDA phối hợp KTTĐ\n- Lập BM-TK3B-11 — kiểm tra TKBVTC: đối chiếu TKKT, cấu tạo, biện pháp, chi tiết thi công\n- **Điểm kiểm soát**: TKBVTC phải sai số so với TKKT trong giới hạn cho phép; đủ chi tiết để thi công\n- **Đầu ra**: BM-TK3B-11 đã ký`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-11 — kiểm tra TKBVTC theo TKKT được duyệt.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Xác nhận TKBVTC đủ chi tiết thi công, đúng cấu tạo và biện pháp theo TKKT.', assignee_role: 'KTTĐ' },
                    ]
                }
            },
            {
                name: '14. Phê duyệt TKBVTC',
                type: 'approval',
                role: 'Ban QLDA / QLDA',
                sla: '',
                metadata: {
                    phase: 'approval',
                    form_code: null,
                    guidelines: `- **Chủ trì**: Ban QLDA/QLDA theo thẩm quyền\n- Phê duyệt hoặc ban hành văn bản chấp thuận TKBVTC theo TKKT\n- **Điểm kiểm soát**: là căn cứ thi công, giám sát, nghiệm thu\n- **Đầu ra**: Văn bản phê duyệt/chấp thuận TKBVTC`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Giám đốc Ban/cấp được ủy quyền ký phê duyệt hoặc chấp thuận TKBVTC.', assignee_role: 'Lãnh đạo Ban QLDA' },
                        { id: crypto.randomUUID(), name: 'Đóng dấu hồ sơ TKBVTC; cập nhật văn bản phê duyệt lên phần mềm.', assignee_role: 'HCTH / Chuyên viên QLDA' },
                    ]
                }
            },
            {
                name: '15. Cập nhật phần mềm, bàn giao và lưu trữ',
                type: 'end',
                role: 'QLDA',
                sla: '1d',
                metadata: {
                    phase: 'handover',
                    form_code: 'BM-TK3B-12',
                    guidelines: `- **Chủ trì**: QLDA phối hợp HCTH, KHĐT\n- Lập BM-TK3B-12 — phiếu cập nhật phần mềm; khóa phiên bản phê duyệt TKBVTC\n- Lập BM-TK3B-13 — phiếu bàn giao hồ sơ TKBVTC cho đơn vị thi công/giám sát và KHĐT\n- **Điểm kiểm soát**: theo dõi điều chỉnh nếu phát sinh trong thi công; mọi điều chỉnh phải có thủ tục phê duyệt\n- **Đầu ra**: BM-TK3B-12 + BM-TK3B-13; hồ sơ lưu trữ đầy đủ`,
                    sub_tasks: [
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-12 — cập nhật phần mềm; khóa phiên bản TKBVTC phê duyệt.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lập BM-TK3B-13 — bàn giao TKBVTC cho tư vấn giám sát, đơn vị thi công và KHĐT.', assignee_role: 'Chuyên viên QLDA' },
                        { id: crypto.randomUUID(), name: 'Lưu trữ hồ sơ gốc (TKKT và TKBVTC đóng dấu) tại Văn thư.', assignee_role: 'HCTH / Văn thư' },
                    ]
                }
            },
        ]
    };

    return [QT_TK1B, QT_TK2B, QT_TK3B];
}