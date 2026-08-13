import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const STORY_UPNS = new Set(["71010001", "71020002", "71030001", "71040001", "71060001"]);

async function main() {
  const monthlyBatch = await prisma.calc_batch.findFirst({
    where: { period_month: new Date("2026-07-01T00:00:00.000Z") },
    orderBy: { calculated_at: "desc" },
    include: { results: true },
  });
  if (!monthlyBatch) throw new Error("缺少 2026-07 月度计算结果");

  const demandByDealerUpn = new Map(
    monthlyBatch.results.map((row) => [`${row.dealerlpcode}|${row.upn}`, Number(row.g_t2_purchase_m0 ?? 0)]),
  );
  const normalizedInventory: Array<{ id: string; qty: Prisma.Decimal }> = [];
  const inventoryRows = await prisma.ods_inventory_dealer_upn.findMany();
  for (const row of inventoryRows) {
    if (STORY_UPNS.has(row.upn)) continue;
    const monthlyDemand = demandByDealerUpn.get(`${row.dealerlpcode}|${row.upn}`) ?? 0;
    const targetQty = Math.max(5, Math.round(monthlyDemand * 1.5));
    normalizedInventory.push({ id: row.id, qty: new Prisma.Decimal(targetQty) });
  }

  const centralRows = await prisma.ods_bsc_upn_inventory.findMany();
  const normalizedCentral = centralRows
    .filter((row) => !STORY_UPNS.has(row.material))
    .map((row) => ({ id: row.id, qty: new Prisma.Decimal(600) }));

  await prisma.$transaction(async (tx) => {
    await tx.ods_upn_constraint_manual.deleteMany({
      where: { upn: { not: "71060001" } },
    });
    for (const row of normalizedInventory) {
      await tx.ods_inventory_dealer_upn.update({ where: { id: row.id }, data: { qty: row.qty } });
    }
    for (const row of normalizedCentral) {
      await tx.ods_bsc_upn_inventory.update({
        where: { id: row.id }, data: { unrestricted_qty: row.qty },
      });
    }
  });

  console.log(JSON.stringify({
    keptStoryUpns: [...STORY_UPNS],
    normalizedDealerInventoryRows: normalizedInventory.length,
    normalizedCentralInventoryRows: normalizedCentral.length,
    remainingConstraints: await prisma.ods_upn_constraint_manual.count(),
  }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
