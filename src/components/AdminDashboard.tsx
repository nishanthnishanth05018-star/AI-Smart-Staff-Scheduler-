import React, { useState } from 'react';
import { 
  User, 
  DepartmentClass, 
  TimetableSlot, 
  CurrentTimeState, 
  AppNotification, 
  DayOfWeek, 
  ConflictIssue 
} from '../types';
import { PERIODS, BREAKS } from '../data/departmentData';
import { detectConflicts } from '../data/defaultTimetable';
import { TimetableGridView } from './TimetableGridView';
import { StaffManagementView } from './StaffManagementView';
import { ClassManagementView } from './ClassManagementView';
import { AnnouncementModal } from './AnnouncementModal';
import { 
  Users, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Bell, 
  Sparkles, 
  Megaphone, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Settings, 
  Plus, 
  Activity,
  Sliders,
  RotateCcw
} from 'lucide-react';

interface AdminDashboardProps {
  admin: User;
  timeState: CurrentTimeState;
  timetable: TimetableSlot[];
  classes: DepartmentClass[];
  staffList: User[];
  notifications: AppNotification[];
  onOpenAssignModal: (day: DayOfWeek, periodId: string, slot?: TimetableSlot) => void;
  onAddStaff: (staffData: Partial<User>) => Promise<void>;
  onUpdateStaff: (id: string, updates: Partial<User>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
  onSendAnnouncement: (title: string, message: string, targetStaffId?: string) => Promise<void>;
  onAutoGenerateAI: () => void;
  onResetTimetable: () => void;
  onOpenNotifications: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  admin,
  timeState,
  timetable,
  classes,
  staffList,
  notifications,
  onOpenAssignModal,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
  onSendAnnouncement,
  onAutoGenerateAI,
  onResetTimetable,
  onOpenNotifications,
}) => {
  const [activeTab, setActiveTab] = useState<'matrix' | 'staff' | 'classes' | 'conflicts' | 'logs'>('matrix');
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);

  // Compute live KPI metrics
  const conflicts = detectConflicts(timetable);
  const currentDay = timeState.ist_day;
  const todaySlots = timetable.filter(s => s.day === currentDay);

  let staffTeachingCount = 0;
  let staffFreeCount = staffList.length;

  if (timeState.current_period) {
    const activeStaffIds = new Set(
      todaySlots.filter(s => s.period_id === timeState.current_period?.id).map(s => s.staff_id)
    );
    staffTeachingCount = activeStaffIds.size;
    staffFreeCount = Math.max(0, staffList.length - staffTeachingCount);
  }

  return (
    <div className="space-y-6">
      
      {/* Top Welcome & KPI Metric Cards */}
      <div className="space-y-4">
        
        {/* Admin Header Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-purple-950/90 via-slate-900 to-indigo-950/90 border border-purple-900/60 p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Department Head (HOD) Administration Panel
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {admin.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              AI Smart Staff Scheduler • Department of AI & Data Science (9:45 AM – 4:10 PM IST)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAnnouncementOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-lg shadow-pink-600/20 transition-all flex items-center gap-1.5"
            >
              <Megaphone className="w-4 h-4" />
              Broadcast Notice
            </button>
            <button
              onClick={() => onOpenAssignModal('Monday', 'P1')}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Assign Slot
            </button>
          </div>
        </div>

        {/* 6 Key Stat Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Card 1: Total Staff */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Staff</span>
              <Users className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-white">{staffList.length}</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">10 Active Members</div>
          </div>

          {/* Card 2: Total Classes */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Classes</span>
              <BookOpen className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">{classes.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">1st, 2nd & 3rd Year</div>
          </div>

          {/* Card 3: Currently Teaching */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Staff Teaching</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {timeState.status === 'teaching' ? staffTeachingCount : 0}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {timeState.current_period?.period_name || 'Outside Teaching'}
            </div>
          </div>

          {/* Card 4: Currently Free */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Staff Free</span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl font-black text-cyan-400">
              {timeState.status === 'teaching' ? staffFreeCount : staffList.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Available for prep</div>
          </div>

          {/* Card 5: Notifications */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-md cursor-pointer hover:border-indigo-500 transition-colors" onClick={onOpenNotifications}>
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Notifications</span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400">{notifications.length}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Auto-dispatched</div>
          </div>

          {/* Card 6: Conflicts */}
          <div 
            onClick={() => setActiveTab('conflicts')}
            className={`p-4 rounded-xl border shadow-md cursor-pointer transition-colors ${
              conflicts.length > 0 
                ? 'bg-amber-950/40 border-amber-500/60 hover:bg-amber-950/60' 
                : 'bg-slate-900 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Conflicts</span>
              {conflicts.length > 0 ? (
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className={`text-2xl font-black ${conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
              {conflicts.length}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              {conflicts.length > 0 ? '⚠️ Action Required' : '✓ 100% Conflict-Free'}
            </div>
          </div>

        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'matrix', label: '📅 Master Timetable Matrix', icon: Calendar },
          { id: 'staff', label: `👨‍🏫 Staff Management (${staffList.length})`, icon: Users },
          { id: 'classes', label: `🏫 Class Directory (${classes.length})`, icon: BookOpen },
          { 
            id: 'conflicts', 
            label: `🛡️ Conflict Inspector ${conflicts.length > 0 ? `(${conflicts.length})` : '✓'}`, 
            icon: AlertTriangle,
            highlight: conflicts.length > 0 
          },
          { id: 'logs', label: `🔔 Auto-Notification Log (${notifications.length})`, icon: Bell },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : tab.highlight
                ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40 hover:bg-amber-950'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'matrix' && (
          <TimetableGridView
            timetable={timetable}
            classes={classes}
            staffList={staffList}
            onOpenAssignModal={onOpenAssignModal}
            onAutoGenerateAI={onAutoGenerateAI}
            onResetTimetable={onResetTimetable}
          />
        )}

        {activeTab === 'staff' && (
          <StaffManagementView
            staffList={staffList}
            timetable={timetable}
            classes={classes}
            onAddStaff={onAddStaff}
            onUpdateStaff={onUpdateStaff}
            onDeleteStaff={onDeleteStaff}
          />
        )}

        {activeTab === 'classes' && (
          <ClassManagementView
            classes={classes}
            timetable={timetable}
            staffList={staffList}
            onOpenAssignModal={onOpenAssignModal}
          />
        )}

        {activeTab === 'conflicts' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  Timetable Conflict Detection Engine
                </h3>
                <p className="text-xs text-slate-400">
                  Continuous multi-criteria scanner for double-booked staff members and overlapping class sections
                </p>
              </div>

              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                conflicts.length === 0 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {conflicts.length === 0 ? 'Zero Conflicts Detected' : `${conflicts.length} Conflicts Found`}
              </span>
            </div>

            {conflicts.length > 0 ? (
              <div className="space-y-3">
                {conflicts.map((c, i) => (
                  <div key={i} className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/50 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-300 font-mono">
                        {c.day} • {c.period_name} ({c.period_time})
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-200 font-semibold uppercase">
                        {c.type.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium">{c.description}</p>
                    <div className="flex justify-end pt-1">
                      <button
                        onClick={() => onOpenAssignModal(c.day, c.period_id, c.slots[0])}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow"
                      >
                        Resolve Conflict
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-base font-bold text-white">All Timetable Slots are Harmonized!</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  No faculty member or class is double-booked across the 6 days and 6 teaching periods.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-indigo-400" />
                  Automated Notification Dispatch Audit Log
                </h3>
                <p className="text-xs text-slate-400">
                  Real-time ledger of all automated 10-minute reminders, class start notifications, and break alerts
                </p>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Total: {notifications.length} logged
              </span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(notif => (
                  <div key={notif.id} className="p-3.5 rounded-xl bg-slate-800/70 border border-slate-700/60 flex items-start justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{notif.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-indigo-300 font-mono">
                          Target: {notif.staff_id === 'ALL' ? 'All 10 Staff' : notif.staff_id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{notif.sent_time}</span>
                      </div>
                      <p className="text-slate-300 whitespace-pre-line leading-relaxed">{notif.message}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      notif.read_status ? 'bg-slate-900 text-slate-400' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {notif.read_status ? 'Read' : 'Unread'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-xs italic">
                  No notifications logged yet. Trigger via time simulator or wait for scheduled period start.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Announcement Broadcaster Modal */}
      <AnnouncementModal
        isOpen={isAnnouncementOpen}
        onClose={() => setIsAnnouncementOpen(false)}
        staffList={staffList}
        onSendAnnouncement={onSendAnnouncement}
      />

    </div>
  );
};
