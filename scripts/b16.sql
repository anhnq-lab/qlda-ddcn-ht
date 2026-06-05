INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-ii-dieu-14','qcdgxl-chuong-ii','chuong-ii-dieu-14','Điều 14. Biểu mẫu','- Phụ lục 01: Phiếu đánh giá, xếp loại hàng tháng dành cho viên chức lãnh đạo, quản lý.

- Phụ lục 02: Phiếu đánh giá, xếp loại hàng tháng dành cho viên chức, người lao động.

- Phụ lục 03: Biên bản họp đánh giá, xếp loại hàng tháng của phòng chuyên môn.

- Phụ lục 04: Bảng tổng hợp kết quả đánh giá, xếp loại đối với cán bộ, viên chức, người lao động của phòng chuyên môn.

- Phụ lục 05: Bảng tổng hợp, rà soát kết quả đánh giá, xếp loại.

- Phụ lục 06: Báo cáo kết quả thực hiện nhiệm vụ và kế hoạch tháng …

- Phụ lục 07: Báo cáo tiến độ xử lý văn bản trên Hệ thống quản lý hồ sơ công việc; xử lý hồ sơ qua Bộ phận một cửa,

- Phụ lục 08: Báo cáo chấp hành kỷ luật, kỷ cương hành chính;.

#','text',8),('chuong-iii-dieu-15','qcdgxl-chuong-iii','chuong-iii-dieu-15','Điều 15. Trách nhiệm của viên chức, người lao động','1. Thực hiện nghiêm các quy định về đánh giá, xếp loại viên chức, người lao động. Phản ánh kịp thời việc thực hiện đánh giá, xếp loại tại các phòng chuyên môn chưa đúng hoặc chưa nghiêm túc với Ban Giám đốc Ban QLDA tỉnh.

2. Được quyền bảo lưu ý kiến về kết quả đánh giá, xếp loại hàng tháng của mình và có quyền phản ánh với Lãnh đạo Ban QLDA trong trường hợp không đồng ý với quyết định mức xếp loại đối với bản thân, nhưng phải chấp hành kết luận, nhận xét, đánh giá của cấp có thẩm quyền.

3. Xây dựng kế hoạch thực hiện hàng tháng, quý, cả năm; báo cáo kết quả thực hiện trong tháng. Nộp kế hoạch năm trong quý I; kế hoạch tháng trước ngày 05 của tháng; báo cáo kết quả thực hiện trong tháng trước ngày 25 hàng tháng qua Lãnh đạo phòng để tập hợp gửi phòng Kế hoạch - Đâu thầu tổng hợp, tham mưu báo cáo Ban QLDA.','text',1),('chuong-iii-dieu-16','qcdgxl-chuong-iii','chuong-iii-dieu-16','Điều 16. Trách nhiệm của các phòng chuyên môn','1. Trưởng phòng có trách nhiệm:

1) Phổ biến đến toàn thể viên chức, người lao động và thực hiện đúng các quy định tại Quy chế. Chịu trách nhiệm trước Giám đốc Ban QLDA tỉnh về toàn bộ quá trình thực hiện và kết quả đánh giá, xếp loại chất lượng của viên chức, người lao động thuộc thẩm quyền quản lý, phụ trách trực tiếp. Lập kế hoạch công tác hàng tháng, quý, năm của phòng trên cơ sở Kế hoạch khung hàng năm của Ban QLDA, nhiệm vụ chuyên môn của phòng và khối lượng công việc tồn đọng.','text',2) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;