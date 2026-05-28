// ============================================================
// Hệ thống biểu mẫu Bộ Quy Trình DAXD TK1B/TK2B/TK3B
// Mã tài liệu: QT-DAXD-TK-QLDA2-2026 — Áp dụng sau 01/7/2026
// ============================================================

export interface ChecklistItem {
    id: string;
    label: string;
    required?: boolean;
}

export interface CostSummaryRow {
    label: string;
    field_approved: string;
    field_submitted: string;
    field_diff: string;
}

export interface RevisionRow {
    id: string;
    fields: string[];
}

export interface HandoverRow {
    id: string;
    fields: string[]; // ['name', 'paper_qty', 'digital', 'received', 'note']
}

export interface TableColumn {
    key: string;
    label: string;
    width?: string;
}

export interface FormTable {
    columns: TableColumn[];
    defaultRows: number;
}

export type SignatureBlock = 'inspector' | 'room_leader' | 'drafter' | 'consultant' | 'qlda' | 'issuer' | 'receiver' | 'updater' | 'director' | 'officer';

export interface DesignFormSchema {
    code: string;
    title: string;
    description?: string;
    /** Trường thông tin header (thứ tự hiển thị) */
    header_fields: Array<{
        key: string;
        label: string;
        type?: 'text' | 'date' | 'number';
        optional?: boolean;
    }>;
    /** Checklist items (nếu có) */
    checklist?: ChecklistItem[];
    /** Kết luận checklist (pass/fail) */
    has_conclusion?: boolean;
    /** Bảng tổng hợp chi phí */
    cost_summary?: CostSummaryRow[];
    /** Bảng điền nội dung dạng bảng (không phải checklist) */
    table?: FormTable;
    /** Phần ký tên */
    signature_blocks: SignatureBlock[];
    /** Ghi chú */
    notes?: string;
}

// ============================================================
// HEADER FIELDS DÙNG CHUNG
// ============================================================
const COMMON_HEADER = [
    { key: 'project_name', label: 'Dự án' },
    { key: 'package', label: 'Hạng mục/Gói thầu' },
    { key: 'location', label: 'Địa điểm xây dựng' },
    { key: 'owner', label: 'Chủ đầu tư/Ban quản lý dự án' },
    { key: 'officer', label: 'Cán bộ/Chuyên viên phụ trách' },
    { key: 'date', label: 'Ngày lập/kiểm tra', type: 'date' as const },
];

const CONSULTANT_HEADER = [
    ...COMMON_HEADER,
    { key: 'consultant', label: 'Đơn vị tư vấn' },
    { key: 'contract_no', label: 'Số hợp đồng/văn bản giao nhiệm vụ' },
    { key: 'deadline', label: 'Thời hạn hoàn thành', type: 'date' as const },
];

const CHECKLIST_CONCLUSION: CostSummaryRow[] = []; // Placeholder — has_conclusion controls this

const COST_SUMMARY_ROWS: CostSummaryRow[] = [
    { label: 'Chi phí xây dựng', field_approved: 'xd_approved', field_submitted: 'xd_submitted', field_diff: 'xd_diff' },
    { label: 'Chi phí thiết bị', field_approved: 'tb_approved', field_submitted: 'tb_submitted', field_diff: 'tb_diff' },
    { label: 'Chi phí quản lý dự án', field_approved: 'qlda_approved', field_submitted: 'qlda_submitted', field_diff: 'qlda_diff' },
    { label: 'Chi phí tư vấn', field_approved: 'tv_approved', field_submitted: 'tv_submitted', field_diff: 'tv_diff' },
    { label: 'Chi phí khác', field_approved: 'other_approved', field_submitted: 'other_submitted', field_diff: 'other_diff' },
    { label: 'Chi phí dự phòng', field_approved: 'dp_approved', field_submitted: 'dp_submitted', field_diff: 'dp_diff' },
    { label: 'Tổng cộng', field_approved: 'total_approved', field_submitted: 'total_submitted', field_diff: 'total_diff' },
];

const REVISION_TABLE: FormTable = {
    columns: [
        { key: 'content', label: 'Nội dung cần chỉnh sửa/bổ sung', width: '30%' },
        { key: 'basis', label: 'Căn cứ/yêu cầu kỹ thuật', width: '25%' },
        { key: 'deadline', label: 'Thời hạn hoàn thành', width: '20%' },
        { key: 'documents', label: 'Tài liệu phải nộp lại', width: '25%' },
    ],
    defaultRows: 8,
};

const ACCEPTANCE_TABLE: FormTable = {
    columns: [
        { key: 'comment', label: 'Nội dung ý kiến', width: '25%' },
        { key: 'reviewer', label: 'Đơn vị/người góp ý', width: '20%' },
        { key: 'response', label: 'Nội dung tiếp thu/giải trình', width: '25%' },
        { key: 'revised_docs', label: 'Tài liệu/bản vẽ đã chỉnh sửa', width: '20%' },
        { key: 'closed', label: 'Đã đóng', width: '10%' },
    ],
    defaultRows: 12,
};

const HANDOVER_TABLE: FormTable = {
    columns: [
        { key: 'doc_name', label: 'Tên hồ sơ/tài liệu', width: '35%' },
        { key: 'paper_qty', label: 'Số lượng bản giấy', width: '20%' },
        { key: 'digital', label: 'File điện tử', width: '20%' },
        { key: 'received', label: 'Đã nhận', width: '10%' },
        { key: 'note', label: 'Ghi chú', width: '15%' },
    ],
    defaultRows: 10,
};

const PM_UPDATE_CHECKLIST: ChecklistItem[] = [
    { id: 'pm1', label: 'Thông tin dự án, hạng mục, gói thầu đã nhập đầy đủ' },
    { id: 'pm2', label: 'Cơ quan/cấp thẩm định, phê duyệt đã cập nhật đúng' },
    { id: 'pm3', label: 'File pháp lý đầu vào đã đính kèm' },
    { id: 'pm4', label: 'File khảo sát, thiết kế, dự toán đã đính kèm' },
    { id: 'pm5', label: 'File thẩm tra/thẩm định đã đính kèm' },
    { id: 'pm6', label: 'Tờ trình, quyết định phê duyệt đã đính kèm' },
    { id: 'pm7', label: 'Phiên bản hồ sơ phê duyệt đã được khóa' },
    { id: 'pm8', label: 'Hồ sơ bàn giao cho KHĐT/đơn vị liên quan đã cập nhật' },
    { id: 'pm9', label: 'Các cảnh báo tồn tại/vướng mắc đã đóng hoặc chuyển sang quy trình xử lý khác' },
    { id: 'pm10', label: 'Trạng thái quy trình đã chuyển sang Hoàn tất' },
];

// ============================================================
// TK1B — 12 BIỂU MẪU
// ============================================================

