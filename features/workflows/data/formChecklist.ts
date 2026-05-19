// Dữ liệu checklist từng biểu mẫu BM-TK1B / BM-TK2B / BM-TK3B
// Nguồn: QT-DAXD-TK-QLDA2-2026 (áp dụng từ 01/7/2026)

export interface CheckItem {
    id: number;
    content: string;
}

export interface FormDefinition {
    code: string;         // VD: 'BM-TK1B-01'
    title: string;        // Tên biểu mẫu
    description: string;  // Mô tả ngắn
    type: 'checklist' | 'table' | 'document';
    items: CheckItem[];
    conclusionOptions?: { value: string; label: string }[];
}

// ─── BM-TK1B ─────────────────────────────────────────────────────────────────

const BM_TK1B_01: FormDefinition = {
    code: 'BM-TK1B-01',
    title: 'Phiếu Rà soát Điều kiện Lập BCKTKT',
    description: 'Xác định đủ điều kiện pháp lý, quy hoạch, đất đai, môi trường, PCCC, tài sản công và nguồn vốn trước khi giao tư vấn lập BCKTKT.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Đã có văn bản giao nhiệm vụ / chủ trương đầu tư / quyết định chuẩn bị dự án phù hợp' },
        { id: 2, content: 'Đã xác định đúng loại dự án, nhóm dự án, nguồn vốn, thẩm quyền quyết định đầu tư' },
        { id: 3, content: 'Đã xác định đúng số bước thiết kế và mã quy trình áp dụng' },
        { id: 4, content: 'Có thông tin quy hoạch được sử dụng làm căn cứ lập dự án' },
        { id: 5, content: 'Có thông tin địa điểm, ranh giới, diện tích sử dụng đất, hiện trạng mặt bằng' },
        { id: 6, content: 'Có phương án / đầu mối thực hiện GPMB, bồi thường, hỗ trợ, tái định cư nếu có' },
        { id: 7, content: 'Đã rà soát tài sản công / tài sản kết cấu hạ tầng / tài sản hiện hữu phải xử lý' },
        { id: 8, content: 'Đã xác định yêu cầu môi trường: ĐTM, giấy phép môi trường, đăng ký môi trường hoặc không thuộc đối tượng' },
        { id: 9, content: 'Đã xác định yêu cầu PCCC và cứu nạn, cứu hộ nếu có' },
        { id: 10, content: 'Đã xác định yêu cầu chuyên ngành: giao thông, thủy lợi, đê điều, điện, y tế, giáo dục, di sản, quốc phòng – an ninh nếu có' },
        { id: 11, content: 'Có nhiệm vụ khảo sát, nhiệm vụ thiết kế hoặc yêu cầu kỹ thuật đầu vào' },
        { id: 12, content: 'Có nguồn kinh phí cho công tác tư vấn, khảo sát, lập hồ sơ' },
        { id: 13, content: 'Có kế hoạch lựa chọn nhà thầu tư vấn hoặc căn cứ giao tư vấn hợp lệ' },
        { id: 14, content: 'Tư vấn dự kiến có năng lực phù hợp với loại, cấp công trình và phạm vi công việc' },
        { id: 15, content: 'Đã xác định thời hạn hoàn thành và người chịu trách nhiệm theo dõi trên phần mềm' },
    ],
};

const BM_TK1B_02: FormDefinition = {
    code: 'BM-TK1B-02',
    title: 'Phiếu Giao Nhiệm vụ Tư vấn Lập BCKTKT',
    description: 'Phiếu giao nhiệm vụ cho đơn vị tư vấn khảo sát và lập Báo cáo kinh tế – kỹ thuật.',
    type: 'document',
    items: [
        { id: 1, content: 'Khảo sát hiện trạng, địa hình, địa chất, hạ tầng kỹ thuật → Báo cáo khảo sát, bản vẽ, ảnh hiện trạng' },
        { id: 2, content: 'Lập thuyết minh BCKTKT đầy đủ theo Luật Xây dựng → Bản Word / PDF' },
        { id: 3, content: 'Lập TKBVTC trong BCKTKT → Bộ bản vẽ (bản giấy, PDF, CAD)' },
        { id: 4, content: 'Lập dự toán / tổng mức đầu tư → Bảng tổng hợp kinh phí, dự toán chi tiết, file Excel (có căn cứ giá, định mức kèm theo)' },
        { id: 5, content: 'Rà soát môi trường, PCCC, GPMB, tài sản công → Phụ lục rà soát, đề xuất thủ tục phải thực hiện (nộp kèm hồ sơ)' },
    ],
};

