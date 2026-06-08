# CẤU TRÚC CHI TIẾT BẢNG PROJECTS (DỰ ÁN) - THIẾT KẾ MỚI

*Tài liệu mô tả cấu trúc bảng `projects` sau khi đã tinh lọc, loại bỏ các trường trùng lặp và các trường thông tin nhà thầu (các trường nhà thầu sẽ được quản lý tập trung thông qua bảng Gói thầu).*

> [!NOTE]
> Bảng `projects` sau khi tinh giản còn lại **80 cột** (Đã lược bỏ các cột quy mô, điều chỉnh và chi tiết chuyên ngành).

## I. Thông tin Cơ bản của bảng

- **Tên bảng vật lý:** `public.projects`
- **Khóa chính (Primary Key):** `project_id` (`text` / `UUID`)
- **Số lượng dự án hiện có:** **751** dòng

## II. Cấu trúc chi tiết các Cột dữ liệu (Dịch Tiếng Việt & Dữ liệu mẫu)

Dưới đây là danh sách đầy đủ các cột dữ liệu đề xuất giữ lại trong bảng `projects`:

| STT | Cột vật lý (Tiếng Anh) | Giải nghĩa (Tiếng Việt) | Kiểu dữ liệu | Cho phép Null? | Dữ liệu mẫu thực tế |
|---|---|---|---|---|---|
| 1 | `project_id` | **Mã định danh duy nhất dự án (Khóa chính)** | `text` | `NO` | `8156067` |
| 2 | `project_name` | **Tên dự án** | `text` | `NO` | `Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)…` |
| 3 | `project_number` | **Số quyết định/văn bản project** | `text` | `YES` | `*null*` |
| 4 | `group_code` | **Nhóm dự án (A, B, C...)** | `text` | `NO` | `C` |
| 5 | `total_investment` | **Tổng mức đầu tư dự án (VNĐ)** | `numeric` | `NO` | `90000000000` |
| 6 | `capital_source` | **Nguồn vốn chính (Ngân sách, vốn ODA...)** | `text` | `YES` | `*null*` |
| 7 | `status` | **Trường dữ liệu status** | `integer` | `NO` | `1` |
| 8 | `progress` | **Trường dữ liệu progress** | `numeric` | `YES` | `0` |
| 9 | `payment_progress` | **Trường dữ liệu payment_progress** | `numeric` | `YES` | `0` |
| 10 | `start_date` | **Ngày bắt đầu thực hiện** | `text` | `YES` | `*null*` |
| 11 | `expected_end_date` | **Ngày kết thúc dự kiến** | `text` | `YES` | `*null*` |
| 12 | `actual_end_date` | **Ngày actual_end** | `text` | `YES` | `*null*` |
| 13 | `location_code` | **Địa điểm xây dựng** | `text` | `YES` | `*null*` |
| 14 | `sector` | **Lĩnh vực/Ngành của dự án (ví dụ: Giao thông, Công nghiệp, Dân dụng...)** | `text` | `YES` | `*null*` |
| 15 | `stage` | **Giai đoạn dự án hiện tại (Chuẩn bị đầu tư, Thực hiện...)** | `text` | `YES` | `*null*` |
| 16 | `duration` | **Thời gian thực hiện (tháng/năm)** | `text` | `YES` | `2025-2027` |
| 17 | `objective` | **Mục tiêu đầu tư** | `text` | `YES` | `*null*` |
| 18 | `decision_number` | **Số quyết định phê duyệt dự án (QĐ đầu tư)** | `text` | `YES` | `1947/QĐ-UBND ngày 05/6/2025` |
| 19 | `decision_date` | **Ngày decision** | `text` | `YES` | `*null*` |
| 20 | `decision_authority` | **Cơ quan phê duyệt quyết định đầu tư** | `text` | `YES` | `*null*` |
| 21 | `decision_maker_id` | **Mã định danh/ID của người ký quyết định phê duyệt dự án** | `text` | `YES` | `*null*` |
| 22 | `approval_date` | **Ngày phê duyệt quyết định đầu tư** | `text` | `YES` | `*null*` |
| 23 | `competent_authority` | **Cấp quyết định đầu tư** | `text` | `YES` | `*null*` |
| 24 | `investor_name` | **Chủ đầu tư** | `text` | `YES` | `*null*` |
| 25 | `management_form` | **Hình thức quản lý dự án (ví dụ: Ban QLDA chuyên ngành, Ban QLDA khu vực, thuê Tư vấn...)** | `text` | `YES` | `*null*` |
| 26 | `construction_type` | **Loại công trình (Dân dụng, Giao thông...)** | `text` | `YES` | `*null*` |
| 27 | `construction_grade` | **Cấp công trình xây dựng (Cấp I, II, III...)** | `text` | `YES` | `*null*` |
| 28 | `requires_bim` | **Trường dữ liệu requires_bim** | `boolean` | `YES` | `false` |
| 29 | `bim_status` | **Trường dữ liệu bim_status** | `text` | `YES` | `*null*` |
| 30 | `cde_project_code` | **Trường dữ liệu cde_project_code** | `text` | `YES` | `*null*` |
| 31 | `national_project_code` | **Trường dữ liệu national_project_code** | `text` | `YES` | `8156067` |
| 32 | `is_synced` | **Trường dữ liệu is_synced** | `boolean` | `YES` | `false` |
| 33 | `last_sync_date` | **Ngày last_sync** | `text` | `YES` | `*null*` |
| 34 | `sync_error` | **Trường dữ liệu sync_error** | `text` | `YES` | `*null*` |
| 35 | `coordinates` | **Tọa độ GPS dự án** | `jsonb` | `YES` | `{"lat":18.38757,"lng":105.77632}` |
| 36 | `image_url` | **Đường dẫn ảnh đại diện dự án** | `text` | `YES` | `*null*` |
| 37 | `version` | **Trường dữ liệu version** | `text` | `YES` | `*null*` |
| 38 | `created_at` | **Thời gian tạo bản ghi** | `timestamp with time zone` | `NO` | `"2026-05-09T09:28:45.794Z"` |
| 39 | `updated_at` | **Thời gian cập nhật bản ghi** | `timestamp with time zone` | `NO` | `"2026-05-10T05:11:41.408Z"` |

