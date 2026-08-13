import { NextRequest, NextResponse } from "next/server";
import { runUnifiedCalculation } from "@/server/services/calc/run-unified-calculation.service";
import { CalculationInputError } from "@/server/services/calc/calculation-input-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { calendarDate } = body;

    if (!calendarDate) {
      return NextResponse.json({ error: "缺少计算基准日 calendarDate" }, { status: 400 });
    }

    return NextResponse.json(await runUnifiedCalculation(calendarDate));
  } catch (error) {
    console.error("统一计算失败:", error);
    if (error instanceof CalculationInputError) {
      return NextResponse.json(
        { error: error.message, code: error.code, issues: error.issues },
        { status: 422 },
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "统一计算失败" },
      { status: 500 },
    );
  }
}
