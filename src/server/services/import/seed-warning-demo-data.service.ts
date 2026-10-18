import { prisma } from "@/lib/prisma";
import {
  buildWarningDemoSeedFixtures,
  WARNING_DEMO_PERIOD_MONTH,
} from "./seed-warning-demo-fixtures";

export async function seedWarningDemoData(
  periodMonth: string = WARNING_DEMO_PERIOD_MONTH,
) {
  const fixtures = buildWarningDemoSeedFixtures(periodMonth);

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
    message: "异常演示测试数据已写入 ODS 表，可用于一次性查看 5 种 warning。",
    expectedStatusWarnings: [
      { channelCode: "CH901", categoryCode: "CATH", errorCode: "NO_FCST_CATEGORY_NO_HISTORY" },
      { channelCode: "CH902", categoryCode: "CATH", errorCode: "HAS_FCST_CATEGORY_NO_HISTORY" },
    ],
    expectedResultWarnings: [
      { channelCode: "CH901", categoryCode: "CATN", sku: "SKU-N1", errorCode: "CURRENT_DIOH_LT_30_NEED_REPLENISH" },
      { channelCode: "CH901", categoryCode: "CATN", sku: "SKU-N2", errorCode: "CURRENT_DIOH_LT_30_NEED_REPLENISH" },
      { channelCode: "CH901", categoryCode: "CATN", sku: "SKU-N3", errorCode: "SKU_M0_ZERO" },
      { channelCode: "CH901", categoryCode: "CATM", sku: "SKU-M1", errorCode: "CATEGORY_ALLOCATE_MISMATCH" },
      { channelCode: "CH901", categoryCode: "CATM", sku: "SKU-M2", errorCode: "CATEGORY_ALLOCATE_MISMATCH" },
      { channelCode: "CH901", categoryCode: "CATM", sku: "SKU-M3", errorCode: "CATEGORY_ALLOCATE_MISMATCH" },
    ],
  };
}
