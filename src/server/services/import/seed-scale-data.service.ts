import { prisma } from "@/lib/prisma";
import { buildScaleSeedFixtures, SCALE_PERIOD_MONTH } from "./seed-scale-fixtures";

export async function seedScaleData(
  periodMonth: string = SCALE_PERIOD_MONTH,
  options?: {
    lpCount?: number;
    pl5Count?: number;
    upnPerLpPl5?: number;
  },
) {
  const fixtures = buildScaleSeedFixtures(periodMonth, options);

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
    periodMonth,
    options: {
      lpCount: options?.lpCount ?? 3,
      pl5Count: options?.pl5Count ?? 4,
      upnPerLpPl5: options?.upnPerLpPl5 ?? 3,
    },
    message: "规模回归测试数据已写入 ODS 表。",
  };
}
