import { prisma } from "../src/lib/prisma";

const models = [
  "ods_dioh_dealer_sku", "ods_sku_constraint_manual", "ods_sku_bundle_manual",
  "ods_weekly_amount_threshold_manual", "ods_fcst_channel_category_monthly",
  "ods_fcst_t2_category_monthly", "ods_inventory_dealer_sku",
  "ods_channel_category_allocate_monthly", "ods_t2_purchase_monthly", "ods_sku_active_list",
  "ods_dealer_sku_dn", "ods_dealer_sku_open_order", "ods_central_warehouse_sku_inventory",
  "ods_central_warehouse_sku_intransit", "ods_channel_sku_purchase_price",
  "ods_sku_safety_stock_manual", "ods_calendar_pattern_weekly",
  "ods_bu_pattern_amount_weekly", "app_exchange_rate", "bridge_channel_category_scope_monthly",
  "bridge_category_sku_scope_monthly", "list_channel_category_status_monthly",
  "list_channel_category_sku_status_monthly", "calc_batch", "calc_runtime_setting",
  "calc_weekly_sku_split_batch", "calc_weekly_sku_split_bu_summary",
  "calc_weekly_sku_split_result", "calc_sku_split_result", "calc_sku_split_trace",
  "sku_split_error_catalog",
] as const;

async function main() {
  for (const model of models) {
    try {
      const count = await (prisma[model] as { count(): Promise<number> }).count();
      console.log(`${model}\t${count}`);
    } catch {
      console.log(`${model}\tERROR`);
    }
  }
  await prisma.$disconnect();
}

void main();
