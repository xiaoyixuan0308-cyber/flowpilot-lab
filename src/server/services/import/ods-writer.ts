import type { Prisma } from "@prisma/client";
import { type ImportSheetTable } from "@/server/constants/import-sheet-map";
import {
  mapBuPatternAmountWeeklyRows,
  mapCalendarPatternWeeklyRows,
  mapBscUpnIntransitRows,
  mapBscUpnInventoryRows,
  mapDealerUpnDnRows,
  mapDealerUpnOpenOrderRows,
  mapDiohTargetRows,
  mapFcstLpPl5Rows,
  mapFcstT2Pl5Rows,
  mapInventoryRows,
  mapLpUpnPurchasePriceRows,
  mapT2PurchaseRows,
  mapUpnConstraintRows,
  mapUpnBundleRows,
  mapUpnSafetyStockRows,
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
      await tx.ods_inventory_dealer_upn.deleteMany();
      await tx.ods_inventory_dealer_upn.createMany({ data });
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
      await tx.ods_dioh_dealer_upn.deleteMany();
      await tx.ods_dioh_dealer_upn.createMany({ data });
      return;
    }
    case "fcstLpPl5": {
      const data = mapFcstLpPl5Rows(dataRows);
      await tx.ods_fcst_lp_pl5_monthly.deleteMany();
      await tx.ods_fcst_lp_pl5_monthly.createMany({ data });
      return;
    }
    case "fcstT2Pl5": {
      const data = mapFcstT2Pl5Rows(dataRows);
      await tx.ods_fcst_t2_pl5_monthly.deleteMany();
      await tx.ods_fcst_t2_pl5_monthly.createMany({ data });
      return;
    }
    case "dealerUpnDn": {
      const data = mapDealerUpnDnRows(dataRows);
      await tx.ods_dealer_upn_dn.deleteMany();
      if (data.length > 0) await tx.ods_dealer_upn_dn.createMany({ data });
      return;
    }
    case "dealerUpnOpenOrder": {
      const data = mapDealerUpnOpenOrderRows(dataRows);
      await tx.ods_dealer_upn_open_order.deleteMany();
      if (data.length > 0) await tx.ods_dealer_upn_open_order.createMany({ data });
      return;
    }
    case "bscUpnInventory": {
      const data = mapBscUpnInventoryRows(dataRows);
      await tx.ods_bsc_upn_inventory.deleteMany();
      await tx.ods_bsc_upn_inventory.createMany({ data });
      return;
    }
    case "bscUpnIntransit": {
      const data = mapBscUpnIntransitRows(dataRows);
      await tx.ods_bsc_upn_intransit.deleteMany();
      if (data.length > 0) await tx.ods_bsc_upn_intransit.createMany({ data });
      return;
    }
    case "upnSafetyStock": {
      const data = mapUpnSafetyStockRows(dataRows);
      await tx.ods_upn_safety_stock_manual.deleteMany();
      if (data.length > 0) await tx.ods_upn_safety_stock_manual.createMany({ data });
      return;
    }
    case "lpUpnPurchasePrice": {
      const rate = workbookUsdToCnyRate ?? (await getCurrentUsdToCnyRate(tx)).rate;
      const data = mapLpUpnPurchasePriceRows(dataRows, rate);
      await tx.ods_lp_upn_purchase_price.deleteMany();
      await tx.ods_lp_upn_purchase_price.createMany({ data });
      return;
    }
    case "upnConstraint": {
      const data = mapUpnConstraintRows(dataRows);
      await tx.ods_upn_constraint_manual.deleteMany();
      if (data.length > 0) await tx.ods_upn_constraint_manual.createMany({ data });
      return;
    }
    case "upnBundle": {
      const data = mapUpnBundleRows(dataRows);
      await tx.ods_upn_bundle_manual.deleteMany();
      if (data.length > 0) await tx.ods_upn_bundle_manual.createMany({ data });
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
