import { prisma } from "@/lib/prisma";
import { decimal10 } from "@/server/services/calc/calculation-decimal";
import { validateWeeklyAmountThresholdSourcePct } from "@/server/services/calc/weekly-sku-split/weekly-amount-threshold";

function parseBusinessUnit(value: unknown) {
  if (typeof value !== "string" || !value.trim()) throw new Error("业务单元不能为空");
  return value.trim();
}

function parseThreshold(value: unknown, label: string) {
  if (value === null || value === undefined || (typeof value === "string" && value.trim() === "")) {
    throw new Error(`${label}不能为空`);
  }
  const numberValue = Number(value);
  validateWeeklyAmountThresholdSourcePct(label, numberValue);
  return numberValue;
}

export async function upsertWeeklyAmountThreshold(input: {
  businessUnit: unknown;
  overageThresholdPct: unknown;
  shortfallThresholdPct: unknown;
}) {
  const businessUnit = parseBusinessUnit(input.businessUnit);
  const overageThresholdPct = parseThreshold(input.overageThresholdPct, "超额缩减阈值");
  const shortfallThresholdPct = parseThreshold(input.shortfallThresholdPct, "缺口补差阈值");
  const now = new Date();
  return prisma.ods_weekly_amount_threshold_manual.upsert({
    where: { business_unit: businessUnit },
    create: {
      business_unit: businessUnit,
      overage_threshold_pct: decimal10(overageThresholdPct),
      shortfall_threshold_pct: decimal10(shortfallThresholdPct),
      source_system: "MANUAL_UI",
      insert_dt: now,
    },
    update: {
      overage_threshold_pct: decimal10(overageThresholdPct),
      shortfall_threshold_pct: decimal10(shortfallThresholdPct),
      source_system: "MANUAL_UI",
      insert_dt: now,
    },
  });
}

export async function deleteWeeklyAmountThreshold(businessUnitInput: unknown) {
  const businessUnit = parseBusinessUnit(businessUnitInput);
  const result = await prisma.ods_weekly_amount_threshold_manual.deleteMany({ where: { business_unit: businessUnit } });
  return result.count > 0;
}
