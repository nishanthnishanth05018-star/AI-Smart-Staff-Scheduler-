export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export type UserRole = 'admin' | 'staff';

export interface User {
  id: string;
  staff_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  department: string;
  subjects: string[];
  active: boolean;
  avatar?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DepartmentClass {
  id: string;
  year: 'First Year' | 'Second Year' | 'Third Year';
  course: 'AI' | 'ADS';
  section: 'Section A' | 'Section B' | 'General';
  class_name: string;
  short_code: string;
  active: boolean;
  color: string;
  created_at?: string;
}

export interface PeriodTiming {
  id: string;
  period_number: number;
  period_name: string;
  start_time: string; // HH:MM (24-hr format: "09:45")
  end_time: string;   // HH:MM (24-hr format: "10:35")
  start_display: string; // "9:45 AM"
  end_display: string;   // "10:35 AM"
  type: 'teaching';
  active: boolean;
}

export interface BreakTiming {
  id: string;
  break_name: string;
  start_time: string; // "11:25"
  end_time: string;   // "11:40"
  start_display: string; // "11:25 AM"
  end_display: string;   // "11:40 AM"
  type: 'short_break' | 'lunch_break';
  description: string;
}

export interface TimetableSlot {
  id: string;
  day: DayOfWeek;
  period_id: string;
  class_id: string;
  staff_id: string;
  subject_name?: string;
  room?: string;
  academic_year?: string;
  created_at?: string;
  updated_at?: string;
}

export type NotificationType =
  | 'UPCOMING_CLASS'      // 10 minutes before
  | 'CLASS_STARTED'       // At start time
  | 'SHORT_BREAK'         // Break 1 & 2
  | 'LUNCH_BREAK'         // Lunch
  | 'TIMETABLE_CHANGE'    // Admin changed slot
  | 'IMPORTANT_ANNOUNCEMENT'; // Broadcast

export interface AppNotification {
  id: string;
  dedup_key?: string;
  staff_id: string;      // specific staff id or 'ALL'
  staff_name?: string;
  timetable_id?: string;
  title: string;
  message: string;
  notification_type: NotificationType;
  class_name?: string;
  year?: string;
  course?: string;
  section?: string;
  period_number?: number;
  start_time?: string;
  end_time?: string;
  scheduled_time?: string;
  sent_time: string;
  read_status: boolean;
  date: string; // YYYY-MM-DD in IST
  created_at: string;
}

export interface CurrentTimeState {
  ist_time_str: string;        // "10:15:30 AM"
  ist_date_str: string;        // "Wednesday, September 2, 2026"
  ist_day: DayOfWeek;          // "Wednesday"
  current_time_24: string;     // "10:15"
  is_simulated: boolean;
  simulated_time_24?: string;
  simulated_day?: DayOfWeek;
  
  // Current slot info
  status: 'teaching' | 'break' | 'before_hours' | 'after_hours' | 'weekend';
  current_period?: PeriodTiming;
  current_break?: BreakTiming;
  minutes_remaining?: number;
  total_duration_minutes?: number;
  progress_percentage?: number;
  
  // Next event info
  next_event_type?: 'class' | 'break' | 'day_end' | 'day_start';
  next_period?: PeriodTiming;
  next_break?: BreakTiming;
  minutes_until_next?: number;
}

export interface StaffScheduleItem {
  period: PeriodTiming;
  slot?: TimetableSlot;
  class_info?: DepartmentClass;
  subject_name?: string;
  is_free_period: boolean;
  status: 'past' | 'current' | 'upcoming';
  minutes_remaining?: number;
  minutes_until_start?: number;
}

export interface StaffDaySchedule {
  staff: User;
  day: DayOfWeek;
  current_slot?: StaffScheduleItem;
  next_slot?: StaffScheduleItem;
  next_break?: BreakTiming;
  schedule: StaffScheduleItem[];
  all_breaks: BreakTiming[];
  total_classes_today: number;
  total_free_periods_today: number;
}

export interface ConflictIssue {
  type: 'staff_double_booked' | 'class_double_booked';
  day: DayOfWeek;
  period_id: string;
  period_name: string;
  period_time: string;
  staff_name?: string;
  class_name?: string;
  description: string;
  slots: TimetableSlot[];
}
