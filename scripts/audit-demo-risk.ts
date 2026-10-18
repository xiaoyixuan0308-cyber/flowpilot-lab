import { prisma } from "../src/lib/prisma";

async function main() {
const batch = await prisma.calc_weekly_sku_split_batch.findFirst({
  orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
  include: { results: true },
});
if (!batch) throw new Error("No weekly batch");
const delayThreshold = new Date(batch.calendar_date.getTime() + 7 * 86400000);
const delayed = new Set((await prisma.ods_central_warehouse_sku_intransit.findMany({
  where: { forecast_date: { gt: delayThreshold } }, select: { material: true },
})).map((r) => r.material));
const bySku = new Map<string, Set<string>>();
const add = (sku: string, risk: string) => {
  if (!bySku.has(sku)) bySku.set(sku, new Set());
  bySku.get(sku)!.add(risk);
};
for (const row of batch.results) {
  const avg = Number(row.bj_t2_purchase_3m_avg_qty ?? 0);
  if (avg > 0 && Number(row.month_quota_qty ?? 0) > avg * 1.3) add(row.sku, "需求突增");
  if (row.inventory_status === "STOP") add(row.sku, "供应不足");
  if (Number(row.post_suggest_dioh ?? 0) > 90 || Number(row.ab_current_inventory_days ?? 0) > 90) add(row.sku, "库存积压");
  if (row.constraint_types?.trim() && row.adjustment_allowed_flag === "N") add(row.sku, "约束冲突");
  if (row.unit_price === null || row.safety_stock_qty === null) add(row.sku, "数据缺失");
}
for (const sku of delayed) add(sku, "到货偏晚");
const output = [...bySku.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([sku, risks]) => ({ sku, risks: [...risks] }));
console.log(JSON.stringify({ calendarDate: batch.calendar_date, total: batch.total_skus, anomalies: output.length, output }, null, 2));
await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exitCode = 1;
});
