INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-iii-dieu-17','qcdgxl-chuong-iii','chuong-iii-dieu-17','Điều 17. Trách nhiệm của phòng Hành chính \- Tổng hợp','1. Tổng hợp thông tin, kết quả chấm điểm thi đua, xếp loại cán bộ, viên chức, người lao động tham mưu, báo cáo, trình Hội đồng thi đua, khen thưởng, đánh giá, xếp loại Ban QLDA xem xét, quyết định. Thông báo công khai kết quả xếp loại tại Hội nghị viên chức, người lao động hoặc qua hệ thống thông tin nội bộ.

2. Phòng Hành chính – Tổng hợp căn cứ kết quả xếp loại hàng năm thực hiện tham mưu chế độ tiền thưởng, chi thu nhập tăng thêm cho viên chức, người lao động theo đúng quy định hiện hành.

3. Lưu trữ đầy đủ hồ sơ, tài liệu về đánh giá, xếp loại theo quy định.','text',3),('chuong-iii-dieu-18','qcdgxl-chuong-iii','chuong-iii-dieu-18','Điều 18. Điều khoản thi hành','1. Lãnh đạo các phòng và cán bộ, viên chức, người lao động thuộc Ban quản lý dự án có trách nhiệm triển khai, tổ chức thực hiện Quy chế này kể từ ngày có hiệu lực.

2. Trong quá trình tổ chức thực hiện, nếu có vấn đề vướng mắc trưởng các phòng kịp thời tổng hợp, báo cáo lãnh đạo Ban quan lý dự án (qua phòng Hành chính - Tổng hợp) để kịp thời xem xét, điều chỉnh, bổ sung cho phù hợp./.

|  | BAN QLDA ĐẦU TƯ XÂY DỰNG  CÔNG TRÌNH DÂN DỤNG  VÀ HẠ TẦNG KHU VỰC |

| :---- | :---: |

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#

#','text',4) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;