require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Thiếu VITE_SUPABASE_URL hoặc VITE_SUPABASE_SERVICE_ROLE_KEY trong file .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PROJ_ID = '8173865';
const WORKFLOW_ID = 'acaea57b-65bc-486f-b92b-d64e1bdf589a'; // Quy trình DAXD - Dự án 2 bước (QT-DA2B)
const CURRENT_DATE = new Date('2026-05-21');

const DEPT_MAPPING = {
  'QLDA1': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV056', staffName: 'Lê Tùng Nguyên', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'QLDA1_ALT1': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV057', staffName: 'Trần Duy Khán', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'QLDA1_ALT2': { code: 'QLDA1', name: 'Phòng Quản lý dự án 1', staff: 'NV058', staffName: 'Lê Ngọc Sơn', head: 'NV053', headName: 'Phan Quốc Bảo' },
  'KTTD': { code: 'KTTD', name: 'Phòng Kỹ thuật – Thẩm định', staff: 'NV098', staffName: 'Nguyễn Trọng Hải', head: 'NV030', headName: 'Hà Vũ Tuấn Dũng' },
  'KHDT': { code: 'KHDT', name: 'Phòng Kế hoạch – Đấu thầu', staff: 'NV042', staffName: 'Nguyễn Thị Quỳnh Nga', head: 'NV041', headName: 'Bùi Nam Sơn' }
};

