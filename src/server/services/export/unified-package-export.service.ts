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
      return prisma.ods_inventory_dealer_upn.findMany({
        select: { dealerlpcode: true, dealerlpname: true, upn: true, qty: true, year: true, month: true },
        orderBy: [{ year: "desc" }, { month: "desc" }, { dealerlpcode: "asc" }, { upn: "asc" }],
      });

    case "t2Purchase":
      return prisma.ods_t2_purchase_monthly.findMany({
        select: {
          parentdealerlpcode: true,
          parentdealerlpname: true,
          sc_bu: true,
          upn: true,
          pl5_code: true,
          pl5_name: true,
          qty: true,
          year: true,
          month: true,
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
          { parentdealerlpcode: "asc" },
          { sc_bu: "asc" },
          { pl5_code: "asc" },
          { upn: "asc" },
        ],
      });

    case "diohTarget":
      return prisma.ods_dioh_dealer_upn.findMany({
        select: { dealerlpcode: true, dealerlpname: true, upn: true, abc_class: true, dioh_days: true },
        orderBy: [{ dealerlpcode: "asc" }, { upn: "asc" }],
      });

    case "fcstLpPl5":
      return prisma.ods_fcst_lp_pl5_monthly.findMany({
        select: {
          dealerlpcode: true,
          dealerlpname: true,
          sc_bu: true,
          pl5_code: true,
          pl5_name: true,
          fcst_qty: true,
          year: true,
          month: true,
        },
        orderBy: [{ year: "desc" }, { month: "desc" }, { dealerlpcode: "asc" }, { sc_bu: "asc" }, { pl5_code: "asc" }],
      });

    case "fcstT2Pl5":
      return prisma.ods_fcst_t2_pl5_monthly.findMany({
        select: {
          parentdealerlpcode: true,
          parentdealerlpname: true,
          sc_bu: true,
          pl5_code: true,
          pl5_name: true,
          fcst_qty: true,
          year: true,
          month: true,
        },
        orderBy: [
          { year: "desc" },
          { month: "desc" },
          { parentdealerlpcode: "asc" },
          { sc_bu: "asc" },
          { pl5_code: "asc" },
        ],
      });

    case "dealerUpnDn":
      return prisma.ods_dealer_upn_dn.findMany({
        select: { created_on: true, sold_to_pt: true, sc_bu: true, dealer_type: true, material: true, delivery_qty: true },
        orderBy: [{ created_on: "desc" }, { sc_bu: "asc" }, { sold_to_pt: "asc" }, { material: "asc" }],
      });

    case "dealerUpnOpenOrder":
      return prisma.ods_dealer_upn_open_order.findMany({
        select: { customer: true, sc_bu: true, dealer_type: true, material: true, dctp: true, open_qty: true },
        orderBy: [{ sc_bu: "asc" }, { customer: "asc" }, { material: "asc" }, { dctp: "asc" }],
      });

    case "bscUpnInventory":
      return prisma.ods_bsc_upn_inventory.findMany({
        select: { material: true, sloc: true, unrestricted_qty: true },
        orderBy: [{ material: "asc" }, { sloc: "asc" }],
      });

    case "bscUpnIntransit":
      return prisma.ods_bsc_upn_intransit.findMany({
        select: { material: true, forecast_date: true, intransit_qty: true },
        orderBy: [{ forecast_date: "desc" }, { material: "asc" }],
      });

    case "upnSafetyStock":
      return prisma.ods_upn_safety_stock_manual.findMany({
        select: { upn: true, safety_stock_qty: true },
        orderBy: [{ upn: "asc" }],
      });

    case "lpUpnPurchasePrice": {
      const rows = await prisma.ods_lp_upn_purchase_price.findMany({
        select: {
          dealer_code: true,
          dealer_type: true,
          upn: true,
          bsc_std_sell_price: true,
          bsc_std_sell_price_vat: true,
          source_sell_price: true,
          source_sell_price_vat: true,
          source_currency: true,
        },
        orderBy: [{ dealer_code: "asc" }, { dealer_type: "asc" }, { upn: "asc" }],
      });
      return rows.map((row) => ({
        dealer_code: row.dealer_code,
        dealer_type: row.dealer_type,
        upn: row.upn,
        bsc_std_sell_price: row.source_sell_price ?? row.bsc_std_sell_price,
        bsc_std_sell_price_vat: row.source_sell_price_vat ?? row.bsc_std_sell_price_vat,
        currency_code: row.source_currency,
      }));
    }

    case "upnConstraint":
      return prisma.ods_upn_constraint_manual.findMany({
        select: { period_month: true, sc_bu: true, upn: true, constraint_type: true, source_system: true },
        orderBy: [{ period_month: "desc" }, { sc_bu: "asc" }, { upn: "asc" }, { constraint_type: "asc" }],
      });

    case "upnBundle":
      return prisma.ods_upn_bundle_manual.findMany({
        select: { upn: true, bundle_qty: true, source_system: true },
        orderBy: [{ upn: "asc" }],
      });

    case "weeklyAmountThreshold":
      return prisma.ods_weekly_amount_threshold_manual.findMany({
        select: { sc_bu: true, overage_threshold_pct: true, shortfall_threshold_pct: true },
        orderBy: [{ sc_bu: "asc" }],
      });

    case "calendarPatternWeekly":
      return prisma.ods_calendar_pattern_weekly.findMany({
        select: {
          sc_bu: true,
          period_month: true,
          month_start_date: true,
          week_start_date: true,
          week_end_date: true,
          prev_week_pattern_pct: true,
          current_week_pattern_pct: true,
        },
        orderBy: [{ period_month: "desc" }, { week_start_date: "asc" }, { sc_bu: "asc" }],
      });

    case "buPatternAmountWeekly": {
      const rows = await prisma.ods_bu_pattern_amount_weekly.findMany({
        select: {
          period_week: true,
          period_month: true,
          sc_bu: true,
            actual_amount: true,
            month_target_amount: true,
            month_limit_amount: true,
            source_actual_amount: true,
            source_month_target_amount: true,
            source_month_limit_amount: true,
          source_currency: true,
        },
        orderBy: [{ period_week: "desc" }, { sc_bu: "asc" }],
      });
      return rows.map((row) => ({
        period_week: row.period_week,
        period_month: row.period_month,
        sc_bu: row.sc_bu,
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
  workbook.creator = "DSC";
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
    fileName: `DSC-统一整包基础数据-${new Date().toISOString().slice(0, 10)}.xlsx`,
  };
}
