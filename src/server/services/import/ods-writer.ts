import type { Prisma } from "@prisma/client";
import { type ImportSheetTable } from "@/server/constants/import-sheet-map";
import {
  mapBuPatternAmountWeeklyRows,
  mapCalendarPatternWeeklyRows,
  mapCentralWarehouseSkuIntransitRows,
  mapCentralWarehouseSkuInventoryRows,
  mapDealerSkuDnRows,
  mapDealerSkuOpenOrderRows,
  mapDiohTargetRows,
  mapFcstChannelCategoryRows,
  mapFcstT2CategoryRows,
  mapInventoryRows,
  mapChannelSkuPurchasePriceRows,
  mapT2PurchaseRows,
  mapSkuConstraintRows,
  mapSkuBundleRows,
  mapSkuSafetyStockRows,
  mapWeeklyAmountThresholdRows,
} from "./import-row-mappers";
import { getCurrentUsdToCnyRate } from "@/server/services/currency/exchange-rate.service";

export async function writeImportRows(
  tx: Prisma.TransactionClient,
  table: ImportSheetTable,
  dataRows: Record<string, string>[],
  workbookUsdToCnyRate?: number,
) {
  switch (table) {
    case "inventory": {
      const data = mapInventoryRows(dataRows);
      await tx.ods_inventory_dealer_sku.deleteMany();
      await tx.ods_inventory_dealer_sku.createMany({ data });
      return;
    }
    case "t2Purchase": {
      const data = mapT2PurchaseRows(dataRows);
      await tx.ods_t2_purchase_monthly.deleteMany();
      await tx.ods_t2_purchase_monthly.createMany({ data });
      return;
    }
    case "diohTarget": {
      const data = mapDiohTargetRows(dataRows);
      await tx.ods_dioh_dealer_sku.deleteMany();
      await tx.ods_dioh_dealer_sku.createMany({ data });
      return;
    }
    case "fcstChannelCategory": {
      const data = mapFcstChannelCategoryRows(dataRows);
      await tx.ods_fcst_channel_category_monthly.deleteMany();
      await tx.ods_fcst_channel_category_monthly.createMany({ data });
      return;
    }
    case "fcstT2Category": {
      const data = mapFcstT2CategoryRows(dataRows);
      await tx.ods_fcst_t2_category_monthly.deleteMany();
      await tx.ods_fcst_t2_category_monthly.createMany({ data });
      return;
    }
    case "dealerSkuDn": {
      const data = mapDealerSkuDnRows(dataRows);
      await tx.ods_dealer_sku_dn.deleteMany();
      if (data.length > 0) await tx.ods_dealer_sku_dn.createMany({ data });
      return;
    }
    case "dealerSkuOpenOrder": {
      const data = mapDealerSkuOpenOrderRows(dataRows);
      await tx.ods_dealer_sku_open_order.deleteMany();
      if (data.length > 0) await tx.ods_dealer_sku_open_order.createMany({ data });
      return;
    }
    case "centralWarehouseSkuInventory": {
      const data = mapCentralWarehouseSkuInventoryRows(dataRows);
      await tx.ods_central_warehouse_sku_inventory.deleteMany();
      await tx.ods_central_warehouse_sku_inventory.createMany({ data });
      return;
    }
    case "centralWarehouseSkuIntransit": {
      const data = mapCentralWarehouseSkuIntransitRows(dataRows);
      await tx.ods_central_warehouse_sku_intransit.deleteMany();
      if (data.length > 0) await tx.ods_central_warehouse_sku_intransit.createMany({ data });
      return;
    }
    case "skuSafetyStock": {
      const data = mapSkuSafetyStockRows(dataRows);
      await tx.ods_sku_safety_stock_manual.deleteMany();
      if (data.length > 0) await tx.ods_sku_safety_stock_manual.createMany({ data });
      return;
    }
    case "channelSkuPurchasePrice": {
      const rate = workbookUsdToCnyRate ?? (await getCurrentUsdToCnyRate(tx)).rate;
      const data = mapChannelSkuPurchasePriceRows(dataRows, rate);
      await tx.ods_channel_sku_purchase_price.deleteMany();
      await tx.ods_channel_sku_purchase_price.createMany({ data });
      return;
    }
    case "skuConstraint": {
      const data = mapSkuConstraintRows(dataRows);
      await tx.ods_sku_constraint_manual.deleteMany();
      if (data.length > 0) await tx.ods_sku_constraint_manual.createMany({ data });
      return;
    }
    case "skuBundle": {
      const data = mapSkuBundleRows(dataRows);
      await tx.ods_sku_bundle_manual.deleteMany();
      if (data.length > 0) await tx.ods_sku_bundle_manual.createMany({ data });
      return;
    }
    case "weeklyAmountThreshold": {
      const data = mapWeeklyAmountThresholdRows(dataRows);
      await tx.ods_weekly_amount_threshold_manual.deleteMany();
      if (data.length > 0) await tx.ods_weekly_amount_threshold_manual.createMany({ data });
      return;
    }
    case "calendarPatternWeekly": {
      const data = mapCalendarPatternWeeklyRows(dataRows);
      await tx.ods_calendar_pattern_weekly.deleteMany();
      await tx.ods_calendar_pattern_weekly.createMany({ data });
      return;
    }
    case "buPatternAmountWeekly": {
      const rate = workbookUsdToCnyRate ?? (await getCurrentUsdToCnyRate(tx)).rate;
      const data = mapBuPatternAmountWeeklyRows(dataRows, rate);
      await tx.ods_bu_pattern_amount_weekly.deleteMany();
      await tx.ods_bu_pattern_amount_weekly.createMany({ data });
      return;
    }
  }
}