| 47 | `investment_scale` | **Quy mô đầu tư** | `text` | `YES` | `Nâng cấp, mở rộng đường Thị - Sơn, huyện Can Lộc (giai đoạn 2) với tổng chiều dà...` |
| 48 | `management_board` | **Phòng chuyên môn/Phòng nghiệp vụ phụ trách dự án** | `integer` | `YES` | `2` |
| 49 | `decision_level_before_handover` | **Cấp quyết định trước khi bàn giao dự án** | `text` | `YES` | `H` |
| 50 | `old_investor` | **Chủ đầu tư cũ (nếu có chuyển giao)** | `text` | `YES` | `Huyện Can Lộc` |
| 51 | `transfer_decision` | **Quyết định chuyển giao/bàn giao dự án** | `text` | `YES` | `số 1947/QĐ-UBND ngày 05/06/2025; UBND huyện Can Lộc` |
| 52 | `current_status_code` | **Mã tình trạng hiện tại** | `integer` | `YES` | `3` |
| 53 | `policy_decision_level` | **Cấp quyết định chủ trương đầu tư** | `text` | `YES` | `*null*` |
| 54 | `policy_decision_number` | **Số QĐ phê duyệt chủ trương đầu tư** | `text` | `YES` | `*null*` |
| 55 | `policy_decision_date` | **Ngày ban hành QĐ chủ trương đầu tư** | `date` | `YES` | `*null*` |
| 56 | `policy_decision_authority` | **Cơ quan phê duyệt chủ trương đầu tư** | `text` | `YES` | `*null*` |
| 57 | `khv_info` | **Trường dữ liệu khv_info** | `jsonb` | `YES` | `{"total":1000000000}` |
| 58 | `implementation_tracking` | **Trường dữ liệu implementation_tracking** | `jsonb` | `YES` | `{"volumeRate":0,"totalVolume":0,"totalDisbursed":500000000}` |

