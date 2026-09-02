import React, { useState, useEffect } from 'react';
import { User, DepartmentClass, PeriodTiming, DayOfWeek, TimetableSlot } from '../types';
import { PERIODS, DAYS_OF_WEEK } from '../data/departmentData';
import { X, AlertTriangle, Check, Trash2, Calendar, Clock, BookOpen, UserCheck } from 'lucide-react';

interface AssignSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (slotData: Partial<TimetableSlot>, allowOverride: boolean) => Promise<{ success: boolean; error?: string }>;
  onDelete?: (slotId: string) => void;
  initialSlot?: TimetableSlot | null;
  initialDay?: DayOfWeek;
  initialPeriodId?: string;
  staffList: User[];
  classList: DepartmentClass[];
  allTimetable: TimetableSlot[];
}

export const AssignSlotModal: React.FC<AssignSlotModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialSlot,
  initialDay = 'Monday',
  initialPeriodId = 'P1',
  staffList,
  classList,
  allTimetable,
}) => {
  const [day, setDay] = useState<DayOfWeek>(initialDay);
  const [periodId, setPeriodId] = useState<string>(initialPeriodId);
  const [classId, setClassId] = useState<string>(classList[0]?.id || '');
  const [staffId, setStaffId] = useState<string>(staffList[0]?.id || '');
  const [subjectName, setSubjectName] = useState<string>('');
  const [room, setRoom] = useState<string>('Hall 101');
  
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [allowOverride, setAllowOverride] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialSlot) {
      setDay(initialSlot.day);
      setPeriodId(initialSlot.period_id);
      setClassId(initialSlot.class_id);
      setStaffId(initialSlot.staff_id);
      setSubjectName(initialSlot.subject_name || '');
      setRoom(initialSlot.room || 'Hall 101');
    } else {
      setDay(initialDay);
      setPeriodId(initialPeriodId);
      if (classList[0]) setClassId(classList[0].id);
      if (staffList[0]) setStaffId(staffList[0].id);
      setSubjectName('');
      setRoom('Hall 101');
    }
    setConflictWarning(null);
    setAllowOverride(false);
    setErrorMsg(null);
  }, [initialSlot, initialDay, initialPeriodId, isOpen]);

  // Real-time conflict validation
  useEffect(() => {
    if (!staffId || !classId || !day || !periodId) {
      setConflictWarning(null);
      return;
    }

    // Check staff conflict
    const staffBusy = allTimetable.find(
      s => s.day === day && s.period_id === periodId && s.staff_id === staffId && s.id !== initialSlot?.id
    );

    if (staffBusy) {
      const busyClass = classList.find(c => c.id === staffBusy.class_id);
      const busyStaff = staffList.find(st => st.id === staffId);
      setConflictWarning(
        `⚠️ Staff Double-Booking: ${busyStaff?.name || 'Staff'} is already scheduled for ${busyClass?.class_name || 'another class'} during this period!`
      );
      return;
    }

    // Check class conflict
    const classBusy = allTimetable.find(
      s => s.day === day && s.period_id === periodId && s.class_id === classId && s.id !== initialSlot?.id
    );

    if (classBusy) {
      const busyStaff = staffList.find(st => st.id === classBusy.staff_id);
      const busyClass = classList.find(c => c.id === classId);
      setConflictWarning(
        `⚠️ Class Double-Booking: ${busyClass?.class_name || 'This class'} is already assigned to ${busyStaff?.name || 'another staff'} during this period!`
      );
      return;
    }

    setConflictWarning(null);
  }, [day, periodId, classId, staffId, allTimetable, initialSlot]);

  // Auto-fill subject recommendation based on staff's subject expertise
  const handleStaffChange = (newStaffId: string) => {
    setStaffId(newStaffId);
    const selectedStaff = staffList.find(s => s.id === newStaffId);
    if (selectedStaff && selectedStaff.subjects.length > 0 && !subjectName) {
      setSubjectName(selectedStaff.subjects[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSaving(true);

    try {
      const result = await onSave(
        {
          id: initialSlot?.id,
          day,
          period_id: periodId,
          class_id: classId,
          staff_id: staffId,
          subject_name: subjectName.trim() || 'AI Core Subject',
          room: room.trim() || 'Hall 101',
        },
        allowOverride
      );

      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.error || 'Failed to save timetable slot');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const currentPeriod = PERIODS.find(p => p.id === periodId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {initialSlot ? 'Edit Class Allocation' : 'Assign Timetable Slot'}
              </h3>
              <p className="text-xs text-slate-400">
                Department Timetable Management • Conflict Protection
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Conflict Warning Banner */}
          {conflictWarning && (
            <div className="p-3.5 rounded-xl bg-amber-950/50 border border-amber-500/60 space-y-2">
              <div className="flex items-start gap-2 text-xs text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{conflictWarning}</span>
              </div>
              <label className="flex items-center gap-2 pt-1 border-t border-amber-900/60 text-xs text-amber-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allowOverride}
                  onChange={(e) => setAllowOverride(e.target.checked)}
                  className="rounded border-amber-600 text-indigo-600 focus:ring-amber-500"
                />
                <span>Allow admin override (team teaching / co-faculty)</span>
              </label>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200">
              {errorMsg}
            </div>
          )}

          {/* Day & Period Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Day of Week
              </label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value as DayOfWeek)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              >
                {DAYS_OF_WEEK.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teaching Period
              </label>
              <select
                value={periodId}
                onChange={(e) => setPeriodId(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              >
                {PERIODS.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.period_name} ({p.start_display} – {p.end_display})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Period Timing Badge */}
          {currentPeriod && (
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Exact IST Timing:
              </span>
              <span className="font-mono font-bold text-indigo-300">
                {currentPeriod.start_display} – {currentPeriod.end_display} (50 Mins)
              </span>
            </div>
          )}

          {/* Class / Section Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              Target Class & Section (10 Classes)
            </label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {classList.map(c => (
                <option key={c.id} value={c.id}>
                  {c.class_name} ({c.year} • {c.course})
                </option>
              ))}
            </select>
          </div>

          {/* Staff Member Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              Assigned Faculty Member (10 Staff)
            </label>
            <select
              value={staffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              {staffList.map(s => (
                <option key={s.id} value={s.id}>
                  {s.staff_id}: {s.name} ({s.subjects[0] || 'AI Dept'})
                </option>
              ))}
            </select>
          </div>

          {/* Subject & Classroom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Subject / Course Module
              </label>
              <input
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g. Deep Learning Principles"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Classroom / Lab
              </label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Hall 101 / AI Lab"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {initialSlot && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Remove this class allocation from timetable?')) {
                    onDelete(initialSlot.id);
                    onClose();
                  }
                }}
                className="px-3 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold flex items-center gap-1.5 border border-red-800/60 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove Allocation
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving || (!!conflictWarning && !allowOverride)}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5 ${
                  conflictWarning && !allowOverride
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'
                }`}
              >
                <Check className="w-4 h-4" />
                {isSaving ? 'Saving...' : initialSlot ? 'Update Timetable' : 'Save Timetable'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
