import type { Habit } from '../types/habits';

export function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isHabitScheduledOnDay(habit: Habit, dayOfWeek: number): boolean {
  if (habit.frequency === 'daily') return true;
  if (!habit.schedule_days?.length) return true;
  return habit.schedule_days.includes(dayOfWeek);
}

function getDayOfWeek(dateStr: string): number {
  return new Date(dateStr + 'T12:00:00').getDay();
}

/** Set of completion dates (YYYY-MM-DD) for this habit. */
export function getCurrentStreak(
  habit: Habit,
  completionDates: string[],
  asOfDate: Date = new Date()
): number {
  const set = new Set(completionDates);
  let d = new Date(asOfDate);
  d.setHours(0, 0, 0, 0);
  let count = 0;
  while (true) {
    const dateStr = toDateString(d);
    const dow = d.getDay();
    if (!isHabitScheduledOnDay(habit, dow)) break;
    if (!set.has(dateStr)) break;
    count++;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

/** Longest run of consecutive scheduled-and-completed days in the date range. */
export function getBestStreak(
  habit: Habit,
  completionDates: string[],
  startDate: Date,
  endDate: Date
): number {
  const set = new Set(completionDates);
  let best = 0;
  let current = 0;
  const d = new Date(startDate);
  d.setHours(0, 0, 0, 0);
  const end = endDate.getTime();
  while (d.getTime() <= end) {
    const dateStr = toDateString(d);
    const dow = d.getDay();
    if (!isHabitScheduledOnDay(habit, dow)) {
      current = 0;
    } else if (set.has(dateStr)) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
    d.setDate(d.getDate() + 1);
  }
  return best;
}

/** Completion rate over last N days: (completed scheduled days) / (scheduled days). Returns 0–100. */
export function getRate(
  habit: Habit,
  completionDates: string[],
  lastNDays: number,
  asOfDate: Date = new Date()
): number {
  const set = new Set(completionDates);
  let scheduled = 0;
  let completed = 0;
  const d = new Date(asOfDate);
  d.setHours(0, 0, 0, 0);
  for (let i = 0; i < lastNDays; i++) {
    const dateStr = toDateString(d);
    const dow = d.getDay();
    if (isHabitScheduledOnDay(habit, dow)) {
      scheduled++;
      if (set.has(dateStr)) completed++;
    }
    d.setDate(d.getDate() - 1);
  }
  if (scheduled === 0) return 100;
  return Math.round((completed / scheduled) * 100);
}

export type DayCompletion = { dateStr: string; dayLabel: string; completed: boolean };

/** Last 7 days (oldest first): MON..SUN or similar. Returns 7 items. */
export function getLast7DaysCompletion(
  habit: Habit,
  completionDates: string[],
  asOfDate: Date = new Date()
): DayCompletion[] {
  const set = new Set(completionDates);
  const labels = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const out: DayCompletion[] = [];
  const d = new Date(asOfDate);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - 6);
  for (let i = 0; i < 7; i++) {
    const dateStr = toDateString(d);
    const dow = d.getDay();
    const scheduled = isHabitScheduledOnDay(habit, dow);
    out.push({
      dateStr,
      dayLabel: labels[dow],
      completed: scheduled && set.has(dateStr),
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export type MonthCell = 'completed' | 'missed' | 'unscheduled' | 'future';

/** Grid for a calendar month: rows (weeks) x 7 days. First row may start with empty cells for offset. */
export function getMonthGrid(
  habit: Habit,
  completionDates: string[],
  year: number,
  month: number
): MonthCell[][] {
  const set = new Set(completionDates);
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay();
  const daysInMonth = last.getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const flat: MonthCell[] = [];
  for (let i = 0; i < startDow; i++) flat.push('future');
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = toDateString(d);
    const dow = d.getDay();
    const scheduled = isHabitScheduledOnDay(habit, dow);
    if (d.getTime() > today.getTime()) {
      flat.push('future');
    } else if (!scheduled) {
      flat.push('unscheduled');
    } else if (set.has(dateStr)) {
      flat.push('completed');
    } else {
      flat.push('missed');
    }
  }
  while (flat.length % 7 !== 0) flat.push('future');

  const rows: MonthCell[][] = [];
  for (let r = 0; r < flat.length; r += 7) {
    rows.push(flat.slice(r, r + 7));
  }
  return rows;
}

/** Completion rate this calendar month vs previous. Returns delta in percentage points (e.g. +5). */
export function getVsLastMonth(
  habit: Habit,
  completionDates: string[],
  asOfDate: Date = new Date()
): number | null {
  const set = new Set(completionDates);
  const thisMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), 1);
  const prevMonth = new Date(asOfDate.getFullYear(), asOfDate.getMonth() - 1, 1);
  const today = new Date(asOfDate);
  today.setHours(0, 0, 0, 0);

  function rateForMonth(start: Date, end: Date): number {
    let scheduled = 0;
    let completed = 0;
    const d = new Date(start);
    d.setHours(0, 0, 0, 0);
    const endTime = end.getTime();
    while (d.getTime() <= endTime) {
      const dateStr = toDateString(d);
      const dow = d.getDay();
      if (isHabitScheduledOnDay(habit, dow)) {
        scheduled++;
        if (set.has(dateStr)) completed++;
      }
      d.setDate(d.getDate() + 1);
    }
    if (scheduled === 0) return 100;
    return Math.round((completed / scheduled) * 100);
  }

  const thisMonthEnd = new Date(thisMonth);
  thisMonthEnd.setMonth(thisMonthEnd.getMonth() + 1);
  thisMonthEnd.setDate(0);
  const thisEnd = thisMonthEnd.getTime() > today.getTime() ? today : thisMonthEnd;
  const prevEnd = new Date(prevMonth);
  prevEnd.setMonth(prevEnd.getMonth() + 1);
  prevEnd.setDate(0);

  const thisRate = rateForMonth(thisMonth, thisEnd);
  const prevRate = rateForMonth(prevMonth, prevEnd);
  return thisRate - prevRate;
}
