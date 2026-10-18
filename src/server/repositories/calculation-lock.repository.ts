import { Prisma } from "@prisma/client";

export async function acquireCalculationLock(
  db: Prisma.TransactionClient,
  scope: "monthly-sku-split" | "weekly-sku-split",
  calculationKey: string
) {
  await db.$queryRaw(Prisma.sql`
    SELECT pg_advisory_xact_lock(hashtext(${scope}), hashtext(${calculationKey}))::text AS acquired
  `);
}
