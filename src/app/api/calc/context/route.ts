import { NextRequest, NextResponse } from "next/server";
import { resolveWeeklyCalculationContext } from "@/server/repositories";

export async function GET(request: NextRequest) {
  const calendarDate = request.nextUrl.searchParams.get("calendarDate")?.trim();
  if (!calendarDate) {
    return NextResponse.json({ error: "缺少计算基准日 calendarDate" }, { status: 400 });
  }

  try {
    return NextResponse.json(await resolveWeeklyCalculationContext(calendarDate));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "无法解析计算上下文" },
      { status: 422 }
    );
  }
}
