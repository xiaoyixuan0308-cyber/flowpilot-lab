import { NextResponse } from "next/server";
import { saveWeeklyFinalQtyAdjustments } from "@/server/services/calc/weekly-upn-split/weekly-final-adjustment.service";

interface RouteContext {
  params: Promise<{ calendarDate: string }>;
}

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { calendarDate } = await context.params;
    const body = await request.json();
    const result = await saveWeeklyFinalQtyAdjustments({
      calendarDate,
      batchId: body?.batchId,
      changes: body?.changes,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "人工最终数量保存失败" },
      { status: 422 },
    );
  }
}
