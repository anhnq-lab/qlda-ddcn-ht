import React, { useMemo, useState } from 'react';
import { Save, RefreshCw, PanelLeft, Eye, EyeOff } from 'lucide-react';
import { navItems } from '../../../../layouts/sidebarModules';
import {
  useSidebarModuleConfig,
  useSaveSidebarModuleConfig,
} from '../../../../hooks/useSidebarModuleConfig';
import { useToast } from '../../../../components/ui/Toast';

// ============================================================
// SIDEBAR MODULE MANAGER — Admin ẩn/hiện module trên sidebar
// Phạm vi toàn hệ thống: tắt một module sẽ ẩn nó khỏi sidebar
// của mọi người dùng (vẫn tôn trọng phân quyền sẵn có).
// ============================================================

export const SidebarModuleManager: React.FC = () => {
  const { data: configMap, isLoading, refetch } = useSidebarModuleConfig();
  const saveMutation = useSaveSidebarModuleConfig();
  const { addToast } = useToast();

  // Chỉ lưu các thay đổi người dùng (overrides). Trạng thái hiệu lực = override
  // nếu có, ngược lại lấy từ configMap (mặc định bật). Tránh setState-trong-effect.
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const baseVisible = (path: string) => configMap?.[path] !== false;
  const isVisible = (path: string) => overrides[path] ?? baseVisible(path);

  const dirty = useMemo(
    () => navItems.some((item) => item.path in overrides && overrides[item.path] !== baseVisible(item.path)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides, configMap]
  );

  const visibleCount = navItems.filter((item) => isVisible(item.path)).length;

  const handleToggle = (key: string) => {
    setOverrides((prev) => ({ ...prev, [key]: !(prev[key] ?? baseVisible(key)) }));
  };

  const handleSave = async () => {
    try {
      await saveMutation.mutateAsync(
        navItems.map((item) => ({
          module_key: item.path,
          is_visible: isVisible(item.path),
        }))
      );
      setOverrides({}); // đã đồng bộ với server → xoá overrides
      addToast({ message: 'Đã lưu cấu hình hiển thị module', type: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi khi lưu cấu hình';
      addToast({ message, type: 'error' });
    }
  };

  const isSaving = saveMutation.isPending;

  return (
    <div className="bg-bg-surface rounded-2xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-border bg-slate-50/50 dark:bg-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-lg font-bold text-txt-primary flex items-center gap-2">
            <div className="p-1.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
              <PanelLeft className="w-5 h-5" />
            </div>
            Hiển thị module Sidebar
          </h2>
          <p className="text-sm text-txt-muted mt-1">
            Bật/tắt các module trên thanh điều hướng. Module bị tắt sẽ ẩn khỏi sidebar của mọi người dùng
            (vẫn tuân theo phân quyền hiện có).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-txt-muted whitespace-nowrap">
            Đang hiển thị <span className="font-bold text-txt-primary">{visibleCount}</span>/{navItems.length}
          </span>
          <button
            onClick={() => refetch()}
            disabled={isLoading || isSaving}
            className="h-10 w-10 inline-flex items-center justify-center bg-bg-surface border border-slate-300 dark:border-slate-600 text-txt-secondary rounded-xl transition-all hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            title="Tải lại"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !dirty}
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
            {navItems.map((item) => {
              const visible = isVisible(item.path);
              const Icon = item.icon;
              return (
                <div
                  key={item.path}
                  onClick={() => handleToggle(item.path)}
                  className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                    visible
                      ? 'bg-bg-surface border-primary-500 shadow-sm shadow-primary-500/10'
                      : 'bg-bg-subtle/80 border-border hover:border-slate-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`p-1.5 rounded-lg shrink-0 ${
                          visible
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'bg-slate-200/60 dark:bg-slate-800 text-txt-muted'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <h3 className={`text-sm font-bold truncate ${visible ? 'text-txt-primary' : 'text-txt-muted'}`}>
                        {item.name}
                      </h3>
                    </div>
                    <div
                      className={`w-10 h-5 flex items-center rounded-full p-1 shrink-0 transition-colors duration-300 ${
                        visible ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`bg-white w-3 h-3 rounded-full shadow-sm transform transition-transform duration-300 ${
                          visible ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </div>
                  <div
                    className={`mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold ${
                      visible
                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                        : 'bg-slate-200/50 dark:bg-slate-900/80 text-txt-muted'
                    }`}
                  >
                    {visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {visible ? 'Đang hiển thị' : 'Đã ẩn'}
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

export default SidebarModuleManager;
