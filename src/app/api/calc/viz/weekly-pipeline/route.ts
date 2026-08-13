import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batch_id");
    const calendarDate = searchParams.get("calendar_date");

    let targetId: string | null = batchId ?? null;

    if (!targetId && calendarDate) {
      const batches = await prisma.calc_weekly_upn_split_batch.findMany({
        where: {
          calendar_date: new Date(`${calendarDate}T08:00:00+08:00`),
          status: { in: ["SUCCESS", "PARTIAL"] },
        },
        orderBy: { calculated_at: "desc" },
        take: 1,
        select: { id: true },
      });
      if (batches.length > 0) {
        targetId = batches[0].id;
      }
    }

    if (!targetId) {
      return NextResponse.json({ data: [], buSummaries: [] });
    }

    const results = await prisma.calc_weekly_upn_split_result.findMany({
        where: { batch_id: targetId },
        select: {
          pl5_code: true,
          upn: true,
          lp_code: true,
          suggest_qty: true,
          system_adjusted_suggest_qty: true,
          gap_fill_qty: true,
          final_qty: true,
        },
        orderBy: { final_qty: "desc" },
      });

    const data = results.map((row) => ({
      upn: row.upn,
      pl5Code: row.pl5_code || "unknown",
      lpCode: row.lp_code || "unknown",
      ad: Math.round(Number(row.suggest_qty ?? 0) * 100) / 100,
      sa: Math.round(Number(row.system_adjusted_suggest_qty ?? 0) * 100) / 100,
      ra: Math.round(Number(row.gap_fill_qty ?? 0) * 100) / 100,
      rra: Math.round(Number(row.final_qty ?? 0) * 100) / 100,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "未知错误" },
      { status: 500 },
    );
  }
}
