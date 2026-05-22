import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';
import { generateFromImage } from '@/services/ai/geminiProxy';
import { supabase } from '@/lib/supabase';
import { DocCategory, ISO19650Status } from '@/types';

interface UploadDocumentSlidePanelProps {
    projectId: string;
    initialDocType?: string;
    docKey?: string;
    onUploadSuccess: (newDoc: any) => void;
}

export const UploadDocumentSlidePanel: React.FC<UploadDocumentSlidePanelProps> = ({
    projectId,
    initialDocType = '',
    docKey,
    onUploadSuccess
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Form states
    const [docName, setDocName] = useState('');
    const [docType, setDocType] = useState(initialDocType);
    const [docNumber, setDocNumber] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [issuingAuthority, setIssuingAuthority] = useState('');
    const [notes, setNotes] = useState('');
    const [summary, setSummary] = useState('');
    const [signer, setSigner] = useState('');
    const [draftingDepartment, setDraftingDepartment] = useState('');
    const [documentSymbol, setDocumentSymbol] = useState('');
    const [drafter, setDrafter] = useState('');

    const extractDocMetadata = async (file: File): Promise<Record<string, string>> => {
        try {
            const buffer = await file.arrayBuffer();
            const base64 = btoa(
                new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
            );

            const prompt = `Bạn là chuyên gia pháp lý xây dựng Việt Nam. Đọc văn bản đính kèm và trích xuất thông tin.

Trả về JSON object với đúng các key:
{
  "doc_type": "Loại văn bản (VD: Quyết định, Thông báo)",
  "summary": "Trích yếu nội dung chính",
  "signer": "Người ký (VD: Nguyễn Quang Linh)",
  "drafting_department": "Đơn vị thảo (VD: Phòng Kỹ thuật)",
  "document_number": "Số, ký hiệu (VD: 133/QĐ-BQLDA)",
  "issue_date": "Ngày ban hành dạng YYYY-MM-DD",
  "document_symbol": "Ký hiệu văn bản (VD: QĐ-BQLDA)",
  "drafter": "Người soạn thảo (VD: Lê Tiến Hưng)",
  "issuing_authority": "Cơ quan ban hành (VD: UBND Tỉnh Hà Tĩnh, BQL Dự án)"
}

Nếu không tìm thấy, để giá trị rỗng "". CHỈ TRẢ VỀ JSON, KHÔNG markdown.`;

            const text = await generateFromImage(base64, file.type || 'application/pdf', prompt);
            const jsonStr = text.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
            return JSON.parse(jsonStr);
        } catch (err) {
            console.error('Gemini extract error:', err);
            return {};
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setDocName(initialDocType ? `${initialDocType} - ${selectedFile.name}` : selectedFile.name);

        // Auto extract if it's a PDF or Image (supported by Gemini)
        if (selectedFile.type === 'application/pdf' || selectedFile.type.startsWith('image/')) {
            setIsExtracting(true);
            try {
                const extracted = await extractDocMetadata(selectedFile);
                if (extracted.document_number) setDocNumber(extracted.document_number);
                if (extracted.issue_date) setIssueDate(extracted.issue_date);
                if (extracted.issuing_authority) setIssuingAuthority(extracted.issuing_authority);
                if (extracted.notes) setNotes(extracted.notes);
                if (extracted.doc_type) setDocType(extracted.doc_type);
                if (extracted.summary) setSummary(extracted.summary);
                if (extracted.signer) setSigner(extracted.signer);
                if (extracted.drafting_department) setDraftingDepartment(extracted.drafting_department);
                if (extracted.document_symbol) setDocumentSymbol(extracted.document_symbol);
                if (extracted.drafter) setDrafter(extracted.drafter);
            } catch (error) {
                console.error("Failed to extract metadata", error);
            } finally {
                setIsExtracting(false);
            }
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setIsUploading(true);

        try {
            const ext = file.name.split('.').pop();
            const path = `${projectId}/docs/${Date.now()}.${ext}`;
            const { error: uploadError } = await (supabase as any).storage
                .from('documents').upload(path, file, { cacheControl: '3600', upsert: false });
            if (uploadError) throw uploadError;

            const { data: urlData } = (supabase as any).storage.from('documents').getPublicUrl(path);

            const { data: insertedDoc } = await (supabase.from('documents') as any).insert({
                project_id: projectId,
                doc_name: docName,
                storage_path: urlData.publicUrl,
                size: `${(file.size / 1024).toFixed(0)} KB`,
                category: 0,
                source: 'manual',
                is_digitized: true,
                doc_type: docType || null,
                document_number: docNumber || null,
                issue_date: issueDate || null,
                issuing_authority: issuingAuthority || null,
                notes: notes || null,
                summary: summary || null,
                signer: signer || null,
                drafting_department: draftingDepartment || null,
                document_symbol: documentSymbol || null,
                drafter: drafter || null
            }).select('doc_id').single().throwOnError();

            const docId = insertedDoc.doc_id;

            const newDoc: any = {
                DocID: docId, 
                ReferenceID: projectId, 
                ProjectID: projectId,
                Category: DocCategory.Legal,
                DocName: docName,
                StoragePath: urlData.publicUrl, 
                IsDigitized: true,
                UploadDate: new Date().toLocaleDateString('vi-VN'),
                Version: 'P01.01', 
                Size: `${(file.size / 1024).toFixed(0)} KB`,
                ISOStatus: ISO19650Status.S0, 
                source: 'manual',
                document_number: docNumber,
                doc_type: docType || null,
                issue_date: issueDate || null,
                issuing_authority: issuingAuthority || null,
                notes: notes || null,
                summary: summary || null,
                signer: signer || null,
                drafting_department: draftingDepartment || null,
                document_symbol: documentSymbol || null,
                drafter: drafter || null
            };

            onUploadSuccess(newDoc);
        } catch (err: any) {
            console.error('Upload error:', err);
            alert(`Có lỗi xảy ra khi tải lên: ${err.message || JSON.stringify(err)}`);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {!file ? (
                <div 
                    className="bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-full flex items-center justify-center mb-4">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        Kéo thả hoặc chọn tệp để tải lên
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Hỗ trợ PDF, DOCX, XLSX, hình ảnh...
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/30">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                <FileText className="text-primary-500" size={24} />
                            </div>
                            <div>
                                <h4 className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-xs">{file.name}</h4>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setFile(null)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                Thông tin tài liệu
                            </h3>
                            {isExtracting && (
                                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2.5 py-1 rounded-full">
                                    <Loader2 size={12} className="animate-spin" />
                                    AI đang phân tích...
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 relative">
                            {isExtracting && (
                                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl border border-dashed border-emerald-300">
                                    <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                        <Loader2 size={24} className="animate-spin" />
                                        <span className="text-sm font-medium">Đang trích xuất dữ liệu từ văn bản...</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Tên tài liệu *</label>
                                <input 
                                    type="text" 
                                    value={docName} 
                                    onChange={e => setDocName(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Loại văn bản</label>
                                    <div className="space-y-2">
                                        <input 
                                            type="text" 
                                            value={docType} 
                                            onChange={e => setDocType(e.target.value)}
                                            placeholder="VD: Quyết định"
                                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                        <div className="flex flex-wrap gap-1.5">
                                            {['Quyết định', 'Tờ trình', 'Báo cáo', 'Thông báo', 'Công văn'].map(t => (
                                                <button
                                                    key={t}
                                                    type="button"
                                                    onClick={() => setDocType(t)}
                                                    className="px-2 py-1 text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-primary-50 hover:text-primary-600 dark:hover:bg-primary-900/30 dark:hover:text-primary-400 rounded transition-colors"
                                                >
                                                    {t}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Cơ quan ban hành</label>
                                    <input 
                                        type="text" 
                                        value={issuingAuthority} 
                                        onChange={e => setIssuingAuthority(e.target.value)}
                                        placeholder="VD: BQL Dự án"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Trích yếu</label>
                                <textarea 
                                    value={summary} 
                                    onChange={e => setSummary(e.target.value)}
                                    rows={2}
                                    placeholder="Tóm tắt nội dung chính"
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Số, ký hiệu</label>
                                    <input 
                                        type="text" 
                                        value={docNumber} 
                                        onChange={e => setDocNumber(e.target.value)}
                                        placeholder="VD: 133/QĐ-BQLDA"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ngày ban hành</label>
                                    <input 
                                        type="date" 
                                        value={issueDate} 
                                        onChange={e => setIssueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Ký hiệu văn bản</label>
                                    <input 
                                        type="text" 
                                        value={documentSymbol} 
                                        onChange={e => setDocumentSymbol(e.target.value)}
                                        placeholder="VD: QĐ-BQLDA"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Người ký</label>
                                    <input 
                                        type="text" 
                                        value={signer} 
                                        onChange={e => setSigner(e.target.value)}
                                        placeholder="VD: Nguyễn Văn A"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Đơn vị thảo</label>
                                    <input 
                                        type="text" 
                                        value={draftingDepartment} 
                                        onChange={e => setDraftingDepartment(e.target.value)}
                                        placeholder="VD: Phòng Kỹ thuật"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Người soạn thảo</label>
                                    <input 
                                        type="text" 
                                        value={drafter} 
                                        onChange={e => setDrafter(e.target.value)}
                                        placeholder="VD: Lê Văn B"
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-primary-500 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            onClick={handleUpload}
                            disabled={isUploading || isExtracting || !docName.trim()}
                            className="flex items-center gap-2 px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 size={16} className="animate-spin" />
                                    Đang tải lên...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Lưu & Tải lên
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
