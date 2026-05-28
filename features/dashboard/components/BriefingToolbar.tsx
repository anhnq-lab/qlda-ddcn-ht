import React, { useCallback, useState } from 'react';
import { Download, Sparkles, CalendarDays, ChevronDown, FileText } from 'lucide-react';

interface BriefingToolbarProps {
    selectedMonth: number;
    onMonthChange: (month: number) => void;
    onOpenReportModal: () => void;
}

/**
 * Toolbar for the Monthly Briefing tab.
 * Contains: month selector + export/AI buttons.
 * 
 * Design fix: previous version had two buttons ("AI Soạn báo cáo" + "Xuất DOCX")
 * that both opened the same modal. Consolidated into a single dropdown with 3 options.
 */
export const BriefingToolbar: React.FC<BriefingToolbarProps> = ({
    selectedMonth,
    onMonthChange,
    onOpenReportModal,
}) => {
    const [showDropdown, setShowDropdown] = useState(false);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const handleDropdownAction = useCallback(() => {
        setShowDropdown(false);
        onOpenReportModal();
    }, [onOpenReportModal]);

    return (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-bg-surface p-4 rounded-xl border border-border shadow-sm">
            {/* Month Selector */}
            <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-txt-secondary" />
                    <span className="text-sm font-bold text-txt-primary">Kỳ báo cáo:</span>
                </div>
                <div className="relative">
                    <select
                        id="briefing-month-select"
                        value={selectedMonth}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        className="appearance-none filter-primary text-sm font-semibold rounded-lg pl-3 pr-8 py-1.5 min-w-[110px]"
                        aria-label="Chọn tháng báo cáo"
                    >
                        {months.map(m => (
                            <option key={m} value={m}>Tháng {m}</option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-txt-muted pointer-events-none" />
                </div>
            </div>

            {/* Export / AI Actions — dropdown to avoid duplicate buttons */}
            <div className="relative">
                <div className="flex gap-2">
                    <button
                        id="btn-ai-draft-report"
                        onClick={onOpenReportModal}
                        className="btn btn-outline border-primary-200 text-primary-700 bg-primary-50 hover:bg-primary-100 flex items-center gap-2"
                        aria-label="AI soạn báo cáo giao ban"
                    >
                        <Sparkles className="w-4 h-4" />
                        AI Soạn báo cáo
                    </button>
                    <button
                        id="btn-export-dropdown"
                        onClick={() => setShowDropdown(prev => !prev)}
                        className="btn btn-primary flex items-center gap-2"
                        aria-label="Xuất báo cáo"
                        aria-haspopup="true"
                        aria-expanded={showDropdown}
                    >
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {showDropdown && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setShowDropdown(false)}
                            aria-hidden="true"
                        />
                        <div
                            className="absolute right-0 top-full mt-1.5 w-52 bg-bg-surface border border-border rounded-xl shadow-lg z-20 overflow-hidden"
                            role="menu"
                        >
                            <button
                                role="menuitem"
                                onClick={handleDropdownAction}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left text-txt-primary hover:bg-bg-subtle transition-colors"
                            >
                                <Sparkles className="w-4 h-4 text-primary-500 shrink-0" />
                                <span>
                                    <span className="font-bold block">Soạn với AI</span>
                                    <span className="text-xs text-txt-muted">Gemini tự động phân tích dữ liệu</span>
                                </span>
                            </button>
                            <div className="border-t border-border" />
                            <button
                                role="menuitem"
                                onClick={handleDropdownAction}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left text-txt-primary hover:bg-bg-subtle transition-colors"
                            >
                                <FileText className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>
                                    <span className="font-bold block">Xuất DOCX trực tiếp</span>
                                    <span className="text-xs text-txt-muted">Tạo theo mẫu NĐ30 tự động</span>
                                </span>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
