import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const periodMonth = searchParams.get("period_month");

    if (!periodMonth) {
      return NextResponse.json(
        { error: "缺少 period_month 参数" },
        { status: 400 },
      );
    }

    const batches = await prisma.calc_batch.findMany({
      where: {
        period_month: new Date(`${periodMonth}T08:00:00+08:00`),
        status: { in: ["SUCCESS", "PARTIAL"] },
      },
      orderBy: { calculated_at: "desc" },
      take: 1,
      select: { id: true },
    });

    if (batches.length === 0) {
      return NextResponse.json({
        errorRate: { total: 0, errors: 0, rate: 0 },
        distribution: [],
        anomalyUpns: [],
        diohWarnings: [],
      });
    }

    const batchId = batches[0].id;

    const [totalCount, errorRows, diohWarnings] = await Promise.all([
      prisma.calc_upn_split_result.count({ where: { batch_id: batchId } }),
      prisma.calc_upn_split_result.findMany({
        where: { batch_id: batchId, is_error: true },
        select: {
          dealerlpcode: true,
          upn: true,
          pl5_code: true,
          error_message: true,
          s_tolerance_replenish: true,
          t_adjusted_dioh: true,
        },
      }),
      prisma.calc_upn_split_result.findMany({
        where: {
          batch_id: batchId,
          t_adjusted_dioh: { lt: 30 },
        },
        select: {
          dealerlpcode: true,
          upn: true,
          pl5_code: true,
          current_dioh: true,
          t_adjusted_dioh: true,
        },
        orderBy: { t_adjusted_dioh: "asc" },
      }),
    ]);

    const errorCodeMap = new Map<string, number>();
    for (const row of errorRows) {
      const msg = row.error_message || "未知异常";
      errorCodeMap.set(msg, (errorCodeMap.get(msg) ?? 0) + 1);
    }

    const distribution = Array.from(errorCodeMap.entries()).map(
      ([message, count]) => ({ message, count }),
    );

    const errorRate = {
      total: totalCount,
      errors: errorRows.length,
      rate: totalCount > 0 ? Math.round((errorRows.length / totalCount) * 10000) / 100 : 0,
    };

    return NextResponse.json({
      errorRate,
      distribution,
      anomalyUpns: errorRows.map((r) => ({
        dealerlpcode: r.dealerlpcode,
        upn: r.upn,
        pl5_code: r.pl5_code,
        error_message: r.error_message,
        s_tolerance_replenish: Number(r.s_tolerance_replenish ?? 0),
        t_adjusted_dioh: Number(r.t_adjusted_dioh ?? 0),
      })),
      diohWarnings: diohWarnings.map((r) => ({
        dealerlpcode: r.dealerlpcode,
        upn: r.upn,
        pl5_code: r.pl5_code,
        current_dioh: Number(r.current_dioh ?? 0),
        t_adjusted_dioh: Number(r.t_adjusted_dioh ?? 0),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
