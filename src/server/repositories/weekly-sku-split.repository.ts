import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  WeeklyAmountRow,
  WeeklyAmountThresholdRow,
  WeeklyCentralWarehouseInventoryRow,
  WeeklyCentralWarehouseIntransitRow,
  WeeklyBundleRule,
  WeeklyCalendarRow,
  WeeklyConstraintRule,
  WeeklyDealerDnRow,
  WeeklyDiohRow,
  WeeklyMonthlySnapshotRow,
  WeeklyOpenOrderRow,
  WeeklyPurchasePriceRow,
  WeeklySafetyStockRow,
  WeeklySourceData,
} from "@/server/services/calc/weekly-sku-split/weekly-sku-split.types";
import { getDbEnvConfig } from "@/server/constants/db-env";
import { resolveWeeklyAmountThresholds } from "@/server/services/calc/weekly-sku-split/weekly-amount-threshold";
import { getMonthClippedWeek } from "@/lib/month-week";

const WEEKLY_REQUIRED_TABLES = [
  "ods_dealer_sku_dn",
  "ods_dealer_sku_open_order",
  "ods_central_warehouse_sku_inventory",
  "ods_central_warehouse_sku_intransit",
  "ods_sku_safety_stock_manual",
  "ods_channel_sku_purchase_price",
  "ods_sku_constraint_manual",
  "ods_sku_bundle_manual",
  "ods_calendar_pattern_weekly",
  "ods_bu_pattern_amount_weekly",
  "ods_weekly_amount_threshold_manual",
] as const;

function toPeriodDate(value: string) {
  return new Date(`${value}T08:00:00+08:00`);
}

function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function schemaRef(schema: string) {
  return Prisma.raw(quoteIdentifier(schema));
}

function toNullableNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

