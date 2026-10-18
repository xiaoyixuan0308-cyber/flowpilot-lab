import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import {
  IMPORT_SHEET_DEFINITIONS,
  type ImportSheetDefinition,
  type ImportSheetTable,
} from "@/server/constants/import-sheet-map";
import { normalizeRowValue } from "./export-filter";

type PackageRow = Record<string, unknown>;

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1F4E78" },
  };
}

function getImportFields(definition: ImportSheetDefinition) {
  return definition.helpFields.split(",").map((field) => field.trim());
}

function normalizeRows(rows: PackageRow[], fields: string[]) {
  return rows.map((row) => {
    const values: PackageRow = {};
    for (const field of fields) {
      values[field] = normalizeRowValue(row[field]);
    }
    return values;
  });
}

async function loadPackageRows(table: ImportSheetTable): Promise<PackageRow[]> {
  switch (table) {
    case "inventory":
      return prisma.ods_inventory_dealer_sku.findMany({
        select: { dealer_channel_code: true, dealer_channel_name: true, sku: true, qty: true, year: true, month: true },
        orderBy: [{ year: "desc" }, { month: "desc" }, { dealer_channel_code: "asc" }, { sku: "asc" }],
      });

    case "t2Purchase":
      return prisma.ods_t2_purchase_monthly.findMany({
        select: {
          parent_dealer_channel_code: true,
          parent_dealer_channel_name: true,
          business_unit: true,
          sku: true,
          category_code: true,
          category_name: true,
          qty: true,
          year: true,
          month: true,
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
          { parent_dealer_channel_code: "asc" },
          { business_unit: "asc" },
          { category_code: "asc" },
          { sku: "asc" },
        ],
      });

    case "diohTarget":
      return prisma.ods_dioh_dealer_sku.findMany({
        select: { dealer_channel_code: true, dealer_channel_name: true, sku: true, abc_class: true, dioh_days: true },
        orderBy: [{ dealer_channel_code: "asc" }, { sku: "asc" }],
      });

    case "fcstChannelCategory":
      return prisma.ods_fcst_channel_category_monthly.findMany({
        select: {
          dealer_channel_code: true,
          dealer_channel_name: true,
          business_unit: true,
          category_code: true,
          category_name: true,
          fcst_qty: true,
          year: true,
          month: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { dealer_channel_code: "asc" }, { business_unit: "asc" }, { category_code: "asc" }],
      });

    case "fcstT2Category":
      return prisma.ods_fcst_t2_category_monthly.findMany({
        select: {
          parent_dealer_channel_code: true,
          parent_dealer_channel_name: true,
          business_unit: true,
          category_code: true,
          category_name: true,
          fcst_qty: true,
          year: true,
          month: true,
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
          { parent_dealer_channel_code: "asc" },
          { business_unit: "asc" },
          { category_code: "asc" },
        ],
      });

    case "dealerSkuDn":
      return prisma.ods_dealer_sku_dn.findMany({
        select: { created_on: true, sold_to_pt: true, business_unit: true, dealer_type: true, material: true, delivery_qty: true },
        orderBy: [{ created_on: "desc" }, { business_unit: "asc" }, { sold_to_pt: "asc" }, { material: "asc" }],
      });

    case "dealerSkuOpenOrder":
      return prisma.ods_dealer_sku_open_order.findMany({
        select: { customer: true, business_unit: true, dealer_type: true, material: true, dctp: true, open_qty: true },
        orderBy: [{ business_unit: "asc" }, { customer: "asc" }, { material: "asc" }, { dctp: "asc" }],
      });

    case "centralWarehouseSkuInventory":
      return prisma.ods_central_warehouse_sku_inventory.findMany({
        select: { material: true, sloc: true, unrestricted_qty: true },
        orderBy: [{ material: "asc" }, { sloc: "asc" }],
      });

    case "centralWarehouseSkuIntransit":
      return prisma.ods_central_warehouse_sku_intransit.findMany({
        select: { material: true, forecast_date: true, intransit_qty: true },
        orderBy: [{ forecast_date: "desc" }, { material: "asc" }],
      });

    case "skuSafetyStock":
      return prisma.ods_sku_safety_stock_manual.findMany({
        select: { sku: true, safety_stock_qty: true },
        orderBy: [{ sku: "asc" }],
      });

    case "channelSkuPurchasePrice": {
      const rows = await prisma.ods_channel_sku_purchase_price.findMany({
        select: {
          dealer_code: true,
          dealer_type: true,
          sku: true,
          central_warehouse_std_sell_price: true,
          central_warehouse_std_sell_price_vat: true,
          source_sell_price: true,
          source_sell_price_vat: true,
          source_currency: true,
        },
        orderBy: [{ dealer_code: "asc" }, { dealer_type: "asc" }, { sku: "asc" }],
      });
      return rows.map((row) => ({
        dealer_code: row.dealer_code,
        dealer_type: row.dealer_type,
        sku: row.sku,
        central_warehouse_std_sell_price: row.source_sell_price ?? row.central_warehouse_std_sell_price,
        central_warehouse_std_sell_price_vat: row.source_sell_price_vat ?? row.central_warehouse_std_sell_price_vat,
        currency_code: row.source_currency,
      }));
    }

    case "skuConstraint":
      return prisma.ods_sku_constraint_manual.findMany({
        select: { period_month: true, business_unit: true, sku: true, constraint_type: true, source_system: true },
        orderBy: [{ period_month: "desc" }, { business_unit: "asc" }, { sku: "asc" }, { constraint_type: "asc" }],
      });

    case "skuBundle":
      return prisma.ods_sku_bundle_manual.findMany({
        select: { sku: true, bundle_qty: true, source_system: true },
        orderBy: [{ sku: "asc" }],
      });

    case "weeklyAmountThreshold":
      return prisma.ods_weekly_amount_threshold_manual.findMany({
        select: { business_unit: true, overage_threshold_pct: true, shortfall_threshold_pct: true },
        orderBy: [{ business_unit: "asc" }],
      });

    case "calendarPatternWeekly":
      return prisma.ods_calendar_pattern_weekly.findMany({
        select: {
          business_unit: true,
          period_month: true,
          month_start_date: true,
          week_start_date: true,
          week_end_date: true,
          prev_week_pattern_pct: true,
          current_week_pattern_pct: true,
        },
        orderBy: [{ period_month: "desc" }, { week_start_date: "asc" }, { business_unit: "asc" }],
      });

    case "buPatternAmountWeekly": {
      const rows = await prisma.ods_bu_pattern_amount_weekly.findMany({
        select: {
          period_week: true,
          period_month: true,
          business_unit: true,
            actual_amount: true,
            month_target_amount: true,
            month_limit_amount: true,
            source_actual_amount: true,
            source_month_target_amount: true,
            source_month_limit_amount: true,
          source_currency: true,
        },
        orderBy: [{ period_week: "desc" }, { business_unit: "asc" }],
      });
      return rows.map((row) => ({
        period_week: row.period_week,
        period_month: row.period_month,
        business_unit: row.business_unit,
          actual_amount: row.source_actual_amount ?? row.actual_amount,
          month_target_amount: row.source_month_target_amount ?? row.month_target_amount,
          month_limit_amount: row.source_month_limit_amount ?? row.month_limit_amount,
          currency_code: row.source_currency,
      }));
    }
  }
}

export async function exportUnifiedPackageToExcel() {
  const definitions = IMPORT_SHEET_DEFINITIONS.filter((item) => item.includeInUnifiedPackage !== false);
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "APP";
  workbook.created = new Date();
  workbook.modified = new Date();

  for (const definition of definitions) {
    const fields = getImportFields(definition);
    const headers = definition.templateHeaders ?? fields;
    const worksheet = workbook.addWorksheet(definition.templateSheetName ?? definition.label);
    worksheet.columns = fields.map((field, index) => ({
      header: headers[index] ?? field,
      key: field,
      width: Math.max(16, (headers[index] ?? field).length + 4),
    }));
    worksheet.views = [{ state: "frozen", ySplit: 1 }];
    styleHeader(worksheet.getRow(1));

    for (const row of normalizeRows(await loadPackageRows(definition.table), fields)) {
      worksheet.addRow(row);
    }
  }

  return {
    buffer: await workbook.xlsx.writeBuffer(),
    fileName: `APP-统一整包基础数据-${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
}
