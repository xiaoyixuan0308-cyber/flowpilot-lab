function parsePeriodDate(periodMonth: string) {
  return new Date(`${periodMonth}T08:00:00+08:00`);
}

export function getYearMonth(periodMonth: string): { year: string; month: string } {
  const d = parsePeriodDate(periodMonth);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
  };
}

export function getPrevMonth(periodMonth: string, n: number): string {
  const d = parsePeriodDate(periodMonth);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
