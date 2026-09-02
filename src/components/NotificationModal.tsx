import React, { useState } from 'react';
import { AppNotification, NotificationType, User } from '../types';
import { 
  Bell, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Clock, 
  BookOpen, 
  Coffee, 
  Utensils, 
  Megaphone, 
  RefreshCw,
  Filter
} from 'lucide-react';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  currentUser: User | null;
  onMarkRead: (id: string, read: boolean) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  currentUser,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => {
    if (filterType === 'ALL') return true;
    if (filterType === 'CLASSES') return n.notification_type === 'UPCOMING_CLASS' || n.notification_type === 'CLASS_STARTED';
    if (filterType === 'BREAKS') return n.notification_type === 'SHORT_BREAK' || n.notification_type === 'LUNCH_BREAK';
    if (filterType === 'ANNOUNCEMENTS') return n.notification_type === 'IMPORTANT_ANNOUNCEMENT' || n.notification_type === 'TIMETABLE_CHANGE';
    if (filterType === 'UNREAD') return !n.read_status;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read_status).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                In-App Notification Center
                <span className="text-xs px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-normal">
                  {currentUser?.role === 'admin' ? 'Department Master Log' : `${currentUser?.staff_id} Inbox`}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated 10-minute class reminders, start alerts, break notices & announcements
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

        {/* Filter Tabs & Quick Actions */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
          
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'ALL', label: `All (${notifications.length})` },
              { id: 'UNREAD', label: `Unread (${unreadCount})` },
              { id: 'CLASSES', label: 'Classes' },
              { id: 'BREAKS', label: 'Breaks' },
              { id: 'ANNOUNCEMENTS', label: 'Notices' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilterType(tab.id)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 hover:underline"
              >
                <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-slate-500 hover:text-red-400 font-medium flex items-center gap-1 ml-2"
                title="Clear notifications"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

        </div>

        {/* Notification List Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map(notif => {
              const iconData = getNotificationVisual(notif.notification_type);
              const Icon = iconData.icon;

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-xl border transition-all ${
                    !notif.read_status
                      ? 'bg-slate-800/90 border-indigo-500/50 shadow-md shadow-indigo-500/5 ring-1 ring-indigo-500/20'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconData.bgColor} ${iconData.textColor}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-bold text-sm ${!notif.read_status ? 'text-white' : 'text-slate-300'}`}>
                            {notif.title}
                          </span>
                          {!notif.read_status && (
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          )}
                          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-950/60 text-slate-400 font-mono">
                            {notif.date} • {notif.sent_time}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                          {notif.message}
                        </p>

                        {/* Extra metadata tags */}
                        {notif.class_name && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-indigo-300 font-medium border border-slate-800">
                              {notif.class_name}
                            </span>
                            {notif.period_number && (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-slate-950 text-emerald-300 font-mono border border-slate-800">
                                Period {notif.period_number} ({notif.start_time} – {notif.end_time})
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Toggle read action */}
                    <button
                      onClick={() => onMarkRead(notif.id, !notif.read_status)}
                      className={`p-1.5 rounded-lg text-xs transition-colors flex-shrink-0 ${
                        !notif.read_status
                          ? 'bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600 hover:text-white'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={notif.read_status ? 'Mark as unread' : 'Mark as read'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>

                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-600 mb-2 opacity-50" />
              <div className="text-sm font-semibold text-slate-400">No notifications in this filter</div>
              <p className="text-xs max-w-xs mx-auto">
                Notifications are generated automatically 10 minutes before class, at period start, and during scheduled breaks.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex items-center justify-between text-xs text-slate-400">
          <span>Automatic IST Trigger Engine • No duplicates</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );

  function getNotificationVisual(type: NotificationType) {
    switch (type) {
      case 'UPCOMING_CLASS':
        return { icon: Bell, bgColor: 'bg-amber-500/20', textColor: 'text-amber-300' };
      case 'CLASS_STARTED':
        return { icon: BookOpen, bgColor: 'bg-emerald-500/20', textColor: 'text-emerald-300' };
      case 'SHORT_BREAK':
        return { icon: Coffee, bgColor: 'bg-cyan-500/20', textColor: 'text-cyan-300' };
      case 'LUNCH_BREAK':
        return { icon: Utensils, bgColor: 'bg-purple-500/20', textColor: 'text-purple-300' };
      case 'TIMETABLE_CHANGE':
        return { icon: RefreshCw, bgColor: 'bg-blue-500/20', textColor: 'text-blue-300' };
      case 'IMPORTANT_ANNOUNCEMENT':
        return { icon: Megaphone, bgColor: 'bg-pink-500/20', textColor: 'text-pink-300' };
      default:
        return { icon: Bell, bgColor: 'bg-slate-800', textColor: 'text-slate-300' };
    }
  }
};