const BM_TK1B_01: DesignFormSchema = {
    code: 'BM-TK1B-01',
    title: 'PHIẾU RÀ SOÁT ĐIỀU KIỆN LẬP BÁO CÁO KINH TẾ - KỸ THUẬT',
    description: 'Dùng trước khi giao tư vấn lập BCKTKT, nhằm xác định đủ điều kiện pháp lý, quy hoạch, đất đai, môi trường, PCCC, tài sản công và nguồn vốn.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'decision_authority', label: 'Cơ quan/cấp quyết định đầu tư dự kiến' },
    ],
    checklist: [
        { id: 'c1', label: 'Đã có văn bản giao nhiệm vụ/chủ trương đầu tư/quyết định chuẩn bị dự án phù hợp' },
        { id: 'c2', label: 'Đã xác định đúng loại dự án, nhóm dự án, nguồn vốn, thẩm quyền quyết định đầu tư' },
        { id: 'c3', label: 'Đã xác định đúng số bước thiết kế và mã quy trình áp dụng' },
        { id: 'c4', label: 'Có thông tin quy hoạch được sử dụng làm căn cứ lập dự án' },
        { id: 'c5', label: 'Có thông tin địa điểm, ranh giới, diện tích sử dụng đất, hiện trạng mặt bằng' },
        { id: 'c6', label: 'Có phương án/đầu mối thực hiện GPMB, bồi thường, hỗ trợ, tái định cư nếu có' },
        { id: 'c7', label: 'Đã rà soát tài sản công/tài sản kết cấu hạ tầng/tài sản hiện hữu phải xử lý' },
        { id: 'c8', label: 'Đã xác định yêu cầu môi trường: ĐTM, giấy phép môi trường, đăng ký môi trường hoặc không thuộc đối tượng' },
        { id: 'c9', label: 'Đã xác định yêu cầu PCCC và cứu nạn, cứu hộ nếu có' },
        { id: 'c10', label: 'Đã xác định yêu cầu chuyên ngành: giao thông, thủy lợi, đê điều, điện, y tế, giáo dục, di sản, quốc phòng - an ninh nếu có' },
        { id: 'c11', label: 'Có nhiệm vụ khảo sát, nhiệm vụ thiết kế hoặc yêu cầu kỹ thuật đầu vào' },
        { id: 'c12', label: 'Có nguồn kinh phí cho công tác tư vấn, khảo sát, lập hồ sơ' },
        { id: 'c13', label: 'Có kế hoạch lựa chọn nhà thầu tư vấn hoặc căn cứ giao tư vấn hợp lệ' },
        { id: 'c14', label: 'Tư vấn dự kiến có năng lực phù hợp với loại, cấp công trình và phạm vi công việc' },
        { id: 'c15', label: 'Đã xác định thời hạn hoàn thành và người chịu trách nhiệm theo dõi trên phần mềm' },
        // ── Phụ lục A: Rà soát quy hoạch / GPMB / tài sản công (tích hợp Bước 3 cũ) ──
        { id: 'a1', label: '[Phụ lục A] Xác nhận phạm vi đất, ranh giới, diện tích theo bản đồ quy hoạch' },
        { id: 'a2', label: '[Phụ lục A] Xác nhận sự phù hợp với quy hoạch chung/chi tiết/phân khu được duyệt' },
        { id: 'a3', label: '[Phụ lục A] Xác định phạm vi thu hồi đất, hiện trạng mặt bằng, các công trình liền kề' },
        { id: 'a4', label: '[Phụ lục A] Đã rà soát tài sản công / kết cấu hạ tầng cần di dời, thanh lý, bàn giao' },
        { id: 'a5', label: '[Phụ lục A] Có phương án GPMB, bồi thường, hỗ trợ, tái định cư (nếu phát sinh)' },
        { id: 'a6', label: '[Phụ lục A] Đã mở nhánh xử lý tài sản công (điều chuyển/thanh lý/đấu giá) nếu có' },
        { id: 'a7', label: '[Phụ lục A] Phương án GPMB và tài sản công được tích hợp vào BCKTKT và dự toán' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK1B_02: DesignFormSchema = {
    code: 'BM-TK1B-02',
    title: 'PHIẾU GIAO NHIỆM VỤ TƯ VẤN LẬP BÁO CÁO KINH TẾ - KỸ THUẬT',
    header_fields: CONSULTANT_HEADER,
    table: {
        columns: [
            { key: 'task', label: 'Nội dung công việc', width: '35%' },
            { key: 'output', label: 'Sản phẩm phải nộp', width: '40%' },
            { key: 'deadline', label: 'Thời hạn/yêu cầu', width: '25%' },
        ],
        defaultRows: 5,
    },
    notes: 'Hồ sơ phải tuân thủ đúng nhiệm vụ thiết kế, quy chuẩn, tiêu chuẩn áp dụng, quy hoạch, chỉ tiêu sử dụng đất, yêu cầu môi trường, PCCC, an toàn công trình và yêu cầu chuyên ngành.',
    signature_blocks: ['officer', 'room_leader'],
};

const BM_TK1B_03: DesignFormSchema = {
    code: 'BM-TK1B-03',
    title: 'BẢNG KIỂM TRA HỒ SƠ BÁO CÁO KINH TẾ - KỸ THUẬT',
    description: 'Dùng để kiểm tra tổng thể phần thuyết minh và hồ sơ pháp lý của BCKTKT.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'consultant', label: 'Đơn vị lập BCKTKT' },
    ],
    checklist: [
        { id: 'c1', label: 'Hồ sơ lập đúng tên dự án, địa điểm, chủ đầu tư, nguồn vốn, thẩm quyền phê duyệt' },
        { id: 'c2', label: 'Căn cứ pháp lý đầy đủ, cập nhật, phù hợp loại dự án' },
        { id: 'c3', label: 'Sự cần thiết đầu tư, mục tiêu, quy mô, công suất được trình bày rõ' },
        { id: 'c4', label: 'Địa điểm xây dựng, diện tích sử dụng đất, hiện trạng và ranh giới dự án rõ ràng' },
        { id: 'c5', label: 'Sự phù hợp với quy hoạch được dùng làm căn cứ lập dự án được chứng minh' },
        { id: 'c6', label: 'Phương án GPMB, tái định cư, xử lý tài sản hiện hữu/tài sản công được nêu rõ' },
        { id: 'c7', label: 'Giải pháp thiết kế đáp ứng yêu cầu sử dụng, quy chuẩn, tiêu chuẩn áp dụng' },
        { id: 'c8', label: 'Giải pháp thi công phù hợp điều kiện mặt bằng, giao thông, thời tiết, tổ chức thi công' },
        { id: 'c9', label: 'Nội dung an toàn xây dựng, an toàn công trình lân cận được đề cập đầy đủ' },
        { id: 'c10', label: 'Nội dung PCCC được xác định đúng đối tượng, có giải pháp hoặc thủ tục kèm theo' },
        { id: 'c11', label: 'Nội dung môi trường được xác định đúng đối tượng và nêu rõ thủ tục phải thực hiện' },
        { id: 'c12', label: 'Nguồn vốn, thời gian xây dựng, hiệu quả đầu tư được thuyết minh rõ' },
        { id: 'c13', label: 'Chủ đầu tư và hình thức quản lý dự án phù hợp' },
        { id: 'c14', label: 'Tổng mức đầu tư/dự toán phù hợp quy mô và khả năng cân đối vốn' },
        { id: 'c15', label: 'Hồ sơ có đầy đủ phụ lục: bản vẽ, dự toán, khảo sát, văn bản pháp lý, ảnh hiện trạng' },
        { id: 'c16', label: 'Các nội dung thuộc ý kiến sở ngành/địa phương/chuyên ngành đã được cập nhật' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK1B_04: DesignFormSchema = {
    code: 'BM-TK1B-04',
    title: 'BẢNG KIỂM TRA THIẾT KẾ BẢN VẼ THI CÔNG TRONG BCKTKT',
    description: 'Dùng để kiểm tra phần TKBVTC nằm trong hồ sơ Báo cáo kinh tế - kỹ thuật.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'designer', label: 'Đơn vị thiết kế' },
    ],
    checklist: [
        { id: 'c1', label: 'Bản vẽ lập đúng tên dự án, hạng mục, ký hiệu, ngày tháng, phiên bản' },
        { id: 'c2', label: 'Bản vẽ có đầy đủ chữ ký chủ trì, chủ nhiệm, kiểm tra, pháp nhân tư vấn' },
        { id: 'c3', label: 'Thiết kế phù hợp nhiệm vụ thiết kế và kết quả khảo sát được nghiệm thu/phê duyệt' },
        { id: 'c4', label: 'Thiết kế phù hợp quy hoạch, chỉ giới, cao độ, điểm đấu nối và điều kiện hiện trạng' },
        { id: 'c5', label: 'Giải pháp kiến trúc/kết cấu/hạ tầng/kỹ thuật phù hợp mục tiêu, quy mô dự án' },
        { id: 'c6', label: 'Thiết kế tuân thủ quy chuẩn kỹ thuật, tiêu chuẩn áp dụng và quy định chuyên ngành' },
        { id: 'c7', label: 'Có thuyết minh tính toán chính đối với hạng mục kết cấu/kỹ thuật quan trọng' },
        { id: 'c8', label: 'Bảo đảm an toàn chịu lực, ổn định công trình và an toàn công trình lân cận' },
        { id: 'c9', label: 'Bảo đảm yêu cầu PCCC, thoát nạn, cấp nước chữa cháy, tiếp cận xe chữa cháy nếu có' },
        { id: 'c10', label: 'Bảo đảm yêu cầu bảo vệ môi trường, thoát nước, xử lý chất thải, hạn chế bụi, ồn trong thi công' },
        { id: 'c11', label: 'Bảo đảm yêu cầu sử dụng, vận hành, bảo trì, tiếp cận, an toàn người sử dụng' },
        { id: 'c12', label: 'Chi tiết cấu tạo đủ rõ để thi công, nghiệm thu và lập dự toán' },
        { id: 'c13', label: 'Không có mâu thuẫn giữa mặt bằng, mặt cắt, chi tiết, thống kê vật liệu và thuyết minh' },
        { id: 'c14', label: 'Các điểm đấu nối hạ tầng kỹ thuật đã được kiểm tra và có căn cứ chấp thuận nếu cần' },
        { id: 'c15', label: 'Có biện pháp tổ chức thi công sơ bộ/phương án đảm bảo giao thông, an toàn nếu cần' },
        { id: 'c16', label: 'Danh mục bản vẽ đầy đủ, đánh số, ký hiệu, sắp xếp hợp lý' },
        { id: 'c17', label: 'File CAD/PDF thống nhất với bản giấy và bản dự toán' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK1B_05: DesignFormSchema = {
    code: 'BM-TK1B-05',
    title: 'BẢNG KIỂM TRA DỰ TOÁN/TỔNG MỨC ĐẦU TƯ TRONG BCKTKT',
    description: 'Dùng để kiểm tra dự toán/tổng mức đầu tư trong Báo cáo kinh tế - kỹ thuật.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'estimator', label: 'Đơn vị lập dự toán' },
    ],
    checklist: [
        { id: 'c1', label: 'Dự toán lập đúng tên dự án, hạng mục, địa điểm' },
        { id: 'c2', label: 'Khối lượng dự toán phù hợp bản vẽ thiết kế' },
        { id: 'c3', label: 'Không tính trùng, thiếu hoặc sai khối lượng chủ yếu' },
        { id: 'c4', label: 'Định mức áp dụng phù hợp tính chất công việc' },
        { id: 'c5', label: 'Đơn giá nhân công, ca máy, vật liệu phù hợp thời điểm lập' },
        { id: 'c6', label: 'Giá vật liệu có căn cứ: công bố giá, báo giá, khảo sát giá nếu cần' },
        { id: 'c7', label: 'Chi phí xây dựng tính đúng thành phần chi phí' },
        { id: 'c8', label: 'Chi phí thiết bị, nếu có, được tính đúng và có căn cứ' },
        { id: 'c9', label: 'Chi phí quản lý dự án, tư vấn, chi phí khác được tính phù hợp' },
        { id: 'c10', label: 'Chi phí dự phòng được xác định đúng quy định' },
        { id: 'c11', label: 'Thuế VAT và các khoản thuế, phí liên quan tính đúng' },
        { id: 'c12', label: 'Dự toán không vượt tổng mức đầu tư/cơ cấu chi phí được duyệt' },
        { id: 'c13', label: 'Bảng tổng hợp kinh phí thống nhất với dự toán chi tiết' },
        { id: 'c14', label: 'File Excel dự toán có công thức rõ, không lỗi liên kết' },
    ],
    has_conclusion: true,
    cost_summary: COST_SUMMARY_ROWS,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK1B_06: DesignFormSchema = {
    code: 'BM-TK1B-06',
    title: 'VĂN BẢN YÊU CẦU TƯ VẤN CHỈNH SỬA, BỔ SUNG HỒ SƠ BCKTKT',
    header_fields: [
        { key: 'to_consultant', label: 'Kính gửi' },
        { key: 'project_name', label: 'Dự án' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    table: REVISION_TABLE,
    notes: 'Đề nghị đơn vị tư vấn chịu trách nhiệm về chất lượng hồ sơ sau chỉnh sửa; đồng thời gửi kèm bảng tổng hợp tiếp thu, giải trình từng nội dung để Phòng QLDA2 có cơ sở kiểm tra, chuyển bước thẩm tra/thẩm định/phê duyệt.',
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK1B_07: DesignFormSchema = {
    code: 'BM-TK1B-07',
    title: 'BẢNG TỔNG HỢP TIẾP THU, GIẢI TRÌNH Ý KIẾN ĐỐI VỚI HỒ SƠ BCKTKT',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'consultant', label: 'Đơn vị tư vấn' },
        { key: 'comment_source', label: 'Nguồn ý kiến góp ý/thẩm tra/thẩm định' },
    ],
    table: ACCEPTANCE_TABLE,
    notes: 'Kết luận chung: Đã tiếp thu đầy đủ / Còn nội dung cần xin ý kiến / Chưa đủ điều kiện chuyển bước',
    signature_blocks: ['consultant', 'qlda'],
};

const BM_TK1B_08: DesignFormSchema = {
    code: 'BM-TK1B-08',
    title: 'TỜ TRÌNH THẨM ĐỊNH BCKTKT',
    description: 'Tờ trình V/v thẩm định Báo cáo kinh tế - kỹ thuật',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (Cơ quan/bộ phận được giao thẩm định)' },
        { key: 'project_name', label: 'Tên dự án' },
        { key: 'location', label: 'Địa điểm xây dựng' },
        { key: 'owner', label: 'Chủ đầu tư/Ban QLDA' },
        { key: 'objective', label: 'Mục tiêu, quy mô đầu tư' },
        { key: 'capital_time', label: 'Nguồn vốn và thời gian thực hiện' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    notes: 'Đề nghị thẩm định các nội dung theo Điều 26 Luật Xây dựng số 135/2025/QH15 và quy định phân cấp/giao nhiệm vụ của người quyết định đầu tư.',
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK1B_09: DesignFormSchema = {
    code: 'BM-TK1B-09',
    title: 'TỜ TRÌNH PHÊ DUYỆT BCKTKT',
    description: 'Tờ trình V/v phê duyệt Báo cáo kinh tế - kỹ thuật',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (UBND tỉnh/Cấp có thẩm quyền phê duyệt)' },
        { key: 'project_name', label: 'Tên dự án' },
        { key: 'location', label: 'Địa điểm' },
        { key: 'owner', label: 'Chủ đầu tư' },
        { key: 'objectives', label: 'Mục tiêu, quy mô, giải pháp thiết kế chủ yếu' },
        { key: 'total_investment', label: 'Tổng mức đầu tư, cơ cấu chi phí, nguồn vốn', type: 'number' },
        { key: 'timeline', label: 'Thời gian thực hiện' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK1B_10: DesignFormSchema = {
    code: 'BM-TK1B-10',
    title: 'DỰ THẢO QUYẾT ĐỊNH PHÊ DUYỆT BCKTKT',
    description: 'Dự thảo Quyết định Về việc phê duyệt Báo cáo kinh tế - kỹ thuật',
    header_fields: [
        { key: 'project_name', label: 'Tên dự án' },
        { key: 'decision_basis', label: 'Căn cứ (QĐ chủ trương, văn bản thẩm định...)' },
        { key: 'approved_content', label: 'Nội dung phê duyệt chủ yếu (mô tả)' },
        { key: 'date', label: 'Ngày ký', type: 'date' },
    ],
    notes: 'Điều 1: Phê duyệt ... Điều 2: Trách nhiệm thực hiện. Điều 3: Hiệu lực.',
    signature_blocks: ['director'],
};

const BM_TK1B_11: DesignFormSchema = {
    code: 'BM-TK1B-11',
    title: 'PHIẾU BÀN GIAO HỒ SƠ SAU PHÊ DUYỆT BCKTKT',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'receiver', label: 'Đơn vị nhận bàn giao' },
        { key: 'purpose', label: 'Mục đích bàn giao' },
    ],
    table: HANDOVER_TABLE,
    notes: 'Bên giao và bên nhận xác nhận hồ sơ nêu trên được bàn giao để tiếp tục thực hiện các bước lựa chọn nhà thầu/thi công/giám sát/lưu trữ.',
    signature_blocks: ['issuer', 'receiver'],
};

const BM_TK1B_12: DesignFormSchema = {
    code: 'BM-TK1B-12',
    title: 'PHIẾU CẬP NHẬT HỒ SƠ BCKTKT LÊN PHẦN MỀM QUẢN LÝ DỰ ÁN',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'workflow_code', label: 'Mã quy trình trên phần mềm' },
        { key: 'updater', label: 'Người cập nhật' },
        { key: 'update_time', label: 'Thời điểm cập nhật', type: 'date' },
    ],
    checklist: PM_UPDATE_CHECKLIST,
    signature_blocks: ['updater', 'room_leader'],
};

// ============================================================
// TK2B — 11 BIỂU MẪU (tái sử dụng cấu trúc TK1B)
// ============================================================

const BM_TK2B_01: DesignFormSchema = {
    code: 'BM-TK2B-01',
    title: 'PHIẾU RÀ SOÁT ĐIỀU KIỆN LẬP TKBVTC VÀ DỰ TOÁN',
    description: 'Dùng trước khi triển khai thiết kế xây dựng sau khi dự án đã được phê duyệt.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'approval_decision', label: 'Số quyết định phê duyệt dự án' },
        { key: 'total_investment', label: 'Giá trị tổng mức đầu tư được duyệt', type: 'number' },
    ],
    checklist: [
        { id: 'c1', label: 'Đã có văn bản giao nhiệm vụ/chủ trương đầu tư/quyết định chuẩn bị dự án phù hợp' },
        { id: 'c2', label: 'Đã xác định đúng loại dự án, nhóm dự án, nguồn vốn, thẩm quyền quyết định đầu tư' },
        { id: 'c3', label: 'Đã xác định đúng số bước thiết kế và mã quy trình áp dụng' },
        { id: 'c4', label: 'Có thông tin quy hoạch được sử dụng làm căn cứ lập dự án' },
        { id: 'c5', label: 'Có thông tin địa điểm, ranh giới, diện tích sử dụng đất, hiện trạng mặt bằng' },
        { id: 'c6', label: 'Có phương án/đầu mối thực hiện GPMB, bồi thường, hỗ trợ, tái định cư nếu có' },
        { id: 'c7', label: 'Đã rà soát tài sản công/tài sản kết cấu hạ tầng/tài sản hiện hữu phải xử lý' },
        { id: 'c8', label: 'Đã xác định yêu cầu môi trường: ĐTM, giấy phép môi trường, đăng ký môi trường hoặc không thuộc đối tượng' },
        { id: 'c9', label: 'Đã xác định yêu cầu PCCC và cứu nạn, cứu hộ nếu có' },
        { id: 'c10', label: 'Đã xác định yêu cầu chuyên ngành: giao thông, thủy lợi, đê điều, điện, y tế, giáo dục, di sản, quốc phòng - an ninh nếu có' },
        { id: 'c11', label: 'Có nhiệm vụ khảo sát, nhiệm vụ thiết kế hoặc yêu cầu kỹ thuật đầu vào' },
        { id: 'c12', label: 'Có nguồn kinh phí cho công tác tư vấn, khảo sát, lập hồ sơ' },
        { id: 'c13', label: 'Có kế hoạch lựa chọn nhà thầu tư vấn hoặc căn cứ giao tư vấn hợp lệ' },
        { id: 'c14', label: 'Tư vấn dự kiến có năng lực phù hợp với loại, cấp công trình và phạm vi công việc' },
        { id: 'c15', label: 'Đã xác định thời hạn hoàn thành và người chịu trách nhiệm theo dõi trên phần mềm' },
        { id: 'c16', label: 'Đã có quyết định phê duyệt dự án/BCNCKT và thiết kế cơ sở' },
        { id: 'c17', label: 'Đã xác định phạm vi TKBVTC&DT theo từng hạng mục/gói thầu' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK2B_02: DesignFormSchema = {
    code: 'BM-TK2B-02',
    title: 'PHIẾU GIAO NHIỆM VỤ TƯ VẤN LẬP TKBVTC VÀ DỰ TOÁN',
    header_fields: CONSULTANT_HEADER,
    table: {
        columns: [
            { key: 'task', label: 'Nội dung công việc', width: '35%' },
            { key: 'output', label: 'Sản phẩm phải nộp', width: '40%' },
            { key: 'deadline', label: 'Thời hạn/yêu cầu', width: '25%' },
        ],
        defaultRows: 4,
    },
    signature_blocks: ['officer', 'room_leader'],
};

const BM_TK2B_03: DesignFormSchema = {
    code: 'BM-TK2B-03',
    title: 'BẢNG KIỂM TRA HỒ SƠ THIẾT KẾ BẢN VẼ THI CÔNG',
    description: 'Dùng để kiểm tra TKBVTC của dự án thiết kế 2 bước.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'designer', label: 'Đơn vị thiết kế' },
    ],
    checklist: [
        { id: 'c1', label: 'Bản vẽ lập đúng tên dự án, hạng mục, ký hiệu, ngày tháng, phiên bản' },
        { id: 'c2', label: 'Bản vẽ có đầy đủ chữ ký chủ trì, chủ nhiệm, kiểm tra, pháp nhân tư vấn' },
        { id: 'c3', label: 'Thiết kế phù hợp nhiệm vụ thiết kế và kết quả khảo sát được nghiệm thu/phê duyệt' },
        { id: 'c4', label: 'Thiết kế phù hợp quy hoạch, chỉ giới, cao độ, điểm đấu nối và điều kiện hiện trạng' },
        { id: 'c5', label: 'Giải pháp kiến trúc/kết cấu/hạ tầng/kỹ thuật phù hợp mục tiêu, quy mô dự án' },
        { id: 'c6', label: 'Thiết kế tuân thủ quy chuẩn kỹ thuật, tiêu chuẩn áp dụng và quy định chuyên ngành' },
        { id: 'c7', label: 'Có thuyết minh tính toán chính đối với hạng mục kết cấu/kỹ thuật quan trọng' },
        { id: 'c8', label: 'Bảo đảm an toàn chịu lực, ổn định công trình và an toàn công trình lân cận' },
        { id: 'c9', label: 'Bảo đảm yêu cầu PCCC, thoát nạn, cấp nước chữa cháy, tiếp cận xe chữa cháy nếu có' },
        { id: 'c10', label: 'Bảo đảm yêu cầu bảo vệ môi trường, thoát nước, xử lý chất thải, hạn chế bụi, ồn trong thi công' },
        { id: 'c11', label: 'Bảo đảm yêu cầu sử dụng, vận hành, bảo trì, tiếp cận, an toàn người sử dụng' },
        { id: 'c12', label: 'Chi tiết cấu tạo đủ rõ để thi công, nghiệm thu và lập dự toán' },
        { id: 'c13', label: 'Không có mâu thuẫn giữa mặt bằng, mặt cắt, chi tiết, thống kê vật liệu và thuyết minh' },
        { id: 'c14', label: 'Các điểm đấu nối hạ tầng kỹ thuật đã được kiểm tra và có căn cứ chấp thuận nếu cần' },
        { id: 'c15', label: 'Có biện pháp tổ chức thi công sơ bộ/phương án đảm bảo giao thông, an toàn nếu cần' },
        { id: 'c16', label: 'Danh mục bản vẽ đầy đủ, đánh số, ký hiệu, sắp xếp hợp lý' },
        { id: 'c17', label: 'File CAD/PDF thống nhất với bản giấy và bản dự toán' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK2B_04: DesignFormSchema = {
    code: 'BM-TK2B-04',
    title: 'BẢNG KIỂM TRA DỰ TOÁN XÂY DỰNG CÔNG TRÌNH',
    description: 'Dùng để kiểm tra dự toán xây dựng công trình/gói thầu theo TKBVTC.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'estimator', label: 'Đơn vị lập dự toán' },
    ],
    checklist: [
        { id: 'c1', label: 'Dự toán lập đúng tên dự án, hạng mục, địa điểm' },
        { id: 'c2', label: 'Khối lượng dự toán phù hợp bản vẽ thiết kế' },
        { id: 'c3', label: 'Không tính trùng, thiếu hoặc sai khối lượng chủ yếu' },
        { id: 'c4', label: 'Định mức áp dụng phù hợp tính chất công việc' },
        { id: 'c5', label: 'Đơn giá nhân công, ca máy, vật liệu phù hợp thời điểm lập' },
        { id: 'c6', label: 'Giá vật liệu có căn cứ: công bố giá, báo giá, khảo sát giá nếu cần' },
        { id: 'c7', label: 'Chi phí xây dựng tính đúng thành phần chi phí' },
        { id: 'c8', label: 'Chi phí thiết bị, nếu có, được tính đúng và có căn cứ' },
        { id: 'c9', label: 'Chi phí quản lý dự án, tư vấn, chi phí khác được tính phù hợp' },
        { id: 'c10', label: 'Chi phí dự phòng được xác định đúng quy định' },
        { id: 'c11', label: 'Thuế VAT và các khoản thuế, phí liên quan tính đúng' },
        { id: 'c12', label: 'Dự toán không vượt tổng mức đầu tư/cơ cấu chi phí được duyệt' },
        { id: 'c13', label: 'Bảng tổng hợp kinh phí thống nhất với dự toán chi tiết' },
        { id: 'c14', label: 'File Excel dự toán có công thức rõ, không lỗi liên kết' },
    ],
    has_conclusion: true,
    cost_summary: COST_SUMMARY_ROWS,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK2B_05: DesignFormSchema = {
    code: 'BM-TK2B-05',
    title: 'VĂN BẢN YÊU CẦU TƯ VẤN CHỈNH SỬA, BỔ SUNG HỒ SƠ TKBVTC&DT',
    header_fields: [
        { key: 'to_consultant', label: 'Kính gửi' },
        { key: 'project_name', label: 'Dự án' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    table: REVISION_TABLE,
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK2B_06: DesignFormSchema = {
    code: 'BM-TK2B-06',
    title: 'BẢNG TỔNG HỢP TIẾP THU, GIẢI TRÌNH Ý KIẾN ĐỐI VỚI HỒ SƠ TKBVTC&DT',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'consultant', label: 'Đơn vị tư vấn' },
        { key: 'comment_source', label: 'Nguồn ý kiến góp ý/thẩm tra/thẩm định' },
    ],
    table: ACCEPTANCE_TABLE,
    notes: 'Kết luận chung: Đã tiếp thu đầy đủ / Còn nội dung cần xin ý kiến / Chưa đủ điều kiện chuyển bước',
    signature_blocks: ['consultant', 'qlda'],
};

const BM_TK2B_07: DesignFormSchema = {
    code: 'BM-TK2B-07',
    title: 'TỜ TRÌNH THẨM ĐỊNH/KIỂM SOÁT TKBVTC&DT',
    description: 'Tờ trình V/v thẩm định, kiểm soát thiết kế bản vẽ thi công và dự toán',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (Phòng Kỹ thuật - Thẩm định/Lãnh đạo Ban)' },
        { key: 'project_name', label: 'Tên dự án/hạng mục' },
        { key: 'approval_basis', label: 'Căn cứ phê duyệt dự án' },
        { key: 'designer', label: 'Đơn vị lập thiết kế, dự toán' },
        { key: 'submitted_value', label: 'Giá trị dự toán trình', type: 'number' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    notes: 'Đề nghị xem xét các nội dung theo Điều 30 Luật Xây dựng số 135/2025/QH15.',
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK2B_08: DesignFormSchema = {
    code: 'BM-TK2B-08',
    title: 'TỜ TRÌNH PHÊ DUYỆT TKBVTC&DT',
    description: 'Tờ trình V/v phê duyệt thiết kế bản vẽ thi công và dự toán xây dựng công trình',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (Giám đốc Ban QLDA/Cấp được ủy quyền)' },
        { key: 'project_name', label: 'Tên công trình/hạng mục' },
        { key: 'design_solution', label: 'Quy mô, giải pháp thiết kế chủ yếu' },
        { key: 'estimate_value', label: 'Giá trị dự toán, cơ cấu chi phí, nguồn vốn', type: 'number' },
        { key: 'drawing_list', label: 'Danh mục bản vẽ, tài liệu kèm theo' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK2B_09: DesignFormSchema = {
    code: 'BM-TK2B-09',
    title: 'DỰ THẢO QUYẾT ĐỊNH PHÊ DUYỆT TKBVTC&DT',
    description: 'Dự thảo Quyết định Về việc phê duyệt thiết kế bản vẽ thi công và dự toán',
    header_fields: [
        { key: 'project_name', label: 'Tên dự án' },
        { key: 'approved_content', label: 'Nội dung phê duyệt chủ yếu' },
        { key: 'date', label: 'Ngày ký', type: 'date' },
    ],
    signature_blocks: ['director'],
};

const BM_TK2B_10: DesignFormSchema = {
    code: 'BM-TK2B-10',
    title: 'PHIẾU BÀN GIAO HỒ SƠ TKBVTC&DT SAU PHÊ DUYỆT',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'receiver', label: 'Đơn vị nhận bàn giao' },
        { key: 'purpose', label: 'Mục đích bàn giao' },
    ],
    table: HANDOVER_TABLE,
    signature_blocks: ['issuer', 'receiver'],
};

const BM_TK2B_11: DesignFormSchema = {
    code: 'BM-TK2B-11',
    title: 'PHIẾU CẬP NHẬT HỒ SƠ TKBVTC&DT LÊN PHẦN MỀM QUẢN LÝ DỰ ÁN',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'workflow_code', label: 'Mã quy trình trên phần mềm' },
        { key: 'updater', label: 'Người cập nhật' },
        { key: 'update_time', label: 'Thời điểm cập nhật', type: 'date' },
    ],
    checklist: PM_UPDATE_CHECKLIST,
    signature_blocks: ['updater', 'room_leader'],
};

// ============================================================
// TK3B — 13 BIỂU MẪU (TKKT + TKBVTC)
// ============================================================

const BM_TK3B_01: DesignFormSchema = {
    code: 'BM-TK3B-01',
    title: 'PHIẾU RÀ SOÁT ĐIỀU KIỆN LẬP THIẾT KẾ KỸ THUẬT',
    description: 'Dùng trước khi triển khai bước thiết kế kỹ thuật của dự án thiết kế 3 bước.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'approval_decision', label: 'Số quyết định phê duyệt dự án' },
        { key: 'tkkt_scope', label: 'Phạm vi TKKT' },
    ],
    checklist: [
        { id: 'c1', label: 'Đã có văn bản giao nhiệm vụ/chủ trương đầu tư/quyết định chuẩn bị dự án phù hợp' },
        { id: 'c2', label: 'Đã xác định đúng loại dự án, nhóm dự án, nguồn vốn, thẩm quyền quyết định đầu tư' },
        { id: 'c3', label: 'Đã xác định đúng số bước thiết kế và mã quy trình áp dụng' },
        { id: 'c4', label: 'Có thông tin quy hoạch được sử dụng làm căn cứ lập dự án' },
        { id: 'c5', label: 'Có thông tin địa điểm, ranh giới, diện tích sử dụng đất, hiện trạng mặt bằng' },
        { id: 'c6', label: 'Có phương án/đầu mối thực hiện GPMB, bồi thường, hỗ trợ, tái định cư nếu có' },
        { id: 'c7', label: 'Đã rà soát tài sản công/tài sản kết cấu hạ tầng/tài sản hiện hữu phải xử lý' },
        { id: 'c8', label: 'Đã xác định yêu cầu môi trường: ĐTM, giấy phép môi trường, đăng ký môi trường hoặc không thuộc đối tượng' },
        { id: 'c9', label: 'Đã xác định yêu cầu PCCC và cứu nạn, cứu hộ nếu có' },
        { id: 'c10', label: 'Đã xác định yêu cầu chuyên ngành: giao thông, thủy lợi, đê điều, điện, y tế, giáo dục, di sản, quốc phòng - an ninh nếu có' },
        { id: 'c11', label: 'Có nhiệm vụ khảo sát, nhiệm vụ thiết kế hoặc yêu cầu kỹ thuật đầu vào' },
        { id: 'c12', label: 'Có nguồn kinh phí cho công tác tư vấn, khảo sát, lập hồ sơ' },
        { id: 'c13', label: 'Có kế hoạch lựa chọn nhà thầu tư vấn hoặc căn cứ giao tư vấn hợp lệ' },
        { id: 'c14', label: 'Tư vấn dự kiến có năng lực phù hợp với loại, cấp công trình và phạm vi công việc' },
        { id: 'c15', label: 'Đã xác định thời hạn hoàn thành và người chịu trách nhiệm theo dõi trên phần mềm' },
        { id: 'c16', label: 'Đã xác định dự án áp dụng thiết kế 3 bước' },
        { id: 'c17', label: 'Đã có thiết kế cơ sở và quyết định phê duyệt dự án' },
        { id: 'c18', label: 'Đã xác định hạng mục, phạm vi lập TKKT và dự toán theo TKKT' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK3B_02: DesignFormSchema = {
    code: 'BM-TK3B-02',
    title: 'PHIẾU GIAO NHIỆM VỤ TƯ VẤN LẬP THIẾT KẾ KỸ THUẬT',
    header_fields: CONSULTANT_HEADER,
    table: {
        columns: [
            { key: 'task', label: 'Nội dung công việc', width: '35%' },
            { key: 'output', label: 'Sản phẩm phải nộp', width: '40%' },
            { key: 'deadline', label: 'Thời hạn/yêu cầu', width: '25%' },
        ],
        defaultRows: 4,
    },
    signature_blocks: ['officer', 'room_leader'],
};

const BM_TK3B_03: DesignFormSchema = {
    code: 'BM-TK3B-03',
    title: 'BẢNG KIỂM TRA HỒ SƠ THIẾT KẾ KỸ THUẬT',
    description: 'Dùng để kiểm tra thuyết minh, tính toán và bản vẽ TKKT.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'designer', label: 'Đơn vị thiết kế' },
    ],
    checklist: [
        { id: 'c1', label: 'Hồ sơ TKKT lập đúng tên dự án, hạng mục, ký hiệu, phiên bản, ngày tháng' },
        { id: 'c2', label: 'Thuyết minh TKKT đầy đủ nội dung: cơ sở pháp lý, giải pháp kỹ thuật, tính toán, vật liệu' },
        { id: 'c3', label: 'TKKT cụ thể hóa và phù hợp với TKCS trong BCNCKT được phê duyệt' },
        { id: 'c4', label: 'Các tính toán kỹ thuật chính (kết cấu, nền móng, hệ thống kỹ thuật) đầy đủ và hợp lý' },
        { id: 'c5', label: 'Bản vẽ TKKT đầy đủ chữ ký chủ trì, chủ nhiệm, kiểm tra, pháp nhân tư vấn' },
        { id: 'c6', label: 'TKKT tuân thủ quy chuẩn kỹ thuật quốc gia, tiêu chuẩn áp dụng' },
        { id: 'c7', label: 'Bảo đảm an toàn chịu lực, ổn định công trình, an toàn công trình lân cận' },
        { id: 'c8', label: 'Bảo đảm yêu cầu PCCC, thoát nạn, an toàn người sử dụng' },
        { id: 'c9', label: 'Bảo đảm yêu cầu bảo vệ môi trường trong thi công và vận hành' },
        { id: 'c10', label: 'TKKT phù hợp điều kiện địa hình, địa chất, thủy văn khu vực dự án' },
        { id: 'c11', label: 'Giải pháp thi công sơ bộ phù hợp điều kiện thực tế và phạm vi dự án' },
        { id: 'c12', label: 'Danh mục bản vẽ đầy đủ, đánh số, sắp xếp hợp lý' },
        { id: 'c13', label: 'Không có mâu thuẫn nội bộ giữa thuyết minh, tính toán và bản vẽ' },
        { id: 'c14', label: 'File PDF/CAD thống nhất với bản giấy' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK3B_04: DesignFormSchema = {
    code: 'BM-TK3B-04',
    title: 'BẢNG KIỂM TRA DỰ TOÁN THEO THIẾT KẾ KỸ THUẬT',
    description: 'Dùng để kiểm tra dự toán được lập theo TKKT.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'estimator', label: 'Đơn vị lập dự toán' },
    ],
    checklist: [
        { id: 'c1', label: 'Dự toán lập đúng tên dự án, hạng mục, địa điểm' },
        { id: 'c2', label: 'Khối lượng dự toán phù hợp bản vẽ TKKT' },
        { id: 'c3', label: 'Không tính trùng, thiếu hoặc sai khối lượng chủ yếu' },
        { id: 'c4', label: 'Định mức áp dụng phù hợp tính chất công việc' },
        { id: 'c5', label: 'Đơn giá nhân công, ca máy, vật liệu phù hợp thời điểm lập' },
        { id: 'c6', label: 'Giá vật liệu có căn cứ: công bố giá, báo giá, khảo sát giá nếu cần' },
        { id: 'c7', label: 'Chi phí xây dựng tính đúng thành phần chi phí' },
        { id: 'c8', label: 'Chi phí thiết bị, nếu có, được tính đúng và có căn cứ' },
        { id: 'c9', label: 'Chi phí dự phòng được xác định đúng quy định' },
        { id: 'c10', label: 'Thuế VAT và các khoản thuế, phí liên quan tính đúng' },
        { id: 'c11', label: 'Dự toán đối chiếu được với tổng mức đầu tư/cơ cấu chi phí dự án được duyệt' },
        { id: 'c12', label: 'File Excel dự toán có công thức rõ, không lỗi liên kết' },
    ],
    has_conclusion: true,
    cost_summary: COST_SUMMARY_ROWS,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK3B_05: DesignFormSchema = {
    code: 'BM-TK3B-05',
    title: 'VĂN BẢN YÊU CẦU TƯ VẤN CHỈNH SỬA, BỔ SUNG HỒ SƠ TKKT&DT',
    header_fields: [
        { key: 'to_consultant', label: 'Kính gửi' },
        { key: 'project_name', label: 'Dự án' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    table: REVISION_TABLE,
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK3B_06: DesignFormSchema = {
    code: 'BM-TK3B-06',
    title: 'BẢNG TỔNG HỢP TIẾP THU, GIẢI TRÌNH Ý KIẾN ĐỐI VỚI HỒ SƠ TKKT&DT',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'consultant', label: 'Đơn vị tư vấn' },
        { key: 'comment_source', label: 'Nguồn ý kiến góp ý/thẩm tra/thẩm định' },
    ],
    table: ACCEPTANCE_TABLE,
    signature_blocks: ['consultant', 'qlda'],
};

const BM_TK3B_07: DesignFormSchema = {
    code: 'BM-TK3B-07',
    title: 'TỜ TRÌNH THẨM ĐỊNH/KIỂM SOÁT TKKT&DT',
    description: 'Tờ trình V/v thẩm định, kiểm soát thiết kế kỹ thuật và dự toán',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (Phòng Kỹ thuật - Thẩm định/Lãnh đạo Ban)' },
        { key: 'project_name', label: 'Tên dự án/hạng mục' },
        { key: 'approval_basis', label: 'Căn cứ phê duyệt dự án' },
        { key: 'designer', label: 'Đơn vị lập thiết kế, dự toán' },
        { key: 'submitted_value', label: 'Giá trị dự toán trình', type: 'number' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK3B_08: DesignFormSchema = {
    code: 'BM-TK3B-08',
    title: 'TỜ TRÌNH PHÊ DUYỆT TKKT&DT',
    header_fields: [
        { key: 'to_authority', label: 'Kính gửi (Giám đốc Ban QLDA/Cấp được ủy quyền)' },
        { key: 'project_name', label: 'Tên công trình/hạng mục' },
        { key: 'design_solution', label: 'Quy mô, giải pháp kỹ thuật chủ yếu' },
        { key: 'estimate_value', label: 'Giá trị dự toán, cơ cấu chi phí', type: 'number' },
        { key: 'date', label: 'Ngày', type: 'date' },
    ],
    signature_blocks: ['drafter', 'room_leader'],
};

const BM_TK3B_09: DesignFormSchema = {
    code: 'BM-TK3B-09',
    title: 'DỰ THẢO QUYẾT ĐỊNH PHÊ DUYỆT TKKT&DT',
    header_fields: [
        { key: 'project_name', label: 'Tên dự án' },
        { key: 'approved_content', label: 'Nội dung phê duyệt chủ yếu' },
        { key: 'date', label: 'Ngày ký', type: 'date' },
    ],
    signature_blocks: ['director'],
};

const BM_TK3B_10: DesignFormSchema = {
    code: 'BM-TK3B-10',
    title: 'PHIẾU GIAO NHIỆM VỤ LẬP TKBVTC THEO TKKT',
    description: 'Phiếu giao nhiệm vụ lập TKBVTC sau khi TKKT&DT được phê duyệt.',
    header_fields: CONSULTANT_HEADER,
    table: {
        columns: [
            { key: 'task', label: 'Nội dung công việc', width: '35%' },
            { key: 'output', label: 'Sản phẩm phải nộp', width: '40%' },
            { key: 'deadline', label: 'Thời hạn/yêu cầu', width: '25%' },
        ],
        defaultRows: 3,
    },
    notes: 'Nhiệm vụ phải bám sát TKKT đã phê duyệt.',
    signature_blocks: ['officer', 'room_leader'],
};

const BM_TK3B_11: DesignFormSchema = {
    code: 'BM-TK3B-11',
    title: 'BẢNG KIỂM TRA TKBVTC THEO THIẾT KẾ KỸ THUẬT',
    description: 'Dùng để kiểm tra TKBVTC đối chiếu với TKKT được phê duyệt.',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'designer', label: 'Đơn vị thiết kế' },
        { key: 'tkkt_decision', label: 'Số QĐ phê duyệt TKKT' },
    ],
    checklist: [
        { id: 'c1', label: 'Bản vẽ lập đúng tên dự án, hạng mục, ký hiệu, ngày tháng, phiên bản' },
        { id: 'c2', label: 'Bản vẽ có đầy đủ chữ ký chủ trì, chủ nhiệm, kiểm tra, pháp nhân tư vấn' },
        { id: 'c3', label: 'TKBVTC phù hợp và chi tiết hóa đúng TKKT được phê duyệt, không thay đổi giải pháp kỹ thuật chính' },
        { id: 'c4', label: 'Chi tiết cấu tạo đủ rõ để thi công, nghiệm thu và lập dự toán hạng mục' },
        { id: 'c5', label: 'Không có mâu thuẫn giữa mặt bằng, mặt cắt, chi tiết và thuyết minh' },
        { id: 'c6', label: 'Thống nhất với các tính toán trong TKKT về kích thước, vật liệu, kết cấu' },
        { id: 'c7', label: 'Bảo đảm an toàn chịu lực, ổn định công trình và an toàn công trình lân cận' },
        { id: 'c8', label: 'Bảo đảm yêu cầu PCCC, thoát nạn theo TKKT và quy chuẩn' },
        { id: 'c9', label: 'Danh mục bản vẽ đầy đủ, đánh số, ký hiệu, sắp xếp hợp lý' },
        { id: 'c10', label: 'File CAD/PDF thống nhất với bản giấy và dự toán' },
    ],
    has_conclusion: true,
    signature_blocks: ['inspector', 'room_leader'],
};

const BM_TK3B_12: DesignFormSchema = {
    code: 'BM-TK3B-12',
    title: 'PHIẾU BÀN GIAO HỒ SƠ TKBVTC SAU PHÊ DUYỆT (THIẾT KẾ 3 BƯỚC)',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'receiver', label: 'Đơn vị nhận bàn giao' },
        { key: 'purpose', label: 'Mục đích bàn giao' },
    ],
    table: HANDOVER_TABLE,
    notes: 'Là căn cứ thi công, giám sát, nghiệm thu.',
    signature_blocks: ['issuer', 'receiver'],
};

const BM_TK3B_13: DesignFormSchema = {
    code: 'BM-TK3B-13',
    title: 'PHIẾU CẬP NHẬT HỒ SƠ TKKT&TKBVTC LÊN PHẦN MỀM QUẢN LÝ DỰ ÁN',
    header_fields: [
        ...COMMON_HEADER,
        { key: 'workflow_code', label: 'Mã quy trình trên phần mềm' },
        { key: 'updater', label: 'Người cập nhật' },
        { key: 'update_time', label: 'Thời điểm cập nhật', type: 'date' },
    ],
    checklist: PM_UPDATE_CHECKLIST,
    signature_blocks: ['updater', 'room_leader'],
};

// ============================================================
// REGISTRY — tra cứu nhanh theo mã biểu mẫu
// ============================================================
export const DESIGN_FORMS: Record<string, DesignFormSchema> = {
    // TK1B
    'BM-TK1B-01': BM_TK1B_01,
    'BM-TK1B-02': BM_TK1B_02,
    'BM-TK1B-03': BM_TK1B_03,
    'BM-TK1B-04': BM_TK1B_04,
    'BM-TK1B-05': BM_TK1B_05,
    'BM-TK1B-06': BM_TK1B_06,
    'BM-TK1B-07': BM_TK1B_07,
    'BM-TK1B-08': BM_TK1B_08,
    'BM-TK1B-09': BM_TK1B_09,
    'BM-TK1B-10': BM_TK1B_10,
    'BM-TK1B-11': BM_TK1B_11,
    'BM-TK1B-12': BM_TK1B_12,
    // TK2B
    'BM-TK2B-01': BM_TK2B_01,
    'BM-TK2B-02': BM_TK2B_02,
    'BM-TK2B-03': BM_TK2B_03,
    'BM-TK2B-04': BM_TK2B_04,
    'BM-TK2B-05': BM_TK2B_05,
    'BM-TK2B-06': BM_TK2B_06,
    'BM-TK2B-07': BM_TK2B_07,
    'BM-TK2B-08': BM_TK2B_08,
    'BM-TK2B-09': BM_TK2B_09,
    'BM-TK2B-10': BM_TK2B_10,
    'BM-TK2B-11': BM_TK2B_11,
    // TK3B
    'BM-TK3B-01': BM_TK3B_01,
    'BM-TK3B-02': BM_TK3B_02,
    'BM-TK3B-03': BM_TK3B_03,
    'BM-TK3B-04': BM_TK3B_04,
    'BM-TK3B-05': BM_TK3B_05,
    'BM-TK3B-06': BM_TK3B_06,
    'BM-TK3B-07': BM_TK3B_07,
    'BM-TK3B-08': BM_TK3B_08,
    'BM-TK3B-09': BM_TK3B_09,
    'BM-TK3B-10': BM_TK3B_10,
    'BM-TK3B-11': BM_TK3B_11,
    'BM-TK3B-12': BM_TK3B_12,
    'BM-TK3B-13': BM_TK3B_13,
};

export function getDesignForm(code: string): DesignFormSchema | null {
    return DESIGN_FORMS[code] ?? null;
}

export function getFormsByWorkflow(workflowCode: 'QT-TK1B' | 'QT-TK2B' | 'QT-TK3B'): DesignFormSchema[] {
    const prefix = workflowCode === 'QT-TK1B' ? 'BM-TK1B'
        : workflowCode === 'QT-TK2B' ? 'BM-TK2B'
        : 'BM-TK3B';
    return Object.values(DESIGN_FORMS).filter(f => f.code.startsWith(prefix));
}
