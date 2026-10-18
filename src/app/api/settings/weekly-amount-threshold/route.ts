import { NextResponse } from "next/server";
import {
  deleteWeeklyAmountThreshold,
  upsertWeeklyAmountThreshold,
} from "@/server/services/weekly-amount-threshold.service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const row = await upsertWeeklyAmountThreshold({
      businessUnit: body?.businessUnit,
      overageThresholdPct: body?.overageThresholdPct,
      shortfallThresholdPct: body?.shortfallThresholdPct,
    });
    return NextResponse.json({
      success: true,
      rule: {
        businessUnit: row.business_unit,
        overageThresholdPct: Number(row.overage_threshold_pct),
        shortfallThresholdPct: Number(row.shortfall_threshold_pct),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "阈值保存失败" },
      { status: 422 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const deleted = await deleteWeeklyAmountThreshold(body?.businessUnit);
    return NextResponse.json({ success: true, deleted });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "阈值删除失败" },
      { status: 422 },
    );
  }
}
