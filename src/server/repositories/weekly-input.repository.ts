import { prisma } from "@/lib/prisma";
import { getDbEnvConfig } from "@/server/constants/db-env";

const WEEKLY_INPUT_TABLE_SCHEMA = getDbEnvConfig().schema;
const weeklyTableExistenceCache = new Map<string, boolean>();

function quoteIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function weeklyTableRef(tableName: string) {
  return `${quoteIdentifier(WEEKLY_INPUT_TABLE_SCHEMA)}.${quoteIdentifier(tableName)}`;
}

export interface DealerSkuDnRow {
  id: string;
  created_on: string | null;
  sold_to_pt: string | null;
  business_unit: string;
  dealer_type: string;
  material: string | null;
  delivery_qty: string;
}

export interface DealerSkuOpenOrderRow {
  id: string;
  customer: string | null;
  business_unit: string;
  dealer_type: string | null;
  material: string | null;
  dctp: string | null;
  open_qty: string;
}

export interface CentralWarehouseSkuInventoryRow {
  id: string;
  material: string;
  sloc: string | null;
  unrestricted_qty: string;
}

export interface CentralWarehouseSkuIntransitRow {
  id: string;
  material: string;
  forecast_date: string | null;
  intransit_qty: string;
}

export interface SkuSafetyStockRow {
  id: string;
  sku: string;
  safety_stock_qty: string;
}

export interface SkuConstraintRow {
  id: string;
  period_month: string;
  business_unit: string;
  sku: string;
  constraint_type: string;
  source_system: string;
}

export interface SkuBundleRow {
  id: string;
  sku: string;
  bundle_qty: string;
  source_system: string;
}

export interface ChannelSkuPurchasePriceRow {
  id: string;
  dealer_code: string;
  dealer_type: string;
  sku: string;
  central_warehouse_std_sell_price: string | null;
  central_warehouse_std_sell_price_vat: string | null;
  source_sell_price: string | null;
  source_sell_price_vat: string | null;
  source_currency: string;
  usd_to_cny_rate: string;
}

export interface CalendarPatternWeeklyRow {
  business_unit: string;
  period_month: string;
  month_start_date: string;
  week_start_date: string;
  week_end_date: string;
  prev_week_pattern_pct: string | null;
  current_week_pattern_pct: string | null;
}

export interface WeeklyAmountThresholdRow {
  id: string;
  business_unit: string;
  overage_threshold_pct: string;
  shortfall_threshold_pct: string;
  source_system: string;
}

export interface BuPatternAmountWeeklyRow {
  id: string;
  period_week: string;
  period_month: string;
  business_unit: string;
  actual_amount: string | null;
  month_target_amount: string;
  month_limit_amount: string;
  source_actual_amount: string | null;
  source_month_target_amount: string;
  source_month_limit_amount: string;
  source_currency: string;
  usd_to_cny_rate: string;
}

async function ensureWeeklyTableExists(tableName: string) {
  if (weeklyTableExistenceCache.has(tableName)) {
    return weeklyTableExistenceCache.get(tableName)!;
  }

  const rows = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(
    `
      select exists (
        select 1
        from information_schema.tables
        where table_schema = $1
          and table_name = $2
      ) as "exists"
    `,
    WEEKLY_INPUT_TABLE_SCHEMA,
    tableName
  );

  const exists = rows[0]?.exists ?? false;
  weeklyTableExistenceCache.set(tableName, exists);
  return exists;
}

async function queryWeeklyInputRows<T>(tableName: string, query: string) {
  if (!(await ensureWeeklyTableExists(tableName))) {
    return [];
  }

  return prisma.$queryRawUnsafe<T[]>(query);
}

export async function listLoadedDealerSkuDnRows() {
  return queryWeeklyInputRows<DealerSkuDnRow>("ods_dealer_sku_dn", `
    select
      id::text as id,
      to_char(created_on, 'YYYY-MM-DD') as created_on,
      sold_to_pt,
      business_unit,
      dealer_type,
      material,
      delivery_qty::text as delivery_qty
    from ${weeklyTableRef("ods_dealer_sku_dn")}
    order by created_on desc nulls last, insert_dt desc nulls last
    limit 10000
  `);
}

export async function listLoadedDealerSkuOpenOrderRows() {
  return queryWeeklyInputRows<DealerSkuOpenOrderRow>("ods_dealer_sku_open_order", `
    select
      id::text as id,
      customer,
      business_unit,
      dealer_type,
      material,
      dctp,
      open_qty::text as open_qty
    from ${weeklyTableRef("ods_dealer_sku_open_order")}
    order by insert_dt desc nulls last, customer asc nulls last, material asc nulls last
    limit 10000
  `);
}

export async function listLoadedCentralWarehouseSkuInventoryRows() {
  return queryWeeklyInputRows<CentralWarehouseSkuInventoryRow>("ods_central_warehouse_sku_inventory", `
    select
      id::text as id,
      material,
      sloc,
      unrestricted_qty::text as unrestricted_qty
    from ${weeklyTableRef("ods_central_warehouse_sku_inventory")}
    order by insert_dt desc nulls last, material asc, sloc asc nulls last
    limit 10000
  `);
}

