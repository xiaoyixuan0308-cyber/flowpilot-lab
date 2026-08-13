import { NextRequest, NextResponse } from "next/server";
import { runMonthlyUpnSplit } from "@/server/services/calc/monthly-upn-split";
import { CalculationInputError } from "@/server/services/calc/calculation-input-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { periodMonth } = body;

    if (!periodMonth) {
      return NextResponse.json({ error: "缺少计算月份 periodMonth" }, { status: 400 });
    }

    return NextResponse.json(await runMonthlyUpnSplit(periodMonth));
  } catch (error) {
    console.error("SKU拆分计算失败:", error);
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
