// ═══════════════════════════════════════════════════════════════
// CDE Digital Signature (CA) — Extracted from DocumentManager
// USB Token -> Select Certificate -> Enter PIN -> Sign
// ═══════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { ShieldCheck, HardDrive, Loader2, X, FileText } from 'lucide-react';

interface CDEDigitalSignProps {
    file: { doc_name?: string; DocName?: string; name?: string; size?: string; Size?: string };
    isOpen: boolean;
    onClose: () => void;
    onSignComplete: (fileName: string) => void;
}

const CDEDigitalSign: React.FC<CDEDigitalSignProps> = ({ file, isOpen, onClose, onSignComplete }) => {
    const [step, setStep] = useState(0);
    const fileName = file.doc_name || file.DocName || file.name || 'Tài liệu';
    const fileSize = file.size || file.Size || '2.5 MB';

    if (!isOpen) return null;

    const handleDetectToken = () => {
        setStep(1);
        setTimeout(() => setStep(2), 1500);
    };

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(3);
        setTimeout(() => {
            onSignComplete(fileName);
            setStep(0);
            onClose();
        }, 1500);
    };

    const handleClose = () => {
        setStep(0);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-bg-surface w-full max-w-md rounded-[32px] shadow-sm overflow-hidden p-4 animate-in zoom-in-95">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-txt-primary flex items-center gap-3 tracking-tight">
                        <ShieldCheck className="w-6 h-6 text-emerald-600" /> Ký số văn bản (CA)
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-6 h-6" /></button>
                </div>

                <div className="space-y-6">
                    {/* File info */}
                    <div className="bg-gray-50 dark:bg-slate-700 p-5 rounded-2xl border border-gray-200 dark:border-slate-600 flex items-center gap-4">
                        <FileText className="w-10 h-10 text-blue-500 dark:text-blue-400" />
                        <div className="flex-1 overflow-hidden">
                            <p className="font-black text-txt-primary truncate text-sm">{fileName}</p>
                            <p className="text-[10px] text-txt-placeholder font-bold uppercase tracking-widest">HỒ SƠ DỰ ÁN • {fileSize}</p>
                        </div>
                    </div>

                    {/* Step 0: Detect USB Token */}
                    {step === 0 && (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <HardDrive className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                            </div>
                            <p className="text-txt-muted font-bold text-sm mb-8 px-4 leading-relaxed">
                                Vui lòng kiểm tra USB Token của bạn để tiến hành xác thực chữ ký số.
                            </p>
                            <button onClick={handleDetectToken} className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-500 shadow-sm shadow-primary-100 dark:shadow-primary-900/30 uppercase tracking-widest text-xs transition-all">
                                Đã cắm USB Token
                            </button>
                        </div>
                    )}

                    {/* Step 1: Reading certificate */}
                    {step === 1 && (
                        <div className="text-center py-10">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-6" />
                            <p className="text-txt-placeholder font-bold uppercase tracking-widest text-[10px]">Đang đọc thông tin chứng thư số...</p>
                        </div>
                    )}

                    {/* Step 2: Enter PIN */}
                    {step === 2 && (
                        <form onSubmit={handlePinSubmit} className="space-y-5">
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-txt-placeholder uppercase tracking-widest mb-2 ml-1">Chứng thư số</label>
                                <select className="w-full px-4 py-3 bg-bg-subtle dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-txt-secondary outline-none focus:ring-2 focus:ring-blue-500 transition-all">
                                    <option>NGUYEN VAN A - VNPT CA (Hạn: 2026)</option>
                                </select>
                            </div>
                            <div className="text-left">
                                <label className="block text-[10px] font-black text-txt-placeholder uppercase tracking-widest mb-2 ml-1">Mã PIN</label>
                                <input
                                    type="password" autoFocus
                                    className="w-full px-4 py-3 bg-bg-surface dark:bg-slate-600 border border-gray-200 dark:border-slate-500 rounded-xl text-center text-lg font-black tracking-[1em] outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-200 transition-all"
                                    placeholder="******"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 shadow-sm shadow-emerald-100 dark:shadow-emerald-900/30 uppercase tracking-widest text-xs transition-all">
                                Xác nhận Ký số
                            </button>
                        </form>
                    )}

                    {/* Step 3: Signing */}
                    {step === 3 && (
                        <div className="text-center py-10">
                            <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-6" />
                            <p className="text-txt-placeholder font-bold uppercase tracking-widest text-[10px]">Đang ký số văn bản...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CDEDigitalSign;
