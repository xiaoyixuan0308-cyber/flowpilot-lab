import { prisma } from "@/lib/prisma";

export async function resetTestData() {
  await prisma.$transaction(async (tx) => {
    await tx.calc_weekly_upn_split_result.deleteMany();
    await tx.calc_weekly_upn_split_batch.deleteMany();
    await tx.calc_upn_split_trace.deleteMany();
    await tx.calc_upn_split_result.deleteMany();
    await tx.calc_batch.deleteMany();

    await tx.list_lp_pl5_upn_status_monthly.deleteMany();
    await tx.bridge_pl5_upn_scope_monthly.deleteMany();
    await tx.list_lp_pl5_status_monthly.deleteMany();
    await tx.bridge_lp_pl5_scope_monthly.deleteMany();

    await tx.ods_dealer_upn_dn.deleteMany();
    await tx.ods_dealer_upn_open_order.deleteMany();
    await tx.ods_bsc_upn_inventory.deleteMany();
    await tx.ods_bsc_upn_intransit.deleteMany();
    await tx.ods_upn_safety_stock_manual.deleteMany();
    await tx.ods_lp_upn_purchase_price.deleteMany();
    await tx.ods_upn_constraint_manual.deleteMany();
    await tx.ods_upn_bundle_manual.deleteMany();
    await tx.ods_weekly_amount_threshold_manual.deleteMany();
    await tx.ods_calendar_pattern_weekly.deleteMany();
    await tx.ods_bu_pattern_amount_weekly.deleteMany();

    await tx.ods_upn_active_list.deleteMany();
    await tx.ods_lp_pl5_allocate_monthly.deleteMany();
    await tx.ods_fcst_t2_pl5_monthly.deleteMany();
    await tx.ods_fcst_lp_pl5_monthly.deleteMany();
    await tx.ods_dioh_dealer_upn.deleteMany();
    await tx.ods_inventory_dealer_upn.deleteMany();
    await tx.ods_t2_purchase_monthly.deleteMany();
  });

  return {
    success: true,
    message: "月拆分与周拆分测试数据已清空，异常字典和结构表未受影响。",
  };
}
