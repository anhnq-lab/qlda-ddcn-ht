/**
 * Xuất Quy chế quản lý kế hoạch công việc ra file DOCX
 * Format: Nghị định 30/2020/NĐ-CP
 *
 * Chạy: node scripts/generate_quyche_docx.cjs
 * Output: docs/QD_BanHanhQuyChe_QLKHCV.docx
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, PageBreak, HeadingLevel,
  Header, Footer, PageNumber, NumberFormat, TableLayoutType,
  VerticalAlign
} = require('docx');
const fs = require('fs');
const path = require('path');

// ─── Constants ──────────────────────────────────────────────────────────────

const FONT = 'Times New Roman';
const SIZE_13 = 26; // 13pt in half-points
const SIZE_12 = 24;
const SIZE_11 = 22;
const SIZE_14 = 28;

// A4 dimensions in DXA (twentieths of a point)
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN_TOP = 1418;    // 25mm
const MARGIN_BOTTOM = 1418; // 25mm
const MARGIN_LEFT = 1701;   // 30mm
const MARGIN_RIGHT = 1134;  // 20mm
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 9071
const LEFT_COL = 4200;
const RIGHT_COL = CONTENT_WIDTH - LEFT_COL; // 4871

const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };
const cellBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// Solid border for content tables
const solidBorder = { style: BorderStyle.SINGLE, size: 4, color: '000000' };
const solidBorders = { top: solidBorder, bottom: solidBorder, left: solidBorder, right: solidBorder };

// ─── Utility functions ──────────────────────────────────────────────────────

function text(t, opts = {}) {
  return new TextRun({
    text: t,
    font: FONT,
    size: opts.size || SIZE_13,
    bold: opts.bold || false,
    italics: opts.italic || false,
    color: opts.color || '000000',
  });
}

function para(content, opts = {}) {
  const children = typeof content === 'string' ? [text(content, opts)] : content;
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: {
      before: opts.before || 60,
      after: opts.after || 80,
      line: opts.line || 276,
      lineRule: 'auto',
    },
    indent: opts.noIndent ? {} : (opts.indent ? { firstLine: opts.indent } : { firstLine: 720 }),
    children,
  });
}

function emptyPara(before = 0, after = 0) {
  return new Paragraph({
    spacing: { before, after },
    children: [new TextRun({ text: '', font: FONT, size: SIZE_13 })],
  });
}

function heading(t, level = 'chapter', opts = {}) {
  const size = level === 'chapter' ? SIZE_14 : SIZE_13;
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: opts.before || 120, after: opts.after || 60, line: 276, lineRule: 'auto' },
    children: [text(t, { size, bold: true })],
  });
}

function dieuTitle(num, title) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 160, after: 80, line: 276, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: [text(`Điều ${num}. ${title}`, { bold: true })],
  });
}

function khoan(num, content, opts = {}) {
  const children = typeof content === 'string'
    ? [text(`${num}. `, { bold: opts.boldNum || false }), text(content)]
    : [text(`${num}. `, { bold: opts.boldNum || false }), ...content];
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 276, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children,
  });
}

function khoanBold(num, label, content) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 60, after: 60, line: 276, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: [
      text(`${num}. `, {}),
      text(label, { bold: true }),
      text(`: ${content}`),
    ],
  });
}

function diem(letter, content) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 40, line: 276, lineRule: 'auto' },
    indent: { left: 720, firstLine: 360 },
    children: [text(`${letter}) ${content}`)],
  });
}

function bullet(content, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 40, line: 276, lineRule: 'auto' },
    indent: { left: 720 + level * 360, firstLine: 0 },
    children: [text(`- ${content}`)],
  });
}

function canCu(content) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 40, after: 40, line: 276, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: [
      text('Căn cứ ', { italic: true }),
      text(content, { italic: true }),
    ],
  });
}

// ─── Table helpers ──────────────────────────────────────────────────────────

function makeHeaderTable() {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: LEFT_COL, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('UBND TỈNH HÀ TĨNH', { size: SIZE_12 })] }),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('BAN QLDA ĐTXD CÔNG TRÌNH', { size: SIZE_12, bold: true })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
                children: [text('DÂN DỤNG VÀ HẠ TẦNG KHU VỰC', { size: SIZE_12, bold: true })]
              }),
            ],
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: RIGHT_COL, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { size: SIZE_12, bold: true })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
                children: [text('Độc lập - Tự do - Hạnh phúc', { size: SIZE_13, bold: true })]
              }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: LEFT_COL, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [text('Số: ……/QĐ-BQLDA', { size: SIZE_13 })] })],
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: RIGHT_COL, type: WidthType.DXA },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 80 }, children: [text('Hà Tĩnh, ngày 26 tháng 5 năm 2026', { size: SIZE_13, italic: true })] })],
          }),
        ],
      }),
    ],
  });
}

function makeHeaderTableQC() {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: LEFT_COL, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('UBND TỈNH HÀ TĨNH', { size: SIZE_12 })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
                children: [text('BAN QLDA ĐTXD CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC', { size: SIZE_12, bold: true })]
              }),
            ],
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: RIGHT_COL, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM', { size: SIZE_12, bold: true })] }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
                children: [text('Độc lập - Tự do - Hạnh phúc', { size: SIZE_13, bold: true })]
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function makeFooterTable(noiNhan) {
  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder, insideH: noBorder, insideV: noBorder },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: LEFT_COL, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({ spacing: { after: 20 }, children: [text('Nơi nhận:', { size: SIZE_12, bold: true, italic: true })] }),
              ...noiNhan.map(line => new Paragraph({ spacing: { before: 20, after: 20 }, children: [text(`- ${line}`, { size: SIZE_11 })] })),
            ],
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: RIGHT_COL, type: WidthType.DXA },
            verticalAlign: VerticalAlign.TOP,
            children: [
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [text('GIÁM ĐỐC', { size: SIZE_13, bold: true })] }),
              emptyPara(),
              emptyPara(),
              emptyPara(),
              new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0 }, children: [text('(Chữ ký, đóng dấu)', { size: SIZE_13, italic: true })] }),
              emptyPara(),
              new Paragraph({ alignment: AlignmentType.CENTER, children: [text('……………………………', { size: SIZE_13, bold: true })] }),
            ],
          }),
        ],
      }),
    ],
  });
}

// Content table with solid borders
function makeContentTable(headers, rows, colWidths) {
  const totalWidth = colWidths.reduce((a, b) => a + b, 0);

  const headerRow = new TableRow({
    children: headers.map((h, i) => new TableCell({
      borders: solidBorders,
      width: { size: colWidths[i], type: WidthType.DXA },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 40, after: 40 },
        children: [text(h, { size: SIZE_12, bold: true })],
      })],
    })),
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => {
      const cellContent = typeof cell === 'object' ? cell : { text: cell, bold: false, align: i === 0 ? AlignmentType.CENTER : AlignmentType.LEFT };
      return new TableCell({
        borders: solidBorders,
        width: { size: colWidths[i], type: WidthType.DXA },
        verticalAlign: VerticalAlign.CENTER,
        children: [new Paragraph({
          alignment: cellContent.align || AlignmentType.LEFT,
          spacing: { before: 30, after: 30 },
          indent: { firstLine: 0 },
          children: [text(cellContent.text || cellContent, { size: SIZE_12, bold: cellContent.bold || false })],
        })],
      });
    }),
  }));

  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    layout: TableLayoutType.FIXED,
    borders: solidBorders,
    rows: [headerRow, ...dataRows],
  });
}

// ─── PHẦN 1: QUYẾT ĐỊNH ─────────────────────────────────────────────────────

function buildQuyetDinh() {
  return [
    makeHeaderTable(),
    emptyPara(200, 100),
    heading('QUYẾT ĐỊNH'),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 60, after: 60 },
      children: [text('Về việc ban hành Quy chế quản lý kế hoạch công việc trên phần mềm quản lý dự án', { bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000', space: 4 } },
      indent: { left: 3500, right: 3500 },
      children: [text('')],
    }),
    emptyPara(80, 40),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 120 },
      children: [text('GIÁM ĐỐC BAN QLDA ĐTXD CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC', { bold: true })],
    }),
    canCu('Luật Cán bộ, công chức ngày 13/11/2008 (sửa đổi, bổ sung năm 2019);'),
    canCu('Luật Đầu tư công số 58/2024/QH15 ngày 29/11/2024;'),
    canCu('Nghị định số 30/2020/NĐ-CP ngày 05/3/2020 của Chính phủ về công tác văn thư;'),
    canCu('Quyết định thành lập Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh;'),
    canCu('Quy chế tổ chức và hoạt động của Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh;'),
    para([text('Xét đề nghị', { italic: true }), text(' của Trưởng phòng Hành chính - Tổng hợp,')]),
    emptyPara(80, 40),
    heading('QUYẾT ĐỊNH:'),
    emptyPara(40, 20),
    para([
      text('Điều 1. ', { bold: true }),
      text('Ban hành kèm theo Quyết định này "Quy chế quản lý kế hoạch công việc trên phần mềm quản lý dự án" của Ban Quản lý Dự án Đầu tư Xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh.'),
    ]),
    para([
      text('Điều 2. ', { bold: true }),
      text('Quyết định này có hiệu lực kể từ ngày 01 tháng 6 năm 2026.'),
    ]),
    para([
      text('Điều 3. ', { bold: true }),
      text('Trưởng các phòng, Chánh Văn phòng và toàn thể cán bộ, viên chức, người lao động thuộc Ban chịu trách nhiệm thi hành Quyết định này./.'),
    ]),
    emptyPara(200, 40),
    makeFooterTable([
      'Như Điều 3;',
      'Lãnh đạo Ban (để chỉ đạo);',
      'Lưu: VT, HC-TH.',
    ]),
  ];
}

// ─── PHẦN 2: QUY CHẾ ────────────────────────────────────────────────────────

function buildQuyChe() {
  const sections = [];

  // Header
  sections.push(makeHeaderTableQC());
  sections.push(emptyPara(160, 60));
  sections.push(heading('QUY CHẾ'));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 40 },
    children: [text('Quản lý kế hoạch công việc trên phần mềm quản lý dự án', { bold: true })],
  }));
  sections.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 40, after: 120 },
    children: [text('(Ban hành kèm theo Quyết định số ……/QĐ-BQLDA ngày 26/5/2026 của Giám đốc Ban QLDA ĐTXD công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh)', { italic: true, size: SIZE_13 })],
  }));

  // ─── CHƯƠNG I ───
  sections.push(heading('Chương I'));
  sections.push(heading('QUY ĐỊNH CHUNG', 'chapter', { before: 0 }));

  // Điều 1
  sections.push(dieuTitle(1, 'Phạm vi điều chỉnh'));
  sections.push(para('Quy chế này quy định nguyên tắc, quy trình, trách nhiệm trong việc lập, giao, thực hiện, theo dõi, đánh giá và báo cáo kế hoạch công việc hàng năm và hàng tháng của các phòng, đơn vị trực thuộc Ban Quản lý Dự án Đầu tư Xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (sau đây gọi tắt là Ban) trên phần mềm quản lý dự án.'));

  // Điều 2
  sections.push(dieuTitle(2, 'Đối tượng áp dụng'));
  sections.push(khoan(1, 'Các phòng chuyên môn, nghiệp vụ thuộc Ban:'));
  sections.push(diem('a', 'Phòng Hành chính - Tổng hợp (HC-TH);'));
  sections.push(diem('b', 'Phòng Kế hoạch - Thẩm định (KTTD);'));
  sections.push(diem('c', 'Phòng Kế hoạch - Đấu thầu (KH-ĐT);'));
  sections.push(diem('d', 'Phòng Phát triển dịch vụ (PTDV);'));
  sections.push(diem('đ', 'Phòng Quản lý dự án 1 (QLDA1);'));
  sections.push(diem('e', 'Phòng Quản lý dự án 2 (QLDA2);'));
  sections.push(diem('g', 'Phòng Quản lý dự án 3 (QLDA3);'));
  sections.push(diem('h', 'Các phòng/đơn vị khác được thành lập trong quá trình kiện toàn tổ chức bộ máy của Ban.'));
  sections.push(khoan(2, 'Lãnh đạo Ban, Trưởng/Phó trưởng các phòng, toàn thể viên chức và người lao động đang công tác tại Ban.'));

  // Điều 3
  sections.push(dieuTitle(3, 'Nguyên tắc quản lý'));
  sections.push(khoanBold(1, 'Tập trung, thống nhất', 'Toàn bộ kế hoạch công việc hàng tháng phải được nhập vào phần mềm; không sử dụng song song các file Excel rời rạc làm báo cáo chính thức kể từ tháng 6/2026.'));
  sections.push(khoanBold(2, 'Minh bạch, công khai', 'Mọi công việc đều có người phụ trách rõ ràng, có hạn chót, có phân loại, có trạng thái cập nhật theo thời gian thực.'));
  sections.push(khoanBold(3, 'Trách nhiệm cá nhân', 'Cán bộ được giao việc chịu trách nhiệm về tiến độ, chất lượng và kết quả công việc được giao.'));
  sections.push(khoanBold(4, 'Kết hợp giao việc và tự đề xuất', 'Trưởng phòng giao việc trọng tâm; cán bộ chủ động bổ sung công việc phát sinh.'));
  sections.push(khoanBold(5, 'Phục vụ báo cáo', 'Dữ liệu trên phần mềm là nguồn duy nhất để tổng hợp Báo cáo giao ban tháng của Ban.'));

  // Điều 4
  sections.push(dieuTitle(4, 'Giải thích từ ngữ'));
  sections.push(khoanBold(1, 'Công việc (Task)', 'Một đầu việc cụ thể được giao hoặc đăng ký, có tên, người phụ trách, hạn chót, trạng thái.'));
  sections.push(khoanBold(2, 'Phân loại công việc (Category)', '13 nhóm cố định để gom công việc theo nghiệp vụ, phục vụ tổng hợp báo cáo (xem Điều 6).'));
  sections.push(khoanBold(3, 'Kế hoạch năm (Annual Plan)', 'Tập hợp các nhiệm vụ, đầu việc trọng tâm dự kiến triển khai trong năm của một phòng, được Lãnh đạo Ban phê duyệt và làm cơ sở phân công công việc tháng.'));
  sections.push(khoanBold(4, 'Kế hoạch tháng (Monthly Plan)', 'Tập hợp các công việc cụ thể dự kiến triển khai trong tháng của một phòng, được xây dựng trên cơ sở Kế hoạch năm và các yêu cầu phát sinh.'));
  sections.push(khoanBold(5, 'Báo cáo giao ban', 'Văn bản tổng hợp kết quả thực hiện công việc của các phòng trong tháng, do hệ thống tự sinh hoặc do AI hỗ trợ soạn thảo.'));
  sections.push(khoanBold(6, 'Trạng thái công việc', 'Một trong các giá trị: Chưa bắt đầu (todo), Đang thực hiện (in_progress), Hoàn thành (done), Chưa hoàn thành (incomplete).'));

  // ─── CHƯƠNG II ───
  sections.push(heading('Chương II'));
  sections.push(heading('PHÂN LOẠI CÔNG VIỆC', 'chapter', { before: 0 }));

  sections.push(dieuTitle(5, 'Mục đích phân loại'));
  sections.push(para('Phân loại công việc nhằm chuẩn hóa nội dung, thuận tiện tổng hợp, so sánh giữa các phòng và đánh giá toàn diện kết quả hoạt động của Ban.'));

  sections.push(dieuTitle(6, 'Danh mục 13 phân loại công việc'));
  sections.push(para('Mọi công việc khi nhập trên phần mềm bắt buộc phải chọn 01 trong 13 phân loại sau:'));

  const catHeaders = ['STT', 'Mã', 'Tên phân loại', 'Ví dụ minh họa'];
  const catWidths = [600, 1200, 2400, 4800];
  const catRows = [
    [{ text: '1', align: AlignmentType.CENTER }, 'dieu_hanh', 'Điều hành', 'Chỉ đạo, phân công, họp giao ban, đôn đốc'],
    [{ text: '2', align: AlignmentType.CENTER }, 'tham_dinh', 'Thẩm định/Phê duyệt', 'TĐ HSMT, KQLCNT, TKBVTC, BCNCKT, dự toán'],
    [{ text: '3', align: AlignmentType.CENTER }, 'thi_cong', 'Thi công/Giám sát', 'Triển khai thi công, giám sát hiện trường, TVGS'],
    [{ text: '4', align: AlignmentType.CENTER }, 'quyet_toan', 'Quyết toán', 'Quyết toán A-B, quyết toán hoàn thành'],
    [{ text: '5', align: AlignmentType.CENTER }, 'thanh_toan', 'Thanh toán', 'Kiểm tra/trình hồ sơ thanh toán, giải ngân'],
    [{ text: '6', align: AlignmentType.CENTER }, 'gpmb', 'Giải phóng mặt bằng', 'Bồi thường, di dời, tái định cư'],
    [{ text: '7', align: AlignmentType.CENTER }, 'dau_thau', 'Đấu thầu', 'Lập KHLCNT, HSMT, đánh giá HSDT, phê duyệt KQLCNT'],
    [{ text: '8', align: AlignmentType.CENTER }, 'dieu_chinh', 'Điều chỉnh', 'Điều chỉnh TK/dự toán/HĐ/giá, gia hạn, TMĐT'],
    [{ text: '9', align: AlignmentType.CENTER }, 'gop_y', 'Góp ý/Văn bản', 'Góp ý dự thảo TT/NĐ, soạn thảo văn bản, tham mưu'],
    [{ text: '10', align: AlignmentType.CENTER }, 'bao_cao', 'Báo cáo', 'Báo cáo tiến độ, báo cáo tháng, BC GSĐT'],
    [{ text: '11', align: AlignmentType.CENTER }, 'kiem_tra', 'Kiểm tra/QLCL', 'Kiểm tra hiện trường, hồ sơ QLCL, khắc phục bảo hành'],
    [{ text: '12', align: AlignmentType.CENTER }, 'ban_giao', 'Bàn giao/Nghiệm thu', 'Nghiệm thu, bàn giao CTSD, PCCC, kiểm tra SXD'],
    [{ text: '13', align: AlignmentType.CENTER }, 'khac', 'Khác', 'Công tác Đảng, đoàn thể, lưu kho, môi trường'],
  ];
  sections.push(emptyPara(60, 40));
  sections.push(makeContentTable(catHeaders, catRows, catWidths));
  sections.push(emptyPara(40, 20));
  sections.push(para('Danh mục này có thể được điều chỉnh, bổ sung theo Quyết định của Giám đốc khi có yêu cầu nghiệp vụ phát sinh.'));

  // ─── CHƯƠNG III ───
  sections.push(heading('Chương III'));
  sections.push(heading('QUY TRÌNH QUẢN LÝ KẾ HOẠCH CÔNG VIỆC', 'chapter', { before: 0 }));

  // Điều 7
  sections.push(dieuTitle(7, 'Lập kế hoạch công việc năm'));
  sections.push(khoanBold(1, 'Thời gian lập kế hoạch năm', 'Trước ngày 15 tháng 11 hàng năm, các phòng hoàn thành xây dựng Kế hoạch công việc năm tiếp theo và trình Lãnh đạo Ban phê duyệt; chậm nhất trước ngày 01 tháng 12 phải có Kế hoạch năm đã được phê duyệt để làm cơ sở xây dựng kế hoạch tháng từ tháng 1 năm sau.'));
  sections.push(khoanBold(2, 'Nội dung Kế hoạch năm', 'Kế hoạch năm của từng phòng bao gồm:'));
  sections.push(diem('a', 'Danh mục các nhiệm vụ trọng tâm, thường xuyên trong năm, được phân loại theo 13 nhóm quy định tại Điều 6;'));
  sections.push(diem('b', 'Kế hoạch tiến độ các dự án do phòng phụ trách theo từng quý/tháng;'));
  sections.push(diem('c', 'Các nhiệm vụ đột xuất, chuyên đề được giao từ cấp trên;'));
  sections.push(diem('d', 'Chỉ tiêu phấn đấu: số lượng công việc dự kiến hoàn thành, tỷ lệ hoàn thành mục tiêu.'));
  sections.push(khoanBold(3, 'Quy trình xây dựng', ''));
  sections.push(diem('a', 'Từng cán bộ tự đề xuất danh mục công việc năm thuộc phạm vi nhiệm vụ của mình, gửi Trưởng phòng trước ngày 05 tháng 11;'));
  sections.push(diem('b', 'Trưởng phòng tổng hợp, rà soát, bổ sung các nhiệm vụ trọng tâm của phòng, hoàn chỉnh Kế hoạch năm và trình Lãnh đạo Ban trước ngày 15 tháng 11;'));
  sections.push(diem('c', 'Lãnh đạo Ban xem xét, điều chỉnh và phê duyệt Kế hoạch năm của từng phòng; giao chỉ tiêu, định hướng ưu tiên cho năm kế hoạch.'));
  sections.push(khoanBold(4, 'Nhập liệu lên phần mềm', 'Sau khi được phê duyệt, Trưởng phòng hoặc cán bộ được ủy quyền nhập toàn bộ danh mục công việc năm lên phần mềm, thiết lập hạn chót theo quý/tháng tương ứng.'));
  sections.push(khoanBold(5, 'Điều chỉnh Kế hoạch năm', 'Trong trường hợp phát sinh nhiệm vụ mới hoặc thay đổi ưu tiên do yêu cầu khách quan, Trưởng phòng báo cáo Lãnh đạo Ban và điều chỉnh Kế hoạch năm trên phần mềm; việc điều chỉnh phải được ghi nhận lý do rõ ràng.'));

  // Điều 8
  sections.push(dieuTitle(8, 'Lập kế hoạch công việc tháng'));
  sections.push(khoanBold(1, 'Thời gian lập kế hoạch', 'Chậm nhất trong ngày làm việc đầu tiên của tháng, ngay sau buổi họp giao ban chào cờ đầu tháng của Ban, Trưởng phòng tổ chức rà soát, lập kế hoạch công việc tháng cho phòng và phân công đến từng cán bộ trên phần mềm trên cơ sở kết luận của Lãnh đạo Ban tại buổi giao ban.'));
  sections.push(khoanBold(2, 'Nguồn công việc đầu vào', ''));
  sections.push(diem('a', 'Kế hoạch công việc năm đã được Lãnh đạo Ban phê duyệt (nguồn chính);'));
  sections.push(diem('b', 'Kế hoạch dự án và bước tiến độ của các dự án đang triển khai;'));
  sections.push(diem('c', 'Văn bản chỉ đạo của Lãnh đạo Ban, UBND tỉnh, các cấp có thẩm quyền;'));
  sections.push(diem('d', 'Công việc phát sinh trong tháng ngoài kế hoạch năm.'));
  sections.push(khoanBold(3, 'Yêu cầu khi tạo công việc', 'Mỗi công việc khi tạo trên phần mềm phải đầy đủ các trường: Tên công việc; Phân loại công việc; Người phụ trách; Hạn hoàn thành; Mức độ ưu tiên; Dự án liên quan (nếu có); Kết quả dự kiến.'));
  sections.push(khoanBold(4, 'Nguyên tắc xác định kỳ báo cáo', 'Hệ thống tổng hợp báo cáo tháng dựa trên trường Hạn hoàn thành (Due Date). Vì vậy:'));
  sections.push(diem('a', 'Hạn hoàn thành phải nằm trong tháng báo cáo: mỗi công việc chỉ xuất hiện trong báo cáo của tháng mà nó có hạn hoàn thành;'));
  sections.push(diem('b', 'Công việc kéo dài nhiều tháng — tạo mới từng tháng: đối với đầu việc mang tính thường xuyên, kéo dài qua nhiều tháng, không sử dụng chung một công việc cho nhiều tháng báo cáo; mỗi tháng tạo công việc mới với tên ghi rõ mốc cụ thể và hạn hoàn thành vào ngày cuối tháng;'));
  sections.push(diem('c', 'Quy định này đảm bảo mỗi tháng báo cáo phản ánh đúng khối lượng thực hiện trong kỳ.'));

  // Điều 9
  sections.push(dieuTitle(9, 'Giao việc và tiếp nhận công việc'));
  sections.push(khoan(1, 'Sau khi tạo công việc, hệ thống tự động gửi thông báo đến cán bộ được giao.'));
  sections.push(khoan(2, 'Cán bộ được giao có trách nhiệm xem xét, xác nhận tiếp nhận trong vòng 24 giờ; trường hợp có vướng mắc về phạm vi/thời hạn phải báo cáo Trưởng phòng để điều chỉnh.'));
  sections.push(khoan(3, 'Cán bộ chủ động đăng ký bổ sung công việc phát sinh thuộc phạm vi nhiệm vụ trên phần mềm và báo cáo Trưởng phòng phê duyệt.'));

  // Điều 10
  sections.push(dieuTitle(10, 'Cập nhật tiến độ công việc'));
  sections.push(khoanBold(1, 'Tần suất cập nhật', 'Cán bộ phụ trách cập nhật tiến độ công việc ít nhất 01 lần/tuần vào các ngày làm việc cuối tuần.'));
  sections.push(khoanBold(2, 'Nội dung cập nhật', ''));
  sections.push(diem('a', 'Trạng thái: Đang thực hiện / Hoàn thành / Chưa hoàn thành;'));
  sections.push(diem('b', 'Tỷ lệ phần trăm hoàn thành (Progress);'));
  sections.push(diem('c', 'Kết quả thực hiện cụ thể (Completion Result) khi chuyển sang Hoàn thành hoặc Đang thực hiện;'));
  sections.push(diem('d', 'Lý do chưa hoàn thành (Incomplete Reason) khi chuyển sang Chưa hoàn thành;'));
  sections.push(diem('đ', 'Ghi chú bổ sung (Notes) nếu có.'));
  sections.push(khoanBold(3, 'Yêu cầu chất lượng cập nhật', 'Nội dung kết quả thực hiện phải cụ thể, định lượng (ví dụ: "Đã trình QĐ phê duyệt số 123/QĐ-UBND ngày 15/5/2026"), tuyệt đối không ghi chung chung kiểu "Đã làm", "Đang triển khai".'));

  // Điều 11
  sections.push(dieuTitle(11, 'Tổng hợp và rà soát hàng tháng'));
  sections.push(para('Để phục vụ buổi họp giao ban chào cờ đầu tháng của Ban (tổ chức vào ngày làm việc đầu tiên của tháng), việc tổng hợp dữ liệu công việc tháng trước được thực hiện theo lịch sau:'));
  sections.push(khoanBold(1, 'Trước 16 giờ 00 ngày 25 hàng tháng', 'Cán bộ phụ trách hoàn tất cập nhật kết quả thực hiện và trạng thái cuối cùng đối với các công việc dự kiến hoàn thành trong tháng; báo cáo Trưởng phòng các công việc có nguy cơ trễ hạn.'));
  sections.push(khoanBold(2, 'Trước 16 giờ 00 ngày làm việc cuối cùng của tháng', 'Trưởng phòng rà soát toàn bộ công việc tháng của phòng, đảm bảo:'));
  sections.push(diem('a', 'Mọi công việc đều có trạng thái cuối cùng;'));
  sections.push(diem('b', 'Công việc Chưa hoàn thành đều có lý do rõ ràng và phương án xử lý;'));
  sections.push(diem('c', 'Công việc Hoàn thành đều có kết quả thực hiện cụ thể, định lượng;'));
  sections.push(diem('d', 'Duyệt báo cáo phòng trên phần mềm và xuất Excel báo cáo phòng gửi Văn phòng Ban.'));
  sections.push(khoanBold(3, 'Trước 08 giờ 00 ngày làm việc đầu tiên của tháng mới', 'Văn phòng Ban tổng hợp dữ liệu từ phần mềm, sử dụng tính năng AI hỗ trợ soạn thảo Báo cáo giao ban tháng, trình Lãnh đạo Ban duyệt trước giờ chào cờ.'));
  sections.push(khoanBold(4, 'Sáng ngày làm việc đầu tiên của tháng', 'Tổ chức họp giao ban chào cờ; Văn phòng Ban trình bày Báo cáo giao ban; Lãnh đạo Ban kết luận, định hướng nhiệm vụ tháng mới.'));
  sections.push(khoanBold(5, 'Trường hợp ngày làm việc cuối cùng rơi vào ngày nghỉ', 'Việc duyệt báo cáo phòng được hoàn tất vào ngày làm việc liền kề trước đó; Văn phòng Ban căn cứ tình hình thực tế chủ động tổng hợp sớm.'));

  // ─── CHƯƠNG IV ───
  sections.push(heading('Chương IV'));
  sections.push(heading('TRÁCH NHIỆM CỦA CÁC CHỦ THỂ', 'chapter', { before: 0 }));

  sections.push(dieuTitle(12, 'Trách nhiệm của Lãnh đạo Ban'));
  sections.push(khoan(1, 'Chỉ đạo, kiểm tra việc thực hiện Quy chế trong toàn Ban.'));
  sections.push(khoan(2, 'Phê duyệt Kế hoạch công việc năm của từng phòng; giao chỉ tiêu và định hướng ưu tiên cho năm kế hoạch theo Điều 7.'));
  sections.push(khoan(3, 'Sử dụng dữ liệu trên phần mềm làm cơ sở đánh giá kết quả công tác hàng tháng, quý, năm của các phòng và cán bộ.'));
  sections.push(khoan(4, 'Phê duyệt Báo cáo giao ban tháng do Văn phòng Ban trình.'));

  sections.push(dieuTitle(13, 'Trách nhiệm của Trưởng phòng'));
  sections.push(khoan(1, 'Chủ trì xây dựng Kế hoạch công việc năm của phòng theo đúng thời hạn quy định tại Điều 7; tổ chức lập kế hoạch công việc tháng cho phòng đúng thời hạn quy định tại Điều 8.'));
  sections.push(khoan(2, 'Phân công công việc đến từng cán bộ một cách hợp lý, rõ ràng, có hạn chót và phân loại chính xác.'));
  sections.push(khoan(3, 'Theo dõi, đôn đốc cán bộ cập nhật tiến độ; xử lý kịp thời các vướng mắc trong phạm vi thẩm quyền.'));
  sections.push(khoan(4, 'Duyệt báo cáo phòng trước khi gửi tổng hợp.'));
  sections.push(khoan(5, 'Chịu trách nhiệm trước Lãnh đạo Ban về chất lượng, tính chính xác của dữ liệu công việc phòng mình trên phần mềm.'));

  sections.push(dieuTitle(14, 'Trách nhiệm của cán bộ, viên chức, người lao động'));
  sections.push(khoan(1, 'Tham gia đề xuất danh mục công việc năm theo Điều 7; cập nhật tiến độ công việc đầy đủ, trung thực, đúng thời hạn theo Điều 10.'));
  sections.push(khoan(2, 'Chủ động báo cáo Trưởng phòng các vướng mắc, đề xuất giải pháp.'));
  sections.push(khoan(3, 'Đăng ký bổ sung công việc phát sinh; không được tự ý xóa công việc đã được giao.'));

  sections.push(dieuTitle(15, 'Trách nhiệm của Văn phòng Ban'));
  sections.push(khoan(1, 'Quản trị tài khoản, phân quyền người dùng trên phần mềm.'));
  sections.push(khoan(2, 'Hướng dẫn, hỗ trợ kỹ thuật cho các phòng; tiếp nhận và xử lý các yêu cầu hỗ trợ trong vòng 01 ngày làm việc.'));
  sections.push(khoan(3, 'Tổng hợp dữ liệu, lập Báo cáo giao ban tháng trình Lãnh đạo Ban.'));
  sections.push(khoan(4, 'Lưu trữ Báo cáo giao ban tháng dưới dạng file điện tử và bản giấy theo quy định văn thư.'));

  // ─── CHƯƠNG V ───
  sections.push(heading('Chương V'));
  sections.push(heading('BÁO CÁO VÀ ĐÁNH GIÁ', 'chapter', { before: 0 }));

  sections.push(dieuTitle(16, 'Báo cáo định kỳ'));
  sections.push(khoanBold(1, 'Báo cáo phòng tháng', 'Mỗi phòng có 01 báo cáo trên phần mềm, xuất ra Excel theo mẫu chuẩn, gồm:'));
  sections.push(diem('a', 'Tổng hợp số liệu công việc theo phân loại;'));
  sections.push(diem('b', 'Chi tiết từng công việc: nội dung, dự án liên quan, kết quả thực hiện, cán bộ phụ trách, trạng thái, % hoàn thành, ghi chú.'));
  sections.push(khoanBold(2, 'Báo cáo giao ban Ban', 'Văn phòng Ban tổng hợp từ dữ liệu các phòng, gồm:'));
  sections.push(diem('a', 'Bảng tổng hợp các phòng (tổng CV, hoàn thành, đang làm, chưa HT, tỷ lệ);'));
  sections.push(diem('b', 'Chi tiết từng phòng theo phân loại;'));
  sections.push(diem('c', 'Phần văn bản hành chính (do AI hỗ trợ soạn thảo): Tổng quan, Giải ngân, Tiến độ dự án, Kết quả công việc các phòng, Tồn tại/vướng mắc, Kiến nghị, Kế hoạch tháng tới.'));

  // Điều 17
  sections.push(dieuTitle(17, 'Tiêu chí và thang điểm đánh giá'));
  sections.push(para([text('(Áp dụng theo khung tiêu chí tại Nghị định số ……/2026/NĐ-CP ngày ……/……/2026 của Chính phủ quy định khung tiêu chí đánh giá, xếp loại chất lượng đối với đơn vị sự nghiệp công lập và viên chức)', { italic: true, size: SIZE_13 })], { align: AlignmentType.CENTER, noIndent: true }));
  sections.push(khoanBold(1, 'Thang điểm', 'Áp dụng thang 100 điểm, cơ cấu thành 03 nhóm tiêu chí. Điểm đánh giá từng kỳ (tháng/quý) được tổng hợp trung bình làm cơ sở xếp loại chất lượng cuối năm.'));
  sections.push(khoan(2, [text('Tiêu chí đánh giá đối với phòng ban', { bold: true }), text(':')]));

  // Table tiêu chí phòng ban
  const deptHeaders = ['Nhóm', 'Tiêu chí', 'Điểm tối đa'];
  const deptWidths = [800, 6200, 1200];
  const deptRows = [
    [{ text: 'A', bold: true, align: AlignmentType.CENTER }, { text: 'Kết quả hoàn thành công việc', bold: true }, { text: '40', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'A1', align: AlignmentType.CENTER }, 'Tỷ lệ hoàn thành = CV done / Tổng CV × 100', { text: '20', align: AlignmentType.CENTER }],
    [{ text: 'A2', align: AlignmentType.CENTER }, 'Chất lượng kết quả (cập nhật đầy đủ, cụ thể, định lượng)', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'A3', align: AlignmentType.CENTER }, 'Tỷ lệ đúng hạn = CV HT đúng deadline / Tổng CV HT', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'B', bold: true, align: AlignmentType.CENTER }, { text: 'Kết quả giải ngân', bold: true }, { text: '40', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'B1', align: AlignmentType.CENTER }, 'Tỷ lệ giải ngân KH vốn = GN lũy kế / KH vốn năm × 100', { text: '25', align: AlignmentType.CENTER }],
    [{ text: 'B2', align: AlignmentType.CENTER }, 'Đạt mục tiêu giải ngân theo giao của UBND tỉnh, Bộ Tài chính', { text: '15', align: AlignmentType.CENTER }],
    [{ text: 'C', bold: true, align: AlignmentType.CENTER }, { text: 'Tiêu chí chung', bold: true }, { text: '20', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'C1', align: AlignmentType.CENTER }, 'Tuân thủ quy chế: cập nhật đúng hạn, đầy đủ trên phần mềm', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'C2', align: AlignmentType.CENTER }, 'Tính chủ động, đổi mới, sáng tạo trong thực hiện nhiệm vụ', { text: '10', align: AlignmentType.CENTER }],
  ];
  sections.push(emptyPara(40, 20));
  sections.push(makeContentTable(deptHeaders, deptRows, deptWidths));

  sections.push(khoan(3, [text('Cách chấm điểm nhóm A (hoàn thành công việc)', { bold: true }), text(':')]));
  sections.push(diem('a', 'A1 — Tỷ lệ hoàn thành: ≥95%: 20đ; 80–<95%: 16đ; 60–<80%: 12đ; 40–<60%: 8đ; <40%: 4đ.'));
  sections.push(diem('b', 'A2 — Chất lượng: LĐ Ban chấm dựa trên mức độ cụ thể, chính xác của "Kết quả thực hiện" trên phần mềm.'));
  sections.push(diem('c', 'A3 — Đúng hạn: ≥90%: 10đ; 70–<90%: 7đ; 50–<70%: 5đ; <50%: 3đ.'));

  sections.push(khoan(4, [text('Cách chấm điểm nhóm B (giải ngân)', { bold: true }), text(':')]));
  sections.push(diem('a', 'B1 — Tỷ lệ giải ngân KH vốn: ≥95%: 25đ; 80–<95%: 20đ; 60–<80%: 15đ; 40–<60%: 10đ; <40%: 5đ.'));
  sections.push(diem('b', 'B2 — Đạt mục tiêu UBND tỉnh/Bộ Tài chính: Đạt/vượt: 15đ; 80–<100%: 10đ; 60–<80%: 7đ; <60%: 3đ.'));
  sections.push(diem('c', 'Phòng không trực tiếp quản lý giải ngân (HC-TH, KH-ĐT): nhóm B quy đổi sang nhóm A (+25đ) và nhóm C (+15đ).'));

  sections.push(khoan(5, [text('Tiêu chí đánh giá đối với cá nhân', { bold: true }), text(':')]));
  const indivHeaders = ['Nhóm', 'Tiêu chí', 'Điểm tối đa'];
  const indivWidths = [800, 6200, 1200];
  const indivRows = [
    [{ text: 'A', bold: true, align: AlignmentType.CENTER }, { text: 'Kết quả hoàn thành công việc cá nhân', bold: true }, { text: '40', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'A1', align: AlignmentType.CENTER }, 'Tỷ lệ hoàn thành = CV cá nhân done / Tổng CV được giao', { text: '20', align: AlignmentType.CENTER }],
    [{ text: 'A2', align: AlignmentType.CENTER }, 'Chất lượng kết quả thực hiện (cụ thể, đúng yêu cầu NV)', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'A3', align: AlignmentType.CENTER }, 'Tỷ lệ đúng hạn', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'B', bold: true, align: AlignmentType.CENTER }, { text: 'Đóng góp giải ngân', bold: true }, { text: '30', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'B1', align: AlignmentType.CENTER }, 'Giải ngân dự án trực tiếp phụ trách', { text: '20', align: AlignmentType.CENTER }],
    [{ text: 'B2', align: AlignmentType.CENTER }, 'Đóng góp gián tiếp (HS thanh toán, thẩm định, phê duyệt)', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'C', bold: true, align: AlignmentType.CENTER }, { text: 'Tiêu chí chung (phẩm chất, kỷ luật, thái độ)', bold: true }, { text: '30', bold: true, align: AlignmentType.CENTER }],
    [{ text: 'C1', align: AlignmentType.CENTER }, 'Phẩm chất đạo đức nghề nghiệp, ý thức tổ chức kỷ luật', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'C2', align: AlignmentType.CENTER }, 'Tuân thủ quy chế: cập nhật phần mềm đúng hạn, trung thực', { text: '10', align: AlignmentType.CENTER }],
    [{ text: 'C3', align: AlignmentType.CENTER }, 'Tinh thần chủ động, đổi mới, sáng tạo; dám nghĩ dám làm', { text: '10', align: AlignmentType.CENTER }],
  ];
  sections.push(emptyPara(40, 20));
  sections.push(makeContentTable(indivHeaders, indivRows, indivWidths));

  sections.push(khoan(6, [text('Cách chấm điểm nhóm B đối với cá nhân', { bold: true }), text(': Tương tự khoản 4; cá nhân không phụ trách dự án thì nhóm B (30đ) quy đổi sang A (+15đ) và C (+15đ).')]));
  sections.push(khoan(7, [text('Thẩm quyền chấm điểm', { bold: true }), text(': Nhóm A: phần mềm tự tính; Nhóm B: Phòng KH-TĐ tổng hợp; Nhóm C: Trưởng phòng chấm cho cá nhân, LĐ Ban chấm cho phòng.')]));

  // Điều 18
  sections.push(dieuTitle(18, 'Mức xếp loại chất lượng'));
  sections.push(khoan(1, [text('Đối với phòng ban', { bold: true }), text(': Căn cứ tổng điểm đánh giá trung bình năm, xếp loại theo 04 mức:')]));

  const classHeaders = ['Mức xếp loại', 'Điểm', 'Điều kiện bổ sung'];
  const classWidths = [2800, 1000, 5200];
  const classRows = [
    ['Hoàn thành xuất sắc nhiệm vụ', { text: '≥ 90', align: AlignmentType.CENTER }, 'HT 100% CV đúng hạn; ≥30% vượt yêu cầu; GN ≥95% KH'],
    ['Hoàn thành tốt nhiệm vụ', { text: '70–<90', align: AlignmentType.CENTER }, 'HT ≥90% CV đúng hạn; GN ≥80% KH'],
    ['Hoàn thành nhiệm vụ', { text: '50–<70', align: AlignmentType.CENTER }, 'HT ≥70% CV; CV trễ hạn ≤20% tổng số'],
    ['Không hoàn thành nhiệm vụ', { text: '< 50', align: AlignmentType.CENTER }, 'HT <70% CV; hoặc GN <40% KH; hoặc có sai phạm'],
  ];
  sections.push(emptyPara(40, 20));
  sections.push(makeContentTable(classHeaders, classRows, classWidths));

  sections.push(khoan(2, [text('Đối với cá nhân', { bold: true }), text(': Áp dụng cùng 04 mức điểm; điều kiện bổ sung: HT xuất sắc phải có sáng kiến; Không HT nếu bị kỷ luật từ khiển trách trở lên.')]));
  sections.push(khoanBold(3, 'Tỷ lệ giới hạn', 'Số cá nhân xếp loại "Hoàn thành xuất sắc" không vượt quá 20% tổng số "Hoàn thành tốt". Trường hợp nổi trội: tối đa 25%.'));
  sections.push(khoanBold(4, 'Mức xếp loại Trưởng phòng', 'không được cao hơn mức xếp loại chất lượng của phòng.'));
  sections.push(khoanBold(5, 'Trường hợp đặc biệt', ''));
  sections.push(diem('a', 'Viên chức làm việc chưa đủ 06 tháng: không xếp loại năm đó;'));
  sections.push(diem('b', 'Chuyển công tác: đơn vị cũ gửi kết quả đánh giá cho đơn vị mới xếp loại;'));
  sections.push(diem('c', 'Bị kỷ luật Đảng/hành chính do suy thoái, vi phạm đạo đức: xếp loại "Không hoàn thành".'));

  // Điều 19
  sections.push(dieuTitle(19, 'Chu kỳ đánh giá và sử dụng kết quả'));
  sections.push(khoanBold(1, 'Chu kỳ đánh giá', ''));
  sections.push(diem('a', 'Hàng tháng (theo dõi): Phần mềm tự động tính điểm nhóm A; Trưởng phòng xác nhận trước giao ban;'));
  sections.push(diem('b', 'Hàng quý (đánh giá): LĐ Ban đánh giá toàn diện (A+B+C) cho phòng; Trưởng phòng đánh giá cho cá nhân; công khai kết quả;'));
  sections.push(diem('c', 'Cuối năm (xếp loại): Trước ngày 15/12; điểm năm = bình quân 12 kỳ tháng kết hợp đánh giá B, C.'));
  sections.push(khoanBold(2, 'Trình tự xếp loại cuối năm', ''));
  sections.push(diem('a', 'Cá nhân tự đánh giá, đề xuất mức xếp loại;'));
  sections.push(diem('b', 'Trưởng phòng tổ chức họp nhận xét, góp ý; lập biên bản;'));
  sections.push(diem('c', 'Trưởng phòng chấm điểm, đề xuất xếp loại, gửi LĐ Ban;'));
  sections.push(diem('d', 'LĐ Ban quyết định công nhận; thông báo bằng văn bản;'));
  sections.push(diem('đ', 'Công khai kết quả trên phần mềm và tại buổi tổng kết cuối năm.'));
  sections.push(khoanBold(3, 'Sử dụng kết quả', ''));
  sections.push(diem('a', 'Hàng tháng: căn cứ điều chỉnh phân công, đôn đốc, hỗ trợ;'));
  sections.push(diem('b', 'Hàng quý: căn cứ chi trả thu nhập tăng thêm, tiền thưởng;'));
  sections.push(diem('c', 'Cuối năm: căn cứ bình xét thi đua; xếp loại đảng viên; quy hoạch, bổ nhiệm; đào tạo; cho thôi việc nếu "Không HT" 02 năm liên tiếp.'));
  sections.push(khoanBold(4, 'Khiếu nại', 'Cá nhân kiến nghị trong 05 ngày; Trưởng phòng giải quyết; nếu chưa đồng ý gửi LĐ Ban trong 10 ngày.'));

  // ─── CHƯƠNG VI ───
  sections.push(heading('Chương VI'));
  sections.push(heading('XỬ LÝ VƯỚNG MẮC', 'chapter', { before: 0 }));

  sections.push(dieuTitle(20, 'Xử lý công việc chưa hoàn thành'));
  sections.push(khoan(1, 'Công việc Chưa hoàn thành phải nêu rõ nguyên nhân khách quan/chủ quan; trách nhiệm cụ thể.'));
  sections.push(khoan(2, 'Trưởng phòng quyết định chuyển công việc sang tháng kế tiếp (gia hạn) hoặc hủy bỏ; ghi rõ lý do trên phần mềm.'));
  sections.push(khoan(3, 'Trường hợp công việc liên quan đến nhiều phòng, Trưởng phòng chủ trì làm việc với các phòng liên quan và báo cáo Lãnh đạo Ban nếu vượt thẩm quyền.'));

  sections.push(dieuTitle(21, 'Sự cố hệ thống'));
  sections.push(khoan(1, 'Khi phần mềm gặp sự cố, cán bộ phản ánh ngay về Văn phòng Ban qua kênh hỗ trợ.'));
  sections.push(khoan(2, 'Văn phòng Ban phối hợp với đơn vị cung cấp giải pháp xử lý; trường hợp gián đoạn quá 04 giờ, các phòng tạm thời ghi nhận công việc bằng file Excel theo mẫu và đồng bộ lại lên phần mềm khi hệ thống khôi phục.'));

  sections.push(dieuTitle(22, 'Khiếu nại, kiến nghị'));
  sections.push(para('Cán bộ có quyền khiếu nại, kiến nghị về việc phân công, đánh giá công việc bằng văn bản gửi Trưởng phòng; trường hợp không đồng ý với cách giải quyết của Trưởng phòng, có quyền báo cáo Lãnh đạo Ban xem xét.'));

  // ─── CHƯƠNG VII ───
  sections.push(heading('Chương VII'));
  sections.push(heading('ĐIỀU KHOẢN THI HÀNH', 'chapter', { before: 0 }));

  sections.push(dieuTitle(23, 'Hiệu lực thi hành'));
  sections.push(khoan(1, 'Quy chế này có hiệu lực kể từ ngày 01 tháng 6 năm 2026.'));
  sections.push(khoan(2, 'Trong quá trình thực hiện, nếu phát sinh vướng mắc, các phòng phản ánh về Văn phòng Ban để tổng hợp, báo cáo Giám đốc xem xét, sửa đổi, bổ sung cho phù hợp.'));

  sections.push(dieuTitle(24, 'Tổ chức thực hiện'));
  sections.push(khoan(1, 'Trưởng các phòng chịu trách nhiệm phổ biến Quy chế này đến toàn thể cán bộ phòng mình và tổ chức thực hiện.'));
  sections.push(para([text('2. Văn phòng Ban có trách nhiệm theo dõi, kiểm tra việc thực hiện Quy chế; định kỳ 06 tháng/lần báo cáo Giám đốc về tình hình thực hiện./.')], {}));

  sections.push(emptyPara(200, 40));
  sections.push(makeFooterTable([
    'Lãnh đạo Ban (để chỉ đạo);',
    'Các phòng thuộc Ban (để thực hiện);',
    'Lưu: VT, HC-TH.',
  ]));

  return sections;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: SIZE_13 },
          paragraph: { spacing: { line: 276, lineRule: 'auto' } },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: 'portrait' },
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            pageNumbers: { start: 1 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ font: FONT, size: SIZE_13 })],
            })],
          }),
        },
        children: buildQuyetDinh(),
      },
      {
        properties: {
          page: {
            size: { width: PAGE_WIDTH, height: PAGE_HEIGHT, orientation: 'portrait' },
            margin: { top: MARGIN_TOP, bottom: MARGIN_BOTTOM, left: MARGIN_LEFT, right: MARGIN_RIGHT },
            pageNumbers: { start: 2 },
          },
        },
        headers: {
          default: new Header({
            children: [new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ font: FONT, size: SIZE_13, children: [PageNumber.CURRENT] }),
              ],
            })],
          }),
          first: new Header({ children: [emptyPara()] }), // page 2 header hidden
        },
        children: buildQuyChe(),
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(__dirname, '..', 'docs', 'QD_BanHanhQuyChe_QLKHCV.docx');
  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ Đã xuất file: ${outputPath}`);
  console.log(`   Kích thước: ${(buffer.length / 1024).toFixed(1)} KB`);
}

main().catch(err => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});
