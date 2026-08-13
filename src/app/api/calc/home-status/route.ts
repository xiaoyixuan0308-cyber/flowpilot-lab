import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCalculationCalendarDate } from "@/server/repositories";
import { isMonthClippedWeekWindow } from "@/lib/month-week";

function toDateKey(value: Date | null | undefined) {
  return value ? value.toISOString().slice(0, 10) : null;
}

export async function GET(request: Request) {
  const requestedDate = new URL(request.url).searchParams.get("calendarDate");
  const [calendarResult, runtimeResult, monthlyResult, weeklyDatesResult] =
    await Promise.allSettled([
      prisma.ods_calendar_pattern_weekly.findMany({
        distinct: ["week_end_date"],
        orderBy: { week_end_date: "desc" },
        take: 24,
        select: { week_start_date: true, week_end_date: true, period_month: true },
      }),
      getCurrentCalculationCalendarDate(),
      prisma.calc_batch.findMany({
        orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
        take: 100,
        select: {
          period_month: true,
          status: true,
          error_upns: true,
          calculated_at: true,
        },
      }),
      prisma.calc_weekly_upn_split_batch.findMany({
        orderBy: [{ calculated_at: "desc" }, { created_at: "desc" }],
        take: 100,
        select: {
          calendar_date: true,
          status: true,
          calculated_at: true,
        },
      }),
    ]);

  const availableDates =
    calendarResult.status === "fulfilled"
      ? calendarResult.value
          .filter((row) => isMonthClippedWeekWindow(
            toDateKey(row.period_month) ?? "",
            toDateKey(row.week_start_date) ?? "",
            toDateKey(row.week_end_date) ?? "",
          ))
          .map((row) => toDateKey(row.week_end_date))
          .filter((value): value is string => Boolean(value))
      : [];
  const monthlyBatches = monthlyResult.status === "fulfilled" ? monthlyResult.value : [];
  const resultDates =
    weeklyDatesResult.status === "fulfilled"
      ? weeklyDatesResult.value
          .map((row) => toDateKey(row.calendar_date))
          .filter((value): value is string => Boolean(value))
      : [];
  const fallbackDate = resultDates[0] ?? availableDates[0] ?? "";
  const savedDate = runtimeResult.status === "fulfilled" ? runtimeResult.value : fallbackDate;
  const calendarDate =
    requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : savedDate;
  const selectedWeekly =
    weeklyDatesResult.status === "fulfilled"
      ? weeklyDatesResult.value.find(
          (batch) => toDateKey(batch.calendar_date) === calendarDate,
        ) ?? null
      : null;
  const selectedCalendar =
    calendarResult.status === "fulfilled"
      ? calendarResult.value.find(
          (row) => toDateKey(row.week_end_date) === calendarDate,
        )
      : undefined;
  const selectedPeriodMonth =
    toDateKey(selectedCalendar?.period_month) ??
    (calendarDate ? `${calendarDate.slice(0, 7)}-01` : null);
  const selectedMonthly = selectedPeriodMonth
    ? monthlyBatches.find(
        (batch) => toDateKey(batch.period_month) === selectedPeriodMonth,
      ) ?? null
    : null;
  const selectedBatch = selectedWeekly ?? selectedMonthly;
  const status = selectedBatch?.status ?? "NOT_CALCULATED";
  const anomalyCount =
    (selectedMonthly?.error_upns ?? 0) +
    (selectedWeekly?.status === "PARTIAL" ? 1 : 0);
  const calculatedAt = selectedBatch?.calculated_at ?? null;

  return NextResponse.json({
    calendarDate,
    availableDates: Array.from(
      new Set([calendarDate, ...resultDates, ...availableDates]),
    ).filter(Boolean),
    status,
    anomalyCount,
    calculatedAt: calculatedAt?.toISOString() ?? null,
    monthlyResultAvailable: Boolean(selectedMonthly),
    weeklyResultAvailable: Boolean(selectedWeekly),
    dataAvailable:
      calendarResult.status === "fulfilled" ||
      monthlyResult.status === "fulfilled" ||
      weeklyDatesResult.status === "fulfilled",
  });
}
