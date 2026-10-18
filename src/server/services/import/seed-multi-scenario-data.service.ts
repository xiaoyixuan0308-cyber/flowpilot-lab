import { prisma } from "@/lib/prisma";
import {
  buildMultiScenarioSeedFixtures,
  MULTI_SCENARIO_PERIOD_MONTH,
} from "./seed-multi-scenario-fixtures";

export async function seedMultiScenarioData(
  periodMonth: string = MULTI_SCENARIO_PERIOD_MONTH,
) {
  const fixtures = buildMultiScenarioSeedFixtures(periodMonth);

  await prisma.$transaction(async (tx) => {
    await tx.list_channel_category_sku_status_monthly.deleteMany();
    await tx.bridge_category_sku_scope_monthly.deleteMany();
    await tx.list_channel_category_status_monthly.deleteMany();
    await tx.bridge_channel_category_scope_monthly.deleteMany();
    await tx.calc_sku_split_trace.deleteMany();
    await tx.calc_sku_split_result.deleteMany();
    await tx.calc_batch.deleteMany();
    await tx.ods_sku_active_list.deleteMany();
    await tx.ods_channel_category_allocate_monthly.deleteMany();
    await tx.ods_fcst_t2_category_monthly.deleteMany();
    await tx.ods_fcst_channel_category_monthly.deleteMany();
    await tx.ods_dioh_dealer_sku.deleteMany();
    await tx.ods_inventory_dealer_sku.deleteMany();
    await tx.ods_t2_purchase_monthly.deleteMany();

    await tx.ods_fcst_channel_category_monthly.createMany({
      data: fixtures.fcstChannelCategory.map((row) => ({ business_unit: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
    await tx.ods_fcst_t2_category_monthly.createMany({
      data: fixtures.fcstT2Category.map((row) => ({ business_unit: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
    await tx.ods_channel_category_allocate_monthly.createMany({
      data: fixtures.allocations,
      skipDuplicates: true,
    });
    await tx.ods_sku_active_list.createMany({
      data: fixtures.activeSkus,
      skipDuplicates: true,
    });
    await tx.ods_inventory_dealer_sku.createMany({
      data: fixtures.inventories,
      skipDuplicates: true,
    });
    await tx.ods_dioh_dealer_sku.createMany({
      data: fixtures.diohTargets,
      skipDuplicates: true,
    });
    await tx.ods_t2_purchase_monthly.createMany({
      data: fixtures.t2Purchases.map((row) => ({ business_unit: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
  });

  return {
    success: true,
    periodMonth: fixtures.periodMonth,
    message: "多场景测试数据已写入 ODS 表，可用于多 渠道 / 多 产品分类 第一轮验证。",
  };
}
