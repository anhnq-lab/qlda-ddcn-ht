INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-vi-ieu-31','qclv-chuong-vi','Điều 31','Khen thưởng, kỷ luật, giải quyết khiếu nại, tố cáo liên quan cán bộ, viên chức, người lao động; công tác phòng chống tham nhũng','1. Khen thưởng, kỷ luật

a) Chế độ khen thưởng thường xuyên, đột xuất hàng năm thực hiện theo Quy chế thi đua, khen thưởng của Ban QLDA và theo quy định của pháp luật;','text',7),('chuong-vii-ieu-32','qclv-chuong-vii','Điều 32','Hiệu lực thi hành','1. Quy chế làm việc có hiệu lực từ ngày ban hành. Quy chế này được phổ biến, quán triệt đến toàn thể cán bộ, viên chức và người lao động thuộc Ban QLDA tỉnh để thực hiện.

2. Giám đốc, Phó Giám đốc, các phòng trực thuộc, các viên chức, người lao động Ban QLDA có trách nhiệm thực hiện Quy chế này. Giám đốc Ban QLDA có trách nhiệm phân công nhiệm vụ cụ thể cho các Phó Giám đốc, các phòng trực thuộc và viên chức, người lao động phù hợp với thực tiễn hoạt động của Ban QLDA đảm bảo đúng quy định của pháp luật và các quy định tại Quy chế này.

3. Trong quá trình tổ chức thực hiện, trường hợp các quy định tại Quy chế này có thay đổi do văn bản pháp luật mới ban hành hoặc có nội dung khác với quy định của cấp có thẩm quyền, thì thực hiện theo quy định của pháp luật hiện hành; hoặc nếu có vấn đề vướng mắc trưởng/phụ trách các phòng kịp thời báo cáo Lãnh đạo Ban QLDA (qua phòng Hành chính \- Tổng hợp) để nghiên cứu sửa đổi, bổ sung cho phù hợp./.

|  | BAN QLDA ĐẦU TƯ XÂY DỰNG  CÔNG TRÌNH DÂN DỤNG  VÀ HẠ TẦNG KHU VỰC |

| :---- | :---: |','text',1),('chuong-chung-dieu-1','qcdgxl-chung','chuong-chung-dieu-1','Điều 1. Ban hành kèm theo Quyết định này Quy chế Đánh giá, xếp loại hàng tháng đối với cán bộ, viên chức, người lao động thuộc Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh.','content: ( )','text',1) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;