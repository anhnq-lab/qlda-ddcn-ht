import React, { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { Save, RefreshCw, LayoutDashboard } from 'lucide-react';
import { ALL_ROLES, ROLE_LABELS } from '../../../../types/permission.types';

const SYSTEM_ROLES = ALL_ROLES.map(role => ({
    id: role,
    name: ROLE_LABELS[role]
}));
import { useToast } from '../../../../components/ui/Toast';

const AVAILABLE_WIDGETS = [
    { id: 'project_progress', name: 'Tiến độ dự án', description: 'Widget theo dõi tiến độ tổng thể các dự án' },
    { id: 'bidding_pipeline', name: 'Kế hoạch đấu thầu', description: 'Theo dõi các gói thầu đang trong pipeline' },
    { id: 'contract_summary', name: 'Tổng hợp hợp đồng', description: 'Thống kê giá trị và tình trạng hợp đồng' },
    { id: 'review_queue', name: 'Hồ sơ thẩm định', description: 'Danh sách hồ sơ cần thẩm định kỹ thuật' },
    { id: 'hr_summary', name: 'Tình hình nhân sự', description: 'Thống kê quân số và tình trạng nhân sự' },
    { id: 'payment_pipeline', name: 'Giải ngân & Thanh toán', description: 'Tiến độ thanh toán và giải ngân dòng tiền' }
];

export const DashboardWidgetManager: React.FC = () => {
    const [selectedRole, setSelectedRole] = useState<string>(SYSTEM_ROLES[0].id);
    const [configMap, setConfigMap] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        if (selectedRole) {
            loadConfig(selectedRole);
        }
    }, [selectedRole]);

    const loadConfig = async (role: string) => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('dashboard_widget_config')
                .select('widget_id, is_active')
                .eq('role', role);

            if (error) throw error;

            const map: Record<string, boolean> = {};
            data?.forEach((row: any) => {
                map[row.widget_id] = row.is_active;
            });
            setConfigMap(map);
        } catch (error: any) {
            addToast({ message: error.message || 'Lỗi khi tải cấu hình', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = (widgetId: string) => {
        setConfigMap(prev => ({
            ...prev,
            [widgetId]: !prev[widgetId]
        }));
    };

    const handleSave = async () => {
        if (!selectedRole) return;
        setIsSaving(true);
        try {
            const updates = AVAILABLE_WIDGETS.map(widget => ({
                role: selectedRole,
                widget_id: widget.id,
                is_active: !!configMap[widget.id],
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabase
                .from('dashboard_widget_config')
                .upsert(updates, { onConflict: 'role,widget_id' });

            if (error) throw error;
            addToast({ message: 'Lưu cấu hình thành công', type: 'success' });
        } catch (error: any) {
            addToast({ message: error.message || 'Lỗi khi lưu cấu hình', type: 'error' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="bg-bg-surface rounded-2xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
                        <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                            <LayoutDashboard className="w-5 h-5" />
                        </div>
                        Cấu hình Widget Dashboard
                    </h2>
                    <p className="text-sm text-txt-muted mt-1">
                        Tùy chỉnh hiển thị các widget nghiệp vụ trên trang tổng quan theo từng nhóm quyền.
                    </p>
                </div>
                
                <div className="flex items-center gap-3">
                    <select
                        value={selectedRole}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        className="h-10 px-3 py-2 bg-bg-surface border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium text-txt-secondary focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none w-48 transition-shadow"
                    >
                        {SYSTEM_ROLES.map(role => (
                            <option key={role.id} value={role.id}>
                                {role.name}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="h-10 px-4 inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-all shadow-sm shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Lưu cấu hình
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/30 dark:bg-slate-900">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <RefreshCw className="w-6 h-6 text-primary-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {AVAILABLE_WIDGETS.map(widget => {
                            const isActive = !!configMap[widget.id];
                            return (
                                <div
                                    key={widget.id}
                                    onClick={() => handleToggle(widget.id)}
                                    className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                                        isActive 
                                            ? 'bg-bg-surface border-primary-500 shadow-sm shadow-primary-500/10' 
                                            : 'bg-bg-subtle/80 border-border hover:border-slate-300 dark:hover:border-slate-500'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-3 mb-2">
                                        <h3 className={`text-sm font-bold ${isActive ? 'text-txt-primary' : 'text-txt-muted'}`}>
                                            {widget.name}
                                        </h3>
                                        <div className={`w-10 h-5 flex items-center rounded-full p-1 transition-colors duration-300 ${isActive ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                                            <div className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </div>
                                    </div>
                                    <p className={`text-xs leading-relaxed ${isActive ? 'text-txt-muted' : 'text-txt-muted'}`}>
                                        {widget.description}
                                    </p>
                                    <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-md text-[10px] font-mono ${isActive ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'bg-slate-200/50 dark:bg-slate-900/80 text-txt-muted'}`}>
                                        {widget.id}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardWidgetManager;
