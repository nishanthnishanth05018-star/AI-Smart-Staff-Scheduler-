import { db } from './data/store';
import { evaluateTimeState, timeToMinutes, getNowIST, getISTDayOfWeek } from '../src/utils/timeUtils';
import { PERIODS, BREAKS } from '../src/data/departmentData';
import { TimetableSlot, AppNotification, DayOfWeek } from '../src/types';

export class SchedulerEngine {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.start();
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[Scheduler Engine] Started background IST scheduling engine (tick: 5s)');
    this.timer = setInterval(() => {
      this.runTick();
    }, 5000);
    // Run initial tick immediately
    this.runTick();
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public runTick(): { newNotificationsCount: number; evaluatedTime: string; currentDay: string } {
    const simulation = db.getSimulation();
    const settings = db.getSettings();
    const timeState = evaluateTimeState(
      simulation.enabled ? simulation.time24 : undefined,
      simulation.enabled ? simulation.day : undefined,
      simulation.enabled
    );

    const nowIST = getNowIST();
    // Use date string in format YYYY-MM-DD
    const dateStr = simulation.enabled
      ? `2026-09-02_${simulation.day}`
      : `${nowIST.getFullYear()}-${String(nowIST.getMonth() + 1).padStart(2, '0')}-${String(nowIST.getDate()).padStart(2, '0')}`;

    const currentMinutes = timeToMinutes(timeState.current_time_24);
    const currentDay = timeState.ist_day;
    const timetable = db.getTimetable();
    const classes = db.getClasses();
    const allStaff = db.getStaffMembers();

    let newCount = 0;

    // 1. Check Break Notifications (if enabled)
    if (settings.breakAlertsEnabled) {
      // Short Break 1 (11:25 – 11:40)
      const b1Start = timeToMinutes('11:25');
      const b1End = timeToMinutes('11:40');
      if (currentMinutes >= b1Start && currentMinutes < b1End) {
        const added = db.addNotification({
          dedup_key: `dedup_break_sb1_${dateStr}`,
          staff_id: 'ALL',
          title: '☕ Short Break',
          message: 'Break Time: 11:25 AM – 11:40 AM\nYour next teaching period starts at 11:40 AM.',
          notification_type: 'SHORT_BREAK',
          start_time: '11:25 AM',
          end_time: '11:40 AM',
          sent_time: timeState.ist_time_str,
          read_status: false,
          date: dateStr,
        });
        if (added) newCount++;
      }

      // Lunch Break (12:30 – 1:30)
      const lunchStart = timeToMinutes('12:30');
      const lunchEnd = timeToMinutes('13:30');
      if (currentMinutes >= lunchStart && currentMinutes < lunchEnd) {
        const added = db.addNotification({
          dedup_key: `dedup_break_lunch_${dateStr}`,
          staff_id: 'ALL',
          title: '🍴 Lunch Break',
          message: 'Lunch break starts now.\nBreak Time: 12:30 PM – 1:30 PM\nYour next teaching period starts at 1:30 PM.',
          notification_type: 'LUNCH_BREAK',
          start_time: '12:30 PM',
          end_time: '1:30 PM',
          sent_time: timeState.ist_time_str,
          read_status: false,
          date: dateStr,
        });
        if (added) newCount++;
      }

      // Short Break 2 (3:10 – 3:20 / 15:10 – 15:20)
      const b2Start = timeToMinutes('15:10');
      const b2End = timeToMinutes('15:20');
      if (currentMinutes >= b2Start && currentMinutes < b2End) {
        const added = db.addNotification({
          dedup_key: `dedup_break_sb2_${dateStr}`,
          staff_id: 'ALL',
          title: '☕ Short Break',
          message: 'Break Time: 3:10 PM – 3:20 PM\nYour final teaching period starts at 3:20 PM.',
          notification_type: 'SHORT_BREAK',
          start_time: '3:10 PM',
          end_time: '3:20 PM',
          sent_time: timeState.ist_time_str,
          read_status: false,
          date: dateStr,
        });
        if (added) newCount++;
      }
    }

    // 2. Check Period Notifications (Reminders & Class Started)
    const todaySlots = timetable.filter(s => s.day === currentDay);

    PERIODS.forEach(period => {
      const pStart = timeToMinutes(period.start_time);
      const pEnd = timeToMinutes(period.end_time);
      const reminderStart = pStart - 10; // 10 minutes before

      // Find slots scheduled for this period today
      const periodSlots = todaySlots.filter(s => s.period_id === period.id);

      periodSlots.forEach(slot => {
        const classObj = classes.find(c => c.id === slot.class_id);
        const className = classObj ? classObj.class_name : 'Assigned Class';
        const year = classObj?.year || 'Department';
        const course = classObj?.course || 'AI/ADS';
        const section = classObj?.section || 'Sec A';

        // A. 10-Minute Reminder (reminderStart <= currentMinutes < pStart)
        if (settings.remindersEnabled && currentMinutes >= reminderStart && currentMinutes < pStart) {
          const added = db.addNotification({
            dedup_key: `dedup_reminder_${dateStr}_slot_${slot.id}_p${period.period_number}`,
            staff_id: slot.staff_id,
            timetable_id: slot.id,
            title: '🔔 Upcoming Class',
            message: `Your next class starts in 10 minutes.\nClass: ${className}\nPeriod: ${period.period_number}\nTime: ${period.start_display} – ${period.end_display}\nPlease get ready for your class.`,
            notification_type: 'UPCOMING_CLASS',
            class_name: className,
            year,
            course,
            section,
            period_number: period.period_number,
            start_time: period.start_display,
            end_time: period.end_display,
            sent_time: timeState.ist_time_str,
            read_status: false,
            date: dateStr,
          });
          if (added) newCount++;
        }

        // B. Class Started Notification (pStart <= currentMinutes < pEnd)
        if (currentMinutes >= pStart && currentMinutes < pEnd) {
          const added = db.addNotification({
            dedup_key: `dedup_started_${dateStr}_slot_${slot.id}_p${period.period_number}`,
            staff_id: slot.staff_id,
            timetable_id: slot.id,
            title: '🏫 Class Started',
            message: `Your Period ${period.period_number} class starts now.\nClass: ${className}\nTime: ${period.start_display} – ${period.end_display}\nPlease attend the class.`,
            notification_type: 'CLASS_STARTED',
            class_name: className,
            year,
            course,
            section,
            period_number: period.period_number,
            start_time: period.start_display,
            end_time: period.end_display,
            sent_time: timeState.ist_time_str,
            read_status: false,
            date: dateStr,
          });
          if (added) newCount++;
        }
      });
    });

    return {
      newNotificationsCount: newCount,
      evaluatedTime: timeState.ist_time_str,
      currentDay: timeState.ist_day,
    };
  }
}

export const scheduler = new SchedulerEngine();
