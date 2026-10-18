import { add10, compareDecimal, indexByCompleteSum, subtract10 } from "../weekly-sku-split.helpers";
import type {
  WeeklyConstraintRule,
  WeeklyDiohRow,
  WeeklyP10Row,
  WeeklyP11Row,
} from "../weekly-sku-split.types";

const WEEK_CAP = "WEEK_CAP";
const MONTH_CAP = "MONTH_CAP";

function buildChannelSkuKey(channelCode: string, sku: string) {
  return `${channelCode}||${sku}`;
}

function buildBuSkuKey(businessUnit: string, sku: string) {
  return `${businessUnit}||${sku}`;
}

function describeConstraintTypes(types: Set<string>) {
  const labels: string[] = [];
  if (types.has(WEEK_CAP)) labels.push("周不能超");
  if (types.has(MONTH_CAP)) labels.push("月不能超");
  return labels.length > 0 ? labels.join(" + ") : "无约束";
}

function indexConstraintTypes(rules: WeeklyConstraintRule[]) {
  const typesBySku = new Map<string, Set<string>>();

  for (const rule of rules) {
    const key = buildBuSkuKey(rule.businessUnit, rule.sku);
    const types = typesBySku.get(key) ?? new Set<string>();
    types.add(rule.constraintType);
    typesBySku.set(key, types);
  }

  return typesBySku;
}

function indexAbcClass(rows: WeeklyDiohRow[]) {
  return new Map(
    rows.map((row) => [
      buildChannelSkuKey(row.channelCode, row.sku),
      row.abcClass?.trim().toUpperCase() || null,
    ])
  );
}

export function attachConstraintMetrics(
  rows: WeeklyP10Row[],
  rules: WeeklyConstraintRule[],
  diohRows: WeeklyDiohRow[]
): WeeklyP11Row[] {
  const hSkuBySku = indexByCompleteSum(
    rows,
    (row) => buildBuSkuKey(row.businessUnit, row.sku),
    (row) => row.sToleranceReplenishQty
  );
  const constraintTypesBySku = indexConstraintTypes(rules);
  const abcClassByChannelSku = indexAbcClass(diohRows);

  return rows.map((row) => {
    const types =
      constraintTypesBySku.get(buildBuSkuKey(row.businessUnit, row.sku)) ??
      constraintTypesBySku.get(buildBuSkuKey("DEFAULT", row.sku)) ??
      new Set<string>();
    const hasWeekCap = types.has(WEEK_CAP);
    const hasMonthCap = types.has(MONTH_CAP);
    const hSkuMonthlyCapQty = hSkuBySku.get(buildBuSkuKey(row.businessUnit, row.sku)) ?? null;
    const baConstraintTypes = describeConstraintTypes(types);
    const bbSkuAbcClass = abcClassByChannelSku.get(buildChannelSkuKey(row.channelCode, row.sku)) ?? null;

    if (hasWeekCap) {
      return {
        ...row,
        bbSkuAbcClass,
        hSkuMonthlyCapQty,
        baConstraintTypes,
        bdAdjustmentAllowedFlag: "N" as const,
        blMonthlyRemainingAdjustableQty: 0,
      };
    }

    if (hasMonthCap) {
      if (hSkuMonthlyCapQty === null || row.jbWeekTargetPendingTotalQty === null) {
        return {
          ...row,
          bbSkuAbcClass,
          hSkuMonthlyCapQty,
          baConstraintTypes,
          bdAdjustmentAllowedFlag: null,
          blMonthlyRemainingAdjustableQty: null,
        };
      }

      const consumedQty = add10(row.oMonthDeliveredTotalQty, row.jbWeekTargetPendingTotalQty);
      if (compareDecimal(consumedQty, hSkuMonthlyCapQty) >= 0) {
        return {
          ...row,
          bbSkuAbcClass,
          hSkuMonthlyCapQty,
          baConstraintTypes,
          bdAdjustmentAllowedFlag: "N" as const,
          blMonthlyRemainingAdjustableQty: 0,
        };
      }

      return {
        ...row,
        bbSkuAbcClass,
        hSkuMonthlyCapQty,
        baConstraintTypes,
        bdAdjustmentAllowedFlag: "Y" as const,
        blMonthlyRemainingAdjustableQty: subtract10(
          subtract10(hSkuMonthlyCapQty, row.oMonthDeliveredTotalQty),
          row.jbWeekTargetPendingTotalQty
        ),
      };
    }

    return {
      ...row,
      bbSkuAbcClass,
      hSkuMonthlyCapQty,
      baConstraintTypes,
      bdAdjustmentAllowedFlag: "Y" as const,
      blMonthlyRemainingAdjustableQty: row.yCentralWarehouseAvailableQty,
    };
  });
}
