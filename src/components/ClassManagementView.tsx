import React from 'react';
import { DepartmentClass, TimetableSlot, User } from '../types';
import { BookOpen, Layers, Users, Calendar, CheckCircle2 } from 'lucide-react';

interface ClassManagementViewProps {
  classes: DepartmentClass[];
  timetable: TimetableSlot[];
  staffList: User[];
  onOpenAssignModal: (day: any, periodId: string) => void;
}

export const ClassManagementView: React.FC<ClassManagementViewProps> = ({
  classes,
  timetable,
  staffList,
  onOpenAssignModal,
}) => {
  const years = ['First Year', 'Second Year', 'Third Year'] as const;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            Department Class & Section Directory
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              10 Classes & Sections
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Structured for AI & ADS Department • 1st Year (4 Secs), 2nd Year (4 Secs), 3rd Year (2 Secs)
          </p>
        </div>
      </div>

      {/* Year Sections */}
      {years.map(year => {
        const yearClasses = classes.filter(c => c.year === year);

        return (
          <div key={year} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-300 uppercase tracking-wider">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{year} ({yearClasses.length} Sections)</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {yearClasses.map(cls => {
                const classSlots = timetable.filter(s => s.class_id === cls.id);
                // Unique staff handling this class
                const assignedStaffIds = Array.from(new Set(classSlots.map(s => s.staff_id)));
                const assignedStaffList = assignedStaffIds
                  .map(id => staffList.find(s => s.id === id))
                  .filter(Boolean) as User[];

                return (
                  <div
                    key={cls.id}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-900/80 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-800">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                            {cls.short_code}
                          </span>
                          <h4 className="font-bold text-white text-base mt-1.5">{cls.class_name}</h4>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Section" />
                      </div>

                      <div className="py-3 space-y-2 text-xs text-slate-300">
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Specialization:</span>
                          <span className="font-semibold text-white">{cls.course === 'AI' ? 'Artificial Intelligence' : 'Applied Data Science'}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Section:</span>
                          <span className="font-semibold text-white">{cls.section}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400">
                          <span>Scheduled Periods / Week:</span>
                          <span className="font-bold font-mono text-emerald-400">{classSlots.length} / 36</span>
                        </div>

                        {/* Assigned Faculty chips */}
                        <div className="pt-2">
                          <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">
                            Assigned Faculty ({assignedStaffList.length}):
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {assignedStaffList.length > 0 ? (
                              assignedStaffList.map(s => (
                                <span key={s.id} className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 border border-slate-700">
                                  {s.staff_id}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-500 italic">No faculty assigned yet</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800">
                      <button
                        onClick={() => onOpenAssignModal('Monday', 'P1')}
                        className="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-indigo-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        Allocate Faculty
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

    </div>
  );
};
