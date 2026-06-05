INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-v-ieu-22','qclv-chuong-v','Điều 22','Quan hệ giữa Lãnh đạo Ban QLDA đối với các phòng thuộc Ban QLDA','1. Giám đốc, Phó Giám đốc phụ trách lĩnh vực/các phòng, định kỳ hoặc đột xuất họp với lãnh đạo các phòng hoặc làm việc với từng phòng, để trực tiếp nghe báo cáo tình hình, chỉ đạo việc thực hiện chương trình, kế hoạch công tác của các phòng thuộc Ban QLDA;

2. Trưởng/phụ trách các phòng có trách nhiệm báo cáo kịp thời với Ban Giám đốc Ban QLDA về kết quả thực hiện, kiến nghị các vấn đề cần giải quyết liên quan đến hoạt động của phòng mình và những khó khăn vướng mắc cần tháo gỡ, kiến nghị với cấp có thẩm quyền về sửa đổi, điều chỉnh cơ chế chính sách.','text',7),('chuong-v-ieu-23','qclv-chuong-v','Điều 23','Quan hệ giữa các phòng trực thuộc Ban QLDA','1. Trưởng các phòng được giao chủ trì giải quyết các vấn đề có liên quan với các phòng khác phải trao đổi ý kiến với các phòng đó. Trưởng/phụ trách các phòng được xin ý kiến có trách nhiệm trả lời theo đúng yêu cầu của phòng chủ trì;

2. Theo phân công của Ban Giám đốc Ban QLDA, Trưởng/phụ trách các phòng có trách nhiệm phối hợp thực hiện các dự án, chương trình của Ban QLDA. Đối với những vấn đề liên quan đến nhiều phòng mà vượt quá thẩm quyền giải quyết hoặc không đủ điều kiện thì Trưởng/Phụ trách phòng chủ trì báo cáo, đề xuất với lãnh đạo Ban QLDA xem xét quyết định;

3. Thực hiện theo nguyên tắc: Công việc thuộc phạm vi chức năng, nhiệm vụ của phòng nào thì phòng đó chủ trì, tham mưu; chủ động phối hợp với các phòng có liên quan để thực hiện chức năng, nhiệm vụ, quyền hạn được giao. Các phòng liên quan có trách nhiệm phối hợp, trường hợp có ý kiến khác nhau thì phòng chủ trì báo cáo Ban Giám đốc xem xét, quyết định;

4. Tuân thủ đúng Quy chế làm việc của Ban QLDA; việc phối hợp có thể bằng văn bản hoặc qua trao đổi trực tiếp đảm bảo yêu cầu về chuyên môn, chất lượng và tiến độ thời gian trong quá trình phối hợp;

5. Bảo đảm kỷ luật, kỷ cương trong hoạt động phối hợp, đề cao trách nhiệm cá nhân của Trưởng/Phụ trách phòng chủ trì và cán bộ, viên chức, người lao động của phòng được phối hợp.','text',8),('chuong-v-ieu-24','qclv-chuong-v','Điều 24','Các mối quan hệ khác','1. Quan hệ làm việc giữa Giám đốc Ban QLDA với các Bộ, ngành Trung ương, Tỉnh ủy, Hội đồng nhân dân, Ủy ban nhân dân tỉnh, các cơ quan tổ chức chính trị \- xã hội, tổ chức xã hội nghề nghiệp thuộc ngành lĩnh vực thực hiện theo quy định của pháp luật và các quy định có liên quan;

2. Quan hệ giữa Lãnh đạo Ban QLDA tỉnh với Đảng ủy Ban QLDA tỉnh thực hiện theo quy định của Đảng và Quy chế làm việc của Ban Chấp hành Đảng bộ Ban QLDA;

3. Quan hệ giữa Lãnh đạo Ban QLDA tỉnh với Công đoàn Ban QLDA tỉnh được thực hiện theo Quy chế phối hợp giữa Ban Giám đốc với Công đoàn Ban QLDA tỉnh;

4. Quan hệ giữa Lãnh đạo Ban QLDA tỉnh với các tổ chức đoàn thể và cán bộ, viên chức, người lao động trong Ban QLDA:

a) Lãnh đạo Ban QLDA tỉnh tạo điều kiện thuận lợi cho Cấp ủy, các tổ chức đoàn thể hoạt động theo đúng Điều lệ, tôn chỉ mục đích; phối hợp với cấp ủy và các tổ chức quần chúng tạo điều kiện thuận lợi cho cán bộ làm việc, nâng cao trình độ chính trị, chuyên môn nghiệp vụ trong đơn vị, bảo đảm thực hiện Quy chế dân chủ trong hoạt động của cơ quan, xây dựng nề nếp văn hóa công sở và kỷ luật, kỷ cương hành chính;','text',9) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;