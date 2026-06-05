INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-ii-dieu-8','qcdgxl-chuong-ii','chuong-ii-dieu-8','Điều 8. Tiêu chí đánh giá, xếp loại (Thang điểm 100\)','1. Ý thức tổ chức kỷ luật, phẩm chất đạo đức lối sống **(tối đa 20 điểm)**

- Ý thức tổ chức kỷ luật; phẩm chất đạo đức, lối sống, tác phong, lề lối làm việc chuẩn mực **(tối đa 6 điểm).**

- Đoàn kết, thực hiện nguyên tắc tập trung dân chủ trong cơ quan **(tối đa 5 điểm).**

- Thực hiện hiện nghiêm quy tắc ứng xử trong các hoạt động của cơ quan **(tối đa 3 điểm).**

- Thực hiện nghiêm quy định văn hóa công sở, đạo đức công vụ của viên chức, người lao động **(tối đa 6 điểm).**

2. Kết quả thực hiện chức trách nhiệm vụ được giao **(tối đa 75 điểm)**

a) Năng lực và kỹ năng **(tối đa 20 điểm)**','text',2),('chuong-ii-dieu-9','qcdgxl-chuong-ii','chuong-ii-dieu-9','Điều 9. Mức xếp loại','1. Đối với cán bộ, viên chức, người lao động:

- Hoàn thành xuất sắc nhiệm vụ (xếp loại A1): Đạt từ 91 đến 100 điểm.

- Hoàn thành tốt nhiệm vụ (xếp loại A): Đạt từ 71 đến dưới 90 điểm.

- Hoàn thành nhiệm vụ (xếp loại B): Đạt từ 50 đến dưới 70 điểm.

- Không hoàn thành nhiệm vụ (xếp loại C): Dưới 50 điểm.','text',3),('chuong-ii-dieu-10','qcdgxl-chuong-ii','chuong-ii-dieu-10','Điều 10. Một số trường hợp cụ thể trong đánh giá, xếp loại','1. Không đánh giá, xếp loại trong tháng với cán bộ, viên chức, người lao động trong thời gian ký hợp đồng thử việc; nghỉ thai sản; nghỉ ốm, nghỉ do bị tai nạn lao động quá 20/22 ngày làm việc trong tháng; nghỉ việc riêng không hưởng lương quá 15/22 ngày làm việc trong tháng (kể cả nghỉ phép).

2. Đối với cán bộ, viên chức, người lao động có thời gian nghỉ việc từ trên 12 ngày làm việc trong tháng vì lý do ốm đau... thì mức xếp loại của tháng tối đa là hoàn thành nhiệm vụ (xếp loại B).

3. Đối với trường hợp cán bộ, viên chức, người lao động được cử đi đào tạo, bồi dưỡng (hệ không tập trung) mà thời gian làm việc thực tế trong tháng chưa đạt trên 50% số ngày làm việc của tháng thì vẫn thực hiện đánh giá nhưng mức xếp loại tối đa là hoàn thành nhiệm vụ (xếp loại B).

4. Đối với trường hợp viên chức, người lao động được cử đi học tập trung, thoát ly công việc cơ quan trên 30 ngày/năm làm việc thì căn cứ vào kết quả học tập để đánh giá, mức xếp loại tối đa là hoàn thành tốt nhiệm vụ (xếp loại A).

Trường hợp khi chưa có kết quả học tập, tạm thời xếp loại A và khi có kết quả học tập sẽ điều chỉnh xếp loại (Kết quả học tập đạt loại giỏi, loại khá thì xếp loại A; đạt loại trung bình thì xếp loại B; kết quả học tập dưới trung bình hoặc không hoàn thành khóa học thì xếp loại C).

5. Đối với cán bộ, viên chức, người lao động chịu trách nhiệm chính trong xử lý công việc trong tháng khi có văn bản phê bình của cơ quan cấp trên thì mức xếp loại của tháng tối đa là hoàn thành nhiệm vụ (xếp loại B); Lãnh đạo của phòng đó bị hạ 1 bậc xếp loại trong tháng.

6. Trường hợp xếp loại ở mức khác do Giám đốc Ban QLDA xem xét, đánh giá và quyết định.','text',4) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;