import { Database } from './database';
import { Employee } from './employee.types';

export type AgencyEventType = Database['public']['Enums']['agency_event_type'];
export type AgencyEventRoom = Database['public']['Enums']['agency_event_room'];

export interface AgencyEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: AgencyEventType;
  room: AgencyEventRoom | null;
  start_time: string;
  end_time: string;
  leader_id: string | null;
  location: string | null;
  report_content: string | null;
  report_files: any[] | null;
  vehicle: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AgencyEventAttendee {
  id: string;
  event_id: string;
  user_id: string; // Refers to Employee.EmployeeID
  created_at: string;
}

// Custom type for frontend that includes attendees details
export interface AgencyEventWithAttendees extends AgencyEvent {
  attendees: Employee[];
  leader?: Employee | null;
}

export interface CreateAgencyEventDTO {
  title: string;
  description?: string;
  event_type: AgencyEventType;
  room?: AgencyEventRoom | null;
  start_time: string; // ISO String
  end_time: string; // ISO String
  leader_id?: string | null;
  location?: string | null;
  report_content?: string | null;
  report_files?: any[] | null;
  vehicle?: string | null;
  attendee_ids?: string[]; // Array of employee_id
}

export interface UpdateAgencyEventDTO extends Partial<CreateAgencyEventDTO> {
  id: string;
}

export interface EventFilter {
  startDate?: string;
  endDate?: string;
  type?: AgencyEventType;
  roomId?: AgencyEventRoom;
}
