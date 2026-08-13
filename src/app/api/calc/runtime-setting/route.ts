import { NextRequest, NextResponse } from "next/server";
import {
  getCurrentCalculationCalendarDate,
  saveCurrentCalculationCalendarDate,
} from "@/server/repositories";

export async function GET() {
  return NextResponse.json({ calendarDate: await getCurrentCalculationCalendarDate() });
}

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as { calendarDate?: string };
    if (!body.calendarDate) {
      return NextResponse.json({ error: "缺少计算基准日 calendarDate" }, { status: 400 });
    }

    const calendarDate = await saveCurrentCalculationCalendarDate(body.calendarDate);
    return NextResponse.json({ success: true, calendarDate });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "保存计算基准日失败" },
      { status: 400 },
    );
  }
}
