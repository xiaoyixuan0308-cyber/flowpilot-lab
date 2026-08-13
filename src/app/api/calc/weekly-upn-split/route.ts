import { NextRequest, NextResponse } from "next/server";
import { runAndPersistWeeklyUpnSplit } from "@/server/services/calc/weekly-upn-split";
import { CalculationInputError } from "@/server/services/calc/calculation-input-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendarDate } = body;

    if (!calendarDate) {
      return NextResponse.json({ error: "缺少周拆分日期 calendarDate" }, { status: 400 });
    }

    const result = await runAndPersistWeeklyUpnSplit({ calendarDate });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error("周拆分第一阶段计算失败:", error);
    if (error instanceof CalculationInputError) {
      return NextResponse.json(
        { error: error.message, code: error.code, issues: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "计算失败" },
      { status: 500 }
    );
  }
}
