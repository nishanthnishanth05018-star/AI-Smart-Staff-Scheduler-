import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  CurrentTimeState, 
  TimetableSlot, 
  DepartmentClass, 
  AppNotification, 
  DayOfWeek 
} from './types';
import { DEPARTMENT_STAFF, DEPARTMENT_CLASSES } from './data/departmentData';
import { getCurrentISTTimeState, getSimulatedTimeState } from './utils/timeUtils';
import { playNotificationChime } from './utils/audio';
import { Navbar } from './components/Navbar';
import { TimeSimulatorBar } from './components/TimeSimulatorBar';
import { StaffDashboard } from './components/StaffDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationModal } from './components/NotificationModal';
import { AssignSlotModal } from './components/AssignSlotModal';
import { LoginModal } from './components/LoginModal';
import { generateInitialTimetable } from './data/defaultTimetable';

export default function App() {
  // Global State
  const [currentUser, setCurrentUser] = useState<User | null>(DEPARTMENT_STAFF[0]); // default to Staff 01
  const [staffList, setStaffList] = useState<User[]>(DEPARTMENT_STAFF);
  const [classes, setClasses] = useState<DepartmentClass[]>(DEPARTMENT_CLASSES);
  const [timetable, setTimetable] = useState<TimetableSlot[]>(() => generateInitialTimetable());
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [timeState, setTimeState] = useState<CurrentTimeState>(() => getCurrentISTTimeState());

  // UI state
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(true);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Assign modal params
  const [assignParams, setAssignParams] = useState<{
    day: DayOfWeek;
    periodId: string;
    slot?: TimetableSlot;
  }>({
    day: 'Monday',
    periodId: 'P1',
  });

  const prevNotifCountRef = useRef<number>(0);

  // Fetch initial data from server
  const fetchAllData = async () => {
    try {
      const [staffRes, classRes, ttRes] = await Promise.all([
        fetch('/api/staff').then(r => r.ok ? r.json() : null),
        fetch('/api/classes').then(r => r.ok ? r.json() : null),
        fetch('/api/timetable').then(r => r.ok ? r.json() : null),
      ]);

      if (staffRes?.data) setStaffList(staffRes.data);
      if (classRes?.data) setClasses(classRes.data);
      if (ttRes?.data) setTimetable(ttRes.data);
    } catch (e) {
      console.warn('Using client-side store as fallback:', e);
    }
  };

  // Fetch notifications for current user
  const fetchNotifications = async () => {
    try {
      const staffParam = currentUser?.role === 'admin' ? 'ALL' : currentUser?.id || 'ALL';
      const res = await fetch(`/api/notifications?staff_id=${staffParam}`);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          // Check if new unread notification arrived
          const unread = json.data.filter((n: AppNotification) => !n.read_status);
          if (unread.length > prevNotifCountRef.current) {
            if (soundEnabled) {
              playNotificationChime('UPCOMING_CLASS');
            }
          }
          prevNotifCountRef.current = unread.length;
          setNotifications(json.data);
        }
      }
    } catch (e) {
      // ignore in offline
    }
  };

  // Sync server time state
  const syncTimeState = async () => {
    try {
      const res = await fetch('/api/time/current');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setTimeState(json.data);
        }
      }
    } catch (e) {
      // fallback to local IST calculator
      if (!timeState.is_simulated) {
        setTimeState(getCurrentISTTimeState());
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllData();
  }, []);

  // Continuous background tick (every 3 seconds)
  useEffect(() => {
    syncTimeState();
    fetchNotifications();

    const interval = setInterval(() => {
      syncTimeState();
      fetchNotifications();
    }, 3000);

    return () => clearInterval(interval);
  }, [currentUser, soundEnabled]);

  // Handle Time Simulation
  const handleSimulateTime = async (time24: string, day: DayOfWeek) => {
    try {
      const res = await fetch('/api/time/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ time: time24, day }),
      });
      if (res.ok) {
        const json = await res.json();
        setTimeState(json.data);
        fetchNotifications();
      }
    } catch (e) {
      setTimeState(getSimulatedTimeState(time24, day));
    }
  };

  // Reset to live IST
  const handleResetLiveTime = async () => {
    try {
      const res = await fetch('/api/time/reset', { method: 'POST' });
      if (res.ok) {
        const json = await res.json();
        setTimeState(json.data);
        fetchNotifications();
      }
    } catch (e) {
      setTimeState(getCurrentISTTimeState());
    }
  };

  // Handle Login
  const handleLogin = async (email: string, pass: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data.user);
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      // client fallback login
      if (email.includes('hod')) {
        setCurrentUser({
          id: 'admin-1',
          email,
          name: 'Dr. S. K. Narayanan (HOD)',
          role: 'admin',
          staff_id: 'HOD-01',
          department: 'Department of AI & DS',
          subjects: ['Department Head'],
          phone: '+91 98400 11000',
          active: true,
        });
        return { success: true };
      }
      const matched = staffList.find(s => s.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        setCurrentUser(matched);
        return { success: true };
      }
      return { success: false, error: 'Invalid department email or password' };
    }
  };

  // Save Timetable Slot
  const handleSaveSlot = async (slotData: Partial<TimetableSlot>, allowOverride: boolean) => {
    try {
      const res = await fetch('/api/timetable/slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...slotData, allow_override: allowOverride }),
      });
      const data = await res.json();
      if (data.success) {
        setTimetable(data.data.timetable);
        fetchNotifications();
        return { success: true };
      }
      return { success: false, error: data.error };
    } catch (e: any) {
      // Local fallback
      const newSlot: TimetableSlot = {
        id: slotData.id || `slot_${Date.now()}`,
        day: slotData.day || 'Monday',
        period_id: slotData.period_id || 'P1',
        class_id: slotData.class_id || '',
        staff_id: slotData.staff_id || '',
        subject_name: slotData.subject_name || 'AI Course',
        room: slotData.room || 'Hall 101',
      };
      setTimetable(prev => {
        const filtered = prev.filter(s => s.id !== newSlot.id);
        return [...filtered, newSlot];
      });
      return { success: true };
    }
  };

  // Delete Timetable Slot
  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/timetable/slot/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setTimetable(data.data.timetable);
      }
    } catch (e) {
      setTimetable(prev => prev.filter(s => s.id !== slotId));
    }
  };

  // AI Smart Auto-Generate Timetable
  const handleAutoGenerateAI = async () => {
    if (!window.confirm('Auto-generate balanced, conflict-free timetable across all 10 staff and 10 classes?')) {
      return;
    }
    try {
      const res = await fetch('/api/timetable/auto-generate', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setTimetable(data.data.timetable);
        alert('✓ Timetable successfully generated with zero conflicts across 6 teaching periods!');
      }
    } catch (e) {
      const initial = generateInitialTimetable();
      setTimetable(initial);
      alert('✓ Timetable restored with conflict-free algorithm!');
    }
  };

  // Reset timetable to defaults
  const handleResetTimetable = async () => {
    if (!window.confirm('Reset timetable to default departmental allocations?')) return;
    const initial = generateInitialTimetable();
    setTimetable(initial);
    try {
      await fetch('/api/timetable/auto-generate', { method: 'POST' });
    } catch (e) {}
  };

  // Notification actions
  const handleMarkNotifRead = async (id: string, read: boolean) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_status: read } : n));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read }),
      });
    } catch (e) {}
  };

  const handleMarkAllNotifsRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ staff_id: currentUser?.role === 'admin' ? 'ALL' : currentUser?.id }),
      });
    } catch (e) {}
  };

  const handleClearAllNotifs = async () => {
    if (!window.confirm('Clear all in-app notification logs?')) return;
    setNotifications([]);
    try {
      await fetch('/api/notifications/clear', { method: 'DELETE' });
    } catch (e) {}
  };

  // Staff CRUD actions
  const handleAddStaff = async (staffData: Partial<User>) => {
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffData),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.data.staff);
      }
    } catch (e) {
      const newStaff: User = {
        id: `staff_${Date.now()}`,
        staff_id: staffData.staff_id || 'Staff 11',
        name: staffData.name || 'New Faculty',
        email: staffData.email || 'new@department.edu',
        phone: staffData.phone || '+91 98401 00000',
        department: staffData.department || 'AI & DS',
        subjects: staffData.subjects || ['AI Elective'],
        role: 'staff',
        active: true,
      };
      setStaffList(prev => [...prev, newStaff]);
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/staff/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data.data.staff);
      }
    } catch (e) {
      setStaffList(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Delete this staff member?')) return;
    try {
      await fetch(`/api/staff/${id}`, { method: 'DELETE' });
      setStaffList(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      setStaffList(prev => prev.filter(s => s.id !== id));
    }
  };

  // Broadcast Announcement
  const handleSendAnnouncement = async (title: string, message: string, targetStaffId?: string) => {
    try {
      const res = await fetch('/api/notifications/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          staff_id: targetStaffId || 'ALL',
        }),
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {
      // Local fallback
      const notif: AppNotification = {
        id: `notif_${Date.now()}`,
        title,
        message,
        notification_type: 'IMPORTANT_ANNOUNCEMENT',
        staff_id: targetStaffId || 'ALL',
        sent_time: timeState.current_time_24,
        date: timeState.ist_date_str,
        read_status: false,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Open assign modal for specific day and period
  const handleOpenAssign = (day: DayOfWeek, periodId: string, slot?: TimetableSlot) => {
    setAssignParams({ day, periodId, slot });
    setIsAssignModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Top Navigation Bar */}
      <Navbar
        currentUser={currentUser}
        timeState={timeState}
        staffList={staffList}
        notifications={notifications}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(prev => !prev)}
        onSelectUser={(u) => setCurrentUser(u)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
        onOpenNotifications={() => setIsNotificationModalOpen(true)}
        onToggleSimulator={() => setIsSimulatorOpen(prev => !prev)}
        isSimulatorOpen={isSimulatorOpen}
      />

      {/* Time Simulation Testing Bar */}
      <TimeSimulatorBar
        timeState={timeState}
        onSimulate={handleSimulateTime}
        onResetLive={handleResetLiveTime}
        isOpen={isSimulatorOpen}
        onToggle={() => setIsSimulatorOpen(prev => !prev)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentUser?.role === 'admin' ? (
          <AdminDashboard
            admin={currentUser}
            timeState={timeState}
            timetable={timetable}
            classes={classes}
            staffList={staffList}
            notifications={notifications}
            onOpenAssignModal={handleOpenAssign}
            onAddStaff={handleAddStaff}
            onUpdateStaff={handleUpdateStaff}
            onDeleteStaff={handleDeleteStaff}
            onSendAnnouncement={handleSendAnnouncement}
            onAutoGenerateAI={handleAutoGenerateAI}
            onResetTimetable={handleResetTimetable}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
          />
        ) : currentUser ? (
          <StaffDashboard
            staff={currentUser}
            timeState={timeState}
            timetable={timetable}
            classes={classes}
            notifications={notifications}
            onOpenNotifications={() => setIsNotificationModalOpen(true)}
            onMarkNotificationRead={(id) => handleMarkNotifRead(id, true)}
          />
        ) : (
          <div className="py-20 text-center space-y-4">
            <h2 className="text-2xl font-bold text-white">Department Staff Portal</h2>
            <p className="text-slate-400">Please sign in to view your personalized daily timetable and notifications.</p>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg"
            >
              Sign In
            </button>
          </div>
        )}
      </main>

      {/* Assign Timetable Slot Modal */}
      <AssignSlotModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSave={handleSaveSlot}
        onDelete={handleDeleteSlot}
        initialSlot={assignParams.slot}
        initialDay={assignParams.day}
        initialPeriodId={assignParams.periodId}
        staffList={staffList}
        classList={classes}
        allTimetable={timetable}
      />

      {/* Notification Center Modal */}
      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
        currentUser={currentUser}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
      />

      {/* Sign In & User Switcher Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        staffList={staffList}
        onLogin={handleLogin}
        onSelectUserDirectly={(user) => setCurrentUser(user)}
      />

      {/* Global Minimal Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>AI Smart Staff Scheduler • Department of Artificial Intelligence & Data Science</span>
          <span className="font-mono text-slate-400">Exact IST Timings (09:45 – 16:10) • 10 Staff • 10 Classes</span>
        </div>
      </footer>

    </div>
  );
}
