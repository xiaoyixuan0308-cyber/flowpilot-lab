import {
  convertSourceAmountToUsd,
  normalizeCurrency,
} from "@/server/services/currency/exchange-rate.service";
import { isMonthClippedWeekWindow } from "@/lib/month-week";

type ImportRow = Record<string, string>;

const OBJECT_STRING_PATTERN = /^\[object .+\]$/i;

function getDefaultYear() {
  return new Date().getFullYear().toString();
}

function getDefaultMonth() {
  return String(new Date().getMonth() + 1);
}

function normalizeMonth(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  const numeric = Number(trimmed);
  if (Number.isInteger(numeric) && numeric >= 1 && numeric <= 12) {
    return String(numeric);
  }

  return trimmed;
}

function describeCell(field: string, index: number) {
  return `${field} at Excel row ${index + 2}`;
}

function assertNotObjectString(value: string, field: string, index: number) {
  if (OBJECT_STRING_PATTERN.test(value.trim())) {
    throw new Error(`${describeCell(field, index)} contains invalid object text: ${value}`);
  }
}

function optionalText(row: ImportRow, field: string, index: number): string | null {
  const value = row[field]?.trim();
  if (!value) return null;
  assertNotObjectString(value, field, index);
  return value;
}

function requiredText(row: ImportRow, field: string, index: number): string {
  const value = optionalText(row, field, index);
  if (value === null) {
    throw new Error(`${describeCell(field, index)} is required`);
  }
  return value;
}

function optionalNumber(row: ImportRow, field: string, index: number): number | null {
  const value = row[field]?.trim();
  if (!value) return null;
  assertNotObjectString(value, field, index);

  const parsed = Number(value.replace(/,/g, ""));
  if (!Number.isFinite(parsed)) {
    throw new Error(`${describeCell(field, index)} is not a valid number: ${value}`);
  }
  return parsed;
}

function numberOrDefault(row: ImportRow, field: string, index: number, defaultValue = 0) {
  return optionalNumber(row, field, index) ?? defaultValue;
}

function requiredNumber(row: ImportRow, field: string, index: number): number {
  const value = optionalNumber(row, field, index);
  if (value === null) {
    throw new Error(`${describeCell(field, index)} is required`);
  }
  return value;
}

function requiredPercentage(row: ImportRow, field: string, index: number): number {
  const value = requiredNumber(row, field, index);
  if (value < 0 || value > 100) {
    throw new Error(`${describeCell(field, index)} must be between 0 and 100: ${value}`);
  }
  return value;
}

function dateOrDefault(row: ImportRow, field: string, index: number, defaultValue: Date) {
  const value = row[field]?.trim();
  if (!value) return defaultValue;
  assertNotObjectString(value, field, index);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${describeCell(field, index)} is not a valid date: ${value}`);
  }
  return parsed;
}

function optionalDate(row: ImportRow, field: string, index: number) {
  const value = row[field]?.trim();
  if (!value) return null;
  assertNotObjectString(value, field, index);

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${describeCell(field, index)} is not a valid date: ${value}`);
  }
  return parsed;
}

function requiredDate(row: ImportRow, field: string, index: number): Date {
  const value = optionalDate(row, field, index);
  if (value === null) {
    throw new Error(`${describeCell(field, index)} is required`);
  }
  return value;
}

function toDateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function requiredMonthStartDate(row: ImportRow, field: string, index: number): Date {
  const value = requiredDate(row, field, index);
  if (value.getUTCDate() !== 1) {
    throw new Error(`${describeCell(field, index)} must be the first day of its month: ${toDateKey(value)}`);
  }
  return value;
}

function normalizeConstraintType(row: ImportRow, index: number) {
  const value = requiredText(row, "constraint_type", index).trim();
  const normalized = value.toUpperCase();

  if (normalized === "WEEK_CAP" || value === "周不能超") return "WEEK_CAP" as const;
  if (normalized === "MONTH_CAP" || value === "月不能超") return "MONTH_CAP" as const;

  throw new Error(
    `${describeCell("constraint_type", index)} must be WEEK_CAP (周不能超) or MONTH_CAP (月不能超): ${value}`
  );
}

