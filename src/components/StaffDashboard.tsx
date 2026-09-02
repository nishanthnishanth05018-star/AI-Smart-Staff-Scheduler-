import React, { useState } from 'react';
import { User, CurrentTimeState, TimetableSlot, DepartmentClass, DayOfWeek, AppNotification } from '../types';
import { PERIODS, BREAKS, DAYS_OF_WEEK } from '../data/departmentData';
import { timeToMinutes, formatTo12Hr } from '../utils/timeUtils';
import { 
  Clock, 
  BookOpen, 
  Coffee, 
  Utensils, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  MapPin, 
  Bell, 
  Check, 
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface StaffDashboardProps {
  staff: User;
  timeState: CurrentTimeState;
  timetable: TimetableSlot[];
  classes: DepartmentClass[];
  notifications: AppNotification[];
  onOpenNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  staff,
  timeState,
  timetable,
  classes,
  notifications,
  onOpenNotifications,
  onMarkNotificationRead,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'weekly'>('today');
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState<DayOfWeek>(timeState.ist_day || 'Monday');

  const currentDay = timeState.ist_day || 'Monday';
  const currentMinutes = timeToMinutes(timeState.current_time_24);

  // Staff's slots for today
  const todaySlots = timetable.filter(s => s.staff_id === staff.id && s.day === currentDay);

  // Staff's slots for selected weekly day
  const weeklyDaySlots = timetable.filter(s => s.staff_id === staff.id && s.day === selectedWeeklyDay);

  // Find staff's slot in the currently active period (if in a teaching period)
  const currentPeriodSlot = timeState.current_period
    ? todaySlots.find(s => s.period_id === timeState.current_period?.id)
    : undefined;

  const currentClassInfo = currentPeriodSlot
    ? classes.find(c => c.id === currentPeriodSlot.class_id)
    : undefined;

  // Find next upcoming class today for this staff member
  const upcomingSlotsToday = todaySlots
    .filter(slot => {
      const period = PERIODS.find(p => p.id === slot.period_id);
      return period && timeToMinutes(period.start_time) > currentMinutes;
    })
    .sort((a, b) => {
      const pA = PERIODS.find(p => p.id === a.period_id);
      const pB = PERIODS.find(p => p.id === b.period_id);
      return timeToMinutes(pA?.start_time || '00:00') - timeToMinutes(pB?.start_time || '00:00');
    });

  const nextSlot = upcomingSlotsToday[0];
  const nextPeriod = nextSlot ? PERIODS.find(p => p.id === nextSlot.period_id) : undefined;
  const nextClassInfo = nextSlot ? classes.find(c => c.id === nextSlot.class_id) : undefined;
  const minutesUntilNextClass = nextPeriod
    ? timeToMinutes(nextPeriod.start_time) - currentMinutes
    : undefined;

  // Next break today
  const upcomingBreaksToday = BREAKS
    .filter(b => timeToMinutes(b.start_time) > currentMinutes)
    .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));
  const nextBreak = upcomingBreaksToday[0];
  const minutesUntilNextBreak = nextBreak
    ? timeToMinutes(nextBreak.start_time) - currentMinutes
    : undefined;

  // Count total classes today
  const totalClassesToday = todaySlots.length;
  const totalFreePeriodsToday = Math.max(0, 6 - totalClassesToday);

  // Staff notifications
  const staffNotifs = notifications.filter(
    n => n.staff_id === staff.id || n.staff_id === 'ALL'
  ).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Personalized Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-purple-950/80 border border-indigo-900/60 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              Department Staff Portal • {staff.staff_id}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Good {currentMinutes < 12 * 60 ? 'Morning' : 'Afternoon'}, {staff.name} 👋
            </h2>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {staff.department} • Today is <span className="font-semibold text-white">{currentDay}, {timeState.ist_date_str}</span>
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {staff.subjects.map((sub, idx) => (
                <span key={idx} className="px-2.5 py-0.5 rounded-md bg-slate-800/80 text-[11px] text-slate-300 border border-slate-700/60">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <div className="text-center px-3 border-r border-slate-800">
              <div className="text-2xl font-black text-indigo-400">{totalClassesToday}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Classes Today</div>
            </div>
            <div className="text-center px-3">
              <div className="text-2xl font-black text-emerald-400">{totalFreePeriodsToday}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Free Periods</div>
            </div>
          </div>
        </div>
      </div>

      {/* TOP HERO SECTION: Current Class Card & Next Event Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* CURRENT CLASS CARD (Span 7) */}
        <div className="lg:col-span-7">
          <div className="h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden flex flex-col">
            
            {/* Card Header Bar */}
            <div className="px-5 py-3.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Current Period Status
                </h3>
              </div>
              <div className="text-xs font-mono font-bold text-indigo-300">
                {timeState.ist_time_str}
              </div>
            </div>

            {/* Card Body */}
            <div className="p-6 flex-1 flex flex-col justify-between">
              {timeState.status === 'teaching' && timeState.current_period ? (
                currentPeriodSlot && currentClassInfo ? (
                  /* Staff has class in this period */
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        🟢 CURRENT CLASS
                      </span>
                      <span className="text-sm font-bold font-mono text-slate-300">
                        {timeState.current_period.period_name} ({timeState.current_period.start_display} – {timeState.current_period.end_display})
                      </span>
                    </div>

                    <div>
                      <h4 className="text-2xl font-bold text-white tracking-tight">
                        {currentClassInfo.class_name}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-300">
                        <span className="font-semibold text-indigo-300">{currentPeriodSlot.subject_name || 'AI Subject'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <MapPin className="w-3.5 h-3.5" /> {currentPeriodSlot.room || 'Hall 101'}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">{currentClassInfo.year}</span>
                      </div>
                    </div>

                    {/* Progress Bar & Countdown */}
                    <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-emerald-400" />
                          Class Progress
                        </span>
                        <span className="font-bold text-emerald-400 font-mono text-sm">
                          ⏱️ {timeState.minutes_remaining ?? 0} minutes remaining
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                          style={{ width: `${timeState.progress_percentage || 5}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Staff has Free Period */
                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        🟢 FREE PERIOD
                      </span>
                      <span className="text-sm font-mono text-slate-400">
                        {timeState.current_period.period_name} ({timeState.current_period.start_display} – {timeState.current_period.end_display})
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">No Class Assigned Right Now</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        You have a free period during {timeState.current_period.period_name}. Use this time for research, student mentoring, or course preparation.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Free period ends in <strong className="text-emerald-400 font-mono">{timeState.minutes_remaining} minutes</strong> ({timeState.current_period.end_display}).</span>
                    </div>
                  </div>
                )
              ) : timeState.status === 'break' && timeState.current_break ? (
                /* Currently on Break */
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                      {timeState.current_break.type === 'lunch_break' ? <Utensils className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                      {timeState.current_break.break_name.toUpperCase()}
                    </span>
                    <span className="text-sm font-mono text-amber-300 font-bold">
                      {timeState.current_break.start_display} – {timeState.current_break.end_display}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-white">{timeState.current_break.description}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Department break in progress. All staff members are on scheduled break.
                    </p>
                  </div>
                  <div className="bg-amber-950/30 border border-amber-900/50 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-xs text-amber-200">Time remaining in break:</span>
                    <span className="text-base font-bold font-mono text-amber-400">
                      ⏱️ {timeState.minutes_remaining} mins remaining
                    </span>
                  </div>
                </div>
              ) : timeState.status === 'before_hours' ? (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-800">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Department Day Starts at 9:45 AM</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Classes begin with Period 1 at 9:45 AM IST. Your schedule will activate automatically.
                  </p>
                </div>
              ) : (
                <div className="py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Department Working Day Concluded</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All 6 teaching periods and breaks for today have completed (4:10 PM IST).
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NEXT CLASS & NEXT EVENT CARD (Span 5) */}
        <div className="lg:col-span-5">
          <div className="h-full rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden flex flex-col justify-between p-6 space-y-4">
            
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  Upcoming Event & Next Class
                </h3>
              </div>

              {/* Next Break (if before next class) */}
              {nextBreak && minutesUntilNextBreak !== undefined && (!minutesUntilNextClass || minutesUntilNextBreak < minutesUntilNextClass) && (
                <div className="mt-4 p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-300 flex items-center gap-1.5">
                      {nextBreak.type === 'lunch_break' ? <Utensils className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
                      ☕ NEXT EVENT: {nextBreak.break_name}
                    </span>
                    <span className="font-mono text-amber-400 font-bold">
                      in {minutesUntilNextBreak} mins
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    {nextBreak.start_display} – {nextBreak.end_display} ({nextBreak.description})
                  </div>
                </div>
              )}

              {/* Next Class */}
              {nextSlot && nextPeriod && nextClassInfo ? (
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      🔔 NEXT CLASS
                    </span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      Starts in {minutesUntilNextClass} minutes
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="text-xs font-mono font-semibold text-slate-400">
                      {nextPeriod.period_name} • {nextPeriod.start_display} – {nextPeriod.end_display}
                    </div>
                    <div className="text-lg font-bold text-white">
                      {nextClassInfo.class_name}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="text-indigo-300 font-medium">{nextSlot.subject_name || 'AI Course'}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {nextSlot.room || 'Hall 102'}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 text-center py-4 text-xs text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
                  No more classes scheduled for you for the remainder of today.
                </div>
              )}
            </div>

            {/* In-app recent notification preview */}
            <div className="pt-3 border-t border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                  <Bell className="w-3.5 h-3.5 text-indigo-400" /> Recent In-App Alerts
                </span>
                <button
                  onClick={onOpenNotifications}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-0.5"
                >
                  View All ({notifications.length}) <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {staffNotifs.length > 0 ? (
                <div className="space-y-1.5">
                  {staffNotifs.slice(0, 2).map(n => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`p-2 rounded-lg text-xs flex items-start justify-between gap-2 cursor-pointer transition-colors ${
                        !n.read_status ? 'bg-indigo-950/40 border border-indigo-800/60 text-slate-200' : 'bg-slate-950/40 text-slate-400'
                      }`}
                    >
                      <div className="truncate">
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <div className="text-[11px] text-slate-400 truncate">{n.message.split('\n')[0]}</div>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">{n.sent_time}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 italic">
                  Automatic reminders & break alerts will appear here.
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* TIMETABLE VIEW SECTION: Today's Timeline vs Weekly Schedule Tabs */}
      <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl p-6">
        
        {/* Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'today'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Today's Timetable ({currentDay})
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
                activeTab === 'weekly'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              Weekly Schedule (Mon – Sat)
            </button>
          </div>

          <div className="text-xs text-slate-400">
            6 Teaching Periods • 3 Scheduled Breaks • Exact IST Timings
          </div>
        </div>

        {/* Tab 1: Today's Full Chronological Timetable (Periods + Breaks) */}
        {activeTab === 'today' && (
          <div className="mt-6 space-y-3">
            
            {/* Chronological list of 6 Periods & 3 Breaks */}
            {/* Structure:
                - Period 1 (09:45 - 10:35)
                - Period 2 (10:35 - 11:25)
                - Short Break 1 (11:25 - 11:40)
                - Period 3 (11:40 - 12:30)
                - Lunch Break (12:30 - 13:30)
                - Period 4 (13:30 - 14:20)
                - Period 5 (14:20 - 15:10)
                - Short Break 2 (15:10 - 15:20)
                - Period 6 (15:20 - 16:10)
            */}
            
            {/* Period 1 */}
            {renderPeriodRow(PERIODS[0])}
            {/* Period 2 */}
            {renderPeriodRow(PERIODS[1])}
            {/* Short Break 1 */}
            {renderBreakRow(BREAKS[0])}
            {/* Period 3 */}
            {renderPeriodRow(PERIODS[2])}
            {/* Lunch Break */}
            {renderBreakRow(BREAKS[1])}
            {/* Period 4 */}
            {renderPeriodRow(PERIODS[3])}
            {/* Period 5 */}
            {renderPeriodRow(PERIODS[4])}
            {/* Short Break 2 */}
            {renderBreakRow(BREAKS[2])}
            {/* Period 6 */}
            {renderPeriodRow(PERIODS[5])}

          </div>
        )}

        {/* Tab 2: Weekly Schedule by Day */}
        {activeTab === 'weekly' && (
          <div className="mt-6 space-y-6">
            
            {/* Day Selector Pills */}
            <div className="flex flex-wrap gap-2">
              {DAYS_OF_WEEK.map(day => {
                const daySlotsCount = timetable.filter(s => s.staff_id === staff.id && s.day === day).length;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedWeeklyDay(day)}
                    className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedWeeklyDay === day
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <span>{day}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
                      {daySlotsCount} classes
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Day Timetable Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PERIODS.map(period => {
                const slot = weeklyDaySlots.find(s => s.period_id === period.id);
                const classObj = slot ? classes.find(c => c.id === slot.class_id) : undefined;
                return (
                  <div
                    key={period.id}
                    className={`p-4 rounded-xl border transition-all ${
                      slot
                        ? 'bg-slate-800/80 border-indigo-900/60 hover:border-indigo-500'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-700/50">
                      <span className="font-bold font-mono text-slate-300">{period.period_name}</span>
                      <span className="font-mono text-slate-400">{period.start_display} – {period.end_display}</span>
                    </div>

                    {slot && classObj ? (
                      <div className="mt-3 space-y-1.5">
                        <div className="font-bold text-white text-base">{classObj.class_name}</div>
                        <div className="text-xs text-indigo-300 font-medium">{slot.subject_name || 'AI Subject'}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {slot.room || 'Hall 101'} • {classObj.year}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-xs text-slate-500 italic flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" /> Free Period (No Class)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        )}

      </div>
    </div>
  );

  // Helper renderers for chronological timeline rows
  function renderPeriodRow(period: typeof PERIODS[0]) {
    const slot = todaySlots.find(s => s.period_id === period.id);
    const classObj = slot ? classes.find(c => c.id === slot.class_id) : undefined;

    const pStart = timeToMinutes(period.start_time);
    const pEnd = timeToMinutes(period.end_time);
    const isCurrent = currentMinutes >= pStart && currentMinutes < pEnd;
    const isPast = currentMinutes >= pEnd;
    const isUpcoming = currentMinutes < pStart;

    return (
      <div
        key={period.id}
        className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isCurrent
            ? 'bg-indigo-950/60 border-indigo-500 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-500/10'
            : isPast
            ? 'bg-slate-950/50 border-slate-800/80 opacity-75'
            : 'bg-slate-800/60 border-slate-700/60'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-bold text-xs ${
            isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
          }`}>
            P{period.period_number}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm sm:text-base">
                {period.period_name}
              </span>
              <span className="text-xs font-mono text-slate-400">
                ({period.start_display} – {period.end_display})
              </span>
              {isCurrent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                  ACTIVE NOW
                </span>
              )}
            </div>

            {slot && classObj ? (
              <div className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-indigo-300">{classObj.class_name}</span>
                <span>•</span>
                <span className="text-slate-400">{slot.subject_name || 'AI Subject'}</span>
                <span>•</span>
                <span className="text-slate-400">{slot.room || 'Hall 101'}</span>
              </div>
            ) : (
              <div className="text-xs text-emerald-400/90 font-medium mt-0.5">
                🟢 Free Period (Preparation & Research)
              </div>
            )}
          </div>
        </div>

        <div>
          {slot && classObj ? (
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
              isCurrent
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : isPast
                ? 'bg-slate-800 text-slate-400'
                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
            }`}>
              {isCurrent ? 'In Progress' : isPast ? 'Completed' : 'Upcoming'}
            </span>
          ) : (
            <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-slate-800 text-emerald-400 border border-emerald-500/20">
              Free Period
            </span>
          )}
        </div>
      </div>
    );
  }

  function renderBreakRow(brk: typeof BREAKS[0]) {
    const bStart = timeToMinutes(brk.start_time);
    const bEnd = timeToMinutes(brk.end_time);
    const isCurrent = currentMinutes >= bStart && currentMinutes < bEnd;

    return (
      <div
        key={brk.id}
        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
          isCurrent
            ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/20 text-amber-200'
            : 'bg-amber-950/10 border-amber-900/30 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
            {brk.type === 'lunch_break' ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
          </div>
          <div>
            <span className="font-bold text-xs sm:text-sm text-amber-300">{brk.break_name}</span>
            <span className="text-xs text-slate-400 ml-2 font-mono">({brk.start_display} – {brk.end_display})</span>
            <span className="text-[11px] text-slate-500 hidden sm:inline ml-2">• {brk.description}</span>
          </div>
        </div>

        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {isCurrent ? 'Break in Progress' : 'Department Break'}
        </span>
      </div>
    );
  }
};
