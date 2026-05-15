import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/common/ConfirmModal';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AgencyEventType } from '@/types/calendar.types';
import { useEventById, useDeleteEvent } from '@/hooks/useCalendar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, Users, Edit, Trash2, DoorOpen } from 'lucide-react';

interface EventDetailContentProps {
  eventId: string;
  onEdit: (eventId: string) => void;
  onClose?: () => void;
}

const EVENT_TYPE_CONFIG: Record<AgencyEventType, { label: string; color: string }> = {
  meeting:        { label: 'Họp nội bộ',    color: 'blue'   },
  business_trip:  { label: 'Đi công tác',   color: 'orange' },
  internal_event: { label: 'Sự kiện nội bộ', color: 'purple' },
  other:          { label: 'Khác',          color: 'gray'   },
};

export const EventDetailContent: React.FC<EventDetailContentProps> = ({ eventId, onEdit, onClose }) => {
  const { supabaseUser: user } = useAuth();
  const { data: event, isLoading } = useEventById(eventId);
  const deleteMutation = useDeleteEvent();
  const { showToast } = useToast();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="p-5 text-sm text-gray-500 dark:text-slate-400 italic">
        Không tìm thấy sự kiện.
      </div>
    );
  }

  const canEditOrDelete =
    user?.user_metadata?.role === 'Admin' || user?.id === event.created_by;

  const config = EVENT_TYPE_CONFIG[event.event_type] ?? EVENT_TYPE_CONFIG.other;
  const startDate = new Date(event.start_time);
  const endDate   = new Date(event.end_time);
  const isSameDay = format(startDate, 'dd/MM/yyyy') === format(endDate, 'dd/MM/yyyy');

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(event.id);
      showToast('Xóa sự kiện thành công', 'success');
      onClose?.();
    } catch {
      showToast('Có lỗi xảy ra khi xóa', 'error');
    } finally {
      setConfirmOpen(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Title & badge */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 leading-snug">
          {event.title}
        </h2>
        <Badge variant={config.color as any}>{config.label}</Badge>
      </div>

      {/* Detail rows */}
      <div className="space-y-4">
        {/* Time */}
        <div className="flex items-start gap-3 text-sm">
          <Calendar className="w-4.5 h-4.5 text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" style={{ width: 18, height: 18 }} />
          <div>
            <p className="font-semibold text-gray-900 dark:text-slate-100">Thời gian</p>
            <p className="text-gray-600 dark:text-slate-400 mt-0.5">
              {format(startDate, 'EEEE, dd/MM/yyyy HH:mm', { locale: vi })}
              {' – '}
              {isSameDay
                ? format(endDate, 'HH:mm', { locale: vi })
                : format(endDate, 'dd/MM/yyyy HH:mm', { locale: vi })}
            </p>
          </div>
        </div>

        {/* Room */}
        {event.room && (
          <div className="flex items-start gap-3 text-sm">
            <DoorOpen className="text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" style={{ width: 18, height: 18 }} />
            <div>
              <p className="font-semibold text-gray-900 dark:text-slate-100">Phòng họp</p>
              <p className="text-gray-600 dark:text-slate-400 mt-0.5">{event.room}</p>
            </div>
          </div>
        )}

        {/* Location */}
        {event.location && (
          <div className="flex items-start gap-3 text-sm">
            <MapPin className="text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" style={{ width: 18, height: 18 }} />
            <div>
              <p className="font-semibold text-gray-900 dark:text-slate-100">Địa điểm công tác</p>
              <p className="text-gray-600 dark:text-slate-400 mt-0.5">{event.location}</p>
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <div className="flex items-start gap-3 text-sm">
            <Clock className="text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" style={{ width: 18, height: 18 }} />
            <div>
              <p className="font-semibold text-gray-900 dark:text-slate-100">Nội dung</p>
              <p className="text-gray-600 dark:text-slate-400 mt-0.5 whitespace-pre-wrap leading-relaxed">
                {event.description}
              </p>
            </div>
          </div>
        )}

        {/* Attendees */}
        <div className="flex items-start gap-3 text-sm">
          <Users className="text-gray-400 dark:text-slate-500 mt-0.5 shrink-0" style={{ width: 18, height: 18 }} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 dark:text-slate-100">
              Người tham dự ({event.attendees?.length ?? 0})
            </p>
            {event.attendees && event.attendees.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {event.attendees.map((emp: any, idx: number) => (
                  <li key={emp.EmployeeID || idx} className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300 shrink-0">
                      {(emp.FullName || emp.full_name || 'NV').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-200 truncate">
                        {emp.FullName || emp.full_name || 'Nhân viên'}
                      </p>
                      {emp.Department && (
                        <p className="text-xs text-gray-500 dark:text-slate-500 truncate">
                          {emp.Department}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-400 dark:text-slate-500 italic mt-1 text-xs">Không có</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {canEditOrDelete && (
        <div className="pt-4 border-t border-gray-100 dark:border-slate-700/50 flex gap-3">
          <Button
            variant="outline"
            className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
            onClick={() => setConfirmOpen(true)}
            loading={deleteMutation.isPending}
          >
            <Trash2 className="w-4 h-4 mr-1.5" /> Xóa
          </Button>
          <Button onClick={() => onEdit(event.id)}>
            <Edit className="w-4 h-4 mr-1.5" /> Sửa
          </Button>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Xóa sự kiện"
        message={`Bạn có chắc chắn muốn xóa "${event.title}"? Hành động này không thể hoàn tác.`}
        confirmText="Xóa sự kiện"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
