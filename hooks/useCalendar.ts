import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarService } from '@/services/calendar.service';
import { CreateAgencyEventDTO, UpdateAgencyEventDTO, EventFilter } from '@/types/calendar.types';

export const CALENDAR_QUERY_KEYS = {
  all: ['agency_events'] as const,
  lists: () => [...CALENDAR_QUERY_KEYS.all, 'list'] as const,
  list: (filter: EventFilter) => [...CALENDAR_QUERY_KEYS.lists(), filter] as const,
  detail: (id: string) => [...CALENDAR_QUERY_KEYS.all, 'detail', id] as const,
};

export function useEvents(filter?: EventFilter) {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.list(filter || {}),
    queryFn: () => calendarService.getEvents(filter),
    staleTime: 2 * 60 * 1000,
  });
}

export function useEventById(id: string | null) {
  return useQuery({
    queryKey: CALENDAR_QUERY_KEYS.detail(id ?? ''),
    queryFn: () => calendarService.getEventById(id!),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAgencyEventDTO) => calendarService.createEvent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.all });
    },
  });
}

export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAgencyEventDTO) => calendarService.updateEvent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.all });
    },
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => calendarService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEYS.all });
    },
  });
}
