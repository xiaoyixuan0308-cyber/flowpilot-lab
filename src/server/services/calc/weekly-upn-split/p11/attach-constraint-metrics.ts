import { add10, compareDecimal, indexByCompleteSum, subtract10 } from "../weekly-upn-split.helpers";
import type {
  WeeklyConstraintRule,
  WeeklyDiohRow,
  WeeklyP10Row,
  WeeklyP11Row,
} from "../weekly-upn-split.types";

const WEEK_CAP = "WEEK_CAP";
const MONTH_CAP = "MONTH_CAP";

function buildLpUpnKey(lpCode: string, upn: string) {
  return `${lpCode}||${upn}`;
}

function buildBuUpnKey(scBu: string, upn: string) {
  return `${scBu}||${upn}`;
}

function describeConstraintTypes(types: Set<string>) {
  const labels: string[] = [];
  if (types.has(WEEK_CAP)) labels.push("周不能超");
  if (types.has(MONTH_CAP)) labels.push("月不能超");
  return labels.length > 0 ? labels.join(" + ") : "无约束";
}

function indexConstraintTypes(rules: WeeklyConstraintRule[]) {
  const typesByUpn = new Map<string, Set<string>>();

  for (const rule of rules) {
    const key = buildBuUpnKey(rule.scBu, rule.upn);
    const types = typesByUpn.get(key) ?? new Set<string>();
    types.add(rule.constraintType);
    typesByUpn.set(key, types);
  }

  return typesByUpn;
}

function indexAbcClass(rows: WeeklyDiohRow[]) {
  return new Map(
    rows.map((row) => [
      buildLpUpnKey(row.lpCode, row.upn),
      row.abcClass?.trim().toUpperCase() || null,
    ])
  );
}

export function attachConstraintMetrics(
  rows: WeeklyP10Row[],
  rules: WeeklyConstraintRule[],
  diohRows: WeeklyDiohRow[]
): WeeklyP11Row[] {
  const hUpnByUpn = indexByCompleteSum(
    rows,
    (row) => buildBuUpnKey(row.scBu, row.upn),
    (row) => row.sToleranceReplenishQty
  );
  const constraintTypesByUpn = indexConstraintTypes(rules);
  const abcClassByLpUpn = indexAbcClass(diohRows);

  return rows.map((row) => {
    const types =
      constraintTypesByUpn.get(buildBuUpnKey(row.scBu, row.upn)) ??
      constraintTypesByUpn.get(buildBuUpnKey("DEFAULT", row.upn)) ??
      new Set<string>();
    const hasWeekCap = types.has(WEEK_CAP);
    const hasMonthCap = types.has(MONTH_CAP);
    const hUpnMonthlyCapQty = hUpnByUpn.get(buildBuUpnKey(row.scBu, row.upn)) ?? null;
    const baConstraintTypes = describeConstraintTypes(types);
    const bbUpnAbcClass = abcClassByLpUpn.get(buildLpUpnKey(row.lpCode, row.upn)) ?? null;

    if (hasWeekCap) {
      return {
        ...row,
        bbUpnAbcClass,
        hUpnMonthlyCapQty,
        baConstraintTypes,
        bdAdjustmentAllowedFlag: "N" as const,
        blMonthlyRemainingAdjustableQty: 0,
      };
    }

    if (hasMonthCap) {
      if (hUpnMonthlyCapQty === null || row.jbWeekTargetPendingTotalQty === null) {
        return {
          ...row,
          bbUpnAbcClass,
          hUpnMonthlyCapQty,
          baConstraintTypes,
          bdAdjustmentAllowedFlag: null,
          blMonthlyRemainingAdjustableQty: null,
        };
      }

      const consumedQty = add10(row.oMonthDeliveredTotalQty, row.jbWeekTargetPendingTotalQty);
      if (compareDecimal(consumedQty, hUpnMonthlyCapQty) >= 0) {
        return {
          ...row,
          bbUpnAbcClass,
          hUpnMonthlyCapQty,
          baConstraintTypes,
          bdAdjustmentAllowedFlag: "N" as const,
          blMonthlyRemainingAdjustableQty: 0,
        };
      }

      return {
        ...row,
        bbUpnAbcClass,
        hUpnMonthlyCapQty,
        baConstraintTypes,
        bdAdjustmentAllowedFlag: "Y" as const,
        blMonthlyRemainingAdjustableQty: subtract10(
          subtract10(hUpnMonthlyCapQty, row.oMonthDeliveredTotalQty),
          row.jbWeekTargetPendingTotalQty
        ),
      };
    }

    return {
      ...row,
      bbUpnAbcClass,
      hUpnMonthlyCapQty,
      baConstraintTypes,
      bdAdjustmentAllowedFlag: "Y" as const,
      blMonthlyRemainingAdjustableQty: row.yBscAvailableQty,
    };
  });
}
