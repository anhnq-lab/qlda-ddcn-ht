import React, { useState } from 'react';
import { Users, Mail, Phone, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee } from '@/types';
import { Avatar } from '@/components/ui';

interface ProjectTeamSectionProps {
    members: Employee[];
    onViewMember?: (employeeId: string) => void;
}

export const ProjectTeamSection: React.FC<ProjectTeamSectionProps> = ({
    members,
    onViewMember
}) => {
    const [showAll, setShowAll] = useState(false);
    const MAX_SHOW = 3;
    if (!members || members.length === 0) {
        return (
            <div className="text-center py-6 text-gray-400 text-sm">
                Chưa có thành viên tham gia dự án
            </div>
        );
    }

    return (
        <div className="section-card">
            {/* Header */}
            <div className="section-card-header">
                <div className="flex items-center gap-2">
                    <div className="section-icon"><Users className="w-3.5 h-3.5" /></div>
                    <span>Thành viên dự án</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400">({members.length})</span>
                </div>
            </div>

            {/* Members List */}
            <div className="divide-y divide-gray-50 dark:divide-slate-700">
                {(showAll ? members : members.slice(0, MAX_SHOW)).map((member, idx) => (
                    <div
                        key={member.EmployeeID}
                        className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors cursor-pointer group flex items-center gap-3"
                        onClick={() => onViewMember?.(member.EmployeeID)}
                    >
                        {/* Avatar */}
                        <div className="shrink-0 relative">
                            <Avatar
                                name={member.FullName}
                                imageUrl={member.AvatarUrl}
                                size="md"
                                className="border-2 border-white dark:border-slate-700 shadow-sm"
                            />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-bold text-gray-800 dark:text-slate-200 truncate">
                                {member.FullName}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-slate-400 truncate mt-0.5">
                                {member.Position} • {member.Department}
                            </p>
                        </div>

                        {/* Contact Actions */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {member.Email && (
                                <a
                                    href={`mailto:${member.Email}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title={member.Email}
                                >
                                    <Mail className="w-3.5 h-3.5" />
                                </a>
                            )}
                            {member.Phone && (
                                <a
                                    href={`tel:${member.Phone}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-1 text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors"
                                    title={member.Phone}
                                >
                                    <Phone className="w-3.5 h-3.5" />
                                </a>
                            )}
                            <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 shrink-0 ml-1" />
                        </div>
                    </div>
                ))}
            </div>

            {/* View All */}
            {members.length > MAX_SHOW && (
                <div className="px-3 py-2 border-t border-gray-100 dark:border-slate-700">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="w-full flex items-center justify-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 py-0.5"
                    >
                        {showAll ? (
                            <><ChevronUp className="w-3 h-3" /> Thu gọn</>
                        ) : (
                            <><ChevronDown className="w-3 h-3" /> Xem tất cả {members.length} thành viên</>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
};