const BM_TK1B_03: FormDefinition = {
    code: 'BM-TK1B-03',
    title: 'Bảng Kiểm tra Hồ sơ BCKTKT',
    description: 'Kiểm tra tổng thể phần thuyết minh và hồ sơ pháp lý của Báo cáo kinh tế – kỹ thuật.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Hồ sơ lập đúng tên dự án, địa điểm, chủ đầu tư, nguồn vốn, thẩm quyền phê duyệt' },
        { id: 2, content: 'Căn cứ pháp lý đầy đủ, cập nhật, phù hợp loại dự án' },
        { id: 3, content: 'Sự cần thiết đầu tư, mục tiêu, quy mô, công suất được trình bày rõ' },
        { id: 4, content: 'Địa điểm xây dựng, diện tích sử dụng đất, hiện trạng và ranh giới dự án rõ ràng' },
        { id: 5, content: 'Sự phù hợp với quy hoạch được dùng làm căn cứ lập dự án được chứng minh' },
        { id: 6, content: 'Phương án GPMB, tái định cư, xử lý tài sản hiện hữu / tài sản công được nêu rõ' },
        { id: 7, content: 'Giải pháp thiết kế đáp ứng yêu cầu sử dụng, quy chuẩn, tiêu chuẩn áp dụng' },
        { id: 8, content: 'Giải pháp thi công phù hợp điều kiện mặt bằng, giao thông, thời tiết, tổ chức thi công' },
        { id: 9, content: 'Nội dung an toàn xây dựng, an toàn công trình lân cận được đề cập đầy đủ' },
        { id: 10, content: 'Nội dung PCCC được xác định đúng đối tượng, có giải pháp hoặc thủ tục kèm theo' },
        { id: 11, content: 'Nội dung môi trường được xác định đúng đối tượng và nêu rõ thủ tục phải thực hiện' },
        { id: 12, content: 'Nguồn vốn, thời gian xây dựng, hiệu quả đầu tư được thuyết minh rõ' },
        { id: 13, content: 'Chủ đầu tư và hình thức quản lý dự án phù hợp' },
        { id: 14, content: 'Tổng mức đầu tư / dự toán phù hợp quy mô và khả năng cân đối vốn' },
        { id: 15, content: 'Hồ sơ có đầy đủ phụ lục: bản vẽ, dự toán, khảo sát, văn bản pháp lý, ảnh hiện trạng' },
        { id: 16, content: 'Các nội dung thuộc ý kiến sở ngành / địa phương / chuyên ngành đã được cập nhật' },
    ],
};

const BM_TK1B_04: FormDefinition = {
    code: 'BM-TK1B-04',
    title: 'Bảng Kiểm tra TKBVTC trong BCKTKT',
    description: 'Kiểm tra phần Thiết kế bản vẽ thi công nằm trong hồ sơ BCKTKT.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Bản vẽ lập đúng tên dự án, hạng mục, ký hiệu, ngày tháng, phiên bản' },
        { id: 2, content: 'Bản vẽ có đầy đủ chữ ký chủ trì, chủ nhiệm, kiểm tra, pháp nhân tư vấn' },
        { id: 3, content: 'Thiết kế phù hợp nhiệm vụ thiết kế và kết quả khảo sát được nghiệm thu / phê duyệt' },
        { id: 4, content: 'Thiết kế phù hợp quy hoạch, chỉ giới, cao độ, điểm đấu nối và điều kiện hiện trạng' },
        { id: 5, content: 'Giải pháp kiến trúc / kết cấu / hạ tầng / kỹ thuật phù hợp mục tiêu, quy mô dự án' },
        { id: 6, content: 'Thiết kế tuân thủ quy chuẩn kỹ thuật, tiêu chuẩn áp dụng và quy định chuyên ngành' },
        { id: 7, content: 'Có thuyết minh tính toán chính đối với hạng mục kết cấu / kỹ thuật quan trọng' },
        { id: 8, content: 'Bảo đảm an toàn chịu lực, ổn định công trình và an toàn công trình lân cận' },
        { id: 9, content: 'Bảo đảm yêu cầu PCCC, thoát nạn, cấp nước chữa cháy, tiếp cận xe chữa cháy nếu có' },
        { id: 10, content: 'Bảo đảm yêu cầu BVMT, thoát nước, xử lý chất thải, hạn chế bụi, ồn trong thi công' },
        { id: 11, content: 'Bảo đảm yêu cầu sử dụng, vận hành, bảo trì, tiếp cận, an toàn người sử dụng' },
        { id: 12, content: 'Chi tiết cấu tạo đủ rõ để thi công, nghiệm thu và lập dự toán' },
        { id: 13, content: 'Không có mâu thuẫn giữa mặt bằng, mặt cắt, chi tiết, thống kê vật liệu và thuyết minh' },
        { id: 14, content: 'Các điểm đấu nối hạ tầng kỹ thuật đã được kiểm tra và có căn cứ chấp thuận nếu cần' },
        { id: 15, content: 'Có biện pháp tổ chức thi công sơ bộ / phương án đảm bảo giao thông, an toàn nếu cần' },
        { id: 16, content: 'Danh mục bản vẽ đầy đủ, đánh số, ký hiệu, sắp xếp hợp lý' },
        { id: 17, content: 'File CAD / PDF thống nhất với bản giấy và bản dự toán' },
    ],
};

