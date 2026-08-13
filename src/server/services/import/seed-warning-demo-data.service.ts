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
    await tx.list_lp_pl5_upn_status_monthly.deleteMany();
    await tx.bridge_pl5_upn_scope_monthly.deleteMany();
    await tx.list_lp_pl5_status_monthly.deleteMany();
    await tx.bridge_lp_pl5_scope_monthly.deleteMany();
    await tx.calc_upn_split_trace.deleteMany();
    await tx.calc_upn_split_result.deleteMany();
    await tx.calc_batch.deleteMany();
    await tx.ods_upn_active_list.deleteMany();
    await tx.ods_lp_pl5_allocate_monthly.deleteMany();
    await tx.ods_fcst_t2_pl5_monthly.deleteMany();
    await tx.ods_fcst_lp_pl5_monthly.deleteMany();
    await tx.ods_dioh_dealer_upn.deleteMany();
    await tx.ods_inventory_dealer_upn.deleteMany();
    await tx.ods_t2_purchase_monthly.deleteMany();

    await tx.ods_fcst_lp_pl5_monthly.createMany({
      data: fixtures.fcstLpPl5.map((row) => ({ sc_bu: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
    await tx.ods_fcst_t2_pl5_monthly.createMany({
      data: fixtures.fcstT2Pl5.map((row) => ({ sc_bu: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
    await tx.ods_lp_pl5_allocate_monthly.createMany({
      data: fixtures.allocations,
      skipDuplicates: true,
    });
    await tx.ods_upn_active_list.createMany({
      data: fixtures.activeUpns,
      skipDuplicates: true,
    });
    await tx.ods_inventory_dealer_upn.createMany({
      data: fixtures.inventories,
      skipDuplicates: true,
    });
    await tx.ods_dioh_dealer_upn.createMany({
      data: fixtures.diohTargets,
      skipDuplicates: true,
    });
    await tx.ods_t2_purchase_monthly.createMany({
      data: fixtures.t2Purchases.map((row) => ({ sc_bu: "DEFAULT", ...row })),
      skipDuplicates: true,
    });
  });

  return {
    success: true,
    periodMonth: fixtures.periodMonth,
    message: "异常演示测试数据已写入 ODS 表，可用于一次性查看 5 种 warning。",
    expectedStatusWarnings: [
      { lpCode: "LP901", pl5Code: "PL5H", errorCode: "NO_FCST_PL5_NO_HISTORY" },
      { lpCode: "LP902", pl5Code: "PL5H", errorCode: "HAS_FCST_PL5_NO_HISTORY" },
    ],
    expectedResultWarnings: [
      { lpCode: "LP901", pl5Code: "PL5N", upn: "UPN-N1", errorCode: "CURRENT_DIOH_LT_30_NEED_REPLENISH" },
      { lpCode: "LP901", pl5Code: "PL5N", upn: "UPN-N2", errorCode: "CURRENT_DIOH_LT_30_NEED_REPLENISH" },
      { lpCode: "LP901", pl5Code: "PL5N", upn: "UPN-N3", errorCode: "UPN_M0_ZERO" },
      { lpCode: "LP901", pl5Code: "PL5M", upn: "UPN-M1", errorCode: "PL5_ALLOCATE_MISMATCH" },
      { lpCode: "LP901", pl5Code: "PL5M", upn: "UPN-M2", errorCode: "PL5_ALLOCATE_MISMATCH" },
      { lpCode: "LP901", pl5Code: "PL5M", upn: "UPN-M3", errorCode: "PL5_ALLOCATE_MISMATCH" },
    ],
  };
}