| 61 | `planning_approval_number` | **Số quyết định/văn bản planning_approval** | `text` | `YES` | `*null*` |
| 62 | `planning_approval_date` | **Ngày planning_approval** | `date` | `YES` | `*null*` |
| 63 | `pccc_approval_number` | **Số quyết định/văn bản pccc_approval** | `text` | `YES` | `*null*` |
| 64 | `pccc_approval_date` | **Ngày pccc_approval** | `date` | `YES` | `*null*` |
| 65 | `pccc_approval_agency` | **Trường dữ liệu pccc_approval_agency** | `text` | `YES` | `*null*` |
| 66 | `env_approval_number` | **Số quyết định/văn bản env_approval** | `text` | `YES` | `*null*` |
| 67 | `env_approval_date` | **Ngày env_approval** | `date` | `YES` | `*null*` |
| 68 | `env_approval_type` | **Trường dữ liệu env_approval_type** | `text` | `YES` | `*null*` |
| 69 | `appraisal_result_number` | **Số quyết định/văn bản appraisal_result** | `text` | `YES` | `*null*` |
| 70 | `appraisal_result_date` | **Ngày appraisal_result** | `date` | `YES` | `*null*` |
| 71 | `appraisal_agency` | **Trường dữ liệu appraisal_agency** | `text` | `YES` | `*null*` |
| 72 | `cost_breakdown` | **Cơ cấu chi phí chi tiết (Xây lắp, thiết bị, GPMB...)** | `jsonb` | `YES` | `{}` |
| 73 | `design_appraisal_number` | **Số quyết định/văn bản design_appraisal** | `text` | `YES` | `*null*` |
| 74 | `design_appraisal_date` | **Ngày design_appraisal** | `date` | `YES` | `*null*` |
| 75 | `design_approval_number` | **Số quyết định/văn bản design_approval** | `text` | `YES` | `*null*` |
| 76 | `design_approval_date` | **Ngày design_approval** | `date` | `YES` | `*null*` |
| 77 | `design_approval_authority` | **Cơ quan/Cấp thẩm quyền design_approval** | `text` | `YES` | `*null*` |
| 78 | `construction_permit_number` | **Số quyết định/văn bản construction_permit** | `text` | `YES` | `*null*` |
| 79 | `construction_permit_date` | **Ngày construction_permit** | `date` | `YES` | `*null*` |
| 80 | `construction_permit_agency` | **Trường dữ liệu construction_permit_agency** | `text` | `YES` | `*null*` |
| 81 | `actual_start_date_construction` | **Trường dữ liệu actual_start_date_construction** | `date` | `YES` | `*null*` |
| 82 | `insurance_contract` | **Trường dữ liệu insurance_contract** | `text` | `YES` | `*null*` |
| 83 | `insurance_value` | **Trường dữ liệu insurance_value** | `numeric` | `YES` | `*null*` |
| 84 | `acceptance_result` | **Trường dữ liệu acceptance_result** | `text` | `YES` | `*null*` |
| 85 | `acceptance_date` | **Ngày acceptance** | `date` | `YES` | `*null*` |
| 86 | `handover_date` | **Ngày handover** | `date` | `YES` | `"2025-06-30T17:00:00.000Z"` |
| 87 | `tt24_completion_pct` | **Trường dữ liệu tt24_completion_pct** | `numeric` | `YES` | `*null*` |
| 88 | `province_code` | **Mã tỉnh/thành phố** | `text` | `YES` | `*null*` |
| 89 | `specialty_type` | **Loại chuyên ngành công trình** | `text` | `YES` | `transport_urban` |

