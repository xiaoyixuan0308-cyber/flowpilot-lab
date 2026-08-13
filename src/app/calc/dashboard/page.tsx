import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";

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
        total_upns: true,
        error_upns: true,
        calculated_at: true,
      },
    }),
    prisma.calc_weekly_upn_split_batch.findMany({
      orderBy: { calculated_at: "desc" },
      take: 30,
      select: {
        id: true,
        period_month: true,
        calendar_date: true,
        status: true,
        total_upns: true,
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

  const latestPeriodMonth = periodMonths[0] ?? null;
  const latestCalendarDate = calendarDates[0] ?? null;

  return (
    <DashboardClient
      periodMonths={periodMonths}
      calendarDates={calendarDates}
      latestPeriodMonth={latestPeriodMonth}
      latestCalendarDate={latestCalendarDate}
    />
  );
}
