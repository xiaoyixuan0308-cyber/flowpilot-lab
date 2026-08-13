import { divide10 } from "./weekly-upn-split.helpers";

export const DEFAULT_WEEKLY_AMOUNT_THRESHOLD_PCT = 5;

export interface WeeklyAmountThresholds {
  overageThresholdPct: number;
  shortfallThresholdPct: number;
}

export function validateWeeklyAmountThresholdSourcePct(label: string, value: number) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label}必须是 0 到 100 之间的百分数`);
  }
}

export function resolveWeeklyAmountThresholds(
  rule?: {
    overageThresholdPct: number;
    shortfallThresholdPct: number;
  } | null
): WeeklyAmountThresholds {
  const overageThresholdPct = rule?.overageThresholdPct ?? DEFAULT_WEEKLY_AMOUNT_THRESHOLD_PCT;
  const shortfallThresholdPct = rule?.shortfallThresholdPct ?? DEFAULT_WEEKLY_AMOUNT_THRESHOLD_PCT;

  for (const [label, value] of [
    ["超额缩减阈值", overageThresholdPct],
    ["缺口补差阈值", shortfallThresholdPct],
  ] as const) {
    validateWeeklyAmountThresholdSourcePct(label, value);
  }

  return {
    overageThresholdPct: divide10(overageThresholdPct, 100),
    shortfallThresholdPct: divide10(shortfallThresholdPct, 100),
  };
}
