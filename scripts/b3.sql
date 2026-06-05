INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-iii-ieu-10','qclv-chuong-iii','Điều 10','Quyền hạn và trách nhiệm của Kế toán trưởng','1. Tổ chức bộ máy kế toán, thực hiện nhiệm vụ, quyền hạn theo Luật Kế toán, theo các các Nghị định của Chính phủ, các thông tư hướng dẫn của Bộ Tài chính và các quy định hiện hành; trực tiếp phân công nhiệm vụ cho các kế toán viên; chịu trách nhiệm chuyên môn về công tác kế toán;

2. Được bảo đảm về điều kiện làm việc, được đào tạo nâng cao trình độ chuyên môn, nghiệp vụ và được hưởng các quyền lợi theo quy định của pháp luật;

3. Chịu sự quản lý, giám sát, phân công công việc của Lãnh đạo phòng Hành chính \- Tổng hợp (trừ các công việc chuyên môn thuộc thẩm quyền của Kế toán trưởng); chịu trách nhiệm trước Giám đốc, Chủ tịch Ủy ban nhân dân tỉnh và trước pháp luật về nhiệm vụ được giao.','text',5),('chuong-iii-ieu-11','qclv-chuong-iii','Điều 11','Quyền, nghĩa vụ, trách nhiệm của viên chức, người lao động:','1. Được bảo đảm về điều kiện làm việc, được đào tạo nâng cao trình độ chuyên môn nghiệp vụ và được hưởng các quyền lợi theo quy định pháp luật;

2. Có quyền đề xuất đóng góp ý kiến, các biện pháp để thực hiện hiệu quả nhiệm vụ được giao;

3. Có trách nhiệm thực hiện và hoàn thành nhiệm vụ được giao, chấp hành nghiêm quy định pháp luật, chính sách hiện hành và quy chế làm việc của Ban QLDA;

4. Chịu trách nhiệm cá nhân trước Tổ trưởng/Lãnh đạo phòng/Ban Giám đốc Ban QLDA và trước pháp luật về ý kiến đề xuất, tiến độ, chất lượng, hiệu quả của từng công việc được giao; về hình thức, thể thức, trình tự và thủ tục ban hành văn bản và quy trình giải quyết công việc được phân công theo dõi;

5. Thực hiện các quy định của pháp luật về viên chức, hợp đồng lao động, các quy định của Ban QLDA tỉnh và của phòng;

6. Thực hiện tốt mối quan hệ phối hợp công tác với các viên chức và người lao động trong các phòng; xây dựng và thực hiện chương trình công tác mà cá nhân đề ra; thường xuyên trau dồi kiến thức, học tập nâng cao trình độ chuyên môn, nghiệp vụ, rèn luyện đạo đức, lối sống;

7. Có trách nhiệm bảo quản, sử dụng tiết kiệm, hiệu quả tài sản của Ban QLDA;

8. Bảo vệ bí mật nhà nước, bí mật công tác và các nội dung bảo mật theo đúng quy định của pháp luật và theo Quy chế của Ban QLDA;

9. Tuân thủ đúng nội quy, quy chế của đơn vị;

10. Quyền và nghĩa vụ đối với lao động hợp đồng của Ban QLDA: Thực hiện theo điều khoản hợp đồng ký kết;

11. Viên chức, NLĐ không được tham gia, can thiệp vào các quyết định có xung đột lợi ích với bản thân, người thân; phải báo cáo lãnh đạo Ban khi có nguy cơ xung đột lợi ích theo quy định PCTN.','text',6),('chuong-iv-ieu-12','qclv-chuong-iv','Điều 12','Cách thức giải quyết công việc','1. Giám đốc và các Phó Giám đốc điều hành công việc trên cơ sở chương trình, kế hoạch công tác của Ban QLDA; tình hình thực tế; yêu cầu chỉ đạo của UBND tỉnh, các sở, ban, ngành; và các nhiệm vụ đột xuất (nếu có);

2. Giám đốc, Phó Giám đốc chủ trì họp, làm việc với lãnh đạo các cơ quan, tổ chức có liên quan để tham khảo ý kiến trước khi quyết định những vấn đề quan trọng hoặc còn vướng mắc chưa xử lý được ngay;

3. Khi trình hồ sơ giải quyết công việc cho Lãnh đạo Ban, cán bộ thụ lý hồ sơ phải có Tờ trình/Văn bản và đầy đủ hồ sơ kèm theo; đồng thời thực hiện xử lý công việc thông qua phần mềm hồ sơ quản lý công việc (TDO);

4. Lãnh đạo phòng, viên chức, người lao động chỉ được xử lý công việc sau khi lãnh đạo Ban QLDA đã có ý kiến chỉ đạo cụ thể trên phiếu trình hoặc thông qua phần mềm hồ sơ quản lý công việc.','text',1) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;