import {
  add10,
  compareDecimal,
  decimal10,
  divide10,
  divideDown10,
  floorToMultiple10,
  max10,
  multiply10,
  multiplyDivide10,
  roundDecimalInteger,
  subtract10,
} from "../calculation-decimal";
import type { CalculationInputIssue } from "../calculation-input-error";

export function normalizeRatio(value: number) {
  if (!Number.isFinite(value)) {
    throw new Error(`Pattern 必须是有限数字，当前值=${value}`);
  }
  if (compareDecimal(value, 0) < 0 || compareDecimal(value, 100) > 0) {
    throw new Error(`Pattern 必须在 0 到 100 之间，当前值=${value}`);
  }
  return divide10(value, 100);
}

export function round10(value: number) {
  return decimal10(value);
}

export function clampMinZero(value: number) {
  return max10(value, 0);
}

export function buildLpUpnKey(lpCode: string, upn: string) {
  return `${lpCode}||${upn}`;
}

export function buildUpnKey(upn: string) {
  return upn;
}

export function buildInputIssue(
  source: string,
  field: string,
  key: string,
  message: string
): CalculationInputIssue {
  return { source, field, key, message };
}

export function sumNumbers(values: number[]) {
  return add10(...values);
}

export function sumCompleteNumbers(values: Array<number | null>) {
  return values.some((value) => value === null)
    ? null
    : sumNumbers(values as number[]);
}

export function indexByCompleteSum<T>(
  rows: T[],
  keyBuilder: (row: T) => string,
  valueGetter: (row: T) => number | null
) {
  const result = new Map<string, number | null>();

  for (const row of rows) {
    const key = keyBuilder(row);
    const value = valueGetter(row);
    const current = result.get(key);
    result.set(
      key,
      value === null || current === null ? null : add10(current ?? 0, value)
    );
  }

  return result;
}

export function indexBySum<T>(rows: T[], keyBuilder: (row: T) => string, valueGetter: (row: T) => number) {
  const result = new Map<string, number>();

  for (const row of rows) {
    const key = keyBuilder(row);
    result.set(key, add10(result.get(key) ?? 0, valueGetter(row)));
  }

  return result;
}

export {
  add10,
  compareDecimal,
  decimal10,
  divide10,
  divideDown10,
  floorToMultiple10,
  multiply10,
  multiplyDivide10,
  roundDecimalInteger,
  subtract10,
};
