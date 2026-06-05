INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-i-dieu-5','qcdgxl-chuong-i','chuong-i-dieu-5','Điều 5. Thời hạn định kỳ đánh giá, xếp loại','1. Đối với Ban QLDA tỉnh và các phòng chuyên môn: Thực hiện hằng quý/năm.

2. Đối với viên chức, người lao động: Thực hiện hàng tháng làm cơ sở để đánh giá, xếp loại chất lượng hàng năm.

Đối với Giám đốc, Phó giám đốc Ban QLDA được đánh giá xếp loại hàng quý. Căn cứ vào kết quả đánh giá, xếp loại hàng quý các phòng được giao phụ trách của các Phó Giám đốc và kết quả đánh giá, xếp loại hàng quý của Ban QLDA tỉnh để đề xuất UBND tỉnh đánh giá xếp loại Giám đốc, Phó giám đốc.','text',5),('chuong-i-dieu-6','qcdgxl-chuong-i','chuong-i-dieu-6','Điều 6. Mức đánh giá, xếp loại chất lượng','Cán bộ, viên chức, người lao động được đánh giá, xếp loại chất lượng theo 4 mức:

a) Hoàn thành xuất sắc nhiệm vụ (Loại A1);','text',6),('chuong-ii-dieu-7','qcdgxl-chuong-ii','chuong-ii-dieu-7','Điều 7. Thẩm quyền đánh giá, xếp loại chất lượng','- UBND tỉnh xếp loại đối với Giám đốc, Phó Giám đốc trên cơ sở nhận xét, đánh giá của Hội đồng thi đua khen thưởng, đánh giá, xếp loại Ban QLDA.

- Hội đồng thi đua khen thưởng, đánh giá, xếp loại Ban QLDA xem xét, quyết định kết quả đánh giá, xếp loại viên chức, người lao động; tổ chức nhận xét, đánh giá xếp loại các trưởng phòng, tập thể các phòng; nhận xét, đánh giá Giám đốc, Phó Giám đốc, tập thể Ban QLDA làm cơ sở đề xuất UBND tỉnh xếp loại.

- Trưởng phòng đánh giá, xếp loại hàng tháng đối với phó phòng, viên chức và người lao động thuộc đơn vị.

- Cán bộ, viên chức, người lao động tự đánh giá, xếp loại hàng tháng đối với bản thân.','text',1) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;