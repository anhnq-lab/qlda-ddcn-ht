// utils/exportConstructionLog.ts
import { 
  Paragraph, 
  Table, 
  TableRow, 
  TableCell,
  WidthType
} from 'docx';

import { 
  AlignmentType, 
  exportDocx, 
  p, 
  pHeading, 
  pEmpty,
  pBody,
  headerCell, 
  dataCell, 
  buildDocumentHeader, 
  buildTitleBlock, 
  buildSignatureBlockTable,
  formatDateVN
} from './docxHelpers';
import { 
  DailyLogCombinedData, 
  ConstructionProgress 
} from '../types/construction.types';

export async function exportConstructionLogToDocx(
  projectName: string,
  data: DailyLogCombinedData
): Promise<void> {
  const { log, details, manpower, equipment } = data;
  const docDate = log.log_date;
  const fileName = `Nhat_ky_thi_cong_${docDate.replace(/-/g, '_')}.docx`;

  const children: (Paragraph | Table)[] = [];

  // 1. Build Government Document Header (NĐ 30/2020)
  const header = buildDocumentHeader(
    'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG\nỦY BAN NHÂN DÂN TỈNH HÀ TĨNH',
    '……/NKTC',
    docDate,
    'Hà Tĩnh'
  );
  children.push(...header);

  // 2. Build Title Block (NĐ 06/2021)
  const title = buildTitleBlock(
    'NHẬT KÝ THI CÔNG XÂY DỰNG CÔNG TRÌNH',
    `Dự án: ${projectName}`
  );
  children.push(...title);

  // 3. Section I: General Weather & Status
  children.push(pHeading('I. TÌNH HÌNH THỜI TIẾT & TRẠNG THÁI CÔNG TRƯỜNG'));
  
  children.push(pBody(`- Thời tiết: ${log.weather_desc || 'Nắng ráo'}`));
  children.push(pBody(`- Nhiệt độ trung bình: ${log.weather_temp || 30} °C`));
  children.push(pBody(`- Tình trạng gió: ${log.weather_wind || 'Gió nhẹ'}`));
  
  const statusLabel = log.construction_status === 'normal' ? 'Bình thường' : 
                      log.construction_status === 'suspended' ? 'Tạm dừng thi công' : 'Gián đoạn / Trì hoãn';
  children.push(pBody(`- Trạng thái thi công trong ngày: ${statusLabel}`));
  children.push(pEmpty(120));

  // 4. Section II: Manpower Details
  children.push(pHeading('II. TÌNH HÌNH NHÂN LỰC THI CÔNG TRÊN CÔNG TRƯỜNG'));
  
  // Table for Manpower
  const manpowerRows = [
    new TableRow({
      children: [
        headerCell('STT', 800),
        headerCell('Tổ đội / Vai trò nhân sự', 4500),
        headerCell('Số lượng (Người)', 2200),
        headerCell('Ghi chú', 2500)
      ]
    })
  ];

  if (manpower.length > 0) {
    manpower.forEach((m, idx) => {
      manpowerRows.push(
        new TableRow({
          children: [
            dataCell((idx + 1).toString(), AlignmentType.CENTER),
            dataCell(m.role_title),
            dataCell(m.quantity.toString(), AlignmentType.CENTER),
            dataCell(m.notes || '—')
          ]
        })
      );
    });
  } else {
    manpowerRows.push(
      new TableRow({
        children: [
          dataCell('—', AlignmentType.CENTER),
          dataCell('Không ghi nhận nhân lực thi công hằng ngày', AlignmentType.LEFT),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.LEFT)
        ]
      })
    );
  }

  const manpowerTable = new Table({
    rows: manpowerRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  children.push(manpowerTable);
  children.push(pEmpty(160));

  // 5. Section III: Equipment Details
  children.push(pHeading('III. TÌNH HÌNH MÁY MÓC, THIẾT BỊ THI CÔNG HIỆN TRƯỜNG'));

  const equipmentRows = [
    new TableRow({
      children: [
        headerCell('STT', 800),
        headerCell('Tên máy móc, thiết bị', 4000),
        headerCell('Số lượng (Cái)', 2000),
        headerCell('Thời gian hoạt động', 2200),
        headerCell('Trạng thái', 1500)
      ]
    })
  ];

  if (equipment.length > 0) {
    equipment.forEach((e, idx) => {
      const eqStatus = e.status === 'active' ? 'Hoạt động' : e.status === 'broken' ? 'Hỏng hóc' : 'Chờ việc';
      equipmentRows.push(
        new TableRow({
          children: [
            dataCell((idx + 1).toString(), AlignmentType.CENTER),
            dataCell(e.equipment_name),
            dataCell(e.quantity.toString(), AlignmentType.CENTER),
            dataCell(`${e.operating_hours || 8} giờ`, AlignmentType.CENTER),
            dataCell(eqStatus, AlignmentType.CENTER)
          ]
        })
      );
    });
  } else {
    equipmentRows.push(
      new TableRow({
        children: [
          dataCell('—', AlignmentType.CENTER),
          dataCell('Không ghi nhận máy móc hoạt động tại công trường', AlignmentType.LEFT),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER)
        ]
      })
    );
  }

  const equipmentTable = new Table({
    rows: equipmentRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  children.push(equipmentTable);
  children.push(pEmpty(160));

  // 6. Section IV: Construction Details
  children.push(pHeading('IV. CÁC HẠNG MỤC THI CÔNG & KHỐI LƯỢNG TRONG NGÀY'));

  const detailsRows = [
    new TableRow({
      children: [
        headerCell('STT', 800),
        headerCell('Nội dung công việc thi công', 3500),
        headerCell('Vị trí thi công', 1800),
        headerCell('Khối lượng thực hiện', 2000),
        headerCell('An toàn HSE / Chất lượng', 1900)
      ]
    })
  ];

  if (details.length > 0) {
    details.forEach((d, idx) => {
      const safetyText = d.safety_status === 'safe' ? 'An toàn' : d.safety_status === 'warning' ? 'Nhắc nhở' : 'Sự cố';
      const statusText = d.status === 'completed' ? 'Hoàn thành' : 'Đang thi công';
      const qualityText = `${statusText} / ${safetyText}`;

      detailsRows.push(
        new TableRow({
          children: [
            dataCell((idx + 1).toString(), AlignmentType.CENTER),
            dataCell(d.work_item),
            dataCell(d.location || 'Tại hiện trường'),
            dataCell(d.work_volume || 'Theo thiết kế'),
            dataCell(qualityText, AlignmentType.CENTER)
          ]
        })
      );
    });
  } else {
    detailsRows.push(
      new TableRow({
        children: [
          dataCell('—', AlignmentType.CENTER),
          dataCell('Không có dữ liệu hạng mục thi công chi tiết', AlignmentType.LEFT),
          dataCell('—', AlignmentType.LEFT),
          dataCell('—', AlignmentType.LEFT),
          dataCell('—', AlignmentType.CENTER)
        ]
      })
    );
  }

  const detailsTable = new Table({
    rows: detailsRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  children.push(detailsTable);
  children.push(pEmpty(160));

  // 7. Section V: Notes
  if (log.notes) {
    children.push(pHeading('V. Ý KIẾN CỦA BỘ PHẬN GIÁM SÁT / CHỈ HUY TRƯỞNG'));
    children.push(pBody(log.notes, { italics: true }));
    children.push(pEmpty(160));
  }

  // 8. Signature Block Table (NĐ 30/2020)
  const sigTable = buildSignatureBlockTable(
    ['Lưu hồ sơ hiện trường', 'Lưu VT Ban QLDA', 'Gửi Nhà thầu thi công'],
    'ĐẠI DIỆN GIÁM SÁT CHỦ ĐẦU TƯ',
    'Nguyễn Quang Linh' // Giám đốc Ban QLDA / Giám sát chính
  );
  
  // Custom right signer title for Contractor
  // We can push the signature row
  children.push(sigTable);

  // 9. Export document
  await exportDocx(fileName, [{ children }]);
}

export async function exportProgressReportToDocx(
  projectName: string,
  progressList: ConstructionProgress[]
): Promise<void> {
  const docDate = new Date().toISOString().split('T')[0];
  const fileName = `Bao_cao_tien_do_thi_cong_${docDate.replace(/-/g, '_')}.docx`;

  const children: (Paragraph | Table)[] = [];

  // Header
  const header = buildDocumentHeader(
    'BAN QUẢN LÝ DỰ ÁN ĐẦU TƯ XÂY DỰNG\nỦY BAN NHÂN DÂN TỈNH HÀ TĨNH',
    '……/BCTĐ',
    docDate,
    'Hà Tĩnh'
  );
  children.push(...header);

  // Title
  const title = buildTitleBlock(
    'BÁO CÁO TIẾN ĐỘ THI CÔNG XÂY DỰNG',
    `Dự án: ${projectName}`
  );
  children.push(...title);

  // Intro
  children.push(p('Kính gửi: Ban Giám đốc Ban Quản lý dự án Đầu tư xây dựng tỉnh Hà Tĩnh.', { italics: true, alignment: AlignmentType.CENTER }));
  children.push(pEmpty(120));
  
  children.push(pBody(`Căn cứ vào kế hoạch thi công được phê duyệt và tình hình triển khai thực tế của các nhà thầu tại công trường tính đến ngày ${formatDateVN(docDate)}, Bộ phận Giám sát xin báo cáo tổng hợp tiến độ vật lý dự án như sau:`));
  children.push(pEmpty(120));

  // WBS Table
  const progressRows = [
    new TableRow({
      children: [
        headerCell('STT', 600),
        headerCell('Hạng mục công việc / Đầu việc WBS', 3200),
        headerCell('Hợp đồng', 1400),
        headerCell('Trọng số', 1000),
        headerCell('Kế hoạch %', 1100),
        headerCell('Thực tế %', 1100),
        headerCell('Trạng thái', 1600)
      ]
    })
  ];

  progressList.forEach((p, idx) => {
    const statusText = p.status === 'completed' ? 'Hoàn thành' : 
                       p.status === 'in_progress' ? 'Đang thi công' : 
                       p.status === 'delayed' ? 'Chậm tiến độ' : 'Chờ làm';
    
    progressRows.push(
      new TableRow({
        children: [
          dataCell((idx + 1).toString(), AlignmentType.CENTER),
          dataCell(p.task_name),
          dataCell(p.contract_id || '—', AlignmentType.CENTER),
          dataCell(`${p.weight_percent}%`, AlignmentType.CENTER),
          dataCell(`${p.planned_percent}%`, AlignmentType.CENTER),
          dataCell(`${p.actual_percent}%`, AlignmentType.CENTER, true),
          dataCell(statusText, AlignmentType.CENTER)
        ]
      })
    );
  });

  if (progressList.length === 0) {
    progressRows.push(
      new TableRow({
        children: [
          dataCell('—', AlignmentType.CENTER),
          dataCell('Chưa có dữ liệu tiến độ thi công', AlignmentType.LEFT),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER),
          dataCell('—', AlignmentType.CENTER)
        ]
      })
    );
  }

  const table = new Table({
    rows: progressRows,
    width: { size: 100, type: WidthType.PERCENTAGE }
  });
  children.push(table);
  children.push(pEmpty(200));

  // Calculate stats
  const totalWeight = progressList.reduce((sum, item) => sum + Number(item.weight_percent || 0), 0);
  const actualProgress = progressList.reduce((sum, item) => {
    const weight = Number(item.weight_percent || 0);
    const actual = Number(item.actual_percent || 0);
    return sum + (weight * actual) / 100;
  }, 0);
  const plannedProgress = progressList.reduce((sum, item) => {
    const weight = Number(item.weight_percent || 0);
    const planned = Number(item.planned_percent || 0);
    return sum + (weight * planned) / 100;
  }, 0);

  const actPct = totalWeight > 0 ? (actualProgress / (totalWeight / 100)) : 0;
  const planPct = totalWeight > 0 ? (plannedProgress / (totalWeight / 100)) : 0;
  const slippage = actPct - planPct;

  children.push(pHeading('VĂN BẢN ĐÁNH GIÁ TIẾN ĐỘ CHUNG:'));
  children.push(pBody(`1. Lũy kế tiến độ thực tế đạt được: ${actPct.toFixed(2)}%`));
  children.push(pBody(`2. Lũy kế tiến độ kế hoạch đề ra: ${planPct.toFixed(2)}%`));
  
  const evalText = slippage >= 0 
    ? `Tiến độ thực tế đang vượt chỉ tiêu kế hoạch +${slippage.toFixed(2)}%, các hạng mục chính đều đảm bảo chất lượng và an toàn lao động.`
    : `Tiến độ thực tế đang chậm trễ so với kế hoạch đề ra ${Math.abs(slippage).toFixed(2)}%. Yêu cầu các nhà thầu tăng cường nhân lực, máy móc và tổ chức thi công tăng ca bù tiến độ gấp.`;
  children.push(pBody(`3. Nhận xét đánh giá: ${evalText}`));
  children.push(pEmpty(200));

  // Signatures
  const sigTable = buildSignatureBlockTable(
    ['Lưu hồ sơ tiến độ Ban QLDA', 'Gửi Ban Giám đốc báo cáo'],
    'ĐẠI DIỆN BỘ PHẬN GIÁM SÁT',
    'Nguyễn Quang Linh'
  );
  children.push(sigTable);

  await exportDocx(fileName, [{ children }]);
}
