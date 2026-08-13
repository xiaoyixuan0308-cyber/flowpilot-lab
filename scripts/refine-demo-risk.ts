import { Prisma } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

const SECONDARY_UPNS = ["71020001", "71050001", "71050002"];

async function main() {
  const updates = [];
  for (const upn of SECONDARY_UPNS) {
    const result = await prisma.ods_bsc_upn_inventory.updateMany({
      where: { material: upn },
      data: { unrestricted_qty: new Prisma.Decimal(3000) },
    });
    updates.push({ upn, rows: result.count, unrestrictedQty: 3000 });
  }
  console.log(JSON.stringify(updates, null, 2));
  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
