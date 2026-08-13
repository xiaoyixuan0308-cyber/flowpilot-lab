import { prisma } from "@/lib/prisma";
import { buildSeedOdsFixtures } from "./seed-ods-fixtures";

export async function seedOdsData() {
  const fixtures = buildSeedOdsFixtures();

  await prisma.$transaction(async (tx) => {
    await tx.list_lp_pl5_upn_status_monthly.deleteMany();
    await tx.bridge_pl5_upn_scope_monthly.deleteMany();
    await tx.list_lp_pl5_status_monthly.deleteMany();
    await tx.bridge_lp_pl5_scope_monthly.deleteMany();
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
    message: "最小开发假数据已写入 ODS 表，可用于 scope/status 与计算链验证。",
  };
}