function assertUniqueImportKey(
  seen: Map<string, number>,
  key: string,
  index: number,
  table: string,
  keyDescription: string
) {
  const firstIndex = seen.get(key);
  if (firstIndex !== undefined) {
    throw new Error(
      `${table} duplicate key detected: ${keyDescription}; Excel rows ${firstIndex + 2} and ${index + 2}`
    );
  }
  seen.set(key, index);
}

export function mapInventoryRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const dealerlpcode = requiredText(row, "dealerlpcode", index);
    const upn = requiredText(row, "upn", index);
    const year = optionalText(row, "year", index) ?? getDefaultYear();
    const month = normalizeMonth(optionalText(row, "month", index), getDefaultMonth());
    assertUniqueImportKey(
      seen,
      `${dealerlpcode}|${upn}|${year}|${month}`,
      index,
      "ods_inventory_dealer_upn",
      `dealerlpcode=${dealerlpcode}, upn=${upn}, year=${year}, month=${month}`
    );
    return {
      dealerlpcode,
      dealerlpname: optionalText(row, "dealerlpname", index),
      upn,
      qty: numberOrDefault(row, "qty", index),
      year,
      month,
    };
  });
}

export function mapT2PurchaseRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const parentdealerlpcode = optionalText(row, "parentdealerlpcode", index);
    const scBu = requiredText(row, "sc_bu", index);
    const upn = requiredText(row, "upn", index);
    const pl5Code = requiredText(row, "pl5_code", index);
    const year = optionalText(row, "year", index) ?? "2026";
    const month = normalizeMonth(optionalText(row, "month", index), "1");
    assertUniqueImportKey(
      seen,
      `${scBu}|${parentdealerlpcode ?? ""}|${pl5Code}|${upn}|${year}|${month}`,
      index,
      "ods_t2_purchase_monthly",
      `sc_bu=${scBu}, parentdealerlpcode=${parentdealerlpcode ?? ""}, pl5_code=${pl5Code}, upn=${upn}, year=${year}, month=${month}`
    );
    return {
      parentdealerlpcode,
      parentdealerlpname: optionalText(row, "parentdealerlpname", index),
      sc_bu: scBu,
      upn,
      pl5_code: pl5Code,
      pl5_name: optionalText(row, "pl5_name", index),
      qty: numberOrDefault(row, "qty", index),
      year,
      month,
    };
  });
}

export function mapDiohTargetRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const dealerlpcode = requiredText(row, "dealerlpcode", index);
    const upn = requiredText(row, "upn", index);
    assertUniqueImportKey(
      seen,
      `${dealerlpcode}|${upn}`,
      index,
      "ods_dioh_dealer_upn",
      `dealerlpcode=${dealerlpcode}, upn=${upn}`
    );
    return {
      dealerlpcode,
      dealerlpname: optionalText(row, "dealerlpname", index),
      upn,
      abc_class: optionalText(row, "abc_class", index),
      dioh_days: numberOrDefault(row, "dioh_days", index),
    };
  });
}

export function mapFcstLpPl5Rows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const dealerlpcode = requiredText(row, "dealerlpcode", index);
    const scBu = requiredText(row, "sc_bu", index);
    const pl5Code = requiredText(row, "pl5_code", index);
    const year = optionalText(row, "year", index) ?? "2026";
    const month = normalizeMonth(optionalText(row, "month", index), "1");
    assertUniqueImportKey(
      seen,
      `${scBu}|${dealerlpcode}|${pl5Code}|${year}|${month}`,
      index,
      "ods_fcst_lp_pl5_monthly",
      `sc_bu=${scBu}, dealerlpcode=${dealerlpcode}, pl5_code=${pl5Code}, year=${year}, month=${month}`
    );
    return {
      dealerlpcode,
      dealerlpname: optionalText(row, "dealerlpname", index),
      sc_bu: scBu,
      pl5_code: pl5Code,
      pl5_name: optionalText(row, "pl5_name", index),
      fcst_qty: numberOrDefault(row, "fcst_qty", index),
      year,
      month,
    };
  });
}