// Cấu trúc 17 bước công việc theo QT-DA2B
const WBS_STEPS = [
  {
    nodeId: '1464ff5e-5e41-4016-9bae-5826f1ed4220',
    stepCode: '1.1',
    title: 'Lập, thẩm định, phê duyệt chủ trương đầu tư',
    description: 'Lập, thẩm định, phê duyệt chủ trương đầu tư xây dựng dự án Trường phổ thông nội trú liên cấp Sơn Kim 1 theo chủ trương đầu tư của Bộ Chính trị và Chính phủ.',
    phase: 'preparation',
    deptKey: 'KHDT',
    start: '2025-07-18',
    end: '2025-09-26',
    estimatedCost: 0,
    legalBasis: 'Nghị quyết số 298/NQ-CP ngày 26/9/2025 của Chính phủ thực hiện Thông báo kết luận số 81-TB/TW ngày 18/7/2025 của Bộ Chính trị',
    outputDocument: 'Nghị quyết số 298/NQ-CP ngày 26/9/2025 của Chính phủ',
    subtasks: [] // Không có subtask theo chỉ đạo (Đã được phê duyệt bởi chính phủ)
  },
  {
    nodeId: '1a18dba2-4859-476b-b0a0-9c8a6ad4610b',
    stepCode: '1.2',
    title: 'Lựa chọn nhà thầu Tư vấn khảo sát, lập BCNCKT',
    description: 'Tổ chức lựa chọn nhà thầu gói thầu Tư vấn khảo sát, lập quy hoạch chi tiết và lập Báo cáo nghiên cứu khả thi dự án.',
    phase: 'preparation',
    deptKey: 'KHDT',
    start: '2025-10-16',
    end: '2025-10-30',
    estimatedCost: 1285065700,
    legalBasis: 'Luật Đấu thầu số 22/2023/QH15, Nghị định 24/2024/NĐ-CP',
    outputDocument: 'Quyết định phê duyệt kết quả lựa chọn nhà thầu và Hợp đồng số HD-SVK1-01.1',
    subtasks: [
      { title: 'Lập và thẩm định Kế hoạch lựa chọn nhà thầu gói thầu Tư vấn', sort: 1 },
      { title: 'Lập và phê duyệt hồ sơ mời thầu (E-HSMT) tư vấn khảo sát lập BCNCKT', sort: 2 },
      { title: 'Tổ chức mở thầu và đánh giá E-HSDT của các nhà thầu tham dự', sort: 3 },
      { title: 'Thẩm định, phê duyệt kết quả lựa chọn nhà thầu tư vấn', sort: 4 },
      { title: 'Thương thảo và hoàn thiện hợp đồng gói thầu tư vấn khảo sát lập BCNCKT', sort: 5 }
    ]
  },
  {
    nodeId: 'aebb8ecf-8c75-4b98-9c52-faf6ec5e9a10',
    stepCode: '1.3',
    title: 'Lập BCNCKT (bao gồm Thiết kế cơ sở)',
    description: 'Triển khai công tác khảo sát hiện trạng, lập Thiết kế cơ sở và lập Báo cáo nghiên cứu khả thi (BCNCKT) dự án, đồng thời rà phá bom mìn vật nổ để chuẩn bị mặt bằng.',
    phase: 'preparation',
    deptKey: 'QLDA1',
    start: '2025-10-31',
    end: '2026-01-25',
    estimatedCost: 1424565700, // HD-SVK1-01.1 + HD-SVK1-01.3
    legalBasis: 'Luật Xây dựng số 50/2014/QH13, Nghị định 15/2021/NĐ-CP về quản lý dự án',
    outputDocument: 'Hồ sơ Thiết kế cơ sở, BCNCKT và biên bản bàn giao mặt bằng RPBM',
    subtasks: [
      { title: 'Bàn giao nhiệm vụ khảo sát địa hình, địa chất công trình cho Đơn vị tư vấn', sort: 1 },
      { title: 'Triển khai công tác khảo sát thực địa, lập báo cáo kết quả khảo sát kỹ thuật', sort: 2 },
      { title: 'Lập hồ sơ Thiết kế cơ sở (Phần kiến trúc, kết cấu, hạ tầng ngoài nhà, điện nước)', sort: 3 },
      { title: 'Lập Báo cáo nghiên cứu khả thi dự án (Thuyết minh dự án & Tổng mức đầu tư)', sort: 4 },
      { title: 'Triển khai rà phá bom mìn, vật nổ trên thực địa để bàn giao mặt bằng sạch', sort: 5 },
      { title: 'Ký biên bản bàn giao sản phẩm BCNCKT & Thiết kế cơ sở hoàn thành', sort: 6 }
    ]
  },
  {
    nodeId: 'd11cd9fc-e0e6-4d26-b802-65b73a58da62',
    stepCode: '1.4',
    title: 'Xin ý kiến thỏa thuận chuyên ngành',
    description: 'Thực hiện các thủ tục thỏa thuận chuyên ngành bao gồm quy hoạch chi tiết 1/500, thẩm duyệt PCCC và lập hồ sơ môi trường.',
    phase: 'preparation',
    deptKey: 'QLDA1',
    start: '2025-11-15',
    end: '2026-03-02',
    estimatedCost: 39826000, // HD-SVK1-02.4
    legalBasis: 'Luật PCCC số 27/2001/QH10, Luật Bảo vệ môi trường số 72/2020/QH14',
    outputDocument: 'Giấy chứng nhận thẩm duyệt PCCC và văn bản xác nhận đăng ký môi trường',
    subtasks: [
      { title: 'Lập và trình nộp hồ sơ xin ý kiến quy hoạch chi tiết 1/500 dự án', sort: 1 },
      { title: 'Lập hồ sơ thiết kế phòng cháy chữa cháy (PCCC) trình Phòng Cảnh sát PCCC thẩm duyệt', sort: 2 },
      { title: 'Đánh giá hiện trạng môi trường khu vực dự án và lập Báo cáo đăng ký môi trường', sort: 3 },
      { title: 'Trình nộp hồ sơ, hiệu chỉnh và nhận Chấp thuận PCCC & Đăng ký môi trường', sort: 4 }
    ]
  },
  {
    nodeId: '5eccefd0-ec5f-4006-a66d-d2caedcfda08',
    stepCode: '1.5',
    title: 'Thẩm định BCNCKT và Thiết kế cơ sở',
    description: 'Tổ chức thẩm tra BCNCKT, tổng mức đầu tư và trình cơ quan chuyên môn thuộc Sở Xây dựng thẩm định Báo cáo nghiên cứu khả thi dự án.',
    phase: 'preparation',
    deptKey: 'KTTD',
    start: '2025-12-03',
    end: '2026-01-20',
    estimatedCost: 107201000, // HD-2026-TVTK
    legalBasis: 'Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng',
    outputDocument: 'Văn bản thông báo kết quả thẩm định BCNCKT của Sở Xây dựng',
    subtasks: [
      { title: 'Tiếp nhận hồ sơ BCNCKT & Thiết kế cơ sở từ đơn vị Tư vấn và Chủ đầu tư', sort: 1 },
      { title: 'Bàn giao hồ sơ cho đơn vị Tư vấn thẩm tra để rà soát kỹ thuật và tổng mức đầu tư', sort: 2 },
      { title: 'Thẩm tra thuyết minh dự án, phương án thiết kế cơ sở và dự toán tổng mức đầu tư', sort: 3 },
      { title: 'Lập hồ sơ trình Sở Xây dựng thẩm định Báo cáo nghiên cứu khả thi dự án', sort: 4 },
      { title: 'Nhận báo cáo kết quả thẩm định của Sở Xây dựng, hoàn thiện hồ sơ', sort: 5 }
    ]
  },
  {
    nodeId: '3b36ef8d-3bca-4fe1-88a4-3f9d4adf5038',
    stepCode: '1.6',
    title: 'Phê duyệt Dự án đầu tư xây dựng',
    description: 'Tổng hợp hồ sơ và kết quả thẩm định, lập tờ trình trình UBND tỉnh ban hành Quyết định phê duyệt dự án đầu tư xây dựng.',
    phase: 'preparation',
    deptKey: 'QLDA1',
    start: '2026-01-21',
    end: '2026-01-25',
    estimatedCost: 0,
    legalBasis: 'Nghị định 15/2021/NĐ-CP về quản lý dự án đầu tư xây dựng',
    outputDocument: 'Quyết định phê duyệt dự án đầu tư xây dựng của Ủy ban nhân dân tỉnh',
    subtasks: [
      { title: 'Lập Tờ trình xin phê duyệt dự án đầu tư xây dựng Trường Sơn Kim 1', sort: 1 },
      { title: 'Tổng hợp kết quả thẩm định của Sở Xây dựng, văn bản thỏa thuận PCCC, môi trường', sort: 2 },
      { title: 'Trình Ủy ban nhân dân tỉnh ban hành Quyết định phê duyệt dự án đầu tư xây dựng', sort: 3 },
      { title: 'Phổ biến Quyết định phê duyệt dự án đầu tư xây dựng và triển khai kế hoạch thực hiện', sort: 4 }
    ]
  },
  {
    nodeId: '9ed13a09-3e86-47b9-95ae-4934e583420a',
    stepCode: '2.1',
    title: 'Lựa chọn nhà thầu Tư vấn TKBVTC',
    description: 'Tổ chức đấu thầu rộng rãi qua mạng lựa chọn nhà thầu Tư vấn thiết kế bản vẽ thi công và dự toán công trình.',
    phase: 'execution',
    deptKey: 'KHDT',
    start: '2025-12-15',
    end: '2026-01-05',
    estimatedCost: 2149307000, // HD-SVK1-02.1
    legalBasis: 'Luật Đấu thầu số 22/2023/QH15, Thông tư 06/2024/TT-BKHĐT',
    outputDocument: 'Quyết định phê duyệt kết quả lựa chọn nhà thầu tư vấn TKBVTC',
    subtasks: [
      { title: 'Lập KHLCNT gói thầu Tư vấn thiết kế bản vẽ thi công và dự toán', sort: 1 },
      { title: 'Phê duyệt E-HSMT gói thầu tư vấn thiết kế BVTC & dự toán công trình', sort: 2 },
      { title: 'Tổ chức đấu thầu rộng rãi qua mạng, đánh giá hồ sơ đề xuất kỹ thuật và tài chính', sort: 3 },
      { title: 'Phê duyệt kết quả lựa chọn nhà thầu gói thầu tư vấn thiết kế BVTC', sort: 4 },
      { title: 'Ký kết hợp đồng tư vấn thiết kế bản vẽ thi công và dự toán với nhà thầu trúng thầu', sort: 5 }
    ]
  },
  {
    nodeId: 'bacb8a59-7189-40ce-a9dd-f619a570f696',
    stepCode: '2.2',
    title: 'Lập Thiết kế bản vẽ thi công và Dự toán',
    description: 'Triển khai công tác thiết kế chi tiết bản vẽ thi công, thiết kế M&E, PCCC, lập hồ sơ cấp phép mỏ đất san lấp và tính toán dự toán xây dựng chi tiết.',
    phase: 'execution',
    deptKey: 'QLDA1_ALT1',
    start: '2026-01-06',
    end: '2026-06-15',
    estimatedCost: 2582778000, // HD-SVK1-02.1 + HD-SVK1-02.5
    legalBasis: 'Nghị định 10/2021/NĐ-CP về quản lý chi phí đầu tư xây dựng',
    outputDocument: 'Hồ sơ Thiết kế bản vẽ thi công và Dự toán xây dựng công trình hoàn chỉnh',
    subtasks: [
      { title: 'Tổ chức khảo sát địa chất bổ sung phục vụ thiết kế bản vẽ thi công chi tiết', sort: 1 },
      { title: 'Lập hồ sơ Thiết kế bản vẽ thi công các hạng mục kiến trúc, kết cấu khối nhà học liên cấp', sort: 2 },
      { title: 'Thiết kế chi tiết hệ thống cơ điện (M&E), cấp thoát nước, thông tin liên lạc và PCCC', sort: 3 },
      { title: 'Lập báo cáo khảo sát và hồ sơ xin cấp phép khai thác mỏ đất san lấp phục vụ san nền', sort: 4 },
      { title: 'Tính toán khối lượng chi tiết từ bản vẽ thi công và lập dự toán xây dựng chi tiết', sort: 5 }
    ]
  },
  {
    nodeId: 'fffe88c9-1d3e-490c-9f75-728c1180b3d0',
    stepCode: '2.3',
    title: 'Thẩm tra Thiết kế bản vẽ thi công và Dự toán',
    description: 'Triển khai công tác thẩm tra thiết kế giải pháp kết cấu, dự toán xây dựng chi tiết và thực hiện thẩm định giá vật tư, thiết bị.',
    phase: 'execution',
    deptKey: 'KTTD',
    start: '2026-03-01',
    end: '2026-05-30',
    estimatedCost: 430565000, // HD-SVK1-02.2 + HD-SVK1-02.3
    legalBasis: 'Thông tư 12/2021/TT-BXD ban hành định mức xây dựng',
    outputDocument: 'Báo cáo kết quả thẩm tra thiết kế, dự toán và Chứng thư thẩm định giá',
    subtasks: [
      { title: 'Bàn giao hồ sơ thiết kế bản vẽ thi công và dự toán cho đơn vị Tư vấn thẩm tra', sort: 1 },
      { title: 'Thực hiện thẩm tra các giải pháp kết cấu, an toàn chịu lực của công trình khối nhà học', sort: 2 },
      { title: 'Thẩm tra tính chính xác của khối lượng dự toán, kiểm tra đơn giá định mức áp dụng', sort: 3 },
      { title: 'Thực hiện thẩm định giá vật tư, thiết bị trường học phục vụ kiểm tra dự toán', sort: 4 },
      { title: 'Phát hành báo cáo kết quả thẩm tra thiết kế bản vẽ thi công và dự toán', sort: 5 }
    ]
  },
  {
    nodeId: '0027ac37-c29d-4d5f-89d6-2870777ca068',
    stepCode: '2.4',
    title: 'Thẩm định and Phê duyệt Thiết kế bản vẽ thi công & Dự toán',
    description: 'Trình Sở Xây dựng thẩm định và ra quyết định phê duyệt Thiết kế bản vẽ thi công, dự toán xây dựng công trình của Chủ đầu tư.',
    phase: 'execution',
    deptKey: 'KTTD',
    start: '2026-05-31',
    end: '2026-06-15',
    estimatedCost: 0,
    legalBasis: 'Nghị định 15/2021/NĐ-CP của Chính phủ',
    outputDocument: 'Quyết định phê duyệt Thiết kế bản vẽ thi công và Dự toán xây dựng công trình của CĐT',
    subtasks: [
      { title: 'Tổng hợp báo cáo kết quả thẩm tra thiết kế và dự toán từ đơn vị thẩm tra', sort: 1 },
      { title: 'Lập Tờ trình trình Sở Xây dựng thẩm định thiết kế bản vẽ thi công và dự toán xây dựng', sort: 2 },
      { title: 'Phối hợp giải trình các điểm chưa đồng nhất với cơ quan chuyên môn về xây dựng', sort: 3 },
      { title: 'Lập Tờ trình phê duyệt Thiết kế bản vẽ thi công và Dự toán xây dựng công trình', sort: 4 },
      { title: 'Ký ban hành Quyết định phê duyệt Thiết kế bản vẽ thi công và Dự toán xây dựng công trình', sort: 5 }
    ]
  },
  {
    nodeId: '476147c6-375a-48cc-b643-568bd1a2da48',
    stepCode: '2.5',
    title: 'Lập, thẩm định, phê duyệt Kế hoạch LCNT',
    description: 'Phân chia các gói thầu xây dựng, lắp đặt, mua sắm và lập tờ trình thẩm định phê duyệt Kế hoạch lựa chọn nhà thầu tổng thể.',
    phase: 'execution',
    deptKey: 'KHDT',
    start: '2026-01-01',
    end: '2026-01-12',
    estimatedCost: 0,
    legalBasis: 'Luật Đấu thầu số 22/2023/QH15, Thông tư 06/2024/TT-BKHĐT',
    outputDocument: 'Quyết định phê duyệt KHLCNT dự án Trường Sơn Kim 1',
    subtasks: [
      { title: 'Phân chia các gói thầu thi công xây dựng (Gói thầu san nền 03.1, Gói thầu xây dựng 04.1)', sort: 1 },
      { title: 'Lập tờ trình xin phê duyệt Kế hoạch lựa chọn nhà thầu tổng thể giai đoạn thực hiện dự án', sort: 2 },
      { title: 'Thẩm định Kế hoạch lựa chọn nhà thầu tổng thể của Phòng Kế hoạch - Đấu thầu', sort: 3 },
      { title: 'Ban hành Quyết định phê duyệt Kế hoạch lựa chọn nhà thầu (KHLCNT) tổng thể toàn dự án', sort: 4 }
    ]
  },
  {
    nodeId: 'd36575ff-2aa6-4f2b-a9fa-ae235f08c208',
    stepCode: '2.6',
    title: 'Bồi thường, Hỗ trợ và Tái định cư (GPMB)',
    description: 'Thực hiện đo đạc, áp giá bồi thường, phê duyệt phương án bồi thường, hỗ trợ tái định cư và thực hiện GPMB bàn giao mặt bằng sạch.',
    phase: 'execution',
    deptKey: 'QLDA1',
    start: '2025-11-01',
    end: '2026-02-15',
    estimatedCost: 0,
    legalBasis: 'Luật Đất đai số 31/2024/QH15',
    outputDocument: 'Phương án bồi thường hỗ trợ được phê duyệt và Biên bản bàn giao mặt bằng sạch',
    subtasks: [
      { title: 'Thành lập Hội đồng bồi thường, hỗ trợ và tái định cư dự án Trường Sơn Kim 1', sort: 1 },
      { title: 'Đo đạc, cắm mốc giải phóng mặt bằng trên thực địa và kiểm kê tài sản trên đất', sort: 2 },
      { title: 'Lập phương án bồi thường, hỗ trợ tái định cư chi tiết cho các hộ dân bị ảnh hưởng', sort: 3 },
      { title: 'Công khai phương án, lấy ý kiến người dân và phê duyệt phương án bồi thường hỗ trợ', sort: 4 },
      { title: 'Chi trả tiền bồi thường, thực hiện bàn giao mặt bằng sạch cho đơn vị thi công', sort: 5 }
    ]
  },
  {
    nodeId: '95de22e0-17f2-405e-9a87-e5ad1bd0c333',
    stepCode: '2.7',
    title: 'Tổ chức LCNT (Thi công xây lắp & TVGS) và Ký kết hợp đồng',
    description: 'Thực hiện lập, duyệt HSMT, tổ chức đấu thầu qua mạng lựa chọn nhà thầu thi công xây dựng chính, thi công san nền, đơn vị TVGS và ký hợp đồng.',
    phase: 'execution',
    deptKey: 'KHDT',
    start: '2026-01-02',
    end: '2026-02-04',
    estimatedCost: 102434515000, // HD-SVK1-03.1 + 03.2 + 03.3 + 04.1 + 04.2 + 04.3 + 04.4 + 04.5
    legalBasis: 'Luật Đấu thầu số 22/2023/QH15',
    outputDocument: 'Các hợp đồng thi công xây dựng (03.1, 04.1) và hợp đồng tư vấn giám sát (03.2, 04.4)',
    subtasks: [
      { title: 'Lập và phê duyệt E-HSMT gói thầu thi công xây lắp san nền (03.1) và gói thầu thi công xây dựng chính (04.1)', sort: 1 },
      { title: 'Đăng tải thông báo mời thầu trên Hệ thống mạng đấu thầu quốc gia', sort: 2 },
      { title: 'Thực hiện mở thầu qua mạng, đánh giá hồ sơ đề xuất kỹ thuật và tài chính của các nhà thầu', sort: 3 },
      { title: 'Phê duyệt kết quả lựa chọn nhà thầu thi công xây dựng và đơn vị tư vấn giám sát', sort: 4 },
      { title: 'Ký kết hợp đồng thi công xây dựng, tư vấn giám sát và mua bảo hiểm công trình xây dựng', sort: 5 }
    ]
  },
  {
    nodeId: '314bf1ea-f7ca-43a6-b348-b684db655aa6',
    stepCode: '2.8',
    title: 'Thi công xây dựng, Quản lý thi công, thanh toán định kỳ',
    description: 'Triển khai thi công thực địa: san lấp mặt bằng, phá dỡ khối nhà cũ, nén cọc thử tải, thi công phần móng đài cọc, phần thô bê tông cốt thép, xây trát hoàn thiện và lắp đặt thiết bị trường học.',
    phase: 'execution',
    deptKey: 'QLDA1',
    start: '2026-01-13',
    end: '2026-08-12',
    estimatedCost: 102434515000,
    legalBasis: 'TCVN 4447:2012, TCVN 9393:2012, TCVN 06:2021/BXD',
    outputDocument: 'Biên bản nghiệm thu khối lượng hoàn thành định kỳ và nhật ký công trình',
    subtasks: [
      { title: 'Phát lệnh khởi công xây dựng công trình, nhận bàn giao mốc định vị mặt bằng', sort: 1 },
      { title: 'Triển khai công tác phá dỡ các khối nhà nội trú cũ bị xuống cấp để lấy mặt bằng', sort: 2 },
      { title: 'Thi công san lấp, đào đắp mặt bằng toàn khu đạt cao độ thiết kế', sort: 3 },
      { title: 'Thực hiện ép cọc thử nghiệm và tiến hành thí nghiệm nén tĩnh cọc bê tông cốt thép', sort: 4 },
      { title: 'Thi công bê tông cốt thép phần móng, đài móng và bể nước khối nhà học chính', sort: 5 },
      { title: 'Thi công kết cấu khung bê tông cốt thép phần thân (cột, dầm, sàn tầng 1, tầng 2 và sàn mái)', sort: 6 },
      { title: 'Xây dựng tường bao che, ngăn phòng, trát hoàn thiện bề mặt trong và ngoài công trình', sort: 7 },
      { title: 'Lắp đặt hệ thống cửa đi, cửa sổ, thiết bị chiếu sáng, điện nước sinh hoạt và thiết bị PCCC công trình', sort: 8 },
      { title: 'Mua sắm và lắp đặt trang thiết bị trường học, phòng học bộ môn (bàn ghế, bảng, máy chiếu)', sort: 9 },
      { title: 'Giám sát chất lượng, tiến độ thi công định kỳ, nghiệm thu khối lượng hoàn thành', sort: 10 }
    ]
  },
  {
    nodeId: 'aae4d6fd-0ec8-4cc6-a5cc-325c02499106',
    stepCode: '3.1',
    title: 'Nghiệm thu hoàn thành, bàn giao đưa vào sử dụng',
    description: 'Thực hiện các thủ tục nghiệm thu hoàn thành công trình xây dựng, bàn giao đưa dự án Trường phổ thông nội trú liên cấp Sơn Kim 1 vào khai thác, sử dụng.',
    phase: 'completion',
    deptKey: 'QLDA1',
    start: '2026-08-13',
    end: '2026-09-11',
    estimatedCost: 0,
    legalBasis: 'Nghị định 06/2021/NĐ-CP về quản lý chất lượng và bảo trì công trình xây dựng',
    outputDocument: 'Văn bản chấp thuận kết quả nghiệm thu hoàn thành công trình của Sở Xây dựng',
    subtasks: [
      { title: 'Kiểm tra hồ sơ hoàn công và các kết quả thí nghiệm nghiệm thu của công trình', sort: 1 },
      { title: 'Tổ chức nghiệm thu hoàn thành công trình xây dựng giữa Chủ đầu tư và các đơn vị', sort: 2 },
      { title: 'Lập hồ sơ báo cáo Sở Xây dựng kiểm tra công tác nghiệm thu đưa vào sử dụng', sort: 3 },
      { title: 'Ký biên bản bàn giao đưa công trình vào sử dụng và chuyển giao cho đơn vị thụ hưởng', sort: 4 }
    ]
  },
  {
    nodeId: '9855ab8e-c2d0-4785-92e6-a47de5eb835a',
    stepCode: '3.2',
    title: 'Lập, thẩm tra và phê duyệt Quyết toán dự án hoàn thành',
    description: 'Thực hiện công tác lập báo cáo quyết toán, kiểm toán độc lập và trình cơ quan chức năng thẩm tra, phê duyệt quyết toán vốn đầu tư hoàn thành dự án.',
    phase: 'completion',
    deptKey: 'QLDA1',
    start: '2026-09-12',
    end: '2026-12-10',
    estimatedCost: 85000000,
    legalBasis: 'Nghị định 99/2021/NĐ-CP về quản lý, thanh toán, quyết toán dự án hoàn thành',
    outputDocument: 'Quyết định phê duyệt quyết toán vốn đầu tư hoàn thành của UBND tỉnh',
    subtasks: [
      { title: 'Lập báo cáo quyết toán dự án hoàn thành (Tổng hợp chi phí đầu tư thực tế)', sort: 1 },
      { title: 'Lựa chọn nhà thầu kiểm toán độc lập và thực hiện kiểm toán báo cáo quyết toán', sort: 2 },
      { title: 'Trình nộp hồ sơ lên Sở Tài chính thẩm tra quyết toán dự án hoàn thành', sort: 3 },
      { title: 'Nhận Quyết định phê duyệt quyết toán dự án hoàn thành của UBND tỉnh', sort: 4 }
    ]
  },
  {
    nodeId: 'ade61f21-80a3-4c40-b457-c7c2b4d37350',
    stepCode: '3.3',
    title: 'Bảo hành công trình, tất toán tài khoản dự án',
    description: 'Thực hiện công tác bảo hành công trình theo quy định của hợp đồng, giải tỏa bảo lãnh bảo hành và tất toán tài khoản dự án tại Kho bạc Nhà nước.',
    phase: 'completion',
    deptKey: 'QLDA1',
    start: '2026-09-12',
    end: '2027-09-11',
    estimatedCost: 0,
    legalBasis: 'Nghị định 06/2021/NĐ-CP của Chính phủ về quản lý chất lượng công trình',
    outputDocument: 'Biên bản xác nhận hoàn thành bảo hành công trình và Thông báo tất toán tài khoản của KBNN',
    subtasks: [
      { title: 'Theo dõi tình trạng công trình trong thời gian bảo hành và yêu cầu sửa chữa khiếm khuyết', sort: 1 },
      { title: 'Tổ chức kiểm tra, đánh giá và ký biên bản xác nhận hết thời hạn bảo hành công trình', sort: 2 },
      { title: 'Thực hiện giải tỏa tiền giữ lại bảo hành hoặc bảo lãnh bảo hành cho nhà thầu', sort: 3 },
      { title: 'Thực hiện các thủ tục tất toán tài khoản dự án tại Kho bạc Nhà nước', sort: 4 }
    ]
  }
];
function calculateStatusAndProgress(startStr, endStr, stepCode) {
  if (stepCode === '1.1') {
    return { status: 'done', progress: 100, actualStart: startStr, actualEnd: endStr };
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (end < CURRENT_DATE) {
    return { status: 'done', progress: 100, actualStart: startStr, actualEnd: endStr };
  } else if (start <= CURRENT_DATE && end >= CURRENT_DATE) {
    const totalDays = (end - start) / (1000 * 60 * 60 * 24);
    const elapsedDays = (CURRENT_DATE - start) / (1000 * 60 * 60 * 24);
    let pct = Math.round((elapsedDays / totalDays) * 100);
    pct = Math.min(Math.max(pct, 15), 90); // Giữ trong khoảng 15-90%
    return { status: 'in_progress', progress: pct, actualStart: startStr, actualEnd: null };
  } else {
    return { status: 'todo', progress: 0, actualStart: null, actualEnd: null };
  }
}

// Phân bổ ngày bắt đầu/kết thúc tuần tự cho các công việc con
function distributeDates(startDateStr, endDateStr, count, index) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  const daysPerTask = Math.floor(diffDays / count);
  const remainder = diffDays % count;
  
  let startOffset = 0;
  for (let i = 0; i < index; i++) {
    startOffset += daysPerTask + (i < remainder ? 1 : 0);
  }
  
  const duration = daysPerTask + (index < remainder ? 1 : 0);
  
  const taskStart = new Date(start);
  taskStart.setDate(start.getDate() + startOffset);
  
  const taskEnd = new Date(taskStart);
  taskEnd.setDate(taskStart.getDate() + duration - 1);
  
  return {
    start: taskStart.toISOString().split('T')[0],
    end: taskEnd.toISOString().split('T')[0]
  };
}

