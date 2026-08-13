import { prisma } from "../src/lib/prisma";

const models = [
  "ods_dioh_dealer_upn", "ods_upn_constraint_manual", "ods_upn_bundle_manual",
  "ods_weekly_amount_threshold_manual", "ods_fcst_lp_pl5_monthly",
  "ods_fcst_t2_pl5_monthly", "ods_inventory_dealer_upn",
  "ods_lp_pl5_allocate_monthly", "ods_t2_purchase_monthly", "ods_upn_active_list",
  "ods_dealer_upn_dn", "ods_dealer_upn_open_order", "ods_bsc_upn_inventory",
  "ods_bsc_upn_intransit", "ods_lp_upn_purchase_price",
  "ods_upn_safety_stock_manual", "ods_calendar_pattern_weekly",
  "ods_bu_pattern_amount_weekly", "app_exchange_rate", "bridge_lp_pl5_scope_monthly",
  "bridge_pl5_upn_scope_monthly", "list_lp_pl5_status_monthly",
  "list_lp_pl5_upn_status_monthly", "calc_batch", "calc_runtime_setting",
  "calc_weekly_upn_split_batch", "calc_weekly_upn_split_bu_summary",
  "calc_weekly_upn_split_result", "calc_upn_split_result", "calc_upn_split_trace",
  "upn_split_error_catalog",
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