const BM_TK1B_05: FormDefinition = {
    code: 'BM-TK1B-05',
    title: 'Bảng Kiểm tra Dự toán / Tổng mức Đầu tư',
    description: 'Kiểm tra dự toán / tổng mức đầu tư trong Báo cáo kinh tế – kỹ thuật.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Dự toán lập đúng tên dự án, hạng mục, địa điểm' },
        { id: 2, content: 'Khối lượng dự toán phù hợp bản vẽ thiết kế' },
        { id: 3, content: 'Không tính trùng, thiếu hoặc sai khối lượng chủ yếu' },
        { id: 4, content: 'Định mức áp dụng phù hợp tính chất công việc' },
        { id: 5, content: 'Đơn giá nhân công, ca máy, vật liệu phù hợp thời điểm lập' },
        { id: 6, content: 'Giá vật liệu có căn cứ: công bố giá, báo giá, khảo sát giá nếu cần' },
        { id: 7, content: 'Chi phí xây dựng tính đúng thành phần chi phí' },
        { id: 8, content: 'Chi phí thiết bị (nếu có) được tính đúng và có căn cứ' },
        { id: 9, content: 'Chi phí quản lý dự án, tư vấn, chi phí khác được tính phù hợp' },
        { id: 10, content: 'Chi phí dự phòng được xác định đúng quy định' },
        { id: 11, content: 'Thuế VAT và các khoản thuế, phí liên quan tính đúng' },
        { id: 12, content: 'Dự toán không vượt tổng mức đầu tư / cơ cấu chi phí được duyệt' },
        { id: 13, content: 'Bảng tổng hợp kinh phí thống nhất với dự toán chi tiết' },
        { id: 14, content: 'File Excel dự toán có công thức rõ, không lỗi liên kết' },
    ],
};

const BM_TK1B_06: FormDefinition = {
    code: 'BM-TK1B-06',
    title: 'Văn bản Yêu cầu Tư vấn Chỉnh sửa / Bổ sung',
    description: 'Phiếu yêu cầu tư vấn chỉnh sửa, bổ sung hồ sơ BCKTKT sau kiểm tra.',
    type: 'table',
    items: [
        { id: 1, content: 'Nội dung cần chỉnh sửa / bổ sung – kèm căn cứ kỹ thuật, thời hạn, tài liệu phải nộp lại' },
    ],
};

const BM_TK1B_07: FormDefinition = {
    code: 'BM-TK1B-07',
    title: 'Bảng Tổng hợp Tiếp thu / Giải trình',
    description: 'Bảng tổng hợp tiếp thu, giải trình ý kiến đối với hồ sơ BCKTKT (12 dòng tiêu chuẩn).',
    type: 'table',
    items: [
        { id: 1, content: 'Nội dung ý kiến' },
        { id: 2, content: 'Đơn vị / người góp ý' },
        { id: 3, content: 'Nội dung tiếp thu / giải trình' },
        { id: 4, content: 'Tài liệu / bản vẽ đã chỉnh sửa' },
        { id: 5, content: 'Trạng thái đã đóng (☑/☐)' },
    ],
};

const BM_TK1B_08: FormDefinition = {
    code: 'BM-TK1B-08',
    title: 'Tờ trình Thẩm định BCKTKT',
    description: 'Tờ trình gửi đến cơ quan / bộ phận được giao thẩm định, kèm hồ sơ hoàn thiện và báo cáo thẩm tra (nếu có).',
    type: 'document',
    items: [
        { id: 1, content: 'Tên dự án, hạng mục, cơ quan trình' },
        { id: 2, content: 'Căn cứ pháp lý thẩm quyền thẩm định' },
        { id: 3, content: 'Danh mục tài liệu gửi kèm' },
        { id: 4, content: 'Nội dung đề nghị thẩm định' },
        { id: 5, content: 'Chữ ký lãnh đạo Ban QLDA / người có thẩm quyền' },
    ],
};

