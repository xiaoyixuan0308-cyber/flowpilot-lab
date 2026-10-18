import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ImportSheetTable } from "@/server/constants/import-sheet-map";

async function clearImportTableRowsWithClient(tx: Prisma.TransactionClient, table: ImportSheetTable) {
  switch (table) {
    case "inventory":
      return tx.ods_inventory_dealer_sku.deleteMany();
    case "t2Purchase":
      return tx.ods_t2_purchase_monthly.deleteMany();
    case "diohTarget":
      return tx.ods_dioh_dealer_sku.deleteMany();
    case "fcstChannelCategory":
      return tx.ods_fcst_channel_category_monthly.deleteMany();
    case "fcstT2Category":
      return tx.ods_fcst_t2_category_monthly.deleteMany();
    case "dealerSkuDn":
      return tx.ods_dealer_sku_dn.deleteMany();
    case "dealerSkuOpenOrder":
      return tx.ods_dealer_sku_open_order.deleteMany();
    case "centralWarehouseSkuInventory":
      return tx.ods_central_warehouse_sku_inventory.deleteMany();
    case "centralWarehouseSkuIntransit":
      return tx.ods_central_warehouse_sku_intransit.deleteMany();
    case "skuSafetyStock":
      return tx.ods_sku_safety_stock_manual.deleteMany();
    case "channelSkuPurchasePrice":
      return tx.ods_channel_sku_purchase_price.deleteMany();
    case "skuConstraint":
      return tx.ods_sku_constraint_manual.deleteMany();
    case "skuBundle":
      return tx.ods_sku_bundle_manual.deleteMany();
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
