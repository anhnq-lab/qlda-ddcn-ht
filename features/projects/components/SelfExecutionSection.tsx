import React from 'react';
import { Building2, FileText, AlertCircle, Users, Briefcase } from 'lucide-react';
import { DocumentAttachments } from '../../../components/common/DocumentAttachments';

// ========================================
// Tab 2 — Tự thực hiện (SelfExecution)
// Luật Đấu thầu 2023 Điều 25: Cơ quan/đơn vị tự thực hiện
// Không có nhà thầu bên ngoài, không LCNT
// ========================================

interface SelfExecutionSectionProps {
    packageId: string;
    projectName?: string;
}

export const SelfExecutionSection: React.FC<SelfExecutionSectionProps> = ({ packageId, projectName }) => {
    return (
        <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
                <Briefcase className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-medium text-indigo-800 dark:text-indigo-300">
                        Gói thầu tự thực hiện
                    </p>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5">
                        Theo Điều 25, Luật Đấu thầu 2023 — Cơ quan, đơn vị được giao nhiệm vụ tự thực hiện gói thầu.
                        Không qua quy trình lựa chọn nhà thầu bên ngoài.
                    </p>
                </div>
            </div>

            {/* Self-execution info card */}
            <div className="p-4 bg-bg-surface border border-gray-200 dark:border-slate-700 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500" />
                    Đơn vị tự thực hiện
                </h4>
                <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                    <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">
                            {projectName || 'Ban Quản lý dự án'}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400">
                            Đơn vị chủ đầu tư tự thực hiện theo phương án được phê duyệt
                        </p>
                    </div>
                </div>
            </div>

            {/* Workflow info */}
            <div className="p-4 bg-bg-surface border border-gray-200 dark:border-slate-700 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Quy trình tự thực hiện (Điều 81 NĐ 24/2024)
                </h4>
                <ol className="space-y-2 text-sm">
                    {[
                        'Chuẩn bị phương án tự thực hiện',
                        'Dự thảo thỏa thuận/văn bản giao việc',
                        'Hoàn thiện phương án',
                        'Phê duyệt & công khai kết quả',
                        'Ký kết thỏa thuận giao việc',
                    ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                            <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                                {idx + 1}
                            </span>
                            <span className="text-gray-700 dark:text-slate-300">{step}</span>
                        </li>
                    ))}
                </ol>
            </div>

            {/* Documents */}
            <div className="p-4 bg-bg-surface border border-gray-200 dark:border-slate-700 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-500" />
                    Hồ sơ tự thực hiện
                </h4>
                <DocumentAttachments
                    entityType="bidding_package"
                    entityId={packageId}
                    section="self_execution"
                    quickUploadTypes={[
                        { label: 'Phương án', docType: 'Phương án tự thực hiện' },
                        { label: 'VB giao việc', docType: 'Văn bản giao việc' },
                        { label: 'QĐ phê duyệt', docType: 'Quyết định phê duyệt' },
                        { label: 'Thỏa thuận', docType: 'Thỏa thuận giao việc' },
                    ]}
                />
            </div>

            {/* Note */}
            <div className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    Gói thầu tự thực hiện không qua quy trình LCNT nên không có thông tin nhà thầu tham gia,
                    chấm điểm hay xếp hạng. Chuyển sang Tab "Hợp đồng" để quản lý thỏa thuận giao việc.
                </p>
            </div>
        </div>
    );
};
