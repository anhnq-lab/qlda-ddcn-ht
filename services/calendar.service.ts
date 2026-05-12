import { supabase } from '@/lib/supabase';
import { CreateAgencyEventDTO, UpdateAgencyEventDTO, EventFilter, AgencyEventWithAttendees, AgencyEvent } from '@/types/calendar.types';
import { dbToEmployee } from '@/lib/dbMappers';

const EVENT_TABLE = 'agency_events';
const ATTENDEE_TABLE = 'agency_event_attendees';

const ATTENDEE_SELECT = `
  *,
  attendees:agency_event_attendees(
    user_id,
    employee:employees(*)
  )
`;

function mapEventRow(event: any): AgencyEventWithAttendees {
  return {
    ...event,
    attendees: (event.attendees || [])
      .map((a: any) => a.employee ? dbToEmployee(a.employee) : null)
      .filter(Boolean),
  };
}

export const calendarService = {
  getEvents: async (filter?: EventFilter): Promise<AgencyEventWithAttendees[]> => {
    let query = supabase
      .from(EVENT_TABLE)
      .select(ATTENDEE_SELECT)
      .order('start_time', { ascending: true });

    if (filter?.startDate) query = query.gte('start_time', filter.startDate);
    if (filter?.endDate)   query = query.lte('end_time', filter.endDate);
    if (filter?.type)      query = query.eq('event_type', filter.type);
    if (filter?.roomId)    query = query.eq('room', filter.roomId);

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map(mapEventRow);
  },

  getEventById: async (id: string): Promise<AgencyEventWithAttendees | null> => {
    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select(ATTENDEE_SELECT)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return mapEventRow(data);
  },

  createEvent: async (eventData: CreateAgencyEventDTO): Promise<AgencyEvent> => {
    const { attendee_ids, ...eventPayload } = eventData;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .insert([{ ...eventPayload, created_by: user.id }])
      .select()
      .single();

    if (error) throw error;
    const newEvent = data as AgencyEvent;

    if (attendee_ids && attendee_ids.length > 0) {
      const { error: attendeeError } = await supabase
        .from(ATTENDEE_TABLE)
        .insert(attendee_ids.map(uid => ({ event_id: newEvent.id, user_id: uid })));

      if (attendeeError) console.error('Failed to add attendees', attendeeError);
    }

    return newEvent;
  },

  updateEvent: async (eventData: UpdateAgencyEventDTO): Promise<AgencyEvent> => {
    const { id, attendee_ids, ...eventPayload } = eventData;

    if (Object.keys(eventPayload).length > 0) {
      const { error } = await supabase
        .from(EVENT_TABLE)
        .update(eventPayload)
        .eq('id', id);
      if (error) throw error;
    }

    // Diff-based attendee update — only insert/delete the delta
    if (attendee_ids !== undefined) {
      const { data: existing } = await supabase
        .from(ATTENDEE_TABLE)
        .select('user_id')
        .eq('event_id', id);

      const currentIds = new Set((existing || []).map((a: any) => a.user_id as string));
      const newIds = new Set(attendee_ids);

      const toAdd    = attendee_ids.filter(uid => !currentIds.has(uid));
      const toRemove = [...currentIds].filter(uid => !newIds.has(uid));

      if (toRemove.length > 0) {
        const { error } = await supabase
          .from(ATTENDEE_TABLE)
          .delete()
          .eq('event_id', id)
          .in('user_id', toRemove);
        if (error) throw error;
      }

      if (toAdd.length > 0) {
        const { error } = await supabase
          .from(ATTENDEE_TABLE)
          .insert(toAdd.map(uid => ({ event_id: id, user_id: uid })));
        if (error) throw error;
      }
    }

    const { data, error } = await supabase
      .from(EVENT_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as AgencyEvent;
  },

  deleteEvent: async (id: string): Promise<void> => {
    const { error } = await supabase.from(EVENT_TABLE).delete().eq('id', id);
    if (error) throw error;
  },

  checkRoomConflicts: async (
    room: string,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<AgencyEventWithAttendees[]> => {
    let query = supabase
      .from(EVENT_TABLE)
      .select('id, title, start_time, end_time, room')
      .eq('room', room)
      .lt('start_time', endTime)
      .gt('end_time', startTime);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).filter((e: any) => e.id !== excludeId) as any[];
  },
};
