INSERT INTO public.regulation_articles (id,chapter_id,code,title,content,content_type,sort_order) VALUES ('chuong-chung-dieu-2','qcdgxl-chung','chuong-chung-dieu-2','Điều 2. Quyết định này có hiệu lực kể từ ngày ban hành.','content: ( )','text',2),('chuong-chung-dieu-3','qcdgxl-chung','chuong-chung-dieu-3','Điều 3. Trưởng các phòng: Hành chính \- Tổng hợp, Quản lý dự án 1, Quản lý dự án 2, Quản lý dự án 3, Kế hoạch \- Đấu thầu, Kỹ thuật \- Thẩm định, Phát triển dịch vụ và các tổ chức, cá nhân có liên quan chịu trách nhiệm thi hành Quyết định này./.','| *Nơi nhận:*		         	     	 - Như điều 2; - Giám đốc, các Phó Giám đốc; - Lưu VT, HC-TH./.  | GIÁM ĐỐC Nguyễn Quang Linh  |

| :---- | ----- |

| UBND TỈNH HÀ TĨNH BAN QLDA ĐẦU TƯ XÂY DỰNG CÔNG TRÌNH DÂN DỤNG VÀ HẠ TẦNG KHU VỰC  | CỘNG HOÀ XÃ HỘI CHỦ NGHĨA VIỆT NAM Độc lập - Tự do - Hạnh phúc  |

| ----- | :---: |

#

# **QUY CHẾ**

**Đánh giá, xếp loại hàng tháng đối với cán bộ, viên chức, người lao động thuộc Ban Quản lý dự án đầu tư xây dựng công trình**

**Dân dụng** **và Hạ tầng khu vực tỉnh Hà Tĩnh**

#','text',3),('chuong-i-dieu-1','qcdgxl-chuong-i','chuong-i-dieu-1','Điều 1. Phạm vi điều chỉnh và đối tượng áp dụng','1. Phạm vi điều chỉnh: Quy chế này quy định việc đánh giá, xếp loại hàng tháng lấy cơ sở đánh giá, xếp loại hàng năm và chi thu nhập tăng thêm đối với các phòng; cán bộ, viên chức, người lao động thuộc Ban Quản lý dự án đầu tư xây dựng công trình Dân dụng và Hạ tầng khu vực tỉnh Hà Tĩnh (Ban QLDA).

2. Đối tượng áp dụng: Viên chức, người lao động và các phòng chuyên môn thuộc Ban QLDA.','text',1) ON CONFLICT (id) DO UPDATE SET content=EXCLUDED.content,title=EXCLUDED.title;