| 91 | `leader_comment` | **Trường dữ liệu leader_comment** | `text` | `YES` | `*null*` |
| 92 | `created_by` | **Tài khoản/Người tạo bản ghi** | `uuid` | `YES` | `e74c0f20-d143-4b5c-bc88-dac4257140d0` |


## III. Bản ghi dữ liệu mẫu đầy đủ (JSON)

Dưới đây là một bản ghi mẫu đầy đủ sau khi lọc bỏ các cột đã lược bỏ:

```json
{
  "project_id": "8156067",
  "project_name": "Nâng cấp, mở rộng đường Thị Sơn, huyện Can Lộc (giai đoạn 2)…",
  "project_number": null,
  "group_code": "C",
  "total_investment": "90000000000",
  "capital_source": null,
  "status": 1,
  "progress": "0",
  "payment_progress": "0",
  "start_date": null,
  "expected_end_date": null,
  "actual_end_date": null,
  "location_code": null,
  "sector": null,
  "stage": null,
  "duration": "2025-2027",
  "objective": null,
  "decision_number": "1947/QĐ-UBND ngày 05/6/2025",
  "decision_date": null,
  "decision_authority": null,
  "decision_maker_id": null,
  "approval_date": null,
  "competent_authority": null,
  "investor_name": null,
  "management_form": null,
  "construction_type": null,
  "construction_grade": null,
  "requires_bim": false,
  "bim_status": null,
  "cde_project_code": null,
  "national_project_code": "8156067",
  "is_synced": false,
  "last_sync_date": null,
  "sync_error": null,
  "coordinates": {
    "lat": 18.38757,
    "lng": 105.77632
  },
  "image_url": null,
  "version": null,
  "created_at": "2026-05-09T09:28:45.794Z",
  "updated_at": "2026-05-10T05:11:41.408Z",

  "investment_scale": "Nâng cấp, mở rộng đường Thị - Sơn, huyện Can Lộc (giai đoạn 2) với tổng chiều dài 6.392,97m; có điểm đầu đấu nối tuyến đường Thị Sơn đã được đầu tư trong giai đoạn 1 tại Km0+993,44; điểm cuối giao với đường Quốc lộ 15B tại Km6+120.",
  "management_board": 2,
  "decision_level_before_handover": "H",
  "old_investor": "Huyện Can Lộc",
  "transfer_decision": "số 1947/QĐ-UBND ngày 05/06/2025; UBND huyện Can Lộc",
  "current_status_code": 3,
  "policy_decision_level": null,
  "policy_decision_number": null,
  "policy_decision_date": null,
  "policy_decision_authority": null,
  "khv_info": {
    "total": 1000000000
  },
  "implementation_tracking": {
    "volumeRate": 0,
    "totalVolume": 0,
    "totalDisbursed": 500000000
  },

  "planning_approval_number": null,
  "planning_approval_date": null,
  "pccc_approval_number": null,
  "pccc_approval_date": null,
  "pccc_approval_agency": null,
  "env_approval_number": null,
  "env_approval_date": null,
  "env_approval_type": null,
  "appraisal_result_number": null,
  "appraisal_result_date": null,
  "appraisal_agency": null,
  "cost_breakdown": {},
  "design_appraisal_number": null,
  "design_appraisal_date": null,
  "design_approval_number": null,
  "design_approval_date": null,
  "design_approval_authority": null,
  "construction_permit_number": null,
  "construction_permit_date": null,
  "construction_permit_agency": null,
  "actual_start_date_construction": null,
  "insurance_contract": null,
  "insurance_value": null,
  "acceptance_result": null,
  "acceptance_date": null,
  "handover_date": "2025-06-30T17:00:00.000Z",
  "tt24_completion_pct": null,
  "province_code": null,
  "specialty_type": "transport_urban",

  "leader_comment": null,
  "created_by": "e74c0f20-d143-4b5c-bc88-dac4257140d0"
}
```
