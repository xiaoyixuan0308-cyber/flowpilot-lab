function parsePeriodDate(periodMonth: string) {
  return new Date(`${periodMonth}T08:00:00+08:00`);
}

export function getPrevMonth(periodMonth: string, n: number): string {
  const d = parsePeriodDate(periodMonth);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function getYearMonth(periodMonth: string): { year: string; month: string } {
  const d = parsePeriodDate(periodMonth);
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1),
  };
}

export function safeDiv(a: number, b: number): number {
  return divide10(a, b);
}

export function round10(n: number): number {
  return decimal10(n);
}

export function aggregateByKey<T, K extends string>(
  rows: T[],
  keyFn: (row: T) => K,
  valueFn: (row: T) => number
): Map<K, number> {
  const map = new Map<K, number>();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, add10(map.get(key) || 0, valueFn(row)));
  }
  return map;
}

export { add10, compareDecimal, decimal10, divide10 };
import { add10, compareDecimal, decimal10, divide10 } from "../calculation-decimal";