async function findMissingWeeklyTables(schema: string, db: Prisma.TransactionClient) {
  const rows = await db.$queryRaw<{ table_name: string }[]>(Prisma.sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
      AND table_name IN (${Prisma.join(WEEKLY_REQUIRED_TABLES.map((name) => Prisma.sql`${name}`))})
  `);
  const existing = new Set(rows.map((row) => row.table_name));
  return WEEKLY_REQUIRED_TABLES.filter((tableName) => !existing.has(tableName));
}

export function validateWeeklyCalendarRow(row: WeeklyCalendarRow, calendarDate: string) {
  const calendarTime = toPeriodDate(calendarDate).getTime();
  const monthStartTime = row.monthStartDate.getTime();
  const weekStartTime = row.weekStartDate.getTime();
  const weekEndTime = row.weekEndDate.getTime();
  const currentWeekPatternPct = toNumber(row.currentWeekPatternPct);
  const expectedWeek = getMonthClippedWeek(calendarDate);

  if (monthStartTime > calendarTime) {
    throw new Error(`周拆分 Calendar 非法：month_start_date 晚于计算基准日，业务单元=${row.businessUnit}`);
  }
  if (weekStartTime > weekEndTime) {
    throw new Error(`周拆分 Calendar 非法：week_start_date 晚于 week_end_date，业务单元=${row.businessUnit}`);
  }
  if (calendarTime < weekStartTime || calendarTime > weekEndTime) {
    throw new Error(`周拆分 Calendar 非法：计算基准日不在周窗口内，业务单元=${row.businessUnit}`);
  }
  if (
    dateKey(row.periodMonth) !== expectedWeek.periodMonth
    || dateKey(row.weekStartDate) !== expectedWeek.weekStartDate
    || dateKey(row.weekEndDate) !== expectedWeek.weekEndDate
  ) {
    throw new Error(
      `周拆分 Calendar 周区间不符合自然周规则：业务单元=${row.businessUnit}，应为 ${expectedWeek.weekStartDate} 至 ${expectedWeek.weekEndDate}`,
    );
  }
  if (!Number.isFinite(currentWeekPatternPct) || currentWeekPatternPct < 0 || currentWeekPatternPct > 100) {
    throw new Error(`周拆分 Calendar 非法：current_week_pattern_pct 必须在 0 到 100 之间，业务单元=${row.businessUnit}`);
  }
}

async function loadWeeklyCalendarRows(
  schema: string,
  calendarDate: string,
  db: Prisma.TransactionClient,
) {
  const expectedWeek = getMonthClippedWeek(calendarDate);
  const periodMonth = toPeriodDate(expectedWeek.periodMonth);
  const weekStartDate = toPeriodDate(expectedWeek.weekStartDate);
  const weekEndDate = toPeriodDate(expectedWeek.weekEndDate);
  const rows = await db.$queryRaw<Array<{
    businessUnit: string;
    periodMonth: Date;
    monthStartDate: Date;
    weekStartDate: Date;
    weekEndDate: Date;
    prevWeekPatternPct: Prisma.Decimal | null;
    currentWeekPatternPct: Prisma.Decimal | null;
  }>>(Prisma.sql`
    SELECT
      business_unit AS "businessUnit",
      period_month AS "periodMonth",
      month_start_date AS "monthStartDate",
      week_start_date AS "weekStartDate",
      week_end_date AS "weekEndDate",
      prev_week_pattern_pct AS "prevWeekPatternPct",
      current_week_pattern_pct AS "currentWeekPatternPct"
    FROM ${schemaRef(schema)}."ods_calendar_pattern_weekly"
    WHERE period_month = ${periodMonth}
      AND week_start_date = ${weekStartDate}
      AND week_end_date = ${weekEndDate}
    ORDER BY business_unit ASC
  `);
  if (rows.length === 0) {
    throw new Error(
      `未找到符合自然周规则的 Calendar 记录：${expectedWeek.weekStartDate} 至 ${expectedWeek.weekEndDate}`,
    );
  }

  const calendars: WeeklyCalendarRow[] = rows.map((row) => ({
    businessUnit: row.businessUnit,
    periodMonth: new Date(row.periodMonth),
    monthStartDate: new Date(row.monthStartDate),
    weekStartDate: new Date(row.weekStartDate),
    weekEndDate: new Date(row.weekEndDate),
    prevWeekPatternPct: toNullableNumber(row.prevWeekPatternPct),
    currentWeekPatternPct: toNullableNumber(row.currentWeekPatternPct),
  }));
  const duplicateBusinessUnits = calendars
    .map((row) => row.businessUnit)
    .filter((businessUnit, index, all) => all.indexOf(businessUnit) !== index);
  if (duplicateBusinessUnits.length > 0) {
    throw new Error(
      `同一计算基准日命中了同一 业务单元 的多条 Calendar 记录：${[...new Set(duplicateBusinessUnits)].join(", ")}`
    );
  }
  for (const calendar of calendars) {
    if (calendar.currentWeekPatternPct === null) {
      throw new Error(`Calendar current_week_pattern_pct 为空：业务单元=${calendar.businessUnit}`);
    }
    validateWeeklyCalendarRow(calendar, calendarDate);
  }
  const periodMonths = new Set(calendars.map((row) => dateKey(row.periodMonth)));
  if (periodMonths.size !== 1) {
    throw new Error(`同一计算基准日命中了多个业务月：${[...periodMonths].join(", ")}`);
  }
  return calendars;
}

async function loadWeeklyAmountThresholds(
  businessUnits: string[],
  db: Prisma.TransactionClient,
): Promise<WeeklyAmountThresholdRow[]> {
  const rules = await db.ods_weekly_amount_threshold_manual.findMany({
    where: { business_unit: { in: businessUnits } },
    select: { business_unit: true, overage_threshold_pct: true, shortfall_threshold_pct: true },
  });
  const ruleByBu = new Map(rules.map((row) => [row.business_unit, row]));
  return businessUnits.map((businessUnit) => {
    const rule = ruleByBu.get(businessUnit);
    const resolved = resolveWeeklyAmountThresholds(rule ? {
      overageThresholdPct: toNumber(rule.overage_threshold_pct),
      shortfallThresholdPct: toNumber(rule.shortfall_threshold_pct),
    } : null);
    return { businessUnit, ...resolved };
  });
}

export async function resolveWeeklyCalculationContext(
  calendarDate: string,
  db: Prisma.TransactionClient = prisma,
) {
  const schema = getDbEnvConfig().schema;
  const calendars = await loadWeeklyCalendarRows(schema, calendarDate, db);
  const thresholds = await loadWeeklyAmountThresholds(calendars.map((row) => row.businessUnit), db);
  const first = calendars[0];
  return {
    calendarDate,
    periodMonth: dateKey(first.periodMonth),
    monthStartDate: dateKey(first.monthStartDate),
    weekStartDate: dateKey(first.weekStartDate),
    weekEndDate: dateKey(first.weekEndDate),
    businessUnits: calendars.map((row) => row.businessUnit),
    buThresholds: thresholds,
    overageThresholdPct: thresholds[0]?.overageThresholdPct ?? 0.05,
    shortfallThresholdPct: thresholds[0]?.shortfallThresholdPct ?? 0.05,
  };
}

function mapMonthQuotaQty(row: {
  s_tolerance_replenish: Prisma.Decimal | null;
  r_base_replenish: Prisma.Decimal | null;
  q_actual_theoretical: Prisma.Decimal | null;
}) {
  if (row.s_tolerance_replenish !== null) return toNumber(row.s_tolerance_replenish);
  if (row.r_base_replenish !== null) return toNumber(row.r_base_replenish);
  return toNullableNumber(row.q_actual_theoretical);
}

export async function getWeeklySkuSplitSourceData(
  input: { calendarDate: string },
  db: Prisma.TransactionClient = prisma,
): Promise<WeeklySourceData> {
  const schema = getDbEnvConfig().schema;
  const missingTables = await findMissingWeeklyTables(schema, db);
  if (missingTables.length > 0) {
    throw new Error(`周拆分缺少必要数据表：${missingTables.join(", ")}`);
  }
  const calendars = await loadWeeklyCalendarRows(schema, input.calendarDate, db);
  const businessUnits = calendars.map((row) => row.businessUnit);
  const amountThresholds = await loadWeeklyAmountThresholds(businessUnits, db);
  const periodMonth = dateKey(calendars[0].periodMonth);
  const periodDate = toPeriodDate(periodMonth);
  const latestBatch = await db.calc_batch.findFirst({
    where: { period_month: periodDate },
    orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
    select: { id: true },
  });
  if (!latestBatch) throw new Error(`未找到 ${periodMonth} 对应的月拆分结果`);

  const minMonthStart = new Date(Math.min(...calendars.map((row) => row.monthStartDate.getTime())));
  const minWeekStart = new Date(Math.min(...calendars.map((row) => row.weekStartDate.getTime())));
  const maxWeekEnd = new Date(Math.max(...calendars.map((row) => row.weekEndDate.getTime())));
  const targetDate = toPeriodDate(input.calendarDate);
  const weekStarts = calendars.map((row) => row.weekStartDate);
  const [monthlySnapshotRows, dnRows, openOrderRows, inventoryRows, intransitRows, safetyStockRows,
    purchasePriceRows, constraintRules, bundleRules, diohRows, rawAmountRows] = await Promise.all([
    db.calc_sku_split_result.findMany({
      where: {
        batch_id: latestBatch.id,
        business_unit: { in: businessUnits },
        OR: [
          { is_error: false },
          { error_catalog: { is: { should_skip_calc: false } } },
        ],
      },
      orderBy: [{ business_unit: "asc" }, { dealer_channel_code: "asc" }, { category_code: "asc" }, { sku: "asc" }],
      select: {
        business_unit: true, dealer_channel_code: true, category_code: true, sku: true,
        s_tolerance_replenish: true, r_base_replenish: true, q_actual_theoretical: true,
        current_dioh: true, m_original_target_inventory: true,
        f_t2_purchase_3m_avg: true, j_opening_inventory: true,
      },
    }),
    db.$queryRaw<WeeklyDealerDnRow[]>(Prisma.sql`
      SELECT business_unit AS "businessUnit", dealer_type AS "dealerType", sold_to_pt AS "soldToPt",
        material, created_on AS "createdOn", delivery_qty AS "deliveryQty"
      FROM ${schemaRef(schema)}."ods_dealer_sku_dn"
      WHERE created_on >= ${minMonthStart} AND created_on <= ${targetDate}
    `),
    db.$queryRaw<WeeklyOpenOrderRow[]>(Prisma.sql`
      SELECT business_unit AS "businessUnit", customer, dealer_type AS "dealerType", material, dctp,
        open_qty AS "openQty"
      FROM ${schemaRef(schema)}."ods_dealer_sku_open_order"
    `),
    db.$queryRaw<WeeklyCentralWarehouseInventoryRow[]>(Prisma.sql`
      SELECT material, sloc, unrestricted_qty AS "unrestrictedQty"
      FROM ${schemaRef(schema)}."ods_central_warehouse_sku_inventory"
    `),
    db.$queryRaw<WeeklyCentralWarehouseIntransitRow[]>(Prisma.sql`
      SELECT material, forecast_date AS "forecastDate", intransit_qty AS "intransitQty"
      FROM ${schemaRef(schema)}."ods_central_warehouse_sku_intransit"
      WHERE forecast_date >= ${minWeekStart} AND forecast_date <= ${maxWeekEnd}
    `),
    db.$queryRaw<WeeklySafetyStockRow[]>(Prisma.sql`
      SELECT sku, safety_stock_qty AS "safetyStockQty"
      FROM ${schemaRef(schema)}."ods_sku_safety_stock_manual"
    `),
    db.$queryRaw<WeeklyPurchasePriceRow[]>(Prisma.sql`
      SELECT dealer_code AS "dealerCode", dealer_type AS "dealerType", sku,
        central_warehouse_std_sell_price AS "centralWarehouseStdSellPrice", central_warehouse_std_sell_price_vat AS "centralWarehouseStdSellPriceVat"
      FROM ${schemaRef(schema)}."ods_channel_sku_purchase_price"
    `),
    db.ods_sku_constraint_manual.findMany({
      where: {
        period_month: periodDate,
        business_unit: { in: [...businessUnits, "DEFAULT"] },
      },
      select: { business_unit: true, sku: true, constraint_type: true },
    }),
    db.ods_sku_bundle_manual.findMany({ select: { sku: true, bundle_qty: true } }),
    db.ods_dioh_dealer_sku.findMany({ select: { dealer_channel_code: true, sku: true, abc_class: true } }),
    db.ods_bu_pattern_amount_weekly.findMany({
      where: { period_week: { in: weekStarts }, business_unit: { in: businessUnits } },
      select: {
        business_unit: true,
        period_week: true,
        period_month: true,
        actual_amount: true,
        month_target_amount: true,
        month_limit_amount: true,
      },
    }),
  ]);

  const calendarByBu = new Map(calendars.map((row) => [row.businessUnit, row]));
  const amountRows: WeeklyAmountRow[] = rawAmountRows
    .filter((row) => dateKey(row.period_week) === dateKey(calendarByBu.get(row.business_unit)!.weekStartDate))
    .map((row) => ({
      businessUnit: row.business_unit,
      periodWeek: row.period_week,
      periodMonth: row.period_month,
      actualAmount: toNullableNumber(row.actual_amount),
      monthTargetAmount: toNumber(row.month_target_amount),
      monthLimitAmount: toNumber(row.month_limit_amount),
    }));
  const monthlyRows: WeeklyMonthlySnapshotRow[] = monthlySnapshotRows.map((row) => ({
    businessUnit: row.business_unit,
    channelCode: row.dealer_channel_code,
    categoryCode: row.category_code,
    sku: row.sku,
    monthQuotaQty: mapMonthQuotaQty(row),
    sToleranceReplenishQty: toNullableNumber(row.s_tolerance_replenish),
    rBaseReplenishQty: toNullableNumber(row.r_base_replenish),
    qActualTheoreticalQty: toNullableNumber(row.q_actual_theoretical),
    currentInventoryDays: toNullableNumber(row.current_dioh),
    originalTargetInventoryQty: toNullableNumber(row.m_original_target_inventory),
    currentInventoryQty: toNullableNumber(row.j_opening_inventory),
    t2Purchase3mAvgQty: toNullableNumber(row.f_t2_purchase_3m_avg),
  }));

  return {
    periodMonth,
    calendarDate: input.calendarDate,
    sourceBatchId: latestBatch.id,
    calendars,
    amountThresholds,
    monthlyRows,
    dnRows: dnRows
      .filter((row) => {
        const calendar = calendarByBu.get(row.businessUnit);
        return Boolean(calendar && row.createdOn && row.createdOn >= calendar.monthStartDate);
      })
      .map((row) => ({ ...row, deliveryQty: toNumber(row.deliveryQty) })),
    openOrderRows: openOrderRows.map((row) => ({ ...row, openQty: toNumber(row.openQty) })),
    inventoryRows: inventoryRows.map((row) => ({ ...row, unrestrictedQty: toNumber(row.unrestrictedQty) })),
    intransitRows: intransitRows.map((row) => ({ ...row, intransitQty: toNumber(row.intransitQty) })),
    safetyStockRows: safetyStockRows.map((row) => ({ ...row, safetyStockQty: toNumber(row.safetyStockQty) })),
    purchasePriceRows: purchasePriceRows.map((row) => ({
      ...row,
      centralWarehouseStdSellPrice: toNullableNumber(row.centralWarehouseStdSellPrice),
      centralWarehouseStdSellPriceVat: toNullableNumber(row.centralWarehouseStdSellPriceVat),
    })),
    constraintRules: constraintRules.map((row): WeeklyConstraintRule => ({
      businessUnit: row.business_unit,
      sku: row.sku,
      constraintType: row.constraint_type as WeeklyConstraintRule["constraintType"],
    })),
    bundleRules: bundleRules.map((row): WeeklyBundleRule => ({
      sku: row.sku, bundleQty: toNumber(row.bundle_qty),
    })),
    diohRows: diohRows.map((row): WeeklyDiohRow => ({
      channelCode: row.dealer_channel_code, sku: row.sku, abcClass: row.abc_class,
    })),
    amountRows,
  };
}
