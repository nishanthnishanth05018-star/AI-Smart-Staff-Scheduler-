import React, { useState } from 'react';
import { CurrentTimeState, DayOfWeek } from '../types';
import { DAYS_OF_WEEK, PERIODS, BREAKS } from '../data/departmentData';
import { 
  Play, 
  RotateCcw, 
  Clock, 
  Calendar, 
  Bell, 
  Coffee, 
  Utensils, 
  Sparkles, 
  ChevronUp, 
  ChevronDown, 
  Zap 
} from 'lucide-react';

interface TimeSimulatorBarProps {
  timeState: CurrentTimeState | null;
  onSimulate: (time24: string, day: DayOfWeek) => void;
  onResetLive: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const TimeSimulatorBar: React.FC<TimeSimulatorBarProps> = ({
  timeState,
  onSimulate,
  onResetLive,
  isOpen,
  onToggle,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(timeState?.ist_day || 'Monday');
  const [customTime, setCustomTime] = useState(timeState?.current_time_24 || '09:45');

  const presets = [
    { label: '09:35 AM', time: '09:35', desc: '10m before P1 (Reminder)', icon: Bell, color: 'text-amber-400' },
    { label: '09:45 AM', time: '09:45', desc: 'Period 1 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '10:35 AM', time: '10:35', desc: 'Period 2 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '11:25 AM', time: '11:25', desc: 'Short Break 1 (All Staff)', icon: Coffee, color: 'text-cyan-400' },
    { label: '11:30 AM', time: '11:30', desc: '10m before P3 (Reminder)', icon: Bell, color: 'text-amber-400' },
    { label: '11:40 AM', time: '11:40', desc: 'Period 3 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '12:30 PM', time: '12:30', desc: 'Lunch Break (All Staff)', icon: Utensils, color: 'text-purple-400' },
    { label: '01:20 PM', time: '13:20', desc: '10m before P4 (Reminder)', icon: Bell, color: 'text-amber-400' },
    { label: '01:30 PM', time: '13:30', desc: 'Period 4 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '02:20 PM', time: '14:20', desc: 'Period 5 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '03:10 PM', time: '15:10', desc: 'Short Break 2 (All Staff)', icon: Coffee, color: 'text-cyan-400' },
    { label: '03:20 PM', time: '15:20', desc: 'Period 6 Starts', icon: Play, color: 'text-emerald-400' },
    { label: '04:10 PM', time: '16:10', desc: 'Department Day End', icon: Clock, color: 'text-slate-400' },
  ];

  const handlePresetClick = (time: string) => {
    setCustomTime(time);
    onSimulate(time, selectedDay);
  };

  const handleCustomApply = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate(customTime, selectedDay);
  };

  if (!isOpen) return null;

  return (
    <div className="bg-slate-900 border-b border-indigo-900/50 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        
        {/* Header with info and live toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Time Travel & Notification Testing Simulator (IST)
                {timeState?.is_simulated ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                    SIMULATION ACTIVE
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    LIVE IST TIME
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Click any preset to test period transitions, 10-minute reminders, break alerts, and countdown timers instantly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="reset-live-time-btn"
              onClick={onResetLive}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                !timeState?.is_simulated
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to Live IST
            </button>
            <button
              onClick={onToggle}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day of Week Selector */}
        <div className="mt-3 flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" /> Day:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                onClick={() => {
                  setSelectedDay(day);
                  if (timeState?.is_simulated) {
                    onSimulate(customTime, day);
                  }
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  selectedDay === day
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700/60'
                }`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Click Fast Timing Presets */}
        <div className="mt-3">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            1-Click Schedule Test Presets (Exact Department Timings):
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5">
            {presets.map(p => {
              const Icon = p.icon;
              const isCurrent = timeState?.is_simulated && customTime === p.time;
              return (
                <button
                  key={p.time}
                  onClick={() => handlePresetClick(p.time)}
                  className={`p-2 rounded-lg text-left border transition-all flex flex-col justify-between ${
                    isCurrent
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md shadow-indigo-500/10'
                      : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold font-mono ${p.color}`}>{p.label}</span>
                    <Icon className={`w-3.5 h-3.5 ${p.color}`} />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 line-clamp-1">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom manual time input */}
        <form onSubmit={handleCustomApply} className="mt-3 pt-3 border-t border-slate-800/80 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-400 font-medium">Custom Time (24h):</span>
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs font-mono focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20"
          >
            Apply Time
          </button>
          <span className="text-[11px] text-slate-500 italic">
            Current simulated state triggers corresponding in-app alerts and countdown timer immediately.
          </span>
        </form>

      </div>
    </div>
  );
};
