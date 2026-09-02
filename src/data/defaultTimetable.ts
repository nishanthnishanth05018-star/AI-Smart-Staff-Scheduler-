import { TimetableSlot, DayOfWeek, ConflictIssue } from '../types';
import { PERIODS, INITIAL_CLASSES, INITIAL_STAFF, DAYS_OF_WEEK } from './departmentData';

/**
 * Generates an initial conflict-free balanced department weekly timetable
 */
export function generateInitialTimetable(): TimetableSlot[] {
  const slots: TimetableSlot[] = [];
  let idCounter = 1;

  // Staff subject mapping for realistic schedule:
  // USR_STF001: Dr. Rajesh Kumar -> AI Principles, Deep Learning
  // USR_STF002: Prof. Priya Sharma -> Machine Learning, Python for AI
  // USR_STF003: Dr. Vikramaditya Rao -> Robotics, Neural Networks
  // USR_STF004: Prof. Ananya Iyer -> Applied Data Science, Big Data
  // USR_STF005: Dr. Suresh Babu -> Natural Language Processing, LLMs
  // USR_STF006: Prof. Meenakshi Sundaram -> Statistics for ADS, R Prog
  // USR_STF007: Dr. Karthik Narayanan -> Reinforcement Learning, Cloud AI
  // USR_STF008: Prof. Divya Menon -> Data Mining, AI Ethics
  // USR_STF009: Prof. Arvind Swaminathan -> Predictive Analytics
  // USR_STF010: Dr. Sneha Kulkarni -> Robotics, Distributed Systems

  const staffList = INITIAL_STAFF;
  const classList = INITIAL_CLASSES;
  const periods = PERIODS;

  // Systematic allocation matrix to ensure 100% conflict-free distribution
  // Days: Monday -> Saturday
  DAYS_OF_WEEK.forEach((day, dayIndex) => {
    periods.forEach((period, periodIndex) => {
      // In each period, schedule 5-7 classes so staff members rotate between teaching and free periods
      const activeClassCount = 6;
      for (let c = 0; c < activeClassCount; c++) {
        const classIndex = (dayIndex * 3 + periodIndex * 2 + c) % classList.length;
        const staffIndex = (dayIndex * 2 + periodIndex * 3 + c) % staffList.length;

        const targetClass = classList[classIndex];
        const targetStaff = staffList[staffIndex];

        // Ensure no staff duplicate in the same period
        const isStaffBusy = slots.some(
          s => s.day === day && s.period_id === period.id && s.staff_id === targetStaff.id
        );
        const isClassBusy = slots.some(
          s => s.day === day && s.period_id === period.id && s.class_id === targetClass.id
        );

        if (!isStaffBusy && !isClassBusy) {
          const subject = targetStaff.subjects[periodIndex % targetStaff.subjects.length] || 'AI Core Subject';
          slots.push({
            id: `SLOT_${idCounter++}`,
            day,
            period_id: period.id,
            class_id: targetClass.id,
            staff_id: targetStaff.id,
            subject_name: subject,
            room: `Hall ${(classIndex % 5) + 101}`,
            academic_year: '2026-2027',
            created_at: new Date().toISOString(),
          });
        }
      }
    });
  });

  return slots;
}

/**
 * Checks for conflicts in a proposed or current timetable
 */
export function detectConflicts(slots: TimetableSlot[]): ConflictIssue[] {
  const issues: ConflictIssue[] = [];

  DAYS_OF_WEEK.forEach(day => {
    PERIODS.forEach(period => {
      const periodSlots = slots.filter(s => s.day === day && s.period_id === period.id);

      // Check Staff double booking
      const staffMap = new Map<string, TimetableSlot[]>();
      periodSlots.forEach(slot => {
        const existing = staffMap.get(slot.staff_id) || [];
        existing.push(slot);
        staffMap.set(slot.staff_id, existing);
      });

      staffMap.forEach((matchedSlots, staffId) => {
        if (matchedSlots.length > 1) {
          const staffObj = INITIAL_STAFF.find(s => s.id === staffId);
          const staffName = staffObj ? `${staffObj.staff_id} (${staffObj.name})` : staffId;
          issues.push({
            type: 'staff_double_booked',
            day,
            period_id: period.id,
            period_name: period.period_name,
            period_time: `${period.start_display} – ${period.end_display}`,
            staff_name: staffName,
            description: `${staffName} is assigned to ${matchedSlots.length} different classes at the same time on ${day} during ${period.period_name} (${period.start_display} – ${period.end_display}).`,
            slots: matchedSlots,
          });
        }
      });

      // Check Class double booking
      const classMap = new Map<string, TimetableSlot[]>();
      periodSlots.forEach(slot => {
        const existing = classMap.get(slot.class_id) || [];
        existing.push(slot);
        classMap.set(slot.class_id, existing);
      });

      classMap.forEach((matchedSlots, classId) => {
        if (matchedSlots.length > 1) {
          const classObj = INITIAL_CLASSES.find(c => c.id === classId);
          const className = classObj ? classObj.class_name : classId;
          issues.push({
            type: 'class_double_booked',
            day,
            period_id: period.id,
            period_name: period.period_name,
            period_time: `${period.start_display} – ${period.end_display}`,
            class_name: className,
            description: `${className} has ${matchedSlots.length} different staff assigned simultaneously on ${day} during ${period.period_name} (${period.start_display} – ${period.end_display}).`,
            slots: matchedSlots,
          });
        }
      });
    });
  });

  return issues;
}
