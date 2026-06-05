INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-ii-dieu-11','qcdgxl-chuong-ii','chuong-ii-dieu-11','Điều 11. Quy trình, các bước thực hiện đánh giá, xếp loại','Trên cơ sở chức năng nhiệm vụ của đơn vị, khuyến khích Lãnh đạo phòng xây dựng, sửa đổi, bổ sung, điều chỉnh Phiếu đánh giá, xếp loại hàng tháng dành cho cán bộ lãnh đạo quản lý; Phiếu đánh giá, xếp loại hàng tháng dành cho viên chức, người lao động đảm bảo phù hợp, sát với thực tế công tác chuyên môn của đơn vị nhằm đánh giá, xếp loại chính xác, khách quan, công bằng, đúng thực chất gắn với kết quả công tác chuyên môn của từng cá nhân.

- Bước 1: Viên chức, người lao động tự kiểm điểm, nhận mức xếp loại hàng tháng.

- Bước 2: Các phòng chuyên môn tổ chức nhận xét, đánh giá xếp loại viên chức, người lao động hàng tháng trên cơ sở tự xếp loại của các cá nhân. Tiến hành bỏ phiếu kín xếp loại để khẳng định sự tín nhiệm tại cuộc họp chuyên môn của phòng sau lễ chào cờ hàng tháng.

- Bước 3: Gửi kết quả xếp loại hàng tháng đến bộ phận tổng hợp thuộc phòng Hành chính - Tổng hợp trước 10h00 ngày 05 của tháng kế tiếp. Hồ sơ gồm: (i) Biên bản họp đánh giá, xếp loại của phòng; (ii) Danh sách tổng hợp kết quả đánh giá, xếp loại đối với viên chức, người lao động.

- Bước 4: Trên cơ sở kết quả đánh giá, xếp loại hàng tháng, Phòng Hành chính - Tổng hợp kiểm tra, rà soát, tham mưu, tổng hợp kết quả đánh giá, xếp loại trình Hội đồng thi đua, khen thưởng, đánh giá, xếp loại Ban QLDA.

- Bước 5: Ban Giám đốc tổ chức kiểm điểm, tự đánh giá, xếp loại các đ/c trong Ban Giám đốc; Hội đồng thi đua, khen thưởng, đánh giá, xếp loại Ban QLDA xem xét, quyết định kết quả đánh giá, xếp loại của Phó phòng, viên chức, người lao động; tổ chức nhận xét, đánh giá xếp loại các đ/c trong Ban giám đốc; các đ/c trưởng phòng; tập thể các phòng; tập thể Ban QLDA (bằng hình thức bỏ phiếu kín để khẳng định sự tín nhiệm). Mức xếp loại của các đ/c trong Ban giám đốc và lãnh đạo các phòng không cao hơn kết quả xếp loại của đơn vị mình được giao quản lý, phụ trách.

- Bước 6: Công khai kết đánh giá, xếp loại viên chức, người lao động tại Hội nghi viên chức và người lao động hoặc mạng thông tin nội bộ của cơ quan.

Các vấn đề khiếu nại về công tác đánh giá, xếp loại sẽ do Giám đốc Ban QLDA xem xét, quyết định theo quy định về phân cấp quản lý cán bộ.','text',5),('chuong-ii-dieu-12','qcdgxl-chuong-ii','chuong-ii-dieu-12','Điều 12. Khiếu nại, kiến nghị về kết quả xếp loại chất lượng.','1. Khi có cơ sở cho rằng kết quả xếp loại chất lượng không đúng quy định của pháp luật hoặc quy chế đánh giá của đơn vị, viên chức có quyền kiến nghị về kết quả xếp loại chất lượng đối với mình bằng văn bản đến Giám đốc Ban QLDA. Văn bản kiến nghị phải nêu rõ căn cứ kiến nghị, nội dung kiến nghị và đề xuất.

2. Thời hạn kiến nghị là 05 ngày kể từ ngày công khai kết quả xếp loại chất lượng.

3. Cấp có thẩm quyền có trách nhiệm giải quyết kiến nghị bằng hình thức đối thoại hoặc bằng văn bản trong thời hạn 10 ngày làm việc kể từ ngày nhận được kiến nghị.

4. Trình tự, thủ tục giải quyết kiến nghị về kết quả xếp loại chất lượng thực hiện theo quy định tại Điều này và theo quy chế của đơn vị. Không xem xét lại kết quả giải quyết kiến nghị.','text',6),('chuong-ii-dieu-13','qcdgxl-chuong-ii','chuong-ii-dieu-13','Điều 13. Sử dụng kết quả đánh giá, xếp loại hàng tháng để đánh giá xếp loại đối với cán bộ, viên chức, người lao động hằng năm.','Kết quả đánh giá xếp loại cả năm là kết quả của các tháng được xếp loại chia cho 12 tháng (tổng số điểm của các tháng xếp loại trong năm/12).','text',7) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;