async function run() {
  console.log('=== BẮT ĐẦU CHẠY SEED DỮ LIỆU WBS DỰ ÁN SƠN KIM 1 ===');

  try {
    // 1. DỌN DẸP DỮ LIỆU CŨ của dự án 8173865
    console.log('1. Đang dọn dẹp dữ liệu cũ...');
    
    // Select all existing tasks first
    const { data: existingTasks, error: selErr } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', PROJ_ID);
      
    if (selErr) {
      console.error('Lỗi truy vấn tasks cũ:', selErr.message);
    }
    
    const taskIds = (existingTasks || []).map(t => t.id);
    
    if (taskIds.length > 0) {
      const { error: delSubErr } = await supabase.from('sub_tasks')
        .delete()
        .in('task_id', taskIds);
      if (delSubErr) console.log('Lưu ý dọn dẹp sub_tasks cũ (bảng sub_tasks):', delSubErr.message);
    }

    // Dọn dẹp subtasks trong bảng tasks trước để tránh FK constraint violation
    const { error: delSubTasksTasksErr } = await supabase.from('tasks')
      .delete()
      .eq('project_id', PROJ_ID)
      .not('parent_id', 'is', null);
    if (delSubTasksTasksErr) console.error('Lỗi dọn dẹp subtasks trong bảng tasks:', delSubTasksTasksErr);

    const { error: delTasksErr } = await supabase.from('tasks').delete().eq('project_id', PROJ_ID).is('parent_id', null);
    if (delTasksErr) console.error('Lỗi dọn dẹp tasks chính:', delTasksErr);

    const { error: delMpiErr } = await supabase.from('monthly_plan_items').delete().eq('project_id', PROJ_ID);
    if (delMpiErr) console.error('Lỗi dọn dẹp monthly_plan_items:', delMpiErr);

    const { error: delApiErr } = await supabase.from('annual_plan_items').delete().eq('project_id', PROJ_ID);
    if (delApiErr) console.error('Lỗi dọn dẹp annual_plan_items:', delApiErr);
    
    const { error: delWiErr } = await supabase.from('workflow_instances')
      .delete()
      .eq('reference_id', PROJ_ID)
      .eq('reference_type', 'project');
    if (delWiErr) console.error('Lỗi dọn dẹp workflow_instances:', delWiErr);

    console.log('Đã dọn dẹp sạch dữ liệu cũ dự án 8173865.');

    // 2. KHỞI TẠO BẢN GHI workflow_instances CHO DỰ ÁN
    console.log('\n2. Đăng ký workflow_instances...');
    const instId = uuidv4();
    const { error: instErr } = await supabase.from('workflow_instances').insert({
      id: instId,
      workflow_id: WORKFLOW_ID,
      reference_id: PROJ_ID,
      reference_type: 'project',
      status: 'in_progress',
      started_at: '2025-07-18T00:00:00Z',
      context_data: { target_end_date: '2027-08-11' }
    });
    
    if (instErr) {
      console.error('Lỗi tạo workflow_instances:', instErr.message);
      return;
    }
    console.log(`- Đăng ký workflow instance thành công, ID: ${instId}`);

    // 3. TẠO KẾ HOẠCH KHUNG NĂM (annual_plan_items)
    console.log('\n3. Đang tạo Kế hoạch Khung Năm (annual_plan_items)...');
    const annualMapping = {};
    const uniqueYears = [2025, 2026, 2027];
    const uniqueDepts = ['QLDA1', 'KHDT', 'KTTD'];

    for (const year of uniqueYears) {
      for (const deptKey of uniqueDepts) {
        const dept = DEPT_MAPPING[deptKey] || DEPT_MAPPING['QLDA1'];
        const is2025 = year === 2025;
        const is2027 = year === 2027;
        
        let taskName = '';
        let deliverable = '';
        let startPeriod = 'Quý I';
        let endPeriod = 'Quý IV';
        
        if (is2025) {
          taskName = `Chuẩn bị đầu tư, khảo sát lập BCNCKT, GPMB dự án Trường Sơn Kim 1 (Năm 2025)`;
          deliverable = `Nghị quyết phê duyệt chủ trương, Quy hoạch 1/500, Hồ sơ thiết kế cơ sở`;
          startPeriod = 'Quý III';
          endPeriod = 'Quý IV';
        } else if (is2027) {
          taskName = `Công tác bảo hành công trình, vận hành chạy thử và tất toán tài khoản dự án Trường Sơn Kim 1 (Năm 2027)`;
          deliverable = `Biên bản nghiệm thu hết hạn bảo hành, Quyết định tất toán tài khoản`;
          startPeriod = 'Quý I';
          endPeriod = 'Quý III';
        } else {
          taskName = `Tổ chức lựa chọn nhà thầu, quản lý thi công xây dựng chính khối nhà học liên cấp Sơn Kim 1 (Năm 2026)`;
          deliverable = `Hồ sơ bản vẽ thi công phê duyệt, Các công trình hoàn thành, Bàn giao đưa vào sử dụng`;
          startPeriod = 'Quý I';
          endPeriod = 'Quý IV';
        }
        
        const annualId = uuidv4();
        const { error: apiErr } = await supabase.from('annual_plan_items').insert({
          id: annualId,
          plan_year: year,
          department_code: dept.code,
          department_name: dept.name,
          group_name: is2025 ? 'Giai đoạn Chuẩn bị đầu tư' : (is2027 ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thi công xây lắp'),
          task_name: taskName,
          deliverable: deliverable,
          start_period: startPeriod,
          end_period: endPeriod,
          frequency: 'one_time',
          project_id: PROJ_ID,
          responsible_text: `${dept.code} - ${dept.staffName}`,
          collaborating_text: 'Ban Giám đốc',
          collaborating_dept_codes: ['BGĐ']
        });

        if (apiErr) {
          console.error(`Lỗi tạo annual plan item năm ${year} cho ${dept.code}:`, apiErr.message);
        } else {
          annualMapping[`${year}_${dept.code}`] = annualId;
          console.log(`- Đã tạo KH Khung năm ${year} cho ${dept.name}`);
        }
      }
    }

    // 4. TẠO KẾ HOẠCH THÁNG (monthly_plans & monthly_plan_items)
    console.log('\n4. Đang tạo Kế hoạch Tháng (monthly_plans & monthly_plan_items)...');
    
    // Thu thập các tháng cần tạo dựa trên khoảng thời gian từ tháng 07/2025 đến tháng 08/2027
    const monthsToCreate = [];
    // 2025: 7 -> 12
    for (let m = 7; m <= 12; m++) monthsToCreate.push({ year: 2025, month: m });
    // 2026: 1 -> 12
    for (let m = 1; m <= 12; m++) monthsToCreate.push({ year: 2026, month: m });
    // 2027: 1 -> 12
    for (let m = 1; m <= 12; m++) monthsToCreate.push({ year: 2027, month: m });

    const monthlyPlanIds = {}; // Key: "year_month_dept" -> monthly_plan_id

    for (const item of monthsToCreate) {
      for (const deptKey of ['QLDA1', 'KHDT', 'KTTD']) {
        const dept = DEPT_MAPPING[deptKey];
        const planId = uuidv4();
        
        // Xác định trạng thái của kế hoạch tháng
        // Nếu kế hoạch trong quá khứ hoặc gần hiện tại thì 'published', nếu tương lai thì 'draft'
        const planDate = new Date(`${item.year}-${String(item.month).padStart(2, '0')}-01`);
        const status = planDate < CURRENT_DATE ? 'published' : 'draft';

        // Upsert header monthly_plans
        const { data: upsertData, error: mpErr } = await supabase.from('monthly_plans').upsert({
          plan_month: item.month,
          plan_year: item.year,
          department_code: dept.code,
          department_name: dept.name,
          status: status,
          notes: `Kế hoạch hoạt động tháng ${item.month}/${item.year} - Dự án Sơn Kim 1`
        }, { onConflict: 'plan_month,plan_year,department_code' }).select();

        if (mpErr) {
          console.error(`Lỗi tạo monthly plan ${item.month}/${item.year} cho ${dept.name}:`, mpErr.message);
        } else if (upsertData && upsertData.length > 0) {
          monthlyPlanIds[`${item.year}_${item.month}_${dept.code}`] = upsertData[0].id;
        }
      }
    }
    console.log(`- Đã tạo/Đồng bộ ${Object.keys(monthlyPlanIds).length} headers Kế hoạch Tháng.`);

    // 5. TẠO CÂY CÔNG VIỆC WBS CHI TIẾT (tasks & monthly_plan_items)
    console.log('\n5. Đang tạo chi tiết Tasks và Monthly Plan Items theo WBS...');
    let tasksCreatedCount = 0;
    let monthlyItemsCreatedCount = 0;
    let previousTaskId = null; // Dùng để xích predecessor tuần tự cho Gantt

    for (let i = 0; i < WBS_STEPS.length; i++) {
      const step = WBS_STEPS[i];
      const dept = DEPT_MAPPING[step.deptKey] || DEPT_MAPPING['QLDA1'];

      if (step.subtasks && step.subtasks.length > 0) {
        // A. NẾU BƯỚC CÓ CÔNG VIỆC CHI TIẾT:
        // Đưa các công việc chi tiết lên thành công việc chính độc lập (parent_id = null)
        const subCount = step.subtasks.length;
        console.log(`- Đang tách ${subCount} công việc chi tiết của Bước ${step.stepCode} lên thành công việc chính...`);

        for (let idx = 0; idx < subCount; idx++) {
          const st = step.subtasks[idx];
          const subTaskId = uuidv4();
          const subMpiId = uuidv4();

          // Phân bổ ngày
          const subDates = distributeDates(step.start, step.end, subCount, idx);
          const { status, progress, actualStart, actualEnd } = calculateStatusAndProgress(subDates.start, subDates.end, step.stepCode);

          // Phân bổ chi phí
          const baseCost = Math.floor(step.estimatedCost / subCount);
          const remainderCost = step.estimatedCost % subCount;
          const subCost = baseCost + (idx === subCount - 1 ? remainderCost : 0);

          // Lấy Kế hoạch tháng tương ứng dựa trên ngày bắt đầu
          const subStartDateObj = new Date(subDates.start);
          const subStartYear = subStartDateObj.getFullYear();
          const subStartMonth = subStartDateObj.getMonth() + 1;
          
          const mPlanId = monthlyPlanIds[`${subStartYear}_${subStartMonth}_${dept.code}`];
          const annualPlanId = annualMapping[`${subStartYear}_${dept.code}`];

          // 1. Tạo nhiệm vụ kế hoạch tháng (monthly_plan_items) trước để làm FK (set source_task_id: null ban đầu)
          if (mPlanId) {
            const { error: mpiErr } = await supabase.from('monthly_plan_items').insert({
              id: subMpiId,
              monthly_plan_id: mPlanId,
              annual_plan_item_id: annualPlanId || null,
              project_id: PROJ_ID,
              group_name: step.phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (step.phase === 'completion' || step.phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thi công xây lắp'),
              task_name: st.title,
              deliverable: step.outputDocument || `Sản phẩm hoàn thành nghiệm thu theo quy trình`,
              deadline_note: `Định hạn hoàn thành: ${subDates.end}`,
              due_date: subDates.end,
              status: status === 'done' ? 'completed' : 'planned',
              completion_result: status === 'done' 
                ? `Đã nghiệm thu hoàn thành: ${step.outputDocument}` 
                : `Đang triển khai thực hiện, tiến độ đạt ${progress}%`,
              sort_order: i * 10 + idx,
              source_task_id: null, // Đặt null để tránh vi phạm FK constraint
              source_type: 'from_project_task',
              collaborating_text: 'Ban Giám đốc',
              collaborating_dept_codes: ['BGĐ'],
              notes: `Ánh xạ tự động từ quy trình WBS QT-DA2B của Dự án`
            });

            if (mpiErr) {
              console.error(`Lỗi tạo monthly plan item cho công việc "${st.title}":`, mpiErr.message);
            } else {
              monthlyItemsCreatedCount++;
            }
          }

          // 2. Tạo công việc chính
          const { error: tErr } = await supabase.from('tasks').insert({
            id: subTaskId,
            task_type: 'project',
            project_id: PROJ_ID,
            workflow_id: WORKFLOW_ID,
            workflow_node_id: step.nodeId,
            title: st.title,
            description: step.description,
            status: status,
            priority: subCost > 1000000000 ? 'high' : 'medium',
            progress: progress,
            assignee_id: dept.staff,
            approver_id: 'NV003',
            start_date: subDates.start,
            due_date: subDates.end,
            actual_start_date: actualStart,
            actual_end_date: actualEnd,
            phase: step.phase,
            step_code: step.stepCode,
            legal_basis: step.legalBasis,
            output_document: step.outputDocument,
            sort_order: i * 10 + idx,
            predecessor_task_id: previousTaskId,
            monthly_plan_item_id: mPlanId ? subMpiId : null,
            metadata: {
              assignee_role: dept.code,
              is_wbs: true,
              is_elevated_subtask: true,
              node_id: step.nodeId
            }
          });

          if (tErr) {
            console.error(`Lỗi tạo elevated WBS Task cho "${st.title}":`, tErr.message);
          } else {
            tasksCreatedCount++;
            previousTaskId = subTaskId;

            // 3. Cập nhật ngược source_task_id vào monthly_plan_items
            if (mPlanId) {
              const { error: upErr } = await supabase.from('monthly_plan_items')
                .update({ source_task_id: subTaskId })
                .eq('id', subMpiId);
              if (upErr) {
                console.error(`Lỗi cập nhật source_task_id cho MPI "${st.title}":`, upErr.message);
              }
            }
          }
        }
      } else {
        // B. NẾU BƯỚC KHÔNG CÓ CÔNG VIỆC CHI TIẾT (ví dụ Bước 1.1):
        // Tạo một công việc duy nhất đại diện cho chính bước đó
        const taskId = uuidv4();
        const mpiId = uuidv4();

        const { status, progress, actualStart, actualEnd } = calculateStatusAndProgress(step.start, step.end, step.stepCode);

        const startDateObj = new Date(step.start);
        const startYear = startDateObj.getFullYear();
        const startMonth = startDateObj.getMonth() + 1;
        
        const mPlanId = monthlyPlanIds[`${startYear}_${startMonth}_${dept.code}`];
        const annualPlanId = annualMapping[`${startYear}_${dept.code}`];

        // 1. Tạo monthly plan item (set source_task_id: null ban đầu)
        if (mPlanId) {
          const { error: mpiErr } = await supabase.from('monthly_plan_items').insert({
            id: mpiId,
            monthly_plan_id: mPlanId,
            annual_plan_item_id: annualPlanId || null,
            project_id: PROJ_ID,
            group_name: step.phase === 'preparation' ? 'Giai đoạn Chuẩn bị đầu tư' : (step.phase === 'completion' || step.phase === 'closing' ? 'Giai đoạn Kết thúc dự án' : 'Giai đoạn Thực hiện xây lắp'),
            task_name: `Triển khai ${step.stepCode}: ${step.title}`,
            deliverable: step.outputDocument || `Sản phẩm hoàn thành nghiệm thu theo quy trình`,
            deadline_note: `Định hạn hoàn thành: ${step.end}`,
            due_date: step.end,
            status: status === 'done' ? 'completed' : 'planned',
            completion_result: status === 'done' 
              ? `Đã nghiệm thu hoàn thành: ${step.outputDocument}` 
              : `Đang triển khai thực hiện, tiến độ đạt ${progress}%`,
            sort_order: i * 10,
            source_task_id: null, // Đặt null để tránh vi phạm FK constraint
            source_type: 'from_project_task',
            collaborating_text: 'Ban Giám đốc',
            collaborating_dept_codes: ['BGĐ'],
            notes: `Ánh xạ tự động từ quy trình WBS QT-DA2B của Dự án`
          });

          if (mpiErr) {
            console.error(`Lỗi tạo monthly plan item cho Bước ${step.stepCode}:`, mpiErr.message);
          } else {
            monthlyItemsCreatedCount++;
          }
        }

        // 2. Tạo task
        const { error: tErr } = await supabase.from('tasks').insert({
          id: taskId,
          task_type: 'project',
          project_id: PROJ_ID,
          workflow_id: WORKFLOW_ID,
          workflow_node_id: step.nodeId,
          title: `${step.stepCode}: ${step.title}`,
          description: step.description,
          status: status,
          priority: step.estimatedCost > 1000000000 ? 'high' : 'medium',
          progress: progress,
          assignee_id: dept.staff,
          approver_id: 'NV003',
          start_date: step.start,
          due_date: step.end,
          actual_start_date: actualStart,
          actual_end_date: actualEnd,
          phase: step.phase,
          step_code: step.stepCode,
          legal_basis: step.legalBasis,
          output_document: step.outputDocument,
          sort_order: i * 10,
          predecessor_task_id: previousTaskId,
          monthly_plan_item_id: mPlanId ? mpiId : null,
          metadata: {
            assignee_role: dept.code,
            is_wbs: true,
            node_id: step.nodeId
          }
        });

        if (tErr) {
          console.error(`Lỗi tạo WBS Task ${step.stepCode}:`, tErr.message);
        } else {
          tasksCreatedCount++;
          previousTaskId = taskId;

          // 3. Cập nhật ngược source_task_id vào monthly_plan_items
          if (mPlanId) {
            const { error: upErr } = await supabase.from('monthly_plan_items')
              .update({ source_task_id: taskId })
              .eq('id', mpiId);
            if (upErr) {
              console.error(`Lỗi cập nhật source_task_id cho MPI Bước ${step.stepCode}:`, upErr.message);
            }
          }
        }
      }
    }

    console.log('\n=== TỔNG KẾT KẾT QUẢ SEED DỮ LIỆU WBS SƠN KIM 1 ===');
    console.log(`- Đã đăng ký Workflow Instance: 1 (QT-DA2B)`);
    console.log(`- Số lượng Kế hoạch Khung Năm (annual_plan_items) đã tạo: ${Object.keys(annualMapping).length}`);
    console.log(`- Số lượng Kế hoạch Tháng (monthly_plans) được chèn: ${Object.keys(monthlyPlanIds).length}`);
    console.log(`- Số lượng Nhiệm vụ Kế hoạch Tháng (monthly_plan_items) đã tạo: ${monthlyItemsCreatedCount}`);
    console.log(`- Số lượng WBS Tasks chính đã tạo: ${tasksCreatedCount}`);
    console.log('================================================================');

  } catch (err) {
    console.error('Đã xảy ra lỗi ngoài ý muốn trong quá trình thực hiện:', err);
  }
}

run();
