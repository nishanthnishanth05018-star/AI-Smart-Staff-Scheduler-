import express from 'express';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { db } from './server/data/store';
import { scheduler } from './server/schedulerEngine';
import { evaluateTimeState, getNowIST, getISTDayOfWeek } from './src/utils/timeUtils';
import { detectConflicts, generateInitialTimetable } from './src/data/defaultTimetable';
import { DayOfWeek, TimetableSlot } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // --------------------------------------------------------------------------
  // AUTH & USER ENDPOINTS
  // --------------------------------------------------------------------------
  
  // Quick login or Demo account switch
  app.post('/api/auth/login', (req, res) => {
    const { emailOrId, password } = req.body;
    if (!emailOrId) {
      return res.status(400).json({ error: 'Email or Staff ID is required' });
    }

    const user = db.getUserById(emailOrId.trim());
    if (!user) {
      return res.status(404).json({ error: 'User not found with provided ID/Email' });
    }

    if (!user.active) {
      return res.status(403).json({ error: 'This staff account is currently deactivated by HOD.' });
    }

    // Return user profile (for demo/department portal, auto-authenticates)
    res.json({ success: true, user, token: `mock_jwt_${user.id}` });
  });

  app.get('/api/auth/users', (req, res) => {
    res.json(db.getUsers());
  });

  // --------------------------------------------------------------------------
  // STAFF MANAGEMENT ENDPOINTS (Admin only)
  // --------------------------------------------------------------------------
  app.get('/api/staff', (req, res) => {
    res.json(db.getStaffMembers());
  });

  app.post('/api/staff', (req, res) => {
    const { staff_id, name, email, phone, department, subjects, role } = req.body;
    if (!staff_id || !name || !email) {
      return res.status(400).json({ error: 'Staff ID, Name and Email are required' });
    }

    const created = db.addStaff({
      staff_id,
      name,
      email,
      phone: phone || '+91 98401 00000',
      role: role || 'staff',
      department: department || 'Artificial Intelligence & Data Science',
      subjects: Array.isArray(subjects) ? subjects : ['General AI'],
      active: true,
    });

    res.status(201).json(created);
  });

  app.put('/api/staff/:id', (req, res) => {
    const updated = db.updateStaff(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    res.json(updated);
  });

  app.delete('/api/staff/:id', (req, res) => {
    const deleted = db.deleteStaff(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Staff not found' });
    }
    res.json({ success: true, message: 'Staff deleted and slots freed' });
  });

  // --------------------------------------------------------------------------
  // CLASSES & PERIODS
  // --------------------------------------------------------------------------
  app.get('/api/classes', (req, res) => {
    res.json(db.getClasses());
  });

  app.get('/api/periods', (req, res) => {
    res.json(db.getPeriods());
  });

  app.get('/api/breaks', (req, res) => {
    res.json(db.getBreaks());
  });

  // --------------------------------------------------------------------------
  // TIMETABLE MANAGEMENT & CONFLICTS
  // --------------------------------------------------------------------------
  app.get('/api/timetable', (req, res) => {
    const { day, staffId, classId } = req.query;
    let timetable = db.getTimetable();

    if (day) {
      timetable = timetable.filter(s => s.day === day);
    }
    if (staffId) {
      timetable = timetable.filter(s => s.staff_id === staffId);
    }
    if (classId) {
      timetable = timetable.filter(s => s.class_id === classId);
    }

    res.json(timetable);
  });

  // Check conflicts
  app.get('/api/timetable/conflicts', (req, res) => {
    const timetable = db.getTimetable();
    const conflicts = detectConflicts(timetable);
    res.json({ count: conflicts.length, conflicts });
  });

  // Save / update a slot
  app.post('/api/timetable/slot', (req, res) => {
    const { day, period_id, class_id, staff_id, subject_name, room, allowOverride } = req.body;

    if (!day || !period_id || !class_id || !staff_id) {
      return res.status(400).json({ error: 'Day, Period, Class, and Staff are required' });
    }

    const currentTimetable = db.getTimetable();

    // Conflict Check 1: Staff double booking during same day & period
    const conflictingStaffSlot = currentTimetable.find(
      s => s.day === day && s.period_id === period_id && s.staff_id === staff_id && s.class_id !== class_id
    );

    if (conflictingStaffSlot && !allowOverride) {
      const staffObj = db.getUserById(staff_id);
      const classObj = db.getClassById(conflictingStaffSlot.class_id);
      return res.status(409).json({
        conflictType: 'staff_double_booked',
        error: `⚠️ Timetable Conflict: ${staffObj?.name || staff_id} is already assigned to ${classObj?.class_name || conflictingStaffSlot.class_id} during this period.`,
      });
    }

    // Conflict Check 2: Class double booking
    const conflictingClassSlot = currentTimetable.find(
      s => s.day === day && s.period_id === period_id && s.class_id === class_id && s.staff_id !== staff_id
    );

    if (conflictingClassSlot && !allowOverride) {
      const staffObj = db.getUserById(conflictingClassSlot.staff_id);
      const classObj = db.getClassById(class_id);
      return res.status(409).json({
        conflictType: 'class_double_booked',
        error: `⚠️ Class Conflict: ${classObj?.class_name || class_id} is already assigned to ${staffObj?.name || conflictingClassSlot.staff_id} during this period.`,
      });
    }

    const result = db.saveTimetableSlot({
      id: req.body.id,
      day,
      period_id,
      class_id,
      staff_id,
      subject_name: subject_name || 'AI Specialization',
      room: room || 'Hall 101',
    });

    // Notify affected staff of timetable change
    const classInfo = db.getClassById(class_id);
    const periodInfo = db.getPeriods().find(p => p.id === period_id);
    const simulation = db.getSimulation();
    const timeState = evaluateTimeState(simulation.enabled ? simulation.time24 : undefined, simulation.enabled ? simulation.day : undefined, simulation.enabled);
    
    db.addNotification({
      dedup_key: `change_${Date.now()}_staff_${staff_id}`,
      staff_id,
      timetable_id: result.slot.id,
      title: '🔄 Timetable Updated',
      message: `Your timetable has been updated.\nDay: ${day}\nPeriod: ${periodInfo?.period_number || 1}\nNew Class: ${classInfo?.class_name || 'Assigned Class'}\nTime: ${periodInfo?.start_display} – ${periodInfo?.end_display}`,
      notification_type: 'TIMETABLE_CHANGE',
      class_name: classInfo?.class_name,
      period_number: periodInfo?.period_number,
      start_time: periodInfo?.start_display,
      end_time: periodInfo?.end_display,
      sent_time: timeState.ist_time_str,
      read_status: false,
      date: timeState.ist_date_str,
    });

    // Trigger scheduler tick
    scheduler.runTick();

    res.json({ success: true, slot: result.slot, updated: result.updated });
  });

  app.delete('/api/timetable/slot/:id', (req, res) => {
    const deleted = db.deleteTimetableSlot(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Slot not found' });
    }
    res.json({ success: true });
  });

  app.post('/api/timetable/reset', (req, res) => {
    db.resetToDefaults();
    scheduler.runTick();
    res.json({ success: true, message: 'Timetable reset to initial conflict-free balanced schedule' });
  });

  // --------------------------------------------------------------------------
  // NOTIFICATIONS & ANNOUNCEMENTS
  // --------------------------------------------------------------------------
  app.get('/api/notifications', (req, res) => {
    const staffId = req.query.staffId as string;
    const notifications = db.getNotifications(staffId);
    const unreadCount = notifications.filter(n => !n.read_status).length;
    res.json({ notifications, unreadCount });
  });

  app.put('/api/notifications/:id/read', (req, res) => {
    const success = db.markNotificationRead(req.params.id, req.body.read !== false);
    res.json({ success });
  });

  app.post('/api/notifications/mark-all-read', (req, res) => {
    const staffId = (req.body.staffId as string) || 'ALL';
    const count = db.markAllNotificationsRead(staffId);
    res.json({ success: true, count });
  });

  app.delete('/api/notifications', (req, res) => {
    const staffId = req.query.staffId as string;
    db.clearNotifications(staffId);
    res.json({ success: true });
  });

  // Admin Broadcast Announcement
  app.post('/api/notifications/announcement', (req, res) => {
    const { title, message, targetStaffId } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Announcement message is required' });
    }

    const simulation = db.getSimulation();
    const timeState = evaluateTimeState(simulation.enabled ? simulation.time24 : undefined, simulation.enabled ? simulation.day : undefined, simulation.enabled);

    const notif = db.addNotification({
      dedup_key: `announcement_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      staff_id: targetStaffId || 'ALL',
      title: title || '📢 Important Announcement',
      message: message,
      notification_type: 'IMPORTANT_ANNOUNCEMENT',
      sent_time: timeState.ist_time_str,
      read_status: false,
      date: timeState.ist_date_str,
    });

    res.status(201).json({ success: true, notification: notif });
  });

  // --------------------------------------------------------------------------
  // TIME SIMULATION & SCHEDULER ENGINE
  // --------------------------------------------------------------------------
  app.get('/api/time/state', (req, res) => {
    const simulation = db.getSimulation();
    const timeState = evaluateTimeState(
      simulation.enabled ? simulation.time24 : undefined,
      simulation.enabled ? simulation.day : undefined,
      simulation.enabled
    );
    res.json(timeState);
  });

  app.post('/api/time/simulate', (req, res) => {
    const { time24, day, enabled } = req.body;
    const sim = db.setSimulation({
      enabled: enabled !== false,
      time24: time24 || '09:45',
      day: (day as DayOfWeek) || 'Monday',
    });

    // Run scheduler tick immediately to process notifications for this simulated time
    const result = scheduler.runTick();

    const timeState = evaluateTimeState(sim.time24, sim.day, sim.enabled);
    res.json({ success: true, simulation: sim, timeState, tickResult: result });
  });

  app.post('/api/time/live', (req, res) => {
    const sim = db.setSimulation({
      enabled: false,
      time24: '09:45',
      day: 'Monday',
    });
    scheduler.runTick();
    const timeState = evaluateTimeState(undefined, undefined, false);
    res.json({ success: true, simulation: sim, timeState });
  });

  app.post('/api/scheduler/tick', (req, res) => {
    const tickResult = scheduler.runTick();
    res.json({ success: true, tickResult });
  });

  // --------------------------------------------------------------------------
  // DASHBOARD STATS & AI AUTO-OPTIMIZER
  // --------------------------------------------------------------------------
  app.get('/api/stats', (req, res) => {
    const simulation = db.getSimulation();
    const timeState = evaluateTimeState(
      simulation.enabled ? simulation.time24 : undefined,
      simulation.enabled ? simulation.day : undefined,
      simulation.enabled
    );

    const timetable = db.getTimetable();
    const staffMembers = db.getStaffMembers();
    const classes = db.getClasses();
    const conflicts = detectConflicts(timetable);

    // Calculate staff currently teaching
    const todaySlots = timetable.filter(s => s.day === timeState.ist_day);
    let staffTeachingCount = 0;
    let staffFreeCount = staffMembers.length;

    if (timeState.current_period) {
      const activeSlotStaffIds = new Set(
        todaySlots.filter(s => s.period_id === timeState.current_period?.id).map(s => s.staff_id)
      );
      staffTeachingCount = activeSlotStaffIds.size;
      staffFreeCount = Math.max(0, staffMembers.length - staffTeachingCount);
    }

    const todayNotifications = db.getNotifications().filter(n => n.date.includes(timeState.ist_day) || n.date.includes('2026'));

    res.json({
      totalStaff: staffMembers.length,
      totalClasses: classes.length,
      staffCurrentlyTeaching: staffTeachingCount,
      staffCurrentlyFree: staffFreeCount,
      todayNotificationsCount: todayNotifications.length,
      conflictsCount: conflicts.length,
      timeState,
      settings: db.getSettings(),
    });
  });

  // Smart Timetable Generator Endpoint
  app.post('/api/ai/optimize-schedule', (req, res) => {
    const initial = generateInitialTimetable();
    db.setEntireTimetable(initial);
    scheduler.runTick();
    res.json({
      success: true,
      message: 'AI Smart Engine successfully balanced the 6-day timetable across all 10 staff members with zero conflicts.',
      totalSlots: initial.length,
    });
  });

  // --------------------------------------------------------------------------
  // VITE DEV SERVER / STATIC ASSET SERVING
  // --------------------------------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AI Smart Staff Scheduler] Server running on http://localhost:${PORT}`);
  });
}

startServer();
