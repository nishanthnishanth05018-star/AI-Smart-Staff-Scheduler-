import { PeriodTiming, BreakTiming, DayOfWeek, CurrentTimeState } from '../types';
import { PERIODS, BREAKS, DAYS_OF_WEEK } from '../data/departmentData';

/**
 * Returns current IST time (UTC+5:30) as Date object
 */
export function getNowIST(): Date {
  const now = new Date();
  // Format to Asia/Kolkata
  const istFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  
  const parts = istFormatter.formatToParts(now);
  const partMap: Record<string, string> = {};
  parts.forEach(p => { partMap[p.type] = p.value; });
  
  return new Date(
    parseInt(partMap.year, 10),
    parseInt(partMap.month, 10) - 1,
    parseInt(partMap.day, 10),
    parseInt(partMap.hour === '24' ? '0' : partMap.hour, 10),
    parseInt(partMap.minute, 10),
    parseInt(partMap.second, 10)
  );
}

/**
 * Converts HH:MM string to minutes since midnight
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts minutes since midnight to HH:MM (24-hr) string
 */
export function minutesToTimeStr(totalMinutes: number): string {
  const normalized = Math.max(0, Math.min(23 * 60 + 59, Math.floor(totalMinutes)));
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/**
 * Converts HH:MM to 12-hour AM/PM display string
 */
export function formatTo12Hr(timeStr: string): string {
  if (!timeStr) return '';
  const [hoursRaw, minutesRaw] = timeStr.split(':').map(Number);
  const hours = hoursRaw % 24;
  const minutes = minutesRaw || 0;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Get current day of week in IST
 */
export function getISTDayOfWeek(date?: Date): DayOfWeek {
  const targetDate = date || getNowIST();
  const dayIndex = targetDate.getDay(); // 0 = Sunday, 1 = Monday...
  const days: DayOfWeek[] = ['Sunday' as any, 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayName = days[dayIndex];
  if (dayName === ('Sunday' as any)) {
    return 'Monday'; // Default to Monday if viewed on Sunday
  }
  return dayName;
}

/**
 * Evaluates the current time state given either live IST or a simulated time (HH:MM and Day)
 */
export function evaluateTimeState(
  simulatedTime?: string,
  simulatedDay?: DayOfWeek,
  isSimulated = false
): CurrentTimeState {
  const istDate = getNowIST();
  
  let currentMinutes: number;
  let currentDay: DayOfWeek;
  let timeStr24: string;
  let timeDisplayStr: string;

  if (isSimulated && simulatedTime) {
    currentMinutes = timeToMinutes(simulatedTime);
    currentDay = simulatedDay || getISTDayOfWeek(istDate);
    timeStr24 = simulatedTime;
    timeDisplayStr = formatTo12Hr(simulatedTime);
  } else {
    currentMinutes = istDate.getHours() * 60 + istDate.getMinutes();
    currentDay = getISTDayOfWeek(istDate);
    timeStr24 = `${String(istDate.getHours()).padStart(2, '0')}:${String(istDate.getMinutes()).padStart(2, '0')}`;
    timeDisplayStr = istDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }

  const dateDisplayStr = istDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Kolkata',
  });

  // Working day hours: 09:45 to 16:10
  const dayStartMinutes = timeToMinutes('09:45');
  const dayEndMinutes = timeToMinutes('16:10');

  // Check if currently inside a period
  const activePeriod = PERIODS.find(p => {
    const start = timeToMinutes(p.start_time);
    const end = timeToMinutes(p.end_time);
    return currentMinutes >= start && currentMinutes < end;
  });

  // Check if currently inside a break
  const activeBreak = BREAKS.find(b => {
    const start = timeToMinutes(b.start_time);
    const end = timeToMinutes(b.end_time);
    return currentMinutes >= start && currentMinutes < end;
  });

  let status: CurrentTimeState['status'] = 'before_hours';
  let minutesRemaining = 0;
  let totalDurationMinutes = 0;
  let progressPercentage = 0;

  if (activePeriod) {
    status = 'teaching';
    const start = timeToMinutes(activePeriod.start_time);
    const end = timeToMinutes(activePeriod.end_time);
    totalDurationMinutes = end - start;
    minutesRemaining = Math.max(0, end - currentMinutes);
    const elapsed = currentMinutes - start;
    progressPercentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDurationMinutes) * 100)));
  } else if (activeBreak) {
    status = 'break';
    const start = timeToMinutes(activeBreak.start_time);
    const end = timeToMinutes(activeBreak.end_time);
    totalDurationMinutes = end - start;
    minutesRemaining = Math.max(0, end - currentMinutes);
    const elapsed = currentMinutes - start;
    progressPercentage = Math.min(100, Math.max(0, Math.round((elapsed / totalDurationMinutes) * 100)));
  } else if (currentMinutes < dayStartMinutes) {
    status = 'before_hours';
    minutesRemaining = dayStartMinutes - currentMinutes;
  } else if (currentMinutes >= dayEndMinutes) {
    status = 'after_hours';
  }

  // Determine next upcoming event
  // Find all future periods and breaks today
  const futurePeriods = PERIODS.filter(p => timeToMinutes(p.start_time) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const futureBreaks = BREAKS.filter(b => timeToMinutes(b.start_time) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

  let next_event_type: CurrentTimeState['next_event_type'] = undefined;
  let next_period: PeriodTiming | undefined = undefined;
  let next_break: BreakTiming | undefined = undefined;
  let minutes_until_next: number | undefined = undefined;

  const nextPeriodStart = futurePeriods[0] ? timeToMinutes(futurePeriods[0].start_time) : Infinity;
  const nextBreakStart = futureBreaks[0] ? timeToMinutes(futureBreaks[0].start_time) : Infinity;

  if (nextPeriodStart < Infinity || nextBreakStart < Infinity) {
    if (nextBreakStart < nextPeriodStart) {
      next_event_type = 'break';
      next_break = futureBreaks[0];
      minutes_until_next = nextBreakStart - currentMinutes;
    } else {
      next_event_type = 'class';
      next_period = futurePeriods[0];
      minutes_until_next = nextPeriodStart - currentMinutes;
    }
  } else if (currentMinutes < dayStartMinutes) {
    next_event_type = 'day_start';
    next_period = PERIODS[0];
    minutes_until_next = dayStartMinutes - currentMinutes;
  } else {
    next_event_type = 'day_end';
  }

  return {
    ist_time_str: timeDisplayStr,
    ist_date_str: dateDisplayStr,
    ist_day: currentDay,
    current_time_24: timeStr24,
    is_simulated: isSimulated,
    simulated_time_24: simulatedTime,
    simulated_day: simulatedDay,
    status,
    current_period: activePeriod,
    current_break: activeBreak,
    minutes_remaining: minutesRemaining,
    total_duration_minutes: totalDurationMinutes,
    progress_percentage: progressPercentage,
    next_event_type,
    next_period: next_period || futurePeriods[0],
    next_break: next_break || futureBreaks[0],
    minutes_until_next,
  };
}

export function getCurrentISTTimeState(): CurrentTimeState {
  return evaluateTimeState();
}

export function getSimulatedTimeState(time24: string, day?: DayOfWeek): CurrentTimeState {
  return evaluateTimeState(time24, day, true);
}

