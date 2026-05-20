-- Add report_content and report_files to agency_events table

ALTER TABLE agency_events 
ADD COLUMN IF NOT EXISTS report_content text,
ADD COLUMN IF NOT EXISTS report_files jsonb DEFAULT '[]'::jsonb;

-- Comment on new columns
COMMENT ON COLUMN agency_events.report_content IS 'Nội dung báo cáo, kết quả cuộc họp/đi công trường/công tác';
COMMENT ON COLUMN agency_events.report_files IS 'Danh sách các file đính kèm (hình ảnh, biên bản) của báo cáo (mảng JSON các URL/thông tin file)';
