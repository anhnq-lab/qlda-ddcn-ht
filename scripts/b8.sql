INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-vi-ieu-25','qclv-chuong-vi','Điều 25','Chế độ hội họp','1. Chế độ họp, giao ban nội bộ

a) Chế độ họp với UBND tỉnh, Chủ tịch UBND tỉnh: Thực hiện theo quy định chung của tỉnh;','text',1),('chuong-vi-ieu-26','qclv-chuong-vi','Điều 26','Chế độ báo cáo','1. Ban QLDA thực hiện chế độ báo cáo định kỳ và đột xuất với UBND tỉnh, Chủ tịch UBND tỉnh và theo yêu cầu của các cơ quan có thẩm quyền;

2. Chế độ báo cáo trong nội bộ Ban QLDA

a) Phó Giám đốc báo cáo giám đốc:','text',2),('chuong-vi-ieu-27','qclv-chuong-vi','Điều 27','Chế độ kiểm tra, giám sát','1. Chế độ kiểm tra, giám sát đầu tư đối với dự án được giao Chủ đầu tư

a) Tổ chức thực hiện theo dõi, kiểm tra toàn bộ quá trình đầu tư dự án theo nội dung và chỉ tiêu được phê duyệt nhằm đảm bảo mục tiêu và hiệu quả đầu tư;','text',3) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;