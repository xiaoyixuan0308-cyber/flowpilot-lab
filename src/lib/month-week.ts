const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function parseDateKey(value: string) {
  const match = DATE_KEY_PATTERN.exec(value);
  if (!match) throw new Error(`Invalid date: ${value}`);

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, monthIndex, day));
  if (toDateKey(date) !== value) throw new Error(`Invalid date: ${value}`);
  return date;
}

export type MonthClippedWeek = {
  periodMonth: string;
  weekStartDate: string;
  weekEndDate: string;
};

export function getMonthClippedWeek(dateKey: string): MonthClippedWeek {
  const date = parseDateKey(dateKey);
  const year = date.getUTCFullYear();
  const monthIndex = date.getUTCMonth();
  const monthStart = new Date(Date.UTC(year, monthIndex, 1));
  const monthEnd = new Date(Date.UTC(year, monthIndex + 1, 0));
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  const daysUntilSunday = 6 - daysSinceMonday;
  const naturalWeekStart = new Date(date);
  const naturalWeekEnd = new Date(date);

  naturalWeekStart.setUTCDate(date.getUTCDate() - daysSinceMonday);
  naturalWeekEnd.setUTCDate(date.getUTCDate() + daysUntilSunday);

  const weekStart = naturalWeekStart < monthStart ? monthStart : naturalWeekStart;
  const weekEnd = naturalWeekEnd > monthEnd ? monthEnd : naturalWeekEnd;

  return {
    periodMonth: toDateKey(monthStart),
    weekStartDate: toDateKey(weekStart),
    weekEndDate: toDateKey(weekEnd),
  };
}

export function isMonthClippedWeekWindow(
  periodMonth: string,
  weekStartDate: string,
  weekEndDate: string,
) {
  try {
    const expected = getMonthClippedWeek(weekStartDate);
    return expected.periodMonth === periodMonth
      && expected.weekStartDate === weekStartDate
      && expected.weekEndDate === weekEndDate;
  } catch {
    return false;
  }
}

export function listMonthClippedWeeks(periodMonth: string): MonthClippedWeek[] {
  const first = parseDateKey(periodMonth);
  if (first.getUTCDate() !== 1) throw new Error(`Month must start on day 1: ${periodMonth}`);

  const weeks: MonthClippedWeek[] = [];
  let cursor = periodMonth;
  while (cursor.slice(0, 7) === periodMonth.slice(0, 7)) {
    const week = getMonthClippedWeek(cursor);
    weeks.push(week);
    const next = parseDateKey(week.weekEndDate);
    next.setUTCDate(next.getUTCDate() + 1);
    cursor = toDateKey(next);
  }
  return weeks;
}
