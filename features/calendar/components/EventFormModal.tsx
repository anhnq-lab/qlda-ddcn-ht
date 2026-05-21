import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { AgencyEventType, AgencyEventRoom, AgencyEventWithAttendees } from '@/types/calendar.types';
import { useCreateEvent, useUpdateEvent } from '@/hooks/useCalendar';
import { useEmployees } from '@/hooks/useEmployees';
import { useToast } from '@/components/ui/Toast';
import { calendarService } from '@/services/calendar.service';
import { AlertTriangle } from 'lucide-react';

const EVENT_TYPES = ['meeting', 'business_trip', 'internal_event', 'other'] as const;
const ROOM_TYPES = ['Phòng họp 1', 'Phòng họp 2', 'Phòng họp 3'] as const;

const eventSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  description: z.string().optional(),
  event_type: z.enum(EVENT_TYPES),
  room: z.enum(ROOM_TYPES).optional().nullable(),
  start_time: z.string().min(1, 'Vui lòng chọn thời gian bắt đầu'),
  end_time: z.string().min(1, 'Vui lòng chọn thời gian kết thúc'),
  location: z.string().optional(),
  attendee_ids: z.array(z.string()).optional(),
}).refine(data => new Date(data.start_time) < new Date(data.end_time), {
  message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
  path: ['end_time'],
});

type EventFormValues = z.infer<typeof eventSchema>;

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  event?: AgencyEventWithAttendees | null;
  selectedDate?: Date;
}

export const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, event, selectedDate }) => {
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

  const { control, register, handleSubmit, formState: { errors }, reset, watch } = useForm<EventFormValues>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      event_type: 'meeting',
      room: null,
      location: '',
      attendee_ids: [],
    },
  });

  const eventType = watch('event_type');
  const room = watch('room');
  const startTime = watch('start_time');
  const endTime = watch('end_time');

  const showRoom = eventType === 'meeting';
  const showLocation = eventType === 'business_trip';

  // Check room conflicts whenever room/time changes
  useEffect(() => {
    if (!showRoom || !room || !startTime || !endTime) {
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
          room, startTime, endTime, event?.id,
        );
        setRoomConflicts(conflicts.map((c: any) => ({ id: c.id, title: c.title })));
      } catch {
        // silent fail — conflict check is non-blocking
      } finally {
        setIsCheckingConflict(false);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [room, startTime, endTime, showRoom, event?.id]);

  useEffect(() => {
    if (!isOpen) return;
    setRoomConflicts([]);
    setIsCheckingConflict(false);

    if (event) {
      reset({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        room: (event.room || null) as any,
        location: event.location || '',
        start_time: new Date(event.start_time).toISOString().slice(0, 16),
        end_time: new Date(event.end_time).toISOString().slice(0, 16),
        attendee_ids: event.attendees?.map(a => a.EmployeeID) || [],
      });
    } else if (selectedDate) {
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
        start_time: start.toISOString().slice(0, 16),
        end_time: end.toISOString().slice(0, 16),
        attendee_ids: [],
      });
    } else {
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
        start_time: now.toISOString().slice(0, 16),
        end_time: later.toISOString().slice(0, 16),
        attendee_ids: [],
      });
    }
  }, [isOpen, event, selectedDate, reset]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      const payload = {
        ...data,
        room: showRoom ? (data.room ?? null) : null,
        location: showLocation ? (data.location || '') : undefined,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={event ? 'Cập nhật lịch' : 'Đăng ký lịch mới'}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tiêu đề"
          {...register('title')}
          error={errors.title?.message}
          required
          placeholder="VD: Họp giao ban tuần..."
        />

        <div className={`grid gap-4 ${showRoom ? 'grid-cols-2' : 'grid-cols-1'}`}>
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

          {showRoom && (
            <Controller
              name="room"
              control={control}
              render={({ field }) => (
                <div>
                  <Select
                    label="Phòng họp"
                    options={[
                      { value: 'Phòng họp 1', label: 'Phòng họp 1' },
                      { value: 'Phòng họp 2', label: 'Phòng họp 2' },
                      { value: 'Phòng họp 3', label: 'Phòng họp 3' },
                    ]}
                    value={field.value || ''}
                    onChange={val => field.onChange(val || null)}
                    error={errors.room?.message}
                    clearable
                    placeholder="-- Không chọn --"
                  />
                  {roomConflicts.length > 0 && (
                    <div className="mt-1.5 flex items-start gap-1.5 text-xs text-warning-600 dark:text-warning-400">
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
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="datetime-local"
            label="Bắt đầu"
            {...register('start_time')}
            error={errors.start_time?.message}
            required
          />
          <Input
            type="datetime-local"
            label="Kết thúc"
            {...register('end_time')}
            error={errors.end_time?.message}
            required
          />
        </div>

        {showLocation && (
          <Input
            label="Địa điểm công tác"
            {...register('location')}
            error={errors.location?.message}
            placeholder="VD: Hà Nội, Đà Nẵng..."
          />
        )}

        <div>
          <label className="block text-sm font-semibold text-txt-secondary mb-1">
            Nội dung / Ghi chú
          </label>
          <textarea
            {...register('description')}
            rows={3}
            className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-bg-surface text-txt-primary placeholder-txt-placeholder focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            placeholder="Nội dung buổi họp, mục đích công tác..."
          />
        </div>

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

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
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
    </Modal>
  );
};