const BM_TK1B_09: FormDefinition = {
    code: 'BM-TK1B-09',
    title: 'Tờ trình Phê duyệt BCKTKT',
    description: 'Tờ trình phê duyệt BCKTKT / quyết định đầu tư, kèm phụ lục TMĐT và cơ cấu chi phí.',
    type: 'document',
    items: [
        { id: 1, content: 'Tên dự án, hạng mục, cơ quan trình' },
        { id: 2, content: 'Căn cứ pháp lý thẩm quyền phê duyệt' },
        { id: 3, content: 'Tổng mức đầu tư và cơ cấu chi phí (phụ lục)' },
        { id: 4, content: 'Danh mục bản vẽ (phụ lục)' },
        { id: 5, content: 'Đề xuất kiến nghị phê duyệt' },
        { id: 6, content: 'Chữ ký lãnh đạo Phòng QLDA' },
    ],
};

const BM_TK1B_10: FormDefinition = {
    code: 'BM-TK1B-10',
    title: 'Dự thảo Quyết định Phê duyệt BCKTKT',
    description: 'Dự thảo Quyết định phê duyệt BCKTKT / quyết định đầu tư theo thẩm quyền.',
    type: 'document',
    items: [
        { id: 1, content: 'Căn cứ pháp lý ban hành quyết định' },
        { id: 2, content: 'Phê duyệt nội dung BCKTKT: tên, mục tiêu, quy mô, vị trí, cấp công trình' },
        { id: 3, content: 'Phê duyệt tổng mức đầu tư, nguồn vốn, cơ cấu chi phí' },
        { id: 4, content: 'Phê duyệt kế hoạch thực hiện và bàn giao' },
        { id: 5, content: 'Quy định trách nhiệm thi hành' },
        { id: 6, content: 'Chữ ký người có thẩm quyền phê duyệt' },
    ],
};

const BM_TK1B_11: FormDefinition = {
    code: 'BM-TK1B-11',
    title: 'Phiếu Bàn giao Hồ sơ sau Phê duyệt',
    description: 'Phiếu bàn giao hồ sơ cho Tổ chuyên gia / KHĐT để lập KHLCNT và tổ chức lựa chọn nhà thầu.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Quyết định phê duyệt BCKTKT (bản PDF ký số)' },
        { id: 2, content: 'Hồ sơ thuyết minh BCKTKT (file gốc Word / PDF)' },
        { id: 3, content: 'Bộ bản vẽ TKBVTC (file CAD / PDF / bản in)' },
        { id: 4, content: 'Dự toán / tổng mức đầu tư (file Excel / PDF)' },
        { id: 5, content: 'Báo cáo khảo sát địa hình, địa chất' },
        { id: 6, content: 'Báo cáo thẩm tra (nếu có)' },
        { id: 7, content: 'Văn bản thẩm định' },
        { id: 8, content: 'Hồ sơ pháp lý dự án (quy hoạch, môi trường, PCCC, v.v.)' },
    ],
};

const BM_TK1B_12: FormDefinition = {
    code: 'BM-TK1B-12',
    title: 'Phiếu Cập nhật Phần mềm / Lưu trữ Hồ sơ',
    description: 'Phiếu cập nhật quyết định phê duyệt lên phần mềm; khóa phiên bản và lưu trữ.',
    type: 'checklist',
    items: [
        { id: 1, content: 'Đã upload Quyết định phê duyệt (PDF ký số) lên phần mềm' },
        { id: 2, content: 'Đã upload file gốc Word / Excel / CAD theo đúng cấu trúc thư mục' },
        { id: 3, content: 'Đã cập nhật danh mục bản vẽ và phiên bản được phê duyệt' },
        { id: 4, content: 'Đã khóa phiên bản (không cho chỉnh sửa sau phê duyệt)' },
        { id: 5, content: 'Đã gán đúng tag tài liệu: Quyết định, Thiết kế, Dự toán, Pháp lý' },
        { id: 6, content: 'Đã chuyển trạng thái quy trình sang "Hoàn tất"' },
    ],
};

// ─── Registry ─────────────────────────────────────────────────────────────────

const ALL_FORMS: FormDefinition[] = [
    BM_TK1B_01, BM_TK1B_02, BM_TK1B_03, BM_TK1B_04,
    BM_TK1B_05, BM_TK1B_06, BM_TK1B_07, BM_TK1B_08,
    BM_TK1B_09, BM_TK1B_10, BM_TK1B_11, BM_TK1B_12,
];

export function getFormDefinition(code: string): FormDefinition | undefined {
    return ALL_FORMS.find(f => f.code === code);
}

export { ALL_FORMS };
