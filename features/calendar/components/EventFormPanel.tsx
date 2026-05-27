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

const timeOptions = Array.from({ length: 24 * 2 }).map((_, idx) => {
  const hour = Math.floor(idx / 2).toString().padStart(2, '0');
  const minute = ((idx % 2) * 30).toString().padStart(2, '0');
  return {
    value: `${hour}:${minute}`,
    label: `${hour}:${minute}`,
  };
});

const timeRegex = /^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const normalizeTime = (val: string): string => {
  if (!val) return '';
  
  // Remove all non-digits except colon
  const cleaned = val.replace(/[^0-9:]/g, '');
  if (!cleaned) return '';
  
  const parts = cleaned.split(':');
  let hourStr = parts[0] || '';
  let minStr = parts[1] || '';
  
  if (parts.length === 1) {
    if (cleaned.length <= 2) {
      hourStr = cleaned;
      minStr = '00';
    } else if (cleaned.length === 3) {
      hourStr = cleaned.slice(0, 1);
      minStr = cleaned.slice(1);
    } else {
      hourStr = cleaned.slice(0, 2);
      minStr = cleaned.slice(2, 4);
    }
  }
  
  if (minStr.length === 1) {
    minStr = minStr + '0';
  } else if (minStr.length === 0) {
    minStr = '00';
  }
  
  let hour = parseInt(hourStr, 10);
  if (isNaN(hour) || hour < 0 || hour > 23) {
    hour = 8; // fallback
  }
  
  let minute = parseInt(minStr, 10);
  if (isNaN(minute) || minute < 0 || minute > 59) {
    minute = 0; // fallback
  }
  
  const finalHour = hour.toString().padStart(2, '0');
  const finalMin = minute.toString().padStart(2, '0');
  
  return `${finalHour}:${finalMin}`;
};

const eventSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  description: z.string().optional(),
  event_type: z.enum(EVENT_TYPES),
  room: z.enum(ROOM_TYPES).optional().nullable(),
  start_date: z.string().min(1, 'Vui lòng chọn ngày bắt đầu'),
  start_time_val: z.string().min(1, 'Vui lòng chọn giờ bắt đầu').regex(timeRegex, 'Định dạng giờ phải là HH:mm (VD: 08:30)'),
  end_date: z.string().min(1, 'Vui lòng chọn ngày kết thúc'),
  end_time_val: z.string().min(1, 'Vui lòng chọn giờ kết thúc').regex(timeRegex, 'Định dạng giờ phải là HH:mm (VD: 08:30)'),
  leader_id: z.string().optional().nullable(),
  location: z.string().optional(),
  vehicle: z.string().optional().nullable(),
  attendee_ids: z.array(z.string()).optional(),
}).refine(data => {
  const [sYear, sMonth, sDay] = data.start_date.split('-').map(Number);
  const [sHour, sMin] = data.start_time_val.split(':').map(Number);
  const start = new Date(sYear, sMonth - 1, sDay, sHour, sMin, 0, 0);

  const [eYear, eMonth, eDay] = data.end_date.split('-').map(Number);
  const [eHour, eMin] = data.end_time_val.split(':').map(Number);
  const end = new Date(eYear, eMonth - 1, eDay, eHour, eMin, 0, 0);

  return start < end;
}, {
  message: 'Thời gian kết thúc phải sau thời gian bắt đầu',
  path: ['end_time_val'],
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
      start_date: '',
      start_time_val: '08:00',
      end_date: '',
      end_time_val: '09:00',
      leader_id: null,
      location: '',
      vehicle: null,
      attendee_ids: [],
    },
  });

  const eventType = watch('event_type');
  const room = watch('room');
  const startDateVal = watch('start_date');
  const startTimeVal = watch('start_time_val');
  const endDateVal = watch('end_date');
  const endTimeVal = watch('end_time_val');

  const getIsoString = (dateVal: string, timeVal: string) => {
    if (!dateVal || !timeVal) return '';
    try {
      const [year, month, day] = dateVal.split('-').map(Number);
      const [hour, minute] = timeVal.split(':').map(Number);
      const d = new Date(year, month - 1, day, hour, minute, 0, 0);
      return isNaN(d.getTime()) ? '' : d.toISOString();
    } catch {
      return '';
    }
  };

  const startTime = getIsoString(startDateVal, startTimeVal);
  const endTime = getIsoString(endDateVal, endTimeVal);

  const [locationMode, setLocationMode] = useState<'room' | 'custom'>('room');
  const [prevStart, setPrevStart] = useState<{ date: string; time: string } | null>(null);

  // Auto-shift end date & end time when start date or start time changes to preserve the event duration
  useEffect(() => {
    if (startDateVal && startTimeVal) {
      if (prevStart) {
        const oldStart = new Date(`${prevStart.date}T${prevStart.time}`);
        const newStart = new Date(`${startDateVal}T${startTimeVal}`);
        const currentEnd = endDateVal && endTimeVal ? new Date(`${endDateVal}T${endTimeVal}`) : null;

        if (currentEnd && !isNaN(oldStart.getTime()) && !isNaN(newStart.getTime()) && !isNaN(currentEnd.getTime())) {
          const durationMs = currentEnd.getTime() - oldStart.getTime();
          if (durationMs > 0) {
            const newEnd = new Date(newStart.getTime() + durationMs);
            setValue('end_date', format(newEnd, 'yyyy-MM-dd'), { shouldValidate: true });
            setValue('end_time_val', format(newEnd, 'HH:mm'), { shouldValidate: true });
          }
        }
      }
      setPrevStart({ date: startDateVal, time: startTimeVal });
    }
  }, [startDateVal, startTimeVal]);

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'start_time_val' | 'end_time_val') => {
    let val = e.target.value.replace(/[^0-9:]/g, '');
    
    // Auto-insert colon
    if (val.length === 2 && !val.includes(':')) {
      const hour = parseInt(val, 10);
      if (hour >= 0 && hour <= 23) {
        val = val + ':';
      }
    }
    
    if (val.length > 5) {
      val = val.slice(0, 5);
    }
    
    setValue(fieldName, val);
  };

  const handleTimeBlur = (e: React.FocusEvent<HTMLInputElement>, fieldName: 'start_time_val' | 'end_time_val') => {
    const normalized = normalizeTime(e.target.value);
    setValue(fieldName, normalized, { shouldValidate: true });
  };

  const adjustDuration = (minutes: number) => {
    if (!startDateVal || !startTimeVal) return;
    try {
      const start = new Date(`${startDateVal}T${startTimeVal}`);
      if (isNaN(start.getTime())) return;
      const end = new Date(start.getTime() + minutes * 60 * 1000);
      setValue('end_date', format(end, 'yyyy-MM-dd'), { shouldValidate: true });
      setValue('end_time_val', format(end, 'HH:mm'), { shouldValidate: true });
    } catch (e) {
      console.error(e);
    }
  };

  const setAllDay = () => {
    if (!startDateVal) return;
    setValue('end_date', startDateVal, { shouldValidate: true });
    setValue('end_time_val', '17:00', { shouldValidate: true });
    setValue('start_time_val', '08:00', { shouldValidate: true });
  };

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
      const sDate = new Date(event.start_time);
      const eDate = new Date(event.end_time);
      const sDateStr = format(sDate, "yyyy-MM-dd");
      const sTimeStr = format(sDate, "HH:mm");
      reset({
        title: event.title,
        description: event.description || '',
        event_type: event.event_type,
        room: (event.room || null) as any,
        location: event.location || '',
        start_date: sDateStr,
        start_time_val: sTimeStr,
        end_date: format(eDate, "yyyy-MM-dd"),
        end_time_val: format(eDate, "HH:mm"),
        leader_id: event.leader_id || null,
        vehicle: event.vehicle || null,
        attendee_ids: event.attendees?.map(a => a.EmployeeID) || [],
      });
      setPrevStart({ date: sDateStr, time: sTimeStr });
    } else if (selectedDate) {
      setLocationMode('room');
      const start = new Date(selectedDate);
      start.setHours(8, 0, 0, 0);
      const end = new Date(start);
      end.setHours(9, 0, 0, 0);
      const sDateStr = format(start, "yyyy-MM-dd");
      const sTimeStr = format(start, "HH:mm");
      reset({
        title: '',
        description: '',
        event_type: 'meeting',
        room: null,
        location: '',
        start_date: sDateStr,
        start_time_val: sTimeStr,
        end_date: format(end, "yyyy-MM-dd"),
        end_time_val: format(end, "HH:mm"),
        leader_id: null,
        vehicle: null,
        attendee_ids: [],
      });
      setPrevStart({ date: sDateStr, time: sTimeStr });
    } else {
      setLocationMode('room');
      const now = new Date();
      now.setMinutes(0, 0, 0);
      const later = new Date(now);
      later.setHours(now.getHours() + 1);
      const sDateStr = format(now, "yyyy-MM-dd");
      const sTimeStr = format(now, "HH:mm");
      reset({
        title: '',
        description: '',
        event_type: 'meeting',
        room: null,
        location: '',
        start_date: sDateStr,
        start_time_val: sTimeStr,
        end_date: format(later, "yyyy-MM-dd"),
        end_time_val: format(later, "HH:mm"),
        leader_id: null,
        vehicle: null,
        attendee_ids: [],
      });
      setPrevStart({ date: sDateStr, time: sTimeStr });
    }
  }, [event, selectedDate, reset]);

  const onSubmit = async (data: EventFormValues) => {
    try {
      const [sYear, sMonth, sDay] = data.start_date.split('-').map(Number);
      const [sHour, sMin] = data.start_time_val.split(':').map(Number);
      const startDateTimeStr = new Date(sYear, sMonth - 1, sDay, sHour, sMin, 0, 0).toISOString();

      const [eYear, eMonth, eDay] = data.end_date.split('-').map(Number);
      const [eHour, eMin] = data.end_time_val.split(':').map(Number);
      const endDateTimeStr = new Date(eYear, eMonth - 1, eDay, eHour, eMin, 0, 0).toISOString();

      const { start_date, start_time_val, end_date, end_time_val, ...rest } = data;
      const payload = {
        ...rest,
        start_time: startDateTimeStr,
        end_time: endDateTimeStr,
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
            ? `Đăng ký lịch thành công — đã thông báo ${count} người tham nhận`
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
            {/* Start Date & Time */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-txt-secondary mb-1.5">
                Bắt đầu <span className="text-danger-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <Input
                    type="date"
                    {...register('start_date')}
                    error={errors.start_date?.message}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="text"
                    placeholder="HH:mm"
                    list="time-list"
                    maxLength={5}
                    error={errors.start_time_val?.message}
                    required
                    {...register('start_time_val', {
                      onChange: (e) => handleTimeChange(e, 'start_time_val'),
                      onBlur: (e) => handleTimeBlur(e, 'start_time_val'),
                    })}
                  />
                </div>
              </div>
            </div>

            {/* End Date & Time */}
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-txt-secondary mb-1.5">
                Kết thúc <span className="text-danger-500">*</span>
              </label>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-3">
                  <Input
                    type="date"
                    {...register('end_date')}
                    error={errors.end_date?.message}
                    required
                  />
                </div>
                <div className="col-span-2">
                  <Input
                    type="text"
                    placeholder="HH:mm"
                    list="time-list"
                    maxLength={5}
                    error={errors.end_time_val?.message}
                    required
                    {...register('end_time_val', {
                      onChange: (e) => handleTimeChange(e, 'end_time_val'),
                      onBlur: (e) => handleTimeBlur(e, 'end_time_val'),
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick presets for duration */}
          <div className="flex flex-wrap items-center gap-1.5 py-1 px-3 bg-bg-surface/50 border border-border/60 rounded-xl">
            <span className="text-[11px] font-semibold text-txt-muted mr-1.5">Thời lượng nhanh:</span>
            <button
              type="button"
              onClick={() => adjustDuration(30)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              30p
            </button>
            <button
              type="button"
              onClick={() => adjustDuration(60)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              1h
            </button>
            <button
              type="button"
              onClick={() => adjustDuration(120)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              2h
            </button>
            <button
              type="button"
              onClick={() => adjustDuration(180)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              3h
            </button>
            <button
              type="button"
              onClick={() => adjustDuration(240)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              4h
            </button>
            <button
              type="button"
              onClick={() => adjustDuration(480)}
              className="px-2 py-1 rounded bg-bg-muted hover:bg-bg-subtle text-xs font-semibold text-txt-primary border border-border cursor-pointer transition-colors"
            >
              8h
            </button>
            <button
              type="button"
              onClick={setAllDay}
              className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-700 dark:text-amber-300 border border-amber-500/20 cursor-pointer transition-colors"
            >
              Cả ngày (đến 17:00)
            </button>
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

          <datalist id="time-list">
            {timeOptions.map(opt => (
              <option key={opt.value} value={opt.value} />
            ))}
          </datalist>
        </form>
      </div>
    </div>
  );
};

export default EventFormPanel;
