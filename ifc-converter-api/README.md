# IFC → Fragments Converter API

Dịch vụ Node chuyển **IFC → Fragments (.frag)** cho viewer BIM (ThatOpen) ở phía client, theo **Phương án A**: convert một lần trên server lúc upload để **trình duyệt không phải parse IFC** khi xem (nhanh, không treo tab, không phụ thuộc heap WASM của trình duyệt).

`.frag` được tạo bằng `@thatopen/fragments` `IfcImporter` — **cùng builder** mà viewer dùng ở client, nên load trực tiếp bằng `FragmentsManager.core.load()`.

> An ninh dữ liệu (QCVN 12:2026/BCA · TT47): dịch vụ này chạy Node thuần, **self-host được trong nước** (FPT Cloud), không gửi dữ liệu ra nhà cung cấp nước ngoài. Converter "dumb" về lưu trữ — chỉ trả `.frag`/JSON về cho front-end tự đẩy lên Supabase Storage.

## Yêu cầu
- Node.js ≥ 18
- `@thatopen/fragments` ^3.3.6, `web-ifc` ^0.0.77, `three` ^0.183.2 (khớp phiên bản với app để `.frag` tương thích định dạng).

## Chạy local
```bash
cd ifc-converter-api
npm install
npm run dev        # hoặc: npm start
# Mặc định: http://localhost:3001
```
Front-end đọc URL qua biến môi trường `VITE_IFC_CONVERTER_URL` (mặc định `http://localhost:3001`).

## API

### Health
```
GET /            → thông tin service
GET /health      → { status: "healthy" }
```

### Convert IFC → Fragments (pipeline chính)
```
POST /convert-fragments      (multipart: file=<your.ifc>)
→ { jobId, statusUrl, downloadUrl }

GET  /status/:jobId          → { status, progress, stage, fragSize, ... }
GET  /download-fragments/:jobId   → tải file .frag
```

### Trích thuộc tính (tuỳ chọn, cho file lớn)
```
POST /extract-properties     (multipart: file=<your.ifc>)
GET  /download-properties/:jobId  → properties.json
GET  /download-spatial/:jobId     → spatial.json
```

### Dọn job
```
DELETE /job/:jobId
```

## Luồng tích hợp với app
1. App upload IFC lên Supabase Storage + tạo `bim_models` (`lib/bimStorage.uploadIFCFile`).
2. App gọi `POST /convert-fragments` (qua `services/bimConverterService.convertFragments`).
3. Poll `/status/:jobId` tới `completed`, tải `.frag`, đẩy lên Storage (`uploadFragments` → set `status='ready'`, `frag_path`).
4. Khi xem: viewer chỉ `fragments.core.load(.frag)` — **không parse IFC**.
5. Nếu converter offline → app để `status='converting'`; viewer parse client-side khi mở (đường lui).

## Deploy
Có thể deploy lên Railway/Render (xem `railway.toml`) hoặc self-host trên FPT Cloud cùng hệ thống (khuyến nghị cho TT47). Đặt `ALLOWED_ORIGINS` để giới hạn CORS theo domain app.

## License
MIT