export function mapFcstT2Pl5Rows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const parentdealerlpcode = optionalText(row, "parentdealerlpcode", index);
    const scBu = requiredText(row, "sc_bu", index);
    const pl5Code = requiredText(row, "pl5_code", index);
    const year = optionalText(row, "year", index) ?? "2026";
    const month = normalizeMonth(optionalText(row, "month", index), "1");
    assertUniqueImportKey(
      seen,
      `${scBu}|${parentdealerlpcode ?? ""}|${pl5Code}|${year}|${month}`,
      index,
      "ods_fcst_t2_pl5_monthly",
      `sc_bu=${scBu}, parentdealerlpcode=${parentdealerlpcode ?? ""}, pl5_code=${pl5Code}, year=${year}, month=${month}`
    );
    return {
      parentdealerlpcode,
      parentdealerlpname: optionalText(row, "parentdealerlpname", index),
      sc_bu: scBu,
      pl5_code: pl5Code,
      pl5_name: optionalText(row, "pl5_name", index),
      fcst_qty: numberOrDefault(row, "fcst_qty", index),
      year,
      month,
    };
  });
}

export function mapAllocateRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    period_month: dateOrDefault(row, "period_month", index, new Date()),
    dealerlpcode: requiredText(row, "dealerlpcode", index),
    dealerlpname: optionalText(row, "dealerlpname", index),
    pl5_code: requiredText(row, "pl5_code", index),
    pl5_name: optionalText(row, "pl5_name", index),
    allocate_qty: numberOrDefault(row, "allocate_qty", index),
  }));
}

export function mapActiveUpnRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    dealerlpcode: optionalText(row, "dealerlpcode", index),
    dealerlpname: optionalText(row, "dealerlpname", index),
    pl5_code: requiredText(row, "pl5_code", index),
    pl5_name: optionalText(row, "pl5_name", index),
    upn: requiredText(row, "upn", index),
    year: optionalText(row, "year", index) ?? "2026",
    month: normalizeMonth(optionalText(row, "month", index), "1"),
  }));
}

export function mapDealerUpnDnRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    created_on: requiredDate(row, "created_on", index),
    sold_to_pt: optionalText(row, "sold_to_pt", index),
    sc_bu: requiredText(row, "sc_bu", index),
    dealer_type: requiredText(row, "dealer_type", index).toUpperCase(),
    material: requiredText(row, "material", index),
    delivery_qty: requiredNumber(row, "delivery_qty", index),
  }));
}

export function mapDealerUpnOpenOrderRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    customer: requiredText(row, "customer", index),
    sc_bu: requiredText(row, "sc_bu", index),
    dealer_type: optionalText(row, "dealer_type", index)?.toUpperCase() ?? null,
    material: requiredText(row, "material", index),
    dctp: requiredText(row, "dctp", index),
    open_qty: requiredNumber(row, "open_qty", index),
  }));
}

export function mapBscUpnInventoryRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    material: requiredText(row, "material", index),
    sloc: requiredText(row, "sloc", index),
    unrestricted_qty: requiredNumber(row, "unrestricted_qty", index),
  }));
}

export function mapBscUpnIntransitRows(dataRows: ImportRow[]) {
  return dataRows.map((row, index) => ({
    material: requiredText(row, "material", index),
    forecast_date: requiredDate(row, "forecast_date", index),
    intransit_qty: requiredNumber(row, "intransit_qty", index),
  }));
}

export function mapUpnSafetyStockRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const upn = requiredText(row, "upn", index);
    assertUniqueImportKey(seen, upn, index, "ods_upn_safety_stock_manual", `upn=${upn}`);
    return {
      upn,
      safety_stock_qty: requiredNumber(row, "safety_stock_qty", index),
    };
  });
}

