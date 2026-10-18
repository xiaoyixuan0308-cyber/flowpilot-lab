import { prisma } from "@/lib/prisma";
import {
  loadSupplyChainOverview,
  type SupplyChainExceptionKey,
} from "@/server/services/dashboard/supply-chain-overview";
import { DashboardClient } from "./dashboard-client";

const RISK_LABELS: Record<SupplyChainExceptionKey, string> = {
  demandSurge: "需求突增",
  arrivalDelay: "到货窗口偏晚",
  supplyShortage: "可供库存不足",
  inventoryBacklog: "库存覆盖偏高",
  constraintConflict: "业务约束冲突",
  dataQuality: "基础数据缺失",
};

const INVENTORY_STATUS_LABELS: Record<string, string> = {
  OK: "库存可满足",
  STOP: "停止分配",
};

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [monthlyBatches, weeklyBatches] = await Promise.all([
    prisma.calc_batch.findMany({
      orderBy: { calculated_at: "desc" },
      take: 30,
      select: {
        id: true,
        period_month: true,
        status: true,
        total_skus: true,
        error_skus: true,
        calculated_at: true,
      },
    }),
    prisma.calc_weekly_sku_split_batch.findMany({
      orderBy: { calculated_at: "desc" },
      take: 30,
      select: {
        id: true,
        period_month: true,
        calendar_date: true,
        status: true,
        total_skus: true,
        calculated_at: true,
      },
    }),
  ]);

  const periodMonths = Array.from(
    new Set(
      monthlyBatches.map((b) =>
        b.period_month instanceof Date
          ? b.period_month.toISOString().slice(0, 10)
          : String(b.period_month).slice(0, 10),
      ),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const calendarDates = Array.from(
    new Set(
      weeklyBatches.map((b) =>
        b.calendar_date instanceof Date
          ? b.calendar_date.toISOString().slice(0, 10)
          : String(b.calendar_date).slice(0, 10),
      ),
    ),
  ).sort((a, b) => b.localeCompare(a));

  const latestWeeklyBatchId = weeklyBatches.find((b) => b.status === "SUCCESS")?.id ?? weeklyBatches[0]?.id;
  const [overview, weeklyStatusRows] = await Promise.all([
    loadSupplyChainOverview(),
    latestWeeklyBatchId
      ? prisma.calc_weekly_sku_split_result.groupBy({
          by: ["inventory_status"],
          where: { batch_id: latestWeeklyBatchId },
          _count: { _all: true },
        })
      : Promise.resolve([]),
  ]);

  const riskDistribution = (Object.keys(RISK_LABELS) as SupplyChainExceptionKey[])
    .map((key) => ({ name: RISK_LABELS[key], value: overview.exceptions[key].count }))
    .filter((item) => item.value > 0);

  const weeklyInventoryStatus = weeklyStatusRows
    .filter((row) => row.inventory_status)
    .map((row) => ({
      name: INVENTORY_STATUS_LABELS[row.inventory_status ?? ""] ?? String(row.inventory_status),
      value: row._count._all,
    }));

  const latestPeriodMonth = periodMonths[0] ?? null;
  const latestCalendarDate = calendarDates[0] ?? null;

  return (
    <DashboardClient
      periodMonths={periodMonths}
      calendarDates={calendarDates}
      latestPeriodMonth={latestPeriodMonth}
      latestCalendarDate={latestCalendarDate}
      riskDistribution={riskDistribution}
      riskSkuCount={overview.anomalySkuCount}
      weeklyInventoryStatus={weeklyInventoryStatus}
    />
  );
}
