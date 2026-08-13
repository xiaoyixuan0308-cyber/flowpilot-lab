export function getYearMonth(periodMonth: string) {
  const d = new Date(`${periodMonth}T08:00:00+08:00`);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
  };
}

export function getPrevMonth(periodMonth: string, n: number) {
  const d = new Date(`${periodMonth}T08:00:00+08:00`);
  d.setMonth(d.getMonth() - n);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
  };
}