export function mapLpUpnPurchasePriceRows(dataRows: ImportRow[], usdToCnyRate: number) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const dealerCode = requiredText(row, "dealer_code", index);
    const dealerType = requiredText(row, "dealer_type", index).toUpperCase();
    const upn = requiredText(row, "upn", index);
    const bscStdSellPrice = requiredNumber(row, "bsc_std_sell_price", index);
    const bscStdSellPriceVat = optionalNumber(row, "bsc_std_sell_price_vat", index);
    const sourceCurrency = normalizeCurrency(requiredText(row, "currency_code", index));

    if (bscStdSellPrice <= 0) {
      throw new Error(`${describeCell("bsc_std_sell_price", index)} must be greater than 0`);
    }

    assertUniqueImportKey(
      seen,
      `${dealerCode}|${dealerType}|${upn}`,
      index,
      "ods_lp_upn_purchase_price",
      `dealer_code=${dealerCode}, dealer_type=${dealerType}, upn=${upn}`
    );

    return {
      dealer_code: dealerCode,
      dealer_type: dealerType,
      upn,
      bsc_std_sell_price: convertSourceAmountToUsd(bscStdSellPrice, sourceCurrency, usdToCnyRate),
      bsc_std_sell_price_vat:
        bscStdSellPriceVat === null
          ? null
          : convertSourceAmountToUsd(bscStdSellPriceVat, sourceCurrency, usdToCnyRate),
      source_sell_price: bscStdSellPrice,
      source_sell_price_vat: bscStdSellPriceVat,
      source_currency: sourceCurrency,
      usd_to_cny_rate: usdToCnyRate,
    };
  });
}

export function mapCalendarPatternWeeklyRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();
  return dataRows.map((row, index) => {
    const scBu = requiredText(row, "sc_bu", index);
    const periodMonth = requiredDate(row, "period_month", index);
    const monthStartDate = requiredDate(row, "month_start_date", index);
    const weekStartDate = requiredDate(row, "week_start_date", index);
    const weekEndDate = requiredDate(row, "week_end_date", index);
    if (!isMonthClippedWeekWindow(
      toDateKey(periodMonth),
      toDateKey(weekStartDate),
      toDateKey(weekEndDate),
    ) || toDateKey(monthStartDate) !== toDateKey(periodMonth)) {
      throw new Error(
        `Excel row ${index + 2}: week_start_date/week_end_date must use Monday-Sunday weeks clipped to the business month`,
      );
    }
    assertUniqueImportKey(
      seen,
      `${toDateKey(weekStartDate)}|${scBu}`,
      index,
      "ods_calendar_pattern_weekly",
      `week_start_date=${toDateKey(weekStartDate)}, sc_bu=${scBu}`
    );
    return {
      sc_bu: scBu,
      period_month: periodMonth,
      month_start_date: monthStartDate,
      week_start_date: weekStartDate,
      week_end_date: weekEndDate,
      prev_week_pattern_pct:
        optionalNumber(row, "prev_week_pattern_pct", index) === null
          ? null
          : requiredPercentage(row, "prev_week_pattern_pct", index),
      current_week_pattern_pct: requiredPercentage(row, "current_week_pattern_pct", index),
    };
  });
}

export function mapWeeklyAmountThresholdRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();

  return dataRows.map((row, index) => {
    const scBu = requiredText(row, "sc_bu", index);
    assertUniqueImportKey(
      seen,
      scBu,
      index,
      "ods_weekly_amount_threshold_manual",
      `sc_bu=${scBu}`
    );

    return {
      sc_bu: scBu,
      overage_threshold_pct: requiredPercentage(row, "overage_threshold_pct", index),
      shortfall_threshold_pct: requiredPercentage(row, "shortfall_threshold_pct", index),
      source_system: "MANUAL",
    };
  });
}

export function mapUpnConstraintRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();

  return dataRows.map((row, index) => {
    const periodMonth = requiredMonthStartDate(row, "period_month", index);
    const scBu = requiredText(row, "sc_bu", index);
    const upn = requiredText(row, "upn", index);
    const constraintType = normalizeConstraintType(row, index);
    const uniqueKey = `${toDateKey(periodMonth)}|${scBu}|${upn}|${constraintType}`;

    assertUniqueImportKey(
      seen,
      uniqueKey,
      index,
      "ods_upn_constraint_manual",
      `period_month=${toDateKey(periodMonth)}, sc_bu=${scBu}, upn=${upn}, constraint_type=${constraintType}`
    );

    return {
      period_month: periodMonth,
      sc_bu: scBu,
      upn,
      constraint_type: constraintType,
      source_system: optionalText(row, "source_system", index) ?? "MANUAL",
    };
  });
}

