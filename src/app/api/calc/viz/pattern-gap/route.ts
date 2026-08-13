import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type GapPoint = {
  period: string;
  weekPatternAmount: number;
  actualAmount: number;
  suggestedAmountTotal: number;
  weekPatternGapAmount: number;
  weekPatternGapPct: number | null;
  finalAmountTotal: number;
  finalPatternGapAmount: number;
  currency: string;
};

const amount = (value: unknown) => Number(value ?? 0);
const dateKey = (value: Date) => value.toISOString().slice(0, 10);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeSpan = searchParams.get("time_span") === "month" ? "month" : "week";
    const periodMonth = searchParams.get("period_month");
    const calendarDate = searchParams.get("calendar_date");

    const rows = await prisma.calc_weekly_upn_split_batch.findMany({
      where: {
        status: { in: ["SUCCESS", "PARTIAL"] },
        ...(periodMonth
          ? { period_month: new Date(`${periodMonth}T08:00:00+08:00`) }
          : {}),
        ...(calendarDate
          ? { calendar_date: new Date(`${calendarDate}T08:00:00+08:00`) }
          : {}),
      },
      orderBy: [{ calendar_date: "asc" }, { calculated_at: "desc" }],
      take: 500,
      select: {
        calendar_date: true,
        period_month: true,
        week_pattern_amount: true,
        actual_amount: true,
        suggested_amount_total: true,
        week_pattern_gap_amount: true,
        week_pattern_gap_pct: true,
        final_amount_total: true,
        final_pattern_gap_amount: true,
        calculation_currency: true,
      },
    });

    // A week may have multiple reruns. Statistics always use the latest successful run.
    const latestByWeek = new Map<string, (typeof rows)[number]>();
    for (const row of rows) latestByWeek.set(dateKey(row.calendar_date), row);

    const weekly: GapPoint[] = Array.from(latestByWeek.values()).map((row) => ({
      period: dateKey(row.calendar_date),
      weekPatternAmount: amount(row.week_pattern_amount),
      actualAmount: amount(row.actual_amount),
      suggestedAmountTotal: amount(row.suggested_amount_total),
      weekPatternGapAmount: amount(row.week_pattern_gap_amount),
      weekPatternGapPct:
        row.week_pattern_gap_pct == null ? null : amount(row.week_pattern_gap_pct),
      finalAmountTotal: amount(row.final_amount_total),
      finalPatternGapAmount: amount(row.final_pattern_gap_amount),
      currency: row.calculation_currency,
    }));

    const grouped = new Map<string, GapPoint>();
    if (timeSpan === "month") {
      for (const row of Array.from(latestByWeek.values())) {
        const key = dateKey(row.period_month).slice(0, 7);
        const current = grouped.get(key) ?? {
          period: key,
          weekPatternAmount: 0,
          actualAmount: 0,
          suggestedAmountTotal: 0,
          weekPatternGapAmount: 0,
          weekPatternGapPct: null,
          finalAmountTotal: 0,
          finalPatternGapAmount: 0,
          currency: row.calculation_currency,
        };
        current.weekPatternAmount += amount(row.week_pattern_amount);
        current.actualAmount += amount(row.actual_amount);
        current.suggestedAmountTotal += amount(row.suggested_amount_total);
        current.weekPatternGapAmount += amount(row.week_pattern_gap_amount);
        current.finalAmountTotal += amount(row.final_amount_total);
        current.finalPatternGapAmount += amount(row.final_pattern_gap_amount);
        grouped.set(key, current);
      }
      for (const point of grouped.values()) {
        point.weekPatternGapPct =
          point.weekPatternAmount === 0
            ? null
            : point.weekPatternGapAmount / point.weekPatternAmount;
      }
    }

    const data = timeSpan === "month" ? Array.from(grouped.values()) : weekly;
    const latest = weekly.at(-1) ?? null;

    return NextResponse.json({
      granularity: timeSpan,
      data,
      latest,
      summary: {
        periods: data.length,
        weekPatternAmount: data.reduce((sum, row) => sum + row.weekPatternAmount, 0),
        finalAmountTotal: data.reduce((sum, row) => sum + row.finalAmountTotal, 0),
        finalPatternGapAmount: data.reduce(
          (sum, row) => sum + row.finalPatternGapAmount,
          0,
        ),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "目标差额 query failed" },
      { status: 500 },
    );
  }
}
