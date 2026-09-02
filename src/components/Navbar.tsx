import React from 'react';
import { User, CurrentTimeState } from '../types';
import { 
  Bell, 
  Clock, 
  Sparkles, 
  Sliders, 
  LogOut, 
  ShieldCheck, 
  UserCheck, 
  Calendar,
  Layers,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  timeState: CurrentTimeState | null;
  unreadCount: number;
  onOpenNotifications: () => void;
  isSimulatorOpen: boolean;
  onToggleSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  timeState,
  unreadCount,
  onOpenNotifications,
  isSimulatorOpen,
  onToggleSimulator,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  const staffUsers = allUsers.filter(u => u.role === 'staff');
  const adminUser = allUsers.find(u => u.role === 'admin');

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-3">
          
          {/* Brand & Department */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  AI Smart Staff Scheduler
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  AI & ADS Dept
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Exact Department Timings (9:45 AM – 4:10 PM) • IST Engine
              </p>
            </div>
          </div>

          {/* Center: Live IST Clock & Current Status Badge */}
          <div className="flex items-center gap-2">
            <button
              id="time-simulator-toggle-btn"
              onClick={onToggleSimulator}
              className={`flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium transition-all border ${
                timeState?.is_simulated
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10 animate-pulse'
                  : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
              }`}
              title="Click to open Interactive Time Simulator"
            >
              <Clock className="w-4 h-4 text-indigo-400" />
              <div className="text-left">
                <div className="font-bold flex items-center gap-1.5 font-mono">
                  <span>{timeState?.ist_time_str || '--:-- --'}</span>
                  <span className="text-[10px] uppercase tracking-wider px-1 py-0.2 bg-indigo-500/30 text-indigo-200 rounded font-sans">
                    IST
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 hidden md:block">
                  {timeState?.ist_day || 'Monday'}
                  {timeState?.is_simulated && ' (Simulated)'}
                </div>
              </div>
              <Sliders className="w-3.5 h-3.5 text-slate-400 ml-1 hidden sm:block" />
            </button>
          </div>

          {/* Right: Quick Demo Account Switcher, Notification Bell & User info */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Quick Demo Switcher Dropdown */}
            <div className="relative">
              <button
                id="quick-demo-account-btn"
                onClick={() => setShowUserDropdown(!showUserDropdown)}
                className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-xs sm:text-sm text-slate-200 transition-colors"
              >
                {currentUser?.role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-purple-400" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                )}
                <span className="max-w-[90px] sm:max-w-[130px] truncate font-medium">
                  {currentUser?.staff_id || currentUser?.name || 'Switch User'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 max-h-96 overflow-y-auto">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    Switch Account (1-Click Demo)
                  </div>

                  {/* Admin Option */}
                  {adminUser && (
                    <button
                      onClick={() => {
                        onSelectUser(adminUser);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 flex items-center gap-2.5 hover:bg-slate-800 transition-colors ${
                        currentUser?.id === adminUser.id ? 'bg-purple-950/40 text-purple-300 font-semibold' : 'text-slate-200'
                      }`}
                    >
                      <div className="w-7 h-7 rounded-lg bg-purple-600/30 text-purple-300 flex items-center justify-center text-xs font-bold">
                        HOD
                      </div>
                      <div className="truncate">
                        <div className="text-xs font-semibold">{adminUser.name}</div>
                        <div className="text-[10px] text-purple-400">Admin / Head of Department</div>
                      </div>
                    </button>
                  )}

                  <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-t border-b border-slate-800 mt-1">
                    10 Department Staff
                  </div>

                  {/* 10 Staff Options */}
                  {staffUsers.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        onSelectUser(staff);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 flex items-center gap-2.5 hover:bg-slate-800 transition-colors ${
                        currentUser?.id === staff.id ? 'bg-indigo-950/40 text-indigo-300 font-semibold' : 'text-slate-300'
                      }`}
                    >
                      <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold border border-slate-700">
                        {staff.staff_id.replace('Staff ', 'S')}
                      </div>
                      <div className="truncate">
                        <div className="text-xs">{staff.staff_id}: {staff.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{staff.subjects[0] || 'AI Dept'}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-App Notifications Bell with Unread Badge */}
            <button
              id="notification-bell-btn"
              onClick={onOpenNotifications}
              className="relative p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all border border-slate-700"
              title="View In-App Notifications"
            >
              <Bell className="w-5 h-5 text-indigo-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-slate-900 animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Logout */}
            <button
              id="logout-btn"
              onClick={onLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-slate-800/80 hover:bg-red-950/50 hover:text-red-300 text-slate-400 transition-colors border border-slate-700"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};
