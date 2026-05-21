import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AgencyEventWithAttendees, AgencyEventType } from '@/types/calendar.types';
import { useDeleteEvent, useUpdateEvent } from '@/hooks/useCalendar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, FileText, CheckCircle, Save } from 'lucide-react';
import { DocumentAttachments } from '@/components/common/DocumentAttachments';

interface EventSlidePanelProps {
  event: AgencyEventWithAttendees;
  onEdit: (event: AgencyEventWithAttendees) => void;
  onClose: () => void;
}

const getEventTypeColor = (type: AgencyEventType) => {
  switch (type) {
    case 'meeting': return 'blue';
    case 'business_trip': return 'orange';
    case 'internal_event': return 'purple';
    default: return 'gray';
  }
};

const getEventTypeName = (type: AgencyEventType) => {
  switch (type) {
    case 'meeting': return 'Họp nội bộ';
    case 'business_trip': return 'Đi công tác';
    case 'internal_event': return 'Sự kiện bên ngoài';
    default: return 'Khác';
  }
};

const getRoomName = (room: string) => {
  switch (room) {
    case 'Phòng họp 1': return 'Phòng họp 1';
    case 'Phòng họp 2': return 'Phòng họp 2';
    case 'Phòng họp 3': return 'Phòng họp 3';
    default: return 'Không rõ';
  }
};

export const EventSlidePanel: React.FC<EventSlidePanelProps> = ({ event, onEdit, onClose }) => {
  const { currentUser: user } = useAuth();
  const deleteMutation = useDeleteEvent();
  const updateMutation = useUpdateEvent();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'info' | 'report'>('info');
  const [reportContent, setReportContent] = useState(event.report_content || '');

  // RLS check for Edit/Delete UI buttons
  // Only Admin or the creator can edit/delete
  const canEditOrDelete = (user as any)?.user_metadata?.role === 'Admin' || (user as any)?.id === event.created_by;
  // Báo cáo kết quả: Có thể cho phép người tạo hoặc người tham dự đều được điền (ở đây cho đơn giản là editOrDelete hoặc attendees)
  const canEditReport = canEditOrDelete || event.attendees?.some(a => (a as any).id === (user as any)?.id);

  const handleDelete = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sự kiện này?')) {
      try {
        await deleteMutation.mutateAsync(event.id);
        showToast('Xóa sự kiện thành công', 'success');
        onClose();
      } catch (error) {
        showToast('Có lỗi xảy ra khi xóa', 'error');
      }
    }
  };

  const handleSaveReport = async () => {
    try {
      await updateMutation.mutateAsync({
        id: event.id,
        report_content: reportContent,
      });
      showToast('Lưu báo cáo/kết quả thành công', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi lưu báo cáo', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-app">
      {/* Header Info Banner */}
      <div className="bg-bg-surface border-b border-border px-6 py-5 shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-txt-primary mb-2 leading-tight">
              {event.title}
            </h2>
            <div className="flex items-center gap-3">
              <Badge {...{ color: getEventTypeColor(event.event_type) } as any}>
                {getEventTypeName(event.event_type)}
              </Badge>
              <div className="flex items-center text-sm text-txt-muted">
                <Calendar className="w-4 h-4 mr-1.5" />
                {format(new Date(event.start_time), 'dd/MM/yyyy HH:mm', { locale: vi })}
                {' - '}
                {format(new Date(event.end_time), 'HH:mm', { locale: vi })}
              </div>
            </div>
          </div>
          {canEditOrDelete && (
            <div className="flex gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => onEdit(event)}>
                <Edit className="w-4 h-4 mr-1.5" /> Sửa
              </Button>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50/50 border-red-200 dark:border-red-900/30" onClick={handleDelete} loading={deleteMutation.isPending}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 px-6 border-b border-border bg-bg-surface shrink-0">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'info'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-txt-muted hover:text-txt-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          Thông tin chi tiết
        </button>
        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-txt-muted hover:text-txt-primary'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Báo cáo / Kết quả
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'info' && (
          <div className="p-6 space-y-6">
            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm space-y-5">
              {(event.room || event.location) && (
                <div className="flex items-start text-sm text-txt-secondary">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <MapPin className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-txt-primary mb-1">Địa điểm</p>
                    <p>{event.room ? getRoomName(event.room as string) : event.location}</p>
                  </div>
                </div>
              )}

              {event.description && (
                <div className="flex items-start text-sm text-txt-secondary">
                  <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                    <Clock className="w-4 h-4 text-txt-muted" />
                  </div>
                  <div className="pt-1.5">
                    <p className="font-semibold text-txt-primary mb-1">Nội dung / Chương trình</p>
                    <p className="whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>
              )}

              <div className="flex items-start text-sm text-txt-secondary">
                <div className="w-8 h-8 rounded-full bg-bg-muted flex items-center justify-center mr-3 shrink-0">
                  <Users className="w-4 h-4 text-txt-muted" />
                </div>
                <div className="pt-1.5 w-full">
                  <p className="font-semibold text-txt-primary mb-2">Thành phần tham dự ({event.attendees?.length || 0})</p>
                  {event.attendees && event.attendees.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {event.attendees.map((emp, idx) => (
                        <div key={emp.EmployeeID || (emp as any).id || idx} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-bg-muted/40">
                          <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-400 shrink-0">
                            {(emp.FullName || (emp as any).full_name || 'NV').charAt(0)}
                          </div>
                          <span className="font-semibold text-txt-primary">
                            {emp.FullName || (emp as any).full_name || 'Nhân viên'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-txt-muted italic mt-1 text-sm">Chưa có thông tin</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'report' && (
          <div className="p-6 space-y-6">
            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-semibold text-txt-primary mb-2">
                  Nội dung kết quả / Báo cáo
                </label>
                <textarea
                  className="w-full min-h-[150px] p-3 text-sm rounded-lg border border-border bg-bg-app text-txt-primary focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none focus:outline-none"
                  placeholder={canEditReport ? "Nhập nội dung báo cáo hoặc kết quả cuộc họp..." : "Chưa có báo cáo"}
                  value={reportContent}
                  onChange={(e) => setReportContent(e.target.value)}
                  disabled={!canEditReport}
                />
              </div>

              {canEditReport && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveReport} 
                    loading={updateMutation.isPending}
                    leftIcon={<Save className="w-4 h-4" />}
                  >
                    Lưu Báo Cáo
                  </Button>
                </div>
              )}
            </div>

            <div className="bg-bg-surface rounded-xl p-5 border border-border shadow-sm">
              <DocumentAttachments
                relatedType="agency_event"
                relatedId={event.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
