import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const [monthlyBatches, weeklyBatches, latestMonthlyResult] =
      await Promise.all([
        prisma.calc_batch.findMany({
          orderBy: { calculated_at: "desc" },
          take: 20,
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
          take: 20,
          select: {
            id: true,
            period_month: true,
            calendar_date: true,
            status: true,
            total_upns: true,
            calculated_at: true,
          },
        }),
        prisma.calc_upn_split_result.aggregate({
          _avg: { current_dioh: true, t_adjusted_dioh: true },
        }),
      ]);

    const monthlyStatusCounts = {
      SUCCESS: 0,
      PARTIAL: 0,
      FAILED: 0,
      total: monthlyBatches.length,
    };
    for (const b of monthlyBatches) {
      if (b.status in monthlyStatusCounts) {
        monthlyStatusCounts[b.status as keyof typeof monthlyStatusCounts]++;
      }
    }

    const avgDioh = latestMonthlyResult._avg?.current_dioh
      ? Math.round(Number(latestMonthlyResult._avg.current_dioh) * 100) / 100
      : null;
    const avgAdjustedDioh = latestMonthlyResult._avg?.t_adjusted_dioh
      ? Math.round(Number(latestMonthlyResult._avg.t_adjusted_dioh) * 100) / 100
      : null;

    return NextResponse.json({
      monthlyBatches,
      weeklyBatches,
      monthlyStatusCounts,
      avgDioh,
      avgAdjustedDioh,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
