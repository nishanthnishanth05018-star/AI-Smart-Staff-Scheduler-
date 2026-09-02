import React, { useState } from 'react';
import { User, TimetableSlot, DepartmentClass } from '../types';
import { PERIODS, DAYS_OF_WEEK } from '../data/departmentData';
import { 
  UserCheck, 
  UserX, 
  Plus, 
  Edit3, 
  Trash2, 
  Key, 
  Mail, 
  Phone, 
  BookOpen, 
  Calendar, 
  Search,
  Check,
  X,
  ShieldCheck,
  Clock
} from 'lucide-react';

interface StaffManagementViewProps {
  staffList: User[];
  timetable: TimetableSlot[];
  classes: DepartmentClass[];
  onAddStaff: (staffData: Partial<User>) => Promise<void>;
  onUpdateStaff: (id: string, updates: Partial<User>) => Promise<void>;
  onDeleteStaff: (id: string) => Promise<void>;
}

export const StaffManagementView: React.FC<StaffManagementViewProps> = ({
  staffList,
  timetable,
  classes,
  onAddStaff,
  onUpdateStaff,
  onDeleteStaff,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaffSchedule, setSelectedStaffSchedule] = useState<User | null>(null);
  const [editingStaff, setEditingStaff] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    staff_id: '',
    name: '',
    email: '',
    phone: '',
    department: 'Artificial Intelligence & Data Science',
    subjects: '',
    active: true,
  });

  const filteredStaff = staffList.filter(s => {
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.staff_id.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      s.subjects.some(sub => sub.toLowerCase().includes(q))
    );
  });

  const handleOpenEdit = (staff: User) => {
    setEditingStaff(staff);
    setFormData({
      staff_id: staff.staff_id,
      name: staff.name,
      email: staff.email,
      phone: staff.phone,
      department: staff.department,
      subjects: staff.subjects.join(', '),
      active: staff.active,
    });
  };

  const handleOpenAdd = () => {
    const nextNum = staffList.length + 1;
    const nextId = nextNum < 10 ? `Staff 0${nextNum}` : `Staff ${nextNum}`;
    setFormData({
      staff_id: nextId,
      name: '',
      email: '',
      phone: '+91 98401 00000',
      department: 'Artificial Intelligence & Data Science',
      subjects: 'AI Principles, Machine Learning',
      active: true,
    });
    setIsAddModalOpen(true);
  };

  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    const subjectsArray = formData.subjects
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingStaff) {
      await onUpdateStaff(editingStaff.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        subjects: subjectsArray,
        active: formData.active,
      });
      setEditingStaff(null);
    } else {
      await onAddStaff({
        staff_id: formData.staff_id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        subjects: subjectsArray,
        role: 'staff',
        active: formData.active,
      });
      setIsAddModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            Department Faculty & Staff Management
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
              {staffList.length} Faculty Members
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Manage profiles, assigned subjects, active status, and view individual timetables
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-44 sm:w-56"
            />
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* Staff Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStaff.map(staff => {
          const staffSlotsCount = timetable.filter(s => s.staff_id === staff.id).length;

          return (
            <div
              key={staff.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                staff.active
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/60 border-red-900/30 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
                      {staff.staff_id.replace('Staff ', 'S')}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{staff.name}</h4>
                      <span className="text-[11px] font-mono text-indigo-400 font-semibold">{staff.staff_id}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    staff.active ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {staff.active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Details */}
                <div className="py-3 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="pt-1">
                    <div className="text-[10px] uppercase font-semibold text-slate-500 mb-1">Subjects Handled:</div>
                    <div className="flex flex-wrap gap-1">
                      {staff.subjects.map((sub, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-[11px] text-slate-300 border border-slate-700">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => setSelectedStaffSchedule(staff)}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-indigo-800/50"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  Timetable ({staffSlotsCount})
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(staff)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                    title="Edit Faculty"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onUpdateStaff(staff.id, { active: !staff.active })}
                    className={`p-1.5 rounded-lg transition-colors ${
                      staff.active ? 'bg-slate-800 hover:bg-amber-950/50 text-slate-300 hover:text-amber-300' : 'bg-emerald-950 text-emerald-300'
                    }`}
                    title={staff.active ? 'Deactivate' : 'Activate'}
                  >
                    {staff.active ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Reset password for ${staff.name}? A temporary password will be issued.`)) {
                        alert(`Password reset for ${staff.name}. Temporary password: Staff@2026`);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Reset Password"
                  >
                    <Key className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* Staff Individual Timetable Drilldown Modal */}
      {selectedStaffSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center">
                  {selectedStaffSchedule.staff_id.replace('Staff ', 'S')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {selectedStaffSchedule.staff_id}: {selectedStaffSchedule.name}'s Weekly Timetable
                  </h3>
                  <p className="text-xs text-slate-400">{selectedStaffSchedule.department}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedStaffSchedule(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DAYS_OF_WEEK.map(day => {
                  const daySlots = timetable.filter(
                    s => s.staff_id === selectedStaffSchedule.id && s.day === day
                  );

                  return (
                    <div key={day} className="bg-slate-800/80 border border-slate-700 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-300 pb-1.5 border-b border-slate-700">
                        <span>{day}</span>
                        <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400 font-mono">
                          {daySlots.length} Classes
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {PERIODS.map(p => {
                          const slot = daySlots.find(s => s.period_id === p.id);
                          const cls = slot ? classes.find(c => c.id === slot.class_id) : undefined;

                          return (
                            <div
                              key={p.id}
                              className={`p-2 rounded-lg text-xs flex items-center justify-between ${
                                slot ? 'bg-slate-900 border border-indigo-900/60' : 'bg-slate-950/30 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-400 font-semibold">{p.period_number}:</span>
                                {slot && cls ? (
                                  <span className="font-semibold text-white">{cls.short_code}</span>
                                ) : (
                                  <span className="italic text-slate-500">Free</span>
                                )}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{p.start_display}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-slate-800 bg-slate-850 flex justify-end">
              <button
                onClick={() => setSelectedStaffSchedule(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add / Edit Staff Modal */}
      {(isAddModalOpen || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-850">
              <h3 className="text-base font-bold text-white">
                {editingStaff ? 'Edit Faculty Details' : 'Register New Faculty'}
              </h3>
              <button
                onClick={() => {
                  setEditingStaff(null);
                  setIsAddModalOpen(false);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Staff ID</label>
                <input
                  type="text"
                  required
                  value={formData.staff_id}
                  onChange={(e) => setFormData({ ...formData, staff_id: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Dr. Ramesh Gupta"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subjects Handled (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.subjects}
                  onChange={(e) => setFormData({ ...formData, subjects: e.target.value })}
                  placeholder="AI Fundamentals, Neural Networks, Python"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 pt-2 text-xs text-slate-300 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                />
                <span>Active Account (Eligible for Timetable & Notifications)</span>
              </label>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStaff(null);
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  {editingStaff ? 'Update Staff' : 'Save Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
