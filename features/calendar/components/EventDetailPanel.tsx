import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { AgencyEventWithAttendees, AgencyEventType, AgencyEventRoom } from '@/types/calendar.types';
import { useDeleteEvent } from '@/hooks/useCalendar';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Calendar, Clock, MapPin, Users, Edit, Trash2 } from 'lucide-react';

interface EventDetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  event: AgencyEventWithAttendees | null;
  onEdit: (event: AgencyEventWithAttendees) => void;
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

export const EventDetailPanel: React.FC<EventDetailPanelProps> = ({ isOpen, onClose, event, onEdit }) => {
  const { currentUser: user, supabaseUser } = useAuth();
  const deleteMutation = useDeleteEvent();
  const { showToast } = useToast();

  if (!event) return null;

  // RLS check for Edit/Delete UI buttons
  // Only Admin or the creator can edit/delete
  const canEditOrDelete = user?.Role === 'Admin' || user?.SystemRole === 'super_admin' || supabaseUser?.id === event.created_by;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết lịch"
      size="md"
      footer={
        canEditOrDelete ? (
          <div className="flex justify-end gap-3 w-full">
            <Button variant="outline" className="text-red-600" onClick={handleDelete} loading={deleteMutation.isPending}>
              <Trash2 className="w-4 h-4 mr-2" /> Xóa
            </Button>
            <Button onClick={() => { onClose(); onEdit(event); }}>
              <Edit className="w-4 h-4 mr-2" /> Sửa
            </Button>
          </div>
        ) : undefined
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{event.title}</h2>
          <Badge {...{ color: getEventTypeColor(event.event_type) } as any}>
            {getEventTypeName(event.event_type)}
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="flex items-start text-sm text-gray-700">
            <Calendar className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Thời gian</p>
              <p>
                {format(new Date(event.start_time), 'EEEE, dd/MM/yyyy HH:mm', { locale: vi })}
                {' - '}
                {format(new Date(event.end_time), 'HH:mm', { locale: vi })}
              </p>
            </div>
          </div>

          {(event.room || event.location) && (
            <div className="flex items-start text-sm text-gray-700">
              <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Địa điểm</p>
                <p>{event.room ? getRoomName(event.room as string) : event.location}</p>
              </div>
            </div>
          )}

          {event.description && (
            <div className="flex items-start text-sm text-gray-700">
              <Clock className="w-5 h-5 mr-3 text-gray-400 mt-0.5 opacity-0" />
              <div>
                <p className="font-medium">Nội dung</p>
                <p className="whitespace-pre-wrap">{event.description}</p>
              </div>
            </div>
          )}

          <div className="flex items-start text-sm text-gray-700">
            <Users className="w-5 h-5 mr-3 text-gray-400 mt-0.5" />
            <div>
              <p className="font-medium">Người tham dự ({event.attendees?.length || 0})</p>
              {event.attendees && event.attendees.length > 0 ? (
                <ul className="mt-1 space-y-1">
                  {event.attendees.map((emp, idx) => (
                    <li key={emp.EmployeeID || (emp as any).id || idx} className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
                        {(emp.FullName || (emp as any).full_name || 'NV').charAt(0)}
                      </div>
                      <span>{emp.FullName || (emp as any).full_name || 'Nhân viên'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 italic mt-1">Không có</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};