export function mapUpnBundleRows(dataRows: ImportRow[]) {
  const seen = new Map<string, number>();

  return dataRows.map((row, index) => {
    const upn = requiredText(row, "upn", index);
    const bundleQty = requiredNumber(row, "bundle_qty", index);
    if (bundleQty <= 0) {
      throw new Error(`${describeCell("bundle_qty", index)} must be greater than 0`);
    }
    if (!Number.isInteger(bundleQty)) {
      throw new Error(`${describeCell("bundle_qty", index)} must be an integer`);
    }
    assertUniqueImportKey(seen, upn, index, "ods_upn_bundle_manual", `upn=${upn}`);
    return {
      upn,
      bundle_qty: bundleQty,
      source_system: optionalText(row, "source_system", index) ?? "MANUAL",
    };
  });
}

export function mapBuPatternAmountWeeklyRows(dataRows: ImportRow[], usdToCnyRate: number) {
  const seen = new Map<string, number>();

  return dataRows.map((row, index) => {
    const periodWeek = requiredDate(row, "period_week", index);
    const periodMonth = requiredDate(row, "period_month", index);
    const scBu = requiredText(row, "sc_bu", index);
    const sourceCurrency = normalizeCurrency(requiredText(row, "currency_code", index));
    const sourceActualAmount = optionalNumber(row, "actual_amount", index);
    const sourceMonthTargetAmount = requiredNumber(row, "month_target_amount", index);
    const sourceMonthLimitAmount = requiredNumber(row, "month_limit_amount", index);
    const uniqueKey = `${toDateKey(periodWeek)}|${scBu}`;
    const firstIndex = seen.get(uniqueKey);

    if (firstIndex !== undefined) {
      throw new Error(
        `ods_bu_pattern_amount_weekly duplicate key detected: period_week=${toDateKey(periodWeek)}, sc_bu=${scBu}; Excel rows ${firstIndex + 2} and ${index + 2}`
      );
    }

    seen.set(uniqueKey, index);

    if (sourceActualAmount !== null && sourceActualAmount < 0) {
      throw new Error(`Row ${index + 2}: actual_amount must be greater than or equal to 0`);
    }
    if (sourceMonthTargetAmount < 0) {
      throw new Error(`Row ${index + 2}: month_target_amount must be greater than or equal to 0`);
    }
    if (sourceMonthLimitAmount < 0) {
      throw new Error(`Row ${index + 2}: month_limit_amount must be greater than or equal to 0`);
    }
    if (sourceActualAmount !== null && sourceActualAmount > sourceMonthTargetAmount) {
      throw new Error(
        `Row ${index + 2}: actual_amount (${sourceActualAmount}) cannot exceed month_target_amount (${sourceMonthTargetAmount})`
      );
    }
    if (sourceMonthTargetAmount > sourceMonthLimitAmount) {
      throw new Error(
        `Row ${index + 2}: month_target_amount (${sourceMonthTargetAmount}) cannot exceed month_limit_amount (${sourceMonthLimitAmount})`
      );
    }

    return {
      period_week: periodWeek,
      period_month: periodMonth,
      sc_bu: scBu,
      actual_amount: sourceActualAmount === null
        ? null
        : convertSourceAmountToUsd(sourceActualAmount, sourceCurrency, usdToCnyRate),
      month_target_amount: convertSourceAmountToUsd(sourceMonthTargetAmount, sourceCurrency, usdToCnyRate),
      month_limit_amount: convertSourceAmountToUsd(sourceMonthLimitAmount, sourceCurrency, usdToCnyRate),
      source_actual_amount: sourceActualAmount,
      source_month_target_amount: sourceMonthTargetAmount,
      source_month_limit_amount: sourceMonthLimitAmount,
      source_currency: sourceCurrency,
      usd_to_cny_rate: usdToCnyRate,
    };
  });
}
