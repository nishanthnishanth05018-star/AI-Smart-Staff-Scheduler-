import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, Key, Mail, ShieldCheck, UserCheck, X, Sparkles, AlertCircle } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: User[];
  onLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  onSelectUserDirectly: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  staffList,
  onLogin,
  onSelectUserDirectly,
}) => {
  const [email, setEmail] = useState('hod.ai@department.edu');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const result = await onLogin(email.trim(), password);
      if (result.success) {
        onClose();
      } else {
        setErrorMsg(result.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickSelect = (user: User) => {
    onSelectUserDirectly(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Department Sign In</h3>
              <p className="text-xs text-slate-400">Secure Access for HOD & 10 Registered Staff Members</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Quick Demo 1-Click Selectors */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" /> Instant 1-Click Role Switch (Demo Mode):
              </span>
            </div>

            {/* Admin 1-Click */}
            <button
              onClick={() => handleQuickSelect({
                id: 'admin-1',
                email: 'hod.ai@department.edu',
                name: 'Dr. S. K. Narayanan (HOD)',
                role: 'admin',
                staff_id: 'HOD-01',
                department: 'Department of AI & DS',
                subjects: ['Department Head', 'AI Ethics'],
                phone: '+91 98400 11000',
                active: true,
              })}
              className="w-full p-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/60 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                  HOD
                </div>
                <div>
                  <div className="text-xs font-bold text-purple-200">Dr. S. K. Narayanan (Admin / HOD)</div>
                  <div className="text-[11px] text-slate-400">Full Timetable Management & Master Controls</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Login as HOD →
              </span>
            </button>

            {/* 10 Registered Staff 1-Click Grid */}
            <div className="pt-2">
              <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
                Switch to Any of the 10 Registered Faculty:
              </div>
              <div className="grid grid-cols-2 gap-2">
                {staffList.map(s => (
                  <button
                    key={s.id}
                    onClick={() => handleQuickSelect(s)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700/80 hover:border-indigo-500 text-left transition-all text-xs"
                  >
                    <div className="font-bold text-white flex items-center justify-between">
                      <span>{s.staff_id}</span>
                      <span className="text-[10px] text-indigo-400 font-mono">Select</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{s.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{s.subjects[0]}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-800"></div>
            <span className="flex-shrink mx-4 text-xs text-slate-500 uppercase font-semibold">Or Enter Credentials</span>
            <div className="flex-grow border-t border-slate-800"></div>
          </div>

          {/* Form Login */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-xs text-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-indigo-400" />
                Department Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff01@department.edu or hod.ai@department.edu"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-400" />
                Account Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Protected Staff Login • Exactly 10 Staff Enrolled</span>
          <span>IST 9:45 AM – 4:10 PM</span>
        </div>

      </div>
    </div>
  );
};
