import React from 'react';
import { History, Download, FileText, ArrowUpRight } from 'lucide-react';

interface Revision {
    version: string;
    revision: string;
    date: string;
    author: string;
    reason: string;
    size: string;
    storagePath?: string;
}

interface CDERevisionHistoryProps {
    docName: string;
    currentVersion: string;
    revisions: Revision[];
    onDownload?: (revision: Revision) => void;
}

const CDERevisionHistory: React.FC<CDERevisionHistoryProps> = ({
    docName, currentVersion, revisions, onDownload,
}) => {
    // Generate mock revisions from current version if none provided
    const displayRevisions: Revision[] = revisions.length > 0 ? revisions : [{
        version: currentVersion || 'P01.01',
        revision: 'P01',
        date: new Date().toLocaleDateString('vi-VN'),
        author: '—',
        reason: 'Phiên bản đầu tiên',
        size: '—',
    }];

    return (
        <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-3">
                <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <h4 className="text-[10px] font-black text-txt-muted uppercase tracking-wider">Lịch sử phiên bản</h4>
                <span className="text-[9px] font-bold bg-bg-muted text-gray-500 px-2 py-0.5 rounded-full">{displayRevisions.length} versions</span>
            </div>

            <div className="relative pl-5 space-y-0 before:absolute before:left-[7px] before:top-3 before:bottom-3 before:w-0.5 before:bg-gray-100 dark:before:bg-slate-700">
                {displayRevisions.map((rev, idx) => {
                    const isCurrent = idx === 0;
                    const isPublished = rev.revision.startsWith('C');

                    return (
                        <div key={idx} className="relative group">
                            {/* Timeline dot */}
                            <div className={`absolute -left-[17px] top-4 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 z-10 transition-all ${isCurrent
                                ? 'bg-primary-600 ring-4 ring-blue-100 dark:ring-blue-900/40'
                                : isPublished ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-slate-600'
                                }`} />

                            <div className={`p-3.5 rounded-xl border transition-all ml-1 mb-2 ${isCurrent
                                ? 'bg-blue-50/70 dark:bg-blue-900/15 border-blue-100 dark:border-blue-800'
                                : 'bg-bg-surface border-border-subtle hover:border-gray-200 dark:hover:border-slate-600'
                                }`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-md ${isCurrent
                                            ? 'bg-primary-600 text-white'
                                            : isPublished ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-bg-muted text-txt-muted'
                                            }`}>
                                            v{rev.version}
                                        </span>
                                        {isCurrent && <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">Hiện tại</span>}
                                        {isPublished && <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Published</span>}
                                    </div>
                                    {onDownload && (
                                        <button
                                            onClick={() => onDownload(rev)}
                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                                        >
                                            <Download className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                                    <div><span className="text-txt-placeholder">Ngày:</span> <span className="font-semibold text-txt-muted">{rev.date}</span></div>
                                    <div><span className="text-txt-placeholder">Người tạo:</span> <span className="font-semibold text-txt-muted">{rev.author}</span></div>
                                    <div className="col-span-2"><span className="text-txt-placeholder">Lý do:</span> <span className="font-medium text-txt-muted italic">{rev.reason}</span></div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default CDERevisionHistory;
