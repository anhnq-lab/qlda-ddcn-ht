INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-v-ieu-16','qclv-chuong-v','Điều 16','Quan hệ công tác giữa Ban QLDA với UBND tỉnh, Chủ tịch UBND tỉnh','1. Chịu sự chỉ đạo, kiểm tra, giám sát trực tiếp của UBND tỉnh, Chủ tịch UBND tỉnh về thực hiện chức năng, nhiệm vụ được giao;

2. Trình cấp quyết định đầu tư phê duyệt các nội dung thuộc trách nhiệm của chủ đầu tư theo nhiệm vụ được giao và theo quy định của pháp luật;

3. Báo cáo định kỳ hoặc đột xuất về tình hình triển khai thực hiện các dự án được giao quản lý; đề xuất biện pháp xử lý những vấn đề vượt quá thẩm quyền giải quyết của mình;

4. Giải trình các nội dung cần thiết theo yêu cầu của UBND tỉnh, Chủ tịch UBND tỉnh;

5. Phối hợp với các cơ quan, đơn vị chức năng của UBND tỉnh trong việc thực hiện các nhiệm vụ quản lý dự án.','text',1),('chuong-v-ieu-17','qclv-chuong-v','Điều 17','Quan hệ công tác giữa Ban QLDA với các Sở, ban ngành thuộc tỉnh','1. Khi giải quyết vấn đề thuộc thẩm quyền của mình nhưng có liên quan đến chức năng của các Sở, ban, ngành khác thì chủ động tham khảo ý kiến các cơ quan đó;

2. Đối với các vấn đề vượt thẩm quyền và khả năng giải quyết của Ban QLDA tỉnh hoặc những vấn đề đã được bàn bạc nhưng còn có ý kiến khác nhau giữa các sở, ban ngành, UBND các phường/xã thì báo cáo Chủ tịch/Phó Chủ tịch UBND tỉnh (trưởng Ban chỉ đạo dự án) phụ trách lĩnh vực giải quyết.

3. Báo cáo, giải trình về tình hình thực hiện quản lý dự án khi được yêu cầu, về sự cố công trình, an toàn trong xây dựng với cơ quan nhà nước có thẩm quyền và đề xuất biện pháp phối hợp xử lý những vấn đề vượt quá thẩm quyền;

4. Chịu sự kiểm tra, giám sát của cơ quan nhà nước có thẩm quyền theo quy định của pháp luật. Chủ động phối hợp chặt chẽ và thường xuyên với các sở, ban, ngành và đoàn thể, với chủ đầu tư dự án để giải quyết công việc kịp thời.','text',2),('chuong-v-ieu-18','qclv-chuong-v','Điều 18','Quan hệ công tác giữa Ban QLDA với UBND các phường/xã.','1. Giám đốc Ban QLDA làm việc trực tiếp với Chủ tịch UBND các phường/xã để giải quyết các vấn đề cụ thể của phường/xã có liên quan đến chức năng của Ban QLDA. Khi Giám đốc ủy quyền cho các Phó Giám đốc, Trưởng/Phụ trách các phònglàm việc với Chủ tịch UBND các phường/xã thì những ý kiến của người được ủy quyền được coi là ý kiến của Giám đốc;

2. Trường hợp đề nghị của UBND các phường/xã liên quan đến nhiều ngành, thì Ban QLDA phải chủ động phối hợp với các sở, ban, ngành liên quan để xử lý. Trường hợp các cơ quan không thống nhất hoặc còn có ý kiến khác nhau thì báo cáo Chủ tịch/Phó Chủ tịch UBND tỉnh (trưởng Ban chỉ đạo dự án) phụ trách lĩnh vực giải quyết;

3. Phối hợp với UBND cấp xã trong việc thực hiện công tác bồi thường, giải phóng mặt bằng, tái định cư khi dự án có yêu cầu về thu hồi đất để xây dựng; quản lý hành chính, bảo đảm an ninh, trật tự, an toàn của cộng đồng trong quá trình thực hiện dự án và bàn giao công trình vào khai thác, sử dụng.','text',3) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;