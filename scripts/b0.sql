INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-i-ieu-1','qclv-chuong-i','Điều 1','Phạm vi điều chỉnh và đối tượng áp dụng','1. Phạm vi điều chỉnh

Quy chế này quy định nguyên tắc làm việc; chức năng, nhiệm vụ các phòng; quyền hạn, trách nhiệm, cách thức giải quyết công việc; chế độ làm việc; mối quan hệ công tác; trình tự giải quyết công việc của Ban QLDA đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (sau đây gọi tắt là Ban QLDA).

2. Đối tượng áp dụng

Quy chế này áp dụng đối với tất cả viên chức (VC), người lao động (NLĐ) của Ban QLDA.

Các tổ chức, cá nhân bên ngoài khi đến làm việc, liên hệ công tác với Ban QLDA phải chấp hành quy định của Ban QLDA và các quy định liên quan trong phạm vi trách nhiệm, quyền hạn của mình.','text',1),('chuong-i-ieu-2','qclv-chuong-i','Điều 2','Nguyên tắc làm việc','1. Ban QLDA làm việc theo nguyên tắc tập trung dân chủ, thực hiện chế độ thủ trưởng, đảm bảo sự chỉ đạo, điều hành thống nhất của Giám đốc đối với các lĩnh vực công tác của Ban QLDA, phát huy quyền làm chủ của VC, NLĐ gắn với sự lãnh đạo của Đảng và phát huy vai trò của các tổ chức đoàn thể trong cơ quan. Mọi hoạt động của Ban QLDA tỉnh đều phải tuân thủ quy định của pháp luật và Quy chế này. VC, NLĐ thuộc Ban QLDA phải xử lý và giải quyết công việc đúng phạm vi trách nhiệm, thẩm quyền;

2. Chấp hành nghiêm túc sự chỉ đạo của Giám đốc và Phó Giám đốc phụ trách. Khi giải quyết, xử lý công việc, đơn vị trình trực tiếp Phó Giám đốc phụ trách. Trường hợp Phó Giám đốc phụ trách đi vắng thì đơn vị trình Giám đốc (hoặc Phó Giám đốc được Giám đốc phân công) xem xét xử lý và đơn vị đó phải báo cáo kết quả xử lý cho Phó Giám đốc phụ trách khi Phó Giám đốc phụ trách có mặt ở cơ quan;

3. Trong phân công công việc, mỗi việc chỉ được giao một đơn vị, một cá nhân phụ trách và chịu trách nhiệm chính. Đơn vị, người đứng đầu đơn vị được giao công việc phải chịu trách nhiệm về tiến độ và kết quả công việc được phân công. Cấp trên không làm thay công việc của cấp dưới, tập thể không làm thay công việc của cá nhân và ngược lại;

4. Bảo đảm tuân thủ trình tự, thủ tục và thời hạn giải quyết công việc theo đúng quy định của pháp luật, chương trình, kế hoạch, lịch làm việc và Quy chế làm việc, trừ trường hợp đột xuất hoặc có yêu cầu khác của cơ quan cấp trên;

5. Bảo đảm phát huy năng lực và sở trường của VC, NLĐ, đề cao sự phối hợp công tác, trách nhiệm làm việc nhóm, phát huy trí tuệ tập thể và trao đổi thông tin trong giải quyết công việc và trong mọi hoạt động theo chức năng, nhiệm vụ, quyền hạn được pháp luật quy định;

6. Bảo đảm dân chủ, rõ ràng, minh bạch và hiệu quả trong mọi hoạt động.','text',2),('chuong-ii-ieu-3','qclv-chuong-ii','Điều 3','Cơ cấu tổ chức Ban QLDA','Theo Quyết định của UBND tỉnh: Số 1865/QĐ-UBND ngày 22/7/2025 về việc thành lập Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh và Ban Quản lý dự án đầu tư xây dựng công trình Nông nghiệp và Phát triển nông thôn tỉnh Hà Tĩnh trên cơ sở tách Ban Quản lý dự án đầu tư xây dựng công trình Nông nghiệp và Dân dụng tỉnh Hà Tĩnh, tổ chức bộ máy của Ban QLDA gồm:

\- Ban Giám đốc gồm có: Giám đốc và 03 Phó Giám đốc;

\- Các Phòng trực thuộc có 07 phòng: Hành chính – Tổng hợp, Kế hoạch – Đấu thầu, Kỹ thuật – Thẩm định, Quản lý dự án 1, Quản lý dự án 2, Quản lý dự án 3 và Phát triển dịch vụ.','text',1) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;