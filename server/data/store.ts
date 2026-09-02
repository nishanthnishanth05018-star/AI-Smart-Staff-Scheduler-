import fs from 'fs';
import path from 'path';
import { User, DepartmentClass, PeriodTiming, BreakTiming, TimetableSlot, AppNotification, DayOfWeek } from '../../src/types';
import { PERIODS, BREAKS, INITIAL_CLASSES, INITIAL_STAFF, INITIAL_ADMIN } from '../../src/data/departmentData';
import { generateInitialTimetable } from '../../src/data/defaultTimetable';

export interface DatabaseSchema {
  users: User[];
  classes: DepartmentClass[];
  periods: PeriodTiming[];
  breaks: BreakTiming[];
  timetable: TimetableSlot[];
  notifications: AppNotification[];
  settings: {
    remindersEnabled: boolean;
    breakAlertsEnabled: boolean;
    soundEnabled: boolean;
    academicYear: string;
  };
  simulation: {
    enabled: boolean;
    time24: string;
    day: DayOfWeek;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'scheduler_db.json');

class DatabaseStore {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadInitialData();
  }

  private loadInitialData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && parsed.users.length > 0) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing database file, seeding defaults:', err);
    }

    const defaultDb: DatabaseSchema = {
      users: [INITIAL_ADMIN, ...INITIAL_STAFF],
      classes: INITIAL_CLASSES,
      periods: PERIODS,
      breaks: BREAKS,
      timetable: generateInitialTimetable(),
      notifications: [],
      settings: {
        remindersEnabled: true,
        breakAlertsEnabled: true,
        soundEnabled: true,
        academicYear: '2026-2027',
      },
      simulation: {
        enabled: false,
        time24: '09:45',
        day: 'Monday',
      },
    };

    this.saveData(defaultDb);
    return defaultDb;
  }

  private saveData(dataToSave?: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave || this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to file:', err);
    }
  }

  // Getters
  public getUsers(): User[] {
    return this.data.users;
  }

  public getStaffMembers(): User[] {
    return this.data.users.filter(u => u.role === 'staff');
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id || u.email.toLowerCase() === id.toLowerCase() || u.staff_id.toLowerCase() === id.toLowerCase());
  }

  public getClasses(): DepartmentClass[] {
    return this.data.classes;
  }

  public getClassById(id: string): DepartmentClass | undefined {
    return this.data.classes.find(c => c.id === id);
  }

  public getPeriods(): PeriodTiming[] {
    return this.data.periods;
  }

  public getBreaks(): BreakTiming[] {
    return this.data.breaks;
  }

  public getTimetable(): TimetableSlot[] {
    return this.data.timetable;
  }

  public getNotifications(staffId?: string): AppNotification[] {
    if (!staffId || staffId === 'ADMIN' || staffId === 'USR_ADMIN001') {
      return this.data.notifications.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return this.data.notifications
      .filter(n => n.staff_id === staffId || n.staff_id === 'ALL')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getSettings() {
    return this.data.settings;
  }

  public getSimulation() {
    return this.data.simulation;
  }

  // Mutations
  public updateSettings(newSettings: Partial<DatabaseSchema['settings']>) {
    this.data.settings = { ...this.data.settings, ...newSettings };
    this.saveData();
    return this.data.settings;
  }

  public setSimulation(simulation: DatabaseSchema['simulation']) {
    this.data.simulation = simulation;
    this.saveData();
    return this.data.simulation;
  }

  public addNotification(notification: Omit<AppNotification, 'id' | 'created_at'>): AppNotification | null {
    // Check if duplicate exists by dedup_key and date
    const exists = this.data.notifications.some(
      n => n.dedup_key === notification.dedup_key && n.date === notification.date && (notification.staff_id === 'ALL' || n.staff_id === notification.staff_id)
    );
    if (exists) {
      return null;
    }

    const newNotif: AppNotification = {
      ...notification,
      id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    this.data.notifications.unshift(newNotif);
    // Keep max 200 notifications to prevent unbounded growth
    if (this.data.notifications.length > 200) {
      this.data.notifications = this.data.notifications.slice(0, 200);
    }
    this.saveData();
    return newNotif;
  }

  public markNotificationRead(id: string, read: boolean): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read_status = read;
      this.saveData();
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(staffId: string): number {
    let count = 0;
    this.data.notifications.forEach(n => {
      if (staffId === 'ALL' || staffId === 'ADMIN' || n.staff_id === staffId || n.staff_id === 'ALL') {
        if (!n.read_status) {
          n.read_status = true;
          count++;
        }
      }
    });
    if (count > 0) this.saveData();
    return count;
  }

  public clearNotifications(staffId?: string) {
    if (!staffId || staffId === 'ADMIN') {
      this.data.notifications = [];
    } else {
      this.data.notifications = this.data.notifications.filter(n => n.staff_id !== staffId && n.staff_id !== 'ALL');
    }
    this.saveData();
  }

  // Staff management
  public addStaff(staffData: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newStaff: User = {
      ...staffData,
      id: `USR_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.data.users.push(newStaff);
    this.saveData();
    return newStaff;
  }

  public updateStaff(id: string, updates: Partial<User>): User | null {
    const staff = this.data.users.find(u => u.id === id);
    if (!staff) return null;
    Object.assign(staff, updates, { updated_at: new Date().toISOString() });
    this.saveData();
    return staff;
  }

  public deleteStaff(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    // Remove slots assigned to this staff
    this.data.timetable = this.data.timetable.filter(s => s.staff_id !== id);
    if (this.data.users.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  // Classes
  public updateClass(id: string, updates: Partial<DepartmentClass>): DepartmentClass | null {
    const cls = this.data.classes.find(c => c.id === id);
    if (!cls) return null;
    Object.assign(cls, updates);
    this.saveData();
    return cls;
  }

  // Timetable
  public saveTimetableSlot(slot: TimetableSlot): { slot: TimetableSlot; updated: boolean } {
    const existingIndex = this.data.timetable.findIndex(
      s => s.id === slot.id || (s.day === slot.day && s.period_id === slot.period_id && (s.class_id === slot.class_id || s.staff_id === slot.staff_id))
    );

    if (existingIndex >= 0) {
      this.data.timetable[existingIndex] = { ...slot, updated_at: new Date().toISOString() };
      this.saveData();
      return { slot: this.data.timetable[existingIndex], updated: true };
    } else {
      const newSlot: TimetableSlot = {
        ...slot,
        id: slot.id || `SLOT_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.data.timetable.push(newSlot);
      this.saveData();
      return { slot: newSlot, updated: false };
    }
  }

  public deleteTimetableSlot(id: string): boolean {
    const initialLen = this.data.timetable.length;
    this.data.timetable = this.data.timetable.filter(s => s.id !== id);
    if (this.data.timetable.length !== initialLen) {
      this.saveData();
      return true;
    }
    return false;
  }

  public setEntireTimetable(slots: TimetableSlot[]) {
    this.data.timetable = slots;
    this.saveData();
    return this.data.timetable;
  }

  public resetToDefaults() {
    this.data.users = [INITIAL_ADMIN, ...INITIAL_STAFF];
    this.data.classes = INITIAL_CLASSES;
    this.data.periods = PERIODS;
    this.data.breaks = BREAKS;
    this.data.timetable = generateInitialTimetable();
    this.data.notifications = [];
    this.saveData();
    return this.data;
  }
}

export const db = new DatabaseStore();
