-- Create enum for event types
CREATE TYPE public.agency_event_type AS ENUM ('meeting', 'business_trip', 'internal_event', 'other');

-- Create enum for event rooms
CREATE TYPE public.agency_event_room AS ENUM ('Phòng họp 1', 'Phòng họp 2', 'Phòng họp 3');

-- Create agency_events table
CREATE TABLE public.agency_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NULL,
  event_type public.agency_event_type NOT NULL DEFAULT 'meeting'::agency_event_type,
  room public.agency_event_room NULL,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  location text NULL,
  created_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agency_events_pkey PRIMARY KEY (id),
  CONSTRAINT agency_events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create agency_event_attendees table
CREATE TABLE public.agency_event_attendees (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL,
  user_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT agency_event_attendees_pkey PRIMARY KEY (id),
  CONSTRAINT agency_event_attendees_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.agency_events (id) ON DELETE CASCADE,
  CONSTRAINT agency_event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.employees (employee_id) ON DELETE CASCADE,
  CONSTRAINT agency_event_attendees_unique UNIQUE (event_id, user_id)
);

-- Setup RLS
ALTER TABLE public.agency_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_event_attendees ENABLE ROW LEVEL SECURITY;

-- Policies for agency_events
-- View: everyone authenticated can view
CREATE POLICY "Cho phép tất cả user đã đăng nhập xem lịch"
ON public.agency_events FOR SELECT
TO authenticated
USING (true);

-- Insert: everyone authenticated can create
CREATE POLICY "Cho phép tất cả user đã đăng nhập tạo lịch"
ON public.agency_events FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Update: only admin or creator can update
CREATE POLICY "Chỉ admin hoặc người tạo mới được sửa lịch"
ON public.agency_events FOR UPDATE
TO authenticated
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    JOIN public.employees e ON ua.employee_id = e.employee_id
    WHERE ua.auth_user_id = auth.uid() AND e.role = 'Admin'
  )
);

-- Delete: only admin or creator can delete
CREATE POLICY "Chỉ admin hoặc người tạo mới được xoá lịch"
ON public.agency_events FOR DELETE
TO authenticated
USING (
  auth.uid() = created_by OR
  EXISTS (
    SELECT 1 FROM public.user_accounts ua
    JOIN public.employees e ON ua.employee_id = e.employee_id
    WHERE ua.auth_user_id = auth.uid() AND e.role = 'Admin'
  )
);

-- Policies for agency_event_attendees
-- View: everyone authenticated can view attendees
CREATE POLICY "Cho phép tất cả user đã đăng nhập xem người tham gia"
ON public.agency_event_attendees FOR SELECT
TO authenticated
USING (true);

-- Insert/Update/Delete: tied to the event policies
CREATE POLICY "Chỉ người có quyền sửa sự kiện mới được thêm người tham gia"
ON public.agency_event_attendees FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.agency_events ev
    WHERE ev.id = event_id AND (
      ev.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_accounts ua
        JOIN public.employees e ON ua.employee_id = e.employee_id
        WHERE ua.auth_user_id = auth.uid() AND e.role = 'Admin'
      )
    )
  )
);

CREATE POLICY "Chỉ người có quyền sửa sự kiện mới được xoá người tham gia"
ON public.agency_event_attendees FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.agency_events ev
    WHERE ev.id = event_id AND (
      ev.created_by = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.user_accounts ua
        JOIN public.employees e ON ua.employee_id = e.employee_id
        WHERE ua.auth_user_id = auth.uid() AND e.role = 'Admin'
      )
    )
  )
);