export async function listLoadedCentralWarehouseSkuIntransitRows() {
  return queryWeeklyInputRows<CentralWarehouseSkuIntransitRow>("ods_central_warehouse_sku_intransit", `
    select
      id::text as id,
      material,
      to_char(forecast_date, 'YYYY-MM-DD') as forecast_date,
      intransit_qty::text as intransit_qty
    from ${weeklyTableRef("ods_central_warehouse_sku_intransit")}
    order by forecast_date desc nulls last, insert_dt desc nulls last, material asc
    limit 10000
  `);
}

export async function listLoadedSkuSafetyStockRows() {
  return queryWeeklyInputRows<SkuSafetyStockRow>("ods_sku_safety_stock_manual", `
    select
      id::text as id,
      sku,
      safety_stock_qty::text as safety_stock_qty
    from ${weeklyTableRef("ods_sku_safety_stock_manual")}
    order by insert_dt desc nulls last, sku asc
    limit 10000
  `);
}

export async function listLoadedSkuConstraintRows() {
  return queryWeeklyInputRows<SkuConstraintRow>("ods_sku_constraint_manual", `
    select
      id::text as id,
      to_char(period_month, 'YYYY-MM-DD') as period_month,
      business_unit,
      sku,
      constraint_type,
      source_system
    from ${weeklyTableRef("ods_sku_constraint_manual")}
    order by period_month desc, business_unit asc, sku asc, constraint_type asc
    limit 10000
  `);
}

export async function listLoadedSkuBundleRows() {
  return queryWeeklyInputRows<SkuBundleRow>("ods_sku_bundle_manual", `
    select
      id::text as id,
      sku,
      bundle_qty::text as bundle_qty,
      source_system
    from ${weeklyTableRef("ods_sku_bundle_manual")}
    order by sku asc
    limit 10000
  `);
}

export async function listLoadedChannelSkuPurchasePriceRows() {
  return queryWeeklyInputRows<ChannelSkuPurchasePriceRow>("ods_channel_sku_purchase_price", `
    select
      id::text as id,
      dealer_code,
      dealer_type,
      sku,
      central_warehouse_std_sell_price::text as central_warehouse_std_sell_price,
      central_warehouse_std_sell_price_vat::text as central_warehouse_std_sell_price_vat,
      source_sell_price::text as source_sell_price,
      source_sell_price_vat::text as source_sell_price_vat,
      source_currency,
      usd_to_cny_rate::text as usd_to_cny_rate
    from ${weeklyTableRef("ods_channel_sku_purchase_price")}
    order by insert_dt desc nulls last, dealer_code asc, dealer_type asc, sku asc
    limit 10000
  `);
}

export async function listLoadedCalendarPatternWeeklyRows() {
  return queryWeeklyInputRows<CalendarPatternWeeklyRow>("ods_calendar_pattern_weekly", `
    select
      business_unit,
      to_char(period_month, 'YYYY-MM-DD') as period_month,
      to_char(month_start_date, 'YYYY-MM-DD') as month_start_date,
      to_char(week_start_date, 'YYYY-MM-DD') as week_start_date,
      to_char(week_end_date, 'YYYY-MM-DD') as week_end_date,
      prev_week_pattern_pct::text as prev_week_pattern_pct,
      current_week_pattern_pct::text as current_week_pattern_pct
    from ${weeklyTableRef("ods_calendar_pattern_weekly")}
    order by week_start_date desc, business_unit asc
    limit 10000
  `);
}

export async function listLoadedWeeklyAmountThresholdRows() {
  return queryWeeklyInputRows<WeeklyAmountThresholdRow>("ods_weekly_amount_threshold_manual", `
    select
      id::text as id,
      business_unit,
      overage_threshold_pct::text as overage_threshold_pct,
      shortfall_threshold_pct::text as shortfall_threshold_pct,
      source_system
    from ${weeklyTableRef("ods_weekly_amount_threshold_manual")}
    order by business_unit asc
    limit 10000
  `);
}

export async function listLoadedBuPatternAmountWeeklyRows() {
  return queryWeeklyInputRows<BuPatternAmountWeeklyRow>("ods_bu_pattern_amount_weekly", `
    select
      id::text as id,
      to_char(period_week, 'YYYY-MM-DD') as period_week,
      to_char(period_month, 'YYYY-MM-DD') as period_month,
      business_unit,
      actual_amount::text as actual_amount,
      month_target_amount::text as month_target_amount,
      month_limit_amount::text as month_limit_amount,
      source_actual_amount::text as source_actual_amount,
      source_month_target_amount::text as source_month_target_amount,
      source_month_limit_amount::text as source_month_limit_amount,
      source_currency,
      usd_to_cny_rate::text as usd_to_cny_rate
    from ${weeklyTableRef("ods_bu_pattern_amount_weekly")}
    order by period_week desc, business_unit asc
    limit 10000
  `);
}
