INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-vi-ieu-28','qclv-chuong-vi','Điều 28','Cung cấp thông tin hoạt động trong nội bộ Ban QLDA tỉnh','Lãnh đạo Ban QLDA tỉnh và các phòng liên quan có trách nhiệm thông báo bằng hình thức thích hợp, thuận tiện để cán bộ Ban QLDA tỉnh nắm được những thông tin:

1. Chủ trương, chính sách của Đảng, Nhà nước, UBND tỉnh liên quan đến công việc của Ban QLDA tỉnh;

2. Tuyển dụng, đào tạo, khen thưởng, kỷ luật, nâng bậc lương, nâng ngạch, bổ nhiệm cán bộ;

3. Văn bản kết luận về việc giải quyết khiếu nại, tố cáo;

4. Nội quy, quy chế làm việc của Ban QLDA tỉnh và các văn bản liên quan khác.','text',4),('chuong-vi-ieu-29','qclv-chuong-vi','Điều 29','Thời gian làm việc, chế độ nghỉ phép, nghỉ việc riêng','1. Thời gian làm việc

Cán bộ, viên chức, người lao động có trách nhiệm:

a) Thực hiện nghiêm túc thời gian làm việc theo Luật Lao động và giờ hành chính theo thông báo của UBND tỉnh; giữ gìn vệ sinh nơi làm việc, bảo quản tài sản chung của cơ quan và tài sản được giao sử dụng; sẵn sàng đáp ứng mọi yêu cầu để hoàn thành tốt nhiệm vụ được giao;','text',5),('chuong-vi-ieu-30','qclv-chuong-vi','Điều 30','Đi công tác trong và ngoài nước','1. Khi Lãnh đạo Ban đi công tác, các phòng liên quan có trách nhiệm chuẩn bị nội dung, tài liệu phục vụ; Phòng Hành chính – Tổng hợp chuẩn bị điều kiện cần thiết và công tác hậu cần cho chuyến công tác;

2. Cán bộ, viên chức, người lao động đi công tác phải xây dựng chương trình, kế hoạch, trong đó ghi rõ nội dung, địa điểm (trong nước hoặc quốc gia/vùng lãnh thổ đến), thời gian công tác, trình Trưởng/Phụ trách phòng báo cáo Giám đốc xem xét, quyết định;

3. Trường hợp tham gia đoàn công tác liên ngành hoặc đoàn công tác của tỉnh, việc cử cán bộ, viên chức, người lao động tham gia phải đúng thành phần theo yêu cầu;

4. Việc đi công tác nước ngoài được thực hiện theo quy định của pháp luật và Quy chế quản lý thống nhất các hoạt động đối ngoại của tỉnh;

5. Chế độ công tác phí và các khoản chi khác thực hiện theo Quy chế chi tiêu nội bộ của Ban QLDA và quy định hiện hành của Nhà nước.','text',6) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;