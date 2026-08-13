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
      return NextResponse.json({ data: [] });
    }

    const batchId = batches[0].id;

    const results = await prisma.calc_upn_split_result.findMany({
      where: { batch_id: batchId },
      select: {
        pl5_code: true,
        upn: true,
        dealerlpcode: true,
        p_theoretical_replenish: true,
        q_actual_theoretical: true,
        r_base_replenish: true,
        s_tolerance_replenish: true,
      },
      orderBy: { s_tolerance_replenish: "desc" },
    });

    const data = results.map((row) => ({
      upn: row.upn,
      pl5Code: row.pl5_code || "unknown",
      dealerlpcode: row.dealerlpcode,
      p: Math.round(Number(row.p_theoretical_replenish ?? 0) * 100) / 100,
      q: Math.round(Number(row.q_actual_theoretical ?? 0) * 100) / 100,
      r: Math.round(Number(row.r_base_replenish ?? 0) * 100) / 100,
      s: Math.round(Number(row.s_tolerance_replenish ?? 0) * 100) / 100,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
