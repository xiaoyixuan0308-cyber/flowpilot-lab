import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImportSheetTable } from "@/server/constants/import-sheet-map";

async function clearImportTableRowsWithClient(tx: Prisma.TransactionClient, table: ImportSheetTable) {
  switch (table) {
    case "inventory":
      return tx.ods_inventory_dealer_upn.deleteMany();
    case "t2Purchase":
      return tx.ods_t2_purchase_monthly.deleteMany();
    case "diohTarget":
      return tx.ods_dioh_dealer_upn.deleteMany();
    case "fcstLpPl5":
      return tx.ods_fcst_lp_pl5_monthly.deleteMany();
    case "fcstT2Pl5":
      return tx.ods_fcst_t2_pl5_monthly.deleteMany();
    case "dealerUpnDn":
      return tx.ods_dealer_upn_dn.deleteMany();
    case "dealerUpnOpenOrder":
      return tx.ods_dealer_upn_open_order.deleteMany();
    case "bscUpnInventory":
      return tx.ods_bsc_upn_inventory.deleteMany();
    case "bscUpnIntransit":
      return tx.ods_bsc_upn_intransit.deleteMany();
    case "upnSafetyStock":
      return tx.ods_upn_safety_stock_manual.deleteMany();
    case "lpUpnPurchasePrice":
      return tx.ods_lp_upn_purchase_price.deleteMany();
    case "upnConstraint":
      return tx.ods_upn_constraint_manual.deleteMany();
    case "upnBundle":
      return tx.ods_upn_bundle_manual.deleteMany();
    case "weeklyAmountThreshold":
      return tx.ods_weekly_amount_threshold_manual.deleteMany();
    case "calendarPatternWeekly":
      return tx.ods_calendar_pattern_weekly.deleteMany();
    case "buPatternAmountWeekly":
      return tx.ods_bu_pattern_amount_weekly.deleteMany();
  }
}

export async function clearImportTableRows(table: ImportSheetTable) {
  const result = await prisma.$transaction((tx) => clearImportTableRowsWithClient(tx, table));
  return { deletedRows: result.count };
}
