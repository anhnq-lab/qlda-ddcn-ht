import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AgencyEventType, AgencyEventRoom, AgencyEventWithAttendees } from '@/types/calendar.types';
import { useCreateEvent, useUpdateEvent } from '@/hooks/useCalendar';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast';
import { calendarService } from '@/services/calendar.service';
import { AlertTriangle, X } from 'lucide-react';
import { format } from 'date-fns';

const EVENT_TYPES = ['meeting', 'business_trip', 'internal_event', 'other'] as const;
const ROOM_TYPES = ['Phòng họp 1', 'Phòng họp 2', 'Phòng họp 3'] as const;

const eventSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  description: z.string().optional(),
  event_type: z.enum(EVENT_TYPES),
  room: z.enum(ROOM_TYPES).optional().nullable(),
  start_time: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  end_time: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
  leader_id: z.string().optional().nullable(),
  location: z.string().optional(),
  vehicle: z.string().optional().nullable(),
  attendee_ids: z.array(z.string()).optional(),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
  message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
  path: ['end_time'],
}).refine(data => {
  if (!data.room) {
    return !!data.location?.trim();
  }
  return true;
}, {
  message: 'Vui lòng nhập địa điểm',
  path: ['location'],
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormPanelProps {
  event?: AgencyEventWithAttendees | null;
  selectedDate?: Date;
  onClose: () => void;
}

export const EventFormPanel: React.FC<EventFormPanelProps> = ({ event, selectedDate, onClose }) => {
  const { showToast } = useToast();
  const createMutation = useCreateEvent();
  const updateMutation = useUpdateEvent();
  const { data: employees = [] } = useEmployees();
  const [roomConflicts, setRoomConflicts] = useState<{ id: string; title: string }[]>([]);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);

  const employeeOptions = employees.map(emp => ({
    value: emp.EmployeeID,
    label: `${emp.FullName}${emp.Department ? ` — ${emp.Department}` : ''}`,
  }));

  const { control, register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_type: 'meeting',
      room: null,
      leader_id: null,
      location: '',
      vehicle: null,
      attendee_ids: [],
    },
  });

  const eventType = watch('event_type');
  const room = watch('room');
  const startTime = watch('start_time');
  const endTime = watch('end_time');

  const [locationMode, setLocationMode] = useState<'room' | 'custom'>('room');

  // Check room conflicts whenever room/time changes
  useEffect(() => {
    const isRoomSelected = locationMode === 'room' && !!room;
    if (!isRoomSelected || !startTime || !endTime) {
      setRoomConflicts([]);
      setIsCheckingConflict(false);
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setIsCheckingConflict(false);
      return;
    }

    setIsCheckingConflict(true);
    const timeout = setTimeout(async () => {
      try {
        const conflicts = await calendarService.checkRoomConflicts(
          room!, startTime, endTime, event?.id,
        );
        setRoomConflicts(conflicts.map((c: any) => ({ id: c.id, title: c.title })));
      } catch {
        // silent fail
      } finally {
        setIsCheckingConflict(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [room, startTime, endTime, locationMode, event?.id]);

  // Set locationMode to custom if event_type is business_trip, and clear vehicle if not business_trip
  useEffect(() => {
    if (eventType === 'business_trip') {
      setLocationMode('custom');
      setValue('room', null);
    } else {
      setValue('vehicle', null);
    }
  }, [eventType, setValue]);

  useEffect(() => {
    setRoomConflicts([]);
    setIsCheckingConflict(false);

    if (event) {
      const isCustom = !event.room && !!event.location;
      setLocationMode(isCustom ? 'custom' : 'room');
      reset({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        room: (event.room || null) as any,
        location: event.location || '',
        start_time: format(new Date(event.start_time), "yyyy-MM-dd'T'HH:mm"),
        end_time: format(new Date(event.end_time), "yyyy-MM-dd'T'HH:mm"),
        leader_id: event.leader_id || null,
        vehicle: event.vehicle || null,
        attendee_ids: event.attendees?.map(a => a.EmployeeID) || [],
      });
    } else if (selectedDate) {
      setLocationMode('room');
      const start = new Date(selectedDate);
      start.setHours(8, 0, 0, 0);
      const end = new Date(start);
      end.setHours(9, 0, 0, 0);
      reset({
        title: '',
        description: '',
        event_type: 'meeting',
        room: null,
        location: '',
        start_time: format(start, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(end, "yyyy-MM-dd'T'HH:mm"),
        leader_id: null,
        vehicle: null,
        attendee_ids: [],
      });
    } else {
      setLocationMode('room');
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const later = new Date(now);
      later.setHours(now.getHours() + 1);
      reset({
        title: '',
        description: '',
        event_type: 'meeting',
        room: null,
        location: '',
        start_time: format(now, "yyyy-MM-dd'T'HH:mm"),
        end_time: format(later, "yyyy-MM-dd'T'HH:mm"),
        leader_id: null,
        vehicle: null,
        attendee_ids: [],
      });
    }
  }, [event, selectedDate, reset]);

  const onSubmit = async (data: EventFormValues) => {

    try {
      const payload = {
        ...data,
        room: locationMode === 'room' ? data.room : null,
        location: locationMode === 'custom' ? data.location : (data.room || ''),
      };

      if (event) {
        await updateMutation.mutateAsync({ id: event.id, ...payload } as any);
        showToast('Cập nhật lịch thành công', 'success');
      } else {
        await createMutation.mutateAsync(payload as any);
        const count = data.attendee_ids?.length ?? 0;
        showToast(
          count > 0
            ? `Đăng ký lịch thành công — đã thông báo ${count} người tham dự`
            : 'Đăng ký lịch thành công',
          'success',
        );
      }
      onClose();
    } catch (error) {
      console.error(error);
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error');
    }
  };

  return (
    <div className="flex flex-col h-full bg-bg-app">
      {/* Header */}
      <div className="bg-bg-surface border-b border-border px-6 py-5 shrink-0 flex items-center justify-between">
        <h2 className="text-xl font-bold text-txt-primary">
          {event ? 'Cập nhật lịch' : 'Đăng ký lịch mới'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-bg-muted rounded-lg text-txt-muted hover:text-txt-primary transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Tiêu đề"
            {...register('title')}
            error={errors.title?.message}
            required
            placeholder="VD: Họp giao ban tuần..."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="event_type"
              control={control}
              render={({ field }) => (
                <Select
                  label="Loại sự kiện"
                  options={[
                    { value: 'meeting',        label: 'Họp nội bộ' },
                    { value: 'business_trip',  label: 'Đi công tác' },
                    { value: 'internal_event', label: 'Sự kiện nội bộ' },
                    { value: 'other',          label: 'Khác' },
                  ]}
                  value={field.value}
                  onChange={val => field.onChange(val as AgencyEventType)}
                  error={errors.event_type?.message}
                />
              )}
            />

            <div className="flex flex-col gap-2">
              <Select
                label="Địa điểm"
                options={[
                  { value: 'Phòng họp 1', label: 'Phòng họp 1' },
                  { value: 'Phòng họp 2', label: 'Phòng họp 2' },
                  { value: 'Phòng họp 3', label: 'Phòng họp 3' },
                  { value: 'custom', label: 'Địa điểm khác...' },
                ]}
                value={locationMode === 'custom' ? 'custom' : (room || '')}
                onChange={(val: any) => {
                  if (val === 'custom') {
                    setLocationMode('custom');
                    setValue('room', null);
                    setValue('location', '');
                  } else {
                    setLocationMode('room');
                    setValue('room', (val || null) as any);
                    setValue('location', typeof val === 'string' ? val : '');
                  }
                }}
                error={errors.room?.message}
                clearable
                placeholder="-- Chọn địa điểm --"
              />
              {locationMode === 'custom' && (
                <Input
                  {...register('location')}
                  error={errors.location?.message}
                  placeholder="Nhập địa điểm khác (VD: UBND tỉnh, Hà Nội...)"
                  required
                />
              )}
              {locationMode === 'room' && roomConflicts.length > 0 && (
                <div className="mt-0.5 flex items-start gap-1.5 text-xs text-warning-600 dark:text-warning-400">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>
                    Phòng đã có lịch trùng:{' '}
                    <span className="font-semibold">
                      {roomConflicts.map(c => c.title).join(', ')}
                    </span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Bắt đầu"
              lang="en-GB"
              {...register('start_time')}
              error={errors.start_time?.message}
              required
            />
            <Input
              type="datetime-local"
              label="Kết thúc"
              lang="en-GB"
              {...register('end_time')}
              error={errors.end_time?.message}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-txt-secondary mb-1">
              Nội dung / Ghi chú
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-surface text-txt-primary placeholder-txt-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Nội dung buổi họp, mục đích công tác..."
            />
          </div>

          <Controller
            name="leader_id"
            control={control}
            render={({ field }) => (
              <Select
                label="Người chủ trì"
                options={employeeOptions as any[]}
                value={field.value || ''}
                onChange={val => field.onChange(val || null)}
                searchable
                clearable
                placeholder="Chọn người chủ trì..."
              />
            )}
          />

          {eventType === 'business_trip' && (
            <Controller
              name="vehicle"
              control={control}
              render={({ field }) => (
                <Select
                  label="Phương tiện di chuyển"
                  options={[
                    { value: 'Xe ô tô 38A 00266 - Đặng Quốc Hoàn', label: 'Xe ô tô 38A 00266 - Đặng Quốc Hoàn' },
                    { value: '38A-00292 - Nguyễn Quốc Hoàn', label: '38A-00292 - Nguyễn Quốc Hoàn' },
                    { value: '38A 00106- Trần Văn Thanh', label: '38A 00106- Trần Văn Thanh' },
                    { value: 'Xe tự túc', label: 'Xe tự túc' },
                  ]}
                  value={field.value || ''}
                  onChange={val => field.onChange(val || null)}
                  clearable
                  placeholder="Chọn phương tiện di chuyển..."
                />
              )}
            />
          )}

          <Controller
            name="attendee_ids"
            control={control}
            render={({ field }) => (
              <Select
                label="Người tham dự"
                options={employeeOptions as any[]}
                value={field.value || []}
                onChange={val => field.onChange(val)}
                multiple
                searchable
                clearable
                placeholder="Chọn người tham dự..."
              />
            )}
          />

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <Button variant="outline" type="button" onClick={onClose}>Hủy</Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending || isCheckingConflict}
              disabled={roomConflicts.length > 0 || isCheckingConflict}
            >
              {event ? 'Cập nhật' : 'Đăng ký'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormPanel;
