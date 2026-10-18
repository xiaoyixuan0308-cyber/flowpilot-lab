import { prisma } from "@/lib/prisma";

export async function resetTestData() {
  await prisma.$transaction(async (tx) => {
    await tx.calc_weekly_sku_split_result.deleteMany();
    await tx.calc_weekly_sku_split_batch.deleteMany();
    await tx.calc_sku_split_trace.deleteMany();
    await tx.calc_sku_split_result.deleteMany();
    await tx.calc_batch.deleteMany();

    await tx.list_channel_category_sku_status_monthly.deleteMany();
    await tx.bridge_category_sku_scope_monthly.deleteMany();
    await tx.list_channel_category_status_monthly.deleteMany();
    await tx.bridge_channel_category_scope_monthly.deleteMany();

    await tx.ods_dealer_sku_dn.deleteMany();
    await tx.ods_dealer_sku_open_order.deleteMany();
    await tx.ods_central_warehouse_sku_inventory.deleteMany();
    await tx.ods_central_warehouse_sku_intransit.deleteMany();
    await tx.ods_sku_safety_stock_manual.deleteMany();
    await tx.ods_channel_sku_purchase_price.deleteMany();
    await tx.ods_sku_constraint_manual.deleteMany();
    await tx.ods_sku_bundle_manual.deleteMany();
    await tx.ods_weekly_amount_threshold_manual.deleteMany();
    await tx.ods_calendar_pattern_weekly.deleteMany();
    await tx.ods_bu_pattern_amount_weekly.deleteMany();

    await tx.ods_sku_active_list.deleteMany();
    await tx.ods_channel_category_allocate_monthly.deleteMany();
    await tx.ods_fcst_t2_category_monthly.deleteMany();
    await tx.ods_fcst_channel_category_monthly.deleteMany();
    await tx.ods_dioh_dealer_sku.deleteMany();
    await tx.ods_inventory_dealer_sku.deleteMany();
    await tx.ods_t2_purchase_monthly.deleteMany();
  });

  return {
    success: true,
    message: "月拆分与周拆分测试数据已清空，异常字典和结构表未受影响。",
  };
}
