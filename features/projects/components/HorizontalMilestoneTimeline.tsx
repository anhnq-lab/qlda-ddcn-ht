import React from 'react';
import {
    FileCheck,
    FileSignature,
    HardHat,
    Building,
    CheckCircle2,
    PenTool,
    Calendar,
    Clock
} from 'lucide-react';

interface Milestone {
    id: string;
    title: string;
    description: string;
    phaseCode: string;
    icon: React.ElementType;
    date?: string;
    targetDate?: string;
    status: 'pending' | 'current' | 'completed';
}

interface HorizontalMilestoneTimelineProps {
    progressPercent: number;
    milestoneData?: {
        policyApprovalDate?: string;
        policyApprovalTargetDate?: string;
        projectApprovalDate?: string;
        projectApprovalTargetDate?: string;
        constructionDesignDate?: string;
        constructionDesignTargetDate?: string;
        groundbreakingDate?: string;
        groundbreakingTargetDate?: string;
        completionDate?: string;
        completionTargetDate?: string;
        handoverDate?: string;
        handoverTargetDate?: string;
    };
}

export const HorizontalMilestoneTimeline: React.FC<HorizontalMilestoneTimelineProps> = ({
    progressPercent,
    milestoneData = {}
}) => {
    const milestoneOrder = ['policy_approval', 'project_approval', 'construction_design', 'groundbreaking', 'completion', 'handover'];
    const md = milestoneData ?? {};
    const dateByMilestone: Record<string, string | undefined> = {
        policy_approval: md.policyApprovalDate,
        project_approval: md.projectApprovalDate,
        construction_design: md.constructionDesignDate,
        groundbreaking: md.groundbreakingDate,
        completion: md.completionDate,
        handover: md.handoverDate,
    };

    const getStatus = (milestoneId: string, date?: string): 'pending' | 'current' | 'completed' => {
        if (date) return 'completed';
        const firstIncomplete = milestoneOrder.find(id => !dateByMilestone[id]);
        if (firstIncomplete === milestoneId) return 'current';
        return 'pending';
    };

    const milestones: Milestone[] = [
        {
            id: 'policy_approval',
            title: 'Phê duyệt chủ trương',
            description: 'Quyết định chủ trương đầu tư',
            phaseCode: 'PREP_POLICY',
            icon: FileCheck,
            date: md.policyApprovalDate,
            targetDate: md.policyApprovalTargetDate,
            status: getStatus('policy_approval', md.policyApprovalDate)
        },
        {
            id: 'project_approval',
            title: 'Phê duyệt dự án',
            description: 'Quyết định đầu tư xây dựng',
            phaseCode: 'PREP_DECISION',
            icon: FileSignature,
            date: md.projectApprovalDate,
            targetDate: md.projectApprovalTargetDate,
            status: getStatus('project_approval', md.projectApprovalDate)
        },
        {
            id: 'construction_design',
            title: 'Thiết kế xây dựng',
            description: 'Lập, thẩm định, phê duyệt thiết kế bản vẽ thi công',
            phaseCode: 'IMPL_DESIGN',
            icon: PenTool,
            date: md.constructionDesignDate,
            targetDate: md.constructionDesignTargetDate,
            status: getStatus('construction_design', md.constructionDesignDate)
        },
        {
            id: 'groundbreaking',
            title: 'Khởi công công trình',
            description: 'Bắt đầu thi công xây dựng công trình',
            phaseCode: 'IMPL_CONSTRUCTION',
            icon: HardHat,
            date: md.groundbreakingDate,
            targetDate: md.groundbreakingTargetDate,
            status: getStatus('groundbreaking', md.groundbreakingDate)
        },
        {
            id: 'completion',
            title: 'Nghiệm thu hoàn thành',
            description: 'Nghiệm thu hoàn thành công trình',
            phaseCode: 'IMPL_ACCEPTANCE',
            icon: Building,
            date: md.completionDate,
            targetDate: md.completionTargetDate,
            status: getStatus('completion', md.completionDate)
        },
        {
            id: 'handover',
            title: 'Bàn giao sử dụng',
            description: 'Quyết toán và bàn giao đưa vào sử dụng',
            phaseCode: 'CLOSE_HANDOVER',
            icon: CheckCircle2,
            date: md.handoverDate,
            targetDate: md.handoverTargetDate,
            status: getStatus('handover', md.handoverDate)
        }
    ];

    const getStatusConfig = (status: 'pending' | 'current' | 'completed') => {
        switch (status) {
            case 'completed':
                return {
                    iconBg: 'bg-emerald-500 dark:bg-emerald-600 text-white',
                    dotBorder: 'border-emerald-300 dark:border-emerald-700 shadow-[0_0_6px_rgba(16,185,129,0.2)]',
                    textColor: 'text-emerald-600 dark:text-emerald-400 font-bold',
                };
            case 'current':
                return {
                    iconBg: 'bg-blue-600 dark:bg-blue-500 text-white animate-pulse',
                    dotBorder: 'border-blue-400 dark:border-blue-700 ring-2 ring-blue-500/20 dark:ring-blue-500/10 shadow-[0_0_8px_rgba(37,99,235,0.3)]',
                    textColor: 'text-blue-600 dark:text-blue-400 font-bold',
                };
            default:
                return {
                    iconBg: 'bg-bg-surface text-txt-placeholder',
                    dotBorder: 'border-border',
                    textColor: 'text-txt-placeholder font-medium',
                };
        }
    };

    // Hàm trả về CSS định vị Tooltip tùy vào vị trí của mốc để tránh tràn lề trái/phải của card
    const getTooltipPositionClass = (idx: number, total: number) => {
        if (idx === 0) {
            return 'left-0 origin-top-left';
        }
        if (idx === total - 1) {
            return 'right-0 origin-top-right';
        }
        return 'left-1/2 -translate-x-1/2';
    };

    return (
        <div className="w-full relative py-3 my-1">
            {/* Thanh tiến độ ở dưới làm trục ngang timeline */}
            <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-2 bg-bg-muted rounded-full border border-gray-200/50 dark:border-slate-800">
                <div 
                    className="h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r from-orange-400 via-amber-400 to-emerald-500"
                    style={{ width: `${progressPercent}%` }}
                />
            </div>

            {/* Các điểm mốc tròn đè lên trên thanh tiến độ - px-2 giúp tâm mốc w-4 trùng khít với left-2 của track */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-2">
                {milestones.map((milestone, index) => {
                    const config = getStatusConfig(milestone.status);
                    const Icon = milestone.icon;

                    return (
                        <div key={milestone.id} className="relative flex flex-col items-center group">
                            {/* Điểm tròn mốc (bé lại: w-4 h-4, viền mỏng border) */}
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center border bg-bg-surface transition-all duration-300 z-10 cursor-help ${config.iconBg} ${config.dotBorder}`}>
                                <Icon className="w-2.5 h-2.5" />
                            </div>

                            {/* Tooltip hiển thị khi rê chuột: hiện tên mốc, mô tả và ngày tháng ở phía dưới mốc tròn */}
                            <div className={`absolute top-full mt-2.5 hidden group-hover:flex flex-col bg-slate-900 text-white dark:bg-slate-800 dark:border dark:border-slate-700 text-[10px] rounded-lg p-2.5 shadow-xl z-50 w-48 pointer-events-none animate-in fade-in slide-in-from-top-1 duration-150 ${getTooltipPositionClass(index, milestones.length)}`}>
                                <div className="font-bold text-gray-100 flex items-center gap-1">
                                    <span>Mốc {index + 1}:</span>
                                    <span>{milestone.title}</span>
                                </div>
                                <div className="text-gray-400 mt-1 leading-tight text-[9.5px]">
                                    {milestone.description}
                                </div>
                                <div className="mt-2 pt-1.5 border-t border-slate-800 dark:border-slate-700 flex items-center gap-1 text-[9.5px]">
                                    {milestone.date ? (
                                        <>
                                            <Calendar className="w-3 h-3 text-emerald-400" />
                                            <span className="text-emerald-400 font-bold">
                                                Hoàn thành: {new Date(milestone.date).toLocaleDateString('vi-VN')}
                                            </span>
                                        </>
                                    ) : milestone.targetDate ? (
                                        <>
                                            <Calendar className="w-3 h-3 text-amber-400" />
                                            <span className="text-amber-400 font-bold">
                                                Dự kiến: {new Date(milestone.targetDate).toLocaleDateString('vi-VN')}
                                            </span>
                                        </>
                                    ) : milestone.status === 'current' ? (
                                        <>
                                            <Clock className="w-3 h-3 text-blue-400 animate-spin" />
                                            <span className="text-blue-400 font-bold">Đang triển khai</span>
                                        </>
                                    ) : (
                                        <>
                                            <Clock className="w-3 h-3 text-gray-500" />
                                            <span className="text-gray-400">Chưa bắt đầu</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HorizontalMilestoneTimeline;
