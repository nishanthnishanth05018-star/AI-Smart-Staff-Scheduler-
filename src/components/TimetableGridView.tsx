import React, { useState } from 'react';
import { TimetableSlot, DepartmentClass, User, DayOfWeek, PeriodTiming } from '../types';
import { PERIODS, BREAKS, DAYS_OF_WEEK } from '../data/departmentData';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  UserCheck, 
  BookOpen, 
  Sparkles, 
  AlertTriangle, 
  MapPin, 
  Coffee, 
  Utensils, 
  RotateCcw,
  Zap
} from 'lucide-react';

interface TimetableGridViewProps {
  timetable: TimetableSlot[];
  classes: DepartmentClass[];
  staffList: User[];
  onOpenAssignModal: (day: DayOfWeek, periodId: string, slot?: TimetableSlot) => void;
  onAutoGenerateAI: () => void;
  onResetTimetable: () => void;
}

export const TimetableGridView: React.FC<TimetableGridViewProps> = ({
  timetable,
  classes,
  staffList,
  onOpenAssignModal,
  onAutoGenerateAI,
  onResetTimetable,
}) => {
  const [filterStaffId, setFilterStaffId] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');
  const [filterCourse, setFilterCourse] = useState<string>('ALL');
  const [filterSection, setFilterSection] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter slots
  const filteredSlots = timetable.filter(slot => {
    if (filterStaffId !== 'ALL' && slot.staff_id !== filterStaffId) return false;

    const classObj = classes.find(c => c.id === slot.class_id);
    if (!classObj) return false;

    if (filterYear !== 'ALL' && classObj.year !== filterYear) return false;
    if (filterCourse !== 'ALL' && classObj.course !== filterCourse) return false;
    if (filterSection !== 'ALL' && classObj.section !== filterSection) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const staffObj = staffList.find(s => s.id === slot.staff_id);
      const matchesClass = classObj.class_name.toLowerCase().includes(q);
      const matchesStaff = staffObj?.name.toLowerCase().includes(q) || staffObj?.staff_id.toLowerCase().includes(q);
      const matchesSubject = slot.subject_name?.toLowerCase().includes(q);
      if (!matchesClass && !matchesStaff && !matchesSubject) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Action & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Master Department Timetable Matrix
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 6-Day Schedule • 6 Teaching Periods • Click any slot to edit or allocate
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAutoGenerateAI}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              AI Smart Auto-Balance Timetable
            </button>
            <button
              onClick={onResetTimetable}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
              title="Reset to default conflict-free timetable"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={() => onOpenAssignModal('Monday', 'P1')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              New Allocation
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5 pt-3 border-t border-slate-800">
          
          {/* Staff Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Staff</label>
            <select
              value={filterStaffId}
              onChange={(e) => setFilterStaffId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All 10 Staff Members</option>
              {staffList.map(s => (
                <option key={s.id} value={s.id}>{s.staff_id}: {s.name}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Year</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Academic Years</option>
              <option value="First Year">First Year (4 Secs)</option>
              <option value="Second Year">Second Year (4 Secs)</option>
              <option value="Third Year">Third Year (2 Secs)</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Filter by Course</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Courses</option>
              <option value="AI">Artificial Intelligence (AI)</option>
              <option value="ADS">Artificial Intelligence & Data Science (ADS)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Section</label>
            <select
              value={filterSection}
              onChange={(e) => setFilterSection(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Sections</option>
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="General">General / Single Sec</option>
            </select>
          </div>

          {/* Search Query */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Search Keywords</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Class, Staff, Subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

        </div>

      </div>

      {/* TIMETABLE GRID TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            
            {/* Table Header: Days of the Week */}
            <thead>
              <tr className="bg-slate-850 border-b border-slate-800">
                <th className="p-3.5 text-xs font-bold text-slate-300 uppercase tracking-wider w-40 bg-slate-900 sticky left-0 z-10 border-r border-slate-800">
                  Period / Exact Time
                </th>
                {DAYS_OF_WEEK.map(day => (
                  <th key={day} className="p-3.5 text-xs font-bold text-slate-200 text-center uppercase tracking-wider border-r border-slate-800 last:border-r-0">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body: 6 Periods with Breaks in between */}
            <tbody className="divide-y divide-slate-800">
              
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

            </tbody>
          </table>
        </div>
      </div>

    </div>
  );

  function renderPeriodRow(period: PeriodTiming) {
    return (
      <tr key={period.id} className="hover:bg-slate-850/40 transition-colors">
        
        {/* Row Header: Period Timing */}
        <td className="p-3 bg-slate-900/90 border-r border-slate-800 sticky left-0 z-10">
          <div className="font-bold text-white text-xs sm:text-sm">{period.period_name}</div>
          <div className="text-[11px] font-mono text-indigo-400 font-semibold">{period.start_display} – {period.end_display}</div>
          <div className="text-[10px] text-slate-500">50 mins teaching</div>
        </td>

        {/* Days Columns */}
        {DAYS_OF_WEEK.map(day => {
          const matchingSlots = filteredSlots.filter(s => s.day === day && s.period_id === period.id);

          return (
            <td
              key={day}
              className="p-2 border-r border-slate-800/80 last:border-r-0 align-top min-w-[150px] relative group"
            >
              <div className="space-y-1.5 min-h-[68px] flex flex-col justify-start">
                {matchingSlots.length > 0 ? (
                  matchingSlots.map(slot => {
                    const classObj = classes.find(c => c.id === slot.class_id);
                    const staffObj = staffList.find(s => s.id === slot.staff_id);

                    return (
                      <div
                        key={slot.id}
                        onClick={() => onOpenAssignModal(day, period.id, slot)}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500 cursor-pointer transition-all shadow-sm group/slot text-left"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[11px] text-white line-clamp-1">
                            {classObj?.short_code || classObj?.class_name || 'Class'}
                          </span>
                          <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                            {slot.room || '101'}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-300 font-medium line-clamp-1 mt-0.5">
                          {staffObj ? `${staffObj.staff_id}: ${staffObj.name.split(' ')[1] || staffObj.name}` : 'Staff'}
                        </div>

                        <div className="text-[9px] text-indigo-400/90 truncate">
                          {slot.subject_name || 'AI Subject'}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <button
                    onClick={() => onOpenAssignModal(day, period.id)}
                    className="w-full h-full min-h-[60px] rounded-lg border border-dashed border-slate-800 hover:border-slate-600 hover:bg-slate-800/30 flex items-center justify-center text-slate-600 hover:text-slate-400 text-xs transition-all gap-1 group/btn"
                  >
                    <Plus className="w-3.5 h-3.5 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    <span className="text-[10px] opacity-0 group-hover/btn:opacity-100">Assign</span>
                  </button>
                )}
              </div>
            </td>
          );
        })}
      </tr>
    );
  }

  function renderBreakRow(brk: typeof BREAKS[0]) {
    return (
      <tr key={brk.id} className="bg-amber-950/20 border-y border-amber-900/40 text-center">
        <td className="p-2 bg-amber-950/40 border-r border-amber-900/40 sticky left-0 z-10 text-left">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            {brk.type === 'lunch_break' ? <Utensils className="w-3.5 h-3.5" /> : <Coffee className="w-3.5 h-3.5" />}
            {brk.break_name}
          </div>
          <div className="text-[11px] font-mono text-amber-400 font-semibold">{brk.start_display} – {brk.end_display}</div>
        </td>
        <td colSpan={6} className="p-2 text-xs font-medium text-amber-200/90 tracking-wide">
          ☕ Scheduled Department Break ({brk.start_display} – {brk.end_display}) • {brk.description} • All Staff
        </td>
      </tr>
    );
  }
